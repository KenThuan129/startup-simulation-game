import { SkillData, SkillEffects } from '../types';
import { SkillDataLoader } from '../data/skill-loader';

export class SkillSystem {
  static async getSkill(skillId: string): Promise<SkillData | null> {
    return SkillDataLoader.getSkill(skillId);
  }

  static async getAllSkills(): Promise<SkillData[]> {
    return SkillDataLoader.getAllSkills();
  }

  static async calculateMultipliers(skills: Record<string, number>): Promise<{
    revenueMultiplier: number;
    viralityBonus: number;
    conversionBonus: number;
    costReduction: number;
    eventOutcomeBonus: number;
    qualityGainBonus: number;
    hypeBonus: number;
    burnReduction: number;
    outageReduction: number;
  }> {
    let revenueMultiplier = 1.0;
    let viralityBonus = 0;
    let conversionBonus = 0;
    let costReduction = 0;
    let eventOutcomeBonus = 0;
    let qualityGainBonus = 0;
    let hypeBonus = 0;
    let burnReduction = 0;
    let outageReduction = 0;

    // Aggregate skill effects by tree
    for (const [skillId, level] of Object.entries(skills)) {
      const skill = await this.getSkill(skillId);
      if (skill && skill.effects) {
        // Product skills
        if (skill.tree === 'product') {
          qualityGainBonus += 0.005 * level; // +0.5% quality gain per level
          costReduction += 0.03 * level; // 3% cost reduction per level
        }
        
        // Marketing skills
        if (skill.tree === 'marketing') {
          hypeBonus += 0.02 * level; // +2% hype bonus per level
          viralityBonus += skill.effects.viralityBonus ? skill.effects.viralityBonus * level : 0;
          costReduction += 0.05 * level; // 5% marketing cost reduction per level
        }
        
        // Finance skills
        if (skill.tree === 'finance') {
          burnReduction += 0.02 * level; // 2% burn reduction per level
          // Loan negotiation bonus (lower interest) handled separately
        }
        
        // Tech skills
        if (skill.tree === 'technology') {
          costReduction += 0.05 * level; // 5% infra cost reduction per level
          outageReduction += 0.02 * level; // 2% outage chance reduction per level
        }

        // General effects
        if (skill.effects.revenueMultiplier) {
          revenueMultiplier *= 1 + (skill.effects.revenueMultiplier * level);
        }
        if (skill.effects.viralityBonus && skill.tree !== 'marketing') {
          viralityBonus += skill.effects.viralityBonus * level;
        }
        if (skill.effects.conversionBonus) {
          conversionBonus += skill.effects.conversionBonus * level;
        }
        if (skill.effects.costReduction && skill.tree !== 'product' && skill.tree !== 'marketing' && skill.tree !== 'technology') {
          costReduction += skill.effects.costReduction * level;
        }
        if (skill.effects.eventOutcomeBonus) {
          eventOutcomeBonus += skill.effects.eventOutcomeBonus * level;
        }
      }
    }

    return {
      revenueMultiplier,
      viralityBonus,
      conversionBonus,
      costReduction,
      eventOutcomeBonus,
      qualityGainBonus,
      hypeBonus,
      burnReduction,
      outageReduction,
    };
  }

  static canUpgradeSkill(
    currentLevel: number,
    maxLevel: number,
    skillPoints: number
  ): boolean {
    return currentLevel < maxLevel && skillPoints > 0;
  }

  static upgradeSkill(
    currentLevel: number,
    skillPoints: number
  ): { newLevel: number; remainingPoints: number } {
    if (skillPoints <= 0) return { newLevel: currentLevel, remainingPoints: skillPoints };
    return { newLevel: currentLevel + 1, remainingPoints: skillPoints - 1 };
  }
}

