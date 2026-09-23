const test=require('node:test');
const assert=require('node:assert/strict');
const {validateSettings}=require('../src/dashboard-validation');
function guild(){return{channels:{cache:new Map([['11111111111111111',{type:0,isTextBased:()=>true}],['22222222222222222',{type:4,isTextBased:()=>false}]])},roles:{cache:new Map([['33333333333333333',{}]])}}}
test('dashboard settings reject resources outside the current guild',()=>assert.throws(()=>validateSettings({welcome_channel_id:'99999999999999999'},guild()),/belong to this Discord server/));
test('dashboard settings enforce resource types',()=>{assert.throws(()=>validateSettings({ticket_category_id:'11111111111111111'},guild()),/must reference a category/);assert.throws(()=>validateSettings({ticket_staff_role_id:'11111111111111111'},guild()),/must reference a role/)});
test('dashboard settings accept validated guild resources and booleans',()=>{const out=validateSettings({welcome_channel_id:'11111111111111111',ticket_category_id:'22222222222222222',ticket_staff_role_id:'33333333333333333',antiraid_enabled:'on'},guild());assert.equal(out.welcome_channel_id,'11111111111111111');assert.equal(out.ticket_category_id,'22222222222222222');assert.equal(out.ticket_staff_role_id,'33333333333333333');assert.equal(out.antiraid_enabled,1)});
