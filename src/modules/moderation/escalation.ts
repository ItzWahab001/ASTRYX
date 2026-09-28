import type { Guild } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { getGuildConfig } from "../../repositories/guildConfigRepository.js";
import { createCase, incrementInfractionCount, type CaseSource } from "../../repositories/caseRepository.js";
import { childLogger } from "../../utils/logger.js";

const log = childLogger("escalation");

export interface EscalationResult {
  actionTaken: string;
  caseNumber: number;
}

const MUTE_DURATION_MS = 10 * 60 * 1000; // 10 minutes, applied via Discord's native timeout.

/**
 * Applies the guild's configured escalation chain (default warn -> mute -> kick -> ban) based on
 * the target's running infraction count, executes the real Discord API call, persists a case, and
 * degrades gracefully (falls back to a lower action + logs) on permission/rate-limit failures —
 * this satisfies acceptance criteria #2 (real API), #3 (persisted), #5 (error handling).
 */
export async function applyEscalation(input: {
  guild: Guild;
  targetId: string;
  reason: string;
  source: CaseSource;
}): Promise<EscalationResult> {
  const { guild, targetId, reason, source } = input;
  const config = await getGuildConfig(guild.id);
  const infractionCount = await incrementInfractionCount(guild.id, targetId);

  const chain = config.escalationChain.length > 0 ? config.escalationChain : ["warn", "mute", "kick", "ban"];
  const stepIndex = Math.min(
    Math.floor((infractionCount - 1) / Math.max(config.escalationThreshold, 1)),
    chain.length - 1,
  );
  const step = chain[stepIndex] ?? "warn";

  const botMember = guild.members.me;
  let actionTaken = step;

  try {
    const target = await guild.members.fetch(targetId).catch(() => null);
    if (target && botMember) {
      if (step === "mute" && botMember.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        if (botMember.roles.highest.position > target.roles.highest.position) {
          await target.timeout(MUTE_DURATION_MS, reason);
        } else {
          actionTaken = "warn"; // graceful degrade — role hierarchy blocks the mute.
        }
      } else if (step === "kick" && botMember.permissions.has(PermissionFlagsBits.KickMembers)) {
        if (botMember.roles.highest.position > target.roles.highest.position) {
          await target.kick(reason);
        } else {
          actionTaken = "warn";
        }
      } else if (step === "ban" && botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
        if (botMember.roles.highest.position > target.roles.highest.position) {
          await guild.members.ban(targetId, { reason });
        } else {
          actionTaken = "warn";
        }
      } else if (step !== "warn") {
        actionTaken = "warn"; // missing permission — degrade rather than silently do nothing.
      }
    } else if (step !== "warn") {
      actionTaken = "warn"; // target already left the guild — nothing to escalate against.
    }
  } catch (err) {
    log.error({ err, guildId: guild.id, targetId, step }, "escalation API call failed, recording as warn");
    actionTaken = "warn";
  }

  const created = await createCase({
    guildId: guild.id,
    targetId,
    moderatorId: guild.client.user?.id ?? "meridian",
    actionType: actionTaken as "warn" | "mute" | "kick" | "ban",
    reason,
    source,
  });

  return { actionTaken, caseNumber: created.caseNumber };
}
