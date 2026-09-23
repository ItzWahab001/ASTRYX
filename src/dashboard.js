const express=require('express');const session=require('express-session');const SQLiteStore=require('connect-sqlite3')(session);const helmet=require('helmet');const rateLimit=require('express-rate-limit');const path=require('path');const crypto=require('crypto');const fs=require('fs');const config=require('./config');const repo=require('./repositories/guild');const {db}=require('./database/db');const {hasManageGuild,safeGuildId}=require('./dashboard-security');const music=require('./services/music');const security=require('./services/security');const automod=require('./services/automod');const metrics=require('./core/metrics');const logger=require('./core/logger');
const {DASHBOARD_SECTIONS}=require('./dashboard-sections');
async function refreshToken(req){if(!req.session.refreshToken)return null;const response=await fetch('https://discord.com/api/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:config.DISCORD_CLIENT_ID,client_secret:config.DISCORD_CLIENT_SECRET,grant_type:'refresh_token',refresh_token:req.session.refreshToken})});if(!response.ok)return null;const token=await response.json();req.session.accessToken=token.access_token;if(token.refresh_token)req.session.refreshToken=token.refresh_token;return token.access_token}
async function discordGuilds(req){if(!req.session.accessToken)return req.session.guilds||[];let token=req.session.accessToken;let response=await fetch('https://discord.com/api/users/@me/guilds',{headers:{Authorization:`Bearer ${token}`}});if(response.status===401){token=await refreshToken(req);if(!token)throw new Error('Discord session expired');response=await fetch('https://discord.com/api/users/@me/guilds',{headers:{Authorization:`Bearer ${token}`}})}if(!response.ok)throw new Error(`Discord guild lookup failed (${response.status})`);const guilds=await response.json();req.session.guilds=Array.isArray(guilds)?guilds:[];req.session.guildsAt=Date.now();return req.session.guilds}
async function manageableGuild(req,id){if(!safeGuildId(id))return false;try{const guilds=await discordGuilds(req);return hasManageGuild(guilds.find(x=>x.id===id))}catch(error){logger.warn({err:error,requestId:req.requestId,guild:id},'dashboard guild authorization refresh failed');return false}}
const {validateSettings}=require('./dashboard-validation');
function start(client){const app=express();fs.mkdirSync(path.join(__dirname,'../data'),{recursive:true});app.set('view engine','ejs');app.set('views',path.join(__dirname,'../web/views'));app.set('trust proxy',1);app.use(helmet({contentSecurityPolicy:false}));app.use(express.urlencoded({extended:false,limit:'32kb'}));app.use(express.json({limit:'32kb'}));app.use(express.static(path.join(__dirname,'../web/public'),{maxAge:'1h'}));app.use('/api/',rateLimit({windowMs:60000,max:60,standardHeaders:true,legacyHeaders:false}));app.use(rateLimit({windowMs:60000,max:180,standardHeaders:true,legacyHeaders:false}));app.use(session({store:new SQLiteStore({db:'sessions.sqlite',dir:path.join(__dirname,'../data')}),secret:config.SESSION_SECRET,resave:false,saveUninitialized:false,rolling:true,cookie:{httpOnly:true,sameSite:'lax',secure:config.NODE_ENV==='production',maxAge:7*86400000}}));app.use((req,res,next)=>{req.requestId=crypto.randomUUID();res.setHeader('X-Request-ID',req.requestId);if(!req.session.csrf)req.session.csrf=crypto.randomBytes(32).toString('hex');res.locals.csrf=req.session.csrf;next()});
app.get('/health',(req,res)=>{let dbMs=0;try{const t=Date.now();db.prepare('SELECT 1').get();dbMs=Date.now()-t}catch(error){return res.status(503).json({ok:false,error:'database_unavailable'})}const ready=typeof client.isReady==='function'?client.isReady():!!client.user;const ok=ready&&client.ffmpegAvailable!==false;res.status(ok?200:503).json({ok,discordReady:ready,ffmpegAvailable:client.ffmpegAvailable!==false,uptime:process.uptime(),guilds:client.guilds.cache.size,players:music.players.size,dbLatencyMs:dbMs,requestId:req.requestId})});
app.get('/metrics',(req,res)=>{const t=Date.now();db.prepare('SELECT 1').get();const dbMs=Date.now()-t;const tickets=db.prepare("SELECT COUNT(*) c FROM tickets WHERE status='open'").get().c;const incidents=db.prepare('SELECT COUNT(*) c FROM security_incidents WHERE created_at>?').get(Date.now()-86400000).c;const snap=metrics.snapshot();res.type('text').send([`dynex_uptime_seconds ${process.uptime()}`,`dynex_guilds ${client.guilds.cache.size}`,`dynex_members ${client.guilds.cache.reduce((n,g)=>n+(g.memberCount||0),0)}`,`dynex_music_players ${music.players.size}`,`dynex_active_tickets ${tickets}`,`dynex_security_incidents_24h ${incidents}`,`dynex_database_latency_ms ${dbMs}`,`dynex_command_errors ${snap.errors}`,`dynex_event_errors ${snap.eventErrors}`,`dynex_memory_rss_bytes ${process.memoryUsage().rss}`].join('\n')+'\n')});
app.get('/',(req,res)=>res.render('home',{user:req.session.user,config}));
app.get('/login',(req,res)=>{req.session.oauthState=crypto.randomBytes(32).toString('hex');const p=new URLSearchParams({client_id:config.DISCORD_CLIENT_ID,redirect_uri:config.DISCORD_REDIRECT_URI,response_type:'code',scope:'identify guilds',state:req.session.oauthState});res.redirect('https://discord.com/oauth2/authorize?'+p)});
app.get('/auth/callback',async(req,res)=>{if(!req.query.code||!req.query.state||req.query.state!==req.session.oauthState)return res.status(400).send('Invalid OAuth2 state.');delete req.session.oauthState;try{const response=await fetch('https://discord.com/api/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:config.DISCORD_CLIENT_ID,client_secret:config.DISCORD_CLIENT_SECRET,grant_type:'authorization_code',code:req.query.code,redirect_uri:config.DISCORD_REDIRECT_URI})});if(!response.ok)return res.status(401).send('OAuth2 token exchange failed.');const token=await response.json();if(!token.access_token)return res.status(401).send('OAuth2 authentication failed.');const h={Authorization:`Bearer ${token.access_token}`};const [ur,gr]=await Promise.all([fetch('https://discord.com/api/users/@me',{headers:h}),fetch('https://discord.com/api/users/@me/guilds',{headers:h})]);if(!ur.ok||!gr.ok)return res.status(502).send('OAuth2 identity lookup failed.');const [user,guilds]=await Promise.all([ur.json(),gr.json()]);await new Promise((resolve,reject)=>req.session.regenerate(error=>error?reject(error):resolve()));req.session.user=user;req.session.guilds=Array.isArray(guilds)?guilds:[];req.session.guildsAt=Date.now();req.session.accessToken=token.access_token;req.session.refreshToken=token.refresh_token;req.session.csrf=crypto.randomBytes(32).toString('hex');res.redirect('/dashboard')}catch(error){client.logger.error({err:error,requestId:req.requestId},'OAuth callback failed');res.status(502).send('OAuth2 provider request failed.')}});
function auth(req,res,next){if(!req.session.user)return res.redirect('/login');next()}
function csrf(req,res,next){const supplied=req.get('X-CSRF-Token')||req.body._csrf;if(!supplied||supplied!==req.session.csrf)return res.status(403).send('Invalid CSRF token.');next()}
app.get('/logout',(req,res)=>req.session.destroy(error=>{if(error)client.logger.warn({err:error,requestId:req.requestId},'session destroy failed');res.redirect('/')}));
app.get('/dashboard',auth,async(req,res)=>{try{const guilds=(await discordGuilds(req)).filter(g=>hasManageGuild(g)&&client.guilds.cache.has(g.id));res.render('dashboard',{user:req.session.user,guilds,client})}catch(error){res.status(502).send('Unable to refresh Discord server access.')}});
app.get('/dashboard/:guildId/:section?',auth,async(req,res)=>{const id=req.params.guildId;const activeSection=req.params.section||'overview';if(!safeGuildId(id))return res.status(400).send('Invalid guild ID.');if(!DASHBOARD_SECTIONS[activeSection])return res.status(404).send('Dashboard section not found.');if(!(await manageableGuild(req,id)))return res.status(403).send('Manage Server permission required.');const g=client.guilds.cache.get(id);if(!g)return res.status(404).send('DYNEX is not in this server.');repo.ensure(id);const p=music.peek(id);const tickets=db.prepare("SELECT status,COUNT(*) count FROM tickets WHERE guild_id=? GROUP BY status").all(id);res.render('server',{user:req.session.user,guild:g,settings:repo.get(id),csrf:req.session.csrf,security:security.getRaid(id),automod:automod.list(id),music:p?p.state():{current:null,queue:[],volume:80,loop:'off',autoplay:false},tickets,incidents:security.listIncidents(id,8),recentSecurity:security.recentEvents(id,8),activeSection,sectionMeta:DASHBOARD_SECTIONS[activeSection]})});
app.get('/api/guild/:guildId/resources',auth,async(req,res)=>{if(!(await manageableGuild(req,req.params.guildId)))return res.status(403).json({error:'forbidden'});const g=client.guilds.cache.get(req.params.guildId);if(!g)return res.status(404).json({error:'not found'});res.json({channels:g.channels.cache.filter(c=>c.isTextBased()||c.type===4).map(c=>({id:c.id,name:c.name,type:c.type,parentId:c.parentId})),roles:g.roles.cache.filter(r=>r.id!==g.id).sort((a,b)=>b.position-a.position).map(r=>({id:r.id,name:r.name,position:r.position})),categories:g.channels.cache.filter(c=>c.type===4).map(c=>({id:c.id,name:c.name}))})});
app.get('/api/guild/:guildId/overview',auth,async(req,res)=>{if(!(await manageableGuild(req,req.params.guildId)))return res.status(403).json({error:'forbidden'});const g=client.guilds.cache.get(req.params.guildId);if(!g)return res.status(404).json({error:'not found'});const p=music.players.get(g.id),t=Date.now();db.prepare('SELECT 1').get();const tickets=db.prepare("SELECT status,COUNT(*) count FROM tickets WHERE guild_id=? GROUP BY status").all(g.id);res.json({guild:{id:g.id,name:g.name,icon:g.iconURL(),memberCount:g.memberCount},bot:{latency:client.ws.ping,status:client.user?.presence?.status||'online',uptime:process.uptime()},database:{latencyMs:Date.now()-t},security:security.getRaid(g.id),automod:{enabled:repo.get(g.id).automod_enabled,rules:automod.list(g.id).length},music:{playing:!!p?.current,queue:p?.queue.length||0},tickets,recentModeration:db.prepare('SELECT * FROM moderation_cases WHERE guild_id=? ORDER BY id DESC LIMIT 8').all(g.id),recentSecurity:security.recentEvents(g.id,8)})});

function controlGuild(req,res,next){
  const id=req.params.guildId;
  if(!safeGuildId(id))return res.status(400).json({success:false,error:'Invalid guild ID.'});
  manageableGuild(req,id).then(ok=>{
    if(!ok)return res.status(403).json({success:false,error:'Manage Server permission required.'});
    const guild=client.guilds.cache.get(id);
    if(!guild)return res.status(404).json({success:false,error:'DYNEX is not in this server.'});
    req.controlGuild=guild;
    next();
  }).catch(error=>{
    logger.warn({err:error,requestId:req.requestId,guild:id},'dashboard control authorization failed');
    res.status(403).json({success:false,error:'Unable to verify Discord server access.'});
  });
}
function parseBoolean(value){if(typeof value==='boolean')return value;if(typeof value==='number')return value===1;if(typeof value==='string'){const v=value.trim().toLowerCase();if(v==='true'||v==='1'||v==='on'||v==='yes')return true;if(v==='false'||v==='0'||v==='off'||v==='no'||v==='')return false}return false}
function auditControl(req,guildId,action){
  try{db.prepare('INSERT INTO dashboard_audit(user_id,guild_id,action,ip,created_at) VALUES(?,?,?,?,?)').run(req.session.user.id,guildId,action,req.ip,Date.now())}
  catch(error){logger.warn({err:error,requestId:req.requestId,guild:guildId,action},'dashboard audit write failed')}
}

app.get('/api/guild/:guildId/controls',auth,controlGuild,(req,res)=>{
  const guild=req.controlGuild;
  const settings=repo.ensure(guild.id);
  res.json({
    success:true,
    guild:{id:guild.id,name:guild.name},
    controls:{
      automod:{enabled:!!settings.automod_enabled,rules:automod.list(guild.id).length},
      antiraid:{enabled:!!settings.antiraid_enabled},
      antinuke:{enabled:!!settings.antinuke_enabled},
      raidMode:!!security.getRaid(guild.id).raid_mode,
      lockdown:db.prepare('SELECT COUNT(*) c FROM security_lockdown_channels WHERE guild_id=?').get(guild.id).c>0
    }
  });
});

app.post('/api/guild/:guildId/automod/toggle',auth,csrf,controlGuild,async(req,res)=>{
  const guild=req.controlGuild;
  const enabled=parseBoolean(req.body?.enabled);
  try{
    const rules=automod.list(guild.id);
    const previous=[];
    for(const row of rules){
      const remote=await guild.autoModerationRules.fetch(row.rule_id);
      previous.push({id:row.rule_id,enabled:!!remote?.enabled});
    }
    let changed=0;
    try{
      for(const row of rules){
        await automod.setEnabled(guild,row.rule_id,enabled);
        changed++;
      }
    }catch(error){
      for(const old of previous){
        try{await automod.setEnabled(guild,old.id,old.enabled)}catch(rollbackError){
          logger.error({err:rollbackError,requestId:req.requestId,guild:guild.id,rule:old.id},'dashboard AutoMod batch rollback failed');
        }
      }
      throw error;
    }
    repo.update(guild.id,{automod_enabled:enabled?1:0});
    auditControl(req,guild.id,`automod.${enabled?'enable':'disable'}`);
    logger.info({requestId:req.requestId,guild:guild.id,user:req.session.user.id,enabled,changed},'dashboard AutoMod state updated');
    res.json({success:true,enabled,changed});
  }catch(error){
    logger.warn({err:error,requestId:req.requestId,guild:guild.id},'dashboard AutoMod update failed');
    res.status(400).json({success:false,error:error.message||'AutoMod update failed'});
  }
});

app.post('/api/guild/:guildId/security/toggle',auth,csrf,controlGuild,(req,res)=>{
  const guild=req.controlGuild;
  const field=String(req.body?.control||'');
  const enabled=parseBoolean(req.body?.enabled);
  if(!['antiraid_enabled','antinuke_enabled'].includes(field)){
    return res.status(400).json({success:false,error:'Invalid security control.'});
  }
  repo.update(guild.id,{[field]:enabled?1:0});
  auditControl(req,guild.id,`${field}.${enabled?'enable':'disable'}`);
  logger.info({requestId:req.requestId,guild:guild.id,user:req.session.user.id,field,enabled},'dashboard security setting updated');
  res.json({success:true,control:field,enabled});
});

app.post('/api/guild/:guildId/security/lockdown',auth,csrf,controlGuild,async(req,res)=>{
  const guild=req.controlGuild;
  try{
    await security.lockdown(guild);
    auditControl(req,guild.id,'security.lockdown');
    res.json({success:true,lockdown:true});
  }catch(error){
    logger.warn({err:error,requestId:req.requestId,guild:guild.id},'dashboard lockdown failed');
    res.status(400).json({success:false,error:error.message||'Lockdown failed'});
  }
});

app.post('/api/guild/:guildId/security/unlock',auth,csrf,controlGuild,async(req,res)=>{
  const guild=req.controlGuild;
  try{
    await security.unlock(guild);
    auditControl(req,guild.id,'security.unlock');
    res.json({success:true,lockdown:false});
  }catch(error){
    logger.warn({err:error,requestId:req.requestId,guild:guild.id},'dashboard unlock failed');
    res.status(400).json({success:false,error:error.message||'Unlock failed'});
  }
});

app.post('/dashboard/:guildId/settings',auth,csrf,async(req,res)=>{const id=req.params.guildId;if(!(await manageableGuild(req,id)))return res.status(403).send('Forbidden');try{const g=client.guilds.cache.get(id);if(!g)return res.status(404).send('DYNEX is not in this server.');const patch=validateSettings(req.body,g);repo.update(id,patch);db.prepare('INSERT INTO dashboard_audit(user_id,guild_id,action,ip,created_at) VALUES(?,?,?,?,?)').run(req.session.user.id,id,'settings.update',req.ip,Date.now());client.logger.info({requestId:req.requestId,guild:id,user:req.session.user.id,action:'settings.update'},'dashboard settings updated');res.redirect('/dashboard/'+id)}catch(error){client.logger.warn({err:error,requestId:req.requestId,guild:id},'dashboard settings rejected');res.status(400).send(error.message)}});
return app.listen(config.PORT,()=>client.logger.info({port:config.PORT},'DYNEX dashboard listening'))}
module.exports={start,DASHBOARD_SECTIONS,validateSettings};
