import { randomUUID } from 'node:crypto';

import {
  activities,
  items,
  skills,
  type ActivityDefinition,
  type SkillKey,
} from '../content/game-content.js';
import { levelForXp, xpForLevel } from '../domain/skills/levels.js';
import { planTrip, scaleReward } from '../domain/activities/trip.js';
import { calculateQuestPointReward, MAX_QUEST_POINTS } from '../domain/questing/rewards.js';
import {
  simulateWoodcuttingAttempts,
  simulateWoodcuttingTarget,
  type WoodcuttingRngAudit,
} from '../domain/woodcutting/trip.js';
import {
  hatchetsByKey,
  magicLogsHatchetBoost,
  mapleLogsHatchetBoost,
  oakLogsHatchetBoost,
  regularLogsHatchetBoost,
  willowLogsHatchetBoost,
  yewLogsHatchetBoost,
  type HatchetBoostSnapshot,
} from '../domain/woodcutting/hatchets.js';
import { treesByKey } from '../domain/woodcutting/catalogue.js';
import { withTransaction, type Queryable } from '../infrastructure/database/database.js';
import type { Pool } from 'pg';

type CharacterRow = { id: string; name: string; coins: string; quest_points: number };
type SkillRow = { skill_key: SkillKey; xp: string };
type InventoryRow = { item_key: string; quantity: string };

export interface BankInventoryItem {
  itemKey: string;
  name: string;
  iconFile: string;
  quantity: bigint;
  unitValue: bigint;
}

export interface BankData {
  playerName: string;
  items: BankInventoryItem[];
}
type WoodcuttingResultRow = {
  activity_key: string;
  actual_logs: string;
  xp_award: string;
  fatigue_ended: boolean;
  completed_at: Date;
};
type ActivityRow = {
  id: string;
  character_id: string;
  activity_key: string;
  started_at: Date;
  completes_at: Date;
  notification_channel_id: string | null;
  quantity: string;
  actual_quantity: string | null;
  min_duration_ms: number | null;
  max_duration_ms: number | null;
  xp_award: string | null;
  fatigue_ended: boolean | null;
  formula_version: string | null;
  boost_snapshot: HatchetBoostSnapshot | null;
  planned_attempts: string | null;
  executed_attempts: string | null;
  rng_audit: WoodcuttingRngAudit | null;
  requested_quantity: string | null;
  target_reached: boolean | null;
  discord_user_id?: string;
};

export interface CharacterProfile {
  id: string;
  name: string;
  coins: bigint;
  questPoints: number;
  skills: Array<{ key: SkillKey; name: string; xp: bigint; level: number }>;
  activeWoodcuttingTrip: null | {
    activityName: string;
    expectedLogs: bigint;
    completesAt: Date;
  };
  recentWoodcuttingTrips: Array<{
    activityName: string;
    actualLogs: bigint;
    xp: bigint;
    fatigueEnded: boolean;
    completedAt: Date;
  }>;
  equippedHatchet: { key: string; name: string };
}
export interface ActiveActivity {
  activity: ActivityDefinition;
  completesAt: Date;
  minDurationMs?: number;
  maxDurationMs?: number;
  durationMs?: number;
  quantity: bigint;
  boosts: ReadonlyArray<{ name: string; amount: number }>;
  actualQuantity?: bigint;
  hatchetBoost?: HatchetBoostSnapshot;
  requestedQuantity?: bigint;
  targetReached?: boolean;
}
export interface CompletedActivity {
  activityId: string;
  discordUserId: string;
  notificationChannelId: string | null;
  activity: ActivityDefinition;
  oldLevel: number;
  newLevel: number;
  durationMs: number;
  xp: bigint;
  rewards: ReadonlyArray<{ itemKey: string; quantity: bigint }>;
  quantity: bigint;
  actualQuantity?: bigint;
  fatigueEnded?: boolean;
  questPointsAwarded?: number;
  totalQuestPoints?: number;
}

export class GameService {
  public constructor(
    private readonly pool: Pool,
    private readonly gameSpeedMultiplier = 0.23,
  ) {
    if (!Number.isFinite(gameSpeedMultiplier) || gameSpeedMultiplier <= 0)
      throw new Error('Game speed multiplier must be positive.');
  }

  public async buyMinion(discordUserId: string, name: string): Promise<CharacterProfile> {
    return withTransaction(this.pool, async (client) => {
      const existing = await this.findCharacter(client, discordUserId, true);
      if (existing) throw new Error('You already own a minion.');
      const userId = randomUUID();
      const characterId = randomUUID();
      await client.query('INSERT INTO users (id, discord_user_id) VALUES ($1, $2)', [
        userId,
        discordUserId,
      ]);
      await client.query('INSERT INTO characters (id, user_id, name) VALUES ($1, $2, $3)', [
        characterId,
        userId,
        name,
      ]);
      for (const skill of skills) {
        await client.query(
          'INSERT INTO character_skills (character_id, skill_key) VALUES ($1, $2)',
          [characterId, skill.key],
        );
      }
      return this.getProfileByCharacterId(client, characterId);
    });
  }

