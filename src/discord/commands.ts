import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { activities } from '../content/game-content.js';
import { MAX_LEVEL } from '../domain/skills/levels.js';
import { trees } from '../domain/woodcutting/catalogue.js';
import { hatchets } from '../domain/woodcutting/hatchets.js';

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName('chop')
    .setDescription('Send your minion to chop logs.')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('Logs to chop; omit to use your best verified method.')
        .addChoices(...trees.map((tree) => ({ name: tree.logName, value: tree.key }))),
    )
    .addIntegerOption((option) =>
      option
        .setName('quantity')
        .setDescription('Optional target number of successful logs.')
        .setMinValue(1)
        .setMaxValue(10_000),
    ),
  new SlashCommandBuilder()
    .setName('equip')
    .setDescription('Equip an owned item in your loadout.')
    .addStringOption((option) =>
      option
        .setName('hatchet')
        .setDescription('Hatchet to equip.')
        .setRequired(true)
        .addChoices(...hatchets.map((hatchet) => ({ name: hatchet.name, value: hatchet.key }))),
    ),
  new SlashCommandBuilder()
    .setName('quest')
    .setDescription('Send your minion questing for 30 minutes.'),
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View a character profile.')
    .addUserOption((option) => option.setName('user').setDescription('The character owner.')),
  new SlashCommandBuilder()
    .setName('skills')
    .setDescription('View a character skills screen.')
    .addUserOption((option) => option.setName('user').setDescription('The character owner.')),
  new SlashCommandBuilder()
    .setName('bank')
    .setDescription('View your bank.')
    .addUserOption((option) => option.setName('user').setDescription('The bank owner.')),
  new SlashCommandBuilder()
    .setName('minion')
    .setDescription('Manage your current activity.')
    .addSubcommand((subcommand) =>
      subcommand.setName('buy').setDescription('Buy your first minion.'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('start')
        .setDescription('Start a timed activity.')
        .addStringOption((option) =>
          option
            .setName('activity')
            .setDescription('Activity to start.')
            .setRequired(true)
            .addChoices(
              ...Object.values(activities)
                .filter((activity) => !activity.isQuest && activity.skill !== 'woodcutting')
                .map((activity) => ({
                  name: activity.name,
                  value: activity.key,
                })),
            ),
        )
        .addIntegerOption((option) =>
          option
            .setName('quantity')
            .setDescription('Number of items to gather; defaults to a trip of up to 30 minutes.')
            .setMinValue(1),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('status').setDescription('Check your current activity.'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('cancel')
        .setDescription('Cancel the current activity without receiving XP or items.'),
    ),
  new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell an item from your bank to the NPC shop.')
    .addStringOption((option) =>
      option.setName('item').setDescription('Item key, such as driftwood.').setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('quantity').setDescription('Number to sell.').setRequired(true).setMinValue(1),
    ),
  new SlashCommandBuilder().setName('help').setDescription('Learn the Phase 1 commands.'),
  new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Administrative game controls.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('skill')
        .setDescription("Set a user's skill level.")
        .addUserOption((option) =>
          option.setName('user').setDescription('Minion owner.').setRequired(true),
        )
        .addStringOption((option) =>
          option.setName('skill').setDescription('Skill key, such as mining.').setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName('level')
            .setDescription('New level.')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(MAX_LEVEL),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('item')
        .setDescription("Set a user's item quantity.")
        .addUserOption((option) =>
          option.setName('user').setDescription('Minion owner.').setRequired(true),
        )
        .addStringOption((option) =>
          option.setName('item').setDescription('Item key.').setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName('quantity')
            .setDescription('Exact quantity; use 0 to remove it.')
            .setRequired(true)
            .setMinValue(0),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('coins')
        .setDescription("Set a user's coin balance.")
        .addUserOption((option) =>
          option.setName('user').setDescription('Minion owner.').setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName('amount')
            .setDescription('Exact coin balance.')
            .setRequired(true)
            .setMinValue(0),
        ),
    ),
].map((command) => command.toJSON());
