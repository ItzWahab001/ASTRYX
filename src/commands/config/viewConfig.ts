import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import { getGuildConfig } from "../../repositories/guildConfigRepository.js";
import { getRulesForGuild } from "../../repositories/automodRuleRepository.js";
import { getWhitelist } from "../../repositories/antiNukeRepository.js";
import { canConfigure } from "../../core/permissions.js";
import { env } from "../../config/env.js";
import type { MeridianCommand } from "../../types/index.js";

/**
 * Read-only view of everything the config-* commands can set, so admins don't have to read
 * Postgres directly to see their own settings (README gap #4). Same permission gate
 * (canConfigure) as the commands that write these settings.
 */
export const configViewCommand: MeridianCommand = {
  data: new SlashCommandBuilder()
    .setName("config-view")
    .setDescription("View Meridian's current AutoMod, anti-raid and anti-nuke configuration for this server")
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

    const [rules, whitelist] = await Promise.all([
      getRulesForGuild(interaction.guild.id),
      getWhitelist(interaction.guild.id),
    ]);

    const ruleLines =
      rules.length === 0
        ? ["_No AutoMod rules configured yet — use `/config-automod`._"]
        : rules.map((r) => `**${r.ruleType}** — ${r.enabled ? "enabled" : "disabled"} — \`${JSON.stringify(r.config)}\``);

    const embed = new EmbedBuilder()
      .setTitle(`Meridian configuration — ${interaction.guild.name}`)
      .setColor(0x4a90d9)
      .addFields(
        {
          name: "General",
          value: [
            `Mod log channel: ${guildConfig.modLogChannelId ? `<#${guildConfig.modLogChannelId}>` : "_not set_"}`,
            `Join log channel: ${guildConfig.joinLogChannelId ? `<#${guildConfig.joinLogChannelId}>` : "_not set_"}`,
            `Quarantine role: ${guildConfig.quarantineRoleId ? `<@&${guildConfig.quarantineRoleId}>` : "_not set (raid joins are kicked instead)_"}`,
            `Admin roles: ${
              guildConfig.adminRoleIds.length > 0 ? guildConfig.adminRoleIds.map((id) => `<@&${id}>`).join(", ") : "_none configured (Manage Server only)_"
            }`,
          ].join("\n"),
        },
        {
          name: "Escalation chain",
          value: `${guildConfig.escalationChain.join(" → ")} (every ${guildConfig.escalationThreshold} infraction${guildConfig.escalationThreshold === 1 ? "" : "s"} steps up)`,
        },
        { name: "AutoMod rules", value: ruleLines.join("\n") },
        {
          name: "Anti-nuke",
          value: [
            `Threshold: ${env.antiNuke.actionThreshold} monitored actions within ${env.antiNuke.windowSeconds}s triggers containment`,
            `Whitelist: ${whitelist.length === 0 ? "_empty_" : whitelist.map((id) => `<@${id}>`).join(", ")}`,
          ].join("\n"),
        },
        {
          name: "Anti-raid",
          value: `Heat score ≥ ${env.antiRaid.heatThreshold} quarantines a join; window ${env.antiRaid.windowSeconds}s`,
        },
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
