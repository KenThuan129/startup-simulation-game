-- Add level field to companies table
-- Level ranges from 1 to 50, calculated from XP

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 50);

-- Set default level to 1 for existing companies
UPDATE companies
SET level = 1
WHERE level IS NULL OR level < 1;

