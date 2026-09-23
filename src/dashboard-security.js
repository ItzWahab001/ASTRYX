function hasManageGuild(guild){
  if(!guild)return false;
  try{
    const permissions=BigInt(guild.permissions||0);
    return (permissions&0x20n)===0x20n || (permissions&0x8n)===0x8n;
  }catch{return false}
}
function safeGuildId(id){return typeof id==='string'&&/^\d{17,20}$/.test(id)}
module.exports={hasManageGuild,safeGuildId};
