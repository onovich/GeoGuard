import test from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_ORDER } from '../src/data/gameConfig.js';
import { simulateBoss, SIMULATION_SEEDS } from '../scripts/boss-simulation.mjs';
import { createWaveDefinition } from '../src/logic/engine/gameRules.js';
import { createRuntimeState } from '../src/logic/engine/gameState.js';
import { spawnBossEncounterRuntimeAt } from '../src/logic/engine/entitySpawnRuntime.js';
import { getBossEditorBaseTemplate, createTwinsEncounterMembers } from '../src/logic/engine/encounterRuntime.js';
import { settleEnemyDefeatRuntime, settlePendingBossRewardRuntime } from '../src/logic/engine/enemyDefeatRuntime.js';
import { enrageTwinRuntime } from '../src/logic/engine/bossCombatRuntime.js';
import { spawnBossMechanic } from '../src/logic/engine/bossMechanicEntities.js';
import { createAreaHazard } from '../src/logic/engine/battlefieldRules.js';
import { updateHazardRuntime } from '../src/logic/engine/combatFrameRuntime.js';

for (const id of BOSS_ORDER) test(`${id}: all phases execute at 30 and 60 Hz with bounded summons`, () => {
  for (const seed of SIMULATION_SEEDS) for (const hz of [30, 60]) {
    const result = simulateBoss({ id, hz, seed });
    assert.ok(result.maxSummons <= 24, JSON.stringify(result));
    assert.ok(result.maxMechanics <= 10);
    assert.ok(result.maxHazards <= 32);
    assert.ok(result.bossPhases.every((phase) => phase === 2));
    for (const role of id === 'TWINS' ? ['sun', 'moon'] : ['boss']) {
      for (let phase = 0; phase < 3; phase++) assert.ok(Object.keys(result.phaseCasts).some((key) => key.startsWith(`${role}:${phase}:`)), `${id} ${hz} ${role} phase ${phase}`);
    }
    const template = getBossEditorBaseTemplate(id);
    const members = id === 'TWINS' ? createTwinsEncounterMembers(template) : [template];
    for (const member of members) for (const [phaseIndex, phase] of member.phases.entries()) {
      const role = member.form === 'twinSun' ? 'sun' : member.form === 'twinMoon' ? 'moon' : 'boss';
      for (const ability of phase.abilities) assert.ok(result.phaseCasts[`${role}:${phaseIndex}:${ability}`], `${id} ${hz} missing ${phaseIndex}:${ability}`);
    }
  }
});

test('fixed seed reproduces the production simulation exactly', () => {
  assert.deepEqual(simulateBoss({ id: 'SPIDER_MATRIARCH', hz: 30 }), simulateBoss({ id: 'SPIDER_MATRIARCH', hz: 30 }));
});

test('all 34 formal waves instantiate the intended tier and twin encounter', () => {
  for (let wave = 1; wave <= 34; wave++) {
    const state = createRuntimeState(), definition = createWaveDefinition(wave);
    const bosses = spawnBossEncounterRuntimeAt({ state, bossTemplate: definition.boss, x: 0, y: 0 });
    assert.equal(bosses.length, definition.boss.id.startsWith('TWINS') ? 2 : 1);
    const tier = Number(definition.boss.id.match(/_T([123])$/)?.[1] ?? 3);
    assert.ok(bosses.every((boss) => boss.phases.length === tier));
    assert.equal(bosses.reduce((value, boss) => value + boss.value, 0), definition.boss.value);
  }
});

test('all 34 formal encounters clean mechanisms, pay one bounty and open one reward', () => {
  const noop = () => {};
  for (let wave = 1; wave <= 34; wave++) {
    const state = createRuntimeState(), definition = createWaveDefinition(wave);
    const initialMoney = state.money;
    const bosses = spawnBossEncounterRuntimeAt({ state, bossTemplate: definition.boss, x: 0, y: 0 });
    let rewardCount = 0, rewardActive = false;
    const openBossReward = () => { rewardCount++; rewardActive = true; };
    const settle = (enemy) => settleEnemyDefeatRuntime({ state, enemy, enemyIndex: state.enemies.indexOf(enemy),
      spawnParticle: noop, spawnAround: noop, playBossDefeatCue: noop, syncHudMoney: noop, openBossReward,
      enrageEncounterPartner: (defeated) => enrageTwinRuntime(state, defeated) });
    for (const boss of bosses) {
      const root = spawnBossMechanic({ state, boss, kind: 'root', x: boss.x + 100, y: 120 });
      assert.ok(root);
      state.hazards.push(createAreaHazard(state.player, root.x, root.y, { terrain: true, ownerBossUid: boss.uid, ownerMechanicUid: root.uid }));
      state.hazards.push(createAreaHazard(state.player, 400, 400, { delay: 0.1, ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid }));
      boss.hp = 0; settle(boss);
    }
    for (const enemy of [...state.enemies]) if (enemy.hp <= 0) settle(enemy);
    updateHazardRuntime({ state, dt: 2, damageTarget: noop, spawnImpactWave: noop, syncHudHealth: noop });
    settlePendingBossRewardRuntime({ state, rewardActive, openBossReward });
    rewardActive = true;
    settlePendingBossRewardRuntime({ state, rewardActive, openBossReward });
    assert.equal(state.enemies.length, 0, `wave ${wave}`);
    assert.equal(state.hazards.length, 0);
    assert.equal(state.drops.length, 0);
    assert.equal(state.money - initialMoney, definition.boss.value);
    assert.equal(rewardCount, 1);
  }
});
