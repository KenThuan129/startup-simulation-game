import { EmbedBuilder } from 'discord.js';
import { Company } from '../db/types';

export class EmbedUtils {
  static createCompanyStatsEmbed(company: Company): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(`${company.name} - Day ${company.day}`)
      .setColor(company.alive ? 0x00ff00 : 0xff0000)
      .addFields(
        { name: '💰 Cash', value: `$${company.cash.toLocaleString()}`, inline: true },
        { name: '👥 Users', value: company.users.toLocaleString(), inline: true },
        { name: '⭐ Quality', value: `${company.quality.toFixed(1)}%`, inline: true },
        { name: '🔥 Hype', value: `${company.hype.toFixed(1)}%`, inline: true },
        { name: '📈 Virality', value: `${company.virality.toFixed(1)}%`, inline: true },
        { name: '🎯 XP', value: company.xp.toString(), inline: true },
        { name: '📊 Level', value: `${company.level}/50`, inline: true },
        { name: '🎮 Action Points', value: company.actionPointsRemaining.toString(), inline: true },
        { name: '💎 Skill Points', value: company.skillPoints.toString(), inline: true }
      )
      .setFooter({ text: `Difficulty: ${company.difficulty.toUpperCase()}` })
      .setTimestamp();
  }

  static createActionListEmbed(actions: any[]): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('Available Actions')
      .setColor(0x0099ff)
      .setDescription('Select an action using `/action <actionId>`');

    for (const action of actions) {
      embed.addFields({
        name: `${action.name} (${action.actionId})`,
        value: `${action.description}\n**Category:** ${action.category}`,
        inline: false,
      });
    }

    return embed;
  }

  static createEventEmbed(event: any): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle(`You face: ${event.name}`)
      .setDescription(event.description)
      .setColor(0xff9900)
      .setFooter({ text: 'Choose one using /choose <choiceId>' });

    // Show neutral labels - hide outcome types and IDs until reveal
    for (const choice of event.choices) {
      embed.addFields({
        name: choice.label || `Option ${String.fromCharCode(65 + event.choices.indexOf(choice))}`,
        value: choice.text,
        inline: false,
      });
    }

    return embed;
  }

  static createOutcomeRevealEmbed(choice: any, effects: any): EmbedBuilder {
    const emojiMap: Record<string, string> = {
      critical_success: '🎯',
      success: '✅',
      failure: '⚠️',
      critical_failure: '❌',
    };
    
    const typeLabels: Record<string, string> = {
      critical_success: 'Critical Success',
      success: 'Success',
      failure: 'Failure',
      critical_failure: 'Critical Failure',
    };
    
    const emoji = emojiMap[choice.type] || '📌';
    const typeLabel = typeLabels[choice.type] || choice.type;
    
    const embed = new EmbedBuilder()
      .setTitle(`${emoji} Outcome: ${typeLabel}`)
      .setColor(
        choice.type === 'critical_success' ? 0x00ff00 :
        choice.type === 'success' ? 0x90ee90 :
        choice.type === 'failure' ? 0xffa500 :
        0xff0000
      );

    let description = `${choice.text}\n\n`;
    
    // Show effects
    const effectParts: string[] = [];
    if (effects.cash) {
      const sign = effects.cash > 0 ? '+' : '';
      effectParts.push(`Cash: ${sign}$${Math.abs(effects.cash).toLocaleString()}`);
    }
    if (effects.users) {
      const sign = effects.users > 0 ? '+' : '';
      effectParts.push(`Users: ${sign}${Math.abs(effects.users)}`);
    }
    if (effects.quality) {
      const sign = effects.quality > 0 ? '+' : '';
      effectParts.push(`Quality: ${sign}${Math.abs(effects.quality)}`);
    }
    if (effects.hype) {
      const sign = effects.hype > 0 ? '+' : '';
      effectParts.push(`Hype: ${sign}${Math.abs(effects.hype)}`);
    }
    if (effects.xp) {
      const sign = effects.xp > 0 ? '+' : '';
      effectParts.push(`XP: ${sign}${Math.abs(effects.xp)}`);
    }
    
    if (effectParts.length > 0) {
      description += `**Effects:**\n${effectParts.join('\n')}`;
    }

    embed.setDescription(description);
    return embed;
  }

  static createErrorEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(message)
      .setColor(0xff0000);
  }

  static createSuccessEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('✅ Success')
      .setDescription(message)
      .setColor(0x00ff00);
  }

  static createInfoEmbed(title: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle(title)
      .setColor(0x0099ff);
  }

  static createWarningEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('⚠️ Warning')
      .setDescription(message)
      .setColor(0xffa500);
  }
}

