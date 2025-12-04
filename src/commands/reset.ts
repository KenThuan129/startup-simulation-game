import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { EmbedUtils } from '../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('reset')
  .setDescription('Reset your current company and start over');

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const user = await DatabaseQueries.getUser(interaction.user.id);
    if (!user || !user.activeCompany) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('You have no active company to reset.')],
        ephemeral: true,
      });
    }

    // Update user to remove active company
    await DatabaseQueries.updateUser(interaction.user.id, {
      activeCompany: null,
    });

    return interaction.reply({
      embeds: [EmbedUtils.createSuccessEmbed('Company reset! Use /create-startup to create a new one.')],
    });
  } catch (error) {
    console.error('Error resetting company:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to reset company. Please try again.')],
      ephemeral: true,
    });
  }
}

