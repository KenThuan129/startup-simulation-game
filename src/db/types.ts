export interface User {
  discordId: string;
  activeCompany: string | null;
  unlockedModes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  goalId: string;
  goalType: 'reach_users' | 'reach_cash' | 'reach_quality' | 'reach_hype' | 'reach_virality' | 'reach_daily_revenue' | 'reach_skill_level' | 'survive_days';
  targetValue: number;
  progress: number;
  completed: boolean;
}

export interface Company {
  companyId: string;
  ownerId: string;
  name: string;
  type: string;
  goals: Goal[];
  difficulty: 'easy' | 'normal' | 'hard' | 'another_story';
  role?: string; // Role ID (founder, cto, cmo, cfo, product_manager, growth_hacker, operations_manager)
  day: number;
  cash: number;
  users: number;
  quality: number;
  hype: number;
  virality: number;
  skillPoints: number;
  skillPointsSpent: number; // Track only manually purchased skill levels (not event-granted)
  skills: Record<string, number>;
  xp: number;
  level: number; // Level from 1 to 50, calculated from XP
  dailyActions: DailyAction[];
  pendingEvents: PendingEvent[];
  actionPointsRemaining: number;
  loans: string[]; // Loan IDs
  alive: boolean;
  statsHistory: StatsSnapshot[];
  inBreakUntil: string | null; // ISO timestamp when break ends
  loanLifelineUsed: boolean;
  survivalLifelineUsed?: boolean; // Track if loan lifeline was used
  loanEffectDuration?: number; // Days remaining for loan sacrifice effects
  investors?: string[]; // Investor names/IDs from boss victory
  mode?: string;
  broadcastId?: string | null; // Current active broadcast ID
  broadcastStartDay?: number; // Day when current broadcast started
  createdAt: string;
  updatedAt: string;
}

export interface DailyAction {
  actionId: string;
  category: string;
  name: string;
  description: string;
  selected: boolean;
}

export interface PendingEvent {
  eventId: string;
  actionId: string;
  choices: EventChoice[];
  selectedChoiceId: string | null;
}

export interface EventChoice {
  choiceId: string;
  label: string; // "Option A", "Option B", etc.
  type: 'critical_success' | 'success' | 'failure' | 'critical_failure';
  text: string;
  effects: OutcomeEffects;
  revealed: boolean; // Whether the outcome type has been revealed
}

export interface OutcomeEffects {
  cash?: number;
  users?: number;
  hype?: number;
  quality?: number;
  burnout?: number;
  xp?: number;
  skills?: Record<string, number>;
  flags?: string[];
}

export interface StatsSnapshot {
  day: number;
  cash: number;
  users: number;
  quality: number;
  hype: number;
  virality: number;
  xp: number;
  level: number;
}

export interface Loan {
  loanId: string;
  companyId: string;
  amount: number;
  interestRate: number;
  duration: number; // in days
  dueDate: string; // ISO timestamp
  paidAmount: number;
  status: 'active' | 'paid' | 'defaulted';
  credibilityScore?: number;
  offerType?: string; // JSON string of sacrifice metadata
  acceptedAt?: string;
  repaymentPlan?: string;
  sacrifice?: {
    xpPenaltyPercent?: number;
    temporaryRevMultiplier?: number;
    futureEventChanceIncrease?: number;
  };
  createdAt: string;
}

export interface BossBattle {
  battleId: string;
  companyId: string;
  bossName: string;
  bossHealth: number;
  maxHealth: number;
  currentTurn: number;
  playerHealth: number; // Company health proxy (cash + users/10)
  status: 'active' | 'won' | 'lost' | 'expired';
  attackPattern: string[]; // Sequence of boss moves
  lastBossMove?: string;
  lastPlayerMove?: string;
  turnTimeout?: string; // ISO timestamp
  rewards?: {
    cash?: number;
    investors?: string[];
    qualityBoost?: number;
    skillPoints?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AnomalyLog {
  logId: string;
  companyId: string;
  anomalyId: string;
  day: number;
  effects: OutcomeEffects;
  createdAt: string;
}
