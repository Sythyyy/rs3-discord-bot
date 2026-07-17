export interface AgilityCourse {
  id: string;
  slug: string;
  name: string;
  location: string;
  requiredAgilityLevel: number;
  requiredQuests: string[];
  accessRequirements: string;
  obstacleCount: number | null;
  baseXpPerObstacle: string | null;
  baseLapCompletionXp: string | null;
  estimatedBaseXpPerHourMin: number | null;
  estimatedBaseXpPerHourMax: number | null;
  estimatedRateNotes: string;
  failurePossible: boolean;
  failureNotes: string;
  rewardSummary: string;
  sourceUrl: string;
  sourceRevisionOrVerifiedAt: string;
  needsVerification: boolean;
  active: boolean;
  botDurationSeconds: number;
  botLapsPerActivity: number;
  botXpPerActivity: bigint;
  botBalanceNotes: string;
}

export interface Eligibility {
  eligible: boolean;
  reasons: string[];
}

export function assessEligibility(course: AgilityCourse, agilityLevel: number): Eligibility {
  const reasons: string[] = [];
  if (!course.active) reasons.push('This course is currently inactive.');
  if (course.needsVerification) reasons.push('This course is awaiting data verification.');
  if (agilityLevel < course.requiredAgilityLevel) reasons.push(`Requires Agility level ${course.requiredAgilityLevel}.`);
  if (course.requiredQuests.length > 0) reasons.push(`Requires: ${course.requiredQuests.join(', ')}.`);
  if (course.accessRequirements) reasons.push(`Access: ${course.accessRequirements}`);
  return { eligible: reasons.length === 0, reasons };
}

export function recommendCourse(courses: AgilityCourse[], agilityLevel: number): AgilityCourse | null {
  return courses
    .filter((course) => assessEligibility(course, agilityLevel).eligible)
    .sort((left, right) => Number(right.botXpPerActivity) / right.botDurationSeconds - Number(left.botXpPerActivity) / left.botDurationSeconds)[0] ?? null;
}
