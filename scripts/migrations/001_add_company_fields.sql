-- Migration: Add new company fields for break system and loan lifeline
-- Run this migration to add support for break timers and loan lifeline tracking

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS in_break_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS loan_lifeline_used BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mode VARCHAR(50);

-- Create index for break queries
CREATE INDEX IF NOT EXISTS idx_companies_break_until ON companies(in_break_until) WHERE in_break_until IS NOT NULL;

