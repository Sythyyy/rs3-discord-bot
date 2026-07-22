export const MAX_LEVEL = 120;

// XP is stored in tenths so activities can award fractional RuneScape XP.
const XP_STORAGE_SCALE = 10n;

function buildExperienceTable(): readonly bigint[] {
  const thresholds: bigint[] = [0n];
  let points = 0;

  for (let level = 1; level < MAX_LEVEL; level += 1) {
    points += Math.floor(level + 300 * 2 ** (level / 7));
    thresholds.push(BigInt(Math.floor(points / 4)) * XP_STORAGE_SCALE);
  }

  return thresholds;
}

export const EXPERIENCE_TABLE = buildExperienceTable();

export function xpForLevel(level: number): bigint {
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL)
    throw new Error(`Level must be between 1 and ${MAX_LEVEL}.`);
  return EXPERIENCE_TABLE[level - 1]!;
}

export function levelForXp(xp: bigint): number {
  if (xp < 0n) throw new Error('XP cannot be negative.');

  let low = 0;
  let high = EXPERIENCE_TABLE.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (EXPERIENCE_TABLE[middle]! <= xp) low = middle + 1;
    else high = middle;
  }

  return Math.min(MAX_LEVEL, low);
}

export function xpForNextLevel(xp: bigint): bigint | null {
  const level = levelForXp(xp);
  return level >= MAX_LEVEL ? null : xpForLevel(level + 1) - xp;
}

export function formatXp(xp: bigint): string {
  const whole = xp / XP_STORAGE_SCALE;
  const decimal = xp % XP_STORAGE_SCALE;
  return decimal === 0n ? whole.toString() : `${whole}.${decimal}`;
}
