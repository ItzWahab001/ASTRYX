const {SlashCommandBuilder}=require('discord.js');const {mw}=require('./_helpers');const music=require('../services/music');
module.exports={data:new SlashCommandBuilder().setName('stop').setDescription('Stop music'),execute:i=>mw.createMiddleware({})(i,null,async()=>{music.assertVoiceControl(i).stop();await i.reply('⏹️ Stopped and cleared.')})};
