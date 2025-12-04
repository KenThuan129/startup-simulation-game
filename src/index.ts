// Load environment variables FIRST before importing anything that uses them
// Use require() to ensure it executes before ES6 imports
require('dotenv').config();

import { Client, GatewayIntentBits, Collection, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { botConfig } from './config/bot.config';
import { DatabaseQueries } from './db/queries';
import { ActionSystem } from './game/actions/action-system';
import { EventEngine } from './game/events/event-engine';
import { ActionDataLoader } from './game/data/action-loader';
import { EventDataLoader } from './game/data/event-loader';
import { EmbedUtils } from './utils/embeds';
import { CompanyState } from './game/state/company-state';
import { AnomalySystem } from './game/systems/anomaly-system';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Command collection
client.commands = new Collection();

// Load commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Register slash commands
async function registerCommands() {
  const commands = [];
  
  for (const [name, command] of client.commands) {
    commands.push(command.data.toJSON());
  }

  const rest = new REST().setToken(botConfig.token);

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // Use guild commands if guildId is provided, otherwise use global commands
    const route = botConfig.guildId
      ? Routes.applicationGuildCommands(botConfig.clientId, botConfig.guildId)
      : Routes.applicationCommands(botConfig.clientId);

    const data: any = await rest.put(route, { body: commands });

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    if (!botConfig.guildId) {
      console.log('⚠️  Using global commands (no GUILD_ID provided). Commands may take up to 1 hour to appear.');
    }
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

// Event handlers
client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  registerCommands();
});

