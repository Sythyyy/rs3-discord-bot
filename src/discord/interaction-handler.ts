import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';

import { activities } from '../content/game-content.js';
import type { GameService } from '../application/game-service.js';

const errorEmbed = (description: string) => new EmbedBuilder().setColor(0xdc2626).setDescription(description);

export async function handleCommand(interaction: ChatInputCommandInteraction, game: GameService): Promise<void> {
  try {
    switch (interaction.commandName) {
      case 'start': {
        const profile = await game.createCharacter(interaction.user.id, interaction.user.username);
        await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x22c55e).setTitle(`Welcome, ${profile.name}!`).setDescription('Your character has been created with 100 coins. Try `/minion start` to begin gathering.')], ephemeral: true });
        return;
      }
      case 'profile': {
        const user = interaction.options.getUser('user') ?? interaction.user;
        const profile = await game.getProfile(user.id);
        if (!profile) throw new Error(`${user.username} has not created a character yet.`);
        await interaction.reply({ embeds: [profileEmbed(profile.name, profile.coins, profile.skills)] });
        return;
      }
      case 'bank': {
        const user = interaction.options.getUser('user') ?? interaction.user;
        const inventory = await game.getInventory(user.id);
        const description = inventory.length ? inventory.map((item) => `**${item.quantity.toString()}×** ${item.name}`).join('\n') : 'This bank is empty. Complete an activity to earn resources.';
        await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2563eb).setTitle(`${user.username}'s bank`).setDescription(description)] });
        return;
      }
      case 'minion':
        await handleMinion(interaction, game);
        return;
      case 'sell': {
        const item = interaction.options.getString('item', true).trim().toLowerCase().replaceAll(' ', '_');
        const quantity = BigInt(interaction.options.getInteger('quantity', true));
        const coins = await game.sellItem(interaction.user.id, item, quantity);
        await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xeab308).setTitle('Sale complete').setDescription(`You received **${coins.toString()} coins**.`)], ephemeral: true });
        return;
      }
      case 'help':
        await interaction.reply({ embeds: [helpEmbed()] });
        return;
      default:
        await interaction.reply({ embeds: [errorEmbed('This command is not implemented yet.')], ephemeral: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    const payload = { embeds: [errorEmbed(message)], ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
    else await interaction.reply(payload);
  }
}

async function handleMinion(interaction: ChatInputCommandInteraction, game: GameService): Promise<void> {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'start') {
    const activity = await game.startActivity(interaction.user.id, interaction.options.getString('activity', true));
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x7c3aed)
          .setTitle(`${activity.activity.name} started`)
          .setDescription(
            `Your minion will finish <t:${Math.floor(activity.completesAt.getTime() / 1000)}:R>. Use \`/minion claim\` once it is complete.`,
          ),
      ],
      ephemeral: true,
    });
    return;
  }
  if (subcommand === 'status') {
    const activity = await game.getActiveActivity(interaction.user.id);
    const description = activity
      ? `Currently **${activity.activity.name}**. Completion: <t:${Math.floor(activity.completesAt.getTime() / 1000)}:R>.`
      : 'No activity is active. Start one with `/minion start`.';
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x7c3aed).setTitle('Minion status').setDescription(description)], ephemeral: true });
    return;
  }
  const activity = await game.claimActivity(interaction.user.id);
  const rewards = activity.activity.rewards.map((reward) => `${reward.quantity.toString()}× ${reward.itemKey.replaceAll('_', ' ')}`).join(', ');
  await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x22c55e).setTitle('Activity claimed').setDescription(`Gained **${activity.activity.xp.toString()} ${activity.activity.skill} XP** and **${rewards}**.`)], ephemeral: true });
}

function profileEmbed(name: string, coins: bigint, skillList: Array<{ name: string; level: number; xp: bigint }>): EmbedBuilder {
  return new EmbedBuilder().setColor(0x2563eb).setTitle(`${name}'s profile`).setDescription(`**Coins:** ${coins.toString()}`).addFields({ name: 'Skills', value: skillList.map((skill) => `${skill.name}: **${skill.level}** (${skill.xp.toString()} XP)`).join('\n') });
}

function helpEmbed(): EmbedBuilder {
  return new EmbedBuilder().setColor(0x2563eb).setTitle('Phase 1 help').setDescription('Create a character, complete timed gathering activities, and sell resources to build your coin balance.').addFields(
    { name: 'Get started', value: '`/start`, `/profile`, `/bank`' },
    { name: 'Activities', value: '`/minion start`, `/minion status`, `/minion claim`' },
    { name: 'Economy', value: '`/sell <item> <quantity>`' },
  );
}
