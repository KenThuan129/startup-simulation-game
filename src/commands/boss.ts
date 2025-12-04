import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { DatabaseQueries } from '../db/queries';
import { BossEngine } from '../game/boss/boss-engine';
import { EmbedUtils } from '../utils/embeds';

export const data = new SlashCommandBuilder()
  .setName('boss')
  .setDescription('Boss battle commands')
  .addSubcommand(subcommand =>
    subcommand
      .setName('status')
      .setDescription('Check boss battle status'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('action')
      .setDescription('Take action in boss battle')
      .addStringOption(option =>
        option.setName('type')
          .setDescription('Action type')
          .setRequired(true)
          .addChoices(
            { name: 'Attack', value: 'attack' },
            { name: 'Defend', value: 'defend' },
            { name: 'Special', value: 'special' }
          ))
      .addNumberOption(option =>
        option.setName('xp_cost')
          .setDescription('XP cost for special (optional)')
          .setRequired(false))
      .addNumberOption(option =>
        option.setName('cash_cost')
          .setDescription('Cash cost for special (optional)')
          .setRequired(false)));

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const user = await DatabaseQueries.getUser(interaction.user.id);
    if (!user || !user.activeCompany) {
      return interaction.editReply({
        embeds: [EmbedUtils.createErrorEmbed('You need to create a startup first! Use /create-startup')],
      });
    }

    const company = await DatabaseQueries.getCompany(user.activeCompany);
    if (!company || !company.alive) {
      return interaction.editReply({
        embeds: [EmbedUtils.createErrorEmbed('Your company is no longer active.')],
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'status') {
      const battle = await DatabaseQueries.getBossBattle(company.companyId);
      
      if (!battle) {
        if (company.day === 45) {
          // Create boss battle if it's day 45
          const newBattle = await BossEngine.getOrCreateBossBattle(company);
          if (newBattle) {
            return interaction.editReply({
              embeds: [EmbedUtils.createInfoEmbed(`Boss Battle Started: ${newBattle.bossName}`)
                .setDescription(`**Boss Health:** ${newBattle.bossHealth}/${newBattle.maxHealth}\n**Your Health:** ${newBattle.playerHealth}\n**Turn:** ${newBattle.currentTurn}\n\nUse \`/boss action\` to fight!`)],
            });
          }
        }
        return interaction.editReply({
          embeds: [EmbedUtils.createInfoEmbed('No active boss battle. Boss appears on Day 45.')],
        });
      }

      const embed = EmbedUtils.createInfoEmbed(`Boss Battle: ${battle.bossName}`);
      embed.setDescription(
        `**Status:** ${battle.status}\n` +
        `**Boss Health:** ${battle.bossHealth}/${battle.maxHealth}\n` +
        `**Your Health:** ${battle.playerHealth}\n` +
        `**Turn:** ${battle.currentTurn}\n` +
        (battle.lastBossMove ? `**Last Boss Move:** ${battle.lastBossMove}\n` : '') +
        (battle.lastPlayerMove ? `**Your Last Move:** ${battle.lastPlayerMove}` : '')
      );

      if (battle.status === 'won' && battle.rewards) {
        embed.addFields({
          name: '🎉 Victory Rewards',
          value: `Cash: $${battle.rewards.cash?.toLocaleString()}\nInvestors: ${battle.rewards.investors?.join(', ')}\nQuality Boost: +${battle.rewards.qualityBoost}\nSkill Points: +${battle.rewards.skillPoints}`,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }

    if (subcommand === 'action') {
      const actionType = interaction.options.getString('type', true) as 'attack' | 'defend' | 'special';
      const xpCost = interaction.options.getNumber('xp_cost') ?? undefined;
      const cashCost = interaction.options.getNumber('cash_cost') ?? undefined;

      const specialCost = actionType === 'special' ? { 
        xp: xpCost !== undefined ? xpCost : undefined, 
        cash: cashCost !== undefined ? cashCost : undefined 
      } : undefined;

      const result = await BossEngine.executePlayerAction(company, actionType, specialCost);

      const embed = EmbedUtils.createInfoEmbed(`Boss Battle Turn ${result.battle.currentTurn}`);
      embed.setDescription(result.message);

      if (result.battle.status === 'won') {
        embed.setTitle('🎉 VICTORY!');
        embed.setColor(0x00ff00);
        if (result.battle.rewards) {
          embed.addFields({
            name: 'Rewards',
            value: `$${result.battle.rewards.cash?.toLocaleString()} cash\n${result.battle.rewards.investors?.join(', ')} investors\n+${result.battle.rewards.qualityBoost} quality\n+${result.battle.rewards.skillPoints} skill points`,
          });
        }
      } else if (result.battle.status === 'lost') {
        embed.setTitle('💀 DEFEAT');
        embed.setColor(0xff0000);
        embed.setDescription('Your company has been defeated by the boss. Game Over.');
      } else {
        embed.addFields({
          name: 'Battle Status',
          value: `Boss: ${result.battle.bossHealth}/${result.battle.maxHealth} HP\nYou: ${result.battle.playerHealth} HP`,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }
  } catch (error: any) {
    console.error('Error in boss command:', error);
    return interaction.editReply({
      embeds: [EmbedUtils.createErrorEmbed(error.message || 'Failed to process boss command.')],
    });
  }
}

