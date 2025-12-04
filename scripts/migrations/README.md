# Database Migrations

This directory contains SQL migration files for the Startup Simulation Game database.

## Running Migrations

### Using Supabase CLI

1. Install Supabase CLI: `npm install -g supabase`
2. Link your project: `supabase link --project-ref your-project-ref`
3. Run migrations: `supabase db push`

### Using psql

1. Connect to your Supabase database:
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

2. Run migrations in order:
   ```sql
   \i scripts/migrations/001_add_company_fields.sql
   \i scripts/migrations/002_create_loan_exam_sessions.sql
   \i scripts/migrations/003_add_loan_offer_fields.sql
   ```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file content
4. Run them in order (001 through 007)

## Migration Order

1. **001_add_company_fields.sql** - Adds break timer and loan lifeline fields
2. **002_create_loan_exam_sessions.sql** - Creates loan exam sessions table
3. **003_add_loan_offer_fields.sql** - Adds loan offer metadata fields
4. **004_create_boss_battles.sql** - Creates boss battles table for Day 45 boss fights
5. **005_create_anomalies_log.sql** - Creates anomalies log table for tracking daily anomalies
6. **006_add_company_boss_fields.sql** - Adds boss/investor/survival lifeline fields to companies
7. **007_add_loan_sacrifice_fields.sql** - Adds sacrifice effects and loan metadata to loans table

## Notes

- All migrations are idempotent (safe to run multiple times)
- Use `IF NOT EXISTS` clauses to prevent errors on re-runs
- Always backup your database before running migrations in production

