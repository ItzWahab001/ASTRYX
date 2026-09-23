const {SlashCommandBuilder,PermissionFlagsBits,mw,db,EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,guild,mod}=require('./_helpers');const music=require('../services/music');const ticket=require('../services/tickets');const repo=require('../repositories/guild');const levels=require('../services/levels');const eco=require('../services/economy');
const close={data:new SlashCommandBuilder().setName('ticket-close').setDescription('Close this ticket'),execute:i=>ticket.close(i)};
module.exports=close;
