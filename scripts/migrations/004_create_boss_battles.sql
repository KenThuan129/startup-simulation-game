-- Boss battles table
CREATE TABLE IF NOT EXISTS boss_battles (
  battle_id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  boss_name TEXT NOT NULL,
  boss_health INTEGER NOT NULL,
  max_health INTEGER NOT NULL,
  current_turn INTEGER DEFAULT 1,
  player_health INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'won', 'lost', 'expired')) DEFAULT 'active',
  attack_pattern TEXT[] DEFAULT '{}',
  last_boss_move TEXT,
  last_player_move TEXT,
  turn_timeout TIMESTAMP WITH TIME ZONE,
  rewards JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boss_battles_company ON boss_battles(company_id);
CREATE INDEX IF NOT EXISTS idx_boss_battles_status ON boss_battles(status);

