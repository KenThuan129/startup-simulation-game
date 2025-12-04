import { Loan, Company } from '../../db/types';
import { LoanOffer } from '../types';
import { DatabaseQueries } from '../../db/queries';
import { randomUUID } from 'crypto';

export interface LoanOfferWithSacrifice extends LoanOffer {
  sacrifice?: {
    xpPenaltyPercent?: number;
    temporaryRevMultiplier?: number;
    futureEventChanceIncrease?: number;
  };
}

export class LoanSystem {
  static calculateCredibilityScore(company: Company): number {
    let score = 50; // Base score

    // Days survived bonus
    score += company.day * 2;

    // Cash position
    if (company.cash > 10000) score += 20;
    else if (company.cash > 5000) score += 10;
    else if (company.cash < 1000) score -= 20;

    // User base
    if (company.users > 1000) score += 15;
    else if (company.users > 500) score += 10;
    else if (company.users < 100) score -= 10;

    // Quality
    score += Math.floor(company.quality / 5);

    // XP (shows experience)
    score += Math.floor(company.xp / 100);

    // Skills
    const totalSkillLevels = Object.values(company.skills).reduce((a, b) => a + b, 0);
    score += totalSkillLevels * 2;

    return Math.max(0, Math.min(100, score));
  }

  static generateLoanOffers(credibilityScore: number, company?: Company): LoanOfferWithSacrifice[] {
    const offers: LoanOfferWithSacrifice[] = [];

    if (credibilityScore >= 80) {
      offers.push({
        amount: 50000,
        interestRate: 0.05,
        duration: 30,
        credibilityScore,
        sacrifice: {
          xpPenaltyPercent: 5,
          temporaryRevMultiplier: 0.95,
        },
      });
      offers.push({
        amount: 30000,
        interestRate: 0.04,
        duration: 45,
        credibilityScore,
        sacrifice: {
          xpPenaltyPercent: 3,
          temporaryRevMultiplier: 0.97,
        },
      });
    }

    if (credibilityScore >= 60) {
      offers.push({
        amount: 20000,
        interestRate: 0.07,
        duration: 30,
        credibilityScore,
        sacrifice: {
          xpPenaltyPercent: 10,
          temporaryRevMultiplier: 0.90,
          futureEventChanceIncrease: 0.05,
        },
      });
      offers.push({
        amount: 15000,
        interestRate: 0.06,
        duration: 45,
        credibilityScore,
        sacrifice: {
          xpPenaltyPercent: 8,
          temporaryRevMultiplier: 0.92,
        },
      });
    }

    if (credibilityScore >= 40) {
      offers.push({
        amount: 10000,
        interestRate: 0.10,
        duration: 30,
        credibilityScore,
        sacrifice: {
          xpPenaltyPercent: 15,
          temporaryRevMultiplier: 0.85,
          futureEventChanceIncrease: 0.10,
        },
      });
      offers.push({
        amount: 7500,
        interestRate: 0.09,
        duration: 45,
        credibilityScore,
        sacrifice: {
          xpPenaltyPercent: 12,
          temporaryRevMultiplier: 0.88,
        },
      });
    }

    // Always offer at least one option
    if (offers.length === 0) {
      offers.push({
        amount: 5000,
        interestRate: 0.15,
        duration: 30,
        credibilityScore,
        sacrifice: {
          xpPenaltyPercent: 20,
          temporaryRevMultiplier: 0.80,
          futureEventChanceIncrease: 0.15,
        },
      });
    }

    return offers;
  }

  static async createLoan(
    companyId: string,
    offer: LoanOffer
  ): Promise<Loan> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + offer.duration);

    const loanOffer = offer as LoanOfferWithSacrifice;
    const loan: Omit<Loan, 'createdAt'> = {
      loanId: randomUUID(),
      companyId,
      amount: offer.amount,
      interestRate: offer.interestRate,
      duration: offer.duration,
      dueDate: dueDate.toISOString(),
      paidAmount: 0,
      status: 'active',
      credibilityScore: offer.credibilityScore,
      offerType: JSON.stringify(loanOffer.sacrifice || {}),
      acceptedAt: new Date().toISOString(),
      repaymentPlan: 'monthly', // Default to monthly
      sacrifice: loanOffer.sacrifice,
    };

    return DatabaseQueries.createLoan(loan);
  }

  static async getActiveLoans(companyId: string): Promise<Loan[]> {
    return DatabaseQueries.getLoans(companyId);
  }

  static calculateMonthlyPayment(loan: Loan): number {
    const principal = loan.amount - loan.paidAmount;
    const monthlyRate = loan.interestRate / 12;
    const months = loan.duration / 30;
    
    if (months <= 0) return principal;
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
  }

  static async makePayment(companyId: string, loanId: string, amount: number): Promise<Loan> {
    const loans = await DatabaseQueries.getLoans(companyId);
    const loan = loans.find(l => l.loanId === loanId);
    
    if (!loan) throw new Error('Loan not found');

    const newPaidAmount = loan.paidAmount + amount;
    const totalOwed = loan.amount * (1 + loan.interestRate);

    const status = newPaidAmount >= totalOwed ? 'paid' : loan.status;

    return DatabaseQueries.updateLoan(loanId, {
      paidAmount: newPaidAmount,
      status,
    });
  }
}

