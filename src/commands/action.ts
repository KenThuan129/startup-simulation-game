import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { ActionSystem } from '../game/actions/action-system';
import { EventEngine } from '../game/events/event-engine';
import { ActionDataLoader } from '../game/data/action-loader';
import { EventDataLoader } from '../game/data/event-loader';
import { EmbedUtils } from '../utils/embeds';
import { CompanyState } from '../game/state/company-state';

export const data = new SlashCommandBuilder()
  .setName('action')
  .setDescription('View available actions or select an action to take')
  .addStringOption(option =>
    option.setName('actionid')
      .setDescription('The ID of the action to take (optional - omit to see list)')
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

    // Check if there are pending events that need to be resolved first
    if (company.pendingEvents.length > 0) {
      const { EventDataLoader } = await import('../game/data/event-loader');
      const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = await import('discord.js');
      
      const firstEvent = company.pendingEvents[0];
      const eventData = EventDataLoader.getEvent(firstEvent.eventId);
      
      const embed = EmbedUtils.createEventEmbed({
        name: eventData?.name || firstEvent.eventId,
        description: eventData?.description || 'Pending event',
        choices: firstEvent.choices,
      });

      const choiceButtons = firstEvent.choices.map((choice: any, index: number) =>
        new ButtonBuilder()
          .setCustomId(`choice_select_${firstEvent.eventId}__${choice.choiceId}`)
          .setLabel(choice.label || `Option ${String.fromCharCode(65 + index)}`)
          .setStyle(ButtonStyle.Secondary)
      );

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(choiceButtons);

      return interaction.reply({
        embeds: [embed],
        content: `**📋 You have ${company.pendingEvents.length} pending event${company.pendingEvents.length > 1 ? 's' : ''} to resolve first!**\n\nChoose an outcome to continue:`,
        components: [row],
        ephemeral: true,
      });
    }

    const actionId = interaction.options.getString('actionid');

    // If no actionId provided, show list of available actions with buttons
    if (!actionId) {
      const availableActions = company.dailyActions.filter(a => !a.selected);
      
      if (availableActions.length === 0) {
        return interaction.reply({
          embeds: [EmbedUtils.createErrorEmbed('No actions available. Use /start-day to get new actions.')],
          ephemeral: true,
        });
      }

      const embed = EmbedUtils.createInfoEmbed('Available Actions');
      embed.setDescription(`You have **${company.actionPointsRemaining}** action points remaining.\n\nSelect an action below:`);
      
      // Create buttons for actions (max 5 buttons per row, Discord limit)
      if (availableActions.length <= 5) {
        // Use buttons for 5 or fewer actions
        const buttons = availableActions.map(action => 
          new ButtonBuilder()
            .setCustomId(`action_select_${action.actionId}`)
            .setLabel(action.name.length > 80 ? action.name.substring(0, 77) + '...' : action.name)
            .setStyle(ButtonStyle.Primary)
        );
        
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
        
        return interaction.reply({ 
          embeds: [embed],
          components: [row],
          ephemeral: true,
        });
      } else {
        // Use select menu for more than 5 actions
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('action_select_menu')
          .setPlaceholder('Choose an action...')
          .addOptions(
            availableActions.map(action => 
              new StringSelectMenuOptionBuilder()
                .setLabel(action.name.length > 100 ? action.name.substring(0, 97) + '...' : action.name)
                .setDescription(action.description.length > 100 ? action.description.substring(0, 97) + '...' : action.description)
                .setValue(action.actionId)
            )
          );
        
        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
        
        return interaction.reply({ 
          embeds: [embed],
          components: [row],
          ephemeral: true,
        });
      }
    }

    // Check if action exists and is available
    const action = ActionSystem.findAction(company.dailyActions, actionId);
    if (!action) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Action not found or not available today.')],
        ephemeral: true,
      });
    }

    if (action.selected) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('You have already selected this action.')],
        ephemeral: true,
      });
    }

    if (!ActionSystem.canSelectAction(company)) {
      // Set break timer (30 minutes)
      const breakUntil = new Date();
      breakUntil.setMinutes(breakUntil.getMinutes() + 30);
      
      await DatabaseQueries.updateCompany(company.companyId, {
        actionPointsRemaining: 0,
        inBreakUntil: breakUntil.toISOString(),
      });

      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('You have no action points remaining. You are now in a 30-minute break. Use /end-day to process the day.')],
        ephemeral: true,
      });
    }

    // Get action data to find event pool
    const actionData = await ActionDataLoader.getAction(actionId);
    if (!actionData) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Action data not found.')],
        ephemeral: true,
      });
    }

    // Generate events from action
    const eventCount = Math.floor(Math.random() * 3) + 1; // 1-3 events
    const events = await EventEngine.generateEventsFromAction(
      actionId,
      actionData.eventPool,
      eventCount
    );

    if (events.length === 0) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('No events available for this action.')],
        ephemeral: true,
      });
    }

    // Get action weight (default 1 if not specified)
    const actionWeight = actionData.weight || 1;
    
    // Check if company has enough action points
    if (company.actionPointsRemaining < actionWeight) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed(`This action requires ${actionWeight} action point(s), but you only have ${company.actionPointsRemaining} remaining.`)],
        ephemeral: true,
      });
    }
    
    // Mark action as selected and add events
    let updatedCompany = CompanyState.markActionSelected(company, actionId, actionWeight);
    for (const event of events) {
      updatedCompany = CompanyState.addPendingEvent(updatedCompany, event);
    }

    // Set break if no action points remaining
    let inBreakUntil = updatedCompany.inBreakUntil;
    if (updatedCompany.actionPointsRemaining === 0) {
      const breakTime = new Date();
      breakTime.setMinutes(breakTime.getMinutes() + 30);
      inBreakUntil = breakTime.toISOString();
    }

    await DatabaseQueries.updateCompany(company.companyId, {
      dailyActions: updatedCompany.dailyActions,
      actionPointsRemaining: updatedCompany.actionPointsRemaining,
      pendingEvents: updatedCompany.pendingEvents,
      inBreakUntil,
    });

    // Show first event
    const firstEvent = events[0];
    const eventData = EventDataLoader.getEvent(firstEvent.eventId);
    
    const embed = EmbedUtils.createEventEmbed({
      name: eventData?.name || firstEvent.eventId,
      description: eventData?.description || `Event from action: ${action.name}`,
      choices: firstEvent.choices,
    });

    return interaction.reply({
      embeds: [embed],
      content: `**Action Selected:** ${action.name}\n\nChoose an outcome using \`/choose <choiceId>\``,
    });
  } catch (error) {
    console.error('Error selecting action:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to select action. Please try again.')],
      ephemeral: true,
    });
  }
}

