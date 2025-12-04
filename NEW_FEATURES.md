# New Features Guide

This document describes the new features added to the Startup Simulation Game.

## Loan Exam System

### Overview
The loan system now includes an interactive verification exam that players must complete to qualify for loans. This adds strategic depth and prevents easy loan access.

### Workflow

1. **Start Exam** (`/loan-start`)
   - Begins a 30-minute timed exam
   - 4 questions (mix of multiple choice and short answer)
   - Questions cover startup fundamentals, financial planning, and strategy

2. **Answer Questions** (`/loan-answer`)
   - Submit answers one at a time
   - Multiple choice: answer with number (1-4)
   - Short answer: provide text response
   - Can check progress with `/loan-status`

3. **Evaluation**
   - Automatically evaluates when all questions answered
   - Score based on:
     - Answer correctness (40%)
     - Response speed (20%)
     - Company metrics (40%)
   - Produces credibility score (0-100)

4. **View Offers** (`/loan-status`)
   - Shows available loan offers based on credibility score
   - Each offer includes:
     - Amount, interest rate, duration
     - Monthly payment calculation
     - Sacrifice penalties (XP reduction, revenue multiplier, event chance)

5. **Accept/Decline** (`/loan-accept`, `/loan-decline`)
   - Accept an offer to receive funds
   - Decline to try again later

### Commands
- `/loan-start` - Begin loan verification exam
- `/loan-answer question:<id> answer:<value>` - Submit exam answer
- `/loan-status` - Check exam progress and view offers
- `/loan-accept offer:<number>` - Accept a loan offer
- `/loan-decline` - Decline all offers

## Multi-Action Per Day System

### Overview
Players can now take multiple actions per day, with limits based on difficulty. After exhausting actions, a break timer prevents immediate continuation.

### Action Limits
- **Easy:** 5 actions per day
- **Normal:** 4 actions per day
- **Hard:** 3 actions per day
- **Another Story:** 3 actions per day

### Break System
- When action points reach 0, a 30-minute break begins
- During break, `/start-day` is blocked
- Break expires automatically after 30 minutes
- If player uses `/end-day` before all actions used, break is applied

### Immediate Event Resolution
- Action selection immediately generates 1-3 events
- Player chooses outcome with `/choose`
- Effects apply instantly to company stats
- No queued outcomes - everything is immediate

## Enhanced Daily Tick System

### New Formulas
All daily calculations now use centralized formulas in `src/game/systems/formulas.ts`:

- **Revenue:** Quality-based per-user revenue
- **Retention/Churn:** Quality and difficulty-based
- **Burn Rate:** Base + per-user costs with difficulty multipliers
- **Virality:** Hype-based growth chance
- **Bankruptcy:** Multi-factor check with minimum user floor

### Difficulty Modifiers
Each difficulty applies modifiers to:
- Retention rates
- Churn rates
- Burn multipliers
- Event outcome bias

## Expanded Content

### Actions
- **112 total actions** (14 per category)
- 8 categories: product, marketing, tech, business_dev, operations, finance, research, high_risk
- Each action has unique event pool

### Events
- **320 total events** (40 per category)
- Each event has 4 outcomes: Critical Success, Success, Failure, Critical Failure
- Balanced effect ranges following guidelines
- Weighted selection with difficulty bias

### Anomalies
- **31 unique anomalies**
- Random events (20-30% chance per day)
- Can trigger based on action categories
- Range from major wins to catastrophic failures

### Boss Moves
- **15 boss actions**
- Attack and Defense types
- Used during Day 45 boss fight
- High-stakes strategic choices

## Data Organization

### File Structure
```
src/game/data/
  ├── actions.json          # All actions (112)
  ├── events.json           # All events (320)
  ├── anomalies.json        # Anomalies (31)
  ├── bosses.json           # Boss moves (15)
  ├── skills.json           # Skill trees
  └── event-generator.ts    # Balance utilities
```

### Generation
Data can be regenerated with:
```bash
npx ts-node scripts/generate-expanded-data.ts
```

## Simulation Tool

### Usage
```bash
npm run simulate [difficulty] [companies] [days] [seed]
```

### Example
```bash
npm run simulate easy 100 90
npm run simulate normal 100 90 12345  # With seed for reproducibility
```

### Output
- Survival rate
- Average final cash
- Average final users
- Average actions taken
- Average bankruptcy day

Use this tool to tune balance and test changes.

## Database Migrations

### New Fields
- `companies.in_break_until` - Break timer expiration
- `companies.loan_lifeline_used` - Tracks if loan was used
- `companies.mode` - Game mode tracking

### New Tables
- `loan_exam_sessions` - Stores exam sessions and results

### Migration Files
Located in `scripts/migrations/`:
1. `001_add_company_fields.sql`
2. `002_create_loan_exam_sessions.sql`
3. `003_add_loan_offer_fields.sql`

See `scripts/migrations/README.md` for migration instructions.

## Testing

### Unit Tests
Located in `src/__tests__/`:
- `formulas.test.ts` - Tests core balance formulas
- `company-state.test.ts` - Tests state management

Run with: `npm test`

## Developer Notes

### Key Changes
1. All formulas centralized in `formulas.ts`
2. Difficulty configs in `difficulty.ts`
3. Event effects follow balance ranges
4. Immediate action resolution (no queuing)
5. Break system enforces pacing

### Balance Tuning
See `BALANCE.md` for detailed formulas and tuning guidelines.

### Adding Content
1. Edit JSON files in `src/game/data/`
2. Or regenerate with `scripts/generate-expanded-data.ts`
3. Follow balance ranges in `event-generator.ts`

