const {SlashCommandBuilder,PermissionFlagsBits}=require('discord.js');
const {mw}=require('./_helpers');
const automod=require('../services/automod');
module.exports={
  data:new SlashCommandBuilder().setName('automod-setup').setDescription('Create Discord AutoMod keyword rule').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption(o=>o.setName('keywords').setDescription('Comma-separated blocked words').setRequired(true)),
  execute:i=>mw.createMiddleware({permissions:[PermissionFlagsBits.ManageGuild],botPermissions:[PermissionFlagsBits.ManageGuild]})(i,null,async()=>{
    const words=i.options.getString('keywords').split(',').map(x=>x.trim()).filter(Boolean);
    if(!words.length)throw new Error('Provide at least one keyword.');
    const r=await automod.create(i.guild,{name:'DYNEX Keyword Guard',type:'keyword',keywords:words});
    await i.reply(`🛡️ AutoMod rule created: **${r.name}** (${r.id})`);
  })
};
