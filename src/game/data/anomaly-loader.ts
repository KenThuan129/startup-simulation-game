import { AnomalyData } from '../types';
import anomalyData from './anomalies-enhanced.json';

export class AnomalyDataLoader {
  private static anomalies: Map<string, AnomalyData> = new Map();
  private static initialized = false;

  static initialize(): void {
    if (this.initialized) return;

    const anomalies = Array.isArray(anomalyData) ? anomalyData : [];
    for (const anomaly of anomalies) {
      this.anomalies.set(anomaly.anomalyId, anomaly);
    }

    this.initialized = true;
  }

  static getAnomaly(anomalyId: string): AnomalyData | null {
    this.initialize();
    return this.anomalies.get(anomalyId) || null;
  }

  static async getAllAnomalies(): Promise<AnomalyData[]> {
    this.initialize();
    return Array.from(this.anomalies.values());
  }
}

