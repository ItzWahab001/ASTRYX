const DASHBOARD_SECTIONS=Object.freeze({
  overview:Object.freeze({label:'Overview',mode:'monitoring'}),
  moderation:Object.freeze({label:'Moderation',mode:'monitoring'}),
  automod:Object.freeze({label:'AutoMod',mode:'control'}),
  security:Object.freeze({label:'Security',mode:'control'}),
  antiraid:Object.freeze({label:'Anti-Raid',mode:'control'}),
  antinuke:Object.freeze({label:'Anti-Nuke',mode:'control'}),
  tickets:Object.freeze({label:'Tickets',mode:'monitoring'}),
  music:Object.freeze({label:'Music',mode:'monitoring'}),
  welcome:Object.freeze({label:'Welcome',mode:'monitoring'}),
  roles:Object.freeze({label:'Roles',mode:'monitoring'}),
  leveling:Object.freeze({label:'Leveling',mode:'monitoring'}),
  economy:Object.freeze({label:'Economy',mode:'monitoring'}),
  giveaways:Object.freeze({label:'Giveaways',mode:'monitoring'}),
  ai:Object.freeze({label:'AI',mode:'monitoring'}),
  logging:Object.freeze({label:'Logging',mode:'monitoring'}),
  'custom-commands':Object.freeze({label:'Custom Commands',mode:'monitoring'}),
  settings:Object.freeze({label:'Settings',mode:'control'})
});
module.exports={DASHBOARD_SECTIONS};
