export const HATCHET_CHANCE_FORMULA_VERSION = 'regular-logs-hatchet-v1';
export const OAK_HATCHET_CHANCE_FORMULA_VERSION = 'oak-logs-hatchet-v1';
export const MAX_CUT_CHANCE_LEVEL = 110;

export interface HatchetDefinition {
  key: string;
  name: string;
  requiredLevel: number;
  iconFile: string;
}

export const hatchets: readonly HatchetDefinition[] = [
  hatchet('bronze_hatchet', 'Bronze hatchet', 1, 'bronze_hatchet.png'),
  hatchet('iron_hatchet', 'Iron hatchet', 10, 'iron_hatchet.png'),
  hatchet('steel_hatchet', 'Steel hatchet', 20, 'steel_hatchet.png'),
  hatchet('black_hatchet', 'Black hatchet', 25, 'black_hatchet.png'),
  hatchet('mithril_hatchet', 'Mithril hatchet', 30, 'Mithril_hatchet.png'),
  hatchet('adamant_hatchet', 'Adamant hatchet', 40, 'Adamant_hatchet.png'),
  hatchet('rune_hatchet', 'Rune hatchet', 50, 'Rune_hatchet.png'),
  hatchet('orikalkum_hatchet', 'Orikalkum hatchet', 60, 'Orikalkum_hatchet.png'),
  hatchet('dragon_hatchet', 'Dragon hatchet', 60, 'Dragon_hatchet.png'),
  hatchet('necronium_hatchet', 'Necronium hatchet', 70, 'Necronium_hatchet.png'),
  hatchet('crystal_hatchet', 'Crystal hatchet', 70, 'Crystal_hatchet.png'),
  hatchet('bane_hatchet', 'Bane hatchet', 80, 'Bane_hatchet.png'),
  hatchet('imcando_hatchet', 'Imcando hatchet', 80, 'Imcando_hatchet.png'),
  hatchet('elder_rune_hatchet', 'Elder rune hatchet', 90, 'Elder_rune_hatchet.png'),
  hatchet(
    'hatchet_of_ember_and_glade',
    'Hatchet of ember and glade',
    90,
    'Hatchet_of_ember_and_glade.png',
  ),
  hatchet('primal_hatchet', 'Primal hatchet', 100, 'Primal_hatchet.png'),
  hatchet(
    'hatchet_of_bloom_and_blight',
    'Hatchet of bloom and blight',
    100,
    'Hatchet_of_bloom_and_blight.png',
  ),
];

export const hatchetsByKey: Readonly<Record<string, HatchetDefinition>> = Object.fromEntries(
  hatchets.map((definition) => [definition.key, definition]),
);

const chanceAnchors: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  bronze_hatchet: [
    [1, 2510],
    [10, 3000],
    [20, 3544],
    [30, 4088],
    [40, 4632],
    [50, 5176],
    [60, 5721],
    [70, 6265],
    [80, 6809],
    [90, 7353],
    [99, 7843],
    [110, 8442],
  ],
  iron_hatchet: [
    [10, 4499],
    [20, 5316],
    [30, 6132],
    [40, 6948],
    [50, 7765],
    [60, 8581],
    [70, 9397],
    [78, 10000],
    [110, 10000],
  ],
  steel_hatchet: [
    [20, 7088],
    [30, 8176],
    [40, 9264],
    [47, 10000],
    [110, 10000],
  ],
  black_hatchet: [
    [25, 8586],
    [30, 9198],
    [37, 10000],
    [110, 10000],
  ],
};

export const OAK_CUT_CHANCE_SOURCE = {
  provenance: 'verified/manual' as const,
  treeSlug: 'oak',
  requiredWoodcuttingLevel: 15,
  effectiveLevelCap: 110,
};

export const WILLOW_CUT_CHANCE_SOURCE = {
  provenance: 'verified/manual' as const,
  treeSlug: 'willow',
  displayName: 'Willow tree',
  logItemSlug: 'willow_logs',
  logItemName: 'Willow logs',
  requiredWoodcuttingLevel: 20,
  effectiveLevelCap: 110,
};

