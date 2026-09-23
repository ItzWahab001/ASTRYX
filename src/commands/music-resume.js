const {SlashCommandBuilder}=require('discord.js');const {mw}=require('./_helpers');const music=require('../services/music');
module.exports={data:new SlashCommandBuilder().setName('resume').setDescription('Resume music'),execute:i=>mw.createMiddleware({})(i,null,async()=>{const p=music.assertVoiceControl(i);p.resume();await i.reply('▶️ Resumed.')})};
