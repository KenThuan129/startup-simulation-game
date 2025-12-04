import { Loan, Company } from '../../db/types';
import { DatabaseQueries } from '../../db/queries';
import { LoanSystem } from '../systems/loan-system';
import { CompanyState } from '../state/company-state';
import { AnomalySystem } from '../systems/anomaly-system';

export interface RepaymentResult {
  success: boolean;
  amountPaid: number;
  remainingBalance: number;
  penaltyApplied?: boolean;
  penaltyAmount?: number;
  creditScoreChange?: number;
}

export class LoanProcessor {
  /**
   * Process daily loan repayments and penalties
   * Called during daily tick
   */
  static async processDailyLoanRepayments(company: Company): Promise<Company> {
    let updatedCompany = { ...company };
    const activeLoans = await LoanSystem.getActiveLoans(company.companyId);

    for (const loan of activeLoans) {
      if (loan.status !== 'active') continue;

      // Check if payment is due
      const today = new Date();
      const dueDate = new Date(loan.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue > 0) {
        // Apply late payment penalty
        const penalty = this.calculatePenalty(loan, daysOverdue);
        updatedCompany.cash = Math.max(0, updatedCompany.cash - penalty);

        // Spawn penalty event/anomaly
        if (penalty > 0 && Math.random() < 0.3) {
          const anomaly = await AnomalySystem.generateAnomaly(updatedCompany, ['loan', 'penalty']);
          if (anomaly) {
            updatedCompany = await AnomalySystem.applyAnomaly(updatedCompany, anomaly);
          }
        }

        // Update loan credit score (decrease)
        await DatabaseQueries.updateLoan(loan.loanId, {
          credibilityScore: Math.max(0, (loan.credibilityScore || 50) - Math.min(5, daysOverdue)),
        });
      }

      // Attempt automatic payment if company has sufficient cash
      const monthlyPayment = LoanSystem.calculateMonthlyPayment(loan);
      if (updatedCompany.cash >= monthlyPayment && daysOverdue <= 7) {
        const result = await this.makePayment(company.companyId, loan.loanId, monthlyPayment);
        if (result.success) {
          updatedCompany.cash -= result.amountPaid;
        }
      }
    }

    return updatedCompany;
  }

  /**
   * Make a loan payment
   */
  static async makePayment(
    companyId: string,
    loanId: string,
    amount: number
  ): Promise<RepaymentResult> {
    const loans = await LoanSystem.getActiveLoans(companyId);
    const loan = loans.find(l => l.loanId === loanId);

    if (!loan) {
      throw new Error('Loan not found');
    }

    const totalOwed = loan.amount * (1 + loan.interestRate);
    const newPaidAmount = Math.min(totalOwed, loan.paidAmount + amount);
    const remainingBalance = totalOwed - newPaidAmount;

    const isFullyPaid = newPaidAmount >= totalOwed;
    const status = isFullyPaid ? 'paid' : loan.status;

    await DatabaseQueries.updateLoan(loanId, {
      paidAmount: newPaidAmount,
      status,
    });

    // Early repayment bonus (if paid off early)
    let creditScoreChange = 0;
    if (isFullyPaid) {
      const daysRemaining = Math.floor((new Date(loan.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysRemaining > 0) {
        creditScoreChange = Math.min(10, Math.floor(daysRemaining / 3)); // Bonus for early repayment
      }
    }

    return {
      success: true,
      amountPaid: amount,
      remainingBalance,
      creditScoreChange,
    };
  }

  /**
   * Calculate penalty for overdue loans
   */
  private static calculatePenalty(loan: Loan, daysOverdue: number): number {
    // 1% of loan amount per day overdue, capped at 20%
    const penaltyRate = Math.min(0.20, daysOverdue * 0.01);
    return loan.amount * penaltyRate;
  }

  /**
   * Process loan sacrifice effects (XP penalty, revenue multiplier, etc.)
   */
  static applyLoanSacrificeEffects(company: Company, loan: Loan): Company {
    let updated = { ...company };

    if (loan.sacrifice) {
      // XP penalty
      if (loan.sacrifice.xpPenaltyPercent) {
        const xpPenalty = Math.floor(updated.xp * (loan.sacrifice.xpPenaltyPercent / 100));
        updated.xp = Math.max(0, updated.xp - xpPenalty);
      }

      // Set loan effect duration
      if (loan.sacrifice.temporaryRevMultiplier || loan.sacrifice.futureEventChanceIncrease) {
        updated.loanEffectDuration = loan.duration; // Effect lasts for loan duration
      }
    }

    return updated;
  }

  /**
   * Check if loan sacrifice effects are active
   */
  static hasActiveLoanEffects(company: Company): boolean {
    return (company.loanEffectDuration || 0) > 0;
  }

  /**
   * Decrement loan effect duration (called daily)
   */
  static decrementLoanEffectDuration(company: Company): Company {
    if (company.loanEffectDuration && company.loanEffectDuration > 0) {
      return {
        ...company,
        loanEffectDuration: company.loanEffectDuration - 1,
      };
    }
    return company;
  }
}

