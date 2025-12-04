import { LoanExamSession, LoanExamQuestion } from '../types';
import { DatabaseQueries } from '../../db/queries';
import { Company } from '../../db/types';
import { randomUUID } from 'crypto';

export interface LoanExamResult {
  credentialScore: number;
  answerCorrectness: number;
  averageResponseTime: number;
  companyMetricsScore: number;
}

export class LoanExamSystem {
  // Generate exam questions
  static generateQuestions(): LoanExamQuestion[] {
    return [
      {
        questionId: 'q1',
        type: 'multiple_choice',
        question: 'What is the primary metric for measuring startup health?',
        options: ['Cash flow', 'User growth', 'Revenue', 'All of the above'],
        correctAnswer: 3, // All of the above
      },
      {
        questionId: 'q2',
        type: 'multiple_choice',
        question: 'When should a startup consider taking a loan?',
        options: ['When cash is negative', 'For growth opportunities', 'To cover operational costs', 'All of the above'],
        correctAnswer: 3,
      },
      {
        questionId: 'q3',
        type: 'short_answer',
        question: 'What is your primary revenue model? (Answer in 1-2 sentences)',
        correctKeywords: ['revenue', 'model', 'monetization', 'income'],
      },
      {
        questionId: 'q4',
        type: 'multiple_choice',
        question: 'How do you plan to use the loan funds?',
        options: ['Marketing and growth', 'Product development', 'Operations and hiring', 'Strategic investment'],
        correctAnswer: -1, // Multiple valid answers
      },
    ];
  }

  // Start exam session
  static async startExamSession(
    companyId: string,
    userId: string
  ): Promise<LoanExamSession> {
    const sessionId = randomUUID();
    const questions = this.generateQuestions();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes

    const session: LoanExamSession = {
      sessionId,
      companyId,
      userId,
      questions,
      answers: [],
      startedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      evaluatedAt: null,
      result: null,
      credentialScore: 0,
    };

    await DatabaseQueries.createLoanExamSession(session);
    return session;
  }

  // Submit answer
  static async submitAnswer(
    sessionId: string,
    questionId: string,
    answer: string | number
  ): Promise<LoanExamSession> {
    const session = await DatabaseQueries.getLoanExamSession(sessionId);
    if (!session) throw new Error('Session not found');

    if (new Date() > new Date(session.expiresAt)) {
      throw new Error('Exam session has expired');
    }

    const updatedAnswers = [...(session.answers || [])];
    const existingIndex = updatedAnswers.findIndex(a => a.questionId === questionId);
    
    const answerData = {
      questionId,
      answer,
      submittedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      updatedAnswers[existingIndex] = answerData;
    } else {
      updatedAnswers.push(answerData);
    }

    return DatabaseQueries.updateLoanExamSession(sessionId, {
      answers: updatedAnswers,
    });
  }

  // Evaluate exam
  static async evaluateExam(sessionId: string): Promise<LoanExamResult> {
    const session = await DatabaseQueries.getLoanExamSession(sessionId);
    if (!session) throw new Error('Session not found');

    const company = await DatabaseQueries.getCompany(session.companyId);
    if (!company) throw new Error('Company not found');

    // Calculate answer correctness
    let correctAnswers = 0;
    let totalQuestions = session.questions.length;
    const responseTimes: number[] = [];

    for (let i = 0; i < session.questions.length; i++) {
      const question = session.questions[i];
      const answer = session.answers?.find(a => a.questionId === question.questionId);
      
      if (!answer) continue;

      // Calculate response time (simplified - would use actual timestamps in production)
      const startTime = new Date(session.startedAt).getTime();
      const submitTime = new Date(answer.submittedAt).getTime();
      responseTimes.push((submitTime - startTime) / 1000 / 60); // minutes

      if (question.type === 'multiple_choice') {
        if (question.correctAnswer === -1 || answer.answer === question.correctAnswer) {
          correctAnswers++;
        }
      } else if (question.type === 'short_answer') {
        const answerText = String(answer.answer).toLowerCase();
        const hasKeywords = question.correctKeywords?.some(keyword =>
          answerText.includes(keyword.toLowerCase())
        );
        if (hasKeywords) correctAnswers++;
      }
    }

    const answerCorrectness = (correctAnswers / totalQuestions) * 100;
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 30; // Default to max time if no answers

    // Calculate company metrics score
    const companyMetricsScore = this.calculateCompanyMetricsScore(company);

    // Calculate credential score (0-100)
    const credentialScore = Math.min(100, Math.max(0,
      answerCorrectness * 0.4 + // 40% from answers
      (30 - Math.min(30, averageResponseTime)) / 30 * 100 * 0.2 + // 20% from speed (faster = better)
      companyMetricsScore * 0.4 // 40% from company metrics
    ));

    const result: LoanExamResult = {
      credentialScore: Math.round(credentialScore),
      answerCorrectness,
      averageResponseTime,
      companyMetricsScore,
    };

    await DatabaseQueries.updateLoanExamSession(sessionId, {
      evaluatedAt: new Date().toISOString(),
      result,
      credentialScore: result.credentialScore,
    });

    return result;
  }

  // Calculate company metrics score (0-100)
  private static calculateCompanyMetricsScore(company: Company): number {
    let score = 50; // Base score

    // Cash position (0-25 points)
    if (company.cash > 10000) score += 25;
    else if (company.cash > 5000) score += 15;
    else if (company.cash > 1000) score += 5;
    else if (company.cash < 0) score -= 20;

    // User base (0-25 points)
    if (company.users > 1000) score += 25;
    else if (company.users > 500) score += 15;
    else if (company.users > 100) score += 10;
    else if (company.users < 50) score -= 10;

    // XP/Experience (0-20 points)
    score += Math.min(20, Math.floor(company.xp / 100));

    // Days survived (0-15 points)
    score += Math.min(15, company.day * 0.2);

    // Quality (0-15 points)
    score += Math.floor(company.quality / 10);

    return Math.min(100, Math.max(0, score));
  }

  // Check if exam is expired
  static isExamExpired(session: LoanExamSession): boolean {
    return new Date() > new Date(session.expiresAt);
  }

  // Get remaining time in minutes
  static getRemainingTime(session: LoanExamSession): number {
    const now = new Date().getTime();
    const expires = new Date(session.expiresAt).getTime();
    return Math.max(0, Math.floor((expires - now) / 1000 / 60));
  }
}

