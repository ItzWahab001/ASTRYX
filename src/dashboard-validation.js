function validateSettings(body,guild){
  const out={};
  const channelFields=new Set(['welcome_channel_id','goodbye_channel_id','mod_log_channel_id','ticket_category_id','ticket_transcript_channel_id','ticket_archive_category_id','verification_channel_id']);
  const roleFields=new Set(['ticket_staff_role_id','verification_role_id','unverified_role_id']);
  for(const [k,v] of Object.entries(body||{})){
    if(k==='_csrf')continue;
    if(k.endsWith('_id')){
      if(v&&!/^\d{17,20}$/.test(v))throw new Error(`Invalid ${k}.`);
      if(v&&guild){
        if(channelFields.has(k)){
          const channel=guild.channels.cache.get(v);
          if(!channel)throw new Error(`${k} must belong to this Discord server.`);
          if(k.includes('category')&&channel.type!==4)throw new Error(`${k} must reference a category.`);
          if(!k.includes('category')&&!channel.isTextBased())throw new Error(`${k} must reference a text-capable channel.`);
        }
        if(roleFields.has(k)&&!guild.roles.cache.has(v))throw new Error(`${k} must reference a role in this Discord server.`);
      }
      out[k]=v||null;
    }else if(['prefix','welcome_message','goodbye_message'].includes(k)){
      if(k==='prefix'&&!/^.{1,5}$/.test(v||''))throw new Error('Prefix must be 1-5 characters.');
      out[k]=String(v||'').slice(0,k==='prefix'?5:2000);
    }
  }
  for(const k of ['level_enabled','economy_enabled','ai_enabled','antiraid_enabled','antinuke_enabled','automod_enabled'])out[k]=Object.prototype.hasOwnProperty.call(body||{},k)?1:0;
  return out;
}
module.exports={validateSettings};