client.on('interactionCreate', async interaction => {
  // Handle button interactions
  if (interaction.isButton()) {
    const customId = interaction.customId;
    
    if (customId.startsWith('action_select_')) {
      // Handle action selection via button
      const actionId = customId.replace('action_select_', '');
      await handleActionSelection(interaction, actionId);
      return;
    }
    
    if (customId.startsWith('choice_select_')) {
      // Handle choice selection via button
      // Format: choice_select_<eventId>__<choiceId> (double underscore separator)
      const withoutPrefix = customId.replace('choice_select_', '');
      const separatorIndex = withoutPrefix.indexOf('__');
      if (separatorIndex === -1) return;
      
      const eventId = withoutPrefix.substring(0, separatorIndex);
      const choiceId = withoutPrefix.substring(separatorIndex + 2);
      await handleChoiceSelection(interaction, eventId, choiceId);
      return;
    }
    
    if (customId.startsWith('skill_auto_')) {
      // Handle auto-enhance button
      const companyId = customId.replace('skill_auto_', '');
      const { handleAutoEnhance } = await import('./commands/skill-tree');
      await handleAutoEnhance(interaction, companyId);
      return;
    }
    
    if (customId.startsWith('skill_view_category_')) {
      // Handle view category skills button (format: skill_view_category_<companyId>_<category>)
      const parts = customId.replace('skill_view_category_', '').split('_');
      const companyId = parts.slice(0, -1).join('_'); // Everything except last part
      const category = parts[parts.length - 1]; // Last part is category
      const { handleViewCategorySkills } = await import('./commands/skill-tree');
      await handleViewCategorySkills(interaction, companyId, category);
      return;
    }
    
    if (customId.startsWith('skill_view_')) {
      // Handle view skills button
      const companyId = customId.replace('skill_view_', '');
      const { handleViewSkills } = await import('./commands/skill-tree');
      await handleViewSkills(interaction, companyId);
      return;
    }
    
    if (customId.startsWith('skill_manual_')) {
      // Handle manual upgrade button
      const companyId = customId.replace('skill_manual_', '');
      const { handleManualUpgrade } = await import('./commands/skill-tree');
      await handleManualUpgrade(interaction, companyId);
      return;
    }
    
    if (customId.startsWith('skill_category_')) {
      // Handle skill category button (format: skill_category_<companyId>_<category>)
      const parts = customId.replace('skill_category_', '').split('_');
      const companyId = parts.slice(0, -1).join('_'); // Everything except last part
      const category = parts[parts.length - 1]; // Last part is category
      const { handleCategorySelection } = await import('./commands/skill-tree');
      await handleCategorySelection(interaction, companyId, category);
      return;
    }
    
    if (customId.startsWith('skill_upgrade_')) {
      // Handle skill upgrade button (format: skill_upgrade_<companyId>_<skillId>)
      const parts = customId.replace('skill_upgrade_', '').split('_');
      const companyId = parts.slice(0, -1).join('_'); // Everything except last part
      const skillId = parts[parts.length - 1]; // Last part is skillId
      const { handleSkillUpgrade } = await import('./commands/skill-tree');
      await handleSkillUpgrade(interaction, companyId, skillId);
      return;
    }
    
    if (customId.startsWith('skill_back_main_')) {
      // Handle back to main view button
      const companyId = customId.replace('skill_back_main_', '');
      const { handleBackToMain } = await import('./commands/skill-tree');
      await handleBackToMain(interaction, companyId);
      return;
    }
    
    if (customId.startsWith('skill_back_')) {
      // Handle back to categories button
      const companyId = customId.replace('skill_back_', '');
      const { handleBackToCategories } = await import('./commands/skill-tree');
      await handleBackToCategories(interaction, companyId);
      return;
    }
    
    if (customId.startsWith('view_roles_')) {
      // Handle view roles button (format: view_roles_<companyId>)
      const companyId = customId.replace('view_roles_', '');
      await handleViewRoles(interaction, companyId, 0);
      return;
    }
    
    if (customId.startsWith('roles_page_')) {
      // Handle role pagination (format: roles_page_<companyId>_<pageNumber>)
      const parts = customId.replace('roles_page_', '').split('_');
      const companyId = parts.slice(0, -1).join('_'); // Everything except last part
      const page = parseInt(parts[parts.length - 1], 10);
      await handleViewRoles(interaction, companyId, page);
      return;
    }
    
    if (customId.startsWith('select_role_')) {
      // Handle role selection (format: select_role_<roleId>::<companyId>)
      // Using :: as separator since UUIDs use hyphens and roleIds might use underscores
      const content = customId.replace('select_role_', '');
      const separatorIndex = content.indexOf('::');
      if (separatorIndex === -1) {
        // Fallback for old format (backwards compatibility)
        const parts = content.split('_');
        const roleId = parts[0];
        const companyId = parts.slice(1).join('_');
        await handleRoleSelection(interaction, roleId, companyId);
      } else {
        const roleId = content.substring(0, separatorIndex);
        const companyId = content.substring(separatorIndex + 2);
        await handleRoleSelection(interaction, roleId, companyId);
      }
      return;
    }
  }
  
  // Handle select menu interactions
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'action_select_menu') {
      const actionId = interaction.values[0];
      await handleActionSelection(interaction, actionId);
      return;
    }
    
    if (interaction.customId.startsWith('skill_category_')) {
      // Handle skill category selection (format: skill_category_<companyId>_<category>)
      const parts = interaction.customId.replace('skill_category_', '').split('_');
      const companyId = parts.slice(0, -1).join('_'); // Everything except last part
      const category = parts[parts.length - 1]; // Last part is category
      const { handleCategorySelection } = await import('./commands/skill-tree');
      await handleCategorySelection(interaction, companyId, category);
      return;
    }
    
    if (interaction.customId.startsWith('skill_upgrade_')) {
      // Handle skill upgrade button (format: skill_upgrade_<companyId>_<skillId>)
      const parts = interaction.customId.replace('skill_upgrade_', '').split('_');
      const companyId = parts.slice(0, -1).join('_'); // Everything except last part
      const skillId = parts[parts.length - 1]; // Last part is skillId
      const { handleSkillUpgrade } = await import('./commands/skill-tree');
      await handleSkillUpgrade(interaction, companyId, skillId);
      return;
    }
    
    if (interaction.customId.startsWith('skill_back_')) {
      // Handle back button
      const companyId = interaction.customId.replace('skill_back_', '');
      const { handleBackToCategories } = await import('./commands/skill-tree');
      await handleBackToCategories(interaction, companyId);
      return;
    }
  }
  
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);
      
      const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
});

