import type { Client } from "discord.js";
import { Events } from "discord.js";
import { runAutomod } from "../modules/moderation/automod/engine.js";

export function registerMessageCreate(client: Client) {
  client.on(Events.MessageCreate, (message) => {
    void runAutomod(message);
  });
}
