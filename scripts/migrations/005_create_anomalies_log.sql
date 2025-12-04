-- Anomalies log table
CREATE TABLE IF NOT EXISTS anomalies_log (
  log_id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  anomaly_id TEXT NOT NULL,
  day INTEGER NOT NULL,
  effects JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_log_company ON anomalies_log(company_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_log_day ON anomalies_log(day);

