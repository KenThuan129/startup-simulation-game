import { Company, Goal } from '../../db/types';

export class GoalSystem {
  static evaluateGoal(company: Company, goal: Goal): Goal {
    let progress = 0;
    let completed = false;

    switch (goal.goalType) {
      case 'reach_users':
        progress = company.users;
        completed = company.users >= goal.targetValue;
        break;
      case 'reach_cash':
        progress = company.cash;
        completed = company.cash >= goal.targetValue;
        break;
      case 'reach_quality':
        progress = company.quality;
        completed = company.quality >= goal.targetValue;
        break;
      case 'reach_hype':
        progress = company.hype;
        completed = company.hype >= goal.targetValue;
        break;
      case 'reach_virality':
        progress = company.virality;
        completed = company.virality >= goal.targetValue;
        break;
      case 'reach_daily_revenue':
        // Calculate daily revenue (simplified - would use formulas in production)
        const dailyRev = company.users * 0.3; // Approximate
        progress = dailyRev;
        completed = dailyRev >= goal.targetValue;
        break;
      case 'reach_skill_level':
        const totalSkillLevels = Object.values(company.skills).reduce((a, b) => a + b, 0);
        progress = totalSkillLevels;
        completed = totalSkillLevels >= goal.targetValue;
        break;
      case 'survive_days':
        progress = company.day;
        completed = company.day >= goal.targetValue;
        break;
    }

    return {
      ...goal,
      progress,
      completed: completed || goal.completed, // Once completed, stay completed
    };
  }

  static evaluateAllGoals(company: Company): Goal[] {
    return company.goals.map(goal => this.evaluateGoal(company, goal));
  }

  static getGoalProgressText(goal: Goal): string {
    const percentage = Math.min(100, Math.floor((goal.progress / goal.targetValue) * 100));
    return `${goal.progress}/${goal.targetValue} (${percentage}%)`;
  }
}

