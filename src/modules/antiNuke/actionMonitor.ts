import { AuditLogEvent, type Guild } from "discord.js";
import { incrWithWindow } from "../../db/redis.js";
import { isWhitelisted } from "../../repositories/antiNukeRepository.js";
import { quarantineActor } from "./quarantine.js";
import { childLogger } from "../../utils/logger.js";
import { env } from "../../config/env.js";

const log = childLogger("antinuke-monitor");

const MONITORED_EVENTS = new Set<AuditLogEvent>([
  AuditLogEvent.ChannelDelete,
  AuditLogEvent.RoleDelete,
  AuditLogEvent.MemberBanAdd,
  AuditLogEvent.WebhookCreate,
  AuditLogEvent.BotAdd,
]);

const TRIGGER_LABEL: Partial<Record<AuditLogEvent, string>> = {
  [AuditLogEvent.ChannelDelete]: "mass channel deletion",
  [AuditLogEvent.RoleDelete]: "mass role deletion",
  [AuditLogEvent.MemberBanAdd]: "mass member bans",
  [AuditLogEvent.WebhookCreate]: "mass webhook creation",
  [AuditLogEvent.BotAdd]: "rapid unauthorized bot additions",
};

/**
 * Wired to the guildAuditLogEntryCreate gateway event (the low-latency way to observe
 * admin-level destructive actions in real time, vs. polling channelDelete/roleDelete separately
 * and re-deriving the executor via a full audit-log fetch). Increments a per-actor, per-event-type
 * sliding-window counter in Redis; crossing the configured threshold triggers containment.
 */
export async function handleAuditLogEntry(
  guild: Guild,
  action: AuditLogEvent,
  executorId: string | null | undefined,
): Promise<void> {
  if (!executorId || !MONITORED_EVENTS.has(action)) return;
  if (executorId === guild.client.user?.id) return; // never quarantine Meridian itself.

  try {
    if (await isWhitelisted(guild.id, executorId)) return;

    const key = `antinuke:actions:${guild.id}:${executorId}:${action}`;
    const count = await incrWithWindow(key, env.antiNuke.windowSeconds);

    log.debug({ guildId: guild.id, executorId, action, count }, "audit log entry observed");

    if (count >= env.antiNuke.actionThreshold) {
      const triggerDetail = TRIGGER_LABEL[action] ?? `audit event ${action}`;
      await quarantineActor({
        guild,
        actorId: executorId,
        actionCount: count,
        windowSeconds: env.antiNuke.windowSeconds,
        triggerDetail,
      });
    }
  } catch (err) {
    log.error({ err, guildId: guild.id, executorId, action }, "anti-nuke monitor failed");
  }
}
