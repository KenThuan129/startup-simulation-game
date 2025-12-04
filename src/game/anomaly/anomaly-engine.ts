import { Company, AnomalyLog } from '../../db/types';
import { AnomalyData, ActionCategory } from '../types';
import { AnomalyDataLoader } from '../data/anomaly-loader';
import { DatabaseQueries } from '../../db/queries';
import { CompanyState } from '../state/company-state';
import { gameConfig } from '../../config/bot.config';

export interface AnomalyActivation {
  anomaly: AnomalyData;
  effects: {
    modifiesActionWeights?: {
      category: ActionCategory;
      criticalSuccessBonus?: number;
      successBonus?: number;
    };
    locksAction?: string; // Action ID to lock
    spawnsSpecialEvent?: boolean;
  };
}

export class AnomalyEngine {
  /**
   * Roll for daily anomalies at start of day
   */
  static async rollDailyAnomalies(company: Company): Promise<AnomalyActivation[]> {
    const activations: AnomalyActivation[] = [];
    const roll = Math.random();

    // 20-30% chance per day
    const anomalyChance = gameConfig.anomalyChance;
    if (roll < anomalyChance) {
      const anomaly = await this.selectAnomaly(company);
      if (anomaly) {
        activations.push({
          anomaly,
          effects: this.parseAnomalyEffects(anomaly),
        });

        // Log anomaly
        await DatabaseQueries.createAnomalyLog({
          companyId: company.companyId,
          anomalyId: anomaly.anomalyId,
          day: company.day,
          effects: anomaly.effects,
        });
      }
    }

    return activations;
  }

  /**
   * Select appropriate anomaly based on company state and context
   */
  private static async selectAnomaly(company: Company): Promise<AnomalyData | null> {
    const allAnomalies = await AnomalyDataLoader.getAllAnomalies();
    
    // Weight anomalies by relevance
    const weighted: { anomaly: AnomalyData; weight: number }[] = [];
    
    for (const anomaly of allAnomalies) {
      let weight = 1.0;
      
      // Boost weight if triggers match company type or recent actions
      if (anomaly.triggers && anomaly.triggers.length > 0) {
        // Check if triggers match company type
        if (anomaly.triggers.includes(company.type)) {
          weight *= 1.5;
        }
      }
      
      // Penalize if anomaly would kill company
      if (anomaly.effects.cash && company.cash + anomaly.effects.cash < 0) {
        weight *= 0.3; // Reduce chance of fatal anomalies
      }
      
      weighted.push({ anomaly, weight });
    }
    
    // Select based on weights
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const { anomaly, weight } of weighted) {
      random -= weight;
      if (random <= 0) {
        return anomaly;
      }
    }
    
    return weighted[0]?.anomaly || null;
  }

  /**
   * Parse anomaly effects to determine special behaviors
   */
  private static parseAnomalyEffects(anomaly: AnomalyData): AnomalyActivation['effects'] {
    const effects: AnomalyActivation['effects'] = {};
    
    // Check flags for special behaviors
    if (anomaly.flags) {
      if (anomaly.flags.includes('modify_marketing')) {
        effects.modifiesActionWeights = {
          category: 'marketing',
          criticalSuccessBonus: 0.2,
          successBonus: 0.15,
        };
      }
      if (anomaly.flags.includes('lock_action')) {
        // Lock a random action category for the day
        effects.locksAction = 'random'; // Special marker
      }
      if (anomaly.flags.includes('special_event')) {
        effects.spawnsSpecialEvent = true;
      }
    }
    
    return effects;
  }

  /**
   * Apply anomaly activation to company
   */
  static async applyAnomalyActivation(
    company: Company,
    activation: AnomalyActivation
  ): Promise<Company> {
    return CompanyState.applyOutcome(company, activation.anomaly.effects);
  }

  /**
   * Check if action is locked by active anomaly
   */
  static async isActionLocked(company: Company, actionId: string): Promise<boolean> {
    // Check recent anomaly logs for lock effects
    // This would require querying anomalies_log table
    // For now, simplified check
    return false;
  }

  /**
   * Get modified action weights from active anomalies
   */
  static async getModifiedActionWeights(
    company: Company,
    category: ActionCategory
  ): Promise<{ criticalSuccessBonus?: number; successBonus?: number }> {
    // Check recent anomalies for weight modifications
    // Simplified for now
    return {};
  }
}

