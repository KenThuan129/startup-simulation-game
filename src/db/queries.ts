import { supabase } from '../config/supabase.config';
import { User, Company, Loan, Goal, BossBattle, AnomalyLog } from './types';
import { LoanExamSession } from '../game/types';
import { LevelSystem } from '../game/systems/level-system';

export class DatabaseQueries {
  // User operations
  static async getUser(discordId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', discordId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapUserFromDb(data) : null;
  }

  static async createUser(discordId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        discord_id: discordId,
        active_company: null,
        unlocked_modes: [],
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapUserFromDb(data);
  }

  static async updateUser(discordId: string, updates: Partial<User>): Promise<User> {
    const dbUpdates: any = {};
    if (updates.activeCompany !== undefined) dbUpdates.active_company = updates.activeCompany;
    if (updates.unlockedModes !== undefined) dbUpdates.unlocked_modes = updates.unlockedModes;

    const { data, error } = await supabase
      .from('users')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('discord_id', discordId)
      .select()
      .single();

    if (error) throw error;
    return this.mapUserFromDb(data);
  }

  // Company operations
  static async getCompany(companyId: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapCompanyFromDb(data) : null;
  }

  static async createCompany(company: Omit<Company, 'createdAt' | 'updatedAt'>): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert(this.mapCompanyToDb(company))
      .select()
      .single();

