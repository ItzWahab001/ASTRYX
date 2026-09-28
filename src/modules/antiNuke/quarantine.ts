import type { Guild } from "discord.js";
import { logModerationEvent } from "../moderation/logging.js";
import { recordIncident } from "../../repositories/antiNukeRepository.js";
import { childLogger } from "../../utils/logger.js";

const log = childLogger("antinuke-quarantine");

/**
 * The actual mitigation: strips every role from the offending actor (removing whatever
 * permission let them act) and, if they're a bot application, kicks it outright. This is the
 * real "auto-restore/reverse damage" action referenced in the research doc for Wick's anti-nuke
 * pattern — narrowed here to actor containment; structural restore is Xenon-style and lives in
 * the separate Backup+Restore module (out of scope for this pass).
 */
export async function quarantineActor(input: {
  guild: Guild;
  actorId: string;
  actionCount: number;
  windowSeconds: number;
  triggerDetail: string;
}): Promise<"quarantined" | "kicked" | "logged_only"> {
  const { guild, actorId, actionCount, windowSeconds, triggerDetail } = input;
  const botMember = guild.members.me;
  let response: "quarantined" | "kicked" | "logged_only" = "logged_only";

  try {
    const actor = await guild.members.fetch(actorId).catch(() => null);
    if (actor && botMember) {
      const canManageRoles = botMember.permissions.has("ManageRoles");
      const botOutranks = botMember.roles.highest.position > actor.roles.highest.position;

      if (actor.user.bot && botMember.permissions.has("KickMembers") && botOutranks) {
        await actor.kick(`Anti-nuke: ${triggerDetail}`);
        response = "kicked";
      } else if (canManageRoles && botOutranks) {
        const removable = actor.roles.cache.filter((r) => r.id !== guild.id && r.editable);
        await Promise.all(removable.map((r) => actor.roles.remove(r).catch(() => null)));
        response = "quarantined";
      } else {
        log.warn({ guildId: guild.id, actorId }, "cannot contain actor — insufficient role hierarchy/permissions");
      }
    }
  } catch (err) {
    log.error({ err, guildId: guild.id, actorId }, "quarantine action failed");
  }

  await recordIncident({
    guildId: guild.id,
    actorId,
    actionCount,
    windowSeconds,
    response,
    detail: { triggerDetail },
  });

  await logModerationEvent(guild, {
    type: "antinuke",
    title: `Anti-nuke: ${response} — <@${actorId}>`,
    description: `${actionCount} destructive actions within ${windowSeconds}s. Trigger: ${triggerDetail}`,
  });

  return response;
}
