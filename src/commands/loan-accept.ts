import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { LoanSystem, LoanOfferWithSacrifice } from '../game/systems/loan-system';
import { LoanProcessor } from '../game/loans/loan-processor';
import { LoanExamSystem } from '../game/systems/loan-exam-system';
import { EmbedUtils } from '../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('loan-accept')
  .setDescription('Accept a loan offer')
  .addStringOption(option =>
    option.setName('offer')
      .setDescription('Offer number to accept (e.g., 1)')
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
    if (!company || !company.alive) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Your company is no longer active.')],
        ephemeral: true,
      });
    }

    // Check if exam completed
    const session = await DatabaseQueries.getLoanExamSessionByCompany(company.companyId);
    if (!session || !session.evaluatedAt) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('You must complete the loan exam first. Use /loan-start to begin.')],
        ephemeral: true,
      });
    }

    const offerIndex = parseInt(interaction.options.getString('offer', true)) - 1;
    const offers = LoanSystem.generateLoanOffers(session.credentialScore, company);

    if (offerIndex < 0 || offerIndex >= offers.length) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Invalid offer index.')],
        ephemeral: true,
      });
    }

    const offer = offers[offerIndex] as LoanOfferWithSacrifice;
    
    // Check if already has active loan (one lifeline per run)
    const activeLoans = await LoanSystem.getActiveLoans(company.companyId);
    if (activeLoans.length > 0 && !company.survivalLifelineUsed) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('You already have an active loan. Pay it off first.')],
        ephemeral: true,
      });
    }

    const loan = await LoanSystem.createLoan(company.companyId, offer);

    // Apply sacrifice effects
    let updatedCompany = LoanProcessor.applyLoanSacrificeEffects(company, loan);

    // Add cash to company
    updatedCompany.cash += offer.amount;
    updatedCompany.loans = [...updatedCompany.loans, loan.loanId];
    updatedCompany.loanLifelineUsed = true;
    updatedCompany.survivalLifelineUsed = true;

    await DatabaseQueries.updateCompany(company.companyId, {
      cash: updatedCompany.cash,
      loans: updatedCompany.loans,
      loanLifelineUsed: updatedCompany.loanLifelineUsed,
      survivalLifelineUsed: updatedCompany.survivalLifelineUsed,
      loanEffectDuration: updatedCompany.loanEffectDuration,
      xp: updatedCompany.xp,
    });

    let sacrificeText = '';
    if (offer.sacrifice) {
      const sac = offer.sacrifice;
      if (sac.xpPenaltyPercent) sacrificeText += `\n⚠️ XP Penalty: ${sac.xpPenaltyPercent}%`;
      if (sac.temporaryRevMultiplier) sacrificeText += `\n⚠️ Revenue Multiplier: ${(sac.temporaryRevMultiplier * 100).toFixed(0)}%`;
      if (sac.futureEventChanceIncrease) sacrificeText += `\n⚠️ Event Chance Increase: +${(sac.futureEventChanceIncrease * 100).toFixed(0)}%`;
    }

    return interaction.reply({
      embeds: [EmbedUtils.createSuccessEmbed(`Loan accepted! You received $${offer.amount.toLocaleString()}.${sacrificeText}\n\nUse /pay-loan to make payments.`)],
    });
  } catch (error) {
    console.error('Error accepting loan:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to accept loan. Please try again.')],
      ephemeral: true,
    });
  }
}

