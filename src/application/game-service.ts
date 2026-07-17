import { randomUUID } from 'node:crypto';

import { activities, items, skills, type ActivityDefinition, type SkillKey } from '../content/game-content.js';
import { levelForXp } from '../domain/skills/levels.js';
import { withTransaction, type Queryable } from '../infrastructure/database/database.js';
import type { Pool } from 'pg';

type CharacterRow = { id: string; name: string; coins: string };
type SkillRow = { skill_key: SkillKey; xp: string };
type InventoryRow = { item_key: string; quantity: string };
type ActivityRow = { id: string; activity_key: string; completes_at: Date; claimed_at: Date | null };

export interface CharacterProfile {
  id: string;
  name: string;
  coins: bigint;
  skills: Array<{ key: SkillKey; name: string; xp: bigint; level: number }>;
}
export interface ActiveActivity {
  activity: ActivityDefinition;
  completesAt: Date;
}

export class GameService {
  public constructor(private readonly pool: Pool) {}

  public async createCharacter(discordUserId: string, name: string): Promise<CharacterProfile> {
    return withTransaction(this.pool, async (client) => {
      const existing = await this.findCharacter(client, discordUserId, true);
      if (existing) throw new Error('You already have a character.');
      const userId = randomUUID();
      const characterId = randomUUID();
      await client.query('INSERT INTO users (id, discord_user_id) VALUES ($1, $2)', [userId, discordUserId]);
      await client.query('INSERT INTO characters (id, user_id, name) VALUES ($1, $2, $3)', [characterId, userId, name]);
      for (const skill of skills) {
        await client.query('INSERT INTO character_skills (character_id, skill_key) VALUES ($1, $2)', [characterId, skill.key]);
      }
      return this.getProfileByCharacterId(client, characterId);
    });
  }

  public async getProfile(discordUserId: string): Promise<CharacterProfile | null> {
    const character = await this.findCharacter(this.pool, discordUserId);
    return character ? this.getProfileByCharacterId(this.pool, character.id) : null;
  }

  public async getInventory(discordUserId: string): Promise<Array<{ itemKey: string; name: string; quantity: bigint }>> {
    const character = await this.findCharacter(this.pool, discordUserId);
    if (!character) throw new Error('Create a character first with /start.');
    const result = await this.pool.query<InventoryRow>(
      'SELECT item_key, quantity FROM inventory_items WHERE character_id = $1 ORDER BY item_key',
      [character.id],
    );
    return result.rows.map((row) => ({
      itemKey: row.item_key,
      name: items[row.item_key]?.name ?? row.item_key,
      quantity: BigInt(row.quantity),
    }));
  }

  public async startActivity(discordUserId: string, activityKey: string, now = new Date()): Promise<ActiveActivity> {
    const activity = activities[activityKey];
    if (!activity) throw new Error('That activity is not available.');
    return withTransaction(this.pool, async (client) => {
      const character = await this.findCharacter(client, discordUserId, true);
      if (!character) throw new Error('Create a character first with /start.');
      const active = await client.query<ActivityRow>(
        'SELECT id, activity_key, completes_at, claimed_at FROM active_activities WHERE character_id = $1 FOR UPDATE',
        [character.id],
      );
      if (active.rowCount) throw new Error('You already have an activity in progress. Claim it before starting another.');
      const completesAt = new Date(now.getTime() + activity.durationMs);
      await client.query(
        'INSERT INTO active_activities (id, character_id, activity_key, started_at, completes_at) VALUES ($1, $2, $3, $4, $5)',
        [randomUUID(), character.id, activity.key, now, completesAt],
      );
      return { activity, completesAt };
    });
  }

  public async getActiveActivity(discordUserId: string): Promise<ActiveActivity | null> {
    const character = await this.findCharacter(this.pool, discordUserId);
    if (!character) return null;
    const result = await this.pool.query<ActivityRow>(
      'SELECT id, activity_key, completes_at, claimed_at FROM active_activities WHERE character_id = $1',
      [character.id],
    );
    const row = result.rows[0];
    if (!row) return null;
    const activity = activities[row.activity_key];
    if (!activity) throw new Error('The active activity definition no longer exists.');
    return { activity, completesAt: row.completes_at };
  }

