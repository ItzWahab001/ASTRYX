import type { Guild, GuildMember } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { createCase, getCase, getCasesForUser, type CaseActionType } from "../../repositories/caseRepository.js";
import { canModerate } from "../../core/permissions.js";
import { logModerationEvent } from "./logging.js";
import { childLogger } from "../../utils/logger.js";

const log = childLogger("case-manager");

const REQUIRED_PERMISSION: Record<CaseActionType, bigint> = {
  warn: PermissionFlagsBits.ModerateMembers,
  mute: PermissionFlagsBits.ModerateMembers,
  kick: PermissionFlagsBits.KickMembers,
  ban: PermissionFlagsBits.BanMembers,
  unmute: PermissionFlagsBits.ModerateMembers,
  unban: PermissionFlagsBits.BanMembers,
};

/**
 * Manual moderation actions (slash commands) route through here so every action — manual or
 * automated — shares one code path for permission checks, the real Discord API call, and case
 * persistence.
 */
export async function performManualAction(input: {
  actor: GuildMember;
  target: GuildMember;
  actionType: CaseActionType;
  reason: string;
}): Promise<{ ok: true; caseNumber: number } | { ok: false; reason: string }> {
  const { actor, target, actionType, reason } = input;
  const guild: Guild = actor.guild;
  const botMember = guild.members.me;
  if (!botMember) return { ok: false, reason: "Bot member not resolvable in this guild." };

  const decision = canModerate(actor, target, botMember, REQUIRED_PERMISSION[actionType]);
  if (!decision.allowed) return { ok: false, reason: decision.reason ?? "Not permitted." };

  try {
    if (actionType === "mute") await target.timeout(10 * 60 * 1000, reason);
    else if (actionType === "kick") await target.kick(reason);
    else if (actionType === "ban") await guild.members.ban(target.id, { reason });
    else if (actionType === "unmute") await target.timeout(null, reason);
    else if (actionType === "unban") await guild.members.unban(target.id, reason);
    // "warn" has no Discord API call — it's a logged case only.
  } catch (err) {
    log.error({ err, guildId: guild.id, targetId: target.id, actionType }, "manual moderation action failed");
    return { ok: false, reason: "Discord API call failed (permissions, rate limit, or outage)." };
  }

  const created = await createCase({
    guildId: guild.id,
    targetId: target.id,
    moderatorId: actor.id,
    actionType,
    reason,
    source: "manual",
  });

  await logModerationEvent(guild, {
    type: "manual",
    title: `${actionType.toUpperCase()} — case #${created.caseNumber}`,
    description: `<@${target.id}> by <@${actor.id}>\nReason: ${reason}`,
    caseNumber: created.caseNumber,
  });

  return { ok: true, caseNumber: created.caseNumber };
}

export async function listCases(guildId: string, userId: string) {
  return getCasesForUser(guildId, userId);
}

export async function getCaseByNumber(guildId: string, caseNumber: number) {
  return getCase(guildId, caseNumber);
}

/**
 * Unban is handled separately from performManualAction because its target is, by definition,
 * not a current guild member — role-hierarchy comparison against the target is meaningless (and
 * guild.members.fetch would simply fail), so this checks only the actor's and bot's own
 * permissions before calling the real unban API and persisting the case.
 */
export async function performUnban(input: {
  actor: GuildMember;
  targetId: string;
  reason: string;
}): Promise<{ ok: true; caseNumber: number } | { ok: false; reason: string }> {
  const { actor, targetId, reason } = input;
  const guild: Guild = actor.guild;
  const botMember = guild.members.me;
  if (!botMember) return { ok: false, reason: "Bot member not resolvable in this guild." };

  if (!actor.permissions.has(PermissionFlagsBits.BanMembers) && actor.id !== guild.ownerId) {
    return { ok: false, reason: "You lack the required Discord permission for this action." };
  }
  if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
    return { ok: false, reason: "Meridian lacks the required Discord permission for this action." };
  }

  try {
    await guild.members.unban(targetId, reason);
  } catch (err) {
    log.error({ err, guildId: guild.id, targetId }, "unban failed");
    return { ok: false, reason: "Discord API call failed (user may not be banned, or a rate limit/outage occurred)." };
  }

  const created = await createCase({
    guildId: guild.id,
    targetId,
    moderatorId: actor.id,
    actionType: "unban",
    reason,
    source: "manual",
  });

  await logModerationEvent(guild, {
    type: "manual",
    title: `UNBAN — case #${created.caseNumber}`,
    description: `<@${targetId}> by <@${actor.id}>\nReason: ${reason}`,
    caseNumber: created.caseNumber,
  });

  return { ok: true, caseNumber: created.caseNumber };
}
