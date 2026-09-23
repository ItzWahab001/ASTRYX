const {db,transaction}=require('../database/db');
function row(g,u){return db.prepare('SELECT * FROM economy WHERE guild_id=? AND user_id=?').get(g,u)||{guild_id:g,user_id:u,balance:0,daily_at:0,work_at:0}}
function save(x){db.prepare(`INSERT INTO economy(guild_id,user_id,balance,daily_at,work_at) VALUES(@guild_id,@user_id,@balance,@daily_at,@work_at) ON CONFLICT(guild_id,user_id) DO UPDATE SET balance=excluded.balance,daily_at=excluded.daily_at,work_at=excluded.work_at`).run(x)}
function pay(g,from,to,amount){
  if(!Number.isSafeInteger(amount)||amount<=0)throw new Error('INVALID_AMOUNT');
  if(!from||!to||from===to)throw new Error('INVALID_RECIPIENT');
  return transaction(()=>{const a=row(g,from),b=row(g,to);if(a.balance<amount)throw new Error('INSUFFICIENT_FUNDS');a.balance-=amount;b.balance+=amount;save(a);save(b);db.prepare('INSERT INTO economy_transactions(guild_id,from_user_id,to_user_id,amount,type,created_at) VALUES(?,?,?,?,?,?)').run(g,from,to,amount,'transfer',Date.now());return {from:a.balance,to:b.balance}})
}
module.exports={row,save,pay,transaction};
