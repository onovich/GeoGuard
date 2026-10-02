import test from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_TYPES, STARTING_MONEY, TOWER_LIBRARY, createInitialTowerCatalog } from '../src/data/gameConfig.js';
import { getBossPresentation } from '../src/data/bossPresentation.js';
import { createRuntimeState } from '../src/logic/engine/gameState.js';
import { createWaveDefinition } from '../src/logic/engine/gameRules.js';
import { settleEnemyDefeatRuntime } from '../src/logic/engine/enemyDefeatRuntime.js';
import { updateDropRuntime } from '../src/logic/engine/combatFrameRuntime.js';
import { createBossEncounterRuntime, enrichBossTemplate } from '../src/logic/engine/encounterRuntime.js';
import { applyRewardChoiceEffects, materializeRewardChoices } from '../src/logic/engine/rewardRules.js';

const defeat = (state, enemy) => {
  state.enemies = [enemy];
  settleEnemyDefeatRuntime({ state, enemy, enemyIndex: 0,
    spawnParticle() {}, spawnAround() {}, playBossDefeatCue() {},
    syncHudMoney() {}, openBossReward() {}, enrageEncounterPartner() {},
  });
};

test('wave boss bounty cannot be collected a second time', () => {
  for (const mode of ['normal', 'debug']) {
    const state = createRuntimeState();
    state.mode = mode;
    state.debugWaveFlow = mode === 'debug';
    state.money = 0;
    defeat(state, { uid: 1, hp: 0, x: 0, y: 0, value: 254, isBoss: true });
    updateDropRuntime({ state, dt: 0.016, syncHudMoney() {}, pulsePlayerPickupRadius() {} });
    assert.equal(state.money, 254);
    assert.equal(state.drops.length, 0);
  }
});

test('sandbox high-value gems stay small and preserve pickup value', () => {
  const state = createRuntimeState();
  state.mode = 'debug';
  state.money = 0;
  defeat(state, { uid: 1, hp: 0, x: 0, y: 0, value: 10000, isBoss: true });
  assert.equal(state.drops[0].radius, 12);
  updateDropRuntime({ state, dt: 0.016, syncHudMoney() {}, pulsePlayerPickupRadius() {} });
  assert.equal(state.money, 10000);
  defeat(state, { hp: 0, x: 0, y: 0, value: 0 });
  assert.equal(state.drops.length, 0);
});

test('tiered bosses receive authored phases and twin encounters retain tier limits', () => {
  for (const tier of [1, 2, 3]) {
    const commander = enrichBossTemplate(BOSS_TYPES[`COMMANDER_T${tier}`]);
    assert.equal(commander.phases.length, tier);
    assert.ok(commander.phases[0].abilities.includes('commandLine'));
    assert.equal(getBossPresentation(commander.id), getBossPresentation('COMMANDER'));
    let uid = 0;
    const twins = createBossEncounterRuntime({ bossTemplate: BOSS_TYPES[`TWINS_T${tier}`], x: 0, y: 0,
      allocateEnemyUid: () => ++uid, allocateEncounterUid: () => 1 });
    assert.equal(twins.length, 2);
    assert.equal(twins[0].encounterUid, twins[1].encounterUid);
    assert.equal(twins[0].phases.length, tier);
    assert.equal(twins[1].phases.length, tier);
    assert.equal(twins.reduce((sum, boss) => sum + boss.value, 0), BOSS_TYPES[`TWINS_T${tier}`].value);
  }
});

test('first waves introduce fast and heavy enemies before advanced combinations', () => {
  assert.ok(STARTING_MONEY >= TOWER_LIBRARY.CANNON.cost);
  assert.deepEqual([...new Set(createWaveDefinition(1).queue)], ['BASIC']);
  assert.ok(createWaveDefinition(2).queue.includes('FAST'));
  assert.ok(!createWaveDefinition(2).queue.includes('PHASE'));
  assert.ok(createWaveDefinition(3).queue.includes('TANK'));
  assert.ok(createWaveDefinition(3).queue.length < 25);
});

test('blueprint rewards fund the stated subsidy', () => {
  const catalog = createInitialTowerCatalog();
  const [unlock, upgrade] = materializeRewardChoices(catalog, [{ type: 'unlock', towerId: 'FROST' }, { type: 'upgrade', towerId: 'BASIC' }]);
  const unlocked = applyRewardChoiceEffects({ catalog, choice: unlock, money: 0, hp: 70, maxHp: 100 });
  assert.equal(unlocked.money, TOWER_LIBRARY.FROST.cost);
  const upgraded = applyRewardChoiceEffects({ catalog: unlocked.catalog, choice: upgrade, money: 0, hp: 70, maxHp: 100 });
  assert.equal(upgraded.money, upgraded.catalog.find((tower) => tower.id === 'BASIC').cost - TOWER_LIBRARY.BASIC.cost);
  assert.equal(upgraded.hp, 70);
});
