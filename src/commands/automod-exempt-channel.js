const {SlashCommandBuilder,PermissionFlagsBits,ChannelType}=require('discord.js');
const {mw}=require('./_helpers');
const automod=require('../services/automod');
module.exports={
  data:new SlashCommandBuilder().setName('automod-exempt-channel').setDescription('Add a channel exemption to a native AutoMod rule').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption(o=>o.setName('id').setDescription('Rule ID').setRequired(true)).addChannelOption(o=>o.setName('channel').setDescription('Exempt channel').addChannelTypes(ChannelType.GuildText,ChannelType.GuildAnnouncement).setRequired(true)),
  execute:i=>mw.createMiddleware({permissions:[PermissionFlagsBits.ManageGuild],botPermissions:[PermissionFlagsBits.ManageGuild]})(i,null,async()=>{
    await automod.exempt(i.guild,i.options.getString('id'),{channelId:i.options.getChannel('channel').id});
    await i.reply('✅ Channel exemption saved.');
  })
};
