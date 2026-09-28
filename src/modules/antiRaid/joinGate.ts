import type { GuildMember } from "discord.js";
import { incrWithWindow } from "../../db/redis.js";
import { getGuildConfig } from "../../repositories/guildConfigRepository.js";
import { isWhitelisted } from "../../repositories/antiNukeRepository.js";
import { scoreJoin, looksGenerated, DEFAULT_HEAT_THRESHOLDS } from "./heatScoring.js";
import { logModerationEvent } from "../moderation/logging.js";
import { childLogger } from "../../utils/logger.js";
import { env } from "../../config/env.js";

const log = childLogger("join-gate");

/**
 * Wired to guildMemberAdd. Computes a heat score for the join and, above the "quarantine"
 * threshold, assigns the configured quarantine role (or kicks if none is configured) — the real
 * mitigating action, not just a log line.
 */
export async function evaluateJoin(member: GuildMember): Promise<void> {
  try {
    if (await isWhitelisted(member.guild.id, member.id)) return;

    const windowKey = `antiraid:joins:${member.guild.id}`;
    const joinsInWindow = await incrWithWindow(windowKey, env.antiRaid.windowSeconds);

    const result = scoreJoin(
      {
        accountAgeMs: Date.now() - member.user.createdTimestamp,
        hasAvatar: member.user.avatar !== null,
        recentJoinsInWindow: joinsInWindow,
        usernameLooksGenerated: looksGenerated(member.user.username),
      },
      { quarantine: env.antiRaid.heatThreshold, flag: DEFAULT_HEAT_THRESHOLDS.flag },
    );

    if (result.verdict === "allow") return;

    log.info({ guildId: member.guild.id, userId: member.id, result }, "anti-raid heat evaluation");

    const config = await getGuildConfig(member.guild.id);

    if (result.verdict === "quarantine") {
      const botMember = member.guild.members.me;
      if (config.quarantineRoleId && botMember?.permissions.has("ManageRoles")) {
        await member.roles.add(config.quarantineRoleId).catch((err) =>
          log.error({ err }, "failed to apply quarantine role"),
        );
      } else if (botMember?.permissions.has("KickMembers")) {
        await member.kick("Anti-raid: heat score exceeded quarantine threshold").catch((err) =>
          log.error({ err }, "failed to kick suspected raid join"),
        );
      }
    }

    await logModerationEvent(member.guild, {
      type: "antiraid",
      title: `Anti-raid ${result.verdict} — <@${member.id}>`,
      description: `Score ${result.score}/100. Reasons: ${result.reasons.join(", ") || "none"}`,
    });
  } catch (err) {
    log.error({ err, guildId: member.guild.id }, "join gate evaluation failed");
  }
}