export const WILLOW_HATCHET_CHANCE_FORMULA_VERSION = 'willow-logs-hatchet-v1';

export const MAPLE_CUT_CHANCE_SOURCE = {
  provenance: 'verified/manual' as const,
  treeSlug: 'maple',
  displayName: 'Maple tree',
  logItemSlug: 'maple_logs',
  logItemName: 'Maple logs',
  requiredWoodcuttingLevel: 40,
  effectiveLevelCap: 110,
};

export const MAPLE_HATCHET_CHANCE_FORMULA_VERSION = 'maple-logs-hatchet-v1';

export const YEW_CUT_CHANCE_SOURCE = {
  provenance: 'verified/manual' as const,
  treeSlug: 'yew',
  displayName: 'Yew tree',
  logItemSlug: 'yew_logs',
  logItemName: 'Yew logs',
  requiredWoodcuttingLevel: 70,
  effectiveLevelCap: 110,
};

export const YEW_HATCHET_CHANCE_FORMULA_VERSION = 'yew-logs-hatchet-v1';

export const MAGIC_CUT_CHANCE_SOURCE = {
  provenance: 'verified/manual' as const,
  treeSlug: 'magic',
  displayName: 'Magic tree',
  logItemSlug: 'magic_logs',
  logItemName: 'Magic logs',
  requiredWoodcuttingLevel: 80,
  effectiveLevelCap: 110,
};

export const MAGIC_HATCHET_CHANCE_FORMULA_VERSION = 'magic-logs-hatchet-v1';

const oakChanceAnchors: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  bronze_hatchet: [
    [15, 1636],
    [20, 1772],
    [30, 2044],
    [40, 2316],
    [50, 2588],
    [60, 2860],
    [70, 3132],
    [80, 3405],
    [90, 3677],
    [99, 3922],
    [110, 4221],
  ],
  iron_hatchet: [
    [15, 2454],
    [20, 2658],
    [30, 3066],
    [40, 3474],
    [50, 3882],
    [60, 4331],
    [70, 4699],
    [80, 5107],
    [90, 5515],
    [99, 5882],
    [110, 6331],
  ],
  steel_hatchet: [
    [20, 3544],
    [30, 4088],
    [40, 4632],
    [50, 5176],
    [60, 5721],
    [70, 6265],
    [80, 6809],
    [90, 7353],
    [99, 7843],
    [110, 8442],
  ],
  black_hatchet: [
    [25, 4293],
    [30, 4599],
    [40, 5211],
    [50, 5824],
    [60, 6436],
    [70, 7048],
    [80, 7660],
    [90, 8273],
    [99, 8824],
    [110, 9497],
  ],
  mithril_hatchet: [
    [30, 5314],
    [40, 6022],
    [50, 6729],
    [60, 7437],
    [70, 8144],
    [80, 8852],
    [90, 9559],
    [97, 10000],
    [110, 10000],
  ],
  adamant_hatchet: [
    [40, 7238],
    [50, 8088],
    [60, 8939],
    [70, 9789],
    [73, 10000],
    [110, 10000],
  ],
  rune_hatchet: [
    [50, 9447],
    [57, 10000],
    [110, 10000],
  ],
  orikalkum_hatchet: [
    [60, 10000],
    [110, 10000],
  ],
  dragon_hatchet: [
    [60, 10000],
    [110, 10000],
  ],
  necronium_hatchet: [
    [70, 10000],
    [110, 10000],
  ],
  crystal_hatchet: [
    [70, 10000],
    [110, 10000],
  ],
  bane_hatchet: [
    [80, 10000],
    [110, 10000],
  ],
  imcando_hatchet: [
    [80, 10000],
    [110, 10000],
  ],
  elder_rune_hatchet: [
    [90, 10000],
    [110, 10000],
  ],
  hatchet_of_ember_and_glade: [
    [90, 10000],
    [110, 10000],
  ],
  primal_hatchet: [
    [100, 10000],
    [110, 10000],
  ],
  hatchet_of_bloom_and_blight: [
    [100, 10000],
    [110, 10000],
  ],
};

