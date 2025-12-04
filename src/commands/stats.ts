import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { EmbedUtils } from '../utils/embeds';
import { GoalSystem } from '../game/systems/goal-system';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('View your company statistics');

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
    if (!company) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }

    // Evaluate goals to get current progress
    const evaluatedGoals = GoalSystem.evaluateAllGoals(company);
    
    const embed = EmbedUtils.createCompanyStatsEmbed(company);
    
    // Format goals display
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
    
    let goalsText = '';
    for (const goal of evaluatedGoals) {
      const progress = GoalSystem.getGoalProgressText(goal);
      const status = goal.completed ? '✅' : '⏳';
      goalsText += `${status} **${typeLabels[goal.goalType] || goal.goalType}**: ${progress}\n`;
    }
    
    embed.setDescription(`**${company.name}** - ${company.type}\n\n**Goals:**\n${goalsText || 'No goals set'}`);

    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error viewing stats:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to load stats. Please try again.')],
      ephemeral: true,
    });
  }
}

