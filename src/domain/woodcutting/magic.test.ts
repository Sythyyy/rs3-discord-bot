import { describe, expect, it } from 'vitest';

import { MAGIC_CUT_CHANCE_SOURCE, magicLogsHatchetBoost } from './hatchets.js';
import { deterministicRollSequence, simulateWoodcuttingTarget } from './trip.js';

const magicPoints: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
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

describe('Magic logs hatchet chances', () => {
  it('is stored as verified manual source data', () => {
    expect(MAGIC_CUT_CHANCE_SOURCE).toEqual({
      provenance: 'verified/manual',
      treeSlug: 'magic',
      displayName: 'Magic tree',
      logItemSlug: 'magic_logs',
      logItemName: 'Magic logs',
      requiredWoodcuttingLevel: 80,
      effectiveLevelCap: 110,
    });
  });

  it.each(
    Object.entries(magicPoints).flatMap(([hatchet, points]) =>
      points.map(([level, chance]) => [hatchet, level, chance] as const),
    ),
  )('%s at level %i uses exactly %i basis points', (hatchet, level, chance) => {
    expect(magicLogsHatchetBoost(hatchet, level).cutChanceBasisPoints).toBe(chance);
  });

  it('uses piecewise-linear interpolation between listed points', () => {
    expect(magicLogsHatchetBoost('bronze_hatchet', 85).cutChanceBasisPoints).toBe(332);
    expect(magicLogsHatchetBoost('rune_hatchet', 95).cutChanceBasisPoints).toBe(1305);
    expect(magicLogsHatchetBoost('elder_rune_hatchet', 105).cutChanceBasisPoints).toBe(2394);
  });

  it('enforces the tree and universal hatchet requirements', () => {
    expect(() => magicLogsHatchetBoost('bronze_hatchet', 79)).toThrow(
      'Magic logs require level 80 Woodcutting.',
    );
    expect(() => magicLogsHatchetBoost('elder_rune_hatchet', 80)).toThrow(
      'Elder rune hatchet requires level 90 Woodcutting.',
    );
  });

  it('caps every non-100% chance at level 110 through level 120', () => {
    for (const [hatchet, points] of Object.entries(magicPoints)) {
      const level110Chance = points.at(-1)![1];
      expect(level110Chance).toBeLessThan(10_000);
      for (const level of [110, 111, 120]) {
        expect(magicLogsHatchetBoost(hatchet, level)).toMatchObject({
          effectiveLevel: 110,
          cutChanceBasisPoints: level110Chance,
        });
      }
    }
  });

  it('takes longer at Bronze level 80 than Bronze level 110 for the same target and RNG', () => {
    const rolls = Array.from({ length: 500 }, (_, index) => (index % 100) / 100 + 0.005);
    const level70 = simulateWoodcuttingTarget(
      10n,
      magicLogsHatchetBoost('bronze_hatchet', 80).cutChanceBasisPoints,
      10_950n,
      100,
      100,
      deterministicRollSequence(rolls),
      0.9,
      0,
      0,
    );
    const level110 = simulateWoodcuttingTarget(
      10n,
      magicLogsHatchetBoost('bronze_hatchet', 110).cutChanceBasisPoints,
      10_950n,
      100,
      100,
      deterministicRollSequence(rolls),
      0.9,
      0,
      0,
    );
    expect(level70).toMatchObject({ actualLogs: 10n, targetReached: true });
    expect(level110).toMatchObject({ actualLogs: 10n, targetReached: true });
    expect(level70.durationMs).toBeGreaterThan(level110.durationMs);
  });

  it('snapshots the Magic result at trip start', () => {
    const boost = magicLogsHatchetBoost('bronze_hatchet', 80);
    const outcome = simulateWoodcuttingTarget(
      3n,
      boost.cutChanceBasisPoints,
      10_950n,
      100,
      100,
      deterministicRollSequence([0.01, 0.9, 0.02, 0.8, 0.03]),
      0.9,
      0,
      0,
    );
    const snapshot = { boost: { ...boost }, outcome: { ...outcome } };
    magicLogsHatchetBoost('hatchet_of_bloom_and_blight', 120);
    expect(snapshot.boost).toMatchObject({
      hatchetKey: 'bronze_hatchet',
      effectiveLevel: 80,
      cutChanceBasisPoints: 319,
    });
    expect(snapshot.outcome).toMatchObject({
      actualLogs: 3n,
      targetReached: true,
      durationMs: 500,
    });
    expect(snapshot.outcome.rngAudit.cutChanceBasisPoints).toBe(319);
  });
});
