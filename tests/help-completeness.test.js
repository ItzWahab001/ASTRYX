const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');
const {buildHelpCatalog}=require('../src/services/help-catalog');

function sourceCommandNames(){
  const dir=path.join(__dirname,'../src/commands');
  return fs.readdirSync(dir).filter(f=>f.endsWith('.js')&&!f.startsWith('_')).map(f=>{
    const s=fs.readFileSync(path.join(dir,f),'utf8');
    const match=s.match(/\.setName\(['"]([^'"]+)['"]\)/);
    return match?.[1];
  }).filter(Boolean);
}

test('help catalog includes every real top-level command name',()=>{
  const names=sourceCommandNames();
  const commands=new Map(names.map(name=>[name,{data:{toJSON:()=>({name,description:`/${name}`})}}]));
  const catalog=buildHelpCatalog(commands);
  const listed=new Set(catalog.entries.map(x=>x.name));
  for(const name of names)assert.ok(listed.has(name),`registered command missing from help: ${name}`);
});

test('help catalog exposes nested AutoMod subcommands from the real command definition shape',()=>{
  const commands=new Map([['automod',{data:{toJSON:()=>({name:'automod',description:'Manage native Discord AutoMod',default_member_permissions:'32',options:[
    {type:1,name:'setup',description:'Create'},
    {type:1,name:'status',description:'Status'},
    {type:2,name:'rule',description:'Manage',options:[{type:1,name:'add',description:'Add'},{type:1,name:'edit',description:'Edit'},{type:1,name:'delete',description:'Delete'}]}
  ]})}}]]);
  const entry=buildHelpCatalog(commands).entries[0];
  assert.deepEqual(entry.subcommands,['setup','status','rule add','rule edit','rule delete']);
  assert.equal(entry.permission,'Manage Server');
});

test('help catalog never emits a command absent from the supplied registry',()=>{
  const catalog=buildHelpCatalog(new Map([['play',{data:{toJSON:()=>({name:'play',description:'Play'})}}]]));
  const music=catalog.categories.Music;
  assert.equal(music.length,1);
  assert.equal(music[0].name,'play');
  assert.equal(catalog.categories.Moderation,undefined);
});
