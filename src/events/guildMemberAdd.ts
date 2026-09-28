import type { Client } from "discord.js";
import { Events } from "discord.js";
import { evaluateJoin } from "../modules/antiRaid/joinGate.js";

export function registerGuildMemberAdd(client: Client) {
  client.on(Events.GuildMemberAdd, (member) => {
    void evaluateJoin(member);
  });
}
