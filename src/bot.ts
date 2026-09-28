import { Events } from "discord.js";
import { createClient } from "./core/client.js";
import { registerInteractionHandler } from "./core/commandRouter.js";
import { registerMessageCreate } from "./events/messageCreate.js";
import { registerGuildMemberAdd } from "./events/guildMemberAdd.js";
import { registerAuditLogEvents } from "./events/auditLogEvents.js";
import { registerGuildCreate } from "./events/guildCreate.js";
import { env } from "./config/env.js";
import { childLogger } from "./utils/logger.js";

const log = childLogger("bot");

const client = createClient();

registerInteractionHandler(client);
registerMessageCreate(client);
registerGuildMemberAdd(client);
registerAuditLogEvents(client);
registerGuildCreate(client);

client.once(Events.ClientReady, (readyClient) => {
  log.info({ tag: readyClient.user.tag, shard: readyClient.shard?.ids }, "Meridian is online");
});

client.on(Events.Error, (err) => log.error({ err }, "Discord client error"));

process.on("unhandledRejection", (reason) => {
  log.error({ reason }, "Unhandled promise rejection");
});

client.login(env.discordToken()).catch((err) => {
  log.error({ err }, "Failed to log in");
  process.exit(1);
});
