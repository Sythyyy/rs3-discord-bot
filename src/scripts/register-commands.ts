import { REST, Routes } from 'discord.js';

import { loadEnvironment } from '../config/env.js';
import { commandDefinitions } from '../discord/commands.js';

const env = loadEnvironment();
const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
const route = env.DISCORD_GUILD_ID
  ? Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID)
  : Routes.applicationCommands(env.DISCORD_CLIENT_ID);

await rest.put(route, { body: commandDefinitions });
console.log(`Registered ${commandDefinitions.length} ${env.DISCORD_GUILD_ID ? 'guild' : 'global'} commands.`);
