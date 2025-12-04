import { ChatInputCommandInteraction, SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { SkillSystem } from '../game/systems/skill-system';
import { EmbedUtils } from '../utils/embeds';
import { GoalSystem } from '../game/systems/goal-system';
import { LevelSystem } from '../game/systems/level-system';
import { RoleSystem } from '../game/systems/role-system';

export const data = new SlashCommandBuilder()
  .setName('skill-tree')
  .setDescription('View and upgrade your skill tree');

/**
 * Format skill effects for display (in italic)
 */
function formatSkillEffects(effects: any): string {
  const effectParts: string[] = [];
  
  if (effects.revenueMultiplier) {
    const percent = ((effects.revenueMultiplier - 1) * 100).toFixed(1);
    effectParts.push(`*Revenue: +${percent}%*`);
  }
  if (effects.viralityBonus) {
    effectParts.push(`*Virality: +${(effects.viralityBonus * 100).toFixed(1)}%*`);
  }
  if (effects.conversionBonus) {
    effectParts.push(`*Conversion: +${(effects.conversionBonus * 100).toFixed(1)}%*`);
  }
  if (effects.costReduction) {
    effectParts.push(`*Cost Reduction: +${(effects.costReduction * 100).toFixed(1)}%*`);
  }
  if (effects.eventOutcomeBonus) {
    effectParts.push(`*Event Outcome: +${(effects.eventOutcomeBonus * 100).toFixed(1)}%*`);
  }
  if (effects.hypeBonus) {
    effectParts.push(`*Hype Bonus: +${(effects.hypeBonus * 100).toFixed(1)}%*`);
  }
  
  return effectParts.length > 0 ? effectParts.join(' • ') : '*No effects*';
}

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

    // Recalculate level and skill points to ensure they're up to date
    const levelInfo = LevelSystem.recalculateLevelAndSkillPoints(company);
    
    // Update company if level or skill points changed
    if (company.level !== levelInfo.level || company.skillPoints !== levelInfo.availableSkillPoints) {
      await DatabaseQueries.updateCompany(company.companyId, {
        level: levelInfo.level,
        skillPoints: levelInfo.availableSkillPoints,
      });
      company.level = levelInfo.level;
      company.skillPoints = levelInfo.availableSkillPoints;
    }

    // Show simplified skill tree view
    const allSkills = await SkillSystem.getAllSkills();
    
    // Calculate summary stats
    const totalSkills = allSkills.length;
    const totalSkillLevels = Object.values(company.skills).reduce((sum, level) => sum + level, 0);
    const maxedSkills = Object.values(company.skills).filter(level => {
      const skill = allSkills.find(s => company.skills[s.skillId] === level);
      return skill && level >= skill.maxLevel;
    }).length;
    
    const trees = ['product', 'marketing', 'finance', 'technology'];
    const treeStats = trees.map(tree => {
      const treeSkills = allSkills.filter(s => s.tree === tree);
      const treeLevels = treeSkills.reduce((sum, skill) => {
        return sum + (company.skills[skill.skillId] || 0);
      }, 0);
      const treeMaxed = treeSkills.filter(skill => {
        const level = company.skills[skill.skillId] || 0;
        return level >= skill.maxLevel;
      }).length;
      return {
        name: tree,
        total: treeSkills.length,
        levels: treeLevels,
        maxed: treeMaxed,
      };
    });
    
    const embed = EmbedUtils.createSuccessEmbed('Skill Tree');
    let description = `**Skill Points Available:** ${company.skillPoints}\n` +
      `**Level:** ${company.level}/50\n` +
      `**Total Skills:** ${totalSkills} | **Total Levels:** ${totalSkillLevels} | **Maxed:** ${maxedSkills}\n\n`;
    
    // Show role info if set
    if (company.role) {
      const role = RoleSystem.getRole(company.role);
      if (role) {
        description += `**Role:** ${role.name}\n`;
        description += `*${role.description}*\n\n`;
        description += `**Strengths:** ${role.strengths.join(', ')}\n`;
        description += `**Weaknesses:** ${role.weaknesses.join(', ')}\n\n`;
        description += `**Skill Tree Bonuses:**\n`;
        description += `• Product: ${((role.skillTreeBonuses.product - 1) * 100).toFixed(0)}%\n`;
        description += `• Marketing: ${((role.skillTreeBonuses.marketing - 1) * 100).toFixed(0)}%\n`;
        description += `• Finance: ${((role.skillTreeBonuses.finance - 1) * 100).toFixed(0)}%\n`;
        description += `• Technology: ${((role.skillTreeBonuses.technology - 1) * 100).toFixed(0)}%\n\n`;
      }
    }
    
    description += `Choose an action below:`;
    embed.setDescription(description);

    // Add summary for each tree
    for (const stat of treeStats) {
      embed.addFields({ 
        name: `📁 ${stat.name.toUpperCase()}`, 
        value: `${stat.total} skills | ${stat.levels} total levels | ${stat.maxed} maxed`, 
        inline: true 
      });
    }

    // Create buttons
    const viewSkillsButton = new ButtonBuilder()
      .setCustomId(`skill_view_${company.companyId}`)
      .setLabel('👁️ View Skills')
      .setStyle(ButtonStyle.Secondary);

    const autoEnhanceButton = new ButtonBuilder()
      .setCustomId(`skill_auto_${company.companyId}`)
      .setLabel('⚡ Auto-Enhance')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(company.skillPoints === 0);

    const manualUpgradeButton = new ButtonBuilder()
      .setCustomId(`skill_manual_${company.companyId}`)
      .setLabel('🔧 Manual Upgrade')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(company.skillPoints === 0);

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(viewSkillsButton, autoEnhanceButton, manualUpgradeButton);

    return interaction.reply({ 
      embeds: [embed],
      components: [row1],
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error viewing skill tree:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to load skill tree. Please try again.')],
      ephemeral: true,
    });
  }
}

