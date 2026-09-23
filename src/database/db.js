const fs=require('fs');const path=require('path');const Database=require('better-sqlite3');const config=require('../config');
if(config.DATABASE_DRIVER!=='sqlite') throw new Error('PostgreSQL mode is prepared through the repository adapter; run with DATABASE_DRIVER=sqlite until PostgreSQL migrations are installed.');
fs.mkdirSync(path.dirname(config.DATABASE_PATH),{recursive:true});const db=new Database(config.DATABASE_PATH);db.pragma('journal_mode = WAL');db.pragma('foreign_keys = ON');
function transaction(fn){return db.transaction(fn)()} module.exports={db,transaction};