  public async getProfile(discordUserId: string): Promise<CharacterProfile | null> {
    const character = await this.findCharacter(this.pool, discordUserId);
    return character ? this.getProfileByCharacterId(this.pool, character.id) : null;
  }

  public async getBank(discordUserId: string): Promise<BankData> {
    const character = await this.findCharacter(this.pool, discordUserId);
    if (!character) throw new Error('Buy a minion first with /minion buy.');
    const result = await this.pool.query<InventoryRow>(
      `SELECT item_key, quantity FROM inventory_items
       WHERE character_id = $1 AND quantity > 0
       ORDER BY item_key`,
      [character.id],
    );
    return {
      playerName: character.name,
      items: result.rows.map((row) => {
        const item = items[row.item_key];
        return {
          itemKey: row.item_key,
          name: item?.name ?? row.item_key,
          iconFile: item?.iconFile ?? `${row.item_key}.png`,
          quantity: BigInt(row.quantity),
          unitValue: item?.sellPrice ?? 0n,
        };
      }),
    };
  }

  public async getInventory(
    discordUserId: string,
  ): Promise<Array<{ itemKey: string; name: string; iconFile: string; quantity: bigint }>> {
    return (await this.getBank(discordUserId)).items;
  }

  public async equipHatchet(discordUserId: string, itemKey: string): Promise<string> {
    const hatchet = hatchetsByKey[itemKey];
    if (!hatchet) throw new Error('That item cannot be equipped in the hatchet slot.');
    return withTransaction(this.pool, async (client) => {
      const character = await this.findCharacter(client, discordUserId, true);
      if (!character) throw new Error('Buy a minion first with /minion buy.');
      const [skillResult, inventoryResult] = await Promise.all([
        client.query<SkillRow>(
          `SELECT skill_key, xp FROM character_skills
           WHERE character_id = $1 AND skill_key = 'woodcutting'`,
          [character.id],
        ),
        client.query<InventoryRow>(
          `SELECT item_key, quantity FROM inventory_items
           WHERE character_id = $1 AND item_key = $2`,
          [character.id, itemKey],
        ),
      ]);
      const level = levelForXp(BigInt(skillResult.rows[0]?.xp ?? '0'));
      if (level < hatchet.requiredLevel)
        throw new Error(`${hatchet.name} requires level ${hatchet.requiredLevel} Woodcutting.`);
      if (BigInt(inventoryResult.rows[0]?.quantity ?? '0') <= 0n)
        throw new Error(`You do not own a ${hatchet.name}.`);
      await client.query(
        `INSERT INTO character_equipment (character_id, slot, item_key)
         VALUES ($1, 'hatchet', $2)
         ON CONFLICT (character_id, slot)
         DO UPDATE SET item_key = EXCLUDED.item_key, equipped_at = NOW()`,
        [character.id, itemKey],
      );
      return hatchet.name;
    });
  }

