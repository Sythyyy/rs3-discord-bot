import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';

import { activities } from '../content/game-content.js';
import type { GameService } from '../application/game-service.js';
import type { AgilityService } from '../application/agility/agility-service.js';
import { assessEligibility } from '../domain/agility/course.js';

const errorEmbed = (description: string) => new EmbedBuilder().setColor(0xdc2626).setDescription(description);

export async function handleCommand(interaction: ChatInputCommandInteraction, game: GameService, agility: AgilityService): Promise<void> {
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
      case 'agility':
        await handleAgility(interaction, agility);
        return;
      case 'admin':
        if (!interaction.memberPermissions?.has('Administrator')) throw new Error('Administrator permission is required.');
        await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xeab308).setTitle('Agility refresh preview').setDescription('Refresh previews are intentionally disabled until the Wiki source can be retrieved and manually reviewed in this deployment. Player commands never fetch the Wiki.')], ephemeral: true });
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

async function handleAgility(interaction: ChatInputCommandInteraction, agility: AgilityService): Promise<void> {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'courses') {
    const data = await agility.listCourses(interaction.user.id); const eligibleOnly = interaction.options.getBoolean('eligible_only') ?? false;
    const courses = eligibleOnly ? data.courses.filter((course) => assessEligibility(course, data.level).eligible) : data.courses;
    const lines = courses.map((course) => { const eligibility = assessEligibility(course, data.level); return `**${course.name}** — Lv. ${course.requiredAgilityLevel} • ${course.location}\n${eligibility.eligible ? '✅ Eligible' : `🔒 ${eligibility.reasons.join(' ')}`}\nRewards: ${course.rewardSummary || 'None confirmed'} • Source verified: ${course.sourceRevisionOrVerifiedAt}`; });
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2563eb).setTitle(`Agility courses (your level: ${data.level})`).setDescription(lines.join('\n\n') || 'No courses match that filter.')] }); return;
  }
  if (subcommand === 'train') { const activity = await agility.start(interaction.user.id, interaction.options.getString('course', true)); await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x7c3aed).setTitle(`${activity.course.name} started`).setDescription(`Bot reward: **${activity.course.botXpPerActivity.toString()} Agility XP**. Complete <t:${Math.floor(activity.completesAt.getTime() / 1000)}:R>. This is bot-balanced XP, not RS3 XP.`)], ephemeral: true }); return; }
  if (subcommand === 'claim') { const course = await agility.claim(interaction.user.id); await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x22c55e).setTitle('Agility activity claimed').setDescription(`You gained **${course.botXpPerActivity.toString()} Agility XP** from ${course.name}.`)], ephemeral: true }); return; }
  if (subcommand === 'guide') { const guide = await agility.guide(interaction.user.id); const description = guide.course ? `Recommended bot course: **${guide.course.name}**\nBot efficiency: ${(Number(guide.course.botXpPerActivity) / guide.course.botDurationSeconds).toFixed(2)} XP/sec.\nWiki RS3 XP/hour: ${guide.course.estimatedBaseXpPerHourMin === null ? 'No reviewed estimate available.' : `estimated ${guide.course.estimatedBaseXpPerHourMin}–${guide.course.estimatedBaseXpPerHourMax}/hour`}` : 'No verified eligible course is available.'; await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2563eb).setTitle(`Agility guide (level ${guide.level})`).setDescription(description)] }); return; }
  const status = await agility.status(interaction.user.id); const description = status.course ? `Training **${status.course.name}**; finishes <t:${Math.floor(status.completesAt!.getTime() / 1000)}:R>. Expected bot reward: ${status.course.botXpPerActivity.toString()} XP.` : 'No Agility course is active.'; await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2563eb).setTitle('Agility status').setDescription(`Level **${status.level}** • **${status.xp.toString()} XP**\n${description}`)], ephemeral: true });
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
