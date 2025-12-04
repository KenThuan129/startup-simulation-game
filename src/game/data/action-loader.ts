import { ActionData, ActionCategory } from '../types';
import actionData from './actions.json';

export class ActionDataLoader {
  private static actions: Map<string, ActionData> = new Map();
  private static initialized = false;

  static initialize(): void {
    if (this.initialized) return;

    const actions = Array.isArray(actionData) ? actionData : [];
    for (const action of actions) {
      // Type assertion for JSON data
      this.actions.set(action.actionId, action as ActionData);
    }

    this.initialized = true;
  }

  static getAction(actionId: string): ActionData | null {
    this.initialize();
    return this.actions.get(actionId) || null;
  }

  static async getActionsByCategory(category: string): Promise<ActionData[]> {
    this.initialize();
    return Array.from(this.actions.values()).filter(a => a.category === category);
  }

  static async getAllActions(): Promise<ActionData[]> {
    this.initialize();
    return Array.from(this.actions.values());
  }
}

