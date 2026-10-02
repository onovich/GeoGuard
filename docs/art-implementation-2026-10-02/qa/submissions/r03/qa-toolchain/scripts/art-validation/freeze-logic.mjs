import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, BASELINE, argsMap, walk, writeJSON, sourceManifest, compareManifests, sha256 } from './common.mjs';

const args = argsMap(), out = path.resolve(args.out);
if (fs.existsSync(out)) throw new Error('Refusing to overwrite an existing QA revision');
const scope = ['src/data', 'src/logic/engine'];
const manifest = root => sourceManifest(root).filter(f => scope.some(s => f.path.startsWith(s + '/')));
const before = manifest(ROOT);
const roots = Object.fromEntries(['baseline', 'candidate'].map(name => [name, path.join(out, 'snapshots/node_modules', name)]));
for (const root of Object.values(roots)) writeJSON(path.join(root, 'package.json'), { private: true, type: 'module', description: 'QA generated module loader; not game input' });
for (const f of before) {
  const result = spawnSync('git', ['show', `${BASELINE}:${f.path}`], { cwd: ROOT, maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`Baseline Git read failed: ${f.path}`);
  for (const [name, bytes] of [['baseline', result.stdout], ['candidate', fs.readFileSync(path.join(ROOT, f.path))]]) {
    const target = path.join(roots[name], f.path); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes);
  }
}
const gitPaths = spawnSync('git', ['ls-tree', '-r', '--name-only', BASELINE, '--', ...scope], { cwd: ROOT, encoding: 'utf8' });
if (gitPaths.status || JSON.stringify(gitPaths.stdout.trim().split('\n').sort()) !== JSON.stringify(before.map(f => f.path).sort())) throw new Error('Baseline/candidate protected file sets differ');
const after = manifest(ROOT), copied = manifest(roots.candidate);
if (compareManifests(before, after).length || compareManifests(before, copied).length) throw new Error('Protected source changed while snapshotting');
const imports = [];
for (const [name, root] of Object.entries(roots)) for (const file of walk(path.join(root, 'src'))) {
  for (const match of fs.readFileSync(file, 'utf8').matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
    const resolved = path.resolve(path.dirname(file), match[1]);
    if (!match[1].startsWith('.') || !resolved.startsWith(path.join(root, 'src') + path.sep) || !fs.existsSync(resolved)) throw new Error(`Dependency escapes frozen scope: ${file}: ${match[1]}`);
    imports.push({ snapshot: name, from: path.relative(root, file).replaceAll('\\', '/'), to: path.relative(root, resolved).replaceAll('\\', '/') });
  }
}
const changes = compareManifests(manifest(roots.baseline), copied);
const reverse = (file, text) => {
  if (file.endsWith('/combatFrameRuntime.js')) return text.replace('damageEnemy(enemy, projectile.damage, projectile);', 'damageEnemy(enemy, projectile.damage);').replace('damageEnemy(otherEnemy, projectile.damage * 0.5, projectile);', 'damageEnemy(otherEnemy, projectile.damage * 0.5);');
  if (file.endsWith('/combatOffenseRuntime.js')) return text
    .replace('  sourceArtId: extras.sourceArtId ?? null,\n  sourceUid: extras.sourceUid ?? null,\n  shotIndex: extras.shotIndex ?? 0,\n', '')
    .replace(", sourceArtId: 'hero:PLAYER', sourceUid: 'player', shotIndex: 0", '')
    .replace('              sourceArtId: `tower:${tower.id}`,\n              sourceUid: tower.uid,\n              shotIndex: index,\n', '');
  return text;
};
const audit = copied.map(f => {
  const baseline = fs.readFileSync(path.join(roots.baseline, f.path), 'utf8').replaceAll('\r\n', '\n');
  const candidate = fs.readFileSync(path.join(roots.candidate, f.path), 'utf8').replaceAll('\r\n', '\n');
  return { path: f.path, sameBeforeExceptionRemoval: baseline === candidate, exactAfterOnlyApprovedRemoval: baseline === reverse(f.path, candidate) };
});
const approvals = ['integration/submissions/r01/packet.json', 'reviews/hit-source-and-status-addendum.md'].map(p => {
  const bytes = fs.readFileSync(path.join(ROOT, 'docs/art-implementation-2026-10-02', p));
  const target = path.join(out, 'approvals', path.basename(p)); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes);
  return { path: p, sha256: sha256(bytes) };
});
writeJSON(path.join(out, 'logic-freeze.json'), { generatedAt: new Date().toISOString(), baselineCommit: BASELINE, scope, roots, moduleLoader: 'Generated package.json type=module only; game dependencies exclusively inside the protected scope', baselineManifest: manifest(roots.baseline), candidateManifest: copied, candidateScopeSha256: sha256(JSON.stringify(copied)), baselineScopeSha256: sha256(JSON.stringify(manifest(roots.baseline))), changedWhileCopying: compareManifests(before, after), imports, changes, approvedExceptionAudit: audit, approvals, pass: audit.every(x => x.exactAfterOnlyApprovedRemoval) });
console.log(JSON.stringify({ files: copied.length, imports: imports.length, scopeSha256: sha256(JSON.stringify(copied)), auditPass: audit.every(x => x.exactAfterOnlyApprovedRemoval), roots }));
if (!audit.every(x => x.exactAfterOnlyApprovedRemoval)) process.exitCode = 1;
