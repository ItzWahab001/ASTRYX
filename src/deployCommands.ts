import { REST, Routes } from "discord.js";
import { commands } from "./core/commandRouter.js";
import { env } from "./config/env.js";
import { childLogger } from "./utils/logger.js";

const log = childLogger("deploy-commands");

async function main() {
  const rest = new REST().setToken(env.discordToken());
  const body = commands.map((c) => c.data.toJSON());
  await rest.put(Routes.applicationCommands(env.discordClientId()), { body });
  log.info({ count: body.length }, "Slash commands deployed globally");
}

main().catch((err) => {
  log.error({ err }, "Failed to deploy commands");
  process.exit(1);
});