  public async startActivity(
    discordUserId: string,
    activityKey: string,
    notificationChannelId: string | null,
    requestedQuantity?: bigint,
    now = new Date(),
    random = Math.random,
    repeatSourceActivityId?: string,
  ): Promise<ActiveActivity> {
    const activity = activities[activityKey];
    if (!activity) throw new Error('That activity is not available.');
    return withTransaction(this.pool, async (client) => {
      const character = await this.findCharacter(client, discordUserId, true);
      if (!character) throw new Error('Buy a minion first with /minion buy.');
      if (activity.isQuest && character.quest_points >= MAX_QUEST_POINTS)
        throw new Error(`You already have the maximum ${MAX_QUEST_POINTS} Quest Points.`);
      let level = 1;
      if (!activity.isQuest) {
        const skillResult = await client.query<SkillRow>(
          'SELECT skill_key, xp FROM character_skills WHERE character_id = $1 AND skill_key = $2',
          [character.id, activity.skill],
        );
        level = levelForXp(BigInt(skillResult.rows[0]?.xp ?? '0'));
        if (level < activity.requiredLevel)
          throw new Error(
            `${activity.name} requires level ${activity.requiredLevel} ${activity.skill}.`,
          );
      }
      for (const requirement of activity.requiredSkills ?? []) {
        const requiredSkillResult = await client.query<SkillRow>(
          'SELECT skill_key, xp FROM character_skills WHERE character_id = $1 AND skill_key = $2',
          [character.id, requirement.skill],
        );
        const requiredSkillLevel = levelForXp(BigInt(requiredSkillResult.rows[0]?.xp ?? '0'));
        if (requiredSkillLevel < requirement.level) {
          const skillName = skills.find((skill) => skill.key === requirement.skill)?.name;
          throw new Error(
            `${activity.name} requires level ${requirement.level} ${skillName ?? requirement.skill}.`,
          );
        }
      }
      let hatchetBoost: HatchetBoostSnapshot | null = null;
      if (activity.skill === 'woodcutting') {
        const equipped = await client.query<{ item_key: string }>(
          `SELECT item_key FROM character_equipment
           WHERE character_id = $1 AND slot = 'hatchet'`,
          [character.id],
        );
        const equippedKey = equipped.rows[0]?.item_key ?? 'bronze_hatchet';
        const equippedDefinition = hatchetsByKey[equippedKey];
        if (!equippedDefinition) throw new Error('Your equipped hatchet is not recognized.');
        if (level < equippedDefinition.requiredLevel)
          throw new Error(
            `${equippedDefinition.name} requires level ${equippedDefinition.requiredLevel} Woodcutting.`,
          );
        if (activity.key === 'woodcutting_regular') {
          hatchetBoost = regularLogsHatchetBoost(equippedKey, level);
        } else if (activity.key === 'woodcutting_oak') {
          hatchetBoost = oakLogsHatchetBoost(equippedKey, level);
        } else if (activity.key === 'woodcutting_willow') {
          hatchetBoost = willowLogsHatchetBoost(equippedKey, level);
        } else if (activity.key === 'woodcutting_maple') {
          hatchetBoost = mapleLogsHatchetBoost(equippedKey, level);
        } else if (activity.key === 'woodcutting_yew') {
          hatchetBoost = yewLogsHatchetBoost(equippedKey, level);
        } else if (activity.key === 'woodcutting_magic') {
          hatchetBoost = magicLogsHatchetBoost(equippedKey, level);
        } else {
          hatchetBoost = {
            hatchetKey: equippedKey,
            hatchetName: equippedDefinition.name,
            playerLevel: level,
            effectiveLevel: Math.min(level, 110),
            cutChanceBasisPoints: 10_000,
            bronzeChanceBasisPoints: 10_000,
            successMultiplier: 1,
            formulaVersion: 'unconfigured-tree-guaranteed-v1',
          };
        }
      }
      const active = await client.query<ActivityRow>(
        'SELECT id, character_id, activity_key, completes_at FROM active_activities WHERE character_id = $1 FOR UPDATE',
        [character.id],
      );
      if (active.rowCount) throw new Error('Your minion already has an activity in progress.');
      const activityId = randomUUID();
      let effectiveRequestedQuantity = requestedQuantity;
      if (repeatSourceActivityId) {
        const source = await client.query<{ requested_quantity: string | null }>(
          `SELECT requested_quantity FROM woodcutting_trip_results
           WHERE activity_id = $1 AND character_id = $2`,
          [repeatSourceActivityId, character.id],
        );
        if (!source.rowCount) throw new Error('The original Woodcutting trip was not found.');
        effectiveRequestedQuantity = source.rows[0]?.requested_quantity
          ? BigInt(source.rows[0].requested_quantity)
          : undefined;
        const repeatUse = await client.query(
          `INSERT INTO woodcutting_repeat_uses (source_activity_id, repeated_activity_id)
           VALUES ($1, $2)
           ON CONFLICT (source_activity_id) DO NOTHING
           RETURNING source_activity_id`,
          [repeatSourceActivityId, activityId],
        );
        if (!repeatUse.rowCount) throw new Error('This repeat-trip button has already been used.');
      }
      for (const requiredItemKey of activity.requiredItems ?? []) {
        const requiredItem = await client.query<InventoryRow>(
          `SELECT item_key, quantity FROM inventory_items
           WHERE character_id = $1 AND item_key = $2`,
          [character.id, requiredItemKey],
        );
        if (BigInt(requiredItem.rows[0]?.quantity ?? '0') <= 0n)
          throw new Error(
            `Your minion needs ${items[requiredItemKey]?.name ?? requiredItemKey}. Buy one with /buy.`,
          );
      }
      const baselineChanceBasisPoints =
        activity.key === 'woodcutting_regular'
          ? regularLogsHatchetBoost('bronze_hatchet', activity.requiredLevel).cutChanceBasisPoints
          : activity.key === 'woodcutting_oak'
            ? oakLogsHatchetBoost('bronze_hatchet', activity.requiredLevel).cutChanceBasisPoints
            : activity.key === 'woodcutting_willow'
              ? willowLogsHatchetBoost('bronze_hatchet', activity.requiredLevel)
                  .cutChanceBasisPoints
              : activity.key === 'woodcutting_maple'
                ? mapleLogsHatchetBoost('bronze_hatchet', activity.requiredLevel)
                    .cutChanceBasisPoints
                : activity.key === 'woodcutting_yew'
                  ? yewLogsHatchetBoost('bronze_hatchet', activity.requiredLevel)
                      .cutChanceBasisPoints
                  : activity.key === 'woodcutting_magic'
                    ? magicLogsHatchetBoost('bronze_hatchet', activity.requiredLevel)
                        .cutChanceBasisPoints
                    : 10_000;
      const attemptDurationFactor = baselineChanceBasisPoints / 10_000;
      const timing = {
        minMs: Math.max(
          1,
          Math.round(
            ((activity.minDurationMs ?? activity.durationMs ?? 60_000) * attemptDurationFactor) /
              this.gameSpeedMultiplier,
          ),
        ),
        maxMs: Math.max(
          1,
          Math.round(
            ((activity.maxDurationMs ?? activity.durationMs ?? 60_000) * attemptDurationFactor) /
              this.gameSpeedMultiplier,
          ),
        ),
        durationMs: 0,
      };
      timing.durationMs = Math.round((timing.minMs + timing.maxMs) / 2);
      const baseQuantity = activity.baseQuantity;
      const woodcuttingTree = activity.key.startsWith('woodcutting_')
        ? treesByKey[activity.key.slice('woodcutting_'.length)]
        : undefined;
      let trip = planTrip(
        baseQuantity,
        timing.minMs,
        timing.maxMs,
        timing.durationMs,
        woodcuttingTree
          ? (effectiveRequestedQuantity ?? BigInt(woodcuttingTree.balance.maxPotentialLogsPerTrip))
          : requestedQuantity,
      );
      if (requestedQuantity === undefined && activity.inputs?.length) {
        let supportedQuantity = trip.quantity;
        for (const input of activity.inputs) {
          const inventory = await client.query<InventoryRow>(
            `SELECT item_key, quantity FROM inventory_items
             WHERE character_id = $1 AND item_key = $2 FOR UPDATE`,
            [character.id, input.itemKey],
          );
          const owned = BigInt(inventory.rows[0]?.quantity ?? '0');
          const supportedByInput = (owned * baseQuantity) / input.quantity;
          if (supportedByInput < supportedQuantity) supportedQuantity = supportedByInput;
        }
        if (supportedQuantity <= 0n) {
          const input = activity.inputs[0]!;
          throw new Error(
            `You need ${items[input.itemKey]?.name ?? input.itemKey} for this activity.`,
          );
        }
        if (supportedQuantity < trip.quantity)
          trip = planTrip(
            baseQuantity,
            timing.minMs,
            timing.maxMs,
            timing.durationMs,
            supportedQuantity,
          );
      }
      for (const input of activity.inputs ?? []) {
        const requiredQuantity = scaleReward(input.quantity, trip.quantity, baseQuantity);
        const inventory = await client.query<InventoryRow>(
          `SELECT item_key, quantity FROM inventory_items
           WHERE character_id = $1 AND item_key = $2 FOR UPDATE`,
          [character.id, input.itemKey],
        );
        const owned = BigInt(inventory.rows[0]?.quantity ?? '0');
        if (owned < requiredQuantity) {
          const inputName = items[input.itemKey]?.name ?? input.itemKey;
          throw new Error(
            `You need ${requiredQuantity.toString()} ${inputName}, but only have ${owned.toString()}.`,
          );
        }
        if (owned === requiredQuantity)
          await client.query(
            'DELETE FROM inventory_items WHERE character_id = $1 AND item_key = $2',
            [character.id, input.itemKey],
          );
        else
          await client.query(
            `UPDATE inventory_items SET quantity = quantity - $1
             WHERE character_id = $2 AND item_key = $3`,
            [requiredQuantity.toString(), character.id, input.itemKey],
          );
      }
      const woodcuttingOutcome =
        activity.skill === 'woodcutting'
          ? effectiveRequestedQuantity
            ? simulateWoodcuttingTarget(
                effectiveRequestedQuantity,
                hatchetBoost?.cutChanceBasisPoints ?? 10_000,
                activity.xp / activity.baseQuantity,
                timing.minMs,
                timing.maxMs,
                random,
                random(),
                random(),
                random(),
              )
            : simulateWoodcuttingAttempts(
                trip.quantity,
                hatchetBoost?.cutChanceBasisPoints ?? 10_000,
                activity.xp / activity.baseQuantity,
                timing.minMs,
                timing.maxMs,
                random,
                random(),
                random(),
                random(),
              )
          : null;
      const completesAt = new Date(
        now.getTime() + (woodcuttingOutcome?.durationMs ?? trip.durationMs),
      );
      await client.query(
        `INSERT INTO active_activities
           (id, character_id, activity_key, started_at, completes_at, notification_channel_id,
            quantity, actual_quantity, min_duration_ms, max_duration_ms, xp_award,
            fatigue_ended, formula_version, boost_snapshot, planned_attempts,
            executed_attempts, rng_audit, requested_quantity, target_reached)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          activityId,
          character.id,
          activity.key,
          now,
          completesAt,
          notificationChannelId,
          trip.quantity.toString(),
          woodcuttingOutcome?.actualLogs.toString() ?? null,
          woodcuttingOutcome?.minDurationMs ?? null,
          woodcuttingOutcome?.maxDurationMs ?? null,
          woodcuttingOutcome?.xpAward.toString() ?? null,
          woodcuttingOutcome?.fatigueEnded ?? null,
          woodcuttingOutcome?.formulaVersion ?? null,
          hatchetBoost ? JSON.stringify(hatchetBoost) : null,
          woodcuttingOutcome ? trip.quantity.toString() : null,
          woodcuttingOutcome?.executedAttempts.toString() ?? null,
          woodcuttingOutcome ? JSON.stringify(woodcuttingOutcome.rngAudit) : null,
          effectiveRequestedQuantity?.toString() ?? null,
          woodcuttingOutcome?.targetReached ?? null,
        ],
      );
      return {
        activity,
        completesAt,
        minDurationMs: woodcuttingOutcome?.minDurationMs ?? trip.minDurationMs,
        maxDurationMs: woodcuttingOutcome?.maxDurationMs ?? trip.maxDurationMs,
        durationMs: woodcuttingOutcome?.durationMs ?? trip.durationMs,
        quantity: trip.quantity,
        actualQuantity: woodcuttingOutcome?.actualLogs,
        hatchetBoost: hatchetBoost ?? undefined,
        requestedQuantity: effectiveRequestedQuantity,
        targetReached: woodcuttingOutcome?.targetReached,
        boosts: hatchetBoost
          ? [{ name: hatchetBoost.hatchetName, amount: hatchetBoost.successMultiplier }]
          : [],
      };
    });
  }

  public async getActiveActivity(discordUserId: string): Promise<ActiveActivity | null> {
    const character = await this.findCharacter(this.pool, discordUserId);
    if (!character) return null;
    const result = await this.pool.query<ActivityRow>(
      'SELECT id, character_id, activity_key, completes_at, quantity FROM active_activities WHERE character_id = $1',
      [character.id],
    );
    const row = result.rows[0];
    if (!row) return null;
    const activity = activities[row.activity_key];
    if (!activity) throw new Error('The active activity definition no longer exists.');
    return {
      activity,
      completesAt: row.completes_at,
      quantity: BigInt(row.quantity),
      boosts: [],
    };
  }

  public async cancelActivity(discordUserId: string): Promise<ActivityDefinition> {
    return withTransaction(this.pool, async (client) => {
      const character = await this.findCharacter(client, discordUserId, true);
      if (!character) throw new Error('Buy a minion first with /minion buy.');
      const result = await client.query<ActivityRow>(
        `DELETE FROM active_activities
         WHERE id = (
           SELECT id FROM active_activities WHERE character_id = $1 FOR UPDATE
         )
         RETURNING id, character_id, activity_key, started_at, completes_at,
                   notification_channel_id, quantity`,
        [character.id],
      );
      const row = result.rows[0];
      if (!row) throw new Error('Your minion does not have an activity to cancel.');
      const activity = activities[row.activity_key];
      if (!activity) throw new Error('The cancelled activity definition no longer exists.');
      const quantity = BigInt(row.quantity);
      for (const input of activity.inputs ?? []) {
        await this.addItem(
          client,
          character.id,
          input.itemKey,
          scaleReward(input.quantity, quantity, activity.baseQuantity),
        );
      }
      return activity;
    });
  }

  public async settleCompletedActivities(
    now = new Date(),
    limit = 100,
    random = Math.random,
  ): Promise<CompletedActivity[]> {
    return withTransaction(this.pool, async (client) => {
      const activeResult = await client.query<ActivityRow>(
        `SELECT a.id, a.character_id, a.activity_key, a.started_at, a.completes_at,
                a.notification_channel_id, a.quantity, a.actual_quantity, a.min_duration_ms,
                a.max_duration_ms, a.xp_award, a.fatigue_ended, a.formula_version,
                a.boost_snapshot, a.planned_attempts, a.executed_attempts, a.rng_audit,
                a.requested_quantity, a.target_reached,
                u.discord_user_id
         FROM active_activities a
         JOIN characters c ON c.id = a.character_id
         JOIN users u ON u.id = c.user_id
         WHERE a.completes_at <= $1
         ORDER BY a.completes_at
         LIMIT $2
         FOR UPDATE OF a SKIP LOCKED`,
        [now, limit],
      );
      const completed: CompletedActivity[] = [];
      for (const active of activeResult.rows) {
        const activity = activities[active.activity_key];
        if (!activity) throw new Error('The active activity definition no longer exists.');
        if (activity.isQuest) {
          const characterResult = await client.query<{ quest_points: number }>(
            'SELECT quest_points FROM characters WHERE id = $1 FOR UPDATE',
            [active.character_id],
          );
          const oldQuestPoints = characterResult.rows[0]?.quest_points ?? 0;
          const reward = calculateQuestPointReward(oldQuestPoints, random());
          const totalQuestPoints = reward.total;
          const questPointsAwarded = reward.awarded;
          await client.query('UPDATE characters SET quest_points = $1 WHERE id = $2', [
            totalQuestPoints,
            active.character_id,
          ]);
          await client.query('DELETE FROM active_activities WHERE id = $1', [active.id]);
          await client.query(
            `INSERT INTO economy_ledger (id, character_id, entry_type, idempotency_key, metadata)
             VALUES ($1, $2, 'quest_complete', $3, $4)`,
            [
              randomUUID(),
              active.character_id,
              `activity:${active.id}`,
              JSON.stringify({
                questPointsRolled: reward.rolled,
                questPointsAwarded,
                totalQuestPoints,
              }),
            ],
          );
          completed.push({
            activityId: active.id,
            discordUserId: active.discord_user_id ?? '',
            notificationChannelId: active.notification_channel_id,
            activity,
            oldLevel: 1,
            newLevel: 1,
            durationMs: active.completes_at.getTime() - active.started_at.getTime(),
            xp: 0n,
            rewards: [],
            quantity: 1n,
            questPointsAwarded,
            totalQuestPoints,
          });
          continue;
        }
        const skillResult = await client.query<SkillRow>(
          'SELECT skill_key, xp FROM character_skills WHERE character_id = $1 AND skill_key = $2 FOR UPDATE',
          [active.character_id, activity.skill],
        );
        const quantity = BigInt(active.actual_quantity ?? active.quantity);
        const baseQuantity = activity.baseQuantity;
        const awardedXp = active.xp_award
          ? BigInt(active.xp_award)
          : scaleReward(activity.xp, quantity, baseQuantity);
        const awardedRewards = activity.rewards.map((reward) => ({
          itemKey: reward.itemKey,
          quantity: scaleReward(reward.quantity, quantity, baseQuantity),
        }));
        const oldXp = BigInt(skillResult.rows[0]?.xp ?? '0');
        const oldLevel = levelForXp(oldXp);
        const newLevel = levelForXp(oldXp + awardedXp);
        await client.query(
          'UPDATE character_skills SET xp = xp + $1 WHERE character_id = $2 AND skill_key = $3',
          [awardedXp.toString(), active.character_id, activity.skill],
        );
        for (const reward of awardedRewards)
          if (reward.quantity > 0n)
            await this.addItem(client, active.character_id, reward.itemKey, reward.quantity);
        if (activity.skill === 'woodcutting') {
          const recordedDurationMs = Math.max(
            1,
            active.completes_at.getTime() - active.started_at.getTime(),
          );
          await client.query(
            `INSERT INTO woodcutting_trip_results
               (activity_id, character_id, activity_key, target_logs, actual_logs,
                min_duration_ms, max_duration_ms, started_at, completed_at, xp_award,
                fatigue_ended, formula_version, boost_snapshot, planned_attempts,
                executed_attempts, rng_audit, requested_quantity, target_reached)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
             ON CONFLICT (activity_id) DO NOTHING`,
            [
              active.id,
              active.character_id,
              activity.key,
              active.quantity,
              quantity.toString(),
              active.min_duration_ms ?? recordedDurationMs,
              active.max_duration_ms ?? recordedDurationMs,
              active.started_at,
              active.completes_at,
              awardedXp.toString(),
              active.fatigue_ended ?? false,
              active.formula_version ?? 'legacy',
              active.boost_snapshot ? JSON.stringify(active.boost_snapshot) : null,
              active.planned_attempts ?? active.quantity,
              active.executed_attempts ?? active.quantity,
              active.rng_audit ? JSON.stringify(active.rng_audit) : null,
              active.requested_quantity,
              active.target_reached,
            ],
          );
        }
        await client.query('DELETE FROM active_activities WHERE id = $1', [active.id]);
        await client.query(
          `INSERT INTO economy_ledger (id, character_id, entry_type, item_key, item_quantity, idempotency_key, metadata)
           VALUES ($1, $2, 'activity_complete', NULL, NULL, $3, $4)`,
          [
            randomUUID(),
            active.character_id,
            `activity:${active.id}`,
            JSON.stringify({
              activity: activity.key,
              xp: awardedXp.toString(),
              quantity: quantity.toString(),
            }),
          ],
        );
        completed.push({
          activityId: active.id,
          discordUserId: active.discord_user_id ?? '',
          notificationChannelId: active.notification_channel_id,
          activity,
          oldLevel,
          newLevel,
          durationMs: active.completes_at.getTime() - active.started_at.getTime(),
          xp: awardedXp,
          rewards: awardedRewards,
          quantity: BigInt(active.quantity),
          actualQuantity: quantity,
          fatigueEnded: active.fatigue_ended ?? false,
        });
      }
      return completed;
    });
  }

  public async sellItem(discordUserId: string, itemKey: string, quantity: bigint): Promise<bigint> {
    const item = items[itemKey];
    if (!item || item.sellPrice === undefined) throw new Error('That item cannot be sold.');
    const sellPrice = item.sellPrice;
    if (quantity <= 0n) throw new Error('Quantity must be positive.');
    return withTransaction(this.pool, async (client) => {
      const character = await this.findCharacter(client, discordUserId, true);
      if (!character) throw new Error('Buy a minion first with /minion buy.');
      const inventory = await client.query<InventoryRow>(
        'SELECT item_key, quantity FROM inventory_items WHERE character_id = $1 AND item_key = $2 FOR UPDATE',
        [character.id, itemKey],
      );
      const owned = BigInt(inventory.rows[0]?.quantity ?? '0');
      if (owned < quantity) throw new Error(`You only have ${owned.toString()} ${item.name}.`);
      const coinDelta = sellPrice * quantity;
      if (owned === quantity)
        await client.query(
          'DELETE FROM inventory_items WHERE character_id = $1 AND item_key = $2',
          [character.id, itemKey],
        );
      else
        await client.query(
          'UPDATE inventory_items SET quantity = quantity - $1 WHERE character_id = $2 AND item_key = $3',
          [quantity.toString(), character.id, itemKey],
        );
      await client.query(
        'UPDATE characters SET coins = coins + $1, updated_at = NOW() WHERE id = $2',
        [coinDelta.toString(), character.id],
      );
      await client.query(
        `INSERT INTO economy_ledger (id, character_id, entry_type, coin_delta, item_key, item_quantity, idempotency_key)
         VALUES ($1, $2, 'sell', $3, $4, $5, $6)`,
        [
          randomUUID(),
          character.id,
          coinDelta.toString(),
          itemKey,
          quantity.toString(),
          `sell:${randomUUID()}`,
        ],
      );
      return coinDelta;
    });
  }

  public async buyItem(discordUserId: string, itemKey: string, quantity: bigint): Promise<bigint> {
    const item = items[itemKey];
    if (!item?.buyPrice) throw new Error('That item is not sold by the general store.');
    const buyPrice = item.buyPrice;
    if (quantity <= 0n) throw new Error('Quantity must be positive.');
    return withTransaction(this.pool, async (client) => {
      const character = await this.findCharacter(client, discordUserId, true);
      if (!character) throw new Error('Buy a minion first with /minion buy.');
      const cost = buyPrice * quantity;
      if (BigInt(character.coins) < cost)
        throw new Error(`You need ${cost.toString()} coins, but only have ${character.coins}.`);
      await client.query(
        'UPDATE characters SET coins = coins - $1, updated_at = NOW() WHERE id = $2',
        [cost.toString(), character.id],
      );
      await this.addItem(client, character.id, itemKey, quantity);
      await client.query(
        `INSERT INTO economy_ledger
           (id, character_id, entry_type, coin_delta, item_key, item_quantity, idempotency_key)
         VALUES ($1, $2, 'buy', $3, $4, $5, $6)`,
        [
          randomUUID(),
          character.id,
          (-cost).toString(),
          itemKey,
          quantity.toString(),
          `buy:${randomUUID()}`,
        ],
      );
      return cost;
    });
  }

  public async adminSetSkillLevel(
    discordUserId: string,
    skillKey: SkillKey,
    level: number,
  ): Promise<void> {
    if (!skills.some((skill) => skill.key === skillKey))
      throw new Error('That skill does not exist.');
    const xp = xpForLevel(level);
    const character = await this.findCharacter(this.pool, discordUserId);
    if (!character) throw new Error('That user does not own a minion.');
    await this.pool.query(
      'UPDATE character_skills SET xp = $1 WHERE character_id = $2 AND skill_key = $3',
      [xp.toString(), character.id, skillKey],
    );
  }

  public async adminSetItem(
    discordUserId: string,
    itemKey: string,
    quantity: bigint,
  ): Promise<void> {
    if (!items[itemKey]) throw new Error('That item does not exist.');
    if (quantity < 0n) throw new Error('Item quantity cannot be negative.');
    const character = await this.findCharacter(this.pool, discordUserId);
    if (!character) throw new Error('That user does not own a minion.');
    if (quantity === 0n) {
      await this.pool.query(
        'DELETE FROM inventory_items WHERE character_id = $1 AND item_key = $2',
        [character.id, itemKey],
      );
      return;
    }
    await this.pool.query(
      `INSERT INTO inventory_items (character_id, item_key, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (character_id, item_key) DO UPDATE SET quantity = EXCLUDED.quantity`,
      [character.id, itemKey, quantity.toString()],
    );
  }

  public async adminSetCoins(discordUserId: string, coins: bigint): Promise<void> {
    if (coins < 0n) throw new Error('Coins cannot be negative.');
    const character = await this.findCharacter(this.pool, discordUserId);
    if (!character) throw new Error('That user does not own a minion.');
    await this.pool.query('UPDATE characters SET coins = $1, updated_at = NOW() WHERE id = $2', [
      coins.toString(),
      character.id,
    ]);
  }

  private async findCharacter(
    db: Queryable,
    discordUserId: string,
    lock = false,
  ): Promise<CharacterRow | null> {
    const result = await db.query<CharacterRow>(
      `SELECT c.id, c.name, c.coins, c.quest_points FROM characters c JOIN users u ON u.id = c.user_id WHERE u.discord_user_id = $1${lock ? ' FOR UPDATE OF c' : ''}`,
      [discordUserId],
    );
    return result.rows[0] ?? null;
  }

  private async getProfileByCharacterId(
    db: Queryable,
    characterId: string,
  ): Promise<CharacterProfile> {
    const character = await db.query<CharacterRow>(
      'SELECT id, name, coins, quest_points FROM characters WHERE id = $1',
      [characterId],
    );
    const row = character.rows[0];
    if (!row) throw new Error('Character not found.');
    const [skillRows, activeRows, historyRows, equipmentRows] = await Promise.all([
      db.query<SkillRow>('SELECT skill_key, xp FROM character_skills WHERE character_id = $1', [
        characterId,
      ]),
      db.query<ActivityRow>(
        `SELECT id, character_id, activity_key, started_at, completes_at,
                notification_channel_id, quantity, actual_quantity, min_duration_ms,
                max_duration_ms, xp_award, fatigue_ended, formula_version, boost_snapshot,
                planned_attempts, executed_attempts, rng_audit, requested_quantity, target_reached
         FROM active_activities
         WHERE character_id = $1 AND activity_key LIKE 'woodcutting_%'`,
        [characterId],
      ),
      db.query<WoodcuttingResultRow>(
        `SELECT activity_key, actual_logs, xp_award, fatigue_ended, completed_at
         FROM woodcutting_trip_results
         WHERE character_id = $1
         ORDER BY completed_at DESC
         LIMIT 5`,
        [characterId],
      ),
      db.query<{ item_key: string }>(
        `SELECT item_key FROM character_equipment
         WHERE character_id = $1 AND slot = 'hatchet'`,
        [characterId],
      ),
    ]);
    const xpBySkill = new Map(skillRows.rows.map((skill) => [skill.skill_key, BigInt(skill.xp)]));
    const active = activeRows.rows[0];
    return {
      id: row.id,
      name: row.name,
      coins: BigInt(row.coins),
      questPoints: row.quest_points,
      equippedHatchet: (() => {
        const key = equipmentRows.rows[0]?.item_key ?? 'bronze_hatchet';
        return { key, name: hatchetsByKey[key]?.name ?? 'Bronze hatchet' };
      })(),
      activeWoodcuttingTrip: active
        ? {
            activityName: activities[active.activity_key]?.name ?? active.activity_key,
            expectedLogs: BigInt(active.actual_quantity ?? '0'),
            completesAt: active.completes_at,
          }
        : null,
      recentWoodcuttingTrips: historyRows.rows.map((trip) => ({
        activityName: activities[trip.activity_key]?.name ?? trip.activity_key,
        actualLogs: BigInt(trip.actual_logs),
        xp: BigInt(trip.xp_award),
        fatigueEnded: trip.fatigue_ended,
        completedAt: trip.completed_at,
      })),
      skills: skills.map((skill) => {
        const xp = xpBySkill.get(skill.key) ?? 0n;
        return { ...skill, xp, level: levelForXp(xp) };
      }),
    };
  }

  private async addItem(
    db: Queryable,
    characterId: string,
    itemKey: string,
    quantity: bigint,
  ): Promise<void> {
    await db.query(
      `INSERT INTO inventory_items (character_id, item_key, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (character_id, item_key) DO UPDATE SET quantity = inventory_items.quantity + EXCLUDED.quantity`,
      [characterId, itemKey, quantity.toString()],
    );
  }
}
