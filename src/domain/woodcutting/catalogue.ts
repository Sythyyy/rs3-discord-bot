export const WOODCUTTING_CATALOGUE_VERSION = '2026-07-18';
export const WOODCUTTING_TRAINING_SOURCE =
  'https://runescape.wiki/w/Pay-to-play_Woodcutting_training';

export interface TreeDefinition {
  key: string;
  name: string;
  requiredLevel: number;
  logKey: string;
  logName: string;
  xpPerLog: bigint;
  source: {
    treeUrl: string;
    trainingUrl: string;
    verifiedOn: string;
    verifiedRs3Data: string;
  };
  assumptions: readonly string[];
  balance: {
    baseXpPerHour: number;
    maxPotentialLogsPerTrip: number;
    rateSource: string;
    needsVerification: boolean;
  };
}

const wiki = (page: string): string => `https://runescape.wiki/w/${page}`;

export const trees: readonly TreeDefinition[] = [
  tree(
    'regular',
    'Regular tree',
    1,
    'logs',
    'Logs',
    250n,
    14_500,
    'Tree',
    false,
    [
      'The guide calls this an upper rate and mentions a dwarven army axe; the bot abstracts tools.',
    ],
    2_100,
  ),
  tree('oak', 'Oak tree', 15, 'oak_logs', 'Oak logs', 375n, 19_000, 'Oak', false, undefined, 2_800),
  tree('willow', 'Willow tree', 20, 'willow_logs', 'Willow logs', 675n, 27_000, 'Willow', false),
  tree('teak', 'Teak tree', 30, 'teak_logs', 'Teak logs', 850n, 30_000, 'Teak', false, [
    'The conservative low end of the Wiki 30,000–41,000 XP/hour range is used.',
  ]),
  tree('maple', 'Maple tree', 40, 'maple_logs', 'Maple logs', 1_000n, 40_000, 'Maple_tree', false, [
    'The conservative low end of the Wiki 40,000–55,000 XP/hour range is used.',
  ]),
  tree(
    'acadia',
    'Acadia tree',
    50,
    'acadia_logs',
    'Acadia logs',
    800n,
    55_000,
    'Acadia_tree',
    false,
    ['Uses the level-50 unboosted rate from the training guide.'],
  ),
  tree(
    'mahogany',
    'Mahogany tree',
    60,
    'mahogany_logs',
    'Mahogany logs',
    1_250n,
    63_000,
    'Mahogany',
    false,
    ['Uses the conservative low end of the Wiki 63,000–109,000 XP/hour range.'],
  ),
  tree('yew', 'Yew tree', 70, 'yew_logs', 'Yew logs', 5_625n, 80_000, 'Yew_tree', true),
  tree('magic', 'Magic tree', 80, 'magic_logs', 'Magic logs', 10_950n, 100_000, 'Magic_tree', true),
  tree('elder', 'Elder tree', 90, 'elder_logs', 'Elder logs', 12_750n, 130_000, 'Elder_tree', true),
  tree(
    'eternal_magic',
    'Eternal magic tree',
    100,
    'eternal_magic_logs',
    'Eternal magic logs',
    19_050n,
    300_000,
    'Eternal_magic_tree',
    true,
    ['Published rates include boosts and special mechanics that this slice intentionally omits.'],
  ),
];

export const treesByKey: Readonly<Record<string, TreeDefinition>> = Object.fromEntries(
  trees.map((definition) => [definition.key, definition]),
);

export function bestVerifiedTree(level: number): TreeDefinition | null {
  return (
    trees
      .filter((definition) => !definition.balance.needsVerification)
      .filter((definition) => definition.requiredLevel <= level)
      .sort((left, right) => right.requiredLevel - left.requiredLevel)[0] ?? null
  );
}

function tree(
  key: string,
  name: string,
  requiredLevel: number,
  logKey: string,
  logName: string,
  xpPerLog: bigint,
  baseXpPerHour: number,
  wikiPage: string,
  needsVerification: boolean,
  assumptions: readonly string[] = [
    'Rates vary with level, location, boosts, and tool tier; the bot uses one curated baseline.',
  ],
  maxPotentialLogsPerTrip = 100,
): TreeDefinition {
  return {
    key,
    name,
    requiredLevel,
    logKey,
    logName,
    xpPerLog,
    source: {
      treeUrl: wiki(wikiPage),
      trainingUrl: WOODCUTTING_TRAINING_SOURCE,
      verifiedOn: WOODCUTTING_CATALOGUE_VERSION,
      verifiedRs3Data: 'Required level, XP per log, log type, and published training-rate context.',
    },
    assumptions,
    balance: {
      baseXpPerHour,
      maxPotentialLogsPerTrip,
      rateSource: needsVerification
        ? 'Bot provisional baseline; excluded from automatic best-tree selection.'
        : 'Conservative RS3 training-guide estimate used as the bot baseline.',
      needsVerification,
    },
  };
}
