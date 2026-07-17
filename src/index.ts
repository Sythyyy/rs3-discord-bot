import { Client, Events, GatewayIntentBits } from 'discord.js';
import pino from 'pino';

import { GameService } from './application/game-service.js';
import { loadEnvironment } from './config/env.js';
import { handleCommand } from './discord/interaction-handler.js';
import { createDatabase } from './infrastructure/database/database.js';

const env = loadEnvironment();
const logger = pino({ level: env.LOG_LEVEL });
const database = createDatabase(env.DATABASE_URL);
const game = new GameService(database);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => logger.info({ user: readyClient.user.tag }, 'Discord bot ready'));
client.on(Events.InteractionCreate, (interaction) => {
  if (interaction.isChatInputCommand()) void handleCommand(interaction, game);
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down');
  client.destroy();
  await database.end();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

void client.login(env.DISCORD_TOKEN);
