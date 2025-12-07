# Decision-Based Event Choices

## Overview

This update changes all event choices from outcome-based descriptions (e.g., "The meeting is a disaster") to decision-based actions (e.g., "Rebuild from scratch"). This makes choices ambiguous and realistic, as players must make actual decisions without knowing which outcome they'll get.

## What Changed

**Before (Outcome-Based - Predictable):**
- "The budget review meeting is a disaster"
- "The budget review meeting is successful"

**After (Decision-Based - Ambiguous):**
- "Rebuild the budget from scratch"
- "Hire a financial consultant to review"
- "Ask the team to justify all expenses"
- "Implement automated budget tracking"

## How to Regenerate Events

Run the decision-based choice generator:

```bash
npx ts-node scripts/generate-decision-based-choices.ts
```

This will regenerate all events in `src/game/data/events.json` with decision-based choices.

## Key Features

1. **Action-Focused**: Choices describe what you DO, not what happens
2. **Ambiguous**: Players can't tell which choice is best from the text alone
3. **Realistic**: Based on real startup decision scenarios
4. **Trade-offs**: Each decision has realistic pros/cons

## Example Event Structure

```json
{
  "eventId": "finance_event_1",
  "category": "finance",
  "name": "Budget Review Meeting",
  "description": "You face a critical decision about budget review meeting. Each choice represents a different approach - choose wisely.",
  "choices": [
    {
      "choiceId": "finance_event_1_cs",
      "type": "critical_success",
      "text": "Implement automated budget tracking",
      "effects": { ... }
    },
    {
      "choiceId": "finance_event_1_s",
      "type": "success",
      "text": "Hire a financial consultant to review",
      "effects": { ... }
    },
    {
      "choiceId": "finance_event_1_f",
      "type": "failure",
      "text": "Ask the team to justify all expenses",
      "effects": { ... }
    },
    {
      "choiceId": "finance_event_1_cf",
      "type": "critical_failure",
      "text": "Rebuild the budget from scratch",
      "effects": { ... }
    }
  ]
}
```

The outcome (critical_success, success, failure, critical_failure) is hidden until the player makes their choice!
