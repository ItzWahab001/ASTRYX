const recovery=require('../services/recovery');
module.exports={name:'channelDelete',execute(channel){recovery.saveChannel(channel)}};
