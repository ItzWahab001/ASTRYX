import {Client,Events,ChatInputCommandInteraction} from 'discord.js';
import {joinVoiceChannel,createAudioPlayer,createAudioResource,AudioPlayerStatus,VoiceConnection,AudioPlayer,StreamType} from '@discordjs/voice';
import {spawn,ChildProcessWithoutNullStreams} from 'node:child_process';

type Track={url:string,title:string,requester:string}; type Player={queue:Track[];current?:Track;connection:VoiceConnection;player:AudioPlayer;volume:number;loop:'off'|'track'|'queue';history:Track[];ff?:ChildProcessWithoutNullStreams};
const players=new Map<string,Player>();
export const getPlayer=(guildId:string)=>players.get(guildId);
export async function play(interaction:ChatInputCommandInteraction,url:string){
  const member=await interaction.guild!.members.fetch(interaction.user.id),vc=member.voice.channel;if(!vc)throw new Error('Join a voice channel first.');
  if(!/^https?:\/\//i.test(url))throw new Error('Music accepts direct HTTP(S) media URLs.');
  let p=players.get(interaction.guild!.id);
  if(!p){const connection=joinVoiceChannel({channelId:vc.id,guildId:interaction.guild!.id,adapterCreator:interaction.guild!.voiceAdapterCreator});const player=createAudioPlayer();p={queue:[],player,connection,volume:1,loop:'off',history:[]};players.set(interaction.guild!.id,p);connection.subscribe(player);player.on(AudioPlayerStatus.Idle,()=>void advance(interaction.guild!.id));player.on('error',()=>void advance(interaction.guild!.id));connection.on('stateChange',(oldState:any,newState:any)=>{if(newState.status==='disconnected'){setTimeout(()=>{if(players.get(interaction.guild!.id)===p&&p!.connection.state.status==='disconnected')p!.connection.destroy();},5000);}});}
  p.queue.push({url,title:url,requester:interaction.user.id});if(!p.current)await advance(interaction.guild!.id);
}
async function advance(guildId:string){const p=players.get(guildId);if(!p)return;if(p.current&&p.loop==='track')p.queue.unshift(p.current);else if(p.current&&p.loop==='queue')p.queue.push(p.current);if(p.current)p.history.unshift(p.current);const t=p.queue.shift();p.current=t;if(!t){p.ff?.kill();return;}p.ff?.kill();const ff=spawn(process.env.FFMPEG_PATH??'ffmpeg',['-hide_banner','-loglevel','error','-i',t.url,'-f','s16le','-ar','48000','-ac','2','pipe:1'],{stdio:['ignore','pipe','ignore']});p.ff=ff;p.player.play(createAudioResource(ff.stdout,{inputType:StreamType.Raw,inlineVolume:true,volume:p.volume}));}
export function control(guildId:string,action:string,value?:number){const p=players.get(guildId);if(!p)throw new Error('No active player.');switch(action){case'pause':p.player.pause();break;case'resume':p.player.unpause();break;case'skip':p.player.stop();break;case'clear':p.queue=[];break;case'shuffle':for(let i=p.queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p.queue[i],p.queue[j]]=[p.queue[j],p.queue[i]];}break;case'loop':p.loop=p.loop==='off'?'track':p.loop==='track'?'queue':'off';break;case'volume':p.volume=Math.max(0,Math.min(2,value??100)/100);break;default:throw new Error('Unsupported music action.');}}
export function history(guildId:string){return players.get(guildId)?.history.slice(0,20)??[];}
export function installMusic(_client:Client){_client.on(Events.VoiceStateUpdate,(oldS,newS)=>{if(oldS.channelId&&!newS.channelId){const p=players.get(newS.guild.id);if(p&&p.connection.joinConfig.channelId===oldS.channelId&&oldS.channel?.members.filter(m=>!m.user.bot).size===0){p.connection.destroy();players.delete(newS.guild.id);}}});}
