import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { LoanSystem } from '../game/systems/loan-system';
import { EmbedUtils } from '../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('loan')
  .setDescription('Apply for a loan')
  .addStringOption(option =>
    option.setName('offer')
      .setDescription('Loan offer to accept (optional, use /loan first to see offers)')
      .setRequired(false));

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

    const offerIndex = interaction.options.getString('offer');

    if (!offerIndex) {
      // Show loan offers
      const credibilityScore = LoanSystem.calculateCredibilityScore(company);
      const offers = LoanSystem.generateLoanOffers(credibilityScore);

      const embed = EmbedUtils.createSuccessEmbed('Available Loan Offers');
      embed.setDescription(`**Your Credibility Score:** ${credibilityScore}/100\n\n`);

      for (let i = 0; i < offers.length; i++) {
        const offer = offers[i];
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

        embed.addFields({
          name: `Offer ${i + 1}`,
          value: `**Amount:** $${offer.amount.toLocaleString()}\n**Interest:** ${(offer.interestRate * 100).toFixed(1)}%\n**Duration:** ${offer.duration} days\n**Monthly Payment:** $${monthlyPayment.toFixed(2)}\n\nUse \`/loan offer:${i + 1}\` to accept`,
          inline: false,
        });
      }

      return interaction.reply({ embeds: [embed] });
    } else {
      // Accept loan offer
      const credibilityScore = LoanSystem.calculateCredibilityScore(company);
      const offers = LoanSystem.generateLoanOffers(credibilityScore);
      const index = parseInt(offerIndex.replace('offer:', '')) - 1;

      if (index < 0 || index >= offers.length) {
        return interaction.reply({
          embeds: [EmbedUtils.createErrorEmbed('Invalid offer index.')],
          ephemeral: true,
        });
      }

      const offer = offers[index];
      const loan = await LoanSystem.createLoan(company.companyId, offer);

      // Add cash to company
      await DatabaseQueries.updateCompany(company.companyId, {
        cash: company.cash + offer.amount,
        loans: [...company.loans, loan.loanId],
      });

      return interaction.reply({
        embeds: [EmbedUtils.createSuccessEmbed(`Loan approved! You received $${offer.amount.toLocaleString()}. Use /pay-loan to make payments.`)],
      });
    }
  } catch (error) {
    console.error('Error processing loan:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to process loan. Please try again.')],
      ephemeral: true,
    });
  }
}

