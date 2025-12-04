# Game Balance Guide

This document describes the balance constants and formulas used in the Startup Simulation Game.

## Difficulty Configurations

Each difficulty level has specific modifiers:

### Easy
- **Action Limit:** 5 per day
- **Retention Bonus:** +5%
- **Churn Penalty:** -2%
- **Burn Multiplier:** 0.9 (10% reduction)
- **Positive Event Bias:** +20%
- **Base Burn:** $80/day
- **Initial Cash:** $15,000

### Normal
- **Action Limit:** 4 per day
- **Retention Bonus:** 0%
- **Churn Penalty:** 0%
- **Burn Multiplier:** 1.0
- **Positive Event Bias:** 0%
- **Base Burn:** $100/day
- **Initial Cash:** $10,000

### Hard
- **Action Limit:** 3 per day
- **Retention Bonus:** -5%
- **Churn Penalty:** +2%
- **Burn Multiplier:** 1.15 (15% increase)
- **Positive Event Bias:** -10%
- **Base Burn:** $120/day
- **Initial Cash:** $8,000

### Another Story
- **Action Limit:** 3 per day
- **Retention Bonus:** -8%
- **Churn Penalty:** +3%
- **Burn Multiplier:** 1.25 (25% increase)
- **Positive Event Bias:** -15%
- **Base Burn:** $140/day
- **Initial Cash:** $6,000

## Core Formulas

### Revenue Per User
```
Revenue Per User = $0.20 + (Quality / 100) * $0.40
```
- At Quality 0: $0.20/user/day
- At Quality 50: $0.30/user/day
- At Quality 100: $0.60/user/day

### Daily Revenue
```
Daily Revenue = Users * Revenue Per User * Skill Revenue Multiplier
```

### Retention Rate
```
Base Retention = 0.70 + (Quality / 100) * 0.25
Final Retention = Base Retention + Difficulty Retention Bonus
```
- Range: 50% - 98%
- Quality 0: 70% retention
- Quality 100: 95% retention

### Churn Rate
```
Churn = 1 - Retention + Difficulty Churn Penalty
```

### Daily Burn Rate
```
Base Burn = Difficulty Base Burn + (Users * $0.08)
Final Burn = Base Burn * Difficulty Burn Multiplier * (1 - Skill Cost Reduction)
```

### Hype Decay
```
New Hype = Current Hype * 0.95
```
- 5% decay per day

### Virality Decay
```
New Virality = Current Virality * 0.97
```
- 3% decay per day

### Viral Growth
- Requires minimum 30 hype
- Chance = (Hype / 100) * (1 + Virality Bonus)
- On success: +12% users * hype multiplier, +hype gain

## Event Effect Ranges

### Minor Positive
- Users: +5 to +25
- Cash: +$20 to +$100
- XP: +5 to +20

### Major Positive
- Users: +50 to +200
- Cash: +$200 to +$800
- Quality: +1 to +3
- XP: +20 to +60

### Minor Negative
- Users: -5 to -20
- Cash: -$20 to -$150
- Hype: -2 to -8

### Major Negative
- Users: -50 to -200
- Cash: -$200 to -$700
- Quality: -1 to -3
- XP: -10 to -30

## Event Selection Weights

- **Normal:** 50%
- **Minor Positive:** 15%
- **Minor Negative:** 15%
- **Major Positive:** 15%
- **Major Negative:** 5%

Difficulty bias adjusts these weights (Easy: +20% positive, Hard: -10% positive).

## Bankruptcy Conditions

A company goes bankrupt if:
1. Users < 5 (minimum floor), OR
2. Cash < 0 AND:
   - Negative runway >= 7 days of burn, OR
   - Cash <= -1.5x initial cash

With loan lifeline: Requires more severe conditions (severe loss OR negative runway + cash < -initial cash).

## Loan System

### Credibility Score Calculation
- Base: 50 points
- Days survived: +2 per day
- Cash > $10k: +20, > $5k: +10, < $1k: -20
- Users > 1000: +15, > 500: +10, < 100: -10
- Quality: +1 per 5 points
- XP: +1 per 100 XP
- Skills: +2 per skill level

### Loan Offers by Credibility
- **80+:** $50k @ 5% or $30k @ 4%
- **60+:** $20k @ 7% or $15k @ 6%
- **40+:** $10k @ 10% or $7.5k @ 9%
- **<40:** $5k @ 15%

### Loan Sacrifices
Higher credibility = lower sacrifices:
- Low credibility: 20% XP penalty, 80% revenue multiplier, +15% event chance
- High credibility: 5% XP penalty, 95% revenue multiplier

## Tuning Guidelines

1. **Revenue:** Adjust `computeRevenuePerUser` base and multiplier
2. **Retention:** Modify base retention (0.70) and quality scaling (0.25)
3. **Burn Rate:** Change base burn per difficulty and per-user cost ($0.08)
4. **Event Effects:** Adjust ranges in `event-generator.ts`
5. **Event Weights:** Modify selection probabilities
6. **Bankruptcy:** Adjust minimum users floor and runway requirements

## Simulation Tool

Use `npm run simulate [difficulty] [companies] [days] [seed]` to test balance:
```bash
npm run simulate easy 100 90
npm run simulate normal 100 90
npm run simulate hard 100 90
```

This will output survival rates, average final cash/users, and bankruptcy statistics.

