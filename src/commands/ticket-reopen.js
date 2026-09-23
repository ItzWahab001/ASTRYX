const {SlashCommandBuilder,PermissionFlagsBits,mw}=require('./_helpers');const ticket=require('../services/tickets');const reopen={data:new SlashCommandBuilder().setName('ticket-reopen').setDescription('Reopen a closed ticket'),execute:i=>mw.createMiddleware({permissions:[PermissionFlagsBits.ManageChannels]})(i,null,()=>ticket.reopen(i))};
module.exports=reopen;