const willowChanceAnchors: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  bronze_hatchet: [
    [20, 886],
    [30, 1022],
    [40, 1158],
    [50, 1294],
    [60, 1430],
    [70, 1566],
    [80, 1702],
    [90, 1838],
    [99, 1961],
    [110, 2110],
  ],
  iron_hatchet: [
    [20, 1329],
    [30, 1533],
    [40, 1737],
    [50, 1941],
    [60, 2145],
    [70, 2349],
    [80, 2553],
    [90, 2757],
    [99, 2941],
    [110, 3166],
  ],
  steel_hatchet: [
    [20, 1772],
    [30, 2044],
    [40, 2316],
    [50, 2588],
    [60, 2860],
    [70, 3132],
    [80, 3405],
    [90, 3677],
    [99, 3922],
    [110, 4221],
  ],
  black_hatchet: [
    [25, 2146],
    [30, 2300],
    [40, 2606],
    [50, 2912],
    [60, 3218],
    [70, 3524],
    [80, 3830],
    [90, 4136],
    [99, 4412],
    [110, 4748],
  ],
  mithril_hatchet: [
    [30, 2657],
    [40, 3011],
    [50, 3365],
    [60, 3718],
    [70, 4072],
    [80, 4426],
    [90, 4780],
    [99, 5098],
    [110, 5487],
  ],
  adamant_hatchet: [
    [40, 3619],
    [50, 4044],
    [60, 4469],
    [70, 4894],
    [80, 5320],
    [90, 5745],
    [99, 6127],
    [110, 6595],
  ],
  rune_hatchet: [
    [50, 4724],
    [60, 5220],
    [70, 5717],
    [80, 6213],
    [90, 6710],
    [99, 7157],
    [110, 7703],
  ],
  orikalkum_hatchet: [
    [60, 6221],
    [70, 6813],
    [80, 7405],
    [90, 7997],
    [99, 8529],
    [110, 9180],
  ],
  dragon_hatchet: [
    [60, 6436],
    [70, 7048],
    [80, 7660],
    [90, 8273],
    [99, 8824],
    [110, 9467],
  ],
  necronium_hatchet: [
    [70, 7675],
    [80, 8341],
    [90, 9008],
    [99, 9608],
    [105, 10000],
    [110, 10000],
  ],
  crystal_hatchet: [
    [70, 7909],
    [80, 8597],
    [90, 9284],
    [99, 9902],
    [101, 10000],
    [110, 10000],
  ],
  bane_hatchet: [
    [80, 9277],
    [90, 10000],
    [110, 10000],
  ],
  imcando_hatchet: [
    [80, 9958],
    [81, 10000],
    [110, 10000],
  ],
  elder_rune_hatchet: [
    [90, 10000],
    [110, 10000],
  ],
  hatchet_of_ember_and_glade: [
    [90, 10000],
    [110, 10000],
  ],
  primal_hatchet: [
    [100, 10000],
    [110, 10000],
  ],
  hatchet_of_bloom_and_blight: [
    [100, 10000],
    [110, 10000],
  ],
};

