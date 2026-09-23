const DANGEROUS_ROLE_PERMISSIONS =
  (1n << 3n) | // Administrator
  (1n << 4n) | // ManageChannels
  (1n << 5n) | // ManageGuild
  (1n << 28n) | // ManageRoles
  (1n << 29n) | // ManageWebhooks
  (1n << 2n) | // BanMembers
  (1n << 1n) | // KickMembers
  (1n << 3n); // Administrator (explicit for readability)

function safeRolePermissions(value) {
  const permissions = BigInt(value || 0);
  return permissions & ~DANGEROUS_ROLE_PERMISSIONS;
}

function safeChannelOverwrites(overwrites, existingRoleIds, everyoneId) {
  const roles = new Set(existingRoleIds || []);
  return (overwrites || []).filter(o => {
    if (o.type === 0) return o.id === everyoneId || roles.has(o.id);
    return false;
  }).map(o => ({
    id: o.id,
    type: 0,
    allow: BigInt(o.allow || 0),
    deny: BigInt(o.deny || 0)
  }));
}

function clampRolePosition(snapshotPosition, botHighestPosition) {
  const max = Math.max(1, Number(botHighestPosition || 1) - 1);
  return Math.max(1, Math.min(Number(snapshotPosition || 1), max));
}

module.exports = { safeRolePermissions, safeChannelOverwrites, clampRolePosition };
