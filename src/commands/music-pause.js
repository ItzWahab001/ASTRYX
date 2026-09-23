const {SlashCommandBuilder}=require('discord.js');const {mw}=require('./_helpers');const music=require('../services/music');
module.exports={data:new SlashCommandBuilder().setName('pause').setDescription('Pause music'),execute:i=>mw.createMiddleware({})(i,null,async()=>{const p=music.assertVoiceControl(i);p.pause();await i.reply('⏸️ Paused.')})};
