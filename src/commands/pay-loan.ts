import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { LoanSystem } from '../game/systems/loan-system';
import { LoanProcessor } from '../game/loans/loan-processor';
import { EmbedUtils } from '../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('pay-loan')
  .setDescription('Make a payment on your loan')
  .addStringOption(option =>
    option.setName('loanid')
      .setDescription('Loan ID to pay (optional, will show loans if not provided)')
      .setRequired(false))
  .addNumberOption(option =>
    option.setName('amount')
      .setDescription('Amount to pay')
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

    const loanId = interaction.options.getString('loanid');
    const amount = interaction.options.getNumber('amount');

    if (!loanId || !amount) {
      // Show active loans
      const loans = await LoanSystem.getActiveLoans(company.companyId);

      if (loans.length === 0) {
        return interaction.reply({
          embeds: [EmbedUtils.createErrorEmbed('You have no active loans.')],
          ephemeral: true,
        });
      }

      const embed = EmbedUtils.createSuccessEmbed('Active Loans');
      for (const loan of loans) {
        const monthlyPayment = LoanSystem.calculateMonthlyPayment(loan);
        const totalOwed = loan.amount * (1 + loan.interestRate);
        const remaining = totalOwed - loan.paidAmount;

        embed.addFields({
          name: `Loan ${loan.loanId.substring(0, 8)}...`,
          value: `**Total:** $${loan.amount.toLocaleString()}\n**Paid:** $${loan.paidAmount.toLocaleString()}\n**Remaining:** $${remaining.toFixed(2)}\n**Monthly Payment:** $${monthlyPayment.toFixed(2)}\n\nUse \`/pay-loan loanid:${loan.loanId} amount:<amount>\` to pay`,
          inline: false,
        });
      }

      return interaction.reply({ embeds: [embed] });
    } else {
      // Make payment
      if (amount <= 0) {
        return interaction.reply({
          embeds: [EmbedUtils.createErrorEmbed('Payment amount must be positive.')],
          ephemeral: true,
        });
      }

      if (company.cash < amount) {
        return interaction.reply({
          embeds: [EmbedUtils.createErrorEmbed('Insufficient funds.')],
          ephemeral: true,
        });
      }

      const result = await LoanProcessor.makePayment(company.companyId, loanId, amount);

      // Deduct from company cash
      await DatabaseQueries.updateCompany(company.companyId, {
        cash: company.cash - result.amountPaid,
      });

      const embed = EmbedUtils.createSuccessEmbed('Payment Processed');
      embed.setDescription(
        `**Amount Paid:** $${result.amountPaid.toLocaleString()}\n` +
        `**Remaining Balance:** $${result.remainingBalance.toFixed(2)}` +
        (result.creditScoreChange ? `\n**Credit Score Bonus:** +${result.creditScoreChange}` : '')
      );

      return interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error paying loan:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to process payment. Please try again.')],
      ephemeral: true,
    });
  }
}

