const {db}=require('../database/db');
const {build}=require('./automod-config');
const logger=require('../core/logger');
function persist(guild,rule){
  db.prepare('INSERT OR REPLACE INTO automod_rules(guild_id,rule_id,name,type,enabled,config_json,created_at,updated_at) VALUES(?,?,?,?,?,?,COALESCE((SELECT created_at FROM automod_rules WHERE guild_id=? AND rule_id=?),?),?)').run(guild.id,rule.id,rule.name,String(rule.triggerType),rule.enabled?1:0,JSON.stringify(rule.toJSON()),guild.id,rule.id,Date.now(),Date.now());
}
async function create(guild,input){
  const payload=build(input);
  let rule=await guild.autoModerationRules.create(payload,'DYNEX AutoMod 3.0');
  try{persist(guild,rule)}catch(error){logger.error({err:error,guild:guild.id,rule:rule.id},'AutoMod persistence failed after create');try{await rule.delete('DYNEX rollback after persistence failure')}catch(rollbackError){logger.error({err:rollbackError,guild:guild.id,rule:rule.id},'AutoMod rollback failed')}throw new Error('Discord AutoMod rule was not persisted locally; creation was rolled back when possible.')}
  return rule;
}
function inferAction(rule){
  const type=rule.actions?.[0]?.type;
  if(type===2)return'timeout';
  if(type===1)return'alert';
  return'block';
}
async function edit(guild,id,input){
  const rule=await guild.autoModerationRules.fetch(id);
  if(!rule)throw new Error('AutoMod rule not found.');
  const payload={...input, name:input.name||rule.name, action:input.action||inferAction(rule)};
  if(input.type==='keyword'&&!input.keywords?.length)payload.keywords=rule.triggerMetadata?.keywordFilter||[];
  if(input.type==='regex'&&!input.patterns?.length)payload.patterns=rule.triggerMetadata?.regexPatterns||[];
  if(input.type==='mention_spam'&&input.mentionLimit==null)payload.mentionLimit=rule.triggerMetadata?.mentionTotalLimit||5;
  if(input.exemptRoles==null)payload.exemptRoles=rule.exemptRoles;
  if(input.exemptChannels==null)payload.exemptChannels=rule.exemptChannels;
  const updated=await rule.edit(build(payload),'DYNEX AutoMod 3.0 edit');
  try{persist(guild,updated)}catch(error){logger.error({err:error,guild:guild.id,rule:id},'AutoMod persistence failed after edit');throw new Error('Discord AutoMod rule was updated, but local persistence failed; refresh the rule state before further edits.')}
  return updated;
}
async function setEnabled(guild,id,enabled){const rule=await guild.autoModerationRules.fetch(id);if(!rule)throw new Error('AutoMod rule not found.');const previous=!!rule.enabled;const updated=await rule.edit({enabled:!!enabled},`DYNEX AutoMod ${enabled?'enable':'disable'}`);try{persist(guild,updated)}catch(error){logger.error({err:error,guild:guild.id,rule:id},'AutoMod persistence failed after enable state change');try{await updated.edit({enabled:previous},'DYNEX rollback after persistence failure')}catch(rollbackError){logger.error({err:rollbackError,guild:guild.id,rule:id},'AutoMod enable rollback failed')}throw new Error('Discord AutoMod state was not persisted locally; the change was rolled back when possible.')}return updated}
async function remove(guild,id){const rule=await guild.autoModerationRules.fetch(id);if(!rule)throw new Error('AutoMod rule not found.');await rule.delete('DYNEX AutoMod delete');db.prepare('DELETE FROM automod_rules WHERE guild_id=? AND rule_id=?').run(guild.id,id)}
function list(guildId){return db.prepare('SELECT * FROM automod_rules WHERE guild_id=? ORDER BY name').all(guildId)}
async function exempt(guild,id,{roleId,channelId}){const rule=await guild.autoModerationRules.fetch(id);if(!rule)throw new Error('AutoMod rule not found.');const previous={exemptRoles:[...rule.exemptRoles],exemptChannels:[...rule.exemptChannels]};const roles=roleId?[...new Set([...rule.exemptRoles,roleId])]:rule.exemptRoles;const channels=channelId?[...new Set([...rule.exemptChannels,channelId])]:rule.exemptChannels;const updated=await rule.edit({exemptRoles:roles,exemptChannels:channels},'DYNEX AutoMod exemption');try{persist(guild,updated)}catch(error){logger.error({err:error,guild:guild.id,rule:id},'AutoMod persistence failed after exemption change');try{await updated.edit(previous,'DYNEX rollback after persistence failure')}catch(rollbackError){logger.error({err:rollbackError,guild:guild.id,rule:id},'AutoMod exemption rollback failed')}throw new Error('Discord AutoMod exemption was not persisted locally; the change was rolled back when possible.')}return updated}
function logAction(guildId,data){if(!guildId)return;try{db.prepare('INSERT INTO automod_logs(guild_id,rule_id,user_id,channel_id,action_type,content_hash,details,created_at) VALUES(?,?,?,?,?,?,?,?)').run(guildId,data.ruleId||null,data.userId||null,data.channelId||null,data.actionType||null,data.contentHash||null,JSON.stringify(data.details||{}),Date.now())}catch(error){logger.error({err:error,guild:guildId},'AutoMod action log failed')}}
function logs(guildId,limit=20){return db.prepare('SELECT * FROM automod_logs WHERE guild_id=? ORDER BY id DESC LIMIT ?').all(guildId,Math.min(Math.max(limit,1),50))}
module.exports={create,edit,setEnabled,remove,list,exempt,logAction,logs};
