export type LogLevel = 'debug'|'info'|'warn'|'error';
export type SecurityAction = 'log'|'timeout'|'kick'|'ban'|'lockdown';
export interface GuildSettings { guildId:string; prefix?:string; logChannelId?:string|null; modLogChannelId?:string|null; welcomeChannelId?:string|null; welcomeMessage?:string|null; automodEnabled:boolean; securityEnabled:boolean; levelingEnabled:boolean; economyEnabled:boolean; ticketsEnabled:boolean; starboardEnabled:boolean; starboardThreshold:number; aiEnabled:boolean; aiChannelId?:string|null; aiSystemPrompt?:string|null; locale:string; }
export interface DashboardGuild { id:string; name:string; icon:string|null; owner:boolean; permissions:string; memberCount?:number; }
export interface AuditEntry { guildId:string; actorId:string; action:string; targetId?:string|null; before?:unknown; after?:unknown; metadata?:Record<string,unknown>; }
