import { describe, expect, it } from 'vitest';

import {
  mapleLogsHatchetBoost,
  regularLogsHatchetBoost,
  willowLogsHatchetBoost,
} from './hatchets.js';
import {
  deterministicRollSequence,
  simulateWoodcuttingAttempts,
  simulateWoodcuttingTarget,
  WOODCUTTING_TRIP_FORMULA_VERSION,
} from './trip.js';

const sharedAttemptRolls = [0.05, 0.15, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

describe('simulateWoodcuttingAttempts', () => {
  it('deterministically produces more Logs at level 110 than level 1 from identical attempts', () => {
    const level1Chance = regularLogsHatchetBoost('bronze_hatchet', 1).cutChanceBasisPoints;
    const level110Chance = regularLogsHatchetBoost('bronze_hatchet', 110).cutChanceBasisPoints;
    const low = simulateWoodcuttingAttempts(
      10n,
      level1Chance,
      250n,
      100,
      100,
      deterministicRollSequence(sharedAttemptRolls),
      0.5,
      0,
      0,
    );
    const high = simulateWoodcuttingAttempts(
      10n,
      level110Chance,
      250n,
      100,
      100,
      deterministicRollSequence(sharedAttemptRolls),
      0.5,
      0,
      0,
    );
    expect(low.actualLogs).toBe(3n);
    expect(high.actualLogs).toBe(9n);
    expect(high.actualLogs).toBeGreaterThan(low.actualLogs);
  });

  it('uses the snapshotted chance value and cannot be changed after planning', () => {
    const snapshottedChance = regularLogsHatchetBoost('bronze_hatchet', 1).cutChanceBasisPoints;
    const outcome = simulateWoodcuttingAttempts(
      10n,
      snapshottedChance,
      250n,
      100,
      100,
      deterministicRollSequence(sharedAttemptRolls),
      0.5,
      0,
      0,
    );
    regularLogsHatchetBoost('bronze_hatchet', 110);
    expect(outcome.rngAudit.cutChanceBasisPoints).toBe(2510);
    expect(outcome.actualLogs).toBe(3n);
  });

  it('does not allow fixed reward quantities to bypass failed chance rolls', () => {
    const outcome = simulateWoodcuttingAttempts(
      5n,
      2510,
      250n,
      100,
      100,
      deterministicRollSequence([0.1, 0.3, 0.4, 0.2, 0.9]),
      0.5,
      0,
      0,
    );
    expect(outcome.actualLogs).toBe(2n);
    expect(outcome.xpAward).toBe(500n);
    expect(outcome.rngAudit.failedAttempts).toBe(3);
  });

  it('treats fatigue separately from ordinary failed attempts', () => {
    const outcome = simulateWoodcuttingAttempts(
      10n,
      0,
      250n,
      100,
      100,
      deterministicRollSequence(Array(7).fill(0.9)),
      0.1,
      0.5,
      0,
    );
    expect(outcome).toMatchObject({
      actualLogs: 0n,
      xpAward: 0n,
      fatigueEnded: true,
      executedAttempts: 7n,
      formulaVersion: WOODCUTTING_TRIP_FORMULA_VERSION,
    });
    expect(outcome.rngAudit.failedAttempts).toBe(7);
    expect(outcome.rngAudit.fatigueStopAttempt).toBe(7);
  });

  it('calculates XP and the complete immutable reward at planning time', () => {
    const outcome = simulateWoodcuttingAttempts(
      4n,
      5_000,
      250n,
      100,
      200,
      deterministicRollSequence([0.1, 0.6, 0.2, 0.8]),
      0.9,
      0,
      0.5,
    );
    expect(outcome).toMatchObject({
      actualLogs: 2n,
      xpAward: 500n,
      minDurationMs: 400,
      maxDurationMs: 800,
    });
  });

  it('takes longer to reach 100 Logs at Bronze level 1 than level 110', () => {
    const rolls = Array.from({ length: 400 }, (_, index) => [0.1, 0.3, 0.5, 0.7][index % 4]!);
    const low = simulateWoodcuttingTarget(
      100n,
      2510,
      250n,
      100,
      100,
      deterministicRollSequence(rolls),
      0.9,
      0,
      0,
    );
    const high = simulateWoodcuttingTarget(
      100n,
      8442,
      250n,
      100,
      100,
      deterministicRollSequence(rolls),
      0.9,
      0,
      0,
    );
    expect(low).toMatchObject({ actualLogs: 100n, targetReached: true });
    expect(high).toMatchObject({ actualLogs: 100n, targetReached: true, durationMs: 10_000 });
    expect(low.durationMs).toBeGreaterThan(high.durationMs);
  });

  it('pre-calculates fatigue as a separate early target stop', () => {
    const outcome = simulateWoodcuttingTarget(
      100n,
      10_000,
      250n,
      100,
      100,
      deterministicRollSequence(Array(67).fill(0)),
      0.1,
      0.425,
      0,
    );
    expect(outcome).toMatchObject({
      actualLogs: 67n,
      xpAward: 16_750n,
      fatigueEnded: true,
      targetReached: false,
      durationMs: 6_700,
    });
  });

  it('keeps a target result and duration unchanged after later level calculations', () => {
    const saved = simulateWoodcuttingTarget(
      3n,
      regularLogsHatchetBoost('bronze_hatchet', 1).cutChanceBasisPoints,
      250n,
      100,
      100,
      deterministicRollSequence([0.1, 0.9, 0.2, 0.8, 0.05]),
      0.9,
      0,
      0,
    );
    const savedResult = { logs: saved.actualLogs, xp: saved.xpAward, duration: saved.durationMs };
    regularLogsHatchetBoost('bronze_hatchet', 120);
    expect({ logs: saved.actualLogs, xp: saved.xpAward, duration: saved.durationMs }).toEqual(
      savedResult,
    );
  });

  it('snapshots a faster level-110 Willow target result than level 20', () => {
    const rolls = Array.from({ length: 100 }, (_, index) => (index % 10) / 10 + 0.05);
    const level20 = simulateWoodcuttingTarget(
      10n,
      willowLogsHatchetBoost('bronze_hatchet', 20).cutChanceBasisPoints,
      675n,
      100,
      100,
      deterministicRollSequence(rolls),
      0.9,
      0,
      0,
    );
    const level110 = simulateWoodcuttingTarget(
      10n,
      willowLogsHatchetBoost('bronze_hatchet', 110).cutChanceBasisPoints,
      675n,
      100,
      100,
      deterministicRollSequence(rolls),
      0.9,
      0,
      0,
    );
    expect(level20).toMatchObject({ actualLogs: 10n, targetReached: true, durationMs: 9_100 });
    expect(level110).toMatchObject({ actualLogs: 10n, targetReached: true, durationMs: 4_200 });
    expect(level110.durationMs).toBeLessThan(level20.durationMs);
    const saved = { ...level20 };
    willowLogsHatchetBoost('dragon_hatchet', 110);
    expect(level20).toEqual(saved);
  });

  it('snapshots a faster level-110 Maple target result than level 40', () => {
    const rolls = Array.from({ length: 120 }, (_, index) => (index % 10) / 10 + 0.05);
    const level40 = simulateWoodcuttingTarget(
      10n,
      mapleLogsHatchetBoost('bronze_hatchet', 40).cutChanceBasisPoints,
      1_000n,
      100,
      100,
      deterministicRollSequence(rolls),
      0.9,
      0,
      0,
    );
    const level110 = simulateWoodcuttingTarget(
      10n,
      mapleLogsHatchetBoost('bronze_hatchet', 110).cutChanceBasisPoints,
      1_000n,
      100,
      100,
      deterministicRollSequence(rolls),
      0.9,
      0,
      0,
    );
    expect(level40).toMatchObject({ actualLogs: 10n, targetReached: true });
    expect(level110).toMatchObject({ actualLogs: 10n, targetReached: true });
    expect(level110.durationMs).toBeLessThan(level40.durationMs);
    const saved = { ...level40 };
    mapleLogsHatchetBoost('primal_hatchet', 110);
    expect(level40).toEqual(saved);
  });
});
