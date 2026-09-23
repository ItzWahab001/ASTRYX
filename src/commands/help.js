const {SlashCommandBuilder,EmbedBuilder,ActionRowBuilder,StringSelectMenuBuilder}=require('./_helpers');
const {buildHelpCatalog}=require('../services/help-catalog');
module.exports={
  data:new SlashCommandBuilder().setName('help').setDescription('Open the DYNEX command center'),
  execute:async i=>{
    const catalog=buildHelpCatalog(i.client.commands);
    const options=Object.keys(catalog.categories).map(name=>({label:name,value:name}));
    await i.reply({embeds:[new EmbedBuilder().setColor(0x5865f2).setTitle('DYNEX Command Center').setDescription(`**${catalog.entries.length} registered commands** are indexed directly from the live command registry. Choose a category.`)],components:[new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('help:category').setPlaceholder('Choose a category').addOptions(options))],ephemeral:true});
  }
};
