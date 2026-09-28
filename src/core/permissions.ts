import { GuildMember, PermissionFlagsBits } from "discord.js";
import type { GuildConfig } from "../repositories/guildConfigRepository.js";

export interface PermissionDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * "Who can configure the bot" — Discord ManageGuild permission OR an explicitly configured
 * admin role. Kept separate from actionPermissionCheck by design (see architecture doc,
 * "unified permissions model: who configures vs. who is acted upon").
 */
export function canConfigure(member: GuildMember, config: GuildConfig): PermissionDecision {
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return { allowed: true };
  }
  const hasAdminRole = member.roles.cache.some((role) => config.adminRoleIds.includes(role.id));
  if (hasAdminRole) return { allowed: true };
  return { allowed: false, reason: "Requires Manage Server or a configured admin role." };
}

/**
 * "Who can be acted upon" — role-hierarchy-aware check for moderation actions (warn/mute/kick/ban).
 * Covers both: (1) the acting moderator must outrank the target, and (2) the bot itself must
 * outrank the target, or the Discord API call will fail regardless of what we decide here.
 */
export function canModerate(
  actor: GuildMember,
  target: GuildMember,
  botMember: GuildMember,
  requiredPermission: bigint,
): PermissionDecision {
  if (target.id === actor.guild.ownerId) {
    return { allowed: false, reason: "Cannot moderate the server owner." };
  }
  if (!actor.permissions.has(requiredPermission) && actor.id !== actor.guild.ownerId) {
    return { allowed: false, reason: "You lack the required Discord permission for this action." };
  }
  if (actor.id !== actor.guild.ownerId && actor.roles.highest.position <= target.roles.highest.position) {
    return { allowed: false, reason: "Your highest role must be above the target's highest role." };
  }
  if (!botMember.permissions.has(requiredPermission)) {
    return { allowed: false, reason: "Meridian lacks the required Discord permission for this action." };
  }
  if (botMember.roles.highest.position <= target.roles.highest.position) {
    return {
      allowed: false,
      reason: "Meridian's role must be above the target's highest role — move Meridian's role up.",
    };
  }
  return { allowed: true };
}

/** Bot-must-outrank-managed-roles check, surfaced at setup time per Wick's guided-setup pattern. */
export function botOutranksManagedRoles(botMember: GuildMember, managedRoleIds: string[]): PermissionDecision {
  const unreachable = managedRoleIds.filter((roleId) => {
    const role = botMember.guild.roles.cache.get(roleId);
    return role && role.position >= botMember.roles.highest.position;
  });
  if (unreachable.length > 0) {
    return {
      allowed: false,
      reason: `Meridian's role is below ${unreachable.length} managed role(s) — it cannot act on members holding them. Move Meridian's role higher.`,
    };
  }
  return { allowed: true };
}
