import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Events,
  GatewayIntentBits,
} from 'discord.js';
import pino from 'pino';

import { GameService } from './application/game-service.js';
import { loadEnvironment } from './config/env.js';
import { items, skills } from './content/game-content.js';
import { formatXp } from './domain/skills/levels.js';
import {
  handleBankPageButton,
  handleCancelButton,
  handleCommand,
  handleRepeatButton,
} from './discord/interaction-handler.js';
import { createDatabase } from './infrastructure/database/database.js';
import { RepeatTripSigner } from './discord/repeat-trip-signature.js';

const env = loadEnvironment();
const logger = pino({ level: env.LOG_LEVEL });
const database = createDatabase(env.DATABASE_URL);
const game = new GameService(database, env.GAME_SPEED_MULTIPLIER);
const repeatTripSigner = new RepeatTripSigner(env.BUTTON_SIGNING_SECRET ?? env.DISCORD_TOKEN);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let settlementRunning = false;
let settlementTimer: NodeJS.Timeout | null = null;

async function settleActivities(): Promise<void> {
  if (settlementRunning) return;
  settlementRunning = true;
  try {
    const settled = await game.settleCompletedActivities();
    for (const completion of settled) {
      if (!completion.notificationChannelId || !completion.discordUserId) continue;
      if (completion.activity.isQuest) {
        const awarded = completion.questPointsAwarded ?? 0;
        const total = completion.totalQuestPoints ?? 0;
        const content =
          awarded > 0
            ? `<@${completion.discordUserId}> Your minion finished **Questing**. You received **${awarded} Quest Point${awarded === 1 ? '' : 's'}**. (**${total}/473 QP**)`
            : `<@${completion.discordUserId}> Your minion finished **Questing**, but you already have the maximum **473 Quest Points**.`;
        await sendCompletionMessage(completion.discordUserId, completion.notificationChannelId, {
          content,
          components: [],
        });
        continue;
      }
      const skillName =
        skills.find((skill) => skill.key === completion.activity.skill)?.name ??
        completion.activity.skill;
      const customSkillEmoji = client.emojis.cache.find(
        (emoji) =>
          emoji.name === `skill_${completion.activity.skill}` ||
          emoji.name === completion.activity.skill,
      );
      const skillIcon =
        customSkillEmoji?.toString() ?? fallbackSkillIcon(completion.activity.skill);
      const xpPerHour = (completion.xp * 3_600_000n) / BigInt(Math.max(1, completion.durationMs));
      const lines = [
        `<@${completion.discordUserId}>, Your minion finished ${skillName.toLowerCase()}. You received ${skillIcon} **${formatXp(completion.xp)} XP**. (**${formatRate(xpPerHour)} XP/Hr**).`,
      ];
      if (completion.newLevel > completion.oldLevel) {
        lines.push(
          `Congratulations! Your **${skillName}** level is now **${completion.newLevel}**!`,
        );
      }
      lines.push(
        ...completion.rewards.map((reward) => {
          const itemName = items[reward.itemKey]?.name ?? reward.itemKey.replaceAll('_', ' ');
          return `You received **${reward.quantity.toString()}x ${itemName}**.`;
        }),
      );
      if (completion.activity.skill === 'woodcutting') {
        lines.push(
          completion.fatigueEnded
            ? 'Fatigue ended this trip early.'
            : 'Your minion completed the full target without getting tired.',
        );
      }
      const components =
        completion.activity.skill === 'woodcutting'
          ? [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId(
                    repeatTripSigner.create(
                      completion.activity.key,
                      completion.discordUserId,
                      completion.activityId,
                    ),
                  )
                  .setLabel('Repeat trip')
                  .setEmoji('🔁')
                  .setStyle(ButtonStyle.Primary),
              ),
            ]
          : [];
      await sendCompletionMessage(completion.discordUserId, completion.notificationChannelId, {
        content: lines.join('\n'),
        components,
      });
    }
    if (settled.length > 0)
      logger.info({ settled: settled.length }, 'Completed minion activities settled');
  } catch (error) {
    logger.error({ error }, 'Failed to settle completed minion activities');
  } finally {
    settlementRunning = false;
  }
}

async function sendCompletionMessage(
  discordUserId: string,
  notificationChannelId: string,
  payload: {
    content: string;
    components: ActionRowBuilder<ButtonBuilder>[];
  },
): Promise<void> {
  try {
    const channel = await client.channels.fetch(notificationChannelId);
    if (channel?.isSendable()) {
      await channel.send(payload);
      return;
    }
    logger.warn({ notificationChannelId }, 'Completion channel is not sendable; trying DM');
  } catch (error) {
    logger.warn(
      { error, notificationChannelId },
      'Could not send to completion channel; trying DM',
    );
  }

  try {
    const user = await client.users.fetch(discordUserId);
    await user.send(payload);
  } catch (error) {
    logger.error(
      { error, discordUserId, notificationChannelId },
      'Could not deliver completion message to its channel or by DM',
    );
  }
}

client.once(Events.ClientReady, (readyClient) => {
  logger.info({ user: readyClient.user.tag }, 'Discord bot ready');
  void settleActivities();
  settlementTimer = setInterval(() => void settleActivities(), 5_000);
  settlementTimer.unref();
});
client.on(Events.InteractionCreate, (interaction) => {
  if (interaction.isChatInputCommand()) void handleCommand(interaction, game);
  else if (interaction.isButton() && interaction.customId.startsWith('repeatwc:'))
    void handleRepeatButton(interaction, game, repeatTripSigner);
  else if (interaction.isButton() && interaction.customId.startsWith('cancel:'))
    void handleCancelButton(interaction, game);
  else if (interaction.isButton() && interaction.customId.startsWith('bank:'))
    void handleBankPageButton(interaction, game);
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down');
  if (settlementTimer) clearInterval(settlementTimer);
  client.destroy();
  await database.end();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

void client.login(env.DISCORD_TOKEN);

function fallbackSkillIcon(skill: string): string {
  if (skill === 'woodcutting') return '🪓';
  if (skill === 'mining') return '⛏️';
  return '⭐';
}

function formatRate(xp: bigint): string {
  const value = formatXp(xp);
  const [whole, decimal] = value.split('.');
  const formattedWhole = BigInt(whole ?? '0').toLocaleString('en-US');
  return decimal ? `${formattedWhole}.${decimal}` : formattedWhole;
}
