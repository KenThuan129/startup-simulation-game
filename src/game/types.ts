export type Difficulty = 'easy' | 'normal' | 'hard' | 'another_story';
export type ActionCategory = 
  | 'product' 
  | 'marketing' 
  | 'tech' 
  | 'business_dev' 
  | 'operations' 
  | 'finance' 
  | 'research' 
  | 'high_risk';

export type OutcomeType = 'critical_success' | 'success' | 'failure' | 'critical_failure';

export interface ActionData {
  actionId: string;
  category: ActionCategory;
  name: string;
  description: string;
  eventPool: string[]; // Event IDs
  weight?: number; // Action point cost: 1 or 2 (default 1)
}

export interface EventData {
  eventId: string;
  category: ActionCategory;
  name: string;
  description: string;
  choices: EventChoiceData[];
}

export interface EventChoiceData {
  choiceId: string;
  type: OutcomeType;
  text: string;
  effects: OutcomeEffects;
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

export interface AnomalyData {
  anomalyId: string;
  name: string;
  description: string;
  effects: OutcomeEffects;
  triggers?: string[];
  flags?: string[];
}

export interface SkillData {
  skillId: string;
  tree: 'product' | 'marketing' | 'finance' | 'technology';
  name: string;
  description: string;
  maxLevel: number;
  effects: SkillEffects;
}

export interface SkillEffects {
  revenueMultiplier?: number;
  viralityBonus?: number;
  conversionBonus?: number;
  costReduction?: number;
  eventOutcomeBonus?: number;
}

export interface LoanOffer {
  amount: number;
  interestRate: number;
  duration: number;
  credibilityScore: number;
  sacrifice?: {
    xpPenaltyPercent?: number;
    temporaryRevMultiplier?: number;
    futureEventChanceIncrease?: number;
  };
}

export interface LoanExamQuestion {
  questionId: string;
  type: 'multiple_choice' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer?: number; // Index for multiple choice, -1 for multiple valid
  correctKeywords?: string[]; // For short answer
}

export interface LoanExamAnswer {
  questionId: string;
  answer: string | number;
  submittedAt: string;
}

export interface LoanExamSession {
  sessionId: string;
  companyId: string;
  userId: string;
  questions: LoanExamQuestion[];
  answers: LoanExamAnswer[];
  startedAt: string;
  expiresAt: string;
  evaluatedAt: string | null;
  result: any | null;
  credentialScore: number;
}

