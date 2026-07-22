import { describe, expect, it } from 'vitest';

import { bestVerifiedTree, trees } from './catalogue.js';

describe('Woodcutting catalogue', () => {
  it('has unique keys and complete provenance', () => {
    expect(new Set(trees.map((tree) => tree.key)).size).toBe(trees.length);
    for (const tree of trees) {
      expect(tree.source.treeUrl).toMatch(/^https:\/\/runescape\.wiki\/w\//);
      expect(tree.source.trainingUrl).toBe(
        'https://runescape.wiki/w/Pay-to-play_Woodcutting_training',
      );
      expect(tree.source.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(tree.balance.baseXpPerHour).toBeGreaterThan(0);
      expect(tree.balance.maxPotentialLogsPerTrip).toBeGreaterThan(0);
    }
  });

  it('keeps yield-slot limits as private per-tree balance settings', () => {
    expect(trees.find((tree) => tree.key === 'regular')?.balance.maxPotentialLogsPerTrip).toBe(
      2_100,
    );
    expect(trees.find((tree) => tree.key === 'oak')?.balance.maxPotentialLogsPerTrip).toBe(2_800);
  });

  it('never automatically selects a rate needing verification', () => {
    expect(bestVerifiedTree(110)?.key).toBe('mahogany');
    expect(bestVerifiedTree(1)?.key).toBe('regular');
  });
});
