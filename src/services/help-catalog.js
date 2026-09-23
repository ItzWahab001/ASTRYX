const CATEGORY_ORDER = ['Moderation','AutoMod','Security','Tickets','Music','Economy','Leveling','Giveaways','AI','Configuration','Utility'];
const CATEGORY_RULES = {
  Moderation: new Set(['ban','kick','timeout','untimeout','warn','warnings','clear','slowmode','lock','unlock','softban','voice-mute','voice-unmute','modhistory','case','cases','modlogs']),
  AutoMod: new Set(['automod','automod-setup','automod-status','automod-rules','automod-enable','automod-disable','automod-edit','automod-delete','automod-exempt-role','automod-exempt-channel','automod-logs']),
  Security: new Set(['security','security-panel','antinuke','antiraid','security-logs','antinuke-lockdown','antinuke-threshold','antinuke-whitelist']),
  Tickets: new Set(['ticket-panel','ticket-setup','ticket-add','ticket-remove','ticket-rename','ticket-claim','ticket-close','ticket-reopen','ticket-archive','ticket-note','ticket-priority','ticket-lock','ticket-unlock','ticket-stats','ticket-history']),
  Music: new Set(['play','search','queue','queue-clear','queue-remove','skip','previous','pause','resume','stop','shuffle','loop','replay','seek','autoplay','history','volume','music-panel','247']),
  Economy: new Set(['balance','daily','work','pay','transactions']),
  Leveling: new Set(['rank','leaderboard','setxp']),
  Giveaways: new Set(['giveaway','giveaway-end','giveaway-reroll']),
  AI: new Set(['ai','ai-teacher']),
  Configuration: new Set(['settings','configure','welcome','autorole','verification-setup','verification-panel','custom-set','custom-delete','custom-list','reactionrole']),
};

function categoryFor(name) {
  for (const [category, names] of Object.entries(CATEGORY_RULES)) if (names.has(name)) return category;
  return 'Utility';
}

function flattenOptions(options, prefix = []) {
  const out = [];
  for (const option of options || []) {
    const type = option.type;
    // Discord ApplicationCommandOptionType.SubcommandGroup = 2, Subcommand = 1.
    if (type === 2) out.push(...flattenOptions(option.options, [...prefix, option.name]));
    else if (type === 1) out.push([...prefix, option.name].join(' '));
  }
  return out;
}

function commandToEntry(command) {
  const json = typeof command?.data?.toJSON === 'function' ? command.data.toJSON() : command?.data;
  if (!json?.name) return null;
  const subcommands = flattenOptions(json.options);
  return {name: json.name, description: json.description || 'No description provided.', subcommands, permission: permissionLabel(json.default_member_permissions)};
}

function permissionLabel(value) {
  if (value == null) return 'None';
  const n = BigInt(value);
  const flags = [[1n << 3n,'Administrator'],[1n << 5n,'Manage Server'],[1n << 28n,'Manage Roles'],[1n << 40n,'Moderate Members'],[1n << 2n,'Ban Members'],[1n << 1n,'Kick Members'],[1n << 4n,'Manage Channels']];
  const found = flags.filter(([bit]) => (n & bit) === bit).map(([,label]) => label);
  return found.length ? found.join(', ') : 'Restricted permission';
}

function buildHelpCatalog(commands) {
  const entries = [...commands.values()].map(commandToEntry).filter(Boolean);
  const byCategory = new Map(CATEGORY_ORDER.map(x => [x, []]));
  for (const entry of entries) byCategory.get(categoryFor(entry.name)).push(entry);
  for (const list of byCategory.values()) list.sort((a,b)=>a.name.localeCompare(b.name));
  return {entries, categories: Object.fromEntries([...byCategory].filter(([,items])=>items.length))};
}

module.exports = {CATEGORY_ORDER,categoryFor,flattenOptions,commandToEntry,buildHelpCatalog,permissionLabel};
