export const MAX_QUEST_POINTS = 473;

export interface QuestPointReward {
  rolled: number;
  awarded: number;
  total: number;
}

export function calculateQuestPointReward(current: number, random: number): QuestPointReward {
  if (!Number.isInteger(current) || current < 0 || current > MAX_QUEST_POINTS)
    throw new Error(`Quest Points must be between 0 and ${MAX_QUEST_POINTS}.`);
  const rolled = Math.floor(Math.min(0.999999, Math.max(0, random)) * 3) + 1;
  const total = Math.min(MAX_QUEST_POINTS, current + rolled);
  return { rolled, awarded: total - current, total };
}
