-- Add role and broadcast fields to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS broadcast_id TEXT,
ADD COLUMN IF NOT EXISTS broadcast_start_day INTEGER;

-- Add check constraint for role values
ALTER TABLE companies
ADD CONSTRAINT check_role CHECK (
  role IS NULL OR role IN (
    'founder',
    'cto',
    'cmo',
    'cfo',
    'product_manager',
    'growth_hacker',
    'operations_manager'
  )
);

