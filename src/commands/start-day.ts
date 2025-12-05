import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { ActionSystem } from '../game/actions/action-system';
import { EmbedUtils } from '../utils/embeds';
import { getDifficultyConfig } from '../config/difficulty';
import { AnomalyEngine } from '../game/anomaly/anomaly-engine';
import { BossEngine } from '../game/boss/boss-engine';
import { BroadcastSystem } from '../game/systems/broadcast-system';

export const data = new SlashCommandBuilder()
  .setName('start-day')
  .setDescription('Start a new day and get your daily actions');

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
        embeds: [EmbedUtils.createErrorEmbed('Your company is no longer active. Use /create-startup to start a new one.')],
        ephemeral: true,
      });
    }

    // Check if in break
    if (company.inBreakUntil) {
      const breakUntil = new Date(company.inBreakUntil);
      if (breakUntil > new Date()) {
        const minutesRemaining = Math.ceil((breakUntil.getTime() - Date.now()) / 1000 / 60);
        return interaction.reply({
          embeds: [EmbedUtils.createErrorEmbed(`You are in a break! ${minutesRemaining} minutes remaining.`)],
          ephemeral: true,
        });
      }
    }

    // Check if day already started
    if (company.dailyActions.length > 0 && company.actionPointsRemaining > 0) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('You already have actions for today! Use /action to select one.')],
        ephemeral: true,
      });
    }

    // Roll for daily anomalies
    const anomalyActivations = await AnomalyEngine.rollDailyAnomalies(company);
    let updatedCompany = { ...company };
    
    // Apply anomaly effects
    for (const activation of anomalyActivations) {
      updatedCompany = await AnomalyEngine.applyAnomalyActivation(updatedCompany, activation);
    }

    // Check for boss battle (Day 45)
    if (company.day === 45) {
      const bossBattle = await BossEngine.getOrCreateBossBattle(updatedCompany);
      if (bossBattle) {
        const bossEmbed = EmbedUtils.createWarningEmbed('⚠️ BOSS BATTLE!');
        bossEmbed.setDescription(
          `**${bossBattle.bossName}** has appeared!\n\n` +
          `**Boss Health:** ${bossBattle.bossHealth}/${bossBattle.maxHealth}\n` +
          `**Your Health:** ${bossBattle.playerHealth}\n\n` +
          `Use \`/boss action\` to fight!`
        );
        // Send boss notification as follow-up
        setTimeout(() => {
          interaction.followUp({ embeds: [bossEmbed] }).catch(console.error);
        }, 1000);
      }
    }

    // Generate daily actions
    const difficultyConfig = getDifficultyConfig(updatedCompany.difficulty);
    const dailyActions = await ActionSystem.generateDailyActionSet(updatedCompany.difficulty);
    const actionPointsRemaining = difficultyConfig.actionLimit;

    // Clear break if expired
    const inBreakUntil = updatedCompany.inBreakUntil && new Date(updatedCompany.inBreakUntil) > new Date()
      ? updatedCompany.inBreakUntil
      : null;

    // Update company with new daily actions
    updatedCompany = await DatabaseQueries.updateCompany(updatedCompany.companyId, {
      dailyActions,
      actionPointsRemaining,
      inBreakUntil,
      cash: updatedCompany.cash,
      users: updatedCompany.users,
      quality: updatedCompany.quality,
      hype: updatedCompany.hype,
    });

    // Check for broadcast
    const broadcastUpdate = BroadcastSystem.checkAndStartBroadcast(updatedCompany);
    if (broadcastUpdate) {
      updatedCompany = await DatabaseQueries.updateCompany(updatedCompany.companyId, {
        broadcastId: broadcastUpdate.broadcastId,
        broadcastStartDay: broadcastUpdate.broadcastStartDay,
      });
    }

    // Check if there are pending events from previous day - show them first
    if (updatedCompany.pendingEvents.length > 0) {
      const { EventDataLoader } = await import('../game/data/event-loader');
      const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = await import('discord.js');
      
      const firstEvent = updatedCompany.pendingEvents[0];
      const eventData = EventDataLoader.getEvent(firstEvent.eventId);
      
      const embed = EmbedUtils.createEventEmbed({
        name: eventData?.name || firstEvent.eventId,
        description: eventData?.description || 'Event from previous day',
        choices: firstEvent.choices,
      });

      const choiceButtons = firstEvent.choices.map((choice: any, index: number) =>
        new ButtonBuilder()
          .setCustomId(`choice_select_${firstEvent.eventId}__${choice.choiceId}`)
          .setLabel(choice.label || `Option ${String.fromCharCode(65 + index)}`)
          .setStyle(ButtonStyle.Secondary)
      );

      const row = new ActionRowBuilder().addComponents(choiceButtons);

      return interaction.reply({
        embeds: [embed],
        content: `**📋 Day ${updatedCompany.day} Started!**\n\n**Pending Event from Day ${updatedCompany.day - 1}** - Choose an outcome to continue:`,
        components: [row],
      });
    }

    // No pending events - show normal day start message
    const embed = EmbedUtils.createSuccessEmbed(`Day ${updatedCompany.day} has begun!`);
    let description = `You have **${actionPointsRemaining} action points** remaining.\n\n`;
    
    if (anomalyActivations.length > 0) {
      description += `⚡ **Anomaly:** ${anomalyActivations[0].anomaly.name}\n${anomalyActivations[0].anomaly.description}\n\n`;
    }
    
    // Show broadcast info if active
    if (BroadcastSystem.isBroadcastActive(updatedCompany) && updatedCompany.broadcastId) {
      const broadcast = BroadcastSystem.getBroadcast(updatedCompany.broadcastId);
      const daysRemaining = BroadcastSystem.getDaysRemaining(updatedCompany);
      if (broadcast) {
        description += `📡 **Broadcast:** ${broadcast.name}\n${broadcast.description}\n*${daysRemaining} days remaining*\n\n`;
      }
    }
    
    description += `Use \`/action\` to see available actions.`;
    embed.setDescription(description);

    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error starting day:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to start day. Please try again.')],
      ephemeral: true,
    });
  }
}

