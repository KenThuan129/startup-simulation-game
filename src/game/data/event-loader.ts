import { EventData } from '../types';
import eventData from './events.json';

export class EventDataLoader {
  private static events: Map<string, EventData> = new Map();
  private static initialized = false;

  static initialize(): void {
    if (this.initialized) return;

    const events = Array.isArray(eventData) ? eventData : [];
    for (const event of events) {
      // Type assertion for JSON data
      this.events.set(event.eventId, event as EventData);
    }

    this.initialized = true;
  }

  static getEvent(eventId: string): EventData | null {
    this.initialize();
    return this.events.get(eventId) || null;
  }

  static async getEventsByCategory(category: string): Promise<EventData[]> {
    this.initialize();
    return Array.from(this.events.values()).filter(e => e.category === category);
  }

  static async getAllEvents(): Promise<EventData[]> {
    this.initialize();
    return Array.from(this.events.values());
  }
}

