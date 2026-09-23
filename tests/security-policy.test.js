const test=require('node:test');const assert=require('node:assert/strict');const {classifyRisk}=require('../src/services/security-policy');
test('security risk combines independent raid signals',()=>{const r=classifyRisk({accountAgeDays:1,similar:true,velocity:20,threshold:20,joinLeaveBurst:3});assert.equal(r.suspicious,true);assert.equal(r.critical,true)});
test('normal established join remains low risk',()=>{const r=classifyRisk({accountAgeDays:100,similar:false,velocity:1,threshold:20,joinLeaveBurst:0});assert.equal(r.suspicious,false)});
