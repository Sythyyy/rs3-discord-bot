export const MAX_ACTIVITY_DURATION_MS = 30 * 60 * 1_000;

export interface TripPlan {
  quantity: bigint;
  minDurationMs: number;
  maxDurationMs: number;
  durationMs: number;
}

export function planTrip(
  baseQuantity: bigint,
  baseMinDurationMs: number,
  baseMaxDurationMs: number,
  baseDurationMs: number,
  requestedQuantity?: bigint,
): TripPlan {
  if (baseQuantity <= 0n) throw new Error('Activity rewards must have a positive quantity.');
  if (requestedQuantity !== undefined && requestedQuantity <= 0n)
    throw new Error('Quantity must be positive.');

  const quantity =
    requestedQuantity ??
    (BigInt(MAX_ACTIVITY_DURATION_MS) * baseQuantity) / BigInt(baseMaxDurationMs);
  const safeQuantity = quantity > 0n ? quantity : 1n;
  const minDurationMs = scaleDuration(baseMinDurationMs, safeQuantity, baseQuantity);
  const maxDurationMs = scaleDuration(baseMaxDurationMs, safeQuantity, baseQuantity);
  const durationMs = scaleDuration(baseDurationMs, safeQuantity, baseQuantity);

  if (maxDurationMs > MAX_ACTIVITY_DURATION_MS)
    throw new Error('That quantity could take longer than 30 minutes. Choose a smaller quantity.');

  return { quantity: safeQuantity, minDurationMs, maxDurationMs, durationMs };
}

export function scaleReward(value: bigint, quantity: bigint, baseQuantity: bigint): bigint {
  return (value * quantity) / baseQuantity;
}

function scaleDuration(durationMs: number, quantity: bigint, baseQuantity: bigint): number {
  return Math.max(1, Number((BigInt(durationMs) * quantity + baseQuantity - 1n) / baseQuantity));
}
