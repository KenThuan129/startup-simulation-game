import { Company, BossBattle } from '../../db/types';
import { DatabaseQueries } from '../../db/queries';
import { BossTemplate, BossMove } from './boss-templates';
import { randomUUID } from 'crypto';
import { CompanyState } from '../state/company-state';

export interface BossActionResult {
  success: boolean;
  damageDealt?: number;
  damageTaken?: number;
  message: string;
  company: Company;
  battle: BossBattle;
}

export class BossEngine {
  /**
   * Initialize or retrieve boss battle for a company
   */
  static async getOrCreateBossBattle(company: Company): Promise<BossBattle | null> {
    // Check if boss fight day
    if (company.day !== 45) return null;

    // Check if already beaten
    const existingBattle = await DatabaseQueries.getBossBattle(company.companyId);
    if (existingBattle && existingBattle.status === 'won') {
      return null; // Already won, don't create new battle
    }

    if (existingBattle && existingBattle.status === 'active') {
      return existingBattle; // Return existing active battle
    }

    // Create new boss battle
    const template = BossTemplate.getTemplate(company.difficulty, company.type);
    const battle: Omit<BossBattle, 'createdAt' | 'updatedAt'> = {
      battleId: randomUUID(),
      companyId: company.companyId,
      bossName: template.name,
      bossHealth: template.maxHealth,
      maxHealth: template.maxHealth,
      currentTurn: 1,
      playerHealth: this.calculatePlayerHealth(company),
      status: 'active',
      attackPattern: this.generateAttackPattern(template),
    };

    return DatabaseQueries.createBossBattle(battle);
  }

  /**
   * Execute player action in boss battle
   */
  static async executePlayerAction(
    company: Company,
    actionType: 'attack' | 'defend' | 'special',
    specialCost?: { xp?: number; cash?: number }
  ): Promise<BossActionResult> {
    const battle = await DatabaseQueries.getBossBattle(company.companyId);
    if (!battle || battle.status !== 'active') {
      throw new Error('No active boss battle found.');
    }

    // Check if action is valid
    if (actionType === 'special') {
      if (specialCost?.xp && company.xp < specialCost.xp) {
        throw new Error(`Insufficient XP. Need ${specialCost.xp}, have ${company.xp}.`);
      }
      if (specialCost?.cash && company.cash < specialCost.cash) {
        throw new Error(`Insufficient cash. Need $${specialCost.cash}, have $${company.cash}.`);
      }
    }

    let updatedCompany = { ...company };
    let updatedBattle = { ...battle };

    // Apply player action
    const playerResult = this.processPlayerAction(updatedCompany, actionType, specialCost);
    updatedCompany = playerResult.company;
    const playerDamage = playerResult.damage;

    // Apply damage to boss
    updatedBattle.bossHealth = Math.max(0, updatedBattle.bossHealth - playerDamage);
    updatedBattle.lastPlayerMove = actionType;

    let bossMove: BossMove | null = null;
    let bossDamage = 0;

    // Check win condition
    if (updatedBattle.bossHealth <= 0) {
      updatedBattle.status = 'won';
      const rewards = this.calculateRewards(updatedCompany, updatedBattle);
      updatedBattle.rewards = rewards;
      updatedCompany = this.applyRewards(updatedCompany, rewards);
    } else {
      // Boss responds
      bossMove = this.getBossMove(updatedBattle, updatedCompany);
      const bossResult = this.processBossMove(updatedCompany, bossMove);
      updatedCompany = bossResult.company;
      bossDamage = bossResult.damage;
      updatedBattle.lastBossMove = bossMove.moveId;
      updatedBattle.playerHealth = this.calculatePlayerHealth(updatedCompany);

      // Check lose condition
      if (updatedCompany.cash < 0 || updatedCompany.users <= 0) {
        updatedBattle.status = 'lost';
        updatedCompany.alive = false;
      } else {
        updatedBattle.currentTurn += 1;
        updatedBattle.turnTimeout = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h timeout
      }
    }

    updatedBattle.updatedAt = new Date().toISOString();
    await DatabaseQueries.updateBossBattle(updatedBattle.battleId, updatedBattle);
    await DatabaseQueries.updateCompany(company.companyId, updatedCompany);

    return {
      success: true,
      damageDealt: playerDamage,
      damageTaken: bossDamage,
      message: bossMove ? this.generateTurnMessage(actionType, playerDamage, bossMove, bossDamage) : `You dealt ${playerDamage} damage! Boss defeated!`,
      company: updatedCompany,
      battle: updatedBattle,
    };
  }

