import { trees } from '../domain/woodcutting/catalogue.js';
import { hatchets } from '../domain/woodcutting/hatchets.js';

export const skillKeys = [
  'attack',
  'constitution',
  'mining',
  'strength',
  'agility',
  'smithing',
  'defence',
  'herblore',
  'fishing',
  'ranged',
  'thieving',
  'cooking',
  'prayer',
  'crafting',
  'firemaking',
  'magic',
  'fletching',
  'woodcutting',
  'runecrafting',
  'slayer',
  'farming',
  'construction',
  'hunter',
  'summoning',
  'dungeoneering',
  'divination',
  'invention',
  'archaeology',
  'necromancy',
] as const;

export type SkillKey = (typeof skillKeys)[number];

export interface ItemDefinition {
  key: string;
  name: string;
  description: string;
  sellPrice?: bigint;
  iconFile: string;
  imageSourceUrl?: string;
  buyPrice?: bigint;
}

export interface ActivityDefinition {
  key: string;
  name: string;
  skill: SkillKey;
  requiredLevel: number;
  durationMs?: number;
  minDurationMs?: number;
  maxDurationMs?: number;
  xp: bigint;
  baseQuantity: bigint;
  inputs?: ReadonlyArray<{ itemKey: string; quantity: bigint }>;
  requiredItems?: ReadonlyArray<string>;
  requiredSkills?: ReadonlyArray<{ skill: SkillKey; level: number }>;
  rewards: ReadonlyArray<{ itemKey: string; quantity: bigint }>;
  isQuest?: boolean;
}

export const skills: ReadonlyArray<{ key: SkillKey; name: string }> = skillKeys.map((key) => ({
  key,
  name: key.slice(0, 1).toUpperCase() + key.slice(1),
}));

const item = (
  key: string,
  name: string,
  description: string,
  sellPrice: bigint | undefined,
  iconFile = `${key}.png`,
  buyPrice?: bigint,
): ItemDefinition => ({ key, name, description, sellPrice, iconFile, buyPrice });

export const items: Record<string, ItemDefinition> = Object.fromEntries(
  [
    item('copper_ore', 'Copper ore', 'A common reddish ore.', 8n),
    ...hatchets.map((hatchet) =>
      item(hatchet.key, hatchet.name, 'A reusable Woodcutting tool.', undefined, hatchet.iconFile),
    ),
    ...trees.map((tree) =>
      item(
        tree.logKey,
        tree.logName,
        `Logs cut from a ${tree.name.toLowerCase()}.`,
        undefined,
        `woodcutting/${tree.logKey}.png`,
      ),
    ),
  ].map((definition) => [definition.key, definition]),
);

const activityDefinitions: ActivityDefinition[] = [
  ...trees.map((tree): ActivityDefinition => ({
    key: `woodcutting_${tree.key}`,
    name: `Chop ${tree.name.toLowerCase()}`,
    skill: 'woodcutting',
    requiredLevel: tree.requiredLevel,
    durationMs: Math.max(
      1,
      Math.round((Number(tree.xpPerLog) * 3_600_000) / 10 / tree.balance.baseXpPerHour),
    ),
    minDurationMs: Math.max(
      1,
      Math.round(((Number(tree.xpPerLog) * 3_600_000) / 10 / tree.balance.baseXpPerHour) * 0.9),
    ),
    maxDurationMs: Math.max(
      1,
      Math.round(((Number(tree.xpPerLog) * 3_600_000) / 10 / tree.balance.baseXpPerHour) * 1.1),
    ),
    xp: tree.xpPerLog,
    baseQuantity: 1n,
    rewards: [{ itemKey: tree.logKey, quantity: 1n }],
  })),
  {
    key: 'mine_copper',
    name: 'Mine copper',
    skill: 'mining',
    requiredLevel: 1,
    durationMs: 60_000,
    xp: 250n,
    baseQuantity: 3n,
    rewards: [{ itemKey: 'copper_ore', quantity: 3n }],
  },
  {
    key: 'questing',
    name: 'Questing',
    skill: 'dungeoneering',
    requiredLevel: 1,
    durationMs: 30 * 60_000,
    xp: 0n,
    baseQuantity: 1n,
    rewards: [],
    isQuest: true,
  },
];

export const activities: Record<string, ActivityDefinition> = Object.fromEntries(
  activityDefinitions.map((definition) => [definition.key, definition]),
);
