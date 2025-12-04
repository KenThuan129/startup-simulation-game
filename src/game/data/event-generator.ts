/**
 * Utility to generate balanced event outcomes based on balance guidelines
 */

export interface EventEffectRanges {
  minorPositive: { users: [number, number]; cash: [number, number]; xp: [number, number] };
  majorPositive: { users: [number, number]; cash: [number, number]; quality: [number, number]; xp: [number, number] };
  minorNegative: { users: [number, number]; cash: [number, number]; hype: [number, number] };
  majorNegative: { users: [number, number]; cash: [number, number]; quality: [number, number]; xp: [number, number] };
}

export const balanceRanges: EventEffectRanges = {
  minorPositive: {
    users: [5, 25],
    cash: [20, 100],
    xp: [5, 20],
  },
  majorPositive: {
    users: [50, 200],
    cash: [200, 800],
    quality: [1, 3],
    xp: [20, 60],
  },
  minorNegative: {
    users: [-20, -5],
    cash: [-150, -20],
    hype: [-8, -2],
  },
  majorNegative: {
    users: [-200, -50],
    cash: [-700, -200],
    quality: [-3, -1],
    xp: [-30, -10],
  },
};

export function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateCriticalSuccess(ranges: EventEffectRanges): any {
  const [usersMin, usersMax] = ranges.majorPositive.users;
  const [cashMin, cashMax] = ranges.majorPositive.cash;
  const [qualityMin, qualityMax] = ranges.majorPositive.quality;
  const [xpMin, xpMax] = ranges.majorPositive.xp;
  
  return {
    cash: rand(cashMin, cashMax),
    users: rand(usersMin, usersMax),
    quality: rand(qualityMin, qualityMax),
    hype: rand(5, 15),
    xp: rand(xpMin, xpMax),
    skills: { [getRandomSkill()]: rand(1, 3) },
  };
}

export function generateSuccess(ranges: EventEffectRanges): any {
  const [usersMin, usersMax] = ranges.minorPositive.users;
  const [cashMin, cashMax] = ranges.minorPositive.cash;
  const [xpMin, xpMax] = ranges.minorPositive.xp;
  
  return {
    cash: rand(cashMin, cashMax),
    users: rand(usersMin, usersMax),
    quality: rand(0, 2),
    hype: rand(2, 8),
    xp: rand(xpMin, xpMax),
  };
}

export function generateFailure(ranges: EventEffectRanges): any {
  const [usersMin, usersMax] = ranges.minorNegative.users;
  const [cashMin, cashMax] = ranges.minorNegative.cash;
  const [hypeMin, hypeMax] = ranges.minorNegative.hype;
  
  return {
    cash: rand(cashMin, cashMax),
    users: Math.max(0, rand(usersMin, usersMax)),
    quality: rand(-2, 0),
    hype: rand(hypeMin, hypeMax),
    xp: rand(5, 15),
  };
}

export function generateCriticalFailure(ranges: EventEffectRanges): any {
  const [usersMin, usersMax] = ranges.majorNegative.users;
  const [cashMin, cashMax] = ranges.majorNegative.cash;
  const [qualityMin, qualityMax] = ranges.majorNegative.quality;
  const [xpMin, xpMax] = ranges.majorNegative.xp;
  
  return {
    cash: rand(cashMin, cashMax),
    users: Math.max(0, rand(usersMin, usersMax)),
    quality: rand(qualityMin, qualityMax),
    hype: rand(-15, -5),
    xp: rand(xpMin, xpMax),
  };
}

function getRandomSkill(): string {
  const skills = [
    'product_engineering',
    'product_ux',
    'marketing_social',
    'marketing_content',
    'marketing_pr',
    'finance_budgeting',
    'tech_infrastructure',
    'tech_security',
  ];
  return skills[Math.floor(Math.random() * skills.length)];
}

