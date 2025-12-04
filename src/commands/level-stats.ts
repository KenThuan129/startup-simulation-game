import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { EmbedUtils } from '../utils/embeds';
import { LevelSystem } from '../game/systems/level-system';

export const data = new SlashCommandBuilder()
  .setName('level-stats')
  .setDescription('View your startup level progression and skill points');

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

    // Recalculate level from XP to ensure it's up to date
    const currentLevel = LevelSystem.calculateLevel(company.xp);
    const levelProgress = LevelSystem.getLevelProgress(company.xp);
    
    // Calculate total skill points that should have been earned from levels
    const totalSkillPointsFromLevels = LevelSystem.calculateTotalSkillPointsFromLevels(currentLevel);
    
    // Calculate skill points that should be available (total earned - manually spent)
    // Use skillPointsSpent if available, otherwise fall back to counting all skill levels (backward compatibility)
    const spentSkillPoints = company.skillPointsSpent !== undefined && company.skillPointsSpent !== null
      ? company.skillPointsSpent
      : Object.values(company.skills).reduce((sum, level) => sum + level, 0);
    const availableSkillPoints = totalSkillPointsFromLevels - spentSkillPoints;
    
    // Update company level if it's different
    if (company.level !== currentLevel) {
      await DatabaseQueries.updateCompany(company.companyId, {
        level: currentLevel,
        skillPoints: Math.max(0, availableSkillPoints), // Ensure non-negative
      });
    }

    const embed = EmbedUtils.createInfoEmbed('Level Progression');
    embed.setDescription(
      `**${company.name}** - Level Statistics\n\n` +
      `**Current Level:** ${currentLevel}/50\n` +
      `**Total XP:** ${company.xp.toLocaleString()}\n` +
      `**XP in Current Level:** ${levelProgress.xpInCurrentLevel.toLocaleString()}\n` +
      `**XP Needed for Next Level:** ${levelProgress.xpNeededForNextLevel.toLocaleString()}\n` +
      `**Progress:** ${levelProgress.progressPercent.toFixed(1)}%\n\n` +
      `**Skill Points:**\n` +
      `• Available: ${Math.max(0, availableSkillPoints)}\n` +
      `• Total Earned (from levels): ${totalSkillPointsFromLevels}\n` +
      `• Spent: ${spentSkillPoints}\n\n` +
      `**Next Level Rewards:**\n` +
      `• Skill Points: +${LevelSystem.getSkillPointsForLevel(currentLevel + 1)}`
    );

    // Add progress bar visualization
    const progressBarLength = 20;
    const filled = Math.floor((levelProgress.progressPercent / 100) * progressBarLength);
    const progressBar = '█'.repeat(filled) + '░'.repeat(progressBarLength - filled);
    embed.addFields({
      name: 'Progress Bar',
      value: `\`${progressBar}\` ${levelProgress.progressPercent.toFixed(1)}%`,
      inline: false,
    });

    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error viewing level stats:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to load level stats. Please try again.')],
      ephemeral: true,
    });
  }
}

