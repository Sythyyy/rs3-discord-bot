export type SkillKey = 'woodcutting' | 'mining' | 'fishing';

export interface ItemDefinition {
  key: string;
  name: string;
  description: string;
  sellPrice: bigint;
}

export interface ActivityDefinition {
  key: string;
  name: string;
  skill: SkillKey;
  durationMs: number;
  xp: bigint;
  rewards: ReadonlyArray<{ itemKey: string; quantity: bigint }>;
}

export const skills: ReadonlyArray<{ key: SkillKey; name: string }> = [
  { key: 'woodcutting', name: 'Woodcutting' },
  { key: 'mining', name: 'Mining' },
  { key: 'fishing', name: 'Fishing' },
];

export const items: Record<string, ItemDefinition> = {
  driftwood: { key: 'driftwood', name: 'Driftwood', description: 'Weathered timber from the coast.', sellPrice: 6n },
  copper_ore: { key: 'copper_ore', name: 'Copper ore', description: 'A common reddish ore.', sellPrice: 8n },
  river_fish: { key: 'river_fish', name: 'River fish', description: 'A fresh catch from a quiet river.', sellPrice: 7n },
  bronze_hatchet: { key: 'bronze_hatchet', name: 'Bronze hatchet', description: 'A dependable starter tool.', sellPrice: 40n },
};
export const activities: Record<string, ActivityDefinition> = {
  gather_driftwood: {
    key: 'gather_driftwood',
    name: 'Gather driftwood',
    skill: 'woodcutting',
    durationMs: 60_000,
    xp: 25n,
    rewards: [{ itemKey: 'driftwood', quantity: 3n }],
  },
  mine_copper: {
    key: 'mine_copper',
    name: 'Mine copper',
    skill: 'mining',
    durationMs: 60_000,
    xp: 25n,
    rewards: [{ itemKey: 'copper_ore', quantity: 3n }],
  },
  catch_river_fish: {
    key: 'catch_river_fish',
    name: 'Catch river fish',
    skill: 'fishing',
    durationMs: 60_000,
    xp: 25n,
    rewards: [{ itemKey: 'river_fish', quantity: 3n }],
  },
};
