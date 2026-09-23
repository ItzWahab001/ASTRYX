const {SlashCommandBuilder}=require('discord.js');const {mw}=require('./_helpers');const music=require('../services/music');
module.exports={data:new SlashCommandBuilder().setName('skip').setDescription('Skip current track'),execute:i=>mw.createMiddleware({})(i,null,async()=>{await music.assertVoiceControl(i).skip();await i.reply('⏭️ Skipped.')})};
