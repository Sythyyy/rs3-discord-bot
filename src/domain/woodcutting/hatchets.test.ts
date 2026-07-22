import { describe, expect, it } from 'vitest';

import {
  hatchets,
  mapleLogsHatchetBoost,
  MAPLE_CUT_CHANCE_SOURCE,
  oakLogsHatchetBoost,
  OAK_CUT_CHANCE_SOURCE,
  regularLogsHatchetBoost,
  willowLogsHatchetBoost,
  WILLOW_CUT_CHANCE_SOURCE,
} from './hatchets.js';

describe('regular Logs hatchet chances', () => {
  it.each([
    ['bronze_hatchet', 1, 2510],
    ['bronze_hatchet', 99, 7843],
    ['bronze_hatchet', 110, 8442],
    ['iron_hatchet', 10, 4499],
    ['iron_hatchet', 78, 10000],
    ['steel_hatchet', 47, 10000],
    ['black_hatchet', 37, 10000],
  ])('%s at level %i has %i basis points', (key, level, expected) => {
    expect(regularLogsHatchetBoost(key, level).cutChanceBasisPoints).toBe(expected);
  });

  it('linearly interpolates between supplied levels', () => {
    expect(regularLogsHatchetBoost('bronze_hatchet', 5).cutChanceBasisPoints).toBe(2728);
    expect(regularLogsHatchetBoost('iron_hatchet', 75).cutChanceBasisPoints).toBe(9774);
  });

  it('caps chance calculations at level 110', () => {
    expect(regularLogsHatchetBoost('bronze_hatchet', 110).cutChanceBasisPoints).toBe(8442);
    expect(regularLogsHatchetBoost('bronze_hatchet', 111).cutChanceBasisPoints).toBe(8442);
    expect(regularLogsHatchetBoost('bronze_hatchet', 120)).toMatchObject({
      effectiveLevel: 110,
      cutChanceBasisPoints: 8442,
    });
  });

  it('gives every tier from Mithril onward guaranteed regular Logs chance', () => {
    for (const hatchet of hatchets.filter((definition) => definition.requiredLevel >= 30)) {
      expect(regularLogsHatchetBoost(hatchet.key, hatchet.requiredLevel).cutChanceBasisPoints).toBe(
        10000,
      );
    }
  });
});

const willowPoints: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
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
  ],
  crystal_hatchet: [
    [70, 7909],
    [80, 8597],
    [90, 9284],
    [99, 9902],
    [101, 10000],
  ],
  bane_hatchet: [
    [80, 9277],
    [90, 10000],
  ],
  imcando_hatchet: [
    [80, 9958],
    [81, 10000],
  ],
  elder_rune_hatchet: [[90, 10000]],
  hatchet_of_ember_and_glade: [[90, 10000]],
  primal_hatchet: [[100, 10000]],
  hatchet_of_bloom_and_blight: [[100, 10000]],
};

describe('Willow logs hatchet chances', () => {
  it('is stored as verified manual RS3 data', () => {
    expect(WILLOW_CUT_CHANCE_SOURCE).toMatchObject({
      provenance: 'verified/manual',
      treeSlug: 'willow',
      logItemSlug: 'willow_logs',
      requiredWoodcuttingLevel: 20,
      effectiveLevelCap: 110,
    });
  });

  it.each(
    Object.entries(willowPoints).flatMap(([hatchet, points]) =>
      points.map(([level, chance]) => [hatchet, level, chance] as const),
    ),
  )('%s at level %i uses exactly %i basis points', (hatchet, level, chance) => {
    expect(willowLogsHatchetBoost(hatchet, level).cutChanceBasisPoints).toBe(chance);
  });

  it('interpolates piecewise between manual points', () => {
    expect(willowLogsHatchetBoost('bronze_hatchet', 25).cutChanceBasisPoints).toBe(954);
    expect(willowLogsHatchetBoost('rune_hatchet', 55).cutChanceBasisPoints).toBe(4972);
    expect(willowLogsHatchetBoost('crystal_hatchet', 100).cutChanceBasisPoints).toBe(9951);
  });

  it('requires level 20 and caps effective chance through level 120', () => {
    expect(() => willowLogsHatchetBoost('bronze_hatchet', 19)).toThrow(
      'Willow logs require level 20 Woodcutting.',
    );
    for (const level of [110, 111, 120]) {
      expect(willowLogsHatchetBoost('bronze_hatchet', level)).toMatchObject({
        effectiveLevel: 110,
        cutChanceBasisPoints: 2110,
      });
    }
  });

  it.each([
    ['necronium_hatchet', 105],
    ['crystal_hatchet', 101],
    ['bane_hatchet', 90],
    ['imcando_hatchet', 81],
    ['elder_rune_hatchet', 90],
    ['hatchet_of_ember_and_glade', 90],
    ['primal_hatchet', 100],
    ['hatchet_of_bloom_and_blight', 100],
  ])('%s is exactly 100%% from level %i', (hatchet, threshold) => {
    expect(willowLogsHatchetBoost(hatchet, threshold).cutChanceBasisPoints).toBe(10_000);
    expect(willowLogsHatchetBoost(hatchet, 110).cutChanceBasisPoints).toBe(10_000);
  });
});