/**
 * Handle view skills: show category selection
 */
export async function handleViewSkills(interaction: any, companyId: string) {
  try {
    let company = await DatabaseQueries.getCompany(companyId);
    if (!company) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }
    
    // Recalculate level and skill points
    const levelInfo = LevelSystem.recalculateLevelAndSkillPoints(company);
    if (company.level !== levelInfo.level || company.skillPoints !== levelInfo.availableSkillPoints) {
      await DatabaseQueries.updateCompany(companyId, {
        level: levelInfo.level,
        skillPoints: levelInfo.availableSkillPoints,
      });
      company = await DatabaseQueries.getCompany(companyId);
    }
    
    if (!company) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }

    const trees = ['product', 'marketing', 'finance', 'technology'];
    
    // Create category buttons
    const buttons = trees.map(tree => 
      new ButtonBuilder()
        .setCustomId(`skill_view_category_${companyId}_${tree}`)
        .setLabel(tree.toUpperCase())
        .setStyle(ButtonStyle.Secondary)
    );
    
    // Add "All" button
    const allButton = new ButtonBuilder()
      .setCustomId(`skill_view_category_${companyId}_all`)
      .setLabel('ALL')
      .setStyle(ButtonStyle.Primary);
    
    buttons.push(allButton);
    
    // Split buttons into rows (max 5 per row)
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
    }
    
    // Add back button
    const backButton = new ButtonBuilder()
      .setCustomId(`skill_back_main_${companyId}`)
      .setLabel('← Back')
      .setStyle(ButtonStyle.Secondary);
    
    if (rows[rows.length - 1].components.length < 5) {
      rows[rows.length - 1].addComponents(backButton);
    } else {
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(backButton));
    }
    
    const embed = EmbedUtils.createInfoEmbed('View Skills');
    embed.setDescription(
      `**Skill Points:** ${company.skillPoints}\n` +
      `**Level:** ${company.level}/50\n\n` +
      `Select a category to view skills, or click ALL to view all skills:`
    );

    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ 
        embeds: [embed],
        components: rows,
      });
    }
    return interaction.reply({ 
      embeds: [embed],
      components: rows,
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error viewing skills:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to load skills. Please try again.')],
      ephemeral: true,
    });
  }
}