// Handle action selection from button/select menu
async function handleActionSelection(interaction: any, actionId: string) {
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
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({
          embeds: [EmbedUtils.createErrorEmbed('Your company is no longer active.')],
          ephemeral: true,
        });
      }
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Your company is no longer active.')],
        ephemeral: true,
      });
    }

    // Check action points FIRST before processing
    if (!ActionSystem.canSelectAction(company)) {
      // Set break timer (30 minutes)
      const breakUntil = new Date();
      breakUntil.setMinutes(breakUntil.getMinutes() + 30);
      
      await DatabaseQueries.updateCompany(company.companyId, {
        actionPointsRemaining: 0,
        inBreakUntil: breakUntil.toISOString(),
      });

      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({
          embeds: [EmbedUtils.createErrorEmbed('You have no action points remaining. You are now in a 30-minute break. Use /end-day to process the day.')],
          ephemeral: true,
        });
      }
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('You have no action points remaining. You are now in a 30-minute break. Use /end-day to process the day.')],
        ephemeral: true,
      });
    }

    const action = ActionSystem.findAction(company.dailyActions, actionId);
    if (!action || action.selected) {
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({
          embeds: [EmbedUtils.createErrorEmbed('Action not found or already selected.')],
          ephemeral: true,
        });
      }
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Action not found or already selected.')],
        ephemeral: true,
      });
    }

    const actionData = await ActionDataLoader.getAction(actionId);
    if (!actionData) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Action data not found.')],
        ephemeral: true,
      });
    }

    const eventCount = Math.floor(Math.random() * 3) + 1;
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
    
    let updatedCompany = CompanyState.markActionSelected(company, actionId, actionWeight);
    for (const event of events) {
      updatedCompany = CompanyState.addPendingEvent(updatedCompany, event);
    }

    // Check for broadcast special events (don't cost action points)
    const { BroadcastSystem } = await import('./game/systems/broadcast-system');
    if (BroadcastSystem.isBroadcastActive(updatedCompany) && BroadcastSystem.shouldTriggerSpecialEvent(updatedCompany)) {
      const specialEvent = BroadcastSystem.getRandomSpecialEvent(updatedCompany.broadcastId!);
      if (specialEvent) {
        // Convert special event to PendingEvent format
        const labels = ['Option A', 'Option B', 'Option C', 'Option D'];
        const choices = specialEvent.choices.map((choice: any, index: number) => ({
          choiceId: choice.choiceId,
          label: labels[index] || `Option ${String.fromCharCode(65 + index)}`,
          type: choice.type,
          text: choice.text,
          effects: choice.effects,
          revealed: false,
        }));
        
        updatedCompany = CompanyState.addPendingEvent(updatedCompany, {
          eventId: specialEvent.eventId,
          actionId: 'broadcast_special', // Special marker
          choices,
          selectedChoiceId: null,
        });
      }
    }

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

    const firstEvent = events[0];
    const eventData = EventDataLoader.getEvent(firstEvent.eventId);
    
    const embed = EmbedUtils.createEventEmbed({
      name: eventData?.name || firstEvent.eventId,
      description: eventData?.description || `Event from action: ${action.name}`,
      choices: firstEvent.choices,
    });

    const choiceButtons = firstEvent.choices.map((choice: any, index: number) =>
      new ButtonBuilder()
        .setCustomId(`choice_select_${firstEvent.eventId}__${choice.choiceId}`)
        .setLabel(choice.label || `Option ${String.fromCharCode(65 + index)}`)
        .setStyle(ButtonStyle.Secondary)
    );

    const row = new ActionRowBuilder().addComponents(choiceButtons);

    await interaction.update({
      embeds: [embed],
      content: `**Action Selected:** ${action.name}\n\nChoose an outcome:`,
      components: [row],
    });
  } catch (error) {
    console.error('Error handling action selection:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ embeds: [EmbedUtils.createErrorEmbed('Failed to process action.')], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [EmbedUtils.createErrorEmbed('Failed to process action.')], ephemeral: true });
    }
  }
}

