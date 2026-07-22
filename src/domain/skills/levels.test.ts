import { describe, expect, it } from 'vitest';

import { formatXp, levelForXp, xpForLevel, xpForNextLevel } from './levels.js';

describe('skill levels', () => {
  it('uses the RuneScape experience thresholds', () => {
    expect(xpForLevel(1)).toBe(0n);
    expect(xpForLevel(2)).toBe(830n);
    expect(xpForLevel(70)).toBe(7_376_270n);
    expect(xpForLevel(99)).toBe(130_344_310n);
    expect(xpForLevel(110)).toBe(387_376_610n);
    expect(xpForLevel(111)).toBe(427_698_010n);
    expect(xpForLevel(115)).toBe(635_554_430n);
    expect(xpForLevel(120)).toBe(1_042_731_670n);
  });

  it('calculates levels at either side of an XP threshold', () => {
    expect(levelForXp(0n)).toBe(1);
    expect(levelForXp(829n)).toBe(1);
    expect(levelForXp(830n)).toBe(2);
    expect(levelForXp(130_344_309n)).toBe(98);
    expect(levelForXp(130_344_310n)).toBe(99);
    expect(levelForXp(1_042_731_669n)).toBe(119);
    expect(levelForXp(1_042_731_670n)).toBe(120);
    expect(levelForXp(2_000_000_000n)).toBe(120);
  });

  it('reports remaining XP until the next level', () => {
    expect(xpForNextLevel(250n)).toBe(580n);
    expect(xpForNextLevel(387_376_610n)).toBe(40_321_400n);
    expect(xpForNextLevel(1_042_731_670n)).toBeNull();
  });

  it('formats tenths of an XP point', () => {
    expect(formatXp(1_125n)).toBe('112.5');
    expect(formatXp(750n)).toBe('75');
  });
});
