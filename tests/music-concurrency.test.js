const test=require('node:test');
const assert=require('node:assert/strict');
const AsyncMutex=require('../src/services/async-mutex');

test('async mutex serializes simultaneous music state mutations',async()=>{
  const mutex=new AsyncMutex(); const order=[];
  await Promise.all([1,2,3,4].map(i=>mutex.run(async()=>{order.push(`start${i}`);await new Promise(r=>setTimeout(r,2));order.push(`end${i}`)})));
  for(let i=0;i<4;i++)assert.equal(order[i*2+1],order[i*2].replace('start','end'));
  assert.equal(order.length,8);
});
