import { AnomalyData, OutcomeEffects } from '../types';
import { Company } from '../../db/types';
import { gameConfig } from '../../config/bot.config';
import { AnomalyDataLoader } from '../data/anomaly-loader';
import { CompanyState } from '../state/company-state';

export class AnomalySystem {
  static shouldTriggerAnomaly(): boolean {
    return Math.random() < gameConfig.anomalyChance;
  }

  static async generateAnomaly(
    company: Company,
    context?: string[]
  ): Promise<AnomalyData | null> {
    if (!this.shouldTriggerAnomaly()) return null;

    const anomalies = await AnomalyDataLoader.getAllAnomalies();
    const filtered = context
      ? anomalies.filter(a => 
          !a.triggers || a.triggers.some(t => context.includes(t))
        )
      : anomalies;

    if (filtered.length === 0) return null;

    const selected = filtered[Math.floor(Math.random() * filtered.length)];
    return selected;
  }

  static async applyAnomaly(
    company: Company,
    anomaly: AnomalyData
  ): Promise<Company> {
    return CompanyState.applyOutcome(company, anomaly.effects);
  }
}

