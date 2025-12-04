import { Company, DailyAction, PendingEvent } from '../../db/types';
import { OutcomeEffects } from '../types';
import { LevelSystem } from '../systems/level-system';
import { RoleSystem } from '../systems/role-system';
import { BroadcastSystem } from '../systems/broadcast-system';

export class CompanyState {
  static applyOutcome(company: Company, effects: OutcomeEffects): Company {
    const updated = { ...company };

    if (effects.cash !== undefined) {
      updated.cash = Math.max(0, updated.cash + effects.cash);
    }

    if (effects.users !== undefined) {
      updated.users = Math.max(0, updated.users + effects.users);
    }

    if (effects.hype !== undefined) {
      updated.hype = Math.max(0, Math.min(100, updated.hype + effects.hype));
    }

    if (effects.quality !== undefined) {
      updated.quality = Math.max(0, Math.min(100, updated.quality + effects.quality));
    }

    if (effects.xp !== undefined) {
      const oldXP = updated.xp;
      const oldLevel = updated.level;
      
      // Apply role XP multiplier
      let xpGain = effects.xp;
      if (updated.role) {
        const roleXPMultiplier = RoleSystem.getXPMultiplier(updated.role);
        xpGain = Math.floor(xpGain * roleXPMultiplier);
      }
      
      // Apply broadcast XP multiplier (if action category is known, it should be passed)
      // For now, we'll apply a general multiplier if broadcast is active
      if (BroadcastSystem.isBroadcastActive(updated) && updated.broadcastId) {
        // Note: Category-specific multipliers should be applied at the action level
        // This is a fallback general multiplier
        const broadcast = BroadcastSystem.getBroadcast(updated.broadcastId);
        if (broadcast && broadcast.effects.general) {
          xpGain = Math.floor(xpGain * (broadcast.effects.general.xpMultiplier || 1.0));
        }
      }
      
      updated.xp += xpGain;
      
      // Check for level up
      const levelUpResult = LevelSystem.checkLevelUp(oldXP, updated.xp);
      
      // Recalculate level and skill points from total XP
      const levelInfo = LevelSystem.recalculateLevelAndSkillPoints(updated);
      updated.level = levelInfo.level;
      updated.skillPoints = levelInfo.availableSkillPoints;
      
      // Store level up info for notification
      if (levelUpResult.leveledUp) {
        (updated as any).levelUpInfo = {
          oldLevel: levelUpResult.oldLevel,
          newLevel: levelUpResult.newLevel,
          skillPointsGained: levelUpResult.skillPointsGained,
        };
      }
    }

    if (effects.skills) {
      updated.skills = { ...updated.skills };
      for (const [skillId, points] of Object.entries(effects.skills)) {
        updated.skills[skillId] = (updated.skills[skillId] || 0) + points;
      }
    }

    return updated;
  }

  static markActionSelected(company: Company, actionId: string, actionWeight: number = 1): Company {
    const updated = { ...company };
    updated.dailyActions = updated.dailyActions.map(action =>
      action.actionId === actionId ? { ...action, selected: true } : action
    );
    updated.actionPointsRemaining = Math.max(0, updated.actionPointsRemaining - actionWeight);
    return updated;
  }

  static addPendingEvent(company: Company, event: PendingEvent): Company {
    const updated = { ...company };
    updated.pendingEvents = [...updated.pendingEvents, event];
    return updated;
  }

  static removePendingEvent(company: Company, eventId: string): Company {
    const updated = { ...company };
    updated.pendingEvents = updated.pendingEvents.filter(e => e.eventId !== eventId);
    return updated;
  }

  static snapshotStats(company: Company): Company {
    const updated = { ...company };
    updated.statsHistory = [
      ...updated.statsHistory,
      {
        day: company.day,
        cash: company.cash,
        users: company.users,
        quality: company.quality,
        hype: company.hype,
        virality: company.virality,
        xp: company.xp,
        level: company.level,
      },
    ];
    return updated;
  }

  static checkBankruptcy(company: Company, hasLoanLifeline: boolean): boolean {
    if (company.cash >= 0) return false;
    return !hasLoanLifeline;
  }
}

