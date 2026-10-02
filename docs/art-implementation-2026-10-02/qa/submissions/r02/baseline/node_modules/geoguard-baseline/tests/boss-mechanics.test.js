import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeState } from '../src/logic/engine/gameState.js';
import { getBossEditorBaseTemplate } from '../src/logic/engine/encounterRuntime.js';
import { spawnBossEncounterRuntimeAt, spawnEnemyGroupRuntime } from '../src/logic/engine/entitySpawnRuntime.js';
import { runBossOptimizedAbility } from '../src/logic/engine/bossOptimizedAbilities.js';
import { spawnBossMechanic, tickBossMechanicRuntime, settleMechanicDefeatRuntime, expireBossMechanicsRuntime } from '../src/logic/engine/bossMechanicEntities.js';
import { enrageTwinRuntime, tickBossCombatRuntime, updateBossDefenseRuntime } from '../src/logic/engine/bossCombatRuntime.js';
import { createAreaHazard, createLineHazard } from '../src/logic/engine/battlefieldRules.js';
import { updateHazardRuntime, updateProjectileRuntime } from '../src/logic/engine/combatFrameRuntime.js';
import { createProjectile } from '../src/logic/engine/combatOffenseRuntime.js';
import { resolveEnemyDamage } from '../src/logic/engine/combatRules.js';
import { shouldTriggerBossClimaxAccent } from '../src/logic/engine/bossPhasePresentationRuntime.js';
import { updateEnemyBehaviorRuntime } from '../src/logic/engine/enemyBehaviorRuntime.js';
import { settleEnemyDefeatRuntime } from '../src/logic/engine/enemyDefeatRuntime.js';
import { findNearestTarget } from '../src/logic/engine/gameRules.js';

const noop = () => {};
const fixture = (id) => {
  const state = createRuntimeState(); state.player.x = 250; state.money = 40;
  const bosses = spawnBossEncounterRuntimeAt({ state, bossTemplate: getBossEditorBaseTemplate(id), x: 0, y: 0 });
  const boss = bosses[0]; boss.currentPhaseIndex = 0;
  const context = { state, boss, syncHudMoney: noop, spawnFloatingText: noop,
    spawnAround: (source, enemyKey, count, radius, options) => spawnEnemyGroupRuntime({ state, source, enemyKey, count, radius, options }),
    queueAreaHazard: (x, y, options) => state.hazards.push(createAreaHazard(state.player, x, y, options)),
    queueLineHazard: (source, target, options) => state.hazards.push(createLineHazard(source, target, options)) };
  const cast = (abilityName) => runBossOptimizedAbility({ ...context, abilityName });
  return { state, boss, bosses, context, cast };
};

test('commander guards protect the boss and breaking them restores damage', () => {
  const { state, boss, context } = fixture('COMMANDER');
  context.spawnAround(boss, 'BASIC', 2, 40);
  updateBossDefenseRuntime(state, boss); assert.equal(boss.damageTakenMultiplier, 0.7);
  state.enemies.filter((enemy) => !enemy.isBoss).forEach((enemy) => { enemy.hp = 0; });
  updateBossDefenseRuntime(state, boss); assert.equal(boss.damageTakenMultiplier, 1);
});

test('fortress armor changes to an actual recovery damage opening', () => {
  const { state, boss } = fixture('FORTRESS');
  updateBossDefenseRuntime(state, boss); assert.equal(resolveEnemyDamage(boss, 10).appliedDamage, 8);
  boss.bossState.actionMode = 'recover'; updateBossDefenseRuntime(state, boss);
  assert.equal(resolveEnemyDamage(boss, 10).appliedDamage, 16);
});

test('recovery begins after the attack hazard finishes', () => {
  const { state, boss } = fixture('PRISM');
  boss.bossState.actionMode = 'windup'; boss.bossState.actionTimer = 0;
  boss.bossState.castAbility = 'prismBeam';
  tickBossCombatRuntime({ state, boss, dt: 0.01, runAbility: () => state.hazards.push({ ownerBossUid: boss.uid }) });
  assert.equal(boss.bossState.actionMode, 'attack'); assert.equal(boss.damageTakenMultiplier, 1);
  state.hazards = [];
  tickBossCombatRuntime({ state, boss, dt: 0.01 });
  assert.equal(boss.bossState.actionMode, 'recover'); assert.ok(boss.damageTakenMultiplier > 1);
});

