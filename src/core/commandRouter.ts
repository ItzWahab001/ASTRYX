import { Collection, Events, type Client, type ChatInputCommandInteraction } from "discord.js";
import type { MeridianCommand } from "../types/index.js";
import {
  warnCommand,
  muteCommand,
  kickCommand,
  banCommand,
  unmuteCommand,
  unbanCommand,
  casesCommand,
  caseCommand,
} from "../commands/moderation/moderationCommands.js";
import { automodConfigCommand } from "../commands/config/automodConfig.js";
import { antinukeWhitelistCommand } from "../commands/config/antinukeConfig.js";
import { configViewCommand } from "../commands/config/viewConfig.js";
import { childLogger } from "../utils/logger.js";

const log = childLogger("command-router");

export const commands = new Collection<string, MeridianCommand>();

for (const command of [
  warnCommand,
  muteCommand,
  kickCommand,
  banCommand,
  unmuteCommand,
  unbanCommand,
  casesCommand,
  caseCommand,
  automodConfigCommand,
  antinukeWhitelistCommand,
  configViewCommand,
]) {
  commands.set(command.data.name, command);
}

export function registerInteractionHandler(client: Client) {
  client.on(Events.InteractionCreate, (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    void dispatch(interaction);
  });
}

async function dispatch(interaction: ChatInputCommandInteraction) {
  const command = commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    log.error({ err, command: interaction.commandName }, "command execution failed");
    const payload = { content: "Something went wrong running that command.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => undefined);
    } else {
      await interaction.reply(payload).catch(() => undefined);
    }
  }
}
