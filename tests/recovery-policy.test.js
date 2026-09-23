const test=require('node:test');
const assert=require('node:assert/strict');
const {safeRolePermissions,safeChannelOverwrites,clampRolePosition}=require('../src/services/recovery-policy');

test('role recovery strips dangerous privilege escalation permissions',()=>{
  const administrator=1n<<3n,manageGuild=1n<<5n,manageRoles=1n<<28n,sendMessages=1n<<11n;
  const safe=safeRolePermissions(administrator|manageGuild|manageRoles|sendMessages);
  assert.equal(safe & administrator,0n);
  assert.equal(safe & manageGuild,0n);
  assert.equal(safe & manageRoles,0n);
  assert.notEqual(safe & sendMessages,0n);
});

test('channel recovery only restores existing role and everyone overwrites',()=>{
  const result=safeChannelOverwrites([
    {id:'everyone',type:0,allow:'2048',deny:'0'},
    {id:'existing-role',type:0,allow:'0',deny:'2048'},
    {id:'deleted-role',type:0,allow:'8',deny:'0'},
    {id:'member',type:1,allow:'8',deny:'0'}
  ],['existing-role'],'everyone');
  assert.deepEqual(result.map(x=>x.id),['everyone','existing-role']);
});

test('role position is clamped below bot hierarchy',()=>{
  assert.equal(clampRolePosition(50,10),9);
  assert.equal(clampRolePosition(3,10),3);
  assert.equal(clampRolePosition(0,10),1);
});