const mapleChanceAnchors: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  bronze_hatchet: [
    [40, 905],
    [50, 1011],
    [60, 1117],
    [70, 1224],
    [80, 1330],
    [90, 1436],
    [99, 1532],
    [110, 1649],
  ],
  iron_hatchet: [
    [40, 1357],
    [50, 1517],
    [60, 1676],
    [70, 1835],
    [80, 1995],
    [90, 2154],
    [99, 2298],
    [110, 2473],
  ],
  steel_hatchet: [
    [40, 1809],
    [50, 2022],
    [60, 2235],
    [70, 2447],
    [80, 2660],
    [90, 2872],
    [99, 3064],
    [110, 3298],
  ],
  black_hatchet: [
    [40, 2036],
    [50, 2275],
    [60, 2514],
    [70, 2753],
    [80, 2992],
    [90, 3231],
    [99, 3447],
    [110, 3710],
  ],
  mithril_hatchet: [
    [40, 2352],
    [50, 2629],
    [60, 2905],
    [70, 3181],
    [80, 3458],
    [90, 3734],
    [99, 3983],
    [110, 4287],
  ],
  adamant_hatchet: [
    [40, 2870],
    [50, 3159],
    [60, 3492],
    [70, 3824],
    [80, 4156],
    [90, 4488],
    [99, 4787],
    [110, 5152],
  ],
  rune_hatchet: [
    [50, 3690],
    [60, 4078],
    [70, 4486],
    [80, 4854],
    [90, 5242],
    [99, 5591],
    [110, 6018],
  ],
  orikalkum_hatchet: [
    [60, 4860],
    [70, 5323],
    [80, 5785],
    [90, 6247],
    [99, 6664],
    [110, 7172],
  ],
  dragon_hatchet: [
    [60, 5028],
    [70, 5506],
    [80, 5985],
    [90, 6463],
    [99, 6893],
    [110, 7420],
  ],
  necronium_hatchet: [
    [70, 5996],
    [80, 6517],
    [90, 7037],
    [99, 7506],
    [110, 8079],
  ],
  crystal_hatchet: [
    [70, 6179],
    [80, 6716],
    [90, 7253],
    [99, 7736],
    [110, 8326],
  ],
  bane_hatchet: [
    [80, 7248],
    [90, 7827],
    [99, 8349],
    [110, 8986],
  ],
  imcando_hatchet: [
    [80, 7780],
    [90, 8402],
    [99, 8961],
    [110, 9645],
  ],
  elder_rune_hatchet: [
    [90, 8976],
    [99, 9574],
    [106, 10000],
    [110, 10000],
  ],
  hatchet_of_ember_and_glade: [
    [99, 9842],
    [102, 10000],
    [110, 10000],
  ],
  primal_hatchet: [
    [100, 10000],
    [110, 10000],
  ],
  hatchet_of_bloom_and_blight: [
    [100, 10000],
    [110, 10000],
  ],
};

const yewChanceAnchors: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  bronze_hatchet: [
    [70, 587],
    [80, 638],
    [90, 689],
    [100, 740],
    [110, 791],
  ],
  iron_hatchet: [
    [70, 881],
    [80, 958],
    [90, 1034],
    [100, 1111],
    [110, 1187],
  ],
  steel_hatchet: [
    [70, 1175],
    [80, 1277],
    [90, 1379],
    [100, 1481],
    [110, 1583],
  ],
  black_hatchet: [
    [70, 1321],
    [80, 1436],
    [90, 1551],
    [100, 1666],
    [110, 1781],
  ],
  mithril_hatchet: [
    [70, 1527],
    [80, 1660],
    [90, 1792],
    [100, 1925],
    [110, 2058],
  ],
  adamant_hatchet: [
    [70, 1835],
    [80, 1995],
    [90, 2154],
    [100, 2314],
    [110, 2473],
  ],
  rune_hatchet: [
    [70, 2144],
    [80, 2330],
    [90, 2516],
    [100, 2702],
    [110, 2989],
  ],
  orikalkum_hatchet: [
    [70, 2555],
    [80, 2777],
    [90, 2999],
    [100, 3221],
    [110, 3443],
  ],
  dragon_hatchet: [
    [70, 2643],
    [80, 2873],
    [90, 3102],
    [100, 3332],
    [110, 3561],
  ],
  necronium_hatchet: [
    [70, 2878],
    [80, 3128],
    [90, 3378],
    [100, 3628],
    [110, 3878],
  ],
  crystal_hatchet: [
    [70, 2966],
    [80, 3224],
    [90, 3481],
    [100, 3739],
    [110, 3997],
  ],
  bane_hatchet: [
    [80, 3479],
    [90, 3757],
    [100, 4035],
    [110, 4313],
  ],
  imcando_hatchet: [
    [80, 3734],
    [90, 4033],
    [100, 4331],
    [110, 4630],
  ],
  elder_rune_hatchet: [
    [90, 4309],
    [100, 4627],
    [110, 4946],
  ],
  hatchet_of_ember_and_glade: [
    [90, 4429],
    [100, 4757],
    [110, 5085],
  ],
  primal_hatchet: [
    [100, 5053],
    [110, 5401],
  ],
  hatchet_of_bloom_and_blight: [
    [100, 5183],
    [110, 5540],
  ],
};

