import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayerSimulation, clipScreenLine } from '../scripts/player-sim/engine.mjs';

test('player API starts a normal run without debug resources or hidden wave data', () => {
  const sim = createPlayerSimulation({ profile: 'novice', scenario: 'A' });
  const view = sim.observe();
  assert.equal(view.player.hp, 100); assert.equal(view.money, 45); assert.equal(view.wave, 1);
  assert.equal(view.enemies.length, 0); assert.equal(view.catalog.length, 3);
  const forbidden = ['queue', 'bossSpawned', 'abilityCooldowns', 'bossState', 'baseSpeed', 'summonedByBossUid', 'seed', 'debugOptions'];
  const json = JSON.stringify(view);
  for (const key of forbidden) assert.ok(!json.includes(`"${key}"`), key);
  assert.throws(() => sim.debrief(), /after episode/);
  assert.throws(() => sim.act({ type: 'force-phase' }), /Unsupported/);
});

test('observing cannot move time forward and short actions pay the reaction floor', () => {
  const sim = createPlayerSimulation({ profile: 'novice' });
  sim.observe(); sim.observe(); assert.equal(sim.observe().elapsed, 0);
  const response = sim.act({ type: 'move', move: { x: 1, y: 0 }, seconds: 0.01 });
  assert.equal(response.observation.elapsed, 0.7);
  assert.ok(response.observation.player.x > 640);
  assert.equal(response.observation.enemies.length, 0); // The newly spawned enemy is still off-screen.
});

test('building costs actual money and time and a rejected placement is not a free query', () => {
  const sim = createPlayerSimulation({ profile: 'builder' });
  let result = sim.act({ type: 'build', towerId: 'BASIC', x: 710, y: 420 });
  assert.equal(result.feedback, 'ok'); assert.equal(result.observation.money, 30);
  assert.equal(result.observation.elapsed, 0.9); assert.equal(result.observation.towers.length, 1);
  result = sim.act({ type: 'build', towerId: 'BASIC', x: 710, y: 420 });
  assert.match(result.feedback, /重叠/); assert.equal(result.observation.elapsed, 1.8);
  assert.equal(result.observation.money, 30);
  result = sim.act({ type: 'build', towerId: 'SNIPER', x: 550, y: 420 });
  assert.equal(result.feedback, '资金不足');
  result = sim.act({ type: 'stop' }); assert.equal(result.debrief.buildRejected, 2);
});

test('clipped telegraphs reveal no off-screen endpoints', () => {
  assert.deepEqual(clipScreenLine({ x: -100, y: 100, x2: 500, y2: 100 }, 390, 844), { x: 0, y: 100, x2: 390, y2: 100 });
  assert.equal(clipScreenLine({ x: -100, y: -100, x2: -50, y2: -50 }, 390, 844), null);
});

test('separate sessions reproduce deterministic observations without sharing state', () => {
  const a = createPlayerSimulation({ profile: 'mobile', scenario: 'B' });
  const b = createPlayerSimulation({ profile: 'mobile', scenario: 'B' });
  for (let index = 0; index < 20; index++) {
    const action = { type: 'move', move: { x: index % 2 ? 0.6 : -0.6, y: 0.5 }, seconds: 0.3 };
    assert.deepEqual(a.act(action).observation, b.act(action).observation);
  }
  assert.equal(a.observe().viewport.width, 390);
});

test('normal player can die and episode summary is available only afterward', () => {
  const sim = createPlayerSimulation({ profile: 'novice' });
  let result;
  for (let index = 0; index < 200; index++) {
    result = sim.act({ type: 'wait', seconds: 3 });
    if (result.debrief) break;
  }
  assert.equal(result.observation.status, 'dead');
  assert.ok(result.debrief.elapsed < 600); assert.equal(result.debrief.hp, 0);
  assert.ok(result.debrief.playerDamage['enemy-contact-or-ability'] >= 100);
});
