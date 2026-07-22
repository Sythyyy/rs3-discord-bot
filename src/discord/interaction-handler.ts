import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ButtonInteraction,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';

import type { CharacterProfile, GameService } from '../application/game-service.js';
import { items, type SkillKey } from '../content/game-content.js';
import { formatXp } from '../domain/skills/levels.js';
import { renderBankImage } from './bank-image.js';
import {
  bankPageCustomId,
  getBankPage,
  parseBankPageCustomId,
  type BankPage,
} from './bank-page.js';
import { renderSkillsImage } from './skills-image.js';
import { bestVerifiedTree, treesByKey } from '../domain/woodcutting/catalogue.js';
import type { RepeatTripSigner } from './repeat-trip-signature.js';

export async function handleCommand(
  interaction: ChatInputCommandInteraction,
  game: GameService,
): Promise<void> {
  try {
    switch (interaction.commandName) {
      case 'chop':
        await handleChop(interaction, game);
        return;
      case 'equip': {
        const hatchetName = await game.equipHatchet(
          interaction.user.id,
          interaction.options.getString('hatchet', true),
        );
        await interaction.reply({ content: `Equipped **${hatchetName}** in your hatchet slot.` });
        return;
      }
      case 'quest': {
        const activity = await game.startActivity(
          interaction.user.id,
          'questing',
          interaction.channelId,
        );
        await replyQuestStarted(interaction, activity);
        return;
      }
      case 'profile': {
        const user = interaction.options.getUser('user') ?? interaction.user;
        const profile = await game.getProfile(user.id);
        if (!profile) throw new Error(`${user.username} does not own a minion yet.`);
        await interaction.reply({
          content: profileMessage(profile),
        });
        return;
      }
      case 'bank': {
        const user = interaction.options.getUser('user') ?? interaction.user;
        const display = await createBankDisplay(game, user.id, 1);
        await interaction.reply(display);
        return;
      }
      case 'skills': {
        const user = interaction.options.getUser('user') ?? interaction.user;
        const profile = await game.getProfile(user.id);
        if (!profile) throw new Error(`${user.username} does not own a minion yet.`);
        const skillsImage = new AttachmentBuilder(
          await renderSkillsImage(profile.skills, profile.questPoints),
          {
            name: 'skills.png',
          },
        );
        await interaction.reply({ files: [skillsImage] });
        return;
      }
      case 'minion':
        await handleMinion(interaction, game);
        return;
      case 'sell': {
        const item = interaction.options
          .getString('item', true)
          .trim()
          .toLowerCase()
          .replaceAll(' ', '_');
        const quantity = BigInt(interaction.options.getInteger('quantity', true));
        const coins = await game.sellItem(interaction.user.id, item, quantity);
        await interaction.reply({
          content: `Sale complete. You received **${coins.toString()} coins**.`,
        });
        return;
      }
      case 'help':
        await interaction.reply({ content: helpMessage() });
        return;
      case 'admin':
        await handleAdmin(interaction, game);
        return;
      default:
        await interaction.reply({
          content: 'This command is not implemented yet.',
        });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    const payload = { content: message };
    if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
    else await interaction.reply(payload);
  }
}

export async function handleBankPageButton(
  interaction: ButtonInteraction,
  game: GameService,
): Promise<void> {
  try {
    const { ownerId, page } = parseBankPageCustomId(interaction.customId, interaction.user.id);
    const display = await createBankDisplay(game, ownerId, page);
    await interaction.update({
      attachments: [],
      files: display.files,
      components: display.components,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
  }
}

export function bankPaginationComponents(
  ownerId: string,
  page: Pick<BankPage, 'page' | 'totalPages'>,
): ActionRowBuilder<ButtonBuilder>[] {
  if (page.totalPages <= 1) return [];
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(bankPageCustomId(ownerId, Math.max(1, page.page - 1)))
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page.page === 1),
      new ButtonBuilder()
        .setCustomId(bankPageCustomId(ownerId, Math.min(page.totalPages, page.page + 1)))
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page.page === page.totalPages),
    ),
  ];
}

async function createBankDisplay(game: GameService, ownerId: string, requestedPage: number) {
  const bank = await game.getBank(ownerId);
  const page = getBankPage(bank.items, requestedPage);
  return {
    files: [
      new AttachmentBuilder(await renderBankImage({ ...page, playerName: bank.playerName }), {
        name: `bank-page-${page.page}.png`,
      }),
    ],
    components: bankPaginationComponents(ownerId, page),
  };
}

