import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { LoanExamSystem } from '../game/systems/loan-exam-system';
import { EmbedUtils } from '../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('loan-start')
  .setDescription('Start the loan verification exam (30 minutes, 4 questions)');

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const user = await DatabaseQueries.getUser(interaction.user.id);
    if (!user || !user.activeCompany) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('You need to create a startup first! Use /create-startup')],
        ephemeral: true,
      });
    }

    const company = await DatabaseQueries.getCompany(user.activeCompany);
    if (!company || !company.alive) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Your company is no longer active.')],
        ephemeral: true,
      });
    }

    // Check for existing active session
    const existingSession = await DatabaseQueries.getLoanExamSessionByCompany(company.companyId);
    if (existingSession && !LoanExamSystem.isExamExpired(existingSession)) {
      const remaining = LoanExamSystem.getRemainingTime(existingSession);
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed(`You already have an active exam session! ${remaining} minutes remaining. Use /loan-status to view it.`)],
        ephemeral: true,
      });
    }

    // Start new exam session
    const session = await LoanExamSystem.startExamSession(company.companyId, interaction.user.id);

    // Send questions via DM or ephemeral
    const questionsText = session.questions.map((q, i) => {
      let text = `**Question ${i + 1}:** ${q.question}\n`;
      if (q.type === 'multiple_choice' && q.options) {
        q.options.forEach((opt, idx) => {
          text += `${idx + 1}. ${opt}\n`;
        });
        text += `\nAnswer with: \`/loan-answer question:${q.questionId} answer:<number>\``;
      } else {
        text += `\nAnswer with: \`/loan-answer question:${q.questionId} answer:<your answer>\``;
      }
      return text;
    }).join('\n\n');

    const embed = EmbedUtils.createSuccessEmbed('Loan Exam Started');
    embed.setDescription(`You have **30 minutes** to complete the exam.\n\n${questionsText}\n\nUse \`/loan-status\` to check your progress.`);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Error starting loan exam:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to start loan exam. Please try again.')],
      ephemeral: true,
    });
  }
}