const magicChanceAnchors: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
  bronze_hatchet: [
    [80, 319],
    [90, 345],
    [100, 370],
    [110, 396],
  ],
  iron_hatchet: [
    [80, 479],
    [90, 517],
    [100, 555],
    [110, 594],
  ],
  steel_hatchet: [
    [80, 638],
    [90, 689],
    [100, 740],
    [110, 791],
  ],
  black_hatchet: [
    [80, 638],
    [90, 776],
    [100, 833],
    [110, 890],
  ],
  mithril_hatchet: [
    [80, 830],
    [90, 896],
    [100, 963],
    [110, 1029],
  ],
  adamant_hatchet: [
    [80, 997],
    [90, 1077],
    [100, 1157],
    [110, 1237],
  ],
  rune_hatchet: [
    [80, 1165],
    [90, 1258],
    [100, 1351],
    [110, 1444],
  ],
  orikalkum_hatchet: [
    [80, 1388],
    [90, 1499],
    [100, 1610],
    [110, 1721],
  ],
  dragon_hatchet: [
    [80, 1436],
    [90, 1551],
    [100, 1666],
    [110, 1781],
  ],
  necronium_hatchet: [
    [80, 1564],
    [90, 1689],
    [100, 1814],
    [110, 1939],
  ],
  crystal_hatchet: [
    [80, 1612],
    [90, 1741],
    [100, 1869],
    [110, 1998],
  ],
  bane_hatchet: [
    [80, 1740],
    [90, 1879],
    [100, 2018],
    [110, 2157],
  ],
  imcando_hatchet: [
    [80, 1867],
    [90, 2016],
    [100, 2166],
    [110, 2315],
  ],
  elder_rune_hatchet: [
    [90, 2154],
    [100, 2314],
    [110, 2473],
  ],
  hatchet_of_ember_and_glade: [
    [90, 2215],
    [100, 2379],
    [110, 2542],
  ],
  primal_hatchet: [
    [100, 2527],
    [110, 2701],
  ],
  hatchet_of_bloom_and_blight: [
    [100, 2591],
    [110, 2770],
  ],
};

export interface HatchetBoostSnapshot {
  hatchetKey: string;
  hatchetName: string;
  playerLevel: number;
  effectiveLevel: number;
  cutChanceBasisPoints: number;
  bronzeChanceBasisPoints: number;
  successMultiplier: number;
  formulaVersion: string;
}

export function regularLogsHatchetBoost(
  hatchetKey: string,
  playerWoodcuttingLevel: number,
): HatchetBoostSnapshot {
  const definition = hatchetsByKey[hatchetKey];
  if (!definition) throw new Error('That hatchet does not exist.');
  if (playerWoodcuttingLevel < definition.requiredLevel)
    throw new Error(`${definition.name} requires level ${definition.requiredLevel} Woodcutting.`);
  const effectiveLevel = Math.min(playerWoodcuttingLevel, MAX_CUT_CHANCE_LEVEL);
  const cutChanceBasisPoints = chanceFor(definition, effectiveLevel);
  const bronzeChanceBasisPoints = interpolate(chanceAnchors.bronze_hatchet!, effectiveLevel);
  return {
    hatchetKey,
    hatchetName: definition.name,
    playerLevel: playerWoodcuttingLevel,
    effectiveLevel,
    cutChanceBasisPoints,
    bronzeChanceBasisPoints,
    successMultiplier: cutChanceBasisPoints / bronzeChanceBasisPoints,
    formulaVersion: HATCHET_CHANCE_FORMULA_VERSION,
  };
}

