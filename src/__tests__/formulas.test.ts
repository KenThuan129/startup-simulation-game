import { Formulas } from '../game/systems/formulas';
import { getDifficultyConfig } from '../config/difficulty';
import { Company } from '../db/types';

describe('Formulas', () => {
  describe('computeRevenuePerUser', () => {
    it('should return base revenue at quality 50', () => {
      const rev = Formulas.computeRevenuePerUser(50);
      expect(rev).toBeGreaterThan(0.2);
      expect(rev).toBeLessThan(0.6);
    });

    it('should scale with quality', () => {
      const rev50 = Formulas.computeRevenuePerUser(50);
      const rev100 = Formulas.computeRevenuePerUser(100);
      expect(rev100).toBeGreaterThan(rev50);
    });
  });

  describe('computeRetention', () => {
    it('should return retention between 0.5 and 0.98', () => {
      const retention = Formulas.computeRetention(50, getDifficultyConfig('normal'));
      expect(retention).toBeGreaterThanOrEqual(0.5);
      expect(retention).toBeLessThanOrEqual(0.98);
    });

    it('should apply difficulty bonuses', () => {
      const easyRetention = Formulas.computeRetention(50, getDifficultyConfig('easy'));
      const hardRetention = Formulas.computeRetention(50, getDifficultyConfig('hard'));
      expect(easyRetention).toBeGreaterThan(hardRetention);
    });
  });

  describe('computeChurn', () => {
    it('should return churn as inverse of retention', () => {
      const retention = Formulas.computeRetention(50, getDifficultyConfig('normal'));
      const churn = Formulas.computeChurn(50, getDifficultyConfig('normal'));
      expect(churn).toBeCloseTo(1 - retention, 2);
    });
  });

  describe('checkBankruptcy', () => {
    const baseCompany: Company = {
      companyId: 'test',
      ownerId: 'test',
      name: 'Test',
      type: 'saas',
      goals: [],
      difficulty: 'normal',
      day: 1,
      cash: 0,
      users: 10,
      quality: 50,
      hype: 0,
      virality: 0,
      skillPoints: 0,
      skills: {},
      xp: 0,
      level: 1,
      dailyActions: [],
      pendingEvents: [],
      actionPointsRemaining: 0,
      loans: [],
      alive: true,
      statsHistory: [],
      inBreakUntil: null,
      loanLifelineUsed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should not bankrupt with positive cash', () => {
      const company = { ...baseCompany, cash: 1000 };
      const dailyBurn = 100;
      const difficultyConfig = getDifficultyConfig('normal');
      const bankrupt = Formulas.checkBankruptcy(company, dailyBurn, difficultyConfig, false);
      expect(bankrupt).toBe(false);
    });

    it('should bankrupt with severe negative cash and no lifeline', () => {
      const company = { ...baseCompany, cash: -10000 };
      const dailyBurn = 100;
      const difficultyConfig = getDifficultyConfig('normal');
      const bankrupt = Formulas.checkBankruptcy(company, dailyBurn, difficultyConfig, false);
      expect(bankrupt).toBe(true);
    });

    it('should check minimum users floor', () => {
      const company = { ...baseCompany, users: 3, cash: 1000 };
      const dailyBurn = 100;
      const difficultyConfig = getDifficultyConfig('normal');
      const bankrupt = Formulas.checkBankruptcy(company, dailyBurn, difficultyConfig, false);
      expect(bankrupt).toBe(true);
    });
  });
});

