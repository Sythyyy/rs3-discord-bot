import { describe, expect, it } from 'vitest';

import { levelForXp, xpForLevel, xpForNextLevel } from './levels.js';

describe('skill levels', () => {
  it('calculates the standard RS3 level curve through 120', () => {
    expect(levelForXp(0n)).toBe(1);
    expect(xpForLevel(2)).toBe(83n);
    expect(xpForLevel(99)).toBe(13_034_431n);
    expect(xpForLevel(120)).toBe(104_273_167n);
    expect(levelForXp(82n)).toBe(1);
    expect(levelForXp(83n)).toBe(2);
    expect(levelForXp(104_273_167n)).toBe(120);
  });

  it('reports remaining XP until the next level', () => {
    expect(xpForNextLevel(25n)).toBe(58n);
    expect(xpForNextLevel(104_273_167n)).toBeNull();
  });
});
