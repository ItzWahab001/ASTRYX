const guild=require('../repositories/guild');module.exports={name:'guildCreate',execute(g){guild.ensure(g.id)}};