/**
 * Handle view category skills: show skills in selected category
 */
export async function handleViewCategorySkills(interaction: any, companyId: string, category: string) {
  try {
    let company = await DatabaseQueries.getCompany(companyId);
    if (!company) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }
    
    // Recalculate level and skill points
    const levelInfo = LevelSystem.recalculateLevelAndSkillPoints(company);
    if (company.level !== levelInfo.level || company.skillPoints !== levelInfo.availableSkillPoints) {
      await DatabaseQueries.updateCompany(companyId, {
        level: levelInfo.level,
        skillPoints: levelInfo.availableSkillPoints,
      });
      company = await DatabaseQueries.getCompany(companyId);
    }
    
    if (!company) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }

    const allSkills = await SkillSystem.getAllSkills();
    
    // Filter skills by category (or show all if category is 'all')
    const categorySkills = category === 'all' 
      ? allSkills 
      : allSkills.filter(s => s.tree === category);
    
    if (categorySkills.length === 0) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed(`No skills found.`)],
        ephemeral: true,
      });
    }
    
    const embed = EmbedUtils.createSuccessEmbed(
      category === 'all' ? 'Skill Tree - All Skills' : `Skill Tree - ${category.toUpperCase()}`
    );
    embed.setDescription(
      `**Skill Points:** ${company.skillPoints}\n` +
      `**Level:** ${company.level}/50\n\n` +
      `**Skills:**`
    );

    if (category === 'all') {
      // Show all skills grouped by category
      const trees = ['product', 'marketing', 'finance', 'technology'];
      for (const tree of trees) {
        const treeSkills = allSkills.filter(s => s.tree === tree);
        let treeText = '';
        for (const skill of treeSkills) {
          const level = company.skills[skill.skillId] || 0;
          const effectsText = formatSkillEffects(skill.effects);
          treeText += `**${skill.name}** (Lv ${level}/${skill.maxLevel})\n${effectsText}\n\n`;
        }
        embed.addFields({ 
          name: `📁 ${tree.toUpperCase()}`, 
          value: treeText || 'No skills', 
          inline: true 
        });
      }
    } else {
      // Show skills in selected category
      let categoryText = '';
      for (const skill of categorySkills) {
        const level = company.skills[skill.skillId] || 0;
        const effectsText = formatSkillEffects(skill.effects);
        categoryText += `**${skill.name}** (Lv ${level}/${skill.maxLevel})\n${effectsText}\n\n`;
      }
      embed.setDescription(
        `**Skill Points:** ${company.skillPoints}\n` +
        `**Level:** ${company.level}/50\n\n` +
        `**${category.toUpperCase()} Skills:**\n\n${categoryText}`
      );
    }

    // Add back button
    const backButton = new ButtonBuilder()
      .setCustomId(`skill_view_${companyId}`)
      .setLabel('← Back to Categories')
      .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(backButton);

    return interaction.update({ 
      embeds: [embed],
      components: [row],
    });
  } catch (error) {
    console.error('Error viewing category skills:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to load skills. Please try again.')],
      ephemeral: true,
    });
  }
}

/**
 * Handle back to main view
 */
