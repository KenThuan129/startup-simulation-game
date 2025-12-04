-- Users table
CREATE TABLE IF NOT EXISTS users (
  discord_id TEXT PRIMARY KEY,
  active_company TEXT,
  unlocked_modes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  company_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  goals TEXT[] DEFAULT '{}',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard', 'another_story')),
  day INTEGER DEFAULT 1,
  cash NUMERIC DEFAULT 10000,
  users INTEGER DEFAULT 0,
  quality NUMERIC DEFAULT 50,
  hype NUMERIC DEFAULT 0,
  virality NUMERIC DEFAULT 0,
  skill_points INTEGER DEFAULT 0,
  skills JSONB DEFAULT '{}',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 50),
  daily_actions JSONB DEFAULT '[]',
  pending_events JSONB DEFAULT '[]',
  action_points_remaining INTEGER DEFAULT 0,
  loans TEXT[] DEFAULT '{}',
  alive BOOLEAN DEFAULT true,
  stats_history JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
  loan_id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  duration INTEGER NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('active', 'paid', 'defaulted')) DEFAULT 'active',
  credibility_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_loans_company ON loans(company_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

