import { ActionData, ActionCategory, Difficulty } from '../types';
import { DailyAction } from '../../db/types';
import { gameConfig } from '../../config/bot.config';
import { ActionDataLoader } from '../data/action-loader';

export class ActionSystem {
  static async generateDailyActions(
    category: ActionCategory,
    difficulty: Difficulty,
    count: number
  ): Promise<DailyAction[]> {
    const actions = await ActionDataLoader.getActionsByCategory(category);
    const shuffled = [...actions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    return selected.map(action => ({
      actionId: action.actionId,
      category: action.category,
      name: action.name,
      description: action.description,
      selected: false,
    }));
  }

  static async generateDailyActionSet(difficulty: Difficulty): Promise<DailyAction[]> {
    const totalActions = gameConfig.actionsPerDay[difficulty];
    const categories: ActionCategory[] = [
      'product',
      'marketing',
      'tech',
      'business_dev',
      'operations',
      'finance',
      'research',
      'high_risk',
    ];

    const allActions: DailyAction[] = [];
    const actionsPerCategory = Math.ceil(totalActions / categories.length);

    for (const category of categories) {
      const categoryActions = await this.generateDailyActions(
        category,
        difficulty,
        actionsPerCategory
      );
      allActions.push(...categoryActions);
    }

    // Shuffle and take the required amount
    const shuffled = allActions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, totalActions);
  }

  static findAction(actions: DailyAction[], actionId: string): DailyAction | null {
    return actions.find(a => a.actionId === actionId) || null;
  }

  static canSelectAction(company: { actionPointsRemaining: number }, actionWeight: number = 1): boolean {
    return company.actionPointsRemaining >= actionWeight;
  }
}

