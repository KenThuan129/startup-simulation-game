import { CompanyState } from '../game/state/company-state';
import { Company } from '../db/types';
import { OutcomeEffects } from '../game/types';

describe('CompanyState', () => {
  const baseCompany: Company = {
    companyId: 'test',
    ownerId: 'test',
    name: 'Test',
    type: 'saas',
    goals: [],
    difficulty: 'normal',
    day: 1,
    cash: 1000,
    users: 100,
    quality: 50,
    hype: 0,
    virality: 0,
    skillPoints: 0,
    skills: {},
    xp: 0,
    level: 1,
    dailyActions: [],
    pendingEvents: [],
    actionPointsRemaining: 5,
    loans: [],
    alive: true,
    statsHistory: [],
    inBreakUntil: null,
    loanLifelineUsed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('applyOutcome', () => {
    it('should apply cash changes', () => {
      const effects: OutcomeEffects = { cash: 500 };
      const updated = CompanyState.applyOutcome(baseCompany, effects);
      expect(updated.cash).toBe(1500);
    });

    it('should apply user changes', () => {
      const effects: OutcomeEffects = { users: 50 };
      const updated = CompanyState.applyOutcome(baseCompany, effects);
      expect(updated.users).toBe(150);
    });

    it('should not allow negative cash', () => {
      const effects: OutcomeEffects = { cash: -2000 };
      const updated = CompanyState.applyOutcome(baseCompany, effects);
      expect(updated.cash).toBeGreaterThanOrEqual(0);
    });

    it('should not allow negative users', () => {
      const effects: OutcomeEffects = { users: -200 };
      const updated = CompanyState.applyOutcome(baseCompany, effects);
      expect(updated.users).toBeGreaterThanOrEqual(0);
    });

    it('should cap hype at 100', () => {
      const effects: OutcomeEffects = { hype: 150 };
      const updated = CompanyState.applyOutcome(baseCompany, effects);
      expect(updated.hype).toBeLessThanOrEqual(100);
    });

    it('should grant XP and check for level up', () => {
      const effects: OutcomeEffects = { xp: 150 };
      const updated = CompanyState.applyOutcome(baseCompany, effects);
      expect(updated.xp).toBe(150);
      expect(updated.skillPoints).toBeGreaterThanOrEqual(0);
    });

    it('should apply skill points', () => {
      const effects: OutcomeEffects = { skills: { product_engineering: 2 } };
      const updated = CompanyState.applyOutcome(baseCompany, effects);
      expect(updated.skills.product_engineering).toBe(2);
    });
  });
});

