# Changelog

## [Unreleased] - Deployment Preparation

### Added
- Railway deployment configuration (`nixpacks.toml`)
- Comprehensive Railway deployment guide (`RAILWAY.md`)
- Deployment checklist (`DEPLOYMENT_CHECKLIST.md`)
- Production error handling (unhandled rejections, graceful shutdown)
- Enhanced logging for production environment
- Post-install build script for automatic builds

### Changed
- Updated `package.json` with `postinstall` script for Railway
- Enhanced `.gitignore` with comprehensive ignore patterns
- Updated `DEPLOY.md` with Railway deployment instructions
- Updated `README.md` with deployment section and quick links
- Improved error messages for missing environment variables

### Fixed
- Goals parsing from database (handles JSON strings correctly)
- Role selection button parsing (handles UUIDs with hyphens)
- Database goal storage format consistency

### Security
- Environment variables properly excluded from Git
- Production error handling prevents crashes
- Graceful shutdown on SIGTERM/SIGINT

## Previous Versions

All notable changes to the Startup Simulation Game will be documented in this file.

## [2.0.0] - 2024-01-XX

### Added
- **Loan Exam System**: Interactive 30-minute verification exam with 4 questions
  - `/loan-start` - Begin exam
  - `/loan-answer` - Submit answers
  - `/loan-status` - Check progress and view offers
  - `/loan-accept` - Accept loan offer
  - `/loan-decline` - Decline offers
  - Credibility score calculation based on answers, speed, and company metrics
  - Loan offers with sacrifice penalties (XP reduction, revenue multipliers)

- **Multi-Action Per Day System**
  - Action limits per difficulty (Easy: 5, Normal: 4, Hard: 3)
  - 30-minute break timer when actions exhausted
  - Immediate event resolution (no queuing)
  - Break enforcement prevents immediate continuation

- **Expanded Content**
  - 112 actions (14 per category, up from 4)
  - 320 events (40 per category, up from 16)
  - 31 anomalies (up from 15)
  - 15 boss moves (new)

- **Centralized Formulas System**
  - `src/game/systems/formulas.ts` - All balance formulas
  - `src/config/difficulty.ts` - Difficulty configurations
  - Quality-based revenue calculation
  - Difficulty-modulated retention/churn/burn
  - Enhanced bankruptcy checks with minimum user floor

- **Simulation Tool**
  - `scripts/simulate.ts` - Headless simulation for balance tuning
  - Supports deterministic seeding
  - Outputs survival rates, averages, and bankruptcy stats
  - Usage: `npm run simulate [difficulty] [companies] [days] [seed]`

- **Database Migrations**
  - `scripts/migrations/001_add_company_fields.sql` - Break timer and lifeline fields
  - `scripts/migrations/002_create_loan_exam_sessions.sql` - Exam sessions table
  - `scripts/migrations/003_add_loan_offer_fields.sql` - Loan offer metadata

- **Unit Tests**
  - `src/__tests__/formulas.test.ts` - Formula tests
  - `src/__tests__/company-state.test.ts` - State management tests
  - Jest configuration and test scripts

- **Documentation**
  - `BALANCE.md` - Complete balance guide with formulas
  - `NEW_FEATURES.md` - Feature documentation
  - `CHANGELOG.md` - This file
  - `DEPLOY.md` - Deployment guide
  - Migration README

### Changed
- **Daily Tick System**: Now uses centralized formulas with difficulty modifiers
- **Action System**: Enforces action limits and break timers
- **Loan System**: Requires exam completion, offers include sacrifices
- **Event System**: Expanded pools with balanced effect ranges
- **Bankruptcy Logic**: Enhanced with minimum user floor and runway checks

### Fixed
- Event outcome application now immediate (no delays)
- Action selection properly decrements action points
- Break system prevents action spam
- Database queries handle new company fields

### Technical
- TypeScript strict mode compliance
- Modular architecture maintained
- Backward compatible database changes
- Idempotent migrations

## [1.0.0] - Initial Release

### Added
- Basic game systems
- Discord command handlers
- Supabase integration
- Core game loop

