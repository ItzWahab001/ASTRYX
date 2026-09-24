import type { ChatInputCommandInteraction, GuildMember, PermissionResolvable } from 'discord.js';
export function hasPermission(member:GuildMember, permission:PermissionResolvable){return member.permissions.has(permission);}
export function canAct(member:GuildMember,target:GuildMember){return target.id!==member.id && target.roles.highest.position < member.roles.highest.position;}
export function clamp(n:number,min:number,max:number){return Math.min(max,Math.max(min,n));}
export function levelForXp(xp:number){return Math.floor(Math.sqrt(xp/100))+1;}
export function xpForLevel(level:number){return Math.max(0,(level-1)**2*100);}
export function requireGuild(i:ChatInputCommandInteraction){if(!i.guild) throw new Error('This command can only be used in a server.'); return i.guild;}
