-- Migration: Create loan_exam_sessions table
-- Run this migration to add support for interactive loan exam workflow

CREATE TABLE IF NOT EXISTS loan_exam_sessions (
  session_id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  answers JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  evaluated_at TIMESTAMP WITH TIME ZONE,
  result JSONB,
  credential_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_loan_exam_company ON loan_exam_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_loan_exam_user ON loan_exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_exam_expires ON loan_exam_sessions(expires_at) WHERE evaluated_at IS NULL;

