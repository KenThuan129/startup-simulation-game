import { Difficulty } from '../game/types';

export interface DifficultyConfig {
  actionLimit: number;
  retentionBonus: number;
  churnPenalty: number;
  burnMultiplier: number;
  positiveEventBias: number; // Percentage increase for positive outcomes
  baseBurn: number;
  initialCash: number;
}

export const difficultyConfigs: Record<Difficulty, DifficultyConfig> = {
  easy: {
    actionLimit: 5,
    retentionBonus: 0.05, // +5% retention
    churnPenalty: -0.02, // -2% churn
    burnMultiplier: 0.9, // 10% lower burn rate
    positiveEventBias: 0.20, // +20% positive event chance
    baseBurn: 80,
    initialCash: 15000,
  },
  normal: {
    actionLimit: 4,
    retentionBonus: 0,
    churnPenalty: 0,
    burnMultiplier: 1.0,
    positiveEventBias: 0,
    baseBurn: 100,
    initialCash: 10000,
  },
  hard: {
    actionLimit: 3,
    retentionBonus: -0.05, // -5% retention
    churnPenalty: 0.02, // +2% churn
    burnMultiplier: 1.15, // 15% higher burn rate
    positiveEventBias: -0.10, // -10% positive event chance
    baseBurn: 120,
    initialCash: 8000,
  },
  another_story: {
    actionLimit: 3,
    retentionBonus: -0.08, // -8% retention
    churnPenalty: 0.03, // +3% churn
    burnMultiplier: 1.25, // 25% higher burn rate
    positiveEventBias: -0.15, // -15% positive event chance
    baseBurn: 140,
    initialCash: 6000,
  },
};

export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return difficultyConfigs[difficulty];
}

