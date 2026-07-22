import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('activity completion idempotency', () => {
  it('retains database and worker guards against duplicate completion awards', async () => {
    const [initialMigration, tripMigration, service] = await Promise.all([
      readFile('db/migrations/001_initial.sql', 'utf8'),
      readFile('db/migrations/011_woodcutting_trip_results.sql', 'utf8'),
      readFile('src/application/game-service.ts', 'utf8'),
    ]);
    expect(initialMigration).toContain('idempotency_key TEXT NOT NULL UNIQUE');
    expect(tripMigration).toContain('activity_id UUID PRIMARY KEY');
    expect(service).toContain('FOR UPDATE OF a SKIP LOCKED');
    expect(service).toContain('`activity:${active.id}`');
    expect(service).toContain('DELETE FROM active_activities WHERE id = $1');
    expect(service).toContain('BigInt(active.actual_quantity ?? active.quantity)');
    expect(service).toContain('BigInt(active.xp_award)');
    expect(service).toContain('woodcuttingOutcome?.actualLogs.toString()');
    expect(service).toContain('woodcuttingOutcome?.xpAward.toString()');
    expect(service).toContain('active.requested_quantity');
    expect(service).toContain('active.target_reached');
  });
});
