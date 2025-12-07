import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { CompanyState } from '../game/state/company-state';
import { EmbedUtils } from '../utils/embeds';
import { AnomalySystem } from '../game/systems/anomaly-system';

export const data = new SlashCommandBuilder()
  .setName('choose')
  .setDescription('Choose an outcome for a pending event')
  .addStringOption(option =>
    option.setName('choiceid')
      .setDescription('The ID of the choice to make')
      .setRequired(true));

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

    const choiceId = interaction.options.getString('choiceid', true);

    // Find the event with this choice
    let selectedEvent = null;
    let selectedChoice = null;

    for (const event of company.pendingEvents) {
      const choice = event.choices.find(c => c.choiceId === choiceId);
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

    // Apply outcome
    let updatedCompany = CompanyState.applyOutcome(company, selectedChoice.effects);

    // Check for level up
    const levelUpInfo = (updatedCompany as any).levelUpInfo;

    // Check for anomalies
    const anomaly = await AnomalySystem.generateAnomaly(
      updatedCompany,
      selectedChoice.effects.flags
    );

    if (anomaly) {
      updatedCompany = await AnomalySystem.applyAnomaly(updatedCompany, anomaly);
    }

    // Remove event from pending
    updatedCompany = CompanyState.removePendingEvent(updatedCompany, selectedEvent.eventId);

    // Don't deduct action points for broadcast special events
    if (selectedEvent.actionId !== 'broadcast_special') {
      updatedCompany.actionPointsRemaining = Math.max(0, updatedCompany.actionPointsRemaining - 1);
    }

    // Save company (including level and skillPoints)
    await DatabaseQueries.updateCompany(company.companyId, {
      cash: updatedCompany.cash,
      users: updatedCompany.users,
      quality: updatedCompany.quality,
      hype: updatedCompany.hype,
      virality: updatedCompany.virality,
      xp: updatedCompany.xp,
      level: updatedCompany.level,
      skillPoints: updatedCompany.skillPoints,
      skills: updatedCompany.skills,
      pendingEvents: updatedCompany.pendingEvents,
      actionPointsRemaining: updatedCompany.actionPointsRemaining,
    });

    // Reveal outcome with proper emoji
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
    
    const statsEmbed = EmbedUtils.createCompanyStatsEmbed(updatedCompany);
    
    const embeds = [outcomeEmbed];
    if (levelUpEmbed) {
      embeds.unshift(levelUpEmbed); // Put level up embed first
    }
    
    // Show anomaly effects with detailed embed if triggered
    if (anomaly) {
      embeds.push(EmbedUtils.createAnomalyEffectsEmbed(anomaly));
    }
    
    embeds.push(statsEmbed);
    
    let replyContent = '';
    if (updatedCompany.actionPointsRemaining === 0) {
      replyContent += `**Action points remaining: 0**\nUse \`/end-day\` to process the day.`;
    } else {
      replyContent += `**Action points remaining:** ${updatedCompany.actionPointsRemaining}`;
    }
    
    return interaction.reply({ 
      embeds,
      content: replyContent || undefined,
    });
  } catch (error) {
    console.error('Error choosing outcome:', error);
    return interaction.reply({
      embeds: [EmbedUtils.createErrorEmbed('Failed to process choice. Please try again.')],
      ephemeral: true,
    });
  }
}