export async function handleRepeatButton(
  interaction: ButtonInteraction,
  game: GameService,
  signer: RepeatTripSigner,
): Promise<void> {
  try {
    const repeat = signer.verify(interaction.customId);
    if (!repeat) throw new Error('This repeat button is invalid or has been modified.');
    if (interaction.user.id !== repeat.ownerId)
      throw new Error('Only the minion owner can repeat this trip.');
    const activity = await game.startActivity(
      interaction.user.id,
      repeat.activityKey,
      interaction.channelId,
      undefined,
      new Date(),
      Math.random,
      repeat.sourceActivityId,
    );
    if (activity.activity.skill !== 'woodcutting')
      throw new Error('This repeat button is not for a Woodcutting trip.');
    await replyChopStarted(interaction, activity);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    await interaction.reply({ content: message });
  }
}

export async function handleCancelButton(
  interaction: ButtonInteraction,
  game: GameService,
): Promise<void> {
  try {
    const [, decision, ownerId] = interaction.customId.split(':');
    if (!decision || !ownerId || interaction.user.id !== ownerId)
      throw new Error('Only the minion owner can respond to this cancellation.');
    if (decision === 'deny') {
      await interaction.update({
        content: 'Cancellation denied. Your minion will continue its activity.',
        components: [],
      });
      return;
    }
    if (decision !== 'confirm') throw new Error('This cancellation response is invalid.');
    const activity = await game.cancelActivity(interaction.user.id);
    await interaction.update({
      content: `Cancelled **${activity.name}**. No XP or items were awarded.`,
      components: [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
    await interaction.reply({ content: message });
  }
}

async function handleAdmin(
  interaction: ChatInputCommandInteraction,
  game: GameService,
): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator))
    throw new Error('You must be a server administrator to use this command.');
  const user = interaction.options.getUser('user', true);
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'skill') {
    const skill = interaction.options.getString('skill', true) as SkillKey;
    const level = interaction.options.getInteger('level', true);
    await game.adminSetSkillLevel(user.id, skill, level);
    await interaction.reply({
      content: `Set ${user.username}'s ${skill} level to ${level}.`,
    });
    return;
  }
  if (subcommand === 'item') {
    const item = interaction.options.getString('item', true).trim().toLowerCase();
    const quantity = BigInt(interaction.options.getInteger('quantity', true));
    await game.adminSetItem(user.id, item, quantity);
    await interaction.reply({
      content: `Set ${user.username}'s ${item} quantity to ${quantity.toString()}.`,
    });
    return;
  }
  if (subcommand === 'coins') {
    const coins = BigInt(interaction.options.getInteger('amount', true));
    await game.adminSetCoins(user.id, coins);
    await interaction.reply({
      content: `Set ${user.username}'s coin balance to ${coins.toString()}.`,
    });
    return;
  }
  throw new Error('That admin command is not available.');
}

async function handleMinion(
  interaction: ChatInputCommandInteraction,
  game: GameService,
): Promise<void> {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'buy') {
    const profile = await game.buyMinion(interaction.user.id, interaction.user.username);
    await interaction.reply({
      content: `Minion purchased! Your minion **${profile.name}** is ready for orders. You have **${profile.coins.toString()} coins**. Send it gathering with \`/minion start\`.`,
    });
    return;
  }
  if (subcommand === 'start') {
    const activity = await game.startActivity(
      interaction.user.id,
      interaction.options.getString('activity', true),
      interaction.channelId,
      BigInt(interaction.options.getInteger('quantity') ?? 0) || undefined,
    );
    await replyActivityStarted(interaction, activity);
    return;
  }
  if (subcommand === 'status') {
    const activity = await game.getActiveActivity(interaction.user.id);
    const description = activity
      ? `Currently **${activity.activity.name}**. Completion: <t:${Math.floor(activity.completesAt.getTime() / 1000)}:R>.`
      : 'No activity is active. Start one with `/minion start`.';
    await interaction.reply({
      content: `**Minion status:** ${description}`,
    });
    return;
  }
  if (subcommand === 'cancel') {
    const activity = await game.getActiveActivity(interaction.user.id);
    if (!activity) throw new Error('Your minion does not have an activity to cancel.');
    const confirmButton = new ButtonBuilder()
      .setCustomId(`cancel:confirm:${interaction.user.id}`)
      .setLabel('Confirm cancellation')
      .setStyle(ButtonStyle.Danger);
    const denyButton = new ButtonBuilder()
      .setCustomId(`cancel:deny:${interaction.user.id}`)
      .setLabel('Keep working')
      .setStyle(ButtonStyle.Secondary);
    await interaction.reply({
      content: `Cancel **${activity.activity.name}**? Your minion will receive no XP or items from this trip.`,
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, denyButton)],
      ephemeral: true,
    });
    return;
  }
  throw new Error('That minion command is not available.');
}

