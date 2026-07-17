import { z } from 'zod';

export const AGILITY_CATALOGUE_VERSION = 'rs3-agility-2026-07-17-v1';
export const AGILITY_SOURCE_URL = 'https://runescape.wiki/w/Agility_training';

const courseSchema = z.object({
  slug: z.string(), name: z.string(), location: z.string(), requiredAgilityLevel: z.number().int().min(1).max(120),
  requiredQuests: z.array(z.string()), accessRequirements: z.string(), obstacleCount: z.number().int().nullable(),
  baseXpPerObstacle: z.string().nullable(), baseLapCompletionXp: z.string().nullable(),
  estimatedBaseXpPerHourMin: z.number().int().nullable(), estimatedBaseXpPerHourMax: z.number().int().nullable(), estimatedRateNotes: z.string(),
  failurePossible: z.boolean(), failureNotes: z.string(), rewardSummary: z.string(), sourceUrl: z.string().url(),
  sourceRevisionOrVerifiedAt: z.string(), needsVerification: z.boolean(), active: z.boolean(), botDurationSeconds: z.number().int().positive(),
  botLapsPerActivity: z.number().int().positive(), botXpPerActivity: z.bigint().nonnegative(), botBalanceNotes: z.string(),
});
export type AgilitySeedCourse = z.infer<typeof courseSchema>;

/** Local approved data. Wiki estimates are intentionally absent until individually reviewed. */
export const agilityCatalogue = [
  { slug: 'gnome-stronghold', name: 'Gnome Stronghold Agility Course', location: 'Tree Gnome Stronghold', requiredAgilityLevel: 1, requiredQuests: [], accessRequirements: '', obstacleCount: 6, baseXpPerObstacle: null, baseLapCompletionXp: null, estimatedBaseXpPerHourMin: null, estimatedBaseXpPerHourMax: null, estimatedRateNotes: 'No XP/hour estimate is displayed until manually reviewed.', failurePossible: false, failureNotes: '', rewardSummary: 'No source reward is configured.', sourceUrl: AGILITY_SOURCE_URL, sourceRevisionOrVerifiedAt: '2026-07-17 manual catalogue review', needsVerification: false, active: true, botDurationSeconds: 60, botLapsPerActivity: 1, botXpPerActivity: 40n, botBalanceNotes: 'Bot balance: 40 XP per 60-second activity; not real-game XP.' },
  { slug: 'barbarian-outpost', name: 'Barbarian Outpost Agility Course', location: 'Barbarian Outpost', requiredAgilityLevel: 35, requiredQuests: [], accessRequirements: '', obstacleCount: null, baseXpPerObstacle: null, baseLapCompletionXp: null, estimatedBaseXpPerHourMin: null, estimatedBaseXpPerHourMax: null, estimatedRateNotes: 'Awaiting manual rate review.', failurePossible: true, failureNotes: 'Failure details require manual verification.', rewardSummary: 'No source reward is configured.', sourceUrl: AGILITY_SOURCE_URL, sourceRevisionOrVerifiedAt: '2026-07-17 manual catalogue review', needsVerification: false, active: true, botDurationSeconds: 75, botLapsPerActivity: 1, botXpPerActivity: 80n, botBalanceNotes: 'Bot balance: 80 XP per 75-second activity; not real-game XP.' },
  { slug: 'penguin-agility', name: 'Penguin Agility Course', location: 'Penguin Outpost', requiredAgilityLevel: 30, requiredQuests: [], accessRequirements: '', obstacleCount: null, baseXpPerObstacle: null, baseLapCompletionXp: null, estimatedBaseXpPerHourMin: null, estimatedBaseXpPerHourMax: null, estimatedRateNotes: 'Awaiting manual rate review.', failurePossible: true, failureNotes: 'Failure details require manual verification.', rewardSummary: 'No source reward is configured.', sourceUrl: AGILITY_SOURCE_URL, sourceRevisionOrVerifiedAt: '2026-07-17 manual catalogue review', needsVerification: false, active: true, botDurationSeconds: 70, botLapsPerActivity: 1, botXpPerActivity: 65n, botBalanceNotes: 'Bot balance: 65 XP per 70-second activity; not real-game XP.' },
].map((course) => courseSchema.parse(course));
