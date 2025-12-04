/**
 * Simulation tool for tuning game balance
 * Run with: npm run simulate [difficulty] [companies] [days] [seed]
 */

import { randomUUID } from 'crypto';
import { Company } from '../src/db/types';
import { ActionSystem } from '../src/game/actions/action-system';
import { EventEngine } from '../src/game/events/event-engine';
import { CompanyState } from '../src/game/state/company-state';
import { ActionDataLoader } from '../src/game/data/action-loader';
import { EventDataLoader } from '../src/game/data/event-loader';
import { getDifficultyConfig } from '../src/config/difficulty';
import { Difficulty } from '../src/game/types';
import { Formulas } from '../src/game/systems/formulas';
import { SkillSystem } from '../src/game/systems/skill-system';

// Simple RNG with seed support
class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  randInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
}

interface SimulationResult {
  survivalRate: number;
  avgFinalCash: number;
  avgFinalUsers: number;
  avgActionsTaken: number;
  avgBankruptDay: number;
  avgFinalDay: number;
}

class Simulation {
  private rng: SeededRNG;
  private difficulty: Difficulty;
  private companies: Company[];

  constructor(difficulty: Difficulty, numCompanies: number, seed?: number) {
    this.difficulty = difficulty;
    this.rng = new SeededRNG(seed || Date.now());
    this.companies = this.createCompanies(numCompanies);
  }