  private static processPlayerAction(
    company: Company,
    actionType: 'attack' | 'defend' | 'special',
    specialCost?: { xp?: number; cash?: number }
  ): { company: Company; damage: number } {
    let updated = { ...company };
    let damage = 0;

    switch (actionType) {
      case 'attack':
        // Attack costs cash but deals damage
        const attackCost = 500;
        updated.cash = Math.max(0, updated.cash - attackCost);
        damage = 15 + Math.floor(company.quality / 10); // Quality-based damage
        break;

      case 'defend':
        // Defense costs cash, reduces incoming damage, slight counter
        const defendCost = 300;
        updated.cash = Math.max(0, updated.cash - defendCost);
        damage = 5; // Small counter damage
        // Defense bonus applied in boss move processing
        break;

      case 'special':
        // Special attack: high damage, costs XP or cash
        if (specialCost?.xp) {
          updated.xp = Math.max(0, updated.xp - specialCost.xp);
          damage = 30 + Math.floor(company.quality / 5);
        } else if (specialCost?.cash) {
          updated.cash = Math.max(0, updated.cash - specialCost.cash);
          damage = 25 + Math.floor(company.users / 100);
        }
        break;
    }

    return { company: updated, damage };
  }

  private static processBossMove(company: Company, move: BossMove): { company: Company; damage: number } {
    let updated = { ...company };
    let damage = 0;

    // Apply boss move effects
    if (move.effects.cash) {
      updated.cash = Math.max(0, updated.cash + move.effects.cash);
      if (move.effects.cash < 0) damage += Math.abs(move.effects.cash) / 100;
    }
    if (move.effects.users) {
      updated.users = Math.max(0, updated.users + move.effects.users);
      if (move.effects.users < 0) damage += Math.abs(move.effects.users) / 10;
    }
    if (move.effects.quality) {
      updated.quality = Math.max(0, Math.min(100, updated.quality + move.effects.quality));
    }
    if (move.effects.hype) {
      updated.hype = Math.max(0, Math.min(100, updated.hype + move.effects.hype));
    }

    return { company: updated, damage: Math.floor(damage) };
  }

  private static getBossMove(battle: BossBattle, company: Company): BossMove {
    const template = BossTemplate.getTemplate(company.difficulty, company.type);
    const patternIndex = (battle.currentTurn - 1) % battle.attackPattern.length;
    const moveId = battle.attackPattern[patternIndex];
    const move = template.moves.find(m => m.moveId === moveId) || template.moves[0];
    return move;
  }

  private static generateAttackPattern(template: BossTemplate): string[] {
    // Generate deterministic but varied attack pattern
    const pattern: string[] = [];
    const attackMoves = template.moves.filter(m => m.type === 'attack');
    const sabotageMoves = template.moves.filter(m => m.type === 'sabotage');

    // Mix of attacks and sabotages
    for (let i = 0; i < 10; i++) {
      if (i % 3 === 0 && sabotageMoves.length > 0) {
        pattern.push(sabotageMoves[Math.floor(Math.random() * sabotageMoves.length)].moveId);
      } else {
        pattern.push(attackMoves[Math.floor(Math.random() * attackMoves.length)].moveId);
      }
    }

    return pattern;
  }

  private static calculatePlayerHealth(company: Company): number {
    // Player health = cash/1000 + users/10 (proxy for company strength)
    return Math.floor(company.cash / 1000) + Math.floor(company.users / 10);
  }

  private static calculateRewards(company: Company, battle: BossBattle): BossBattle['rewards'] {
    return {
      cash: 50000 + (company.difficulty === 'hard' ? 25000 : 0),
      investors: ['Black Hole Ventures', 'Strategic Capital Partners'],
      qualityBoost: 10,
      skillPoints: 5,
    };
  }

  private static applyRewards(company: Company, rewards: BossBattle['rewards']): Company {
    let updated = { ...company };
    if (rewards?.cash) updated.cash += rewards.cash;
    if (rewards?.investors) updated.investors = [...(updated.investors || []), ...rewards.investors];
    if (rewards?.qualityBoost) updated.quality = Math.min(100, updated.quality + rewards.qualityBoost);
    if (rewards?.skillPoints) updated.skillPoints += rewards.skillPoints;
    return updated;
  }

  private static generateTurnMessage(
    playerAction: string,
    playerDamage: number,
    bossMove: BossMove,
    bossDamage: number
  ): string {
    return `**Your ${playerAction}** dealt ${playerDamage} damage!\n\n**Boss ${bossMove.name}**: ${bossMove.description}\nYou took ${bossDamage} damage.`;
  }
}