async function handleChop(
  interaction: ChatInputCommandInteraction,
  game: GameService,
): Promise<void> {
  const profile = await game.getProfile(interaction.user.id);
  if (!profile) throw new Error('Buy a minion first with /minion buy.');
  const level = profile.skills.find((skill) => skill.key === 'woodcutting')?.level ?? 1;
  const requestedKey = interaction.options.getString('name');
  const tree = requestedKey ? treesByKey[requestedKey] : bestVerifiedTree(level);
  if (!tree) throw new Error('No verified logs are available at your Woodcutting level.');
  const activity = await game.startActivity(
    interaction.user.id,
    `woodcutting_${tree.key}`,
    interaction.channelId,
    BigInt(interaction.options.getInteger('quantity') ?? 0) || undefined,
  );
  await replyChopStarted(interaction, activity);
}

async function replyChopStarted(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  activity: Awaited<ReturnType<GameService['startActivity']>>,
): Promise<void> {
  const reward = activity.activity.rewards[0];
  const logName = reward ? (items[reward.itemKey]?.name ?? reward.itemKey) : 'Logs';
  const snapshot = activity.hatchetBoost;
  const multiplier = snapshot?.successMultiplier.toFixed(2) ?? '1.00';
  const hatchetName = snapshot?.hatchetName ?? 'Bronze hatchet';
  const duration = formatDuration(
    activity.durationMs ?? activity.completesAt.getTime() - Date.now(),
  );
  const choppingTarget = activity.requestedQuantity
    ? `${activity.requestedQuantity.toString()} ${logName}`
    : logName;
  await interaction.reply({
    content: `Your minion is now chopping **${choppingTarget}**. It will take **${duration}** to finish.\n\nBoosts: **${multiplier}x** success multiplier for **${hatchetName}**.`,
  });
}

async function replyActivityStarted(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  activity: Awaited<ReturnType<GameService['startActivity']>>,
): Promise<void> {
  await interaction.reply({
    content: `**${activity.activity.name} started.** Your minion is gathering **${activity.quantity.toString()} items**. It should take between **${formatDuration(activity.minDurationMs ?? 0)}** and **${formatDuration(activity.maxDurationMs ?? 0)}**.\n${formatBoosts(activity.boosts)}`,
  });
}

async function replyQuestStarted(
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  activity: Awaited<ReturnType<GameService['startActivity']>>,
): Promise<void> {
  await interaction.reply({
    content: `Your minion is now questing. It will return in **${formatDuration(activity.maxDurationMs ?? 0)}** with a chance to receive **1–3 Quest Points**.`,
  });
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.max(1, Math.round(milliseconds / 1_000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  if (remainingSeconds === 0) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatBoosts(boosts: ReadonlyArray<{ name: string; amount: number }>): string {
  if (boosts.length === 0) return 'Boosts: None.';
  return `Boosts: ${boosts.map((boost) => `${boost.amount.toFixed(1)}x success multiplier for ${boost.name}`).join(', ')}.`;
}

function profileMessage(profile: CharacterProfile): string {
  const skills = profile.skills
    .map((skill) => `${skill.name}: **${skill.level}** (${formatXp(skill.xp)} XP)`)
    .join('\n');
  const woodcutting = profile.skills.find((skill) => skill.key === 'woodcutting');
  const active = profile.activeWoodcuttingTrip
    ? `**Active trip:** ${profile.activeWoodcuttingTrip.activityName}, ${profile.activeWoodcuttingTrip.expectedLogs.toString()} logs due, ready <t:${Math.floor(profile.activeWoodcuttingTrip.completesAt.getTime() / 1_000)}:R>.`
    : '**Active trip:** None.';
  const history = profile.recentWoodcuttingTrips.length
    ? profile.recentWoodcuttingTrips
        .map(
          (trip) =>
            `• ${trip.activityName}: ${trip.actualLogs.toString()} logs, ${formatXp(trip.xp)} XP${trip.fatigueEnded ? ' (fatigued)' : ''} — <t:${Math.floor(trip.completedAt.getTime() / 1_000)}:R>`,
        )
        .join('\n')
    : 'No completed Woodcutting trips yet.';
  return `**${profile.name}'s profile**\nCoins: **${profile.coins.toString()}**\nQuest Points: **${profile.questPoints}/473**\n\n**Woodcutting level: ${woodcutting?.level ?? 1}**\n**Equipped hatchet:** ${profile.equippedHatchet.name}\n${active}\n**Recent trips**\n${history}\n\n**Skills**\n${skills}`;
}

function helpMessage(): string {
  return [
    '**Phase 1 help**',
    'Buy a minion, order it to complete timed gathering activities, and sell its resources.',
    '',
    '**Get started:** `/minion buy`, `/profile`, `/bank`',
    '**Woodcutting:** `/chop name:<logs> quantity:<optional target>`',
    '**Equipment:** `/equip <hatchet>`',
    '**Activities:** `/quest`, `/minion start`, `/minion status`, `/minion cancel`',
    '**Economy:** `/sell <item> <quantity>`',
  ].join('\n');
}
