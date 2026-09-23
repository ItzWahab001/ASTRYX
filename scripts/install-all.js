// Runs `npm install` inside every component that has a package.json.
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const base = path.join(__dirname, '..', 'components');
for (const name of fs.readdirSync(base)) {
  const dir = path.join(base, name);
  if (!fs.existsSync(path.join(dir, 'package.json'))) continue;
  console.log(`\n=== ${name} ===`);
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install'], { cwd: dir, stdio: 'inherit' });
  if (r.status !== 0) console.error(`!! npm install failed in ${name}`);
}
