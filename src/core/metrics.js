const state={startedAt:Date.now(),commands:new Map(),errors:0,eventErrors:0};
function command(name,ok,duration){const r=state.commands.get(name)||{calls:0,failures:0,totalMs:0};r.calls++;r.totalMs+=duration;if(!ok)r.failures++;state.commands.set(name,r)}
function snapshot(){return {uptime:process.uptime(),commands:[...state.commands.entries()].map(([name,v])=>({name,...v,avgMs:v.calls?Math.round(v.totalMs/v.calls):0})),errors:state.errors,eventErrors:state.eventErrors,memory:process.memoryUsage()}}
module.exports={state,command,snapshot};
