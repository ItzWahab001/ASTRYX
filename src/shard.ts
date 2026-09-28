import { ShardingManager } from "discord.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { env } from "./config/env.js";
import { childLogger } from "./utils/logger.js";

const log = childLogger("sharding-manager");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const manager = new ShardingManager(path.join(__dirname, "bot.js"), {
  token: env.discordToken(),
  totalShards: env.totalShards === "auto" ? "auto" : Number.parseInt(env.totalShards, 10),
});

manager.on("shardCreate", (shard) => {
  log.info({ shardId: shard.id }, "launching shard");
});

manager.spawn().catch((err) => {
  log.error({ err }, "failed to spawn shards");
  process.exit(1);
});