    if (error) throw error;
    return this.mapCompanyFromDb(data);
  }

  static async updateCompany(companyId: string, updates: Partial<Company>): Promise<Company> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.day !== undefined) dbUpdates.day = updates.day;
    if (updates.cash !== undefined) dbUpdates.cash = updates.cash;
    if (updates.users !== undefined) dbUpdates.users = updates.users;
    if (updates.quality !== undefined) dbUpdates.quality = updates.quality;
    if (updates.hype !== undefined) dbUpdates.hype = updates.hype;
    if (updates.virality !== undefined) dbUpdates.virality = updates.virality;
    if (updates.skillPoints !== undefined) dbUpdates.skill_points = updates.skillPoints;
    if (updates.skillPointsSpent !== undefined) dbUpdates.skill_points_spent = updates.skillPointsSpent;
    if (updates.skills !== undefined) dbUpdates.skills = updates.skills;
    if (updates.xp !== undefined) dbUpdates.xp = updates.xp;
    if (updates.level !== undefined) dbUpdates.level = updates.level;
    if (updates.goals !== undefined) dbUpdates.goals = updates.goals; // New goal structure
    if (updates.dailyActions !== undefined) dbUpdates.daily_actions = updates.dailyActions;
    if (updates.pendingEvents !== undefined) dbUpdates.pending_events = updates.pendingEvents;
    if (updates.actionPointsRemaining !== undefined) dbUpdates.action_points_remaining = updates.actionPointsRemaining;
    if (updates.loans !== undefined) dbUpdates.loans = updates.loans;
    if (updates.alive !== undefined) dbUpdates.alive = updates.alive;
    if (updates.statsHistory !== undefined) dbUpdates.stats_history = updates.statsHistory;
    if (updates.inBreakUntil !== undefined) dbUpdates.in_break_until = updates.inBreakUntil;
    if (updates.loanLifelineUsed !== undefined) dbUpdates.loan_lifeline_used = updates.loanLifelineUsed;
    if (updates.survivalLifelineUsed !== undefined) dbUpdates.survival_lifeline_used = updates.survivalLifelineUsed;
    if (updates.loanEffectDuration !== undefined) dbUpdates.loan_effect_duration = updates.loanEffectDuration;
    if (updates.investors !== undefined) dbUpdates.investors = updates.investors;
    if (updates.mode !== undefined) dbUpdates.mode = updates.mode;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.broadcastId !== undefined) dbUpdates.broadcast_id = updates.broadcastId;
    if (updates.broadcastStartDay !== undefined) dbUpdates.broadcast_start_day = updates.broadcastStartDay;

    const { data, error } = await supabase
      .from('companies')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;
    return this.mapCompanyFromDb(data);
  }

  // Loan operations
  static async createLoan(loan: Omit<Loan, 'createdAt'>): Promise<Loan> {
    const { data, error } = await supabase
      .from('loans')
      .insert({
        loan_id: loan.loanId,
        company_id: loan.companyId,
        amount: loan.amount,
        interest_rate: loan.interestRate,
        duration: loan.duration,
        due_date: loan.dueDate,
        paid_amount: loan.paidAmount,
        status: loan.status,
        credibility_score: loan.credibilityScore,
        offer_type: loan.offerType,
        accepted_at: loan.acceptedAt,
        repayment_plan: loan.repaymentPlan,
        sacrifice: loan.sacrifice,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapLoanFromDb(data);
  }

  static async updateLoan(loanId: string, updates: Partial<Loan>): Promise<Loan> {
    const dbUpdates: any = {};
    if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.credibilityScore !== undefined) dbUpdates.credibility_score = updates.credibilityScore;

    const { data, error } = await supabase
      .from('loans')
      .update(dbUpdates)
      .eq('loan_id', loanId)
      .select()
      .single();

    if (error) throw error;
    return this.mapLoanFromDb(data);
  }

  static async getLoans(companyId: string): Promise<Loan[]> {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (error) throw error;
    return (data || []).map(this.mapLoanFromDb);
  }

  // Mapping functions
  private static mapUserFromDb(data: any): User {
    return {
      discordId: data.discord_id,
      activeCompany: data.active_company,
      unlockedModes: data.unlocked_modes || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private static mapCompanyFromDb(data: any): Company {
    // Handle backward compatibility: convert string[] to Goal[] if needed
    let goals: Goal[] = [];
    if (data.goals) {
      if (Array.isArray(data.goals)) {
        if (data.goals.length > 0 && typeof data.goals[0] === 'string') {
          // Check if strings are JSON objects (new format stored as JSON strings)
          try {
            const firstGoal = data.goals[0];
            if (firstGoal.trim().startsWith('{')) {
              // New format: JSON strings that need to be parsed
              goals = data.goals.map((goalJson: string) => {
                try {
                  return JSON.parse(goalJson);
                } catch (e) {
                  console.error('Error parsing goal JSON:', e, goalJson);
                  return null;
                }
              }).filter((goal: Goal | null) => goal !== null) as Goal[];
            } else {
              // Old format: simple string[] - convert to Goal[]
              goals = data.goals.map((goal: string, index: number) => ({
                goalId: `goal_${index}`,
                goalType: 'reach_users' as const, // Default fallback
                targetValue: 1000, // Default fallback
                progress: 0,
                completed: false,
              }));
            }
          } catch (e) {
            console.error('Error parsing goals:', e);
            goals = [];
          }
        } else {
          // New format: Goal[] objects
          goals = data.goals;
        }
      }
    }
    
    return {
      companyId: data.company_id,
      ownerId: data.owner_id,
      name: data.name,
      type: data.type,
      goals,
      difficulty: data.difficulty,
      day: data.day,
      cash: Number(data.cash),
      users: data.users,
      quality: Number(data.quality),
      hype: Number(data.hype),
      virality: Number(data.virality),
      skills: data.skills || {},
      xp: data.xp,
      level: (() => {
        // Always recalculate level from XP to ensure accuracy
        const calculatedLevel = LevelSystem.calculateLevel(data.xp || 0);
        // If stored level differs significantly, use calculated one
        if (data.level && Math.abs(data.level - calculatedLevel) <= 1) {
          return data.level; // Use stored if close (within 1 level)
        }
        return calculatedLevel;
      })(),
      skillPoints: (() => {
        // Recalculate skill points based on level
        const calculatedLevel = LevelSystem.calculateLevel(data.xp || 0);
        const totalSkillPointsEarned = LevelSystem.calculateTotalSkillPointsFromLevels(calculatedLevel);
        // Use skillPointsSpent if available, otherwise fall back to counting all skill levels (backward compatibility)
        const skillPointsSpent = data.skill_points_spent !== undefined && data.skill_points_spent !== null
          ? data.skill_points_spent
          : Object.values(data.skills || {} as Record<string, number>).reduce((sum: number, level: number) => sum + level, 0);
        return Math.max(0, totalSkillPointsEarned - skillPointsSpent);
      })(),
      skillPointsSpent: data.skill_points_spent !== undefined && data.skill_points_spent !== null
        ? data.skill_points_spent
        : (() => {
          // Backward compatibility: calculate from current skill levels (assume all were purchased)
          // This is not perfect but handles existing data
          const skills = data.skills || {};
          return Object.values(skills as Record<string, number>).reduce((sum: number, level: number) => sum + level, 0);
        })(),
      dailyActions: data.daily_actions || [],
      pendingEvents: data.pending_events || [],
      actionPointsRemaining: data.action_points_remaining,
      loans: data.loans || [],
      alive: data.alive,
      statsHistory: data.stats_history || [],
      inBreakUntil: data.in_break_until || null,
      loanLifelineUsed: data.loan_lifeline_used || false,
      survivalLifelineUsed: data.survival_lifeline_used || false,
      loanEffectDuration: data.loan_effect_duration,
      investors: data.investors || [],
      mode: data.mode || undefined,
      role: data.role || undefined,
      broadcastId: data.broadcast_id || undefined,
      broadcastStartDay: data.broadcast_start_day || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private static mapCompanyToDb(company: Omit<Company, 'createdAt' | 'updatedAt'>): any {
    // Convert goals to JSON strings for TEXT[] storage
    const goalsForDb = company.goals ? company.goals.map(goal => JSON.stringify(goal)) : [];
    
    return {
      company_id: company.companyId,
      owner_id: company.ownerId,
      name: company.name,
      type: company.type,
      goals: goalsForDb,
      difficulty: company.difficulty,
      day: company.day,
      cash: company.cash,
      users: company.users,
      quality: company.quality,
      hype: company.hype,
      virality: company.virality,
      skill_points: company.skillPoints,
      skill_points_spent: company.skillPointsSpent ?? 0,
      skills: company.skills,
      xp: company.xp,
      level: company.level || 1,
      daily_actions: company.dailyActions,
      pending_events: company.pendingEvents,
      action_points_remaining: company.actionPointsRemaining,
      loans: company.loans,
      alive: company.alive,
      stats_history: company.statsHistory,
      in_break_until: company.inBreakUntil,
      loan_lifeline_used: company.loanLifelineUsed,
      survival_lifeline_used: company.survivalLifelineUsed,
      loan_effect_duration: company.loanEffectDuration,
      investors: company.investors,
      mode: company.mode,
      role: company.role,
      broadcast_id: company.broadcastId,
      broadcast_start_day: company.broadcastStartDay,
    };
  }

  private static mapLoanFromDb(data: any): Loan {
    return {
      loanId: data.loan_id,
      companyId: data.company_id,
      amount: Number(data.amount),
      interestRate: Number(data.interest_rate),
      duration: data.duration,
      dueDate: data.due_date,
      paidAmount: Number(data.paid_amount),
      status: data.status,
      credibilityScore: data.credibility_score,
      offerType: data.offer_type,
      acceptedAt: data.accepted_at,
      repaymentPlan: data.repayment_plan,
      sacrifice: data.sacrifice,
      createdAt: data.created_at,
    };
  }

  // Loan exam session operations
  static async createLoanExamSession(session: LoanExamSession): Promise<LoanExamSession> {
    const { data, error } = await supabase
      .from('loan_exam_sessions')
      .insert({
        session_id: session.sessionId,
        company_id: session.companyId,
        user_id: session.userId,
        questions: session.questions,
        answers: session.answers,
        started_at: session.startedAt,
        expires_at: session.expiresAt,
        evaluated_at: session.evaluatedAt,
        result: session.result,
        credential_score: session.credentialScore,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapLoanExamSessionFromDb(data);
  }

  static async getLoanExamSession(sessionId: string): Promise<LoanExamSession | null> {
    const { data, error } = await supabase
      .from('loan_exam_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapLoanExamSessionFromDb(data) : null;
  }

  static async getLoanExamSessionByCompany(companyId: string): Promise<LoanExamSession | null> {
    const { data, error } = await supabase
      .from('loan_exam_sessions')
      .select('*')
      .eq('company_id', companyId)
      .is('evaluated_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapLoanExamSessionFromDb(data) : null;
  }

  static async updateLoanExamSession(
    sessionId: string,
    updates: Partial<LoanExamSession>
  ): Promise<LoanExamSession> {
    const dbUpdates: any = {};
    if (updates.answers !== undefined) dbUpdates.answers = updates.answers;
    if (updates.evaluatedAt !== undefined) dbUpdates.evaluated_at = updates.evaluatedAt;
    if (updates.result !== undefined) dbUpdates.result = updates.result;
    if (updates.credentialScore !== undefined) dbUpdates.credential_score = updates.credentialScore;

    const { data, error } = await supabase
      .from('loan_exam_sessions')
      .update(dbUpdates)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return this.mapLoanExamSessionFromDb(data);
  }

  private static mapLoanExamSessionFromDb(data: any): LoanExamSession {
    return {
      sessionId: data.session_id,
      companyId: data.company_id,
      userId: data.user_id,
      questions: data.questions || [],
      answers: data.answers || [],
      startedAt: data.started_at,
      expiresAt: data.expires_at,
      evaluatedAt: data.evaluated_at,
      result: data.result,
      credentialScore: data.credential_score || 0,
    };
  }

  // Boss battle operations
  static async createBossBattle(battle: Omit<BossBattle, 'createdAt' | 'updatedAt'>): Promise<BossBattle> {
    const { data, error } = await supabase
      .from('boss_battles')
      .insert({
        battle_id: battle.battleId,
        company_id: battle.companyId,
        boss_name: battle.bossName,
        boss_health: battle.bossHealth,
        max_health: battle.maxHealth,
        current_turn: battle.currentTurn,
        player_health: battle.playerHealth,
        status: battle.status,
        attack_pattern: battle.attackPattern,
        last_boss_move: battle.lastBossMove,
        last_player_move: battle.lastPlayerMove,
        turn_timeout: battle.turnTimeout,
        rewards: battle.rewards,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapBossBattleFromDb(data);
  }

  static async getBossBattle(companyId: string): Promise<BossBattle | null> {
    const { data, error } = await supabase
      .from('boss_battles')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapBossBattleFromDb(data) : null;
  }

  static async updateBossBattle(battleId: string, updates: Partial<BossBattle>): Promise<BossBattle> {
    const dbUpdates: any = {};
    if (updates.bossHealth !== undefined) dbUpdates.boss_health = updates.bossHealth;
    if (updates.currentTurn !== undefined) dbUpdates.current_turn = updates.currentTurn;
    if (updates.playerHealth !== undefined) dbUpdates.player_health = updates.playerHealth;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.lastBossMove !== undefined) dbUpdates.last_boss_move = updates.lastBossMove;
    if (updates.lastPlayerMove !== undefined) dbUpdates.last_player_move = updates.lastPlayerMove;
    if (updates.turnTimeout !== undefined) dbUpdates.turn_timeout = updates.turnTimeout;
    if (updates.rewards !== undefined) dbUpdates.rewards = updates.rewards;

    const { data, error } = await supabase
      .from('boss_battles')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('battle_id', battleId)
      .select()
      .single();

    if (error) throw error;
    return this.mapBossBattleFromDb(data);
  }

  private static mapBossBattleFromDb(data: any): BossBattle {
    return {
      battleId: data.battle_id,
      companyId: data.company_id,
      bossName: data.boss_name,
      bossHealth: data.boss_health,
      maxHealth: data.max_health,
      currentTurn: data.current_turn,
      playerHealth: data.player_health,
      status: data.status,
      attackPattern: data.attack_pattern || [],
      lastBossMove: data.last_boss_move,
      lastPlayerMove: data.last_player_move,
      turnTimeout: data.turn_timeout,
      rewards: data.rewards,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Anomaly log operations
  static async createAnomalyLog(log: Omit<AnomalyLog, 'logId' | 'createdAt'>): Promise<AnomalyLog> {
    const logId = require('uuid').v4();
    const { data, error } = await supabase
      .from('anomalies_log')
      .insert({
        log_id: logId,
        company_id: log.companyId,
        anomaly_id: log.anomalyId,
        day: log.day,
        effects: log.effects,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapAnomalyLogFromDb(data);
  }

  private static mapAnomalyLogFromDb(data: any): AnomalyLog {
    return {
      logId: data.log_id,
      companyId: data.company_id,
      anomalyId: data.anomaly_id,
      day: data.day,
      effects: data.effects || {},
      createdAt: data.created_at,
    };
  }
}

