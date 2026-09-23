class AsyncMutex{
  constructor(){this.locked=false;this.waiters=[]}
  async run(fn){
    if(this.locked)await new Promise(resolve=>this.waiters.push(resolve));
    this.locked=true;
    try{return await fn()}
    finally{this.locked=false;this.waiters.shift()?.()}
  }
}
module.exports=AsyncMutex;