  private createCompanies(count: number): Company[] {
    const difficultyConfig = getDifficultyConfig(this.difficulty);
    return Array.from({ length: count }, () => ({
      companyId: randomUUID(),
      ownerId: 'simulation',
      name: `Sim Company ${this.rng.randInt(1, 1000)}`,
      type: 'saas',
      goals: ['Grow users', 'Increase revenue'],
      difficulty: this.difficulty,
      day: 1,
      cash: difficultyConfig.initialCash,
      users: 0,
      quality: 50,
      hype: 0,
      virality: 0,
      skillPoints: 0,
      skills: {},
      xp: 0,
      dailyActions: [],
      pendingEvents: [],
      actionPointsRemaining: 0,
      loans: [],
      alive: true,
      statsHistory: [],
      inBreakUntil: null,
      loanLifelineUsed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  // Simplified daily tick for simulation (no database)
  private async processDailyTick(company: Company): Promise<Company> {
    let updated = { ...company };
    const difficultyConfig = getDifficultyConfig(company.difficulty);
    const skillMultipliers = await SkillSystem.calculateMultipliers(updated.skills);

    // Revenue
    const dailyRevenue = await Formulas.computeDailyRevenue(
      updated.users,
      updated.quality,
      skillMultipliers
    );
    updated.cash += dailyRevenue;

    // Burn rate
    const dailyBurn = await Formulas.computeDailyBurn(
      updated,
      difficultyConfig,
      skillMultipliers
    );
    updated.cash -= dailyBurn;

    // Retention & churn
    const retentionRate = Formulas.computeRetention(updated.quality, difficultyConfig);
    const churnRate = Formulas.computeChurn(updated.quality, difficultyConfig);
    const churned = Math.floor(updated.users * churnRate);
    updated.users = Math.max(Formulas.getMinimumUsers(), updated.users - churned);

    // Hype bonus
    const hypeBonus = Formulas.computeHypeBonus(updated.hype);
    const bonusRetention = Math.floor(updated.users * hypeBonus.retentionBonus);
    updated.users += bonusRetention;

    // Hype decay
    updated.hype = Formulas.applyHypeDecay(updated.hype);

    // Virality
    const viralGrowth = await Formulas.computeViralGrowth(updated, skillMultipliers);
    if (viralGrowth) {
      updated.users += viralGrowth.newUsers;
      updated.hype = Math.min(100, updated.hype + viralGrowth.hypeGain);
    }

    // Virality decay
    updated.virality = Formulas.applyViralityDecay(updated.virality);

    // Bankruptcy check (no loans in simulation)
    if (Formulas.checkBankruptcy(updated, dailyBurn, difficultyConfig, false)) {
      updated.alive = false;
    }

    return updated;
  }

  async simulateDays(maxDays: number): Promise<SimulationResult> {
    const results: {
      survived: boolean;
      finalCash: number;
      finalUsers: number;
      actionsTaken: number;
      bankruptDay: number;
      finalDay: number;
    }[] = [];

    for (let company of this.companies) {
      let actionsTaken = 0;
      let bankruptDay = 0;

      for (let day = 1; day <= maxDays && company.alive; day++) {
        company.day = day;

        // Start day - generate actions
        const dailyActions = await ActionSystem.generateDailyActionSet(company.difficulty);
        company.dailyActions = dailyActions;
        company.actionPointsRemaining = getDifficultyConfig(company.difficulty).actionLimit;

        // Take actions (simulate player choices)
        while (company.actionPointsRemaining > 0 && company.alive) {
          const availableActions = dailyActions.filter(a => !a.selected);
          if (availableActions.length === 0) break;

          const action = availableActions[Math.floor(this.rng.random() * availableActions.length)];
          const actionData = await ActionDataLoader.getAction(action.actionId);
          if (!actionData) continue;

          // Generate events
          const eventCount = this.rng.randInt(1, 3);
          const events = await EventEngine.generateEventsFromAction(
            action.actionId,
            actionData.eventPool,
            eventCount
          );

          // Choose outcome (weighted: 50% success, 30% minor, 15% major positive, 5% major negative)
          const rand = this.rng.random();
          let choiceType = 'success';
          if (rand < 0.5) choiceType = 'success';
          else if (rand < 0.65) choiceType = 'critical_success';
          else if (rand < 0.80) choiceType = 'failure';
          else choiceType = 'critical_failure';

          // Apply difficulty bias
          const difficultyConfig = getDifficultyConfig(company.difficulty);
          if (difficultyConfig.positiveEventBias > 0 && this.rng.random() < Math.abs(difficultyConfig.positiveEventBias)) {
            choiceType = this.rng.random() < 0.5 ? 'success' : 'critical_success';
          }

          // Apply choice
          for (const event of events) {
            const choice = event.choices.find(c => c.type === choiceType) || event.choices[1]; // Fallback to success
            if (choice) {
              company = CompanyState.applyOutcome(company, choice.effects);
            }
          }

          company = CompanyState.markActionSelected(company, action.actionId);
          actionsTaken++;
        }

        // Process daily tick
        company = await this.processDailyTick(company);

        if (!company.alive && bankruptDay === 0) {
          bankruptDay = day;
        }
      }

      results.push({
        survived: company.alive,
        finalCash: company.cash,
        finalUsers: company.users,
        actionsTaken,
        bankruptDay: bankruptDay || maxDays,
        finalDay: company.day,
      });
    }

    // Calculate aggregates
    const survived = results.filter(r => r.survived).length;
    const avgFinalCash = results.reduce((sum, r) => sum + r.finalCash, 0) / results.length;
    const avgFinalUsers = results.reduce((sum, r) => sum + r.finalUsers, 0) / results.length;
    const avgActionsTaken = results.reduce((sum, r) => sum + r.actionsTaken, 0) / results.length;
    const bankruptResults = results.filter(r => !r.survived);
    const avgBankruptDay = bankruptResults.length > 0
      ? bankruptResults.reduce((sum, r) => sum + r.bankruptDay, 0) / bankruptResults.length
      : 0;
    const avgFinalDay = results.reduce((sum, r) => sum + r.finalDay, 0) / results.length;

    return {
      survivalRate: survived / results.length,
      avgFinalCash,
      avgFinalUsers,
      avgActionsTaken,
      avgBankruptDay,
      avgFinalDay,
    };
  }
}

// Main execution
async function main() {
  const difficulty = (process.argv[2] as Difficulty) || 'normal';
  const numCompanies = parseInt(process.argv[3] || '100', 10);
  const maxDays = parseInt(process.argv[4] || '90', 10);
  const seed = process.argv[5] ? parseInt(process.argv[5], 10) : undefined;

  console.log(`\n🎮 Running simulation...`);
  console.log(`Difficulty: ${difficulty}`);
  console.log(`Companies: ${numCompanies}`);
  console.log(`Days: ${maxDays}`);
  if (seed) console.log(`Seed: ${seed}`);
  console.log('');

  const simulation = new Simulation(difficulty, numCompanies, seed);
  const result = await simulation.simulateDays(maxDays);

  console.log('📊 Simulation Results:');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Survival Rate:        ${(result.survivalRate * 100).toFixed(1)}%`);
  console.log(`Avg Final Cash:       $${result.avgFinalCash.toFixed(2)}`);
  console.log(`Avg Final Users:      ${result.avgFinalUsers.toFixed(0)}`);
  console.log(`Avg Actions Taken:    ${result.avgActionsTaken.toFixed(1)}`);
  console.log(`Avg Bankrupt Day:     ${result.avgBankruptDay.toFixed(1)}`);
  console.log(`Avg Final Day:        ${result.avgFinalDay.toFixed(1)}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { Simulation, SimulationResult };

