const {SlashCommandBuilder}=require('discord.js');const {mw}=require('./_helpers');const music=require('../services/music');
module.exports={data:new SlashCommandBuilder().setName('replay').setDescription('Replay the current track'),execute:i=>mw.createMiddleware({})(i,null,async()=>{const p=music.assertVoiceControl(i);await p.seek(0);await i.reply('🔁 Replaying the current track.')})};
