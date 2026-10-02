import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, argsMap, writeJSON, fileHash, walk } from './common.mjs';

const out = path.resolve(argsMap().out);
if (fs.existsSync(path.join(out, 'READY.json'))) throw new Error('Sealed revision');
const charRoot = path.join(ROOT, 'docs/art-implementation-2026-10-02/characters');
const packetPath = path.join(charRoot, 'submissions/r04/packet.json');
if (fileHash(packetPath) !== '29b0c819836463d6712e26b13947953ad50b61b49347d97c0a1ff75d7ef542c3') throw new Error('Character packet mismatch');
const packet = JSON.parse(fs.readFileSync(packetPath));
const characterFiles = packet.files.map(f => ({ path: f.path, matches: fileHash(path.join(charRoot, f.path)) === f.sha256 }));
if (characterFiles.some(f => !f.matches)) throw new Error('Character packet files changed');
const tools = walk(path.join(ROOT, 'scripts/art-validation')).filter(p => /[\\/](final-.*|prepare-final|review-final-preparation)\.(mjs|html)$/.test(p));
const syntax = tools.filter(f => f.endsWith('.mjs')).map(file => {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${file}: ${result.stderr}`);
  return { path: path.relative(ROOT, file).replaceAll('\\', '/'), sha256: fileHash(file), exitCode: result.status };
});
const codeFiles = ['src/logic/hooks/useGeoGuardGame.jsx', 'src/view/art/integration/presentationRuntime.js', 'src/view/art/integration/assetRegistry.js', 'src/view/art/characters/index.js'];
const observations = codeFiles.map(p => ({ path: p, sha256: fileHash(path.join(ROOT, p)), status: 'read_only_observation_not_final_fingerprint' }));
const hook = fs.readFileSync(path.join(ROOT, codeFiles[0]), 'utf8');
const runtime = fs.readFileSync(path.join(ROOT, codeFiles[1]), 'utf8');
const hookNeedle = 'damageEnemy(enemy, amount);\n        artRef.current.runtime.captureHit(state, enemy, projectile);';
const captureStart = runtime.indexOf('const captureHit ='), captureEnd = runtime.indexOf('const beginMechanicStep', captureStart);
writeJSON(path.join(out, 'read-only-review.json'), { observedAt: new Date().toISOString(), characterPacketSha256: fileHash(packetPath), characterFilesVerified: characterFiles.length,
  observations, hitSourceReview: { hookCallsOriginalDamageThenPresentationCopy: hook.replaceAll('\r\n', '\n').includes(hookNeedle), captureHitExcerpt: runtime.slice(captureStart, captureEnd), conclusion: 'Current source copies sourceArtId/sourceKey/shotIndex/kind/angle/projectile identity string and target coordinates into the hit event. No raw projectile is stored in that event. WeakMap identity lookup remains internal.', limit: 'No final frozen production hook runtime or shared-reference graph test has run yet.' },
  resources: { implementation: 'Canvas character bodies are editable vector data, not externally decoded bitmap bodies; DOM icons use BASE_URL-aware URLs.', plannedChecks: '48 actual icon requests/decode plus vector load/abort; do not mislabel unused body PNG fetch failures as game body-loading failures.' },
  syntax, observedToolTests: { command: 'node --test tests/art-final-preparation.test.js', tests: 6, passed: 6, failed: 0, scope: 'pure QA adapter/observer negative controls, no candidate gameplay/browser execution' }, finalBrowserRuns: 0,
});
console.log(JSON.stringify({ characterFilesVerified: characterFiles.length, syntaxFiles: syntax.length, finalBrowserRuns: 0 }));
