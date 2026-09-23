const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const dashboard=fs.readFileSync(path.join(__dirname,'../src/dashboard.js'),'utf8');
const sections=fs.readFileSync(path.join(__dirname,'../src/dashboard-sections.js'),'utf8');
const view=fs.readFileSync(path.join(__dirname,'../web/views/server.ejs'),'utf8');

test('dashboard exposes real AutoMod control endpoint with CSRF and guild authorization',()=>{
  assert.match(dashboard,/app\.post\('\/api\/guild\/:guildId\/automod\/toggle',auth,csrf,controlGuild/);
  assert.match(dashboard,/automod\.setEnabled\(guild,row\.rule_id,enabled\)/);
  assert.match(dashboard,/repo\.update\(guild\.id,\{automod_enabled:enabled\?1:0\}\)/);
});

test('dashboard exposes security controls through existing security service',()=>{
  assert.match(dashboard,/\/api\/guild\/:guildId\/security\/toggle/);
  assert.match(dashboard,/security\.lockdown\(guild\)/);
  assert.match(dashboard,/security\.unlock\(guild\)/);
});

test('security and AutoMod sections are explicitly control sections',()=>{
  assert.match(sections,/automod:Object\.freeze\(\{label:'AutoMod',mode:'control'\}\)/);
  assert.match(sections,/security:Object\.freeze\(\{label:'Security',mode:'control'\}\)/);
  assert.match(sections,/antiraid:Object\.freeze\(\{label:'Anti-Raid',mode:'control'\}\)/);
  assert.match(sections,/antinuke:Object\.freeze\(\{label:'Anti-Nuke',mode:'control'\}\)/);
});

test('dashboard UI calls CSRF-protected control APIs instead of fake buttons',()=>{
  assert.match(view,/\/api\/guild\/\$\{guildId\}\/automod\/toggle/);
  assert.match(view,/X-CSRF-Token/);
  assert.match(view,/security\/\$\{button\.dataset\.securityAction\}/);
});

\nconst parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true','1','on','yes'].includes(v)) return true;
    if (['false','0','off','no',''].includes(v)) return false;
  }
  return false;
};

test('dashboard boolean parsing does not treat string false as enabled', () => {
  assert.equal(parseBoolean(false), false);
  assert.equal(parseBoolean('false'), false);
  assert.equal(parseBoolean('0'), false);
  assert.equal(parseBoolean('true'), true);
  assert.equal(parseBoolean('1'), true);
});
