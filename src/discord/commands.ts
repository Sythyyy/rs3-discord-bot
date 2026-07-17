import { SlashCommandBuilder } from 'discord.js';

import { activities } from '../content/game-content.js';

export const commandDefinitions = [
  new SlashCommandBuilder().setName('start').setDescription('Create your persistent game character.'),
  new SlashCommandBuilder().setName('profile').setDescription('View a character profile.').addUserOption((option) => option.setName('user').setDescription('The character owner.')),
  new SlashCommandBuilder().setName('bank').setDescription('View your bank.').addUserOption((option) => option.setName('user').setDescription('The bank owner.')),
  new SlashCommandBuilder()
    .setName('minion')
    .setDescription('Manage your current activity.')
    .addSubcommand((subcommand) => subcommand.setName('start').setDescription('Start a timed activity.').addStringOption((option) => option.setName('activity').setDescription('Activity to start.').setRequired(true).addChoices(...Object.values(activities).map((activity) => ({ name: activity.name, value: activity.key })))))
    .addSubcommand((subcommand) => subcommand.setName('status').setDescription('Check your current activity.'))
    .addSubcommand((subcommand) => subcommand.setName('claim').setDescription('Claim a completed activity.')),
  new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell an item from your bank to the NPC shop.')
    .addStringOption((option) => option.setName('item').setDescription('Item key, such as driftwood.').setRequired(true))
    .addIntegerOption((option) => option.setName('quantity').setDescription('Number to sell.').setRequired(true).setMinValue(1)),
  new SlashCommandBuilder().setName('help').setDescription('Learn the Phase 1 commands.'),
].map((command) => command.toJSON());
