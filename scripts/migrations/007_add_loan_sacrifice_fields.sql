-- Add sacrifice and loan metadata fields to loans table
-- Note: Migration 003 may have already added some of these fields
-- This migration ensures all fields exist with correct types

-- Add columns only if they don't exist
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS offer_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sacrifice JSONB DEFAULT NULL;

-- Handle repayment_plan: Migration 003 added it as JSONB, but we need it as TEXT
-- Convert existing JSONB column to TEXT if it exists
DO $$
BEGIN
  -- Check if repayment_plan exists and is JSONB
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loans' 
      AND column_name = 'repayment_plan' 
      AND data_type = 'jsonb'
  ) THEN
    -- Convert JSONB to TEXT (extract text value, default to 'monthly' for empty objects)
    ALTER TABLE loans 
      ALTER COLUMN repayment_plan TYPE TEXT 
      USING CASE 
        WHEN repayment_plan IS NULL THEN NULL
        WHEN repayment_plan::text = '{}' THEN 'monthly'
        WHEN repayment_plan::text = 'null' THEN NULL
        ELSE repayment_plan::text
      END;
    ALTER TABLE loans ALTER COLUMN repayment_plan SET DEFAULT NULL;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'loans' AND column_name = 'repayment_plan'
  ) THEN
    -- Column doesn't exist, add it as TEXT
    ALTER TABLE loans ADD COLUMN repayment_plan TEXT DEFAULT NULL;
  END IF;
END $$;

-- Update existing loans: set repayment_plan to 'monthly' if it's NULL
UPDATE loans
SET repayment_plan = 'monthly'
WHERE repayment_plan IS NULL;

