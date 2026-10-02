import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { argsMap, writeJSON, sha256, sourceManifest, compareManifests } from './common.mjs';
import { loadEngine } from './scene-kit.mjs';
import { gameplaySnapshot, seededRandom, withRandom } from './snapshot.mjs';

const args = argsMap(), out = path.resolve(args.out), roots = { baseline: path.resolve(args.baseline), candidate: path.resolve(args.candidate) };
const engines = {}, fingerprints = {};
for (const [name, root] of Object.entries(roots)) {
  fingerprints[name] = sourceManifest(root);
  engines[name] = await loadEngine(p => import(pathToFileURL(path.join(root, 'src', p)).href));
}
fs.mkdirSync(out, { recursive: true });
const hashes = fs.openSync(path.join(out, 'frame-hashes.jsonl'), 'w');
const cases = [];
function probe(engine, spec, candidate) {
  const state = engine.state.createRuntimeState(), random = seededRandom(7), events = [], sources = [], births = [], frames = [];
  const ids = new WeakMap(); let nextId = 0, step = -1, inspectionCount = 0, mutationRejected = 0;
  const enemy = (uid, x, y = 0) => ({ uid, x, y, radius: 2, hp: 1e6, maxHp: 1e6, slowRatio: 1, slowTimer: 0, hitFlash: 0 });
  const special = spec.mode !== 'continuous';
  state.enemies = spec.mode === 'splash' ? [enemy(1, 5), enemy(2, 5, 25)] : spec.mode === 'pierce' ? [enemy(1, 5), enemy(2, 10), enemy(3, 15)] : [enemy(1, special ? 5 : 80)];
  const towerId = ({ splash: 'CANNON', pierce: 'SNIPER', four: 'BURST' })[spec.mode] ?? spec.towerId;
  if (towerId) {
    const template = state.towerCatalog.find(t => t.id === towerId);
    const tower = engine.towers.createPlacedTower({ tower: engine.levels.buildTowerAtLevel(template, spec.level ?? 0), uid: 41, x: 0, y: 0 });
    tower.lastShoot = tower.fireRate; state.towers = [tower];
  } else state.player.lastShoot = state.player.shootCd;
  const save = stage => {
    const payload = { state: gameplaySnapshot(state, { omitProjectileMetadata: true }), rng: random.inspect(), events: [...events] };
    frames.push({ step, stage, sha256: sha256(JSON.stringify(payload)), payload });
  };
  const effect = type => (...values) => events.push({ step, type, values });
  const damageEnemy = function (target, amount, projectile) {
    events.push({ step, type: 'damage', target: target.uid, amount });
    if (candidate) {
      assert.equal(arguments.length, 3);
      assert.ok(state.projectiles.includes(projectile), 'callback source is the current live projectile');
      assert.ok(ids.has(projectile), 'callback source has an observed birth');
      const before = JSON.stringify(gameplaySnapshot(state));
      const dto = Object.freeze({ sourceArtId: projectile.sourceArtId, sourceUid: projectile.sourceUid, shotIndex: projectile.shotIndex, kind: projectile.kind, x: projectile.x, y: projectile.y, vx: projectile.vx, vy: projectile.vy });
      assert.ok(Object.values(dto).every(v => v === null || typeof v !== 'object'));
      assert.throws(() => { dto.sourceUid = 'mutation-probe'; }, TypeError); mutationRejected++;
      assert.equal(JSON.stringify(gameplaySnapshot(state)), before, 'source scalar observation did not mutate gameplay'); inspectionCount++;
      sources.push({ step, target: target.uid, amount, birthId: ids.get(projectile), liveAtCallback: true, dto });
    } else assert.equal(arguments.length, 2);
    Object.assign(target, engine.rules.resolveEnemyDamage(target, amount));
  };
  const count = special ? (spec.mode === 'pierce' ? 2 : 1) : spec.hz * 6;
  withRandom(random, () => {
    for (step = 0; step < count; step++) {
      if (!special || step === 0) {
        if (towerId) engine.offense.updateTowerOffenseRuntime({ state, dt: 1 / spec.hz, spawnParticle: effect('particle') });
        else engine.offense.updatePlayerOffenseRuntime({ state, dt: 1 / spec.hz });
      }
      for (const projectile of state.projectiles) if (!ids.has(projectile)) {
        ids.set(projectile, nextId++);
        const owner = towerId ? state.towers[0] : state.player;
        assert.equal(projectile.x, owner.x); assert.equal(projectile.y, owner.y);
        if (candidate) {
          assert.equal(projectile.sourceArtId, towerId ? `tower:${towerId}` : 'hero:PLAYER');
          assert.equal(projectile.sourceUid, towerId ? 41 : 'player');
        }
        births.push({ birthId: ids.get(projectile), step, x: projectile.x, y: projectile.y, ...(candidate ? { sourceArtId: projectile.sourceArtId, sourceUid: projectile.sourceUid, shotIndex: projectile.shotIndex } : {}) });
      }
      save('after-offense');
      engine.frame.updateProjectileRuntime({ state, dt: 1 / spec.hz, damageEnemy, spawnFloatingText: effect('floatingText'), spawnParticle: effect('particle'), spawnImpactWave: effect('impactWave') });
      save('after-projectiles');
    }
  });
  const hits = events.filter(e => e.type === 'damage');
  if (spec.mode === 'same-frame') { assert.equal(births.length, 1); assert.equal(hits.length, 1); assert.equal(state.projectiles.length, 0); }
  if (spec.mode === 'splash') { assert.deepEqual(hits.map(e => [e.target, e.amount]), [[1, 15], [2, 7.5]]); assert.equal(state.projectiles.length, 0); }
  if (spec.mode === 'pierce') { assert.deepEqual(hits.map(e => e.target), [1, 2, 3]); assert.equal(state.projectiles.length, 1); assert.deepEqual([...state.projectiles[0].hitEnemies].map(e => e.uid), [1, 2, 3]); }
  if (spec.mode === 'four') {
    assert.equal(births.length, 4); assert.equal(hits.length, 4); assert.ok(births.every(b => b.x === 0 && b.y === 0)); assert.equal(state.projectiles.length, 0);
    if (candidate) assert.deepEqual(sources.map(s => s.dto.shotIndex), [3, 2, 1, 0]);
  }
  if (spec.mode === 'continuous') { assert.ok(births.length > 1); assert.ok(hits.length > 0); }
  if (candidate) {
    for (const source of sources) assert.equal(source.dto.sourceUid, towerId ? 41 : 'player');
    if (['splash', 'pierce'].includes(spec.mode)) assert.equal(new Set(sources.map(s => s.birthId)).size, 1);
  }
  return { frames, births, sources, events, hitCount: hits.length, inspectionCount, mutationRejected, remainingProjectiles: state.projectiles.length, rng: random.inspect(), finalState: gameplaySnapshot(state, { omitProjectileMetadata: true }) };
}
const specs = [];
for (const hz of [30, 60]) {
  for (const mode of ['same-frame', 'splash', 'pierce', 'four']) specs.push({ mode, hz });
  specs.push({ mode: 'continuous', hz, towerId: null });
  for (const towerId of engines.baseline.config.TOWER_ORDER) for (const level of [0, 1, 2, 3]) specs.push({ mode: 'continuous', hz, towerId, level });
}
try {
  for (const [index, spec] of specs.entries()) {
    const result = { index, spec, pass: false };
    try {
      const baseline = probe(engines.baseline, spec, false), candidate = probe(engines.candidate, spec, true);
      const diffs = [];
      assert.equal(baseline.frames.length, candidate.frames.length);
      for (let i = 0; i < baseline.frames.length; i++) {
        const a = baseline.frames[i], b = candidate.frames[i];
        fs.writeSync(hashes, JSON.stringify({ case: index, step: a.step, stage: a.stage, baseline: a.sha256, candidate: b.sha256 }) + '\n');
        if (a.sha256 !== b.sha256) {
          diffs.push({ step: a.step, stage: a.stage });
          if (diffs.length === 1) writeJSON(path.join(out, `difference-${index}.json`), { baseline: a.payload, candidate: b.payload });
        }
      }
      result.frames = baseline.frames.length / 2; result.comparedStages = baseline.frames.length; result.differences = diffs;
      for (const value of [baseline, candidate]) delete value.frames;
      writeJSON(path.join(out, `case-${String(index).padStart(2, '0')}.json`), { spec, baseline, candidate });
      result.hitCount = candidate.hitCount; result.sourceInspections = candidate.inspectionCount; result.frozenScalarMutationRejected = candidate.mutationRejected; result.pass = diffs.length === 0;
    } catch (error) { result.error = error.stack; }
    cases.push(result);
  }
} finally { fs.closeSync(hashes); }
const changedDuringRun = Object.fromEntries(Object.entries(roots).map(([name, root]) => [name, compareManifests(fingerprints[name], sourceManifest(root))]));
const valid = Object.values(changedDuringRun).every(x => !x.length);
writeJSON(path.join(out, 'report.json'), { scope: 'Frozen actual offense and projectile engines with constructed targets; independent QA scalar sink, not production hook/renderer verification', roots, fingerprints, cases, changedDuringRun, valid, pass: valid && cases.every(c => c.pass), exclusions: ['Only sourceArtId/sourceUid/shotIndex on actual live projectiles are omitted from gameplay snapshots. Source callback lineage is checked separately.', 'Baseline callback has two args; candidate has three. Damage, event order, numeric results and RNG remain exact.', 'Scalar DTO mutation rejection demonstrates the QA sink boundary only. Engine passes a mutable projectile by design; production hook scalar-copy discipline awaits final frozen integration QA.'] });
console.log(JSON.stringify({ cases: cases.length, frames: cases.reduce((n, c) => n + (c.frames ?? 0), 0), sourceInspections: cases.reduce((n, c) => n + (c.sourceInspections ?? 0), 0), failed: cases.filter(c => !c.pass), valid }));
if (!valid || cases.some(c => !c.pass)) process.exitCode = 1;