// Handle choice selection from button
async function handleChoiceSelection(interaction: any, eventId: string, choiceId: string) {
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

    let selectedEvent = null;
    let selectedChoice = null;

    for (const event of company.pendingEvents) {
      const choice = event.choices.find((c: any) => c.choiceId === choiceId);
      if (choice) {
        selectedEvent = event;
        selectedChoice = choice;
        break;
      }
    }

    if (!selectedEvent || !selectedChoice) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Choice not found in pending events.')],
        ephemeral: true,
      });
    }

    let updatedCompany = CompanyState.applyOutcome(company, selectedChoice.effects);

    // Check for level up
    const levelUpInfo = (updatedCompany as any).levelUpInfo;

    const anomaly = await AnomalySystem.generateAnomaly(
      updatedCompany,
      selectedChoice.effects.flags
    );

    if (anomaly) {
      updatedCompany = await AnomalySystem.applyAnomaly(updatedCompany, anomaly);
    }

    updatedCompany = CompanyState.removePendingEvent(updatedCompany, selectedEvent.eventId);
    
    // Don't deduct action points for broadcast special events
    if (selectedEvent.actionId !== 'broadcast_special') {
      updatedCompany.actionPointsRemaining = Math.max(0, updatedCompany.actionPointsRemaining - 1);
    }

    await DatabaseQueries.updateCompany(company.companyId, {
      level: updatedCompany.level,
      skillPoints: updatedCompany.skillPoints,
      cash: updatedCompany.cash,
      users: updatedCompany.users,
      quality: updatedCompany.quality,
      hype: updatedCompany.hype,
      virality: updatedCompany.virality,
      xp: updatedCompany.xp,
      skills: updatedCompany.skills,
      pendingEvents: updatedCompany.pendingEvents,
      actionPointsRemaining: updatedCompany.actionPointsRemaining,
    });

    const outcomeEmbed = EmbedUtils.createOutcomeRevealEmbed(selectedChoice, selectedChoice.effects);
    
    // Create level up embed if leveled up
    let levelUpEmbed = null;
    if (levelUpInfo) {
      levelUpEmbed = EmbedUtils.createSuccessEmbed(`🎉 Level Up! 🎉`);
      levelUpEmbed.setDescription(
        `**${company.name}** reached **Level ${levelUpInfo.newLevel}**!\n\n` +
        `**Rewards:**\n` +
        `• Skill Points: +${levelUpInfo.skillPointsGained}\n` +
        `• Total Skill Points: ${updatedCompany.skillPoints}`
      );
      levelUpEmbed.setColor(0x00ff00);
    }
    
    let replyContent = '';
    if (anomaly) {
      replyContent += `**⚡ Anomaly:** ${anomaly.name}\n${anomaly.description}\n\n`;
    }
    
    if (updatedCompany.actionPointsRemaining === 0) {
      replyContent += `\n**Action points remaining: 0**\nUse \`/end-day\` to process the day.`;
    } else {
      replyContent += `\n**Action points remaining:** ${updatedCompany.actionPointsRemaining}`;
    }

    const statsEmbed = EmbedUtils.createCompanyStatsEmbed(updatedCompany);
    
    const embeds = [outcomeEmbed];
    if (levelUpEmbed) {
      embeds.unshift(levelUpEmbed); // Put level up embed first
    }
    embeds.push(statsEmbed);
    
    await interaction.update({
      embeds,
      content: replyContent || undefined,
      components: [], // Remove buttons after selection
    });
  } catch (error) {
    console.error('Error handling choice selection:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ embeds: [EmbedUtils.createErrorEmbed('Failed to process choice.')], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [EmbedUtils.createErrorEmbed('Failed to process choice.')], ephemeral: true });
    }
  }
}