export async function handleBackToMain(interaction: any, companyId: string) {
  try {
    const user = await DatabaseQueries.getUser((interaction.user as any).id);
    if (!user || !user.activeCompany) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }

    const company = await DatabaseQueries.getCompany(companyId);
    if (!company || !company.alive) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Your company is no longer active.')],
        ephemeral: true,
      });
    }

    // Recalculate level and skill points
    const levelInfo = LevelSystem.recalculateLevelAndSkillPoints(company);
    if (company.level !== levelInfo.level || company.skillPoints !== levelInfo.availableSkillPoints) {
      await DatabaseQueries.updateCompany(company.companyId, {
        level: levelInfo.level,
        skillPoints: levelInfo.availableSkillPoints,
      });
      company.level = levelInfo.level;
      company.skillPoints = levelInfo.availableSkillPoints;
    }

    // Show simplified skill tree view (same as execute)
    const allSkills = await SkillSystem.getAllSkills();
    
    const totalSkills = allSkills.length;
    const totalSkillLevels = Object.values(company.skills).reduce((sum, level) => sum + level, 0);
    const maxedSkills = Object.values(company.skills).filter(level => {
      const skill = allSkills.find(s => company.skills[s.skillId] === level);
      return skill && level >= skill.maxLevel;
    }).length;
    
    const trees = ['product', 'marketing', 'finance', 'technology'];
    const treeStats = trees.map(tree => {
      const treeSkills = allSkills.filter(s => s.tree === tree);
      const treeLevels = treeSkills.reduce((sum, skill) => {
        return sum + (company.skills[skill.skillId] || 0);
      }, 0);
      const treeMaxed = treeSkills.filter(skill => {
        const level = company.skills[skill.skillId] || 0;
        return level >= skill.maxLevel;
      }).length;
      return {
        name: tree,
        total: treeSkills.length,
        levels: treeLevels,
        maxed: treeMaxed,
      };
    });
    
    const embed = EmbedUtils.createSuccessEmbed('Skill Tree');
    embed.setDescription(
      `**Skill Points Available:** ${company.skillPoints}\n` +
      `**Level:** ${company.level}/50\n` +
      `**Total Skills:** ${totalSkills} | **Total Levels:** ${totalSkillLevels} | **Maxed:** ${maxedSkills}\n\n` +
      `Choose an action below:`
    );

    for (const stat of treeStats) {
      embed.addFields({ 
        name: `📁 ${stat.name.toUpperCase()}`, 
        value: `${stat.total} skills | ${stat.levels} total levels | ${stat.maxed} maxed`, 
        inline: true 
      });
    }

    const viewSkillsButton = new ButtonBuilder()
      .setCustomId(`skill_view_${company.companyId}`)
      .setLabel('👁️ View Skills')
      .setStyle(ButtonStyle.Secondary);

    const autoEnhanceButton = new ButtonBuilder()
      .setCustomId(`skill_auto_${company.companyId}`)
      .setLabel('⚡ Auto-Enhance')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(company.skillPoints === 0);

    const manualUpgradeButton = new ButtonBuilder()
      .setCustomId(`skill_manual_${company.companyId}`)
      .setLabel('🔧 Manual Upgrade')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(company.skillPoints === 0);

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(viewSkillsButton, autoEnhanceButton, manualUpgradeButton);

    return interaction.update({ 
      embeds: [embed],
      components: [row1],
    });
  } catch (error) {
    console.error('Error going back to main:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to load skill tree. Please try again.')],
      ephemeral: true,
    });
  }
}

/**
 * Handle auto-enhance: automatically assign skill points based on goals
 */
