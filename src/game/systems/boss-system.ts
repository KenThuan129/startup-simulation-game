import { Company } from '../../db/types';
import { gameConfig } from '../../config/bot.config';

export interface BossAction {
  actionId: string;
  type: 'attack' | 'defense';
  name: string;
  description: string;
  effects: {
    cash?: number;
    users?: number;
    hype?: number;
    quality?: number;
  };
}

export class BossSystem {
  static isBossFightDay(day: number): boolean {
    return day === gameConfig.bossFightDay;
  }

  static generateBossActions(): BossAction[] {
    return [
      {
        actionId: 'boss_attack_1',
        type: 'attack',
        name: 'Aggressive Marketing Blitz',
        description: 'The competitor launches a massive marketing campaign targeting your users.',
        effects: { users: -50, hype: -10 },
      },
      {
        actionId: 'boss_attack_2',
        type: 'attack',
        name: 'Price War',
        description: 'The competitor slashes prices, forcing you to match or lose customers.',
        effects: { cash: -2000, users: -30 },
      },
      {
        actionId: 'boss_defense_1',
        type: 'defense',
        name: 'Counter-Marketing Campaign',
        description: 'Launch your own marketing campaign to retain users.',
        effects: { cash: -1500, users: 20, hype: 5 },
      },
      {
        actionId: 'boss_defense_2',
        type: 'defense',
        name: 'Focus on Quality',
        description: 'Double down on product quality to differentiate.',
        effects: { cash: -1000, quality: 10 },
      },
    ];
  }

  static processBossAction(
    company: Company,
    action: BossAction
  ): Company {
    const updated = { ...company };

    if (action.effects.cash) {
      updated.cash = Math.max(0, updated.cash + action.effects.cash);
    }

    if (action.effects.users) {
      updated.users = Math.max(0, updated.users + action.effects.users);
    }

    if (action.effects.hype) {
      updated.hype = Math.max(0, Math.min(100, updated.hype + action.effects.hype));
    }

    return updated;
  }

  static checkBossVictory(company: Company): boolean {
    // Win condition: survive with positive cash and users
    return company.cash > 0 && company.users > 0;
  }

  static checkBossDefeat(company: Company): boolean {
    // Lose condition: cash or users hit zero
    return company.cash <= 0 || company.users <= 0;
  }
}

