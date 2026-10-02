import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../scripts/art-validation/common.mjs';
import { adaptFinalInputs, detectSharedObjects } from '../scripts/art-validation/final-inputs.mjs';
import { summarizeRafProbe, compareDensity, instrumentDensityObservation } from '../scripts/art-validation/final-performance.mjs';
import { createSkillObserver } from '../scripts/art-validation/final-skill-observer.mjs';

const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p)));
test('final adapter retains exact approved keys and distinct multi-sample/scale filenames without mutating producer DTOs', () => {
  const prefix = 'docs/art-implementation-2026-10-02';
  const input = read(`${prefix}/characters/submissions/r04/qa-action-inputs-375.json`);
  const actions = read(`${prefix}/qa/submissions/r01/action-coverage.json`).actions.map(x => x.key);
  const skills = read(`${prefix}/qa/submissions/r01/skill-coverage.json`).skills.map(x => x.key);
  const before = JSON.stringify(input), result = adaptFinalInputs(input, actions, skills);
  assert.equal(JSON.stringify(input), before);
  assert.equal(result.counts.actions, 375); assert.equal(result.counts.skillKeys, 95);
  assert.equal(result.counts.inputDefects, 0); assert.equal(result.counts.pendingCaptures, 0);
  assert.equal(new Set(result.samples.map(s => s.id)).size, result.samples.length);
  assert.ok(result.samples.every(s => s.runtimeDispatchProven === false && s.visualStatus === 'not_run'));
  const corrupt = structuredClone(input); corrupt.entries[1].key = corrupt.entries[0].key;
  assert.throws(() => adaptFinalInputs(corrupt, actions, skills));
  const missing = structuredClone(input); missing.entries[0].samples[0].runtimeActor.radius = null;
  assert.ok(adaptFinalInputs(missing, actions, skills).defects.length > 0);
});
test('shared-object check catches nested raw projectiles and Set-held live enemies but accepts copied scalars', () => {
  const enemy = { uid: 1 }, projectile = { sourceUid: 41, hitEnemies: new Set([enemy]) };
  const state = { projectiles: [projectile], enemies: [enemy] };
  assert.deepEqual(detectSharedObjects(state, { event: { sourceUid: projectile.sourceUid } }), []);
  assert.ok(detectSharedObjects(state, { nested: { raw: projectile } }).length > 0);
  assert.ok(detectSharedObjects(state, { copiedSet: new Set([enemy]) }).length > 0);
});
const perf = () => ({ done: true, start: 0, warmup: 10, duration: 60, frames: Array.from({ length: 3600 }, (_, i) => ({ at: 10000 + i * 1000 / 60, interval: 1000 / 60 })), density: Array.from({ length: 121 }, (_, i) => ({ at: 10000 + i * 500, gameTime: 10 + i / 2, enemies: 24, towers: 9, projectiles: 12, hazards: 4, bosses: 1 })), visibility: [{ state: 'visible' }] });
test('RAF evidence requires real game progression and visible full-duration samples', () => {
  assert.equal(summarizeRafProbe(perf()).valid, true);
  const paused = perf(); paused.density.forEach(d => d.gameTime = 10); assert.equal(summarizeRafProbe(paused).valid, false);
  const hidden = perf(); hidden.visibility.push({ state: 'hidden' }); assert.equal(summarizeRafProbe(hidden).valid, false);
  const early = perf(); early.density = early.density.slice(0, 10); assert.equal(summarizeRafProbe(early).valid, false);
});
test('unequal actual density suppresses a misleading direct performance regression ratio', () => {
  const a = summarizeRafProbe(perf()), other = perf(); other.density.forEach(d => d.enemies = 5);
  const b = summarizeRafProbe(other); assert.equal(compareDensity(a, b).comparable, false); assert.equal(compareDensity(a, b).directRegressionRatio, null);
  assert.equal(compareDensity(a, a).comparable, true);
});
test('read-only served instrumentation refuses unknown entry and does not return the live runtime object', () => {
  const code = 'export const drawGameScene = (ctx, canvas, options) => { return options; };';
  const injected = instrumentDensityObservation(code);
  assert.ok(injected.includes('options.state')); assert.ok(injected.includes('worldHazards:'));
  assert.ok(!injected.includes('__GEOGUARD_FINAL_DENSITY__(qaObserved)'));
  assert.throws(() => instrumentDensityObservation('unknown renderer'));
});
test('skill observations cannot certify a pose fixture or merge lifecycle stages across different casts', () => {
  const observer = createSkillObserver();
  const snap = mode => ({ control: { droppedEvents: 0 }, semantic: { state: { gameTime: 1, hazards: [], enemies: [{ uid: 1, id: 'HIVE', isBoss: true, currentPhaseIndex: 0, bossState: { castAbility: 'spawnHive', actionMode: mode } }] } } });
  assert.throws(() => observer.ingest(snap('attack'), { source: 'pose-fixture' }));
  for (const [frame, mode] of ['windup', 'attack', 'recover'].entries()) observer.ingest(snap(mode), { source: 'window.__GEOGUARD_ART_QA__.snapshot', inputTrace: 'unit-test-only', frame });
  assert.equal(observer.report().casts[0].runtimeStatus, 'lifecycle_observed_requires_effect_cleanup_review');
  assert.equal(observer.report().visualApproved, false);
  observer.ingest(snap('windup'), { source: 'window.__GEOGUARD_ART_QA__.snapshot', inputTrace: 'unit-test-only', frame: 3 });
  assert.equal(observer.report().casts.length, 2); assert.equal(observer.report().casts[1].runtimeStatus, 'partial');
});