export async function handleAutoEnhance(interaction: any, companyId: string) {
  try {
    let company = await DatabaseQueries.getCompany(companyId);
    if (!company) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }
    
    // Recalculate level and skill points
    const levelInfo = LevelSystem.recalculateLevelAndSkillPoints(company);
    if (company.level !== levelInfo.level || company.skillPoints !== levelInfo.availableSkillPoints) {
      await DatabaseQueries.updateCompany(companyId, {
        level: levelInfo.level,
        skillPoints: levelInfo.availableSkillPoints,
      });
      company = await DatabaseQueries.getCompany(companyId);
    }
    
    if (!company || company.skillPoints === 0) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('No skill points available. Earn XP to level up!')],
        ephemeral: true,
      });
    }

    const allSkills = await SkillSystem.getAllSkills();
    const evaluatedGoals = GoalSystem.evaluateAllGoals(company);
    
    // Determine priority skills based on goals
    const skillPriorities: { skillId: string; priority: number }[] = [];
    
    for (const goal of evaluatedGoals) {
      if (goal.completed) continue; // Skip completed goals
      
      const progressPercent = (goal.progress / goal.targetValue) * 100;
      const remainingPercent = 100 - progressPercent;
      
      // Prioritize skills that help achieve incomplete goals
      for (const skill of allSkills) {
        let priority = 0;
        const currentLevel = company.skills[skill.skillId] || 0;
        
        if (currentLevel >= skill.maxLevel) continue; // Skip maxed skills
        
        // Map goal types to relevant skill trees
        switch (goal.goalType) {
          case 'reach_users':
            // Marketing and product skills help with users
            if (skill.tree === 'marketing' || skill.tree === 'product') {
              priority = remainingPercent * 2;
            }
            break;
          case 'reach_cash':
            // Finance and product skills help with cash
            if (skill.tree === 'finance' || skill.tree === 'product') {
              priority = remainingPercent * 1.5;
            }
            break;
          case 'reach_quality':
            // Product and technology skills help with quality
            if (skill.tree === 'product' || skill.tree === 'technology') {
              priority = remainingPercent * 2;
            }
            break;
          case 'reach_hype':
            // Marketing skills help with hype
            if (skill.tree === 'marketing') {
              priority = remainingPercent * 3;
            }
            break;
          case 'reach_virality':
            // Marketing skills help with virality
            if (skill.tree === 'marketing') {
              priority = remainingPercent * 3;
            }
            break;
          case 'reach_daily_revenue':
            // Finance and product skills help with revenue
            if (skill.tree === 'finance' || skill.tree === 'product') {
              priority = remainingPercent * 2;
            }
            break;
          case 'reach_skill_level':
            // Any skill helps
            priority = remainingPercent;
            break;
        }
        
        if (priority > 0) {
          const existing = skillPriorities.find(s => s.skillId === skill.skillId);
          if (existing) {
            existing.priority += priority;
          } else {
            skillPriorities.push({ skillId: skill.skillId, priority });
          }
        }
      }
    }
    
    // Sort by priority (highest first)
    skillPriorities.sort((a, b) => b.priority - a.priority);
    
    // Auto-assign skill points
    let remainingPoints = company.skillPoints;
    const updatedSkills = { ...company.skills };
    const upgrades: string[] = [];
    let skillPointsSpentIncrement = 0;
    
    for (const { skillId } of skillPriorities) {
      if (remainingPoints <= 0) break;
      
      const skill = await SkillSystem.getSkill(skillId);
      if (!skill) continue;
      
      const currentLevel = updatedSkills[skillId] || 0;
      if (currentLevel >= skill.maxLevel) continue;
      
      const { newLevel, remainingPoints: newRemaining } = SkillSystem.upgradeSkill(currentLevel, remainingPoints);
      const levelsGained = newLevel - currentLevel;
      updatedSkills[skillId] = newLevel;
      remainingPoints = newRemaining;
      skillPointsSpentIncrement += levelsGained; // Track how many levels were purchased
      upgrades.push(`${skill.name} → Level ${newLevel}`);
    }
    
    // Increment skillPointsSpent by the number of levels purchased
    const newSkillPointsSpent = (company.skillPointsSpent || 0) + skillPointsSpentIncrement;
    
    // Recalculate available skill points after spending
    const totalSkillPointsEarned = LevelSystem.calculateTotalSkillPointsFromLevels(company.level);
    const finalAvailableSkillPoints = Math.max(0, totalSkillPointsEarned - newSkillPointsSpent);
    
    await DatabaseQueries.updateCompany(companyId, {
      skills: updatedSkills,
      skillPoints: finalAvailableSkillPoints,
      skillPointsSpent: newSkillPointsSpent,
    });
    
    const embed = EmbedUtils.createSuccessEmbed('Auto-Enhance Complete!');
    embed.setDescription(
      `**Skill Points Remaining:** ${finalAvailableSkillPoints}\n` +
      `**Level:** ${company.level}/50\n\n` +
      `**Upgrades Applied:**\n${upgrades.length > 0 ? upgrades.join('\n') : 'No upgrades possible.'}`
    );
    
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ embeds: [embed] });
    }
    return interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Error in auto-enhance:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to auto-enhance. Please try again.')],
      ephemeral: true,
    });
  }
}