// Handle view roles button
async function handleViewRoles(interaction: any, companyId: string, page: number = 0) {
  try {
    const company = await DatabaseQueries.getCompany(companyId);
    if (!company) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }

    // Check if user owns this company
    if (company.ownerId !== interaction.user.id) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('You do not own this company.')],
        ephemeral: true,
      });
    }

    // Check if role is already set
    if (company.role) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Role has already been selected for this company.')],
        ephemeral: true,
      });
    }

    // Get all roles
    const { RoleSystem } = await import('./game/systems/role-system');
    const roles = RoleSystem.getAllRoles();
    
    const ROLES_PER_PAGE = 2;
    const totalPages = Math.ceil(roles.length / ROLES_PER_PAGE);
    const currentPage = Math.max(0, Math.min(page, totalPages - 1));
    const startIndex = currentPage * ROLES_PER_PAGE;
    const endIndex = Math.min(startIndex + ROLES_PER_PAGE, roles.length);
    const rolesOnPage = roles.slice(startIndex, endIndex);

    // Create embed showing roles for current page
    const embed = EmbedUtils.createSuccessEmbed('Available Roles');
    embed.setDescription(`Choose your role to determine how your skill tree evolves. Each role has unique strengths and weaknesses.\n\n**Page ${currentPage + 1} of ${totalPages}**\n`);

    // Add roles for current page
    rolesOnPage.forEach((role, index) => {
      const globalIndex = startIndex + index;
      const strengthsText = role.strengths.map(s => `✓ ${s}`).join('\n');
      const weaknessesText = role.weaknesses.map(w => `✗ ${w}`).join('\n');
      const bonusesText = `Product: ${((role.skillTreeBonuses.product - 1) * 100).toFixed(0)}% | Marketing: ${((role.skillTreeBonuses.marketing - 1) * 100).toFixed(0)}% | Finance: ${((role.skillTreeBonuses.finance - 1) * 100).toFixed(0)}% | Technology: ${((role.skillTreeBonuses.technology - 1) * 100).toFixed(0)}%`;
      
      embed.addFields({
        name: `${globalIndex + 1}. ${role.name}`,
        value: `${role.description}\n\n**Strengths:**\n${strengthsText}\n\n**Weaknesses:**\n${weaknessesText}\n\n**Skill Tree Bonuses:**\n${bonusesText}`,
        inline: false
      });
    });

    // Create role selection buttons for current page
    // Using :: as separator to handle roleIds with underscores and UUIDs with hyphens
    const roleButtonsRow = new ActionRowBuilder<ButtonBuilder>();
    rolesOnPage.forEach((role) => {
      const button = new ButtonBuilder()
        .setCustomId(`select_role_${role.roleId}::${companyId}`)
        .setLabel(role.name)
        .setStyle(ButtonStyle.Primary);
      roleButtonsRow.addComponents(button);
    });

    // Create pagination buttons
    const paginationRow = new ActionRowBuilder<ButtonBuilder>();
    
    const prevButton = new ButtonBuilder()
      .setCustomId(`roles_page_${companyId}_${currentPage - 1}`)
      .setLabel('◀ Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 0);
    
    const nextButton = new ButtonBuilder()
      .setCustomId(`roles_page_${companyId}_${currentPage + 1}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= totalPages - 1);
    
    paginationRow.addComponents(prevButton, nextButton);

    const components = [roleButtonsRow, paginationRow];

    // Use update for button interactions, reply for initial command
    if (interaction.isButton()) {
      await interaction.update({
        embeds: [embed],
        components: components
      });
    } else if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        embeds: [embed],
        components: components
      });
    } else {
      await interaction.reply({
        embeds: [embed],
        components: components
      });
    }
  } catch (error) {
    console.error('Error handling view roles:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ embeds: [EmbedUtils.createErrorEmbed('Failed to load roles.')], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [EmbedUtils.createErrorEmbed('Failed to load roles.')], ephemeral: true });
    }
  }
}

// Handle role selection
async function handleRoleSelection(interaction: any, roleId: string, companyId: string) {
  try {
    console.log(`[Role Selection] roleId: ${roleId}, companyId: ${companyId}`);
    const company = await DatabaseQueries.getCompany(companyId);
    if (!company) {
      console.error(`[Role Selection] Company not found for ID: ${companyId}`);
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed(`Company not found. ID: ${companyId.substring(0, 20)}...`)],
        ephemeral: true,
      });
    }

    // Check if user owns this company
    if (company.ownerId !== interaction.user.id) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('You do not own this company.')],
        ephemeral: true,
      });
    }

    // Check if role is already set
    if (company.role) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Role has already been selected for this company.')],
        ephemeral: true,
      });
    }

    // Get role data
    const { RoleSystem } = await import('./game/systems/role-system');
    const role = RoleSystem.getRole(roleId);
    if (!role) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Invalid role selected.')],
        ephemeral: true,
      });
    }

    // Update company with role
    const updatedCompany = await DatabaseQueries.updateCompany(companyId, {
      role: roleId,
    });

    // Create success embed
    const embed = EmbedUtils.createSuccessEmbed('Role Selected!');
    embed.setDescription(`You have chosen the role: **${role.name}**\n\n${role.description}\n\n**Strengths:**\n${role.strengths.map(s => `• ${s}`).join('\n')}\n\n**Weaknesses:**\n${role.weaknesses.map(w => `• ${w}`).join('\n')}\n\n**Skill Tree Bonuses:**\n• Product: ${((role.skillTreeBonuses.product - 1) * 100).toFixed(0)}%\n• Marketing: ${((role.skillTreeBonuses.marketing - 1) * 100).toFixed(0)}%\n• Finance: ${((role.skillTreeBonuses.finance - 1) * 100).toFixed(0)}%\n• Technology: ${((role.skillTreeBonuses.technology - 1) * 100).toFixed(0)}%\n\nYour skill tree will evolve based on your role's strengths and weaknesses. Use \`/start-day\` to begin your journey!`);

    await interaction.update({
      embeds: [embed],
      components: [], // Remove buttons
    });
  } catch (error) {
    console.error('Error handling role selection:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ embeds: [EmbedUtils.createErrorEmbed('Failed to select role.')], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [EmbedUtils.createErrorEmbed('Failed to select role.')], ephemeral: true });
    }
  }
}

// Production error handling
process.on('unhandledRejection', (error: Error) => {
  console.error('❌ Unhandled Promise Rejection:', error);
  // Don't exit in production - let Railway/PM2 handle restarts
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  // Exit on uncaught exceptions as they indicate serious issues
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

// Login
if (!botConfig.token) {
  console.error('❌ ERROR: DISCORD_TOKEN is required in environment variables');
  console.error('   Set DISCORD_TOKEN in Railway environment variables or .env file');
  process.exit(1);
}

if (!botConfig.clientId) {
  console.error('❌ ERROR: DISCORD_CLIENT_ID is required in environment variables');
  console.error('   Set DISCORD_CLIENT_ID in Railway environment variables or .env file');
  process.exit(1);
}

console.log('🚀 Starting Discord bot...');
console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Guild ID: ${botConfig.guildId || 'Not set (using global commands)'}`);

client.login(botConfig.token).catch(error => {
  console.error('❌ Failed to login to Discord:', error);
  console.error('   Check your DISCORD_TOKEN is correct');
  process.exit(1);
});

