import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import { performManualAction, performUnban, listCases, getCaseByNumber } from "../../modules/moderation/caseManager.js";
import type { MeridianCommand } from "../../types/index.js";
import type { CaseActionType } from "../../repositories/caseRepository.js";

function buildActionCommand(name: string, description: string, actionType: CaseActionType): MeridianCommand {
  return {
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription(description)
      .addUserOption((opt) => opt.setName("target").setDescription("Member to act on").setRequired(true))
      .addStringOption((opt) => opt.setName("reason").setDescription("Reason").setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers) as SlashCommandBuilder,
    async execute(interaction: ChatInputCommandInteraction) {
      if (!interaction.guild || !interaction.member) {
        await interaction.reply({ content: "This command only works in a server.", ephemeral: true });
        return;
      }
      const targetUser = interaction.options.getUser("target", true);
      const reason = interaction.options.getString("reason") ?? "No reason provided";

      const actor = await interaction.guild.members.fetch(interaction.user.id);
      const target = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!target) {
        await interaction.reply({ content: "That user isn't a member of this server.", ephemeral: true });
        return;
      }

      const result = await performManualAction({ actor, target, actionType, reason });
      if (result.ok) {
        await interaction.reply(`${actionType.toUpperCase()} applied to <@${target.id}> — case #${result.caseNumber}.`);
      } else {
        await interaction.reply({ content: `Could not ${actionType}: ${result.reason}`, ephemeral: true });
      }
    },
  };
}

export const warnCommand = buildActionCommand("warn", "Warn a member", "warn");
export const muteCommand = buildActionCommand("mute", "Timeout a member for 10 minutes", "mute");
export const kickCommand = buildActionCommand("kick", "Kick a member", "kick");
export const banCommand = buildActionCommand("ban", "Ban a member", "ban");
// unmute targets a current member (Discord timeouts only apply to members still in the guild),
// so it fits the same shape as warn/mute/kick/ban and reuses buildActionCommand.
export const unmuteCommand = buildActionCommand("unmute", "Remove a member's timeout", "unmute");

// unban is NOT built with buildActionCommand: its target has, by definition, already left the
// guild, so `guild.members.fetch(targetUser.id)` (which every other action command relies on to
// get a GuildMember for the role-hierarchy check) will always fail for a genuinely banned user.
// It goes through caseManager.performUnban, which checks only the actor's/bot's own permissions.
export const unbanCommand: MeridianCommand = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user")
    .addUserOption((opt) => opt.setName("target").setDescription("User to unban").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers) as SlashCommandBuilder,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.member) {
      await interaction.reply({ content: "This command only works in a server.", ephemeral: true });
      return;
    }
    const targetUser = interaction.options.getUser("target", true);
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    const actor = await interaction.guild.members.fetch(interaction.user.id);

    const result = await performUnban({ actor, targetId: targetUser.id, reason });
    if (result.ok) {
      await interaction.reply(`UNBAN applied to <@${targetUser.id}> — case #${result.caseNumber}.`);
    } else {
      await interaction.reply({ content: `Could not unban: ${result.reason}`, ephemeral: true });
    }
  },
};

export const casesCommand: MeridianCommand = {
  data: new SlashCommandBuilder()
    .setName("cases")
    .setDescription("List moderation case history for a member")
    .addUserOption((opt) => opt.setName("target").setDescription("Member").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers) as SlashCommandBuilder,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command only works in a server.", ephemeral: true });
      return;
    }
    const target = interaction.options.getUser("target", true);
    const cases = await listCases(interaction.guild.id, target.id);
    if (cases.length === 0) {
      await interaction.reply({ content: `No cases found for <@${target.id}>.`, ephemeral: true });
      return;
    }
    const lines = cases
      .slice(0, 10)
      .map((c) => `#${c.caseNumber} — **${c.actionType}** (${c.source}) — ${c.reason ?? "no reason"}`);
    await interaction.reply({ content: lines.join("\n"), ephemeral: true });
  },
};

export const caseCommand: MeridianCommand = {
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("Look up a single moderation case by its number")
    .addIntegerOption((opt) =>
      opt.setName("number").setDescription("Case number").setRequired(true).setMinValue(1),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers) as SlashCommandBuilder,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: "This command only works in a server.", ephemeral: true });
      return;
    }
    const caseNumber = interaction.options.getInteger("number", true);
    const found = await getCaseByNumber(interaction.guild.id, caseNumber);
    if (!found) {
      await interaction.reply({ content: `No case #${caseNumber} found in this server.`, ephemeral: true });
      return;
    }
    const lines = [
      `**Case #${found.caseNumber}** — ${found.actionType.toUpperCase()} (${found.source})`,
      `Target: <@${found.targetId}>`,
      `Moderator: <@${found.moderatorId}>`,
      `Reason: ${found.reason ?? "no reason"}`,
      `Created: ${found.createdAt.toISOString()}`,
    ];
    await interaction.reply({ content: lines.join("\n"), ephemeral: true });
  },
};
