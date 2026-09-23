const config=require('../config');
const fs=require('fs');
const path=require('path');

if(process.env.DYNEX_INTEGRATION!=='1'){
  console.error('Refusing live Discord checks. Set DYNEX_INTEGRATION=1 explicitly.');
  process.exit(2);
}

const base='https://discord.com/api/v10';
const headers={Authorization:`Bot ${config.DISCORD_TOKEN}`};
async function get(path){
  const r=await fetch(base+path,{headers});
  let body=null;try{body=await r.json()}catch(error){body={parseError:error.message}}
  if(!r.ok)throw new Error(`${r.status} ${path}: ${body?.message||'Discord API error'}`);
  return body;
}
async function main(){
  const me=await get('/users/@me');
  const app=await get(`/applications/${config.DISCORD_CLIENT_ID}`);
  const guilds=await get('/users/@me/guilds').catch(()=>null);
  const commands=await get(`/applications/${config.DISCORD_CLIENT_ID}/commands`);
  const localNames=new Set();
  for(const file of fs.readdirSync(path.join(__dirname,'../commands')).filter(x=>x.endsWith('.js')&&!x.startsWith('_'))){const source=fs.readFileSync(path.join(__dirname,'../commands',file),'utf8');const m=source.match(/\.setName\(['\"]([^'\"]+)['\"]\)/);if(m)localNames.add(m[1])}
  const remoteNames=new Set(commands.map(x=>x.name));
  const missing=[...localNames].filter(x=>!remoteNames.has(x));
  const stale=[...remoteNames].filter(x=>!localNames.has(x));
  console.log(JSON.stringify({ok:true,bot:{id:me.id,username:me.username},application:{id:app.id,name:app.name},globalCommands:commands.length,localCommands:localNames.size,commandRegistration:{missing,stale,match:missing.length===0&&stale.length===0}},null,2));
  if(process.env.DYNEX_GUILD_ID){
    const guild=await get(`/guilds/${process.env.DYNEX_GUILD_ID}?with_counts=true`);
    const rules=await get(`/guilds/${guild.id}/auto-moderation/rules`);
    const audit=await get(`/guilds/${guild.id}/audit-logs?limit=1`);
    console.log(JSON.stringify({guild:{id:guild.id,name:guild.name,memberCount:guild.approximate_member_count??guild.member_count??null},automodRules:rules.length,auditLogReadable:Array.isArray(audit.audit_log_entries)},null,2));
  }
}
main().catch(error=>{console.error(`Discord integration check failed: ${error.message}`);process.exit(1)});
