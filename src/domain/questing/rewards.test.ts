import { describe, expect, it } from 'vitest';

import { calculateQuestPointReward, MAX_QUEST_POINTS } from './rewards.js';

describe('quest point rewards', () => {
  it.each([
    [0, 1],
    [0.34, 2],
    [0.99, 3],
  ])('rolls 1–3 QP from random value %s', (random, expected) => {
    expect(calculateQuestPointReward(100, random)).toEqual({
      rolled: expected,
      awarded: expected,
      total: 100 + expected,
    });
  });

  it('never exceeds the 473 QP cap', () => {
    expect(calculateQuestPointReward(472, 0.99)).toEqual({
      rolled: 3,
      awarded: 1,
      total: MAX_QUEST_POINTS,
    });
    expect(calculateQuestPointReward(MAX_QUEST_POINTS, 0)).toEqual({
      rolled: 1,
      awarded: 0,
      total: MAX_QUEST_POINTS,
    });
  });
});
