import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { activities, items } from './game-content.js';

describe('questing', () => {
  it('is a fixed 30-minute activity with no skill XP or item rewards', () => {
    expect(activities.questing).toMatchObject({
      durationMs: 30 * 60_000,
      xp: 0n,
      rewards: [],
      isQuest: true,
    });
  });
});

describe('item images', () => {
  it.each(Object.values(items))('$key points to an existing image', (item) => {
    expect(existsSync(resolve('assets/items', item.iconFile))).toBe(true);
  });
});

describe('woodcutting activities', () => {
  it('awards one real log', () => {
    const activity = activities.woodcutting_oak;
    expect(activity).toMatchObject({
      skill: 'woodcutting',
      requiredLevel: 15,
      xp: 375n,
      baseQuantity: 1n,
      rewards: [{ itemKey: 'oak_logs', quantity: 1n }],
    });
  });
});
