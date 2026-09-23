const config=require('./config');
const {spawnSync}=require('child_process');
const {create}=require('./core/client');
const readyEvent=require('./events/ready');
const giveaway=require('./scheduler/giveaways');
const {db}=require('./database/db');
const {migrate}=require('./database/migrate');
const logger=require('./core/logger');
const dashboard=require('./dashboard');
const music=require('./services/music');

let client;
let server=null;
let shuttingDown=false;
let dbClosed=false;

function closeDatabase(){if(!dbClosed){dbClosed=true;try{db.close()}catch(error){logger.error({err:error},'database close failed')}}}

function shutdown(signal='shutdown',exitCode=0){
  if(shuttingDown)return;
  shuttingDown=true;
  logger.info({signal,exitCode},'DYNEX shutdown started');
  readyEvent.stopRecovery();
  giveaway.stop();
  try{if(typeof music.destroyAll==='function')music.destroyAll()}catch(error){logger.error({err:error},'music shutdown cleanup failed')}
  if(client){try{client.destroy()}catch(error){logger.error({err:error},'Discord client shutdown failed')}}
  const finish=()=>{closeDatabase();process.exitCode=exitCode; if(exitCode!==0)process.exit(exitCode)};
  if(server?.close){try{server.close(finish)}catch(error){logger.error({err:error},'dashboard shutdown failed');finish()}}else finish();
}

async function main(){
  if(config.NODE_ENV!=='test')migrate();
  client=create();
  const ffmpegCheck=spawnSync(config.FFMPEG_PATH,['-version'],{stdio:'ignore'});
  client.ffmpegAvailable=ffmpegCheck.status===0;
  if(!client.ffmpegAvailable)logger.warn({path:config.FFMPEG_PATH},'FFmpeg executable not available; music transcoding may fail');
  try{
    await client.login(config.DISCORD_TOKEN);
    if(client.startupFailure)throw client.startupFailure;
    server=dashboard.start(client);
  }catch(error){
    logger.fatal({err:error},'DYNEX startup failed');
    shutdown('startup-failure',1);
  }
}

process.on('SIGTERM',()=>shutdown('SIGTERM',0));
process.on('SIGINT',()=>shutdown('SIGINT',0));
process.on('unhandledRejection',error=>{logger.fatal({err:error},'unhandled promise rejection');shutdown('unhandled-rejection',1)});
process.on('uncaughtException',error=>{logger.fatal({err:error},'uncaught exception');shutdown('uncaught-exception',1)});

main().catch(error=>{logger.fatal({err:error},'fatal startup exception');shutdown('startup-exception',1)});