test('collector debits only on a successful courier spawn and refunds exactly once', () => {
  const { state, cast } = fixture('COLLECTOR');
  cast('stealMoney'); assert.equal(state.money, 28);
  const courier = state.enemies.find((enemy) => enemy.mechanic?.kind === 'courier');
  courier.hp = 0;
  assert.equal(settleMechanicDefeatRuntime({ state, enemy: courier }), 12);
  assert.equal(settleMechanicDefeatRuntime({ state, enemy: courier }), 0);
  assert.equal(state.money, 40);
  for (let n = 0; n < 6; n++) cast('stealMoney');
  assert.equal(state.enemies.filter((enemy) => enemy.hp > 0 && enemy.mechanic?.kind === 'courier').length, 3);
  assert.equal(state.money, 4);
});

test('escaped courier does not refund; killing its boss recovers pending cargo', () => {
  const { state, boss, cast, context } = fixture('COLLECTOR'); cast('stealMoney');
  const courier = state.enemies.at(-1);
  tickBossMechanicRuntime({ ...context, enemy: courier, dt: 9 });
  assert.equal(settleMechanicDefeatRuntime({ state, enemy: courier }), 0);
  cast('stealMoney'); const pending = state.enemies.at(-1);
  expireBossMechanicsRuntime(state, boss); assert.equal(pending.hp, 0);
  assert.equal(settleMechanicDefeatRuntime({ state, enemy: pending }), 12);
});

test('destroying a frost seal interrupts tower freezing', () => {
  const { state, cast, context } = fixture('FROST_JUDGE');
  const tower = { uid: 900, x: 100, y: 100, radius: 18, hp: 100, cost: 30, frozenTimer: 0 };
  state.towers.push(tower); cast('freezeTower');
  const seal = state.enemies.at(-1); seal.hp = 0;
  tickBossMechanicRuntime({ ...context, enemy: seal, dt: 2 }); assert.equal(tower.frozenTimer, 0);
  cast('freezeTower'); tickBossMechanicRuntime({ ...context, enemy: state.enemies.at(-1), dt: 1.6 });
  assert.equal(tower.frozenTimer, 1.6);
});

test('destroyed web cancels its terrain; roots grow within a hard cap and expire with their boss', () => {
  const { state, boss, cast, context } = fixture('NIGHTMARE_BLOOM');
  cast('seedPods');
  for (let step = 0; step < 8; step++) for (const enemy of [...state.enemies]) if (enemy.mechanic) tickBossMechanicRuntime({ ...context, enemy, dt: 1 });
  assert.equal(state.enemies.filter((enemy) => enemy.hp > 0 && enemy.mechanic?.kind === 'root').length, 5);
  const root = state.enemies.find((enemy) => enemy.mechanic); root.hp = 0;
  settleMechanicDefeatRuntime({ state, enemy: root });
  assert.ok(state.hazards.every((hazard) => hazard.ownerMechanicUid !== root.uid));
  expireBossMechanicsRuntime(state, boss); assert.equal(state.hazards.length, 0);
  assert.ok(state.enemies.filter((enemy) => enemy.mechanic).every((enemy) => enemy.hp === 0));
});

test('walls preserve a central exit, avoid existing towers and are shootable at 30 Hz', () => {
  const { state, boss, cast } = fixture('LABYRINTH_KEEPER');
  boss.bossState.lockedPlayerPoint = { x: 250, y: 0 }; cast('raiseWalls');
  const walls = state.enemies.filter((enemy) => enemy.mechanic?.solid);
  assert.equal(walls.length, 8);
  assert.ok(walls.every((wall) => Math.abs(wall.y) >= 60));
  const wall = walls[0];
  state.projectiles.push(createProjectile(wall.x - 60, wall.y, 0, 4000, 30, { radius: 3 }));
  updateProjectileRuntime({ state, dt: 1 / 30, damageEnemy: (enemy, amount) => Object.assign(enemy, resolveEnemyDamage(enemy, amount)),
    spawnFloatingText: noop, spawnParticle: noop, spawnImpactWave: noop });
  assert.ok(wall.hp <= 0);
});

