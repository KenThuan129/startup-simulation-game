import { LoanExamSession } from '../types';
import { DatabaseQueries } from '../../db/queries';
import { LoanExamSystem } from '../systems/loan-exam-system';
import { LoanSystem } from '../systems/loan-system';

/**
 * Scheduled job to evaluate loan exams after submission or expiry
 * This would typically run as a cron job or scheduled task
 * For now, we'll call it manually or trigger it on exam completion
 */
export class LoanScheduler {
  /**
   * Schedule evaluation for a loan exam session
   * In production, this would use a job queue (e.g., Bull, Agenda)
   * For now, we evaluate immediately or after a short delay
   */
  static async scheduleEvaluation(sessionId: string, delayMinutes: number = 5): Promise<void> {
    // In a real implementation, this would schedule a job
    // For now, we'll evaluate immediately if delay is 0 or in dev mode
    if (process.env.NODE_ENV === 'development' || delayMinutes === 0) {
      await this.evaluateSession(sessionId);
    } else {
      // Schedule for later (would use a job queue in production)
      setTimeout(async () => {
        await this.evaluateSession(sessionId);
      }, delayMinutes * 60 * 1000);
    }
  }

  /**
   * Evaluate a loan exam session and generate offers
   */
  private static async evaluateSession(sessionId: string): Promise<void> {
    try {
      const session = await DatabaseQueries.getLoanExamSession(sessionId);
      if (!session || session.evaluatedAt) {
        return; // Already evaluated or doesn't exist
      }

      // Check if expired
      if (new Date() > new Date(session.expiresAt)) {
        // Auto-evaluate expired sessions
        await LoanExamSystem.evaluateExam(sessionId);
      } else {
        // Check if all questions answered
        const allAnswered = session.questions.every(q =>
          session.answers?.some(a => a.questionId === q.questionId)
        );

        if (allAnswered) {
          // Evaluate immediately if all answered
          await LoanExamSystem.evaluateExam(sessionId);
        }
      }
    } catch (error) {
      console.error(`Error evaluating loan exam session ${sessionId}:`, error);
    }
  }

  /**
   * Process expired exam sessions (called periodically)
   */
  static async processExpiredSessions(): Promise<void> {
    // This would query for all unevaluated expired sessions
    // For now, evaluation happens on-demand
  }
}

