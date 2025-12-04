import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { EmbedUtils } from '../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('loan-decline')
  .setDescription('Decline all loan offers');

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const user = await DatabaseQueries.getUser(interaction.user.id);
    if (!user || !user.activeCompany) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('You need to create a startup first!')],
        ephemeral: true,
      });
    }

    return interaction.reply({
      embeds: [EmbedUtils.createSuccessEmbed('Loan offers declined. You can start a new exam anytime with /loan-start.')],
    });
  } catch (error) {
    console.error('Error declining loan:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to decline loan. Please try again.')],
      ephemeral: true,
    });
  }
}

