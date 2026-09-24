import {Client,Events,AutoModerationRuleTriggerType,AutoModerationRuleEventType,AutoModerationActionType} from 'discord.js';
import {getConfig,metric} from './store.js';

const RULE_PREFIX='DYNEX • ';

export function installAutomod(client:Client){
  client.on(Events.AutoModerationActionExecution,async e=>{
    await metric(e.guild.id,'automod.trigger',e.userId,e.channelId??undefined,1,{ruleId:e.ruleId,action:e.action.type,alertSystemMessageId:e.alertSystemMessageId??null}).catch(()=>null);
  });
}

export async function syncNativeAutoMod(g:any){
  const cfg=await getConfig(g.id,'automod',{enabled:true,keywords:[],mentions:5,exemptChannels:[],exemptRoles:[],spam:true});
  const existing=await g.autoModerationRules.fetch();
  const managed=existing.filter((r:any)=>r.name?.startsWith(RULE_PREFIX));
  for(const r of managed.values()) await r.delete('DYNEX AutoMod synchronization').catch(()=>null);
  if(!cfg.enabled) return;
  const common={eventType:AutoModerationRuleEventType.MessageSend,actions:[{type:AutoModerationActionType.BlockMessage}],enabled:true,exemptChannels:cfg.exemptChannels??[],exemptRoles:cfg.exemptRoles??[]};
  if(Array.isArray(cfg.keywords)&&cfg.keywords.length){
    await g.autoModerationRules.create({name:RULE_PREFIX+'Keywords',triggerType:AutoModerationRuleTriggerType.Keyword,triggerMetadata:{keywordFilter:cfg.keywords.slice(0,1000),allowList:[],regexPatterns:[]},...common});
  }
  if((cfg.mentions??0)>0){
    await g.autoModerationRules.create({name:RULE_PREFIX+'Mention Spam',triggerType:AutoModerationRuleTriggerType.MentionSpam,triggerMetadata:{mentionTotalLimit:Math.max(1,Math.min(50,cfg.mentions))},...common});
  }
  if(cfg.spam){
    await g.autoModerationRules.create({name:RULE_PREFIX+'Spam',triggerType:AutoModerationRuleTriggerType.Spam,triggerMetadata:{},...common});
  }
}
