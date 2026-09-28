import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import { addToWhitelist, removeFromWhitelist } from "../../repositories/antiNukeRepository.js";
import { getGuildConfig } from "../../repositories/guildConfigRepository.js";
import { canConfigure } from "../../core/permissions.js";
import type { MeridianCommand } from "../../types/index.js";

export const antinukeWhitelistCommand: MeridianCommand = {
  data: new SlashCommandBuilder()
    .setName("antinuke-whitelist")
    .setDescription("Add or remove a trusted admin from the anti-nuke whitelist")
    .addStringOption((opt) =>
      opt
        .setName("action")
        .setDescription("add or remove")
        .setRequired(true)
        .addChoices({ name: "add", value: "add" }, { name: "remove", value: "remove" }),
    )
    .addUserOption((opt) => opt.setName("user").setDescription("User to whitelist").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild) as SlashCommandBuilder,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({ content: "This command only works in a server.", ephemeral: true });
      return;
    }
    const guildConfig = await getGuildConfig(interaction.guild.id);
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const decision = canConfigure(member, guildConfig);
    if (!decision.allowed) {
      await interaction.reply({ content: decision.reason ?? "Not permitted.", ephemeral: true });
      return;
    }

    const action = interaction.options.getString("action", true);
    const target = interaction.options.getUser("user", true);

    if (action === "add") {
      await addToWhitelist(interaction.guild.id, target.id, interaction.user.id);
      await interaction.reply(`<@${target.id}> added to the anti-nuke whitelist.`);
    } else {
      await removeFromWhitelist(interaction.guild.id, target.id);
      await interaction.reply(`<@${target.id}> removed from the anti-nuke whitelist.`);
    }
  },
};
