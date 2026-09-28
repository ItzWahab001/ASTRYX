import { withTransaction } from "../db/postgres.js";
import { query } from "../db/postgres.js";

export type CaseActionType = "warn" | "mute" | "kick" | "ban" | "unban" | "unmute";
export type CaseSource = "manual" | "automod" | "antinuke" | "antiraid";

export interface ModerationCase {
  id: number;
  guildId: string;
  caseNumber: number;
  targetId: string;
  moderatorId: string;
  actionType: CaseActionType;
  reason: string | null;
  source: CaseSource;
  createdAt: Date;
}

function fromRow(row: Record<string, unknown>): ModerationCase {
  return {
    id: Number(row.id),
    guildId: row.guild_id as string,
    caseNumber: row.case_number as number,
    targetId: row.target_id as string,
    moderatorId: row.moderator_id as string,
    actionType: row.action_type as CaseActionType,
    reason: (row.reason as string | null) ?? null,
    source: row.source as CaseSource,
    createdAt: row.created_at as Date,
  };
}

/**
 * Creates a case with a per-guild sequential case number, computed and inserted inside one
 * transaction so concurrent moderation actions in the same guild never collide on case_number.
 */
export async function createCase(input: {
  guildId: string;
  targetId: string;
  moderatorId: string;
  actionType: CaseActionType;
  reason?: string;
  source: CaseSource;
}): Promise<ModerationCase> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<{ next: number }>(
      `SELECT COALESCE(MAX(case_number), 0) + 1 AS next FROM moderation_cases WHERE guild_id = $1 FOR UPDATE`,
      [input.guildId],
    );
    const nextCaseNumber = rows[0]!.next;
    const inserted = await client.query(
      `INSERT INTO moderation_cases (guild_id, case_number, target_id, moderator_id, action_type, reason, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.guildId,
        nextCaseNumber,
        input.targetId,
        input.moderatorId,
        input.actionType,
        input.reason ?? null,
        input.source,
      ],
    );
    return fromRow(inserted.rows[0]!);
  });
}

export async function getCasesForUser(guildId: string, targetId: string): Promise<ModerationCase[]> {
  const rows = await query(
    `SELECT * FROM moderation_cases WHERE guild_id = $1 AND target_id = $2 ORDER BY case_number DESC LIMIT 25`,
    [guildId, targetId],
  );
  return rows.map(fromRow);
}

export async function getCase(guildId: string, caseNumber: number): Promise<ModerationCase | null> {
  const rows = await query(
    `SELECT * FROM moderation_cases WHERE guild_id = $1 AND case_number = $2`,
    [guildId, caseNumber],
  );
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function incrementInfractionCount(guildId: string, userId: string): Promise<number> {
  const rows = await query<{ count: number }>(
    `INSERT INTO user_infractions (guild_id, user_id, count, updated_at)
     VALUES ($1, $2, 1, now())
     ON CONFLICT (guild_id, user_id) DO UPDATE SET count = user_infractions.count + 1, updated_at = now()
     RETURNING count`,
    [guildId, userId],
  );
  return rows[0]!.count;
}

export async function getInfractionCount(guildId: string, userId: string): Promise<number> {
  const rows = await query<{ count: number }>(
    `SELECT count FROM user_infractions WHERE guild_id = $1 AND user_id = $2`,
    [guildId, userId],
  );
  return rows[0]?.count ?? 0;
}