export function oakLogsHatchetBoost(
  hatchetKey: string,
  playerWoodcuttingLevel: number,
): HatchetBoostSnapshot {
  const definition = hatchetsByKey[hatchetKey];
  if (!definition) throw new Error('That hatchet does not exist.');
  if (playerWoodcuttingLevel < OAK_CUT_CHANCE_SOURCE.requiredWoodcuttingLevel)
    throw new Error('Oak logs require level 15 Woodcutting.');
  if (playerWoodcuttingLevel < definition.requiredLevel)
    throw new Error(`${definition.name} requires level ${definition.requiredLevel} Woodcutting.`);
  const effectiveLevel = Math.min(playerWoodcuttingLevel, MAX_CUT_CHANCE_LEVEL);
  const anchors = oakChanceAnchors[hatchetKey];
  if (!anchors) throw new Error('Oak cut-chance data is missing for that hatchet.');
  const cutChanceBasisPoints = interpolate(anchors, effectiveLevel);
  const bronzeChanceBasisPoints = interpolate(oakChanceAnchors.bronze_hatchet!, effectiveLevel);
  return {
    hatchetKey,
    hatchetName: definition.name,
    playerLevel: playerWoodcuttingLevel,
    effectiveLevel,
    cutChanceBasisPoints,
    bronzeChanceBasisPoints,
    successMultiplier: cutChanceBasisPoints / bronzeChanceBasisPoints,
    formulaVersion: OAK_HATCHET_CHANCE_FORMULA_VERSION,
  };
}

export function willowLogsHatchetBoost(
  hatchetKey: string,
  playerWoodcuttingLevel: number,
): HatchetBoostSnapshot {
  const definition = hatchetsByKey[hatchetKey];
  if (!definition) throw new Error('That hatchet does not exist.');
  if (playerWoodcuttingLevel < WILLOW_CUT_CHANCE_SOURCE.requiredWoodcuttingLevel)
    throw new Error('Willow logs require level 20 Woodcutting.');
  if (playerWoodcuttingLevel < definition.requiredLevel)
    throw new Error(`${definition.name} requires level ${definition.requiredLevel} Woodcutting.`);
  const effectiveLevel = Math.min(playerWoodcuttingLevel, MAX_CUT_CHANCE_LEVEL);
  const anchors = willowChanceAnchors[hatchetKey];
  if (!anchors) throw new Error('Willow cut-chance data is missing for that hatchet.');
  const cutChanceBasisPoints = interpolate(anchors, effectiveLevel);
  const bronzeChanceBasisPoints = interpolate(willowChanceAnchors.bronze_hatchet!, effectiveLevel);
  return {
    hatchetKey,
    hatchetName: definition.name,
    playerLevel: playerWoodcuttingLevel,
    effectiveLevel,
    cutChanceBasisPoints,
    bronzeChanceBasisPoints,
    successMultiplier: cutChanceBasisPoints / bronzeChanceBasisPoints,
    formulaVersion: WILLOW_HATCHET_CHANCE_FORMULA_VERSION,
  };
}

export function mapleLogsHatchetBoost(
  hatchetKey: string,
  playerWoodcuttingLevel: number,
): HatchetBoostSnapshot {
  const definition = hatchetsByKey[hatchetKey];
  if (!definition) throw new Error('That hatchet does not exist.');
  if (playerWoodcuttingLevel < MAPLE_CUT_CHANCE_SOURCE.requiredWoodcuttingLevel)
    throw new Error('Maple logs require level 40 Woodcutting.');
  if (playerWoodcuttingLevel < definition.requiredLevel)
    throw new Error(`${definition.name} requires level ${definition.requiredLevel} Woodcutting.`);
  const effectiveLevel = Math.min(playerWoodcuttingLevel, MAX_CUT_CHANCE_LEVEL);
  const anchors = mapleChanceAnchors[hatchetKey];
  if (!anchors) throw new Error('Maple cut-chance data is missing for that hatchet.');
  const cutChanceBasisPoints = interpolate(anchors, effectiveLevel);
  const bronzeChanceBasisPoints = interpolate(mapleChanceAnchors.bronze_hatchet!, effectiveLevel);
  return {
    hatchetKey,
    hatchetName: definition.name,
    playerLevel: playerWoodcuttingLevel,
    effectiveLevel,
    cutChanceBasisPoints,
    bronzeChanceBasisPoints,
    successMultiplier: cutChanceBasisPoints / bronzeChanceBasisPoints,
    formulaVersion: MAPLE_HATCHET_CHANCE_FORMULA_VERSION,
  };
}

