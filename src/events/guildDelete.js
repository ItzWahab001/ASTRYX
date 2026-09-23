const music=require('../services/music');
module.exports={name:'guildDelete',execute(guild){music.manager.destroy(guild.id)}};
