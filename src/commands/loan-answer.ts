import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { LoanExamSystem } from '../game/systems/loan-exam-system';
import { EmbedUtils } from '../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('loan-answer')
  .setDescription('Submit an answer for the loan exam')
  .addStringOption(option =>
    option.setName('question')
      .setDescription('Question ID (e.g., q1)')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('answer')
      .setDescription('Your answer (number for multiple choice, text for short answer)')
      .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const user = await DatabaseQueries.getUser(interaction.user.id);
    if (!user || !user.activeCompany) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('You need to create a startup first!')],
        ephemeral: true,
      });
    }

    const company = await DatabaseQueries.getCompany(user.activeCompany);
    if (!company) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }

    const session = await DatabaseQueries.getLoanExamSessionByCompany(company.companyId);
    if (!session || LoanExamSystem.isExamExpired(session)) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('No active exam session found. Use /loan-start to begin.')],
        ephemeral: true,
      });
    }

    const questionId = interaction.options.getString('question', true);
    const answerInput = interaction.options.getString('answer', true);

    // Parse answer (number for multiple choice, string for short answer)
    const question = session.questions.find(q => q.questionId === questionId);
    if (!question) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Question not found.')],
        ephemeral: true,
      });
    }

    const answer = question.type === 'multiple_choice'
      ? parseInt(answerInput, 10) - 1 // Convert 1-based to 0-based
      : answerInput;

    const updatedSession = await LoanExamSystem.submitAnswer(session.sessionId, questionId, answer);

    const remaining = LoanExamSystem.getRemainingTime(updatedSession);
    const answeredCount = updatedSession.answers?.length || 0;
    const allAnswered = updatedSession.questions.every(q =>
      updatedSession.answers?.some(a => a.questionId === q.questionId)
    );

    // Auto-evaluate if all questions answered
    if (allAnswered) {
      const { LoanScheduler } = require('../game/loans/loan-scheduler');
      await LoanScheduler.scheduleEvaluation(updatedSession.sessionId, 0); // Evaluate immediately
      
      return interaction.reply({
        embeds: [EmbedUtils.createSuccessEmbed(`All answers submitted! Evaluation in progress... Use /loan-status to see your offers.`)],
        ephemeral: true,
      });
    }

    return interaction.reply({
      embeds: [EmbedUtils.createSuccessEmbed(`Answer submitted! (${answeredCount}/${updatedSession.questions.length} answered, ${remaining} min remaining)`)],
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to submit answer. Please try again.')],
      ephemeral: true,
    });
  }
}