const maplePoints: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
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
  ],
  hatchet_of_ember_and_glade: [
    [99, 9842],
    [102, 10000],
  ],
  primal_hatchet: [[100, 10000]],
  hatchet_of_bloom_and_blight: [[100, 10000]],
};

describe('Maple logs hatchet chances', () => {
  it('is stored as verified manual RS3 data', () => {
    expect(MAPLE_CUT_CHANCE_SOURCE).toMatchObject({
      provenance: 'verified/manual',
      treeSlug: 'maple',
      displayName: 'Maple tree',
      logItemSlug: 'maple_logs',
      logItemName: 'Maple logs',
      requiredWoodcuttingLevel: 40,
      effectiveLevelCap: 110,
    });
  });

  it.each(
    Object.entries(maplePoints).flatMap(([hatchet, points]) =>
      points.map(([level, chance]) => [hatchet, level, chance] as const),
    ),
  )('%s at level %i uses exactly %i basis points', (hatchet, level, chance) => {
    expect(mapleLogsHatchetBoost(hatchet, level).cutChanceBasisPoints).toBe(chance);
  });

  it('interpolates piecewise between manual points', () => {
    expect(mapleLogsHatchetBoost('bronze_hatchet', 45).cutChanceBasisPoints).toBe(958);
    expect(mapleLogsHatchetBoost('rune_hatchet', 55).cutChanceBasisPoints).toBe(3884);
    expect(mapleLogsHatchetBoost('elder_rune_hatchet', 103).cutChanceBasisPoints).toBe(9817);
  });

  it('requires level 40 and caps effective chance through level 120', () => {
    expect(() => mapleLogsHatchetBoost('bronze_hatchet', 39)).toThrow(
      'Maple logs require level 40 Woodcutting.',
    );
    for (const level of [110, 111, 120]) {
      expect(mapleLogsHatchetBoost('bronze_hatchet', level)).toMatchObject({
        effectiveLevel: 110,
        cutChanceBasisPoints: 1649,
      });
    }
  });

  it.each([
    ['elder_rune_hatchet', 106],
    ['hatchet_of_ember_and_glade', 102],
    ['primal_hatchet', 100],
    ['hatchet_of_bloom_and_blight', 100],
  ])('%s is exactly 100%% from level %i', (hatchet, threshold) => {
    expect(mapleLogsHatchetBoost(hatchet, threshold).cutChanceBasisPoints).toBe(10_000);
    expect(mapleLogsHatchetBoost(hatchet, 110).cutChanceBasisPoints).toBe(10_000);
  });
});

describe('Oak logs hatchet chances', () => {
  it('is stored as verified manual data', () => {
    expect(OAK_CUT_CHANCE_SOURCE).toEqual({
      provenance: 'verified/manual',
      treeSlug: 'oak',
      requiredWoodcuttingLevel: 15,
      effectiveLevelCap: 110,
    });
  });

  it.each([
    ['bronze_hatchet', 15, 1636],
    ['bronze_hatchet', 110, 4221],
    ['iron_hatchet', 15, 2454],
    ['iron_hatchet', 110, 6331],
    ['steel_hatchet', 20, 3544],
    ['steel_hatchet', 110, 8442],
    ['black_hatchet', 25, 4293],
    ['black_hatchet', 110, 9497],
    ['mithril_hatchet', 97, 10000],
    ['adamant_hatchet', 73, 10000],
    ['rune_hatchet', 57, 10000],
    ['orikalkum_hatchet', 60, 10000],
    ['hatchet_of_bloom_and_blight', 100, 10000],
  ])('%s at level %i has %i basis points', (key, level, expected) => {
    expect(oakLogsHatchetBoost(key, level).cutChanceBasisPoints).toBe(expected);
  });

  it('interpolates piecewise and caps levels at 110', () => {
    expect(oakLogsHatchetBoost('bronze_hatchet', 25).cutChanceBasisPoints).toBe(1908);
    expect(oakLogsHatchetBoost('bronze_hatchet', 120)).toMatchObject({
      effectiveLevel: 110,
      cutChanceBasisPoints: 4221,
    });
  });

  it('enforces both the Oak and hatchet level requirements', () => {
    expect(() => oakLogsHatchetBoost('bronze_hatchet', 14)).toThrow(
      'Oak logs require level 15 Woodcutting.',
    );
    expect(() => oakLogsHatchetBoost('steel_hatchet', 19)).toThrow(
      'Steel hatchet requires level 20 Woodcutting.',
    );
  });
});
