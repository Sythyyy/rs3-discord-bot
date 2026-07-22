export const WOODCUTTING_TRIP_FORMULA_VERSION = 'woodcutting-precalculated-v4';
export const WOODCUTTING_FATIGUE_CHANCE = 0.2;

export interface WoodcuttingRngAudit {
  plannedAttempts: number;
  executedAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  cutChanceBasisPoints: number;
  fatigueRollBasisPoints: number;
  fatigueStopAttempt: number | null;
}

export interface WoodcuttingOutcome {
  actualLogs: bigint;
  xpAward: bigint;
  fatigueEnded: boolean;
  targetReached: boolean;
  executedAttempts: bigint;
  minDurationMs: number;
  maxDurationMs: number;
  durationMs: number;
  formulaVersion: string;
  rngAudit: WoodcuttingRngAudit;
}

export function simulateWoodcuttingAttempts(
  plannedAttempts: bigint,
  cutChanceBasisPoints: number,
  xpPerLog: bigint,
  minAttemptDurationMs: number,
  maxAttemptDurationMs: number,
  attemptRoll: () => number,
  fatigueRoll: number,
  fatigueAmountRoll: number,
  durationRoll: number,
): WoodcuttingOutcome {
  if (plannedAttempts <= 0n || plannedAttempts > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error('Woodcutting attempts must be a positive safe integer.');
  if (
    !Number.isInteger(cutChanceBasisPoints) ||
    cutChanceBasisPoints < 0 ||
    cutChanceBasisPoints > 10_000
  )
    throw new Error('Cut chance must be between 0 and 10,000 basis points.');
  for (const roll of [fatigueRoll, fatigueAmountRoll, durationRoll]) validateRoll(roll);

  const planned = Number(plannedAttempts);
  const fatigueEnded = fatigueRoll < WOODCUTTING_FATIGUE_CHANCE && planned > 1;
  const executed = fatigueEnded
    ? Math.max(1, Math.floor(planned * (0.5 + fatigueAmountRoll * 0.4)))
    : planned;
  let successes = 0;
  for (let attempt = 0; attempt < executed; attempt += 1) {
    const roll = attemptRoll();
    validateRoll(roll);
    if (roll * 10_000 < cutChanceBasisPoints) successes += 1;
  }
  const durationPerAttempt = Math.round(
    minAttemptDurationMs + durationRoll * (maxAttemptDurationMs - minAttemptDurationMs),
  );
  return {
    actualLogs: BigInt(successes),
    xpAward: xpPerLog * BigInt(successes),
    fatigueEnded,
    targetReached: !fatigueEnded,
    executedAttempts: BigInt(executed),
    minDurationMs: Math.max(1, minAttemptDurationMs * executed),
    maxDurationMs: Math.max(1, maxAttemptDurationMs * executed),
    durationMs: Math.max(1, durationPerAttempt * executed),
    formulaVersion: WOODCUTTING_TRIP_FORMULA_VERSION,
    rngAudit: {
      plannedAttempts: planned,
      executedAttempts: executed,
      successfulAttempts: successes,
      failedAttempts: executed - successes,
      cutChanceBasisPoints,
      fatigueRollBasisPoints: Math.floor(fatigueRoll * 10_000),
      fatigueStopAttempt: fatigueEnded ? executed : null,
    },
  };
}

/** Pre-calculates a requested-success trip. Failures add attempts and time; fatigue caps successes. */
export function simulateWoodcuttingTarget(
  requestedLogs: bigint,
  cutChanceBasisPoints: number,
  xpPerLog: bigint,
  minAttemptDurationMs: number,
  maxAttemptDurationMs: number,
  attemptRoll: () => number,
  fatigueRoll: number,
  fatigueAmountRoll: number,
  durationRoll: number,
): WoodcuttingOutcome {
  if (requestedLogs <= 0n || requestedLogs > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error('Requested Logs must be a positive safe integer.');
  validateChance(cutChanceBasisPoints);
  for (const roll of [fatigueRoll, fatigueAmountRoll, durationRoll]) validateRoll(roll);
  if (cutChanceBasisPoints === 0) throw new Error('A positive cut chance is required.');

  const requested = Number(requestedLogs);
  const fatigueEnded = fatigueRoll < WOODCUTTING_FATIGUE_CHANCE && requested > 1;
  const successfulLogLimit = fatigueEnded
    ? Math.max(1, Math.min(requested - 1, Math.floor(requested * (0.5 + fatigueAmountRoll * 0.4))))
    : requested;
  let attempts = 0;
  let successes = 0;
  while (successes < successfulLogLimit) {
    const roll = attemptRoll();
    validateRoll(roll);
    attempts += 1;
    if (roll * 10_000 < cutChanceBasisPoints) successes += 1;
  }
  const durationPerAttempt = Math.round(
    minAttemptDurationMs + durationRoll * (maxAttemptDurationMs - minAttemptDurationMs),
  );
  return {
    actualLogs: BigInt(successes),
    xpAward: xpPerLog * BigInt(successes),
    fatigueEnded,
    targetReached: successes === requested,
    executedAttempts: BigInt(attempts),
    minDurationMs: Math.max(1, minAttemptDurationMs * attempts),
    maxDurationMs: Math.max(1, maxAttemptDurationMs * attempts),
    durationMs: Math.max(1, durationPerAttempt * attempts),
    formulaVersion: WOODCUTTING_TRIP_FORMULA_VERSION,
    rngAudit: {
      plannedAttempts: attempts,
      executedAttempts: attempts,
      successfulAttempts: successes,
      failedAttempts: attempts - successes,
      cutChanceBasisPoints,
      fatigueRollBasisPoints: Math.floor(fatigueRoll * 10_000),
      fatigueStopAttempt: fatigueEnded ? attempts : null,
    },
  };
}

export function deterministicRollSequence(values: readonly number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index];
    if (value === undefined) throw new Error('Deterministic RNG sequence was exhausted.');
    index += 1;
    return value;
  };
}

function validateRoll(roll: number): void {
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1)
    throw new Error('Random rolls must be between 0 and 1.');
}

function validateChance(cutChanceBasisPoints: number): void {
  if (
    !Number.isInteger(cutChanceBasisPoints) ||
    cutChanceBasisPoints < 0 ||
    cutChanceBasisPoints > 10_000
  )
    throw new Error('Cut chance must be between 0 and 10,000 basis points.');
}
