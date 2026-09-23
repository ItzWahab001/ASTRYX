const fs=require('fs');
const path=require('path');
const {db}=require('./db');
function columnSet(table){return new Set(db.prepare(`PRAGMA table_info(${table})`).all().map(x=>x.name))}
function addColumn(table,column,type,from){const cols=columnSet(table);if(!cols.has(column))db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);if(from&&cols.has(from))db.prepare(`UPDATE ${table} SET ${column}=${from} WHERE ${column} IS NULL`).run()}
function migrate(){
  db.exec(fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8'));
  for(const [c,t,f] of [
    ['welcome_channel_id','TEXT','welcome_channel'],['goodbye_channel_id','TEXT','goodbye_channel'],['mod_log_channel_id','TEXT','mod_log_channel'],
    ['ticket_category_id','TEXT','ticket_category'],['ticket_staff_role_id','TEXT','ticket_staff_role'],['ticket_transcript_channel_id','TEXT','ticket_transcript_channel'],
    ['ticket_archive_category_id','TEXT',null],['antiraid_join_threshold','INTEGER NOT NULL DEFAULT 20',null],['antiraid_window_ms','INTEGER NOT NULL DEFAULT 15000',null],
    ['antiraid_min_account_age_days','INTEGER NOT NULL DEFAULT 7',null],['antiraid_similarity_threshold','REAL NOT NULL DEFAULT 0.85',null]
  ])addColumn('guild_settings',c,t,f);
  addColumn('security_state','incident_id','TEXT',null);
  addColumn('security_lockdown_channels','had_explicit_allow','INTEGER NOT NULL DEFAULT 0',null);
  return true;
}
if(require.main===module){migrate();console.log('DYNEX migrations applied.')}
module.exports={migrate};
