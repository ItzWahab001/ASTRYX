const {SlashCommandBuilder}=require('discord.js');const {mw}=require('./_helpers');const music=require('../services/music');
module.exports={data:new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle queue'),execute:i=>mw.createMiddleware({})(i,null,async()=>{music.assertVoiceControl(i).shuffle();await i.reply('🔀 Queue shuffled.')})};
