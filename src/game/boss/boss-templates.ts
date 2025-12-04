import { Difficulty } from '../types';

export interface BossMove {
  moveId: string;
  type: 'attack' | 'sabotage' | 'defense';
  name: string;
  description: string;
  effects: {
    cash?: number;
    users?: number;
    quality?: number;
    hype?: number;
  };
}

export interface BossTemplate {
  bossId: string;
  name: string;
  difficulty: Difficulty;
  category: string;
  maxHealth: number;
  moves: BossMove[];
}

export class BossTemplate {
  private static templates: Map<string, BossTemplate> = new Map();

  static initialize(): void {
    // Easy difficulty templates
    this.templates.set('easy_saas', {
      bossId: 'boss_easy_saas',
      name: 'CopyCat Inc.',
      difficulty: 'easy',
      category: 'saas',
      maxHealth: 100,
      moves: [
        {
          moveId: 'copycat_feature_copy',
          type: 'attack',
          name: 'Feature Copy',
          description: 'They copy your key feature and launch it first.',
          effects: { users: -30, hype: -10 },
        },
        {
          moveId: 'copycat_price_war',
          type: 'attack',
          name: 'Price War',
          description: 'They slash prices, forcing you to compete.',
          effects: { cash: -1500, users: -20 },
        },
        {
          moveId: 'copycat_talent_poach',
          type: 'sabotage',
          name: 'Talent Poaching',
          description: 'They poach your key developer.',
          effects: { quality: -10, cash: -500 },
        },
      ],
    });

    // Normal difficulty templates
    this.templates.set('normal_saas', {
      bossId: 'boss_normal_saas',
      name: 'TechGiant Corp',
      difficulty: 'normal',
      category: 'saas',
      maxHealth: 150,
      moves: [
        {
          moveId: 'techgiant_massive_marketing',
          type: 'attack',
          name: 'Massive Marketing Blitz',
          description: 'They launch a multi-million dollar campaign targeting your users.',
          effects: { users: -50, hype: -15, cash: -2000 },
        },
        {
          moveId: 'techgiant_api_lockout',
          type: 'sabotage',
          name: 'API Lockout',
          description: 'They block your access to critical APIs.',
          effects: { quality: -15, users: -40 },
        },
        {
          moveId: 'techgiant_acquisition_threat',
          type: 'sabotage',
          name: 'Acquisition Threat',
          description: 'They threaten to acquire your key partners.',
          effects: { cash: -3000, hype: -20 },
        },
      ],
    });

    // Hard difficulty templates
    this.templates.set('hard_saas', {
      bossId: 'boss_hard_saas',
      name: 'The Black Hole',
      difficulty: 'hard',
      category: 'saas',
      maxHealth: 200,
      moves: [
        {
          moveId: 'blackhole_viral_smear',
          type: 'attack',
          name: 'Viral Smear Campaign',
          description: 'Coordinated negative PR spreads across social media.',
          effects: { users: -80, hype: -30, cash: -5000 },
        },
        {
          moveId: 'blackhole_regulatory_push',
          type: 'sabotage',
          name: 'Regulatory Push',
          description: 'They lobby for regulations that hurt your business model.',
          effects: { cash: -8000, quality: -20 },
        },
        {
          moveId: 'blackhole_ecosystem_lock',
          type: 'sabotage',
          name: 'Ecosystem Lock',
          description: 'They lock you out of their entire platform ecosystem.',
          effects: { users: -100, quality: -25, cash: -10000 },
        },
      ],
    });

    // Another Story difficulty
    this.templates.set('another_story_saas', {
      bossId: 'boss_another_story_saas',
      name: 'The Singularity',
      difficulty: 'another_story',
      category: 'saas',
      maxHealth: 250,
      moves: [
        {
          moveId: 'singularity_ai_replacement',
          type: 'attack',
          name: 'AI Replacement Threat',
          description: 'They launch an AI that replaces your entire product category.',
          effects: { users: -150, hype: -50, cash: -15000 },
        },
        {
          moveId: 'singularity_market_collapse',
          type: 'sabotage',
          name: 'Market Collapse',
          description: 'They trigger a market-wide collapse in your sector.',
          effects: { cash: -20000, users: -200, quality: -30 },
        },
      ],
    });
  }

  static getTemplate(difficulty: Difficulty, companyType: string): BossTemplate {
    this.initialize();
    const key = `${difficulty}_${companyType}`;
    const template = this.templates.get(key);
    if (!template) {
      // Fallback to saas template
      return this.templates.get(`${difficulty}_saas`) || this.templates.get('normal_saas')!;
    }
    return template;
  }

  static getAllTemplates(): BossTemplate[] {
    this.initialize();
    return Array.from(this.templates.values());
  }
}

