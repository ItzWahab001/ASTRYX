const recovery=require('../services/recovery');
module.exports={name:'roleDelete',execute(role){recovery.saveRole(role)}};
