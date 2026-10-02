import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlaytestTelemetry } from '../src/logic/engine/playtestTelemetry.js';
import { createRuntimeState } from '../src/logic/engine/gameState.js';

const viewport = { width: 390, height: 844 };
test('human telemetry correlates operations, economy and wave pressure without changing gameplay state', () => {
  let clock = 100000;
  const log = createPlaytestTelemetry({ now: () => clock });
  const state = createRuntimeState();
  const before = JSON.stringify(state);
  log.start(state, { sessionId: 'test', build: 'test', viewport });
  log.frame(state, 0.1, { x: 1, y: 0, device: 'touch' }, { x: 0, y: 0 }, viewport);
  assert.equal(JSON.stringify(state), before);
  state.money -= 15; log.money(state, 'build');
  state.towers.push({ id: 'BASIC', x: 70, y: 0, hp: 40 }); log.syncEntities(state);
  state.enemies.push({ id: 'COMMANDER', isBoss: true, radius: 20, x: 1000, y: 0, hp: 100, maxHp: 100, currentPhaseIndex: 0, bossState: { actionMode: 'windup' } }); log.syncEntities(state);
  state.player.hp -= 20; log.damage(state, state.player, 20, 0, 'telegraphed-hazard');
  state.enemies[0].currentPhaseIndex = 1; state.enemies[0].bossState.actionMode = 'recover';
  clock += 5000; state.gameTime = 2;
  log.frame(state, 0.5, { x: 0, y: 0, device: 'keyboard' }, { x: 0, y: 0 }, viewport);
  const report = log.export(state, viewport);
  assert.equal(report.current.wallSeconds, 5);
  assert.equal(report.current.battleSeconds, 2);
  assert.equal(report.waves[1].damageToPlayer, 20);
  assert.equal(report.waves[1].moneyChanges.build, -15);
  assert.equal(report.waves[1].bossOffscreenSeconds, 0.5);
  assert.equal(report.samples.at(-1).enemies.visible, 0);
  assert.ok(report.events.some(e => e.type === 'boss_state' && e.phase === 1 && e.action === 'recover'));
  report.waves[1].damageToPlayer = 999;
  assert.equal(log.export(state, viewport).waves[1].damageToPlayer, 20);
});

test('bounded records disclose truncation while aggregates survive and death report is frozen', () => {
  const log = createPlaytestTelemetry({ now: () => 100000, eventLimit: 3, sampleLimit: 2 });
  const state = createRuntimeState(); log.start(state, { sessionId: 'limits' });
  for (let i = 0; i < 5; i++) { state.gameTime = i * 2; state.money++; log.money(state, 'pickup'); log.sample(state, viewport); }
  log.end(state, 'dead', viewport);
  const frozen = log.export(state, viewport);
  assert.equal(frozen.outcome, 'dead'); assert.equal(frozen.events.length, 3);
  assert.equal(frozen.samples.length, 2); assert.ok(frozen.truncation.eventsDropped > 0);
  assert.equal(frozen.waves[1].moneyChanges.pickup, 5);
  log.event(state, 'should-not-record'); assert.deepEqual(log.export(state, viewport), frozen);
});

test('enemy removals are distinguished from confirmed defeats and a fresh run resets counters', () => {
  const log = createPlaytestTelemetry(); const state = createRuntimeState();
  log.start(state, { sessionId: 'one' });
  const enemy = { id: 'TEST', hp: 10, x: 0, y: 0, radius: 5 }; state.enemies.push(enemy); log.syncEntities(state);
  state.enemies = []; log.syncEntities(state);
  assert.equal(log.export(state, viewport).waves[1].defeated.TEST, undefined);
  log.defeated(state, enemy); assert.equal(log.export(state, viewport).waves[1].defeated.TEST, 1);
  log.start(state, { sessionId: 'two' }); assert.deepEqual(log.export(state, viewport).waves[1].defeated, {});
});

test('small continuous damage is summed before display rounding', () => {
  const log = createPlaytestTelemetry(); const state = createRuntimeState();
  log.start(state, { sessionId: 'precision' });
  for (let i = 0; i < 1000; i++) log.damage(state, state.player, 0.001);
  assert.ok(Math.abs(log.export(state, viewport).waves[1].damageToPlayer - 1) < 1e-9);
});
