import { describe, expect, it } from 'vitest';

import { levelForXp, xpForNextLevel } from './levels.js';

describe('skill levels', () => {
  it('calculates the level from XP using the Phase 1 curve', () => {
    expect(levelForXp(0n)).toBe(1);
    expect(levelForXp(99n)).toBe(1);
    expect(levelForXp(100n)).toBe(2);
    expect(levelForXp(100_000n)).toBe(99);
  });

  it('reports remaining XP until the next level', () => {
    expect(xpForNextLevel(25n)).toBe(75n);
    expect(xpForNextLevel(9_900n)).toBeNull();
  });
});
