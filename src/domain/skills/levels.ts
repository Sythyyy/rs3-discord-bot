/**
 * RuneScape's standard skill XP formula, applied through level 120.
 * It yields canonical milestones such as level 99 at 13,034,431 XP and
 * level 120 at 104,273,167 XP. Virtual levels are intentionally not shown.
 */
export const MAX_SKILL_LEVEL = 120;

export const xpForLevel = (level: number): bigint => {
  if (!Number.isInteger(level) || level < 1 || level > MAX_SKILL_LEVEL) throw new Error('Level must be between 1 and 120.');
  if (level === 1) return 0n;
  let points = 0;
  let xp = 0;
  for (let current = 1; current < level; current += 1) {
    points += Math.floor(current + 300 * 2 ** (current / 7));
    xp = Math.floor(points / 4);
  }
  return BigInt(xp);
};

export function levelForXp(xp: bigint): number {
  if (xp < 0n) throw new Error('XP cannot be negative.');
  for (let level = MAX_SKILL_LEVEL; level >= 1; level -= 1) {
    if (xp >= xpForLevel(level)) return level;
  }
  return 1;
}
export function xpForNextLevel(xp: bigint): bigint | null {
  const level = levelForXp(xp);
  return level >= MAX_SKILL_LEVEL ? null : xpForLevel(level + 1) - xp;
}