  public async claimActivity(discordUserId: string, now = new Date()): Promise<ActiveActivity> {
    return withTransaction(this.pool, async (client) => {
      const character = await this.findCharacter(client, discordUserId, true);
      if (!character) throw new Error('Create a character first with /start.');
      const activeResult = await client.query<ActivityRow>(
        'SELECT id, activity_key, completes_at, claimed_at FROM active_activities WHERE character_id = $1 FOR UPDATE',
        [character.id],
      );
      const active = activeResult.rows[0];
      if (!active) throw new Error('You have no activity to claim.');
      if (active.claimed_at) throw new Error('This activity was already claimed.');
      if (active.completes_at > now) throw new Error(`This activity is not finished yet. It completes <t:${Math.floor(active.completes_at.getTime() / 1000)}:R>.`);
      const activity = activities[active.activity_key];
      if (!activity) throw new Error('The active activity definition no longer exists.');
      await client.query(
        'UPDATE character_skills SET xp = xp + $1 WHERE character_id = $2 AND skill_key = $3',
        [activity.xp.toString(), character.id, activity.skill],
      );
      for (const reward of activity.rewards) await this.addItem(client, character.id, reward.itemKey, reward.quantity);
      await client.query('DELETE FROM active_activities WHERE id = $1', [active.id]);
      await client.query(
        `INSERT INTO economy_ledger (id, character_id, entry_type, item_key, item_quantity, idempotency_key, metadata)
         VALUES ($1, $2, 'activity_claim', NULL, NULL, $3, $4)`,
        [randomUUID(), character.id, `activity:${active.id}`, JSON.stringify({ activity: activity.key, xp: activity.xp.toString() })],
      );
      return { activity, completesAt: active.completes_at };
    });
  }

  public async sellItem(discordUserId: string, itemKey: string, quantity: bigint): Promise<bigint> {
    const item = items[itemKey];
    if (!item) throw new Error('That item cannot be sold.');
    if (quantity <= 0n) throw new Error('Quantity must be positive.');
    return withTransaction(this.pool, async (client) => {
      const character = await this.findCharacter(client, discordUserId, true);
      if (!character) throw new Error('Create a character first with /start.');
      const inventory = await client.query<InventoryRow>(
        'SELECT item_key, quantity FROM inventory_items WHERE character_id = $1 AND item_key = $2 FOR UPDATE',
        [character.id, itemKey],
      );
      const owned = BigInt(inventory.rows[0]?.quantity ?? '0');
      if (owned < quantity) throw new Error(`You only have ${owned.toString()} ${item.name}.`);
      const coinDelta = item.sellPrice * quantity;
      if (owned === quantity) await client.query('DELETE FROM inventory_items WHERE character_id = $1 AND item_key = $2', [character.id, itemKey]);
      else await client.query('UPDATE inventory_items SET quantity = quantity - $1 WHERE character_id = $2 AND item_key = $3', [quantity.toString(), character.id, itemKey]);
      await client.query('UPDATE characters SET coins = coins + $1, updated_at = NOW() WHERE id = $2', [coinDelta.toString(), character.id]);
      await client.query(
        `INSERT INTO economy_ledger (id, character_id, entry_type, coin_delta, item_key, item_quantity, idempotency_key)
         VALUES ($1, $2, 'sell', $3, $4, $5, $6)`,
        [randomUUID(), character.id, coinDelta.toString(), itemKey, quantity.toString(), `sell:${randomUUID()}`],
      );
      return coinDelta;
    });
  }

  private async findCharacter(db: Queryable, discordUserId: string, lock = false): Promise<CharacterRow | null> {
    const result = await db.query<CharacterRow>(
      `SELECT c.id, c.name, c.coins FROM characters c JOIN users u ON u.id = c.user_id WHERE u.discord_user_id = $1${lock ? ' FOR UPDATE OF c' : ''}`,
      [discordUserId],
    );
    return result.rows[0] ?? null;
  }

  private async getProfileByCharacterId(db: Queryable, characterId: string): Promise<CharacterProfile> {
    const character = await db.query<CharacterRow>('SELECT id, name, coins FROM characters WHERE id = $1', [characterId]);
    const row = character.rows[0];
    if (!row) throw new Error('Character not found.');
    const skillRows = await db.query<SkillRow>('SELECT skill_key, xp FROM character_skills WHERE character_id = $1', [characterId]);
    const xpBySkill = new Map(skillRows.rows.map((skill) => [skill.skill_key, BigInt(skill.xp)]));
    return {
      id: row.id,
      name: row.name,
      coins: BigInt(row.coins),
      skills: skills.map((skill) => {
        const xp = xpBySkill.get(skill.key) ?? 0n;
        return { ...skill, xp, level: levelForXp(xp) };
      }),
    };
  }

  private async addItem(db: Queryable, characterId: string, itemKey: string, quantity: bigint): Promise<void> {
    await db.query(
      `INSERT INTO inventory_items (character_id, item_key, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (character_id, item_key) DO UPDATE SET quantity = inventory_items.quantity + EXCLUDED.quantity`,
      [characterId, itemKey, quantity.toString()],
    );
  }
}