test('marked sacrifice can be stopped before execution and consumed minions grant no loot', () => {
  const { state, boss, context, cast } = fixture('BLOOD_FORGE');
  context.spawnAround(boss, 'BASIC', 2, 40);
  const victims = state.enemies.filter((enemy) => !enemy.isBoss);
  boss.bossState.sacrificeTargets = victims.map((enemy) => enemy.uid);
  victims[0].hp = 0; boss.hp = boss.maxHp - 100;
  cast('sacrificeMinions'); assert.equal(boss.hp, boss.maxHp - 72);
  assert.equal(boss.shield, 24); assert.equal(victims[1].consumed, true);
  assert.equal(victims[0].consumed, undefined);
  settleEnemyDefeatRuntime({ state, enemy: victims[1], enemyIndex: state.enemies.indexOf(victims[1]), spawnParticle: noop, spawnAround: noop,
    playBossDefeatCue: noop, syncHudMoney: noop, openBossReward: noop, enrageEncounterPartner: noop });
  assert.equal(state.drops.length, 0);
});

test('each twin survivor gains its distinct solo skill only once', () => {
  for (const deadIndex of [0, 1]) {
    const { state, bosses } = fixture('TWINS'); bosses[deadIndex].hp = 0;
    const survivor = enrageTwinRuntime(state, bosses[deadIndex]);
    const expected = survivor.twinRole === 'sun' ? 'soloSolarVolley' : 'soloLunarOrbit';
    assert.ok(survivor.phases.every((phase) => phase.abilities.includes(expected) && !phase.abilities.includes('twinCrossfire')));
    assert.equal(enrageTwinRuntime(state, bosses[deadIndex]), null);
  }
});

test('astrolabe pull affects only in-range entities and stays bounded', () => {
  const { state, cast } = fixture('ASTROLABE');
  state.towers.push({ uid: 1, x: 700, y: 0, radius: 18, hp: 100 });
  state.player.x = 60; cast('singularity');
  assert.equal(state.towers[0].x, 700); // No immediate global displacement.
  updateHazardRuntime({ state, dt: 2, damageTarget: noop, spawnImpactWave: noop, syncHudHealth: noop });
  assert.equal(state.towers[0].x, 700); assert.ok(state.player.x >= 44);
});

test('conductor phrase timings use the active phase beat', () => {
  const { state, boss, cast } = fixture('VOID_CONDUCTOR');
  boss.currentPhaseIndex = 2; cast('conductLines');
  assert.deepEqual(state.hazards.map((hazard) => hazard.timer), [0.55, 1.1]);
});

test('summoned descendants and structures share the encounter budget', () => {
  const { state, bosses, context } = fixture('TWINS');
  context.spawnAround(bosses[0], 'BASIC', 24, 40);
  assert.equal(context.spawnAround(bosses[1], 'BASIC', 4, 40), 0);
  assert.equal(spawnBossMechanic({ state, boss: bosses[1], kind: 'root', x: 90, y: 90 }), null);
});

test('breaking a rail reticle cancels targeted tower damage', () => {
  const { state, cast, context } = fixture('RAIL_WARLORD');
  state.towers.push({ uid: 900, x: 100, y: 100, radius: 18, hp: 100 });
  cast('markTower'); const reticle = state.enemies.at(-1); reticle.hp = 0;
  tickBossMechanicRuntime({ ...context, enemy: reticle, dt: 1.6 });
  assert.equal(state.hazards.length, 0);
  cast('markTower'); tickBossMechanicRuntime({ ...context, enemy: state.enemies.at(-1), dt: 1.6 });
  assert.equal(state.hazards.length, 1); assert.equal(state.hazards[0].damage, 22);
});

test('tier one and two do not gain the full boss climax accent', () => {
  const { boss } = fixture('DRAGON');
  boss.currentPhaseIndex = 0; boss.phases = boss.phases.slice(0, 1);
  assert.equal(shouldTriggerBossClimaxAccent(boss), false);
  const full = fixture('DRAGON').boss; full.currentPhaseIndex = 2;
  assert.equal(shouldTriggerBossClimaxAccent(full), true);
});

test('boss recovery is a safe contact window and targeting ignores destroyed mechanisms', () => {
  const { state, boss, context } = fixture('HUNTER');
  state.player.x = 0; state.player.y = 0;
  boss.bossState.actionMode = 'recover';
  let damage = 0;
  updateEnemyBehaviorRuntime({ ...context, enemy: boss, dt: 0.1, updateBossBehavior: noop,
    damageTarget: () => { damage++; }, damageArea: noop, spawnParticle: noop, spawnImpactWave: noop, syncHudHealth: noop });
  assert.equal(damage, 0);
  assert.equal(findNearestTarget(state.player, [{ x: 1, y: 0, hp: 0 }, { x: 10, y: 0, hp: 10 }], 100).x, 10);
});
