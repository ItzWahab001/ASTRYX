import { Client, GatewayIntentBits, Partials } from "discord.js";

/**
 * Intents are scoped to exactly what the safety-critical first tier needs: guild events for
 * anti-nuke/anti-raid, guild members for join gating, message content + moderation for AutoMod.
 * Additional intents (voice state, presence) get added when the Leveling/Engagement and
 * Music modules are built, not before — matches the audit rule against speculative surface area.
 */
export function createClient(): Client {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildModeration,
    ],
    partials: [Partials.GuildMember, Partials.Message],
  });
}
