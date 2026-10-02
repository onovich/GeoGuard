import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DEFAULT_OUT, ROOT, argsMap, writeJSON, sha256, sourceManifest, compareManifests } from './common.mjs';
import { loadEngine, createScene } from './scene-kit.mjs';
import { gameplaySnapshot } from './snapshot.mjs';

const args = argsMap(), out = path.resolve(args.out ?? DEFAULT_OUT);
const baselineRoot = path.resolve(args.baseline ?? path.join(DEFAULT_OUT, 'baseline/node_modules/geoguard-baseline'));
const candidateRoot = path.resolve(args.candidate ?? ROOT);
const seconds = Number(args['phase-seconds'] ?? 12), seeds = (args.seeds ?? '20261001,7,314159').split(',').map(Number);
const omitProjectileMetadata = args['omit-projectile-metadata'] === 'approved';
if (omitProjectileMetadata && !args['contract-sha']) throw new Error('Approved metadata exclusion must cite contract SHA');
const roots = { baseline: baselineRoot, candidate: candidateRoot }, engines = {}, fingerprints = {};
for (const [name, root] of Object.entries(roots)) {
  fingerprints[name] = sourceManifest(root);
  engines[name] = await loadEngine(p => import(pathToFileURL(path.join(root, 'src', p)).href));
}
if (JSON.stringify(engines.baseline.config.BOSS_ORDER) !== JSON.stringify(engines.candidate.config.BOSS_ORDER)) throw new Error('Boss catalog differs');
fs.mkdirSync(out, { recursive: true });
const digestFile = path.join(out, 'behavior-frame-hashes.jsonl'), fd = fs.openSync(digestFile, 'w');
const cases = [], differences = [];
try {
  for (const bossId of engines.baseline.config.BOSS_ORDER) for (const seed of seeds) for (const hz of [30, 60]) {
    const options = { kind: 'boss', bossId, seed, phaseSeconds: seconds };
    const a = createScene(engines.baseline, options), b = createScene(engines.candidate, options);
    let firstDifference = null;
    const frames = Math.round(seconds * 3 * hz);
    for (let frame = 0; frame < frames; frame++) {
      a.step(1 / hz); b.step(1 / hz);
      const left = gameplaySnapshot(a.state, { omitProjectileMetadata }), right = gameplaySnapshot(b.state, { omitProjectileMetadata });
      const lhs = sha256(JSON.stringify({ state: left, rng: a.random.inspect(), casts: a.casts, hits: a.hits }));
      const rhs = sha256(JSON.stringify({ state: right, rng: b.random.inspect(), casts: b.casts, hits: b.hits }));
      fs.writeSync(fd, JSON.stringify({ bossId, seed, hz, frame, baseline: lhs, candidate: rhs }) + '\n');
      if (lhs !== rhs && firstDifference === null) {
        firstDifference = frame;
        const evidence = `diff-${bossId}-${seed}-${hz}.json`;
        writeJSON(path.join(out, evidence), { frame, options, hz, baseline: { state: left, rng: a.random.inspect(), casts: a.casts, hits: a.hits }, candidate: { state: right, rng: b.random.inspect(), casts: b.casts, hits: b.hits } });
        differences.push({ bossId, seed, hz, firstDifference, evidence });
      }
    }
    cases.push({ bossId, seed, hz, frames, firstDifference, baselineCastCount: a.casts.length, candidateCastCount: b.casts.length });
  }
} finally { fs.closeSync(fd); }
const changedDuringRun = Object.fromEntries(Object.entries(roots).map(([name, root]) => [name, compareManifests(fingerprints[name], sourceManifest(root))]));
const valid = Object.values(changedDuringRun).every(x => !x.length);
writeJSON(path.join(out, 'behavior-comparison.json'), { generatedAt: new Date().toISOString(), scope: 'per-frame constructed boss phase probe; not full hook execution, reward flow or every ability certification', roots, fingerprints, contractSha: args['contract-sha'] ?? null, omitProjectileMetadata, phaseSeconds: seconds, cases, differences, changedDuringRun, valid, pass: valid && !differences.length, limitations: ['No renderer invoked in this Node comparison.', 'Player/tower HP are probe values; boss HP forced at phase boundaries.', 'Summoned deaths use mechanic settlement; this is not normal reward/economy validation.', 'Projectile boundary suites and real UI require separate runs.'] });
console.log(JSON.stringify({ cases: cases.length, frames: cases.reduce((n, c) => n + c.frames, 0), differences: differences.length, valid }));
if (!valid || differences.length) process.exitCode = 1;
