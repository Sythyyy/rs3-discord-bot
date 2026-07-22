import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { REST, Routes, type RESTGetAPIGuildEmojisResult } from 'discord.js';

import { loadEnvironment } from '../config/env.js';

const env = loadEnvironment();
if (!env.DISCORD_GUILD_ID)
  throw new Error('DISCORD_GUILD_ID is required to register skill emojis.');

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
const skillIcons = [
  ['mining', '21px-Mining-icon.png'],
  ['woodcutting', '21px-Woodcutting-icon.png'],
] as const;
const route = Routes.guildEmojis(env.DISCORD_GUILD_ID);
const existing = (await rest.get(route)) as RESTGetAPIGuildEmojisResult;

for (const [skill, filename] of skillIcons) {
  const name = `skill_${skill}`;
  if (existing.some((emoji) => emoji.name === name)) continue;
  const image = await readFile(resolve('assets/items/icons', filename));
  await rest.post(route, {
    body: { name, image: `data:image/png;base64,${image.toString('base64')}` },
  });
  console.log(`Registered ${name}.`);
}
