import { config as loadEnv } from "dotenv";

loadEnv();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  discordToken: () => required("DISCORD_TOKEN"),
  discordClientId: () => required("DISCORD_CLIENT_ID"),
  totalShards: process.env.TOTAL_SHARDS ?? "auto",
  databaseUrl: () => required("DATABASE_URL"),
  redisUrl: () => required("REDIS_URL"),
  logLevel: process.env.LOG_LEVEL ?? "info",
  nodeEnv: process.env.NODE_ENV ?? "development",
  antiNuke: {
    actionThreshold: optionalInt("ANTI_NUKE_ACTION_THRESHOLD", 3),
    windowSeconds: optionalInt("ANTI_NUKE_WINDOW_SECONDS", 10),
  },
  antiRaid: {
    heatThreshold: optionalInt("ANTI_RAID_HEAT_THRESHOLD", 70),
    windowSeconds: optionalInt("ANTI_RAID_WINDOW_SECONDS", 30),
  },
};
