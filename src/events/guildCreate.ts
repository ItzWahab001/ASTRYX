import type { Client } from "discord.js";
import { Events } from "discord.js";
import { ensureGuildConfig } from "../repositories/guildConfigRepository.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("guild-create");

export function registerGuildCreate(client: Client) {
  client.on(Events.GuildCreate, (guild) => {
    ensureGuildConfig(guild.id).catch((err) =>
      log.error({ err, guildId: guild.id }, "failed to initialize guild config on join"),
    );
  });
}
