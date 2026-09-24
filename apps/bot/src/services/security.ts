import {Client,Events,AuditLogEvent,PermissionFlagsBits,ChannelType,GuildMember} from 'discord.js';
import {db,securityTrusted,securityEvents} from '@dynex/database';
import {and,eq} from 'drizzle-orm'; import {nanoid} from 'nanoid';
import {getConfig,recordAudit} from './store.js';

const windows=new Map<string,{ts:number,count:number}>();
async function trusted(g:any,userId:string){
  const rows=await db.select().from(securityTrusted).where(and(eq(securityTrusted.guildId,g.id),eq(securityTrusted.subjectId,userId)));
  if(rows.some(r=>r.kind==='user')) return true;
  const m=await g.members.fetch(userId).catch(()=>null) as GuildMember|null;
  return !!m&&rows.some(r=>r.kind==='role'&&m.roles.cache.has(r.subjectId));
}
async function event(guildId:string,type:string,actorId:string|undefined,targetId:string|undefined,metadata:any){await db.insert(securityEvents).values({id:nanoid(),guildId,type,actorId,targetId,severity:'high',metadata}).catch(()=>null);}
async function lockdown(g:any){
  const me=g.members.me; if(!me?.permissions.has(PermissionFlagsBits.ManageChannels)) return false;
  const channels=g.channels.cache.filter((c:any)=>c.type===ChannelType.GuildText||c.type===ChannelType.GuildAnnouncement);
  for(const c of channels.values() as any[]) await c.permissionOverwrites.edit(g.roles.everyone,{SendMessages:false},{reason:'DYNEX emergency lockdown'}).catch(()=>null);
  await recordAudit(g.id,g.client.user.id,'security.lockdown').catch(()=>null); return true;
}
export function installSecurity(client:Client){
  client.on(Events.GuildMemberAdd,async m=>{
    const cfg=await getConfig(m.guild.id,'security',{enabled:true,joinBurst:8,windowSeconds:10,action:'lockdown',massThreshold:3}); if(!cfg.enabled)return;
    const key=`join:${m.guild.id}`,now=Date.now(),x=windows.get(key)??{ts:now,count:0}; if(now-x.ts>cfg.windowSeconds*1000){x.ts=now;x.count=0;} x.count++;windows.set(key,x);
    if(x.count>=cfg.joinBurst){await event(m.guild.id,'anti-raid',undefined,m.id,{count:x.count,windowSeconds:cfg.windowSeconds});if(cfg.action==='lockdown')await lockdown(m.guild);}
  });
  client.on(Events.GuildAuditLogEntryCreate,async entry=>{
    const g=client.guilds.cache.get(entry.guild.id); if(!g||!entry.executorId||await trusted(g,entry.executorId))return;
    const cfg=await getConfig(g.id,'security',{enabled:true,massThreshold:3,windowSeconds:15,action:'lockdown'}); if(!cfg.enabled)return;
    const dangerous=new Set([AuditLogEvent.MemberBanAdd,AuditLogEvent.MemberKick,AuditLogEvent.ChannelDelete,AuditLogEvent.ChannelCreate,AuditLogEvent.RoleDelete,AuditLogEvent.RoleCreate,AuditLogEvent.WebhookCreate,AuditLogEvent.BotAdd,AuditLogEvent.MemberRoleUpdate]); if(!dangerous.has(entry.action))return;
    const key=`audit:${g.id}:${entry.executorId}`,now=Date.now(),x=windows.get(key)??{ts:now,count:0}; if(now-x.ts>cfg.windowSeconds*1000){x.ts=now;x.count=0;}x.count++;windows.set(key,x);
    await event(g.id,'anti-nuke',entry.executorId,entry.targetId,{action:entry.action,count:x.count,threshold:cfg.massThreshold});
    if(x.count>=cfg.massThreshold&&cfg.action==='lockdown')await lockdown(g);
  });
}
