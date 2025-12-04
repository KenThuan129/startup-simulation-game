-- Add boss and survival lifeline fields to companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS survival_lifeline_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS loan_effect_duration INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS investors TEXT[] DEFAULT '{}';

