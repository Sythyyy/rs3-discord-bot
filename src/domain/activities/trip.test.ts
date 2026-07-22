import { describe, expect, it } from 'vitest';

import { MAX_ACTIVITY_DURATION_MS, planTrip, scaleReward } from './trip.js';

describe('activity trip planning', () => {
  it('defaults to the largest quantity that fits the 30-minute maximum', () => {
    const trip = planTrip(3n, 30_000, 60_000, 45_000);
    expect(trip.quantity).toBe(90n);
    expect(trip.maxDurationMs).toBe(MAX_ACTIVITY_DURATION_MS);
    expect(trip.durationMs).toBe(1_350_000);
  });

  it('scales timing and rewards to an explicit item quantity', () => {
    const trip = planTrip(3n, 30_000, 60_000, 45_000, 30n);
    expect(trip).toEqual({
      quantity: 30n,
      minDurationMs: 300_000,
      maxDurationMs: 600_000,
      durationMs: 450_000,
    });
    expect(scaleReward(750n, trip.quantity, 3n)).toBe(7_500n);
  });

  it('rejects a quantity whose estimated maximum exceeds 30 minutes', () => {
    expect(() => planTrip(3n, 300_000, 600_000, 450_000, 10n)).toThrow(
      'That quantity could take longer than 30 minutes',
    );
  });
});
