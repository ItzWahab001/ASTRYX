const {SlashCommandBuilder,PermissionFlagsBits,mw,db,EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,guild,mod}=require('./_helpers');const music=require('../services/music');const ticket=require('../services/tickets');const repo=require('../repositories/guild');const levels=require('../services/levels');const eco=require('../services/economy');
const claim={data:new SlashCommandBuilder().setName('ticket-claim').setDescription('Claim this ticket'),execute:i=>ticket.claim(i)};
module.exports=claim;