/**
 * Handle manual upgrade: show category selection
 */
export async function handleManualUpgrade(interaction: any, companyId: string) {
  try {
    let company = await DatabaseQueries.getCompany(companyId);
    if (!company) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }
    
    // Recalculate level and skill points
    const levelInfo = LevelSystem.recalculateLevelAndSkillPoints(company);
    if (company.level !== levelInfo.level || company.skillPoints !== levelInfo.availableSkillPoints) {
      await DatabaseQueries.updateCompany(companyId, {
        level: levelInfo.level,
        skillPoints: levelInfo.availableSkillPoints,
      });
      company = await DatabaseQueries.getCompany(companyId);
    }

    if (!company || company.skillPoints === 0) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('No skill points available. Earn XP to level up!')],
        ephemeral: true,
      });
    }

    const trees = ['product', 'marketing', 'finance', 'technology'];
    
    // Create category buttons
    const buttons = trees.map(tree => 
      new ButtonBuilder()
        .setCustomId(`skill_category_${companyId}_${tree}`)
        .setLabel(tree.toUpperCase())
        .setStyle(ButtonStyle.Secondary)
    );
    
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
    
    const embed = EmbedUtils.createInfoEmbed('Manual Skill Upgrade');
    embed.setDescription(
      `**Skill Points Available:** ${company.skillPoints}\n` +
      `**Level:** ${company.level}/50\n\n` +
      `Select a category to view available skills:`
    );
    
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ 
        embeds: [embed],
        components: [row],
      });
    }
    return interaction.reply({ 
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error in manual upgrade:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to start manual upgrade. Please try again.')],
      ephemeral: true,
    });
  }
}

/**
 * Handle category selection for manual upgrade
 */
export async function handleCategorySelection(interaction: any, companyId: string, category: string) {
  try {
    let company = await DatabaseQueries.getCompany(companyId);
    if (!company) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }
    
    // Recalculate level and skill points
    const levelInfo = LevelSystem.recalculateLevelAndSkillPoints(company);
    if (company.level !== levelInfo.level || company.skillPoints !== levelInfo.availableSkillPoints) {
      await DatabaseQueries.updateCompany(companyId, {
        level: levelInfo.level,
        skillPoints: levelInfo.availableSkillPoints,
      });
      company = await DatabaseQueries.getCompany(companyId);
    }
    
    if (!company) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }

    const allSkills = await SkillSystem.getAllSkills();
    const categorySkills = allSkills.filter(s => s.tree === category);
    
    if (categorySkills.length === 0) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed(`No skills in ${category} category.`)],
        ephemeral: true,
      });
    }
    
    // Create embed with all skills in category
    const embed = EmbedUtils.createInfoEmbed(`${category.toUpperCase()} Skills`);
    let description = `**Skill Points Available:** ${company.skillPoints}\n`;
    description += `**Level:** ${company.level}/50\n\n`;
    description += `**Available Skills:**\n\n`;
    
    // Group skills and create buttons
    const skillButtons: ButtonBuilder[] = [];
    
    for (const skill of categorySkills) {
      const currentLevel = company.skills[skill.skillId] || 0;
      const canUpgrade = currentLevel < skill.maxLevel && company.skillPoints > 0;
      const effectsText = formatSkillEffects(skill.effects);
      
      description += `**${skill.name}** (Lv ${currentLevel}/${skill.maxLevel})\n`;
      description += `${effectsText}\n`;
      
      if (canUpgrade) {
        description += `✅ Can upgrade\n\n`;
      } else if (currentLevel >= skill.maxLevel) {
        description += `✅ Max level reached\n\n`;
      } else {
        description += `❌ Insufficient skill points\n\n`;
      }
      
      // Create button for each skill (only if upgradeable)
      if (canUpgrade) {
        const button = new ButtonBuilder()
          .setCustomId(`skill_upgrade_${companyId}_${skill.skillId}`)
          .setLabel(`${skill.name.substring(0, 20)} (Lv ${currentLevel}→${currentLevel + 1})`)
          .setStyle(ButtonStyle.Success)
          .setDisabled(false);
        skillButtons.push(button);
      }
    }
    
    embed.setDescription(description);
    
    // Create button rows (max 5 buttons per row)
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < skillButtons.length; i += 5) {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        skillButtons.slice(i, i + 5)
      );
      rows.push(row);
    }
    
    // Add back button
    const backButton = new ButtonBuilder()
      .setCustomId(`skill_back_${companyId}`)
      .setLabel('← Back to Categories')
      .setStyle(ButtonStyle.Secondary);
    
    if (rows.length === 0 || rows[rows.length - 1].components.length < 5) {
      // Add to last row if there's space
      rows[rows.length - 1].addComponents(backButton);
    } else {
      // Create new row for back button
      rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(backButton));
    }
    
    return interaction.update({ 
      embeds: [embed],
      components: rows,
    });
  } catch (error) {
    console.error('Error in category selection:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to load skills. Please try again.')],
      ephemeral: true,
    });
  }
}

