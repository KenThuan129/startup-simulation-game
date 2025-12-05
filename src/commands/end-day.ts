import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { DailyTickSystem } from '../game/systems/daily-tick-system';
import { CompanyState } from '../game/state/company-state';
import { EmbedUtils } from '../utils/embeds';
import { gameConfig } from '../config/bot.config';
import { BossSystem } from '../game/systems/boss-system';

export const data = new SlashCommandBuilder()
  .setName('end-day')
  .setDescription('End the current day and process daily tick');

export async function execute(interaction: ChatInputCommandInteraction) {
  // Defer reply immediately to prevent interaction timeout
  await interaction.deferReply({ ephemeral: true });

  try {
    const user = await DatabaseQueries.getUser(interaction.user.id);
    if (!user || !user.activeCompany) {
      return interaction.editReply({
        embeds: [EmbedUtils.createErrorEmbed('You need to create a startup first! Use /create-startup')],
      });
    }

    let company = await DatabaseQueries.getCompany(user.activeCompany);
    if (!company || !company.alive) {
      return interaction.editReply({
        embeds: [EmbedUtils.createErrorEmbed('Your company is no longer active.')],
      });
    }

    // Check if there are pending events
    // Allow ending day if action points are 0 (player exhausted all actions)
    // Pending events will be carried over to the next day
    if (company.pendingEvents.length > 0 && company.actionPointsRemaining > 0) {
      return interaction.editReply({
        embeds: [EmbedUtils.createErrorEmbed('You have pending events! Use /choose to resolve them first.')],
      });
    }

    // Note: Pending events are now carried over to the next day instead of auto-resolving
    // They will be shown first when starting the next day

    // Process daily tick
    let updatedCompany = await DailyTickSystem.processDailyTick(company);

    // Check for boss fight
    if (BossSystem.isBossFightDay(company.day)) {
      // Boss fight logic would go here
      // For now, just increment day
    }

    // Increment day
    updatedCompany = { ...updatedCompany, day: updatedCompany.day + 1 };

    // Clear daily actions and set break if actions weren't all used
    const breakUntil = company.actionPointsRemaining > 0
      ? (() => {
          const breakTime = new Date();
          breakTime.setMinutes(breakTime.getMinutes() + 30);
          return breakTime.toISOString();
        })()
      : null;

    updatedCompany = {
      ...updatedCompany,
      dailyActions: [],
      actionPointsRemaining: 0,
      inBreakUntil: breakUntil,
      // Keep pending events - they will be shown first when starting the next day
    };

    // Snapshot stats
    updatedCompany = CompanyState.snapshotStats(updatedCompany);

    // Check win/lose conditions
    if (updatedCompany.day > gameConfig.maxDay && updatedCompany.alive) {
      updatedCompany.alive = false; // Win condition - survived 90 days
    }

    // Save company (keep pendingEvents to carry over to next day)
    await DatabaseQueries.updateCompany(company.companyId, {
      day: updatedCompany.day,
      cash: updatedCompany.cash,
      users: updatedCompany.users,
      quality: updatedCompany.quality,
      hype: updatedCompany.hype,
      virality: updatedCompany.virality,
      dailyActions: updatedCompany.dailyActions,
      actionPointsRemaining: updatedCompany.actionPointsRemaining,
      pendingEvents: updatedCompany.pendingEvents, // Carry over to next day
      statsHistory: updatedCompany.statsHistory,
      alive: updatedCompany.alive,
    });

    const embed = EmbedUtils.createCompanyStatsEmbed(updatedCompany);
    let description = `**Day ${company.day} Complete!**\n\n`;

    // Show message if there are pending events to resolve next day
    if (company.pendingEvents.length > 0) {
      description += `📋 **Note:** You have ${company.pendingEvents.length} pending event${company.pendingEvents.length > 1 ? 's' : ''} that will be shown first when you start the next day.\n\n`;
    }

    if (!updatedCompany.alive) {
      if (updatedCompany.day > gameConfig.maxDay) {
        description += '🎉 **CONGRATULATIONS!** You survived 90 days!\n';
      } else {
        description += '💀 **GAME OVER** - Your company has failed.\n';
      }
    } else {
      description += `**Day ${updatedCompany.day}** begins tomorrow. Use \`/start-day\` to continue!`;
    }

    embed.setDescription(description);

    return interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error ending day:', error);
    try {
      return interaction.editReply({
        embeds: [EmbedUtils.createErrorEmbed('Failed to end day. Please try again.')],
      });
    } catch (editError) {
      // If edit fails, try followUp
      return interaction.followUp({
        embeds: [EmbedUtils.createErrorEmbed('Failed to end day. Please try again.')],
        ephemeral: true,
      });
    }
  }
}

