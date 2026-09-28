import type { Client } from "discord.js";
import { Events } from "discord.js";
import { handleAuditLogEntry } from "../modules/antiNuke/actionMonitor.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("audit-log-events");

export function registerAuditLogEvents(client: Client) {
  // guildAuditLogEntryCreate fires in real time as entries are created — the correct low-latency
  // source for anti-nuke, vs. reconstructing intent from channelDelete/roleDelete alone.
  client.on(Events.GuildAuditLogEntryCreate, (entry, guild) => {
    handleAuditLogEntry(guild, entry.action, entry.executorId).catch((err) =>
      log.error({ err, guildId: guild.id }, "unhandled error dispatching audit log entry"),
    );
  });
}
