import { describe, expect, it } from 'vitest';

import { assessEligibility, recommendCourse, type AgilityCourse } from './course.js';

const course = (overrides: Partial<AgilityCourse> = {}): AgilityCourse => ({ id: '1', slug: 'test', name: 'Test', location: 'Test', requiredAgilityLevel: 10, requiredQuests: [], accessRequirements: '', obstacleCount: null, baseXpPerObstacle: null, baseLapCompletionXp: null, estimatedBaseXpPerHourMin: null, estimatedBaseXpPerHourMax: null, estimatedRateNotes: '', failurePossible: false, failureNotes: '', rewardSummary: '', sourceUrl: 'https://runescape.wiki/w/Agility_training', sourceRevisionOrVerifiedAt: 'test', needsVerification: false, active: true, botDurationSeconds: 60, botLapsPerActivity: 1, botXpPerActivity: 60n, botBalanceNotes: '', ...overrides });

describe('Agility eligibility and guides', () => {
  it('explains inaccessible courses and excludes unverified records', () => { expect(assessEligibility(course({ needsVerification: true }), 1).eligible).toBe(false); expect(assessEligibility(course(), 9).reasons).toContain('Requires Agility level 10.'); });
  it('recommends only verified eligible courses by bot efficiency', () => { expect(recommendCourse([course({ slug: 'slow', botXpPerActivity: 20n }), course({ slug: 'fast', botXpPerActivity: 120n }), course({ slug: 'review', botXpPerActivity: 999n, needsVerification: true })], 20)?.slug).toBe('fast'); });
});
