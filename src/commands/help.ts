import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show help information about the game');

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('🎮 Startup Simulation Game - Help')
    .setColor(0x0099ff)
    .setDescription('Welcome to the Startup Simulation Game!')
    .addFields(
      { name: '/create-startup', value: 'Create a new startup company', inline: false },
      { name: '/start-day', value: 'Start a new day and get your daily actions', inline: false },
      { name: '/action <actionId>', value: 'Select an action to take', inline: false },
      { name: '/choose <choiceId>', value: 'Choose an outcome for a pending event', inline: false },
      { name: '/end-day', value: 'End the current day and process daily tick', inline: false },
      { name: '/stats', value: 'View your company statistics', inline: false },
      { name: '/skill-tree [skillId]', value: 'View and upgrade your skill tree', inline: false },
      { name: '/loan [offer]', value: 'Apply for a loan or view loan offers', inline: false },
      { name: '/pay-loan [loanId] [amount]', value: 'Make a payment on your loan', inline: false },
      { name: '/reset', value: 'Reset your current company', inline: false },
      { name: '/help', value: 'Show this help message', inline: false }
    )
    .setFooter({ text: 'Survive 90 days to win!' });

  return interaction.reply({ embeds: [embed] });
}

