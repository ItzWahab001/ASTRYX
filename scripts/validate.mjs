import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const required=['README.md','FEATURE-AUDIT.md','TEST-REPORT.md','RESEARCH-IMPLEMENTATION-MATRIX.md','DEPLOYMENT.md','CONFIGURATION.md'];
for(const f of required){if(!fs.existsSync(f)&&!fs.existsSync(path.join('docs/research',f)))throw new Error(`Missing ${f}`)}
for(const p of ['apps/bot','apps/dashboard','packages/database','packages/ui','packages/design-system'])if(!fs.existsSync(p))throw new Error(`Missing ${p}`);
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.name==='node_modules'||e.name==='.git'?[]:e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk(root); if(files.some(f=>f.endsWith('.py')))throw new Error('Python source detected');
console.log(JSON.stringify({ok:true,files:files.length,required:required.length}));