export function yewLogsHatchetBoost(
  hatchetKey: string,
  playerWoodcuttingLevel: number,
): HatchetBoostSnapshot {
  const definition = hatchetsByKey[hatchetKey];
  if (!definition) throw new Error('That hatchet does not exist.');
  if (playerWoodcuttingLevel < YEW_CUT_CHANCE_SOURCE.requiredWoodcuttingLevel)
    throw new Error('Yew logs require level 70 Woodcutting.');
  if (playerWoodcuttingLevel < definition.requiredLevel)
    throw new Error(`${definition.name} requires level ${definition.requiredLevel} Woodcutting.`);
  const effectiveLevel = Math.min(playerWoodcuttingLevel, MAX_CUT_CHANCE_LEVEL);
  const anchors = yewChanceAnchors[hatchetKey];
  if (!anchors) throw new Error('Yew cut-chance data is missing for that hatchet.');
  const cutChanceBasisPoints = interpolate(anchors, effectiveLevel);
  const bronzeChanceBasisPoints = interpolate(yewChanceAnchors.bronze_hatchet!, effectiveLevel);
  return {
    hatchetKey,
    hatchetName: definition.name,
    playerLevel: playerWoodcuttingLevel,
    effectiveLevel,
    cutChanceBasisPoints,
    bronzeChanceBasisPoints,
    successMultiplier: cutChanceBasisPoints / bronzeChanceBasisPoints,
    formulaVersion: YEW_HATCHET_CHANCE_FORMULA_VERSION,
  };
}

export function magicLogsHatchetBoost(
  hatchetKey: string,
  playerWoodcuttingLevel: number,
): HatchetBoostSnapshot {
  const definition = hatchetsByKey[hatchetKey];
  if (!definition) throw new Error('That hatchet does not exist.');
  if (playerWoodcuttingLevel < MAGIC_CUT_CHANCE_SOURCE.requiredWoodcuttingLevel)
    throw new Error('Magic logs require level 80 Woodcutting.');
  if (playerWoodcuttingLevel < definition.requiredLevel)
    throw new Error(`${definition.name} requires level ${definition.requiredLevel} Woodcutting.`);
  const effectiveLevel = Math.min(playerWoodcuttingLevel, MAX_CUT_CHANCE_LEVEL);
  const anchors = magicChanceAnchors[hatchetKey];
  if (!anchors) throw new Error('Magic cut-chance data is missing for that hatchet.');
  const cutChanceBasisPoints = interpolate(anchors, effectiveLevel);
  const bronzeChanceBasisPoints = interpolate(magicChanceAnchors.bronze_hatchet!, effectiveLevel);
  return {
    hatchetKey,
    hatchetName: definition.name,
    playerLevel: playerWoodcuttingLevel,
    effectiveLevel,
    cutChanceBasisPoints,
    bronzeChanceBasisPoints,
    successMultiplier: cutChanceBasisPoints / bronzeChanceBasisPoints,
    formulaVersion: MAGIC_HATCHET_CHANCE_FORMULA_VERSION,
  };
}

function chanceFor(hatchetDefinition: HatchetDefinition, level: number): number {
  const anchors = chanceAnchors[hatchetDefinition.key];
  return anchors ? interpolate(anchors, level) : 10_000;
}

function interpolate(anchors: readonly (readonly [number, number])[], level: number): number {
  const exact = anchors.find(([anchorLevel]) => anchorLevel === level);
  if (exact) return exact[1];
  const upperIndex = anchors.findIndex(([anchorLevel]) => anchorLevel > level);
  if (upperIndex <= 0) return anchors[0]![1];
  if (upperIndex < 0) return anchors.at(-1)![1];
  const [lowerLevel, lowerChance] = anchors[upperIndex - 1]!;
  const [upperLevel, upperChance] = anchors[upperIndex]!;
  return Math.round(
    lowerChance + ((upperChance - lowerChance) * (level - lowerLevel)) / (upperLevel - lowerLevel),
  );
}

function hatchet(
  key: string,
  name: string,
  requiredLevel: number,
  filename: string,
): HatchetDefinition {
  return { key, name, requiredLevel, iconFile: `woodcutting/${filename}` };
}