/**
 * Handle skill upgrade button click
 */
export async function handleSkillUpgrade(interaction: any, companyId: string, skillId: string) {
  try {
    let company = await DatabaseQueries.getCompany(companyId);
    if (!company) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }
    
    // Recalculate level and skill points
    const levelInfo = LevelSystem.recalculateLevelAndSkillPoints(company);
    if (company.level !== levelInfo.level || company.skillPoints !== levelInfo.availableSkillPoints) {
      await DatabaseQueries.updateCompany(companyId, {
        level: levelInfo.level,
        skillPoints: levelInfo.availableSkillPoints,
      });
      company = await DatabaseQueries.getCompany(companyId);
    }
    
    if (!company) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Company not found.')],
        ephemeral: true,
      });
    }

    const skill = await SkillSystem.getSkill(skillId);
    if (!skill) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('Skill not found.')],
        ephemeral: true,
      });
    }

    const currentLevel = company.skills[skillId] || 0;
    
    // Check requirements
    if (currentLevel >= skill.maxLevel) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed(`${skill.name} is already at max level.`)],
        ephemeral: true,
      });
    }

    if (company.skillPoints === 0) {
      return interaction.reply({
        embeds: [EmbedUtils.createErrorEmbed('No skill points available. Earn XP to level up!')],
        ephemeral: true,
      });
    }

    // Upgrade skill (1 level at a time for manual)
    const { newLevel, remainingPoints } = SkillSystem.upgradeSkill(currentLevel, 1);
    const updatedSkills = { ...company.skills, [skillId]: newLevel };
    
    // Increment skillPointsSpent by 1 (only count manually purchased levels)
    const newSkillPointsSpent = (company.skillPointsSpent || 0) + 1;
    
    // Recalculate available skill points after spending
    const totalSkillPointsEarned = LevelSystem.calculateTotalSkillPointsFromLevels(company.level);
    const finalAvailableSkillPoints = Math.max(0, totalSkillPointsEarned - newSkillPointsSpent);

    await DatabaseQueries.updateCompany(companyId, {
      skills: updatedSkills,
      skillPoints: finalAvailableSkillPoints,
      skillPointsSpent: newSkillPointsSpent,
    });

    const embed = EmbedUtils.createSuccessEmbed('Skill Upgraded!');
    embed.setDescription(
      `**${skill.name}** upgraded to **Level ${newLevel}/${skill.maxLevel}**\n\n` +
      `**Skill Points Remaining:** ${finalAvailableSkillPoints}\n` +
      `**Effects:** ${formatSkillEffects(skill.effects)}`
    );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Error in skill upgrade:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to upgrade skill. Please try again.')],
      ephemeral: true,
    });
  }
}

/**
 * Handle back button - return to category selection
 */
export async function handleBackToCategories(interaction: any, companyId: string) {
  return handleManualUpgrade(interaction, companyId);
}
