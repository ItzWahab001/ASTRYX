import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import { upsertRule } from "../../repositories/automodRuleRepository.js";
import { getGuildConfig } from "../../repositories/guildConfigRepository.js";
import { canConfigure } from "../../core/permissions.js";
import type { MeridianCommand } from "../../types/index.js";

export const automodConfigCommand: MeridianCommand = {
  data: new SlashCommandBuilder()
    .setName("config-automod")
    .setDescription("Configure an AutoMod rule")
    .addStringOption((opt) =>
      opt
        .setName("rule")
        .setDescription("Rule to configure")
        .setRequired(true)
        .addChoices(
          { name: "Word filter", value: "word_filter" },
          { name: "Link filter", value: "link_filter" },
          { name: "Mention spam", value: "mention_spam" },
          { name: "Message spam", value: "message_spam" },
        ),
    )
    .addBooleanOption((opt) => opt.setName("enabled").setDescription("Enable this rule").setRequired(true))
    .addStringOption((opt) =>
      opt.setName("config_json").setDescription('Rule config as JSON, e.g. {"maxMentions":5}').setRequired(false),
    )
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

    const ruleType = interaction.options.getString("rule", true) as
      | "word_filter"
      | "link_filter"
      | "mention_spam"
      | "message_spam";
    const enabled = interaction.options.getBoolean("enabled", true);
    const rawConfig = interaction.options.getString("config_json");

    let parsedConfig: Record<string, unknown> = {};
    if (rawConfig) {
      try {
        parsedConfig = JSON.parse(rawConfig);
      } catch {
        await interaction.reply({ content: "config_json must be valid JSON.", ephemeral: true });
        return;
      }
    }

    await upsertRule(interaction.guild.id, ruleType, enabled, parsedConfig);
    await interaction.reply(`AutoMod rule \`${ruleType}\` ${enabled ? "enabled" : "disabled"}.`);
  },
};
