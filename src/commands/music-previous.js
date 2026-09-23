const {SlashCommandBuilder}=require('discord.js');const {mw}=require('./_helpers');const music=require('../services/music');
module.exports={data:new SlashCommandBuilder().setName('previous').setDescription('Play previous track'),execute:i=>mw.createMiddleware({})(i,null,async()=>{const p=music.assertVoiceControl(i);const t=await p.previous();await i.reply(`⏮️ Previous track: **${t.title}**`)})};
