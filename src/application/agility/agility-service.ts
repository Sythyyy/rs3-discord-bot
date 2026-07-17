import { randomUUID } from 'node:crypto';

import { assessEligibility, recommendCourse, type AgilityCourse } from '../../domain/agility/course.js';
import { levelForXp } from '../../domain/skills/levels.js';
import { withTransaction, type Queryable } from '../../infrastructure/database/database.js';
import { AgilityRepository } from '../../infrastructure/agility/agility-repository.js';
import type { Pool } from 'pg';

type Character = { id: string };
type Activity = { id: string; completes_at: Date; activity_type: string };

export class AgilityService {
  private readonly courses: AgilityRepository;
  public constructor(private readonly pool: Pool) { this.courses = new AgilityRepository(pool); }
  public async listCourses(discordUserId: string): Promise<{ level: number; courses: AgilityCourse[] }> { const xp = await this.agilityXp(discordUserId); return { level: levelForXp(xp), courses: await this.courses.listCourses() }; }
  public async guide(discordUserId: string): Promise<{ level: number; course: AgilityCourse | null }> { const data = await this.listCourses(discordUserId); return { level: data.level, course: recommendCourse(data.courses, data.level) }; }
  public async start(discordUserId: string, slug: string, now = new Date()): Promise<{ course: AgilityCourse; completesAt: Date }> {
    return withTransaction(this.pool, async (db) => {
      const character = await this.character(db, discordUserId, true); if (!character) throw new Error('Create a character first with /start.');
      const xp = await this.agilityXpByCharacter(db, character.id); const course = await this.courses.findCourse(slug, db); if (!course) throw new Error('That Agility course is not available.');
      const eligibility = assessEligibility(course, levelForXp(xp)); if (!eligibility.eligible) throw new Error(eligibility.reasons.join(' '));
      const active = await db.query<Activity>('SELECT id, completes_at, activity_type FROM active_activities WHERE character_id = $1 FOR UPDATE', [character.id]); if (active.rowCount) throw new Error('You already have an activity in progress. Claim it before starting Agility.');
      const id = randomUUID(); const completesAt = new Date(now.getTime() + course.botDurationSeconds * 1000);
      await db.query(`INSERT INTO active_activities (id, character_id, activity_key, activity_type, started_at, completes_at) VALUES ($1,$2,$3,'agility',$4,$5)`, [id, character.id, `agility:${course.slug}`, now, completesAt]);
      await this.courses.createActivityDetails(db, id, course); return { course, completesAt };
    });
  }
  public async status(discordUserId: string): Promise<{ xp: bigint; level: number; course: AgilityCourse | null; completesAt: Date | null }> {
    const character = await this.character(this.pool, discordUserId); if (!character) throw new Error('Create a character first with /start.'); const xp = await this.agilityXpByCharacter(this.pool, character.id);
    const active = await this.pool.query<Activity>('SELECT id, completes_at, activity_type FROM active_activities WHERE character_id = $1', [character.id]); const row = active.rows[0];
    return { xp, level: levelForXp(xp), course: row?.activity_type === 'agility' ? await this.courses.getCourseByActivity(row.id, this.pool) : null, completesAt: row?.activity_type === 'agility' ? row.completes_at : null };
  }
  public async claim(discordUserId: string, now = new Date()): Promise<AgilityCourse> {
    return withTransaction(this.pool, async (db) => {
      const character = await this.character(db, discordUserId, true); if (!character) throw new Error('Create a character first with /start.');
      const active = await db.query<Activity>('SELECT id, completes_at, activity_type FROM active_activities WHERE character_id = $1 FOR UPDATE', [character.id]); const row = active.rows[0];
      if (!row || row.activity_type !== 'agility') throw new Error('You have no Agility activity to claim.'); if (row.completes_at > now) throw new Error(`This course completes <t:${Math.floor(row.completes_at.getTime() / 1000)}:R>.`);
      const course = await this.courses.getCourseByActivity(row.id, db); if (!course) throw new Error('The saved course could not be found.');
      await db.query(`UPDATE character_skills SET xp = xp + $1 WHERE character_id = $2 AND skill_key = 'agility'`, [course.botXpPerActivity.toString(), character.id]);
      await db.query(`INSERT INTO agility_reward_history (id, character_id, activity_id, course_id, xp_awarded, rewards, idempotency_key) VALUES ($1,$2,$3,$4,$5,'[]',$6)`, [randomUUID(), character.id, row.id, course.id, course.botXpPerActivity.toString(), `agility-claim:${row.id}`]);
      await db.query(`INSERT INTO economy_ledger (id, character_id, entry_type, idempotency_key, metadata) VALUES ($1,$2,'agility_claim',$3,$4)`, [randomUUID(), character.id, `agility-ledger:${row.id}`, JSON.stringify({ course: course.slug, xp: course.botXpPerActivity.toString() })]);
      await db.query('DELETE FROM active_activities WHERE id = $1', [row.id]); return course;
    });
  }
  private async character(db: Queryable, discordUserId: string, lock = false): Promise<Character | null> { const result = await db.query<Character>(`SELECT c.id FROM characters c JOIN users u ON u.id = c.user_id WHERE u.discord_user_id = $1${lock ? ' FOR UPDATE OF c' : ''}`, [discordUserId]); return result.rows[0] ?? null; }
  private async agilityXp(discordUserId: string): Promise<bigint> { const character = await this.character(this.pool, discordUserId); if (!character) throw new Error('Create a character first with /start.'); return this.agilityXpByCharacter(this.pool, character.id); }
  private async agilityXpByCharacter(db: Queryable, characterId: string): Promise<bigint> { const result = await db.query<{ xp: string }>(`SELECT xp FROM character_skills WHERE character_id = $1 AND skill_key = 'agility'`, [characterId]); return BigInt(result.rows[0]?.xp ?? '0'); }
}
