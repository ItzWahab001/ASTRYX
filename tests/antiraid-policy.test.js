const test=require('node:test');
const assert=require('node:assert/strict');
const {classifyRisk}=require('../src/services/security-policy');

test('normal member growth does not trigger raid by itself',()=>{
  const r=classifyRisk({accountAgeDays:120,similar:false,velocity:19,threshold:20,joinLeaveBurst:0});
  assert.equal(r.critical,false); assert.equal(r.suspicious,false);
});

test('combined burst and suspicious signals reach critical risk',()=>{
  const r=classifyRisk({accountAgeDays:0,similar:true,velocity:20,threshold:20,joinLeaveBurst:3});
  assert.equal(r.critical,true); assert.ok(r.score>=5);
});

test('threshold remains configurable',()=>{
  const low=classifyRisk({accountAgeDays:100,similar:false,velocity:5,threshold:5,joinLeaveBurst:0});
  const high=classifyRisk({accountAgeDays:100,similar:false,velocity:5,threshold:20,joinLeaveBurst:0});
  assert.ok(low.score>high.score);
});
