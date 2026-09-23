const {SlashCommandBuilder,PermissionFlagsBits,mw}=require('./_helpers');const ticket=require('../services/tickets');const archive={data:new SlashCommandBuilder().setName('ticket-archive').setDescription('Archive a ticket'),execute:i=>mw.createMiddleware({permissions:[PermissionFlagsBits.ManageChannels]})(i,null,()=>ticket.archive(i))};
module.exports=archive;
