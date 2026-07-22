import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';

import { GameService } from './game-service.js';

describe('GameService.getBank', () => {
  it('queries live positive inventory in stable order and maps quantities and values', async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes('JOIN users')) {
        return {
          rows: [{ id: 'character-1', name: 'Artemis', coins: '100', quest_points: 0 }],
        };
      }
      if (sql.includes('FROM inventory_items')) {
        expect(sql).toContain('quantity > 0');
        expect(sql).toContain('ORDER BY item_key');
        return { rows: [{ item_key: 'copper_ore', quantity: '387' }] };
      }
      throw new Error(`Unexpected query: ${sql}`);
    });
    const game = new GameService({ query } as unknown as Pool);

    await expect(game.getBank('discord-owner')).resolves.toEqual({
      playerName: 'Artemis',
      items: [
        {
          itemKey: 'copper_ore',
          name: 'Copper ore',
          iconFile: 'copper_ore.png',
          quantity: 387n,
          unitValue: 8n,
        },
      ],
    });
  });
});
