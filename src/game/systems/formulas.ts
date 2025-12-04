import { Company } from '../../db/types';
import { DifficultyConfig, getDifficultyConfig } from '../../config/difficulty';
import { SkillSystem } from './skill-system';

export interface SkillMultipliers {
  revenueMultiplier: number;
  viralityBonus: number;
  conversionBonus: number;
  costReduction: number;
  eventOutcomeBonus: number;
  qualityGainBonus: number; // Product skills
  hypeBonus: number; // Marketing skills
  burnReduction: number; // Finance skills
  outageReduction: number; // Tech skills
}

export class Formulas {
  /**
   * Compute revenue per user based on quality
   * Higher quality = higher revenue per user
   */
  static computeRevenuePerUser(quality: number): number {
    // Base: $0.30 per user, scales with quality (0-100)
    // At quality 50: $0.30, at quality 100: $0.60
    return 0.20 + (quality / 100) * 0.40;
  }

  /**
   * Compute daily revenue
   */
  static async computeDailyRevenue(
    users: number,
    quality: number,
    skillMultipliers: SkillMultipliers,
    loanRevMultiplier?: number
  ): Promise<number> {
    const revPerUser = this.computeRevenuePerUser(quality);
    let baseRevenue = users * revPerUser;
    
    // Apply skill multipliers
    baseRevenue *= skillMultipliers.revenueMultiplier;
    
    // Apply loan sacrifice effects (if active)
    if (loanRevMultiplier) {
      baseRevenue *= loanRevMultiplier;
    }
    
    return baseRevenue;
  }

  /**
   * Compute retention rate based on quality
   */
  static computeRetention(quality: number, difficultyConfig: DifficultyConfig): number {
    // Base retention: 70% at quality 0, 95% at quality 100
    const baseRetention = 0.70 + (quality / 100) * 0.25;
    return Math.min(0.98, Math.max(0.50, baseRetention + difficultyConfig.retentionBonus));
  }

  /**
   * Compute churn rate
   */
  static computeChurn(quality: number, difficultyConfig: DifficultyConfig): number {
    const retention = this.computeRetention(quality, difficultyConfig);
    const churn = 1 - retention;
    return Math.max(0, churn + difficultyConfig.churnPenalty);
  }

  /**
   * Compute daily burn rate
   */
  static async computeDailyBurn(
    company: Company,
    difficultyConfig: DifficultyConfig,
    skillMultipliers: SkillMultipliers
  ): Promise<number> {
    // Base burn + per-user cost
    const baseBurn = 100 + (company.users * 0.08); // Base $100 + $0.08 per user
    const totalBurn = baseBurn * difficultyConfig.burnMultiplier;
    
    // Apply skill-based reductions (Finance skills reduce burn, Product skills reduce quality-related costs)
    const skillReduction = skillMultipliers.costReduction + skillMultipliers.burnReduction;
    return totalBurn * (1 - skillReduction);
  }

  /**
   * Apply virality decay
   */
  static applyViralityDecay(virality: number): number {
    // 3% decay per day
    return Math.max(0, virality * 0.97);
  }

  /**
   * Calculate virality based on hype and user growth
   * Virality increases when:
   * - Hype is high (>50%)
   * - User growth rate is positive
   * - User base is growing
   */
  static calculateViralityFromStats(
    currentVirality: number,
    hype: number,
    userGrowthRate: number, // Percentage change in users
    currentUsers: number
  ): number {
    let newVirality = currentVirality;
    
    // Base virality gain from hype (scaled)
    // High hype (>50%) contributes to virality
    if (hype > 50) {
      const hypeContribution = ((hype - 50) / 50) * 0.5; // Up to 0.5% per day at 100% hype
      newVirality += hypeContribution;
    }
    
    // User growth rate contribution
    // Positive growth increases virality
    if (userGrowthRate > 0) {
      const growthContribution = Math.min(userGrowthRate * 0.1, 2.0); // Up to 2% per day
      newVirality += growthContribution;
    }
    
    // User base size bonus (larger user base = more word-of-mouth potential)
    if (currentUsers > 1000) {
      const sizeBonus = Math.min((currentUsers - 1000) / 10000, 1.0) * 0.3; // Up to 0.3% bonus
      newVirality += sizeBonus;
    }
    
    // Apply decay
    newVirality = this.applyViralityDecay(newVirality);
    
    // Cap at 100%
    return Math.min(100, Math.max(0, newVirality));
  }

  /**
   * Apply hype decay
   */
  static applyHypeDecay(hype: number): number {
    // 5% decay per day
    return Math.max(0, hype * 0.95);
  }

  /**
   * Compute viral growth chance and effect
   */
  static async computeViralGrowth(
    company: Company,
    skillMultipliers: SkillMultipliers
  ): Promise<{ newUsers: number; hypeGain: number } | null> {
    // Need minimum hype for virality (reduced by marketing skills)
    const minHype = Math.max(20, 30 - (skillMultipliers.hypeBonus * 10));
    if (company.hype < minHype) return null;

    // Marketing skills boost virality chance
    const baseChance = company.hype / 100;
    const viralityChance = baseChance * (1 + skillMultipliers.viralityBonus + skillMultipliers.hypeBonus);
    
    if (Math.random() < viralityChance) {
      const growthMultiplier = (company.hype / 50) * (1 + skillMultipliers.hypeBonus);
      const newUsers = Math.floor(company.users * 0.12 * growthMultiplier);
      const hypeGain = Math.min(10, growthMultiplier * 2 * (1 + skillMultipliers.hypeBonus));
      return { newUsers, hypeGain };
    }

    return null;
  }

  /**
   * Compute hype bonus effects
   */
  static computeHypeBonus(hype: number): {
    userAcquisitionBonus: number;
    retentionBonus: number;
  } {
    // Hype provides bonuses to user acquisition and retention
    const hypeFactor = hype / 100;
    return {
      userAcquisitionBonus: hypeFactor * 0.15, // Up to 15% bonus
      retentionBonus: hypeFactor * 0.05, // Up to 5% retention bonus
    };
  }

  /**
   * Check bankruptcy condition
   */
  static checkBankruptcy(
    company: Company,
    dailyBurn: number,
    difficultyConfig: DifficultyConfig,
    hasLoanLifeline: boolean
  ): boolean {
    // Minimum user floor
    if (company.users < 5) {
      return true; // Too few users = failure
    }

    // Bankruptcy: negative cash AND (prolonged negative runway OR lifeline used)
    if (company.cash < 0) {
      const negativeRunway = Math.abs(company.cash) >= dailyBurn * 7; // 7 days of burn
      const severeLoss = company.cash <= -difficultyConfig.initialCash * 1.5;
      
      if (hasLoanLifeline) {
        // With lifeline, need severe conditions
        return severeLoss || (negativeRunway && company.cash < -difficultyConfig.initialCash);
      } else {
        // Without lifeline, stricter conditions
        return negativeRunway || severeLoss;
      }
    }

    return false;
  }

  /**
   * Get minimum users floor
   */
  static getMinimumUsers(): number {
    return 5;
  }
}

