const test=require('node:test');const assert=require('node:assert/strict');const {QueueManager}=require('../src/services/music-queue');
test('queue add/remove/clear/pagination',()=>{const q=new QueueManager();q.add({title:'a'});q.add({title:'b'});q.add({title:'c'});assert.equal(q.remove(1).title,'b');assert.deepEqual(q.paginate(1,1).items.map(x=>x.title),['a']);q.clear();assert.equal(q.length,0)});
test('queue isolates instances',()=>{const a=new QueueManager(),b=new QueueManager();a.add('a');assert.equal(b.length,0)});
