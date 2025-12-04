import { Company } from '../../db/types';
import { SkillSystem } from './skill-system';
import { LoanSystem } from './loan-system';
import { LoanProcessor } from '../loans/loan-processor';
import { Formulas } from './formulas';
import { GoalSystem } from './goal-system';
import { getDifficultyConfig } from '../../config/difficulty';
import { BroadcastSystem } from './broadcast-system';

export class DailyTickSystem {
  static async processDailyTick(company: Company): Promise<Company> {
    let updated = { ...company };

    // Check and start broadcast if needed
    const broadcastUpdate = BroadcastSystem.checkAndStartBroadcast(updated);
    if (broadcastUpdate) {
      updated = broadcastUpdate;
    }

    // Get difficulty config
    const difficultyConfig = getDifficultyConfig(company.difficulty);

    // Calculate skill multipliers
    const skillMultipliers = await SkillSystem.calculateMultipliers(updated.skills);

    // Get active loans for loan sacrifice effects
    const activeLoans = await LoanSystem.getActiveLoans(updated.companyId);
    const loanRevMultiplier = activeLoans.find(l => l.sacrifice?.temporaryRevMultiplier)?.sacrifice?.temporaryRevMultiplier;

    // Revenue calculation using Formulas
    const dailyRevenue = await Formulas.computeDailyRevenue(
      updated.users,
      updated.quality,
      skillMultipliers,
      loanRevMultiplier
    );
    updated.cash += dailyRevenue;

    // Burn rate using Formulas
    const dailyBurn = await Formulas.computeDailyBurn(
      updated,
      difficultyConfig,
      skillMultipliers
    );
    updated.cash -= dailyBurn;

    // Store previous users count for growth calculation
    const previousUsers = updated.users;

    // Retention & churn using Formulas
    const retentionRate = Formulas.computeRetention(updated.quality, difficultyConfig);
    const churnRate = Formulas.computeChurn(updated.quality, difficultyConfig);
    const churned = Math.floor(updated.users * churnRate);
    updated.users = Math.max(Formulas.getMinimumUsers(), updated.users - churned);

    // Apply hype bonus to retention
    const hypeBonus = Formulas.computeHypeBonus(updated.hype);
    const bonusRetention = Math.floor(updated.users * hypeBonus.retentionBonus);
    updated.users += bonusRetention;

    // Hype decay using Formulas
    updated.hype = Formulas.applyHypeDecay(updated.hype);

    // Virality using Formulas
    const viralGrowth = await Formulas.computeViralGrowth(updated, skillMultipliers);
    if (viralGrowth) {
      updated.users += viralGrowth.newUsers;
      updated.hype = Math.min(100, updated.hype + viralGrowth.hypeGain);
    }

    // Calculate user growth rate for virality calculation
    const userGrowthRate = previousUsers > 0 
      ? ((updated.users - previousUsers) / previousUsers) * 100 
      : 0;

    // Update virality based on hype, user growth, and user base size
    updated.virality = Formulas.calculateViralityFromStats(
      updated.virality,
      updated.hype,
      userGrowthRate,
      updated.users
    );

    // Process loan repayments and penalties
    updated = await LoanProcessor.processDailyLoanRepayments(updated);
    
    // Decrement loan effect duration
    updated = LoanProcessor.decrementLoanEffectDuration(updated);

    // Evaluate goals
    updated.goals = GoalSystem.evaluateAllGoals(updated);

    // Bankruptcy check using Formulas
    const hasLoanLifeline = activeLoans.length > 0 || (updated.survivalLifelineUsed ?? false);
    if (Formulas.checkBankruptcy(updated, dailyBurn, difficultyConfig, hasLoanLifeline)) {
      updated.alive = false;
    }

    return updated;
  }

  private static async processLoanPenalties(company: Company): Promise<Company> {
    const loans = await LoanSystem.getActiveLoans(company.companyId);
    let updated = { ...company };

    for (const loan of loans) {
      const daysOverdue = Math.max(0, Math.floor(
        (Date.now() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      ));

      if (daysOverdue > 0) {
        const penalty = loan.amount * 0.01 * daysOverdue; // 1% per day overdue
        updated.cash -= penalty;
      }
    }

    return updated;
  }
}

