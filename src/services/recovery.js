const {ChannelType}=require('discord.js');
const {safeRolePermissions,safeChannelOverwrites,clampRolePosition}=require('./recovery-policy');
const {db}=require('../database/db');
const logger=require('../core/logger');
function saveChannel(channel){if(!channel?.guild)return;const overwrites=channel.permissionOverwrites?.cache?channel.permissionOverwrites.cache.map(o=>({id:o.id,type:o.type,allow:o.allow.bitfield.toString(),deny:o.deny.bitfield.toString()})):[];const snapshot={name:channel.name,type:channel.type,parentId:channel.parentId||null,topic:channel.topic||null,nsfw:!!channel.nsfw,rateLimitPerUser:channel.rateLimitPerUser||0,position:channel.rawPosition||0,overwrites};db.prepare('INSERT OR REPLACE INTO security_recovery_snapshots(guild_id,target_id,target_type,snapshot_json,created_at,restored_at) VALUES(?,?,?,?,?,NULL)').run(channel.guild.id,channel.id,'channel',JSON.stringify(snapshot),Date.now())}
function saveRole(role){if(!role?.guild)return;const snapshot={name:role.name,color:role.color,hoist:role.hoist,mentionable:role.mentionable,permissions:role.permissions.bitfield.toString(),position:role.position};db.prepare('INSERT OR REPLACE INTO security_recovery_snapshots(guild_id,target_id,target_type,snapshot_json,created_at,restored_at) VALUES(?,?,?,?,?,NULL)').run(role.guild.id,role.id,'role',JSON.stringify(snapshot),Date.now())}
const restoreLocks=new Set();
async function restore(guild,targetId){
  const lockKey=`${guild.id}:${targetId}`;
  if(restoreLocks.has(lockKey))return {restored:false,reason:'recovery_in_progress'};
  restoreLocks.add(lockKey);
  try{
    const row=db.prepare('SELECT * FROM security_recovery_snapshots WHERE guild_id=? AND target_id=? AND restored_at IS NULL ORDER BY id DESC LIMIT 1').get(guild.id,targetId);
    if(!row)return {restored:false,reason:'snapshot_missing'};
    let s;
    try{s=JSON.parse(row.snapshot_json)}catch{return {restored:false,reason:'invalid_snapshot'}}
    try{
      if(row.target_type==='role'){
        const existing=guild.roles.cache.find(r=>r.name===s.name);
        if(existing){
          const samePermissions=existing.permissions.bitfield.toString()===safeRolePermissions(s.permissions).toString();
          if(samePermissions){db.prepare('UPDATE security_recovery_snapshots SET restored_at=? WHERE id=?').run(Date.now(),row.id);return {restored:false,reason:'duplicate_guard',id:existing.id,type:'role'}}
          return {restored:false,reason:'name_conflict',id:existing.id,type:'role'};
        }
        const me=guild.members.me;
        if(!me?.permissions.has('ManageRoles'))return {restored:false,reason:'missing_manage_roles'};
        const permissions=safeRolePermissions(s.permissions);
        const r=await guild.roles.create({name:String(s.name).slice(0,100),color:s.color||0,hoist:!!s.hoist,mentionable:!!s.mentionable,permissions,reason:`DYNEX recovery ${targetId}`});
        const position=clampRolePosition(s.position,me.roles.highest.position);
        if(position>1&&r.position<position){try{await r.setPosition(position,'DYNEX recovery hierarchy restore')}catch(error){logger.warn({err:error,guild:guild.id,role:r.id},'role hierarchy recovery adjustment failed')}}
        db.prepare('UPDATE security_recovery_snapshots SET restored_at=? WHERE id=?').run(Date.now(),row.id);
        return {restored:true,id:r.id,type:'role',safePermissions:permissions.toString()};
      }
      if(row.target_type==='channel'){
        const existing=guild.channels.cache.find(c=>c.name===s.name&&c.type===s.type&&c.parentId===s.parentId);
        if(existing){db.prepare('UPDATE security_recovery_snapshots SET restored_at=? WHERE id=?').run(Date.now(),row.id);return {restored:false,reason:'duplicate_guard',id:existing.id,type:'channel'}}
        const everyoneId=guild.roles.everyone.id;
        const roleIds=guild.roles.cache.keys();
        const permissionOverwrites=safeChannelOverwrites(s.overwrites,[...roleIds],everyoneId);
        const allowedTypes=new Set([ChannelType.GuildText,ChannelType.GuildAnnouncement,ChannelType.GuildVoice,ChannelType.GuildStageVoice,ChannelType.GuildForum,ChannelType.GuildMedia,ChannelType.GuildCategory]);
        if(!allowedTypes.has(s.type))return {restored:false,reason:'unsupported_channel_type'};
        const parent=s.parentId&&guild.channels.cache.has(s.parentId)?s.parentId:undefined;
        const options={name:String(s.name).slice(0,100),type:s.type,parent,topic:s.topic||undefined,nsfw:!!s.nsfw,rateLimitPerUser:Number(s.rateLimitPerUser)||0,permissionOverwrites,reason:`DYNEX recovery ${targetId}`};
        const c=await guild.channels.create(options);
        db.prepare('UPDATE security_recovery_snapshots SET restored_at=? WHERE id=?').run(Date.now(),row.id);
        return {restored:true,id:c.id,type:'channel',overwritesRestored:permissionOverwrites.length};
      }
      return {restored:false,reason:'unsupported_type'};
    }catch(error){return {restored:false,reason:error.code||error.message}};
  }finally{restoreLocks.delete(lockKey)}
}
module.exports={saveChannel,saveRole,restore};
