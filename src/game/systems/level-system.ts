import { Company } from '../../db/types';

/**
 * Level Progression System
 * 
 * Custom level progression from 1 to 50
 * Each level has defined XP threshold and skill points earned
 */

export class LevelSystem {
  private static readonly MAX_LEVEL = 50;
  
  // Custom level progression: [level] = { xpRequired, skillPointsEarned }
  private static readonly LEVEL_PROGRESSION: Record<number, { xpRequired: number; skillPointsEarned: number }> = {
    1: { xpRequired: 0, skillPointsEarned: 0 },
    2: { xpRequired: 100, skillPointsEarned: 1 },
    3: { xpRequired: 250, skillPointsEarned: 1 },
    4: { xpRequired: 450, skillPointsEarned: 1 },
    5: { xpRequired: 700, skillPointsEarned: 1 },
    6: { xpRequired: 1000, skillPointsEarned: 1 },
    7: { xpRequired: 1350, skillPointsEarned: 1 },
    8: { xpRequired: 1750, skillPointsEarned: 1 },
    9: { xpRequired: 2200, skillPointsEarned: 1 },
    10: { xpRequired: 2700, skillPointsEarned: 2 },
    11: { xpRequired: 3250, skillPointsEarned: 1 },
    12: { xpRequired: 3850, skillPointsEarned: 1 },
    13: { xpRequired: 4500, skillPointsEarned: 1 },
    14: { xpRequired: 5200, skillPointsEarned: 1 },
    15: { xpRequired: 5950, skillPointsEarned: 1 },
    16: { xpRequired: 6750, skillPointsEarned: 1 },
    17: { xpRequired: 7600, skillPointsEarned: 1 },
    18: { xpRequired: 8500, skillPointsEarned: 1 },
    19: { xpRequired: 9450, skillPointsEarned: 1 },
    20: { xpRequired: 10450, skillPointsEarned: 2 },
    21: { xpRequired: 11500, skillPointsEarned: 1 },
    22: { xpRequired: 12600, skillPointsEarned: 1 },
    23: { xpRequired: 13750, skillPointsEarned: 1 },
    24: { xpRequired: 14950, skillPointsEarned: 1 },
    25: { xpRequired: 16200, skillPointsEarned: 1 },
    26: { xpRequired: 17500, skillPointsEarned: 1 },
    27: { xpRequired: 18850, skillPointsEarned: 1 },
    28: { xpRequired: 20250, skillPointsEarned: 1 },
    29: { xpRequired: 21700, skillPointsEarned: 1 },
    30: { xpRequired: 23200, skillPointsEarned: 2 },
    31: { xpRequired: 24750, skillPointsEarned: 1 },
    32: { xpRequired: 26350, skillPointsEarned: 1 },
    33: { xpRequired: 28000, skillPointsEarned: 1 },
    34: { xpRequired: 29700, skillPointsEarned: 1 },
    35: { xpRequired: 31450, skillPointsEarned: 1 },
    36: { xpRequired: 33250, skillPointsEarned: 1 },
    37: { xpRequired: 35100, skillPointsEarned: 1 },
    38: { xpRequired: 37000, skillPointsEarned: 1 },
    39: { xpRequired: 38950, skillPointsEarned: 1 },
    40: { xpRequired: 40950, skillPointsEarned: 2 },
    41: { xpRequired: 43000, skillPointsEarned: 1 },
    42: { xpRequired: 45100, skillPointsEarned: 1 },
    43: { xpRequired: 47250, skillPointsEarned: 1 },
    44: { xpRequired: 49450, skillPointsEarned: 1 },
    45: { xpRequired: 51700, skillPointsEarned: 1 },
    46: { xpRequired: 54000, skillPointsEarned: 1 },
    47: { xpRequired: 56350, skillPointsEarned: 1 },
    48: { xpRequired: 58750, skillPointsEarned: 1 },
    49: { xpRequired: 61200, skillPointsEarned: 1 },
    50: { xpRequired: 63700, skillPointsEarned: 3 },
  };
  
