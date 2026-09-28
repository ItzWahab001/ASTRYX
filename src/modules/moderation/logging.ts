import { EmbedBuilder, type Guild } from "discord.js";
import { getGuildConfig } from "../../repositories/guildConfigRepository.js";
import { childLogger } from "../../utils/logger.js";

const log = childLogger("mod-logging");

export interface LogEventInput {
  type: "automod" | "manual" | "antinuke" | "antiraid";
  title: string;
  description: string;
  caseNumber?: number;
}

const COLORS: Record<LogEventInput["type"], number> = {
  automod: 0xf5a623,
  manual: 0x4a90d9,
  antinuke: 0xd0021b,
  antiraid: 0x9013fe,
};

/**
 * Routes an event to the guild's configured mod-log channel. Missing channel, missing bot
 * permission, or a deleted channel are all handled without throwing — logging must never take
 * down the caller (automod pipeline, escalation, anti-nuke response).
 */
export async function logModerationEvent(guild: Guild, event: LogEventInput): Promise<void> {
  const config = await getGuildConfig(guild.id);
  if (!config.modLogChannelId) return;

  const channel = await guild.channels.fetch(config.modLogChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    log.warn({ guildId: guild.id }, "mod log channel missing or not text-based");
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS[event.type])
    .setTitle(event.title)
    .setDescription(event.description)
    .setTimestamp();
  if (event.caseNumber !== undefined) embed.setFooter({ text: `Case #${event.caseNumber}` });

  await channel.send({ embeds: [embed] }).catch((err) => {
    log.error({ err, guildId: guild.id }, "failed to send mod log message (likely missing SendMessages perm)");
  });
}
