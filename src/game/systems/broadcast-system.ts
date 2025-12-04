import broadcastsData from '../data/broadcasts.json';
import { Company } from '../../db/types';

export interface BroadcastData {
  broadcastId: string;
  name: string;
  description: string;
  effects: {
    [category: string]: {
      xpMultiplier?: number;
      successRateBonus?: number;
      viralityBonus?: number;
      cashBonus?: number;
    };
  };
  specialEventChance: number;
}

export interface BroadcastSpecialEvent {
  eventId: string;
  name: string;
  description: string;
  category: string;
  choices: Array<{
    choiceId: string;
    type: string;
    text: string;
    effects: any;
  }>;
}

export class BroadcastSystem {
  static readonly BROADCAST_START_DAY = 3;
  static readonly BROADCAST_DURATION = 10;

  static getAllBroadcasts(): BroadcastData[] {
    return broadcastsData.broadcasts as unknown as BroadcastData[];
  }

  static getBroadcast(broadcastId: string): BroadcastData | null {
    const broadcast = broadcastsData.broadcasts.find((b: any) => b.broadcastId === broadcastId);
    return (broadcast as unknown as BroadcastData) || null;
  }

  static getRandomBroadcast(): BroadcastData {
    const broadcasts = this.getAllBroadcasts();
    return broadcasts[Math.floor(Math.random() * broadcasts.length)];
  }

  static shouldStartBroadcast(day: number): boolean {
    return day >= this.BROADCAST_START_DAY;
  }

  static isBroadcastActive(company: Company): boolean {
    if (!company.broadcastId || !company.broadcastStartDay) {
      return false;
    }
    
    const daysSinceStart = company.day - company.broadcastStartDay;
    return daysSinceStart >= 0 && daysSinceStart < this.BROADCAST_DURATION;
  }

  static getDaysRemaining(company: Company): number {
    if (!this.isBroadcastActive(company) || !company.broadcastStartDay) {
      return 0;
    }
    
    const daysSinceStart = company.day - company.broadcastStartDay;
    return Math.max(0, this.BROADCAST_DURATION - daysSinceStart);
  }

  static checkAndStartBroadcast(company: Company): Company | null {
    // Check if we should start a new broadcast
    if (company.day === this.BROADCAST_START_DAY || 
        (company.day > this.BROADCAST_START_DAY && !this.isBroadcastActive(company))) {
      // Start a new broadcast
      const broadcast = this.getRandomBroadcast();
      return {
        ...company,
        broadcastId: broadcast.broadcastId,
        broadcastStartDay: company.day,
      };
    }
    
    return null;
  }

  static getBroadcastEffects(company: Company, category: string): {
    xpMultiplier: number;
    successRateBonus: number;
    viralityBonus: number;
    cashBonus: number;
  } {
    if (!this.isBroadcastActive(company) || !company.broadcastId) {
      return {
        xpMultiplier: 1.0,
        successRateBonus: 0,
        viralityBonus: 0,
        cashBonus: 0,
      };
    }

    const broadcast = this.getBroadcast(company.broadcastId);
    if (!broadcast) {
      return {
        xpMultiplier: 1.0,
        successRateBonus: 0,
        viralityBonus: 0,
        cashBonus: 0,
      };
    }

    const categoryEffects = broadcast.effects[category] || {};
    
    // Check for global cash bonus (it's a property of the broadcast, not in effects)
    // Note: cashBonus is not currently in the broadcast data structure, but we'll support it if added
    const globalCashBonus = 0; // Can be extended later

    return {
      xpMultiplier: categoryEffects.xpMultiplier || 1.0,
      successRateBonus: categoryEffects.successRateBonus || 0,
      viralityBonus: categoryEffects.viralityBonus || 0,
      cashBonus: globalCashBonus,
    };
  }

  static shouldTriggerSpecialEvent(company: Company): boolean {
    if (!this.isBroadcastActive(company) || !company.broadcastId) {
      return false;
    }

    const broadcast = this.getBroadcast(company.broadcastId);
    if (!broadcast) {
      return false;
    }

    return Math.random() < broadcast.specialEventChance;
  }

  static getSpecialEventsForBroadcast(broadcastId: string): BroadcastSpecialEvent[] {
    const broadcast = this.getBroadcast(broadcastId);
    if (!broadcast) {
      return [];
    }

    // Filter special events that match the broadcast theme
    const allSpecialEvents = broadcastsData.specialEvents as unknown as BroadcastSpecialEvent[];
    return allSpecialEvents.filter(event => {
      // Match events by broadcast ID prefix (e.g., "tech_boom" matches "broadcast_tech_breakthrough")
      const broadcastPrefix = broadcastId.split('_')[0];
      return event.eventId.includes(broadcastPrefix) || event.category === broadcastId.split('_')[0];
    });
  }

  static getRandomSpecialEvent(broadcastId: string): BroadcastSpecialEvent | null {
    const events = this.getSpecialEventsForBroadcast(broadcastId);
    if (events.length === 0) {
      // Fallback to any random special event
      const allEvents = broadcastsData.specialEvents as unknown as BroadcastSpecialEvent[];
      return allEvents[Math.floor(Math.random() * allEvents.length)] || null;
    }
    
    return events[Math.floor(Math.random() * events.length)] || null;
  }
}

