const {SlashCommandBuilder,PermissionFlagsBits}=require('discord.js');
const {mw}=require('./_helpers');
const automod=require('../services/automod');
module.exports={
  data:new SlashCommandBuilder().setName('automod-exempt-role').setDescription('Add a role exemption to a native AutoMod rule').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption(o=>o.setName('id').setDescription('Rule ID').setRequired(true)).addRoleOption(o=>o.setName('role').setDescription('Exempt role').setRequired(true)),
  execute:i=>mw.createMiddleware({permissions:[PermissionFlagsBits.ManageGuild],botPermissions:[PermissionFlagsBits.ManageGuild]})(i,null,async()=>{
    await automod.exempt(i.guild,i.options.getString('id'),{roleId:i.options.getRole('role').id});
    await i.reply('✅ Role exemption saved.');
  })
};