  /**
   * Get XP required for a specific level
   */
  static getXPForLevel(level: number): number {
    if (level <= 1) return 0;
    if (level > this.MAX_LEVEL) level = this.MAX_LEVEL;
    return this.LEVEL_PROGRESSION[level]?.xpRequired || 0;
  }
  
  /**
   * Get skill points earned for reaching a specific level
   */
  static getSkillPointsForLevel(level: number): number {
    if (level <= 1) return 0;
    if (level > this.MAX_LEVEL) level = this.MAX_LEVEL;
    return this.LEVEL_PROGRESSION[level]?.skillPointsEarned || 0;
  }
  
  /**
   * Calculate level from XP
   */
  static calculateLevel(xp: number): number {
    if (xp < 0) return 1;
    
    // Find the highest level where XP requirement is met
    for (let level = this.MAX_LEVEL; level >= 1; level--) {
      const xpRequired = this.getXPForLevel(level);
      if (xp >= xpRequired) {
        return level;
      }
    }
    
    return 1;
  }
  
  /**
   * Calculate XP progress for current level
   */
  static getLevelProgress(xp: number): {
    currentLevel: number;
    xpInCurrentLevel: number;
    xpNeededForNextLevel: number;
    progressPercent: number;
  } {
    const currentLevel = this.calculateLevel(xp);
    const xpForCurrentLevel = this.getXPForLevel(currentLevel);
    const xpForNextLevel = currentLevel >= this.MAX_LEVEL 
      ? this.getXPForLevel(this.MAX_LEVEL)
      : this.getXPForLevel(currentLevel + 1);
    
    const xpInCurrentLevel = xp - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
    const progressPercent = currentLevel >= this.MAX_LEVEL 
      ? 100 
      : (xpInCurrentLevel / xpNeededForNextLevel) * 100;
    
    return {
      currentLevel,
      xpInCurrentLevel,
      xpNeededForNextLevel,
      progressPercent,
    };
  }
  
  /**
   * Calculate total skill points earned from all levels up to current level
   */
  static calculateTotalSkillPointsFromLevels(level: number): number {
    if (level <= 1) return 0;
    
    let totalSkillPoints = 0;
    for (let l = 2; l <= level; l++) {
      totalSkillPoints += this.getSkillPointsForLevel(l);
    }
    
    return totalSkillPoints;
  }
  
  /**
   * Check if company leveled up and return new level and skill points gained
   */
  static checkLevelUp(oldXP: number, newXP: number): {
    leveledUp: boolean;
    newLevel: number;
    oldLevel: number;
    skillPointsGained: number;
  } {
    const oldLevel = this.calculateLevel(oldXP);
    const newLevel = this.calculateLevel(newXP);
    const leveledUp = newLevel > oldLevel;
    
    let skillPointsGained = 0;
    if (leveledUp) {
      // Sum skill points from all levels gained
      for (let l = oldLevel + 1; l <= newLevel; l++) {
        skillPointsGained += this.getSkillPointsForLevel(l);
      }
    }
    
    return {
      leveledUp,
      newLevel,
      oldLevel,
      skillPointsGained,
    };
  }
  
  /**
   * Recalculate level and skill points for a company based on current XP
   * This ensures level is always in sync with XP
   */
  static recalculateLevelAndSkillPoints(company: Company): {
    level: number;
    totalSkillPointsEarned: number;
    availableSkillPoints: number;
  } {
    const level = this.calculateLevel(company.xp);
    const totalSkillPointsEarned = this.calculateTotalSkillPointsFromLevels(level);
    // Use skillPointsSpent instead of counting all skill levels (event-granted skills are free)
    const spentSkillPoints = company.skillPointsSpent || 0;
    const availableSkillPoints = Math.max(0, totalSkillPointsEarned - spentSkillPoints);
    
    return {
      level,
      totalSkillPointsEarned,
      availableSkillPoints,
    };
  }
  
  /**
   * Get max level
   */
  static getMaxLevel(): number {
    return this.MAX_LEVEL;
  }
}
