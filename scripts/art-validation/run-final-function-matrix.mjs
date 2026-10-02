import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { argsMap, ROOT, writeJSON } from './common.mjs';
import { verifyFinalLock } from './final-lock.mjs';
const args = argsMap(), lock = verifyFinalLock(path.resolve(args.lock), args['lock-sha']), out = path.resolve(args.out), runs = [];
fs.mkdirSync(out, { recursive: true });
for (const mode of ['resources', 'ui']) for (const [width, height] of [[960, 720], [1280, 720], [1440, 900]]) for (const dpr of [1, 2]) for (const base of ['/', '/geoguard-qa/']) {
  const name = `${mode}-${width}x${height}-dpr${dpr}-${base === '/' ? 'root' : 'nonroot'}`;
  const prior = mode === 'ui' && width === 1440 && dpr === 1 && base === '/' ? path.join(out, '../ui-root-1440-dpr1-01') : mode === 'resources' && width === 1440 && dpr === 1 && base !== '/' ? path.join(out, '../resources-nonroot-1440-dpr1') : null;
  let dir = prior ?? path.join(out, name), reused = Boolean(prior);
  if (!prior) {
    if (fs.existsSync(dir)) throw new Error(`Existing matrix run: ${dir}`);
    const cli = ['scripts/art-validation/final-browser.mjs', '--lock', path.resolve(args.lock), '--lock-sha', args['lock-sha'], '--out', dir, '--browser', args.browser, '--mode', mode, '--base', base, '--width', String(width), '--height', String(height), '--dpr', String(dpr)];
    const result = spawnSync(process.execPath, cli, { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'command.log'), JSON.stringify({ argv: cli, exitCode: result.status, stdout: result.stdout, stderr: result.stderr }, null, 2));
  }
  const report = JSON.parse(fs.readFileSync(path.join(dir, 'report.json')));
  const row = { name, mode, width, height, dpr, base, dir, reused, status: report.status, stable: report.stable, errors: report.errors };
  runs.push(row); writeJSON(path.join(out, 'progress.json'), { runs }); console.log(JSON.stringify({ name, status: row.status, reused }));
}
verifyFinalLock(path.resolve(args.lock), args['lock-sha']);
writeJSON(path.join(out, 'report.json'), { sourceFingerprint: lock.sourceFingerprint, runs, total: runs.length, pass: runs.every(r => r.status === 'executed_requires_review' && r.stable && !r.errors.length), scope: '12 viewport/DPR/base combinations x resource and partial real GUI checks; explicit remaining full flow items remain separate.' });
