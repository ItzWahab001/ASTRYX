const {SlashCommandBuilder}=require('discord.js');const {mw}=require('./_helpers');const music=require('../services/music');
module.exports={data:new SlashCommandBuilder().setName('queue-clear').setDescription('Clear the music queue'),execute:i=>mw.createMiddleware({})(i,null,async()=>{const p=music.assertVoiceControl(i);p.clear();await i.reply('🧹 Queue cleared.')})};
