import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeState } from '../src/logic/engine/gameState.js';
import { createBossRuntimeEntity, getBossEditorBaseTemplate } from '../src/logic/engine/encounterRuntime.js';
import { tickBossCombatRuntime } from '../src/logic/engine/bossCombatRuntime.js';

const bossFor = (id) => ({ ...createBossRuntimeEntity({ bossTemplate: getBossEditorBaseTemplate(id), uid: 1 }), x: 0, y: 0 });
test('boss previews a fixed target before attacking and offers a recovery opening', () => {
  const state = createRuntimeState();
  const boss = bossFor('HUNTER');
  state.enemies.push(boss);
  state.player.x = 160;
  let fired = 0;
  const step = () => tickBossCombatRuntime({ state, boss, dt: 0.05, runAbility: () => { fired++; } });
  for (let n = 0; n < 80 && boss.bossState.actionMode !== 'windup'; n++) step();
  assert.equal(boss.bossState.actionMode, 'windup');
  assert.equal(fired, 0);
  assert.equal(boss.bossState.lockedPlayerPoint.x, 160);
  state.player.x = 300;
  for (let n = 0; n < 40 && !fired; n++) step();
  assert.equal(fired, 1);
  assert.equal(boss.bossState.lockedPlayerPoint.x, 160);
  assert.equal(boss.bossState.actionMode, 'recover');
  assert.ok(boss.damageTakenMultiplier > 1);
});

test('healing cannot undo a boss phase and dead bosses never attack', () => {
  const state = createRuntimeState();
  const boss = bossFor('BLOOD_FORGE');
  state.enemies.push(boss);
  boss.hp = boss.maxHp * 0.2;
  tickBossCombatRuntime({ state, boss, dt: 0.01 });
  assert.equal(boss.currentPhaseIndex, 2);
  boss.hp = boss.maxHp;
  tickBossCombatRuntime({ state, boss, dt: 0.01 });
  assert.equal(boss.currentPhaseIndex, 2);
  boss.hp = 0;
  let fired = 0;
  for (let n = 0; n < 300; n++) tickBossCombatRuntime({ state, boss, dt: 0.05, runAbility: () => { fired++; } });
  assert.equal(fired, 0);
});

test('a living attack hazard prevents the next main attack but terrain does not stall combat', () => {
  const state = createRuntimeState();
  const boss = bossFor('PRISM');
  state.enemies.push(boss);
  state.hazards.push({ ownerBossUid: 1, timer: 100 });
  for (let n = 0; n < 100; n++) tickBossCombatRuntime({ state, boss, dt: 0.05 });
  assert.notEqual(boss.bossState.actionMode, 'windup');
  state.hazards[0].terrain = true;
  for (let n = 0; n < 20 && boss.bossState.actionMode !== 'windup'; n++) tickBossCombatRuntime({ state, boss, dt: 0.05 });
  assert.equal(boss.bossState.actionMode, 'windup');
});
