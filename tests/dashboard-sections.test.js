const test=require('node:test');
const assert=require('node:assert/strict');
const {DASHBOARD_SECTIONS}=require('../src/dashboard-sections');

test('dashboard declares every advertised section with honest capability modes',()=>{
  const expected=['overview','moderation','automod','security','antiraid','antinuke','tickets','music','welcome','roles','leveling','economy','giveaways','ai','logging','custom-commands','settings'];
  assert.deepEqual(Object.keys(DASHBOARD_SECTIONS),expected);
  assert.equal(DASHBOARD_SECTIONS.settings.mode,'control');
  for(const name of ['automod','security','antiraid','antinuke'])assert.equal(DASHBOARD_SECTIONS[name].mode,'control',name);
  for(const name of expected.filter(x=>!['settings','automod','security','antiraid','antinuke'].includes(x)))assert.equal(DASHBOARD_SECTIONS[name].mode,'monitoring',name);
});
