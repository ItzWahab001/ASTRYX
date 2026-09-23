/**
 * DYNEX-BOT — Combined source launcher / dashboard
 * This file is intentionally dependency-free. It does NOT concatenate unrelated
 * Discord runtimes into one process; instead it provides one clear entry point
 * for the combined source bundle.
 *
 * Usage:
 *   node DYNEX-BOT.js
 *   node DYNEX-BOT.js --verify     (check every file against DYNEX-MANIFEST.json)
 *   node DYNEX-BOT.js --manifest   (regenerate the manifest after you edit files)
 *
 * Dashboard: http://localhost:3000
 */
const fs=require('fs');
const path=require('path');
const http=require('http');
const {execFile}=require('child_process');

const ROOT=__dirname;
const manifestPath=path.join(ROOT,'DYNEX-MANIFEST.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const components=manifest.components || [];

function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function page(){
 const cards=components.map(c=>`<section class="card"><h2>${esc(c)}</h2><p>Combined source module preserved in <code>components/${esc(c)}</code>.</p></section>`).join('');
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DYNEX-BOT</title>
<style>body{margin:0;font-family:Inter,system-ui;background:#09090b;color:#f4f4f5}main{max-width:1100px;margin:auto;padding:40px}.hero{padding:28px;border:1px solid #27272a;border-radius:24px;background:linear-gradient(135deg,#18181b,#0f0f12)}h1{font-size:48px;margin:0 0 8px}p{color:#a1a1aa}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:24px}.card{padding:20px;border:1px solid #27272a;border-radius:18px;background:#111113}.pill{display:inline-block;padding:7px 11px;border-radius:999px;background:#27272a;color:#ddd}code{color:#ffffff}</style></head>
<body><main><div class="hero"><span class="pill">DYNEX-BOT • Combined Bundle</span><h1>DYNEX</h1><p>Discord bot systems + security + music + feedback + applications + landing-page source, preserved in one organized project.</p></div><div class="grid">${cards}</div></main></body></html>`;
}
const crypto=require('crypto');
function walk(dir,out=[]){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);
  if(e.isDirectory()){ if(e.name!=='node_modules') walk(p,out); } else out.push(p);
 }
 return out;
}
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const SKIP=new Set(['DYNEX-MANIFEST.json']);
function buildManifest(){
 const files=walk(ROOT).map(p=>path.relative(ROOT,p).split(path.sep).join('/')).filter(r=>!SKIP.has(r)).sort()
  .map(r=>({path:r,bytes:fs.statSync(path.join(ROOT,r)).size,sha256:sha(path.join(ROOT,r))}));
 const m={name:'DYNEX-BOT',components:components,fileCount:files.length,files};
 fs.writeFileSync(manifestPath,JSON.stringify(m,null,2));
 console.log(`Manifest written: ${files.length} files.`);
}
function verify(){
 const list=manifest.files||[];
 let bad=0;
 for(const f of list){
  const p=path.join(ROOT,f.path);
  if(!fs.existsSync(p)){console.error('MISSING:',f.path);bad++;continue;}
  if(sha(p)!==f.sha256){console.error('CHANGED:',f.path);bad++;}
 }
 console.log(`DYNEX verification: ${bad?'FAILED':'PASSED'} - ${list.length} files checked.`);
 process.exitCode=bad?1:0;
}
if(process.argv.includes('--manifest')) buildManifest();
else if(process.argv.includes('--verify')) verify();
else http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(page());}).listen(3000,()=>console.log('DYNEX-BOT dashboard: http://localhost:3000'));
