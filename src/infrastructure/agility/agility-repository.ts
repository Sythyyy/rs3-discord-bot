import { createHash, randomUUID } from 'node:crypto';

import { AGILITY_CATALOGUE_VERSION, AGILITY_SOURCE_URL, agilityCatalogue } from '../../content/agility-catalogue.js';
import type { AgilityCourse } from '../../domain/agility/course.js';
import type { Queryable } from '../database/database.js';
import type { Pool } from 'pg';

type CourseRow = Record<string, unknown>;
const idFor = (key: string) => createHash('sha256').update(key).digest('hex').slice(0, 32).replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

export class AgilityRepository {
  public constructor(private readonly pool: Pool) {}

  public async seedApprovedCatalogue(): Promise<void> {
    const versionId = idFor(AGILITY_CATALOGUE_VERSION);
    const hash = createHash('sha256').update(JSON.stringify(agilityCatalogue, (_, value) => typeof value === 'bigint' ? value.toString() : value)).digest('hex');
    await this.pool.query(`INSERT INTO agility_catalogue_versions (id, version, source_url, verified_at, content_hash, status)
      VALUES ($1, $2, $3, NOW(), $4, 'approved') ON CONFLICT (version) DO NOTHING`, [versionId, AGILITY_CATALOGUE_VERSION, AGILITY_SOURCE_URL, hash]);
    for (const course of agilityCatalogue) {
      await this.pool.query(`INSERT INTO agility_courses (id, catalogue_version_id, slug, name, location, required_agility_level, required_quests, access_requirements, obstacle_count, base_xp_per_obstacle, base_lap_completion_xp, estimated_base_xp_per_hour_min, estimated_base_xp_per_hour_max, estimated_rate_notes, failure_possible, failure_notes, reward_summary, source_url, source_revision_or_verified_at, needs_verification, active, bot_duration_seconds, bot_laps_per_activity, bot_xp_per_activity, bot_balance_notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
        ON CONFLICT (slug) DO NOTHING`, [idFor(`course:${course.slug}`), versionId, course.slug, course.name, course.location, course.requiredAgilityLevel, JSON.stringify(course.requiredQuests), course.accessRequirements, course.obstacleCount, course.baseXpPerObstacle, course.baseLapCompletionXp, course.estimatedBaseXpPerHourMin, course.estimatedBaseXpPerHourMax, course.estimatedRateNotes, course.failurePossible, course.failureNotes, course.rewardSummary, course.sourceUrl, course.sourceRevisionOrVerifiedAt, course.needsVerification, course.active, course.botDurationSeconds, course.botLapsPerActivity, course.botXpPerActivity.toString(), course.botBalanceNotes]);
    }
  }

  public async listCourses(): Promise<AgilityCourse[]> { return this.mapCourses((await this.pool.query<CourseRow>('SELECT * FROM agility_courses ORDER BY required_agility_level, name')).rows); }
  public async findCourse(slug: string, db: Queryable = this.pool): Promise<AgilityCourse | null> { return this.mapCourses((await db.query<CourseRow>('SELECT * FROM agility_courses WHERE slug = $1', [slug])).rows)[0] ?? null; }
  public async getCourseByActivity(activityId: string, db: Queryable): Promise<AgilityCourse | null> { return this.mapCourses((await db.query<CourseRow>('SELECT c.* FROM agility_activity_details d JOIN agility_courses c ON c.id = d.course_id WHERE d.active_activity_id = $1', [activityId])).rows)[0] ?? null; }
  public async createActivityDetails(db: Queryable, activityId: string, course: AgilityCourse): Promise<void> {
    await db.query(`INSERT INTO agility_activity_details (active_activity_id, course_id, catalogue_version_id, planned_laps, planned_obstacles, bot_xp_award, source_xp_snapshot, reward_snapshot)
      SELECT $1, c.id, c.catalogue_version_id, $2, $3, $4, $5, '[]' FROM agility_courses c WHERE c.id = $6`, [activityId, course.botLapsPerActivity, course.obstacleCount === null ? null : course.obstacleCount * course.botLapsPerActivity, course.botXpPerActivity.toString(), JSON.stringify({ baseXpPerObstacle: course.baseXpPerObstacle, baseLapCompletionXp: course.baseLapCompletionXp, estimatedXpPerHour: [course.estimatedBaseXpPerHourMin, course.estimatedBaseXpPerHourMax], source: course.sourceUrl }), course.id]);
  }
  private mapCourses(rows: CourseRow[]): AgilityCourse[] { return rows.map((r) => ({ id: String(r.id), slug: String(r.slug), name: String(r.name), location: String(r.location), requiredAgilityLevel: Number(r.required_agility_level), requiredQuests: r.required_quests as string[], accessRequirements: String(r.access_requirements), obstacleCount: r.obstacle_count === null ? null : Number(r.obstacle_count), baseXpPerObstacle: r.base_xp_per_obstacle === null ? null : String(r.base_xp_per_obstacle), baseLapCompletionXp: r.base_lap_completion_xp === null ? null : String(r.base_lap_completion_xp), estimatedBaseXpPerHourMin: r.estimated_base_xp_per_hour_min === null ? null : Number(r.estimated_base_xp_per_hour_min), estimatedBaseXpPerHourMax: r.estimated_base_xp_per_hour_max === null ? null : Number(r.estimated_base_xp_per_hour_max), estimatedRateNotes: String(r.estimated_rate_notes), failurePossible: Boolean(r.failure_possible), failureNotes: String(r.failure_notes), rewardSummary: String(r.reward_summary), sourceUrl: String(r.source_url), sourceRevisionOrVerifiedAt: String(r.source_revision_or_verified_at), needsVerification: Boolean(r.needs_verification), active: Boolean(r.active), botDurationSeconds: Number(r.bot_duration_seconds), botLapsPerActivity: Number(r.bot_laps_per_activity), botXpPerActivity: BigInt(String(r.bot_xp_per_activity)), botBalanceNotes: String(r.bot_balance_notes) })); }
}

export const newId = (): string => randomUUID();
