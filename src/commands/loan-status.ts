import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { LoanExamSystem } from '../game/systems/loan-exam-system';
import { LoanSystem } from '../game/systems/loan-system';
import { EmbedUtils } from '../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('loan-status')
  .setDescription('Check your loan exam status and view offers');

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

    if (!session) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('No exam session found. Use /loan-start to begin.')],
        ephemeral: true,
      });
    }

    if (!session.evaluatedAt) {
      // Exam in progress
      const remaining = LoanExamSystem.getRemainingTime(session);
      const answeredCount = session.answers?.length || 0;
      const totalQuestions = session.questions.length;

      if (answeredCount === totalQuestions) {
        // All answers submitted, evaluate
        const result = await LoanExamSystem.evaluateExam(session.sessionId);
        const offers = LoanSystem.generateLoanOffers(result.credentialScore, company);

        const embed = EmbedUtils.createSuccessEmbed('Exam Completed!');
        embed.setDescription(`**Credibility Score:** ${result.credentialScore}/100\n\n**Available Offers:**`);
        
        offers.forEach((offer, i) => {
          const monthlyPayment = LoanSystem.calculateMonthlyPayment({
            loanId: '',
            companyId: company.companyId,
            amount: offer.amount,
            interestRate: offer.interestRate,
            duration: offer.duration,
            dueDate: new Date().toISOString(),
            paidAmount: 0,
            status: 'active',
            credibilityScore: offer.credibilityScore,
            createdAt: new Date().toISOString(),
          });

          let sacrificeText = '';
          if (offer.sacrifice) {
            const sac = offer.sacrifice;
            if (sac.xpPenaltyPercent) sacrificeText += `XP Penalty: ${sac.xpPenaltyPercent}%`;
            if (sac.temporaryRevMultiplier) sacrificeText += ` Revenue: ${(sac.temporaryRevMultiplier * 100).toFixed(0)}%`;
          }

          embed.addFields({
            name: `Offer ${i + 1}`,
            value: `**Amount:** $${offer.amount.toLocaleString()}\n**Interest:** ${(offer.interestRate * 100).toFixed(1)}%\n**Duration:** ${offer.duration} days\n**Monthly Payment:** $${monthlyPayment.toFixed(2)}${sacrificeText ? `\n**Sacrifice:** ${sacrificeText}` : ''}\n\nUse \`/loan-accept offer:${i + 1}\` to accept`,
            inline: false,
          });
        });

        return interaction.reply({ embeds: [embed] });
      } else {
        // Exam in progress
        const embed = EmbedUtils.createSuccessEmbed('Exam In Progress');
        embed.setDescription(`**Progress:** ${answeredCount}/${totalQuestions} questions answered\n**Time Remaining:** ${remaining} minutes\n\nUse \`/loan-answer\` to submit answers.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else {
      // Exam already evaluated
      const offers = LoanSystem.generateLoanOffers(session.credentialScore, company);
      const embed = EmbedUtils.createSuccessEmbed('Loan Offers Available');
      embed.setDescription(`**Credibility Score:** ${session.credentialScore}/100\n\n**Available Offers:**`);

      offers.forEach((offer, i) => {
        embed.addFields({
          name: `Offer ${i + 1}`,
          value: `**Amount:** $${offer.amount.toLocaleString()}\n**Interest:** ${(offer.interestRate * 100).toFixed(1)}%\n**Duration:** ${offer.duration} days\n\nUse \`/loan-accept offer:${i + 1}\` to accept`,
          inline: false,
        });
      });

      return interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error checking loan status:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to check loan status. Please try again.')],
      ephemeral: true,
    });
  }
}

