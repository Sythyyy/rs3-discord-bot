const XP_PER_LEVEL = 100n;
const MAX_LEVEL = 99;

export function levelForXp(xp: bigint): number {
  if (xp < 0n) throw new Error('XP cannot be negative.');
  return Math.min(MAX_LEVEL, Number(xp / XP_PER_LEVEL) + 1);
}
export function xpForNextLevel(xp: bigint): bigint | null {
  const level = levelForXp(xp);
  return level >= MAX_LEVEL ? null : BigInt(level) * XP_PER_LEVEL - xp;
}
