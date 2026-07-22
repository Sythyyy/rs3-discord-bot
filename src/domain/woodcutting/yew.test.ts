import { describe, expect, it } from 'vitest';

import { YEW_CUT_CHANCE_SOURCE, yewLogsHatchetBoost } from './hatchets.js';
import { deterministicRollSequence, simulateWoodcuttingTarget } from './trip.js';

const yewPoints: Readonly<Record<string, readonly (readonly [number, number])[]>> = {
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

describe('Yew logs hatchet chances', () => {
  it('is stored as verified manual source data', () => {
    expect(YEW_CUT_CHANCE_SOURCE).toEqual({
      provenance: 'verified/manual',
      treeSlug: 'yew',
      displayName: 'Yew tree',
      logItemSlug: 'yew_logs',
      logItemName: 'Yew logs',
      requiredWoodcuttingLevel: 70,
      effectiveLevelCap: 110,
    });
  });

  it.each(
    Object.entries(yewPoints).flatMap(([hatchet, points]) =>
      points.map(([level, chance]) => [hatchet, level, chance] as const),
    ),
  )('%s at level %i uses exactly %i basis points', (hatchet, level, chance) => {
    expect(yewLogsHatchetBoost(hatchet, level).cutChanceBasisPoints).toBe(chance);
  });

  it('uses piecewise-linear interpolation between listed points', () => {
    expect(yewLogsHatchetBoost('bronze_hatchet', 75).cutChanceBasisPoints).toBe(613);
    expect(yewLogsHatchetBoost('rune_hatchet', 95).cutChanceBasisPoints).toBe(2609);
    expect(yewLogsHatchetBoost('elder_rune_hatchet', 105).cutChanceBasisPoints).toBe(4787);
  });

  it('enforces the tree and universal hatchet requirements', () => {
    expect(() => yewLogsHatchetBoost('bronze_hatchet', 69)).toThrow(
      'Yew logs require level 70 Woodcutting.',
    );
    expect(() => yewLogsHatchetBoost('bane_hatchet', 70)).toThrow(
      'Bane hatchet requires level 80 Woodcutting.',
    );
  });

  it('caps every non-100% chance at level 110 through level 120', () => {
    for (const [hatchet, points] of Object.entries(yewPoints)) {
      const level110Chance = points.at(-1)![1];
      expect(level110Chance).toBeLessThan(10_000);
      for (const level of [110, 111, 120]) {
        expect(yewLogsHatchetBoost(hatchet, level)).toMatchObject({
          effectiveLevel: 110,
          cutChanceBasisPoints: level110Chance,
        });
      }
    }
  });

  it('takes longer at Bronze level 70 than Bronze level 110 for the same target and RNG', () => {
    const rolls = Array.from({ length: 300 }, (_, index) => (index % 20) / 20 + 0.025);
    const level70 = simulateWoodcuttingTarget(
      10n,
      yewLogsHatchetBoost('bronze_hatchet', 70).cutChanceBasisPoints,
      5_625n,
      100,
      100,
      deterministicRollSequence(rolls),
      0.9,
      0,
      0,
    );
    const level110 = simulateWoodcuttingTarget(
      10n,
      yewLogsHatchetBoost('bronze_hatchet', 110).cutChanceBasisPoints,
      5_625n,
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

  it('snapshots the Yew result at trip start', () => {
    const boost = yewLogsHatchetBoost('bronze_hatchet', 70);
    const outcome = simulateWoodcuttingTarget(
      3n,
      boost.cutChanceBasisPoints,
      5_625n,
      100,
      100,
      deterministicRollSequence([0.01, 0.9, 0.02, 0.8, 0.03]),
      0.9,
      0,
      0,
    );
    const snapshot = { boost: { ...boost }, outcome: { ...outcome } };
    yewLogsHatchetBoost('hatchet_of_bloom_and_blight', 120);
    expect(snapshot.boost).toMatchObject({
      hatchetKey: 'bronze_hatchet',
      effectiveLevel: 70,
      cutChanceBasisPoints: 587,
    });
    expect(snapshot.outcome).toMatchObject({
      actualLogs: 3n,
      targetReached: true,
      durationMs: 500,
    });
    expect(snapshot.outcome.rngAudit.cutChanceBasisPoints).toBe(587);
  });
});
