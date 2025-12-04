import { ChatInputCommandInteraction, SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { randomUUID } from 'crypto';
import { ActionSystem } from '../game/actions/action-system';
import { EmbedUtils } from '../utils/embeds';
import { getDifficultyConfig } from '../config/difficulty';
import { Goal } from '../db/types';
import { RoleSystem } from '../game/systems/role-system';

export const data = new SlashCommandBuilder()
  .setName('create-startup')
  .setDescription('Create a new startup company')
  .addStringOption(option =>
    option.setName('name')
      .setDescription('Name of your startup')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('type')
      .setDescription('Type of startup')
      .setRequired(true)
      .addChoices(
        { name: 'SaaS', value: 'saas' },
        { name: 'E-commerce', value: 'ecommerce' },
        { name: 'Mobile App', value: 'mobile_app' },
        { name: 'Marketplace', value: 'marketplace' },
        { name: 'FinTech', value: 'fintech' },
        { name: 'HealthTech', value: 'healthtech' }
      ))
  .addStringOption(option =>
    option.setName('difficulty')
      .setDescription('Difficulty level')
      .setRequired(true)
      .addChoices(
        { name: 'Easy', value: 'easy' },
        { name: 'Normal', value: 'normal' },
        { name: 'Hard', value: 'hard' },
        { name: 'Another Story', value: 'another_story' }
      ))
  .addStringOption(option =>
    option.setName('goal1_type')
      .setDescription('Goal #1 type')
      .setRequired(true)
      .addChoices(
        { name: 'Reach Users', value: 'reach_users' },
        { name: 'Reach Cash', value: 'reach_cash' },
        { name: 'Reach Quality', value: 'reach_quality' },
        { name: 'Reach Hype', value: 'reach_hype' },
        { name: 'Reach Virality', value: 'reach_virality' },
        { name: 'Reach Daily Revenue', value: 'reach_daily_revenue' },
        { name: 'Reach Skill Level', value: 'reach_skill_level' },
        { name: 'Survive Days', value: 'survive_days' }
      ))
  .addNumberOption(option =>
    option.setName('goal1_value')
      .setDescription('Goal #1 target value')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('goal2_type')
      .setDescription('Goal #2 type (optional)')
      .setRequired(false)
      .addChoices(
        { name: 'Reach Users', value: 'reach_users' },
        { name: 'Reach Cash', value: 'reach_cash' },
        { name: 'Reach Quality', value: 'reach_quality' },
        { name: 'Reach Hype', value: 'reach_hype' },
        { name: 'Reach Virality', value: 'reach_virality' },
        { name: 'Reach Daily Revenue', value: 'reach_daily_revenue' },
        { name: 'Reach Skill Level', value: 'reach_skill_level' },
        { name: 'Survive Days', value: 'survive_days' }
      ))
  .addNumberOption(option =>
    option.setName('goal2_value')
      .setDescription('Goal #2 target value (optional)')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('goal3_type')
      .setDescription('Goal #3 type (optional)')
      .setRequired(false)
      .addChoices(
        { name: 'Reach Users', value: 'reach_users' },
        { name: 'Reach Cash', value: 'reach_cash' },
        { name: 'Reach Quality', value: 'reach_quality' },
        { name: 'Reach Hype', value: 'reach_hype' },
        { name: 'Reach Virality', value: 'reach_virality' },
        { name: 'Reach Daily Revenue', value: 'reach_daily_revenue' },
        { name: 'Reach Skill Level', value: 'reach_skill_level' },
        { name: 'Survive Days', value: 'survive_days' }
      ))
  .addNumberOption(option =>
    option.setName('goal3_value')
      .setDescription('Goal #3 target value (optional)')
      .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const name = interaction.options.getString('name', true);
    const type = interaction.options.getString('type', true);
    const difficulty = interaction.options.getString('difficulty', true) as any;
    
    // Build goals array with new structure
    const goals: Goal[] = [];
    
    // Goal 1 (required)
    const goal1Type = interaction.options.getString('goal1_type', true) as Goal['goalType'];
    const goal1Value = interaction.options.getNumber('goal1_value', true);
    goals.push({
      goalId: randomUUID(),
      goalType: goal1Type,
      targetValue: goal1Value,
      progress: 0,
      completed: false,
    });
    
    // Goal 2 (optional)
    const goal2Type = interaction.options.getString('goal2_type');
    const goal2Value = interaction.options.getNumber('goal2_value');
    if (goal2Type && goal2Value !== null) {
      goals.push({
        goalId: randomUUID(),
        goalType: goal2Type as Goal['goalType'],
        targetValue: goal2Value,
        progress: 0,
        completed: false,
      });
    }
    
    // Goal 3 (optional)
    const goal3Type = interaction.options.getString('goal3_type');
    const goal3Value = interaction.options.getNumber('goal3_value');
    if (goal3Type && goal3Value !== null) {
      goals.push({
        goalId: randomUUID(),
        goalType: goal3Type as Goal['goalType'],
        targetValue: goal3Value,
        progress: 0,
        completed: false,
      });
    }

    // Check if user exists
    let user = await DatabaseQueries.getUser(interaction.user.id);
    if (!user) {
      user = await DatabaseQueries.createUser(interaction.user.id);
    }

    // Check if user already has an active company
    if (user.activeCompany) {
      const existingCompany = await DatabaseQueries.getCompany(user.activeCompany);
      if (existingCompany && existingCompany.alive) {
        return interaction.reply({
          embeds: [EmbedUtils.createErrorEmbed('You already have an active company! Use /reset to start over.')],
          ephemeral: true,
        });
      }
    }

    // Create new company
    const companyId = randomUUID();
    const difficultyConfig = getDifficultyConfig(difficulty);
    const company = await DatabaseQueries.createCompany({
      companyId,
      ownerId: interaction.user.id,
      name,
      type,
      goals,
      difficulty,
      day: 1,
      cash: difficultyConfig.initialCash,
      users: 0,
      quality: 50,
      hype: 0,
      virality: 0,
      skillPoints: 0,
      skills: {},
      xp: 0,
      level: 1,
      dailyActions: [],
      pendingEvents: [],
      actionPointsRemaining: 0,
      loans: [],
      alive: true,
      statsHistory: [],
      inBreakUntil: null,
      loanLifelineUsed: false,
    });

    // Update user's active company
    await DatabaseQueries.updateUser(interaction.user.id, {
      activeCompany: companyId,
    });

    const embed = EmbedUtils.createSuccessEmbed('Startup Created!');
    const goalsText = goals.map((g, i) => {
      const typeLabels: Record<string, string> = {
        reach_users: 'Reach Users',
        reach_cash: 'Reach Cash',
        reach_quality: 'Reach Quality',
        reach_hype: 'Reach Hype',
        reach_virality: 'Reach Virality',
        reach_daily_revenue: 'Reach Daily Revenue',
        reach_skill_level: 'Reach Skill Level',
        survive_days: 'Survive Days',
      };
      return `Goal ${i + 1}: ${typeLabels[g.goalType] || g.goalType} - ${g.targetValue.toLocaleString()}`;
    }).join('\n');
    
    embed.setDescription(`**${name}** has been created!\n\n**Type:** ${type}\n**Goals:**\n${goalsText}\n\n**Choose your role** to determine how your skill tree evolves. Click "View Roles" to see all available roles and their specialties.`);

    // Create "View Roles" button
    const viewRolesButton = new ButtonBuilder()
      .setCustomId(`view_roles_${companyId}`)
      .setLabel('👁️ View Roles')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(viewRolesButton);

    return interaction.reply({ 
      embeds: [embed],
      components: [row]
    });
  } catch (error) {
    console.error('Error creating startup:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to create startup. Please try again.')],
      ephemeral: true,
    });
  }
}

