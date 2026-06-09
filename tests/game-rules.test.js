import test from 'node:test';
import assert from 'node:assert/strict';

import { BOSS_TYPES, COLORS, ENEMY_TYPES, createInitialTowerCatalog } from '../src/data/gameConfig.js';
import { WAVE_TABLE } from '../src/data/waveTable.js';
import {
  applyBossEditorDraft,
  buildBossEditorDraft,
  parseBossEditorDraft,
  serializeBossEditorDraft,
} from '../src/logic/engine/bossAuthoringRules.js';
import { runBossAbilityEffect } from '../src/logic/engine/bossAbilityRuntime.js';
import { AUDIO_CUES } from '../src/logic/audio/audioCueLibrary.js';
import {
  updateDropRuntime,
  updateHazardRuntime,
  updateProjectileRuntime,
  updateTransientVisualRuntime,
} from '../src/logic/engine/combatFrameRuntime.js';
import {
  getTowerFireRateFactor,
  updatePlayerOffenseRuntime,
  updateTowerOffenseRuntime,
} from '../src/logic/engine/combatOffenseRuntime.js';
import { updateEnemyBehaviorRuntime } from '../src/logic/engine/enemyBehaviorRuntime.js';
import { settleEnemyDefeatRuntime, settlePendingBossRewardRuntime } from '../src/logic/engine/enemyDefeatRuntime.js';
import {
  createBossEncounterRuntime,
  createEnemyRuntimeEntityFromKey,
  getBossEditorBaseTemplate,
  getBossOwnership,
} from '../src/logic/engine/encounterRuntime.js';
import {
  createDebugLayoutTowers,
  createPlacedTower,
  unlockAllTowerBlueprints,
  updatePlacedTowerLevel,
  updateTowerBlueprintLevel,
} from '../src/logic/engine/debugTowerRuntime.js';
import { forceBossPhaseRuntime, getForcedBossPhaseHp, getForcedBossPhaseIndex } from '../src/logic/engine/debugBossRuntime.js';
import {
  findOpenEnemySpawnPosition,
  getBossOwnedSummonCount,
  getBossRewardResolution,
  getBossSummonSpawnCount,
  hasPendingBossAftermath,
  hasPendingEncounterAftermath,
} from '../src/logic/engine/bossFlowRules.js';
import {
  getAreaDamageHits,
  getPulledPosition,
  isLineHazardHit,
  resolveEnemyDamage,
  resolveTargetDamage,
} from '../src/logic/engine/combatRules.js';
import { canPlaceTowerOnField, createWaveDefinition } from '../src/logic/engine/gameRules.js';
import { createEmptyWaveState, createRuntimeState, createWaveRuntimeState } from '../src/logic/engine/gameState.js';
import { evaluateTowerPlacement, updateDragPlacementState } from '../src/logic/engine/placementRules.js';
import { resolveRewardFollowUp, resolveWaveTick, shouldAutoRunWaveFlow } from '../src/logic/engine/progressionRules.js';
import {
  applyRewardChoiceEffects,
  buildRewardOfferPlan,
  createRewardHistory,
  materializeRewardChoices,
  recordRewardOffers,
  recordRewardPick,
} from '../src/logic/engine/rewardRules.js';
import { buildTowerAtLevel, getTowerPreviewSummary, upgradeTower } from '../src/logic/engine/towerRules.js';

test('initial tower catalog exposes only the starting blueprints', () => {
  const catalog = createInitialTowerCatalog();

  assert.equal(catalog.length, 9);
  assert.deepEqual(
    catalog.filter((tower) => tower.available).map((tower) => tower.id),
    ['BASIC', 'CANNON', 'SNIPER']
  );
  assert.ok(catalog.every((tower, index) => tower.sortOrder === index));
  assert.ok(catalog.every((tower) => tower.level === 0 && tower.maxLevel === 3));
});

test('wave definitions map to the authored table and scale on later cycles', () => {
  const wave1 = createWaveDefinition(1);
  const lastAuthoredWaveNumber = WAVE_TABLE.length;
  const lastAuthoredWave = createWaveDefinition(lastAuthoredWaveNumber);
  const nextCycleWave = createWaveDefinition(lastAuthoredWaveNumber + 1);

  assert.equal(WAVE_TABLE.length, 34);
  assert.equal(WAVE_TABLE.filter((wave) => wave.tier === 1).length, 6);
  assert.equal(WAVE_TABLE.filter((wave) => wave.tier === 2).length, 12);
  assert.equal(WAVE_TABLE.filter((wave) => wave.tier === 3).length, 16);
  assert.equal(wave1.boss.id, WAVE_TABLE[0].bossId);
  assert.equal(lastAuthoredWave.boss.id, WAVE_TABLE.at(-1).bossId);
  assert.equal(nextCycleWave.boss.id, WAVE_TABLE[0].bossId);
  assert.equal(wave1.label, WAVE_TABLE[0].label);
  assert.equal(lastAuthoredWave.focus, WAVE_TABLE.at(-1).focus);
  assert.ok(wave1.queue.length > 0);
  assert.ok(lastAuthoredWave.queue.length > wave1.queue.length);
  assert.ok(nextCycleWave.boss.maxHp > wave1.boss.maxHp);
});

test('tower placement is blocked by player, towers, and enemies', () => {
  const state = createRuntimeState();
  const tower = createInitialTowerCatalog().find((candidate) => candidate.id === 'BASIC');
  const player = { ...state.player, x: 0, y: 0 };
  const towers = [{ x: 80, y: 0, radius: tower.radius }];
  const enemies = [{ x: 170, y: 0, radius: 12 }];

  assert.equal(canPlaceTowerOnField({ x: 10, y: 0 }, tower, player, [], []), false, 'player body should block placement');
  assert.equal(canPlaceTowerOnField({ x: 80, y: 0 }, tower, player, towers, []), false, 'existing towers should block placement');
  assert.equal(canPlaceTowerOnField({ x: 170, y: 0 }, tower, player, [], enemies), false, 'enemies should block placement');
  assert.equal(canPlaceTowerOnField({ x: 240, y: 0 }, tower, player, towers, enemies), true, 'open ground should allow placement');
});

test('tower placement evaluation reports insufficient funds and valid world coordinates', () => {
  const state = createRuntimeState();
  const tower = createInitialTowerCatalog().find((candidate) => candidate.id === 'SNIPER');
  const placement = evaluateTowerPlacement({
    tower,
    clientX: 410,
    clientY: 260,
    camera: { x: 100, y: 60 },
    viewportWidth: 800,
    viewportHeight: 600,
    player: state.player,
    towers: [],
    enemies: [],
    money: tower.cost - 1,
    infiniteMoney: false,
    invalidPlacementText: 'invalid',
    insufficientFundsText: 'no-money',
  });

  assert.deepEqual(placement.worldPoint, { x: 110, y: 20 });
  assert.equal(placement.canPlace, false);
  assert.equal(placement.invalidReason, 'no-money');
});

test('drag placement updates entity drags without applying tower validation', () => {
  const nextDragPlacement = updateDragPlacementState({
    dragPlacement: { active: true, kind: 'enemy', entityId: 'BASIC', towerId: null, pointerX: 0, pointerY: 0, worldX: 0, worldY: 0, canPlace: false, invalidReason: 'old' },
    clientX: 420,
    clientY: 330,
    camera: { x: 50, y: -30 },
    viewportWidth: 800,
    viewportHeight: 600,
    tower: null,
    player: createRuntimeState().player,
    towers: [],
    enemies: [],
    money: 0,
    infiniteMoney: false,
    invalidPlacementText: 'invalid',
    insufficientFundsText: 'no-money',
  });

  assert.equal(nextDragPlacement.pointerX, 420);
  assert.equal(nextDragPlacement.pointerY, 330);
  assert.equal(nextDragPlacement.worldX, 70);
  assert.equal(nextDragPlacement.worldY, 0);
  assert.equal(nextDragPlacement.canPlace, true);
  assert.equal(nextDragPlacement.invalidReason, null);
});

test('runtime state enables debug wave flow flag separately from normal mode', () => {
  const state = createRuntimeState();

  assert.equal(state.mode, 'normal');
  assert.equal(state.debugWaveFlow, false);
  assert.equal(state.wave.bossSpawned, false);
  assert.deepEqual(state.debugOptions, { infiniteMoney: false, infiniteHealth: false });
  assert.deepEqual(state.rewardHistory, { offeredKeys: [], pickedKeys: [] });
});

test('wave state helpers build empty and active wave runtime snapshots', () => {
  const emptyWave = createEmptyWaveState();
  const activeWave = createWaveRuntimeState(5, {
    queue: ['BASIC', 'FAST'],
    spawnInterval: 0.75,
    boss: { id: 'DRAGON' },
  });

  assert.equal(emptyWave.number, 0);
  assert.equal(emptyWave.bossSpawned, true);
  assert.deepEqual(activeWave.queue, ['BASIC', 'FAST']);
  assert.equal(activeWave.number, 5);
  assert.equal(activeWave.spawnInterval, 0.75);
  assert.equal(activeWave.boss.id, 'DRAGON');
});

test('boss authoring draft can be built and applied back onto a boss template', () => {
  const bossTemplate = {
    id: 'TEST_BOSS',
    name: 'Test Boss',
    personality: 'steady',
    hp: 300,
    maxHp: 300,
    phases: [
      { name: 'Open', hpBelow: 1, abilities: ['summonFormation'] },
      { name: 'Close', hpBelow: 0.4, abilities: ['commandRush'] },
    ],
  };
  const draft = buildBossEditorDraft(bossTemplate);
  draft.name = 'Edited Boss';
  draft.phases[0].nodes[0].cooldown = 3.5;
  draft.phases[1].nodes.push({
    id: 'custom-node',
    abilityId: 'shieldPulse',
    cooldown: 8,
    condition: 'panic button',
    note: 'buy time',
    enabled: true,
  });

  const applied = applyBossEditorDraft(bossTemplate, draft);

  assert.equal(applied.name, 'Edited Boss');
  assert.equal(applied.authoredTemplate, true);
  assert.deepEqual(applied.phases[0].abilities, ['summonFormation']);
  assert.equal(applied.phases[0].behaviorNodes[0].cooldown, 3.5);
  assert.deepEqual(applied.phases[1].abilities, ['commandRush', 'shieldPulse']);
});

test('boss authoring draft survives serialize and parse round-trips', () => {
  const fallbackBoss = {
    id: 'TEST_BOSS',
    name: 'Test Boss',
    personality: 'steady',
    phases: [{ name: 'Open', hpBelow: 1, abilities: ['summonFormation'] }],
  };
  const serialized = serializeBossEditorDraft({
    bossId: 'TEST_BOSS',
    name: 'Exported Boss',
    personality: 'aggressive',
    phases: [
      {
        id: 'phase-a',
        name: 'Open',
        hpBelow: 1,
        nodes: [{ id: 'node-a', abilityId: 'summonFormation', cooldown: 5, condition: 'when ready', note: '', enabled: true }],
      },
    ],
  });
  const parsed = parseBossEditorDraft(serialized, fallbackBoss);

  assert.equal(parsed.name, 'Exported Boss');
  assert.equal(parsed.phases.length, 1);
  assert.equal(parsed.phases[0].nodes[0].abilityId, 'summonFormation');
  assert.equal(parsed.phases[0].nodes[0].cooldown, 5);
});

test('encounter runtime enriches boss editor templates with authored phase overrides', () => {
  const commander = getBossEditorBaseTemplate('COMMANDER');

  assert.equal(commander.id, 'COMMANDER');
  assert.ok(commander.phases[0].abilities.includes('commandLine'));
  assert.ok(commander.phases[1].abilities.includes('phalanxAdvance'));
  assert.equal(getBossEditorBaseTemplate('UNKNOWN_BOSS'), null);
});

test('encounter runtime creates enemy entities with runtime-only state', () => {
  const burrower = createEnemyRuntimeEntityFromKey({ enemyKey: 'BURROWER', uid: 77 });

  assert.equal(burrower.uid, 77);
  assert.equal(burrower.hp, ENEMY_TYPES.BURROWER.hp);
  assert.equal(burrower.maxHp, ENEMY_TYPES.BURROWER.hp);
  assert.equal(burrower.baseSpeed, ENEMY_TYPES.BURROWER.speed);
  assert.equal(burrower.burrowed, true);
  assert.equal(burrower.burrowTimer, ENEMY_TYPES.BURROWER.burrow.duration);
  assert.equal(burrower.summonedByBossUid, null);
  assert.equal(burrower.summonCategory, null);
});

test('encounter runtime builds single-boss and twin encounter entities', () => {
  let nextEnemyUid = 10;
  let nextEncounterUid = 3;
  const allocateEnemyUid = () => nextEnemyUid++;
  const allocateEncounterUid = () => nextEncounterUid++;

  const [commander] = createBossEncounterRuntime({
    bossTemplate: BOSS_TYPES.COMMANDER,
    x: 100,
    y: 200,
    allocateEnemyUid,
    allocateEncounterUid,
  });

  assert.equal(commander.uid, 10);
  assert.equal(commander.x, 100);
  assert.equal(commander.y, 200);
  assert.equal(commander.isBoss, true);
  assert.equal(commander.enemyType, 'BOSS');
  assert.equal(commander.currentPhaseIndex, -1);
  assert.deepEqual(getBossOwnership(commander), { ownerBossUid: 10, ownerEncounterUid: null });
  assert.ok(commander.phases[0].abilities.includes('commandLine'));

  const twins = createBossEncounterRuntime({
    bossTemplate: BOSS_TYPES.TWINS,
    x: 300,
    y: 400,
    allocateEnemyUid,
    allocateEncounterUid,
  });

  assert.equal(twins.length, 2);
  assert.equal(twins[0].uid, 11);
  assert.equal(twins[1].uid, 12);
  assert.equal(twins[0].encounterUid, 3);
  assert.equal(twins[1].encounterUid, 3);
  assert.equal(twins[0].twinRole, 'sun');
  assert.equal(twins[1].twinRole, 'moon');
  assert.equal(twins[0].x, 246);
  assert.equal(twins[1].x, 354);
  assert.equal(twins[0].value + twins[1].value, BOSS_TYPES.TWINS.value);
});

const createBossAbilityTestContext = (stateOverrides = {}) => {
  const calls = {
    areaDamage: [],
    areaHazards: [],
    floatingTexts: [],
    lineHazards: [],
    spawns: [],
    syncMoney: 0,
  };
  const state = {
    player: { x: 120, y: 60, radius: 12 },
    towers: [],
    enemies: [],
    hazards: [],
    money: 50,
    debugOptions: { infiniteMoney: false },
    ...stateOverrides,
  };

  return {
    calls,
    state,
    context: {
      state,
      spawnAround: (...args) => {
        calls.spawns.push(args);
        return 0;
      },
      queueLineHazard: (...args) => calls.lineHazards.push(args),
      queueAreaHazard: (...args) => calls.areaHazards.push(args),
      spawnImpactWave: () => {},
      damageArea: (...args) => calls.areaDamage.push(args),
      damageTarget: () => {},
      spawnEnemyAt: (...args) => calls.spawns.push(args),
      spawnFloatingText: (...args) => calls.floatingTexts.push(args),
      syncHudMoney: () => {
        calls.syncMoney += 1;
      },
      getBossOwnership: (boss) => ({ ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null }),
      getEncounterPartner: () => null,
    },
  };
};

test('boss ability runtime queues command-line hazards through context callbacks', () => {
  const { calls, context } = createBossAbilityTestContext();
  const boss = {
    uid: 'boss-1',
    x: 0,
    y: 0,
    radius: 24,
    currentPhaseIndex: 0,
    phases: [{ abilities: ['commandLine'] }],
  };

  runBossAbilityEffect({ boss, abilityName: 'commandLine', ...context });

  assert.equal(calls.lineHazards.length, 3);
  assert.ok(calls.lineHazards.every(([, , options]) => options.ownerBossUid === 'boss-1'));
  assert.ok(calls.lineHazards.every(([, , options]) => options.label === 'formation' && options.damage === 16));
});

test('boss ability runtime applies steal-money side effects through supplied state', () => {
  const { calls, context, state } = createBossAbilityTestContext({ money: 20 });
  const boss = {
    uid: 'collector-1',
    x: 5,
    y: 8,
    radius: 28,
    currentPhaseIndex: 0,
    phases: [{ abilities: ['stealMoney'] }],
  };

  runBossAbilityEffect({ boss, abilityName: 'stealMoney', ...context });

  assert.equal(state.money, 8);
  assert.equal(calls.syncMoney, 1);
  assert.deepEqual(calls.floatingTexts[0], [5, -28, '-12', COLORS.enemyScout]);
});

test('audio cue library exposes the core gameplay feedback cues', () => {
  assert.ok(AUDIO_CUES.tower_place?.length > 0);
  assert.ok(AUDIO_CUES.reward_open?.length > 0);
  assert.ok(AUDIO_CUES.reward_pick?.length > 0);
  assert.ok(AUDIO_CUES.boss_incoming?.length > 0);
  assert.ok(AUDIO_CUES.boss_phase_shift?.length > 0);
  assert.ok(AUDIO_CUES.boss_defeat?.length > 0);
});

test('reward follow-up keeps sandbox rewards local but advances normal wave flow', () => {
  assert.deepEqual(resolveRewardFollowUp({ mode: 'debug', debugWaveFlow: false, currentWave: 7 }), { type: 'debug-stay' });
  assert.deepEqual(resolveRewardFollowUp({ mode: 'debug', debugWaveFlow: true, currentWave: 7 }), { type: 'start-next-wave', waveNumber: 8 });
  assert.deepEqual(resolveRewardFollowUp({ mode: 'normal', debugWaveFlow: false, currentWave: 7 }), { type: 'start-next-wave', waveNumber: 8 });
});

test('wave tick only auto-runs in normal or debug-wave-flow mode', () => {
  assert.equal(shouldAutoRunWaveFlow({ mode: 'normal', debugWaveFlow: false }), true);
  assert.equal(shouldAutoRunWaveFlow({ mode: 'debug', debugWaveFlow: true }), true);
  assert.equal(shouldAutoRunWaveFlow({ mode: 'debug', debugWaveFlow: false }), false);
});

test('wave tick spawns queued enemies over time and promotes to boss only after the field is clear', () => {
  const initialWave = createWaveRuntimeState(3, {
    queue: ['BASIC', 'FAST'],
    spawnInterval: 0.9,
    boss: { id: 'PRISM' },
  });

  const firstTick = resolveWaveTick({
    wave: initialWave,
    dt: 1,
    enemyCount: 0,
    autoRun: true,
  });
  const secondTick = resolveWaveTick({
    wave: firstTick.wave,
    dt: 0.1,
    enemyCount: 1,
    autoRun: true,
  });
  const bossTickBlocked = resolveWaveTick({
    wave: {
      ...secondTick.wave,
      queue: [],
      bossSpawned: false,
      spawnTimer: 0.2,
    },
    dt: 0.1,
    enemyCount: 2,
    autoRun: true,
  });
  const bossTickOpen = resolveWaveTick({
    wave: {
      ...bossTickBlocked.wave,
      queue: [],
      bossSpawned: false,
    },
    dt: 0.1,
    enemyCount: 0,
    autoRun: true,
  });

  assert.deepEqual(firstTick.spawnEnemyKeys, []);
  assert.equal(firstTick.wave.spawnTimer, 1);
  assert.deepEqual(secondTick.spawnEnemyKeys, ['BASIC']);
  assert.deepEqual(secondTick.wave.queue, ['FAST']);
  assert.equal(bossTickBlocked.spawnBoss, false);
  assert.equal(bossTickOpen.spawnBoss, true);
  assert.equal(bossTickOpen.wave.bossSpawned, true);
});

test('wave tick leaves sandbox idle when auto-run is disabled', () => {
  const wave = createWaveRuntimeState(2, {
    queue: ['BASIC'],
    spawnInterval: 0.9,
    boss: { id: 'HIVE' },
  });
  const tick = resolveWaveTick({
    wave,
    dt: 5,
    enemyCount: 0,
    autoRun: false,
  });

  assert.equal(tick.wave, wave);
  assert.deepEqual(tick.spawnEnemyKeys, []);
  assert.equal(tick.spawnBoss, false);
});

test('reward plan includes a support option when player is under pressure', () => {
  const catalog = createInitialTowerCatalog();
  const rewards = buildRewardOfferPlan({
    catalog,
    waveNumber: 6,
    money: 20,
    hp: 52,
    maxHp: 100,
    infiniteMoney: false,
    history: createRewardHistory(),
  });

  assert.equal(rewards.length, 3);
  assert.ok(rewards.some((reward) => reward.type === 'support_repair' || reward.type === 'support_money'));
  assert.ok(rewards.some((reward) => reward.type === 'unlock'));
});

test('reward history discourages immediately repeating the same upgrade offer', () => {
  const catalog = createInitialTowerCatalog().map((tower) => ({ ...tower, available: true }));
  const firstPlan = buildRewardOfferPlan({
    catalog,
    waveNumber: 9,
    money: 120,
    hp: 100,
    maxHp: 100,
    infiniteMoney: false,
    history: createRewardHistory(),
  });
  const historyAfterOffer = recordRewardOffers(createRewardHistory(), firstPlan);
  const firstUpgradeIds = firstPlan.filter((reward) => reward.type === 'upgrade').map((reward) => reward.towerId);

  assert.ok(firstUpgradeIds.length > 0);

  const secondPlan = buildRewardOfferPlan({
    catalog,
    waveNumber: 10,
    money: 120,
    hp: 100,
    maxHp: 100,
    infiniteMoney: false,
    history: historyAfterOffer,
  });
  const secondUpgradeIds = secondPlan.filter((reward) => reward.type === 'upgrade').map((reward) => reward.towerId);

  assert.ok(secondUpgradeIds.every((towerId) => !firstUpgradeIds.includes(towerId)));
});

test('picked rewards are recorded separately from offered rewards', () => {
  const history = recordRewardPick(createRewardHistory(), { type: 'unlock', towerId: 'FROST' });

  assert.deepEqual(history.offeredKeys, []);
  assert.deepEqual(history.pickedKeys, ['unlock:FROST']);
});

test('reward choices materialize into UI-ready unlock, upgrade, and support cards', () => {
  const catalog = createInitialTowerCatalog();
  const choices = materializeRewardChoices(catalog, [
    { type: 'unlock', towerId: 'FROST' },
    { type: 'upgrade', towerId: 'BASIC' },
    { type: 'support_money', amount: 90 },
  ]);

  assert.equal(choices.length, 3);
  assert.equal(choices[0].type, 'unlock');
  assert.match(choices[0].title, /解锁/);
  assert.match(choices[1].subtitle, /等级/);
  assert.equal(choices[2].title, '物资补给');
  assert.match(choices[2].detail, /资金/);
});

test('reward application updates catalog, money, and health without mutating unrelated state', () => {
  const catalog = createInitialTowerCatalog();
  const unlocked = applyRewardChoiceEffects({
    catalog,
    choice: { type: 'unlock', towerId: 'FROST' },
    money: 120,
    hp: 80,
    maxHp: 100,
  });
  const upgraded = applyRewardChoiceEffects({
    catalog: unlocked.catalog,
    choice: { type: 'upgrade', towerId: 'BASIC' },
    money: unlocked.money,
    hp: unlocked.hp,
    maxHp: 100,
  });
  const supported = applyRewardChoiceEffects({
    catalog: upgraded.catalog,
    choice: { type: 'support_repair', amount: 40 },
    money: upgraded.money,
    hp: 70,
    maxHp: 100,
  });
  const funded = applyRewardChoiceEffects({
    catalog: supported.catalog,
    choice: { type: 'support_money', amount: 55 },
    money: 30,
    hp: supported.hp,
    maxHp: 100,
  });

  assert.equal(catalog.find((tower) => tower.id === 'FROST').available, false);
  assert.equal(unlocked.catalog.find((tower) => tower.id === 'FROST').available, true);
  assert.equal(upgraded.catalog.find((tower) => tower.id === 'BASIC').level, 1);
  assert.equal(supported.hp, 100);
  assert.equal(funded.money, 85);
});

test('combat rules resolve player immunity and enemy shielded damage correctly', () => {
  assert.deepEqual(resolveTargetDamage({ targetHp: 80, amount: 12, infiniteHealth: true }), { hp: 80, appliedDamage: 0 });

  const enemyResult = resolveEnemyDamage(
    {
      hp: 100,
      shield: 20,
      phased: true,
      phase: { damageMultiplier: 0.5 },
      armoredTimer: 2,
    },
    40
  );

  assert.equal(enemyResult.shield, 7);
  assert.equal(enemyResult.hp, 100);
  assert.equal(enemyResult.appliedDamage, 13);
});

test('combat rules find area hits and clamp pull distance', () => {
  const hits = getAreaDamageHits({
    origin: { x: 0, y: 0 },
    radius: 50,
    player: { x: 10, y: 0, radius: 12 },
    towers: [
      { x: 40, y: 0, radius: 10 },
      { x: 90, y: 0, radius: 10 },
    ],
    amount: 20,
    towerFactor: 1.5,
  });
  const pulled = getPulledPosition({
    target: { x: 80, y: 0, radius: 12 },
    hazard: { x: 0, y: 0, radius: 100, pull: 500 },
  });

  assert.equal(hits.playerHit, true);
  assert.equal(hits.playerDamage, 20);
  assert.deepEqual(hits.towerHits, [{ index: 0, damage: 30 }]);
  assert.equal(Math.round(pulled.x), 45);
  assert.equal(Math.round(pulled.y), 0);
});

test('combat rules detect line hazard hits along segments and endpoints', () => {
  const hazard = { x: 0, y: 0, x2: 100, y2: 0, width: 10 };

  assert.equal(isLineHazardHit({ hazard, target: { x: 50, y: 8, radius: 4 } }), true);
  assert.equal(isLineHazardHit({ hazard, target: { x: 108, y: 0, radius: 8 } }), true);
  assert.equal(isLineHazardHit({ hazard, target: { x: 50, y: 30, radius: 4 } }), false);
});

test('combat frame runtime resolves projectile hits and removes spent projectiles', () => {
  const calls = {
    floatingTexts: [],
    particles: [],
  };
  const enemy = { x: 3, y: 0, radius: 10, hp: 50, hitFlash: 0, slowRatio: 1, slowTimer: 0 };
  const state = {
    enemies: [enemy],
    projectiles: [
      {
        x: 0,
        y: 0,
        previousX: 0,
        previousY: 0,
        vx: 0,
        vy: 0,
        life: 1,
        damage: 30,
        color: '#fff',
        radius: 5,
        kind: 'basic',
      },
    ],
  };

  updateProjectileRuntime({
    state,
    dt: 0.1,
    damageEnemy: (target, amount) => {
      target.hp -= amount;
    },
    spawnFloatingText: (...args) => calls.floatingTexts.push(args),
    spawnParticle: (...args) => calls.particles.push(args),
    spawnImpactWave: () => {},
  });

  assert.equal(enemy.hp, 20);
  assert.equal(enemy.hitFlash, 1);
  assert.equal(state.projectiles.length, 0);
  assert.deepEqual(calls.floatingTexts[0], [3, -15, 30, '#fff']);
  assert.equal(calls.particles.length, 1);
});

test('combat frame runtime applies area hazards to player and towers', () => {
  const calls = {
    healthSyncs: 0,
    waves: [],
  };
  const state = {
    player: { x: 0, y: 0, radius: 10, hp: 100 },
    towers: [{ x: 20, y: 0, radius: 10, hp: 80, frozenTimer: 0 }],
    hazards: [
      {
        type: 'area',
        x: 0,
        y: 0,
        radius: 40,
        damage: 12,
        timer: 0,
        color: '#f00',
        pulsesRemaining: 1,
        pulseInterval: 0.5,
        radiusStep: 0,
        damageStep: 0,
        slowRatio: 0.5,
        slowDuration: 2,
        pull: 20,
      },
    ],
  };

  updateHazardRuntime({
    state,
    dt: 0.1,
    damageTarget: (target, amount) => {
      target.hp -= amount;
    },
    spawnImpactWave: (...args) => calls.waves.push(args),
    syncHudHealth: () => {
      calls.healthSyncs += 1;
    },
  });

  assert.equal(state.player.hp, 88);
  assert.equal(state.towers[0].hp, 68);
  assert.equal(state.towers[0].frozenTimer, 2);
  assert.equal(state.hazards.length, 0);
  assert.equal(calls.healthSyncs, 1);
  assert.equal(calls.waves.length, 1);
});

test('combat frame runtime handles drops and transient visual cleanup', () => {
  const state = {
    player: { x: 0, y: 0, radius: 12 },
    money: 5,
    drops: [{ x: 0, y: 0, radius: 4, value: 7, magnetized: false }],
    particles: [{ x: 0, y: 0, vx: 10, vy: 0, life: 0.05 }],
    impactWaves: [{ radius: 2, maxRadius: 10, growth: 40, life: 0.05 }],
    floatingTexts: [{ y: 20, vy: -10, life: 0.05 }],
  };
  let moneySyncs = 0;
  let pulses = 0;

  updateDropRuntime({
    state,
    dt: 0.1,
    syncHudMoney: () => {
      moneySyncs += 1;
    },
    pulsePlayerPickupRadius: () => {
      pulses += 1;
    },
  });
  updateTransientVisualRuntime({ state, dt: 0.1 });

  assert.equal(state.money, 12);
  assert.equal(state.drops.length, 0);
  assert.equal(state.player.radius, 14);
  assert.equal(moneySyncs, 1);
  assert.equal(pulses, 1);
  assert.equal(state.particles.length, 0);
  assert.equal(state.impactWaves.length, 0);
  assert.equal(state.floatingTexts.length, 0);
});

test('combat offense runtime fires player projectiles at nearest target', () => {
  const state = {
    player: { x: 0, y: 0, range: 120, damage: 9, shootCd: 0.5, lastShoot: 0.5 },
    enemies: [
      { x: 80, y: 0 },
      { x: 30, y: 0 },
    ],
    projectiles: [],
  };

  updatePlayerOffenseRuntime({ state, dt: 0.1 });

  assert.equal(state.player.lastShoot, 0);
  assert.equal(state.projectiles.length, 1);
  assert.equal(state.projectiles[0].damage, 9);
  assert.equal(state.projectiles[0].kind, 'basic');
  assert.equal(state.projectiles[0].vx, 400);
  assert.equal(state.projectiles[0].vy, 0);
});

test('combat offense runtime fires tower bursts and removes dead towers', () => {
  const particles = [];
  const state = {
    enemies: [{ x: 100, y: 0 }],
    projectiles: [],
    towers: [
      { x: 0, y: 0, radius: 12, hp: 10, color: '#0af', range: 160, fireRate: 1, lastShoot: 1, damage: 20, burstCount: 3, spread: 0.2, projectileSpeed: 300, frozenTimer: 0 },
      { x: 5, y: 5, radius: 12, hp: 0, color: '#999', fireRate: 1, lastShoot: 0, frozenTimer: 0 },
    ],
  };

  updateTowerOffenseRuntime({
    state,
    dt: 0.1,
    spawnParticle: (...args) => particles.push(args),
  });

  assert.equal(state.towers.length, 1);
  assert.equal(particles.length, 1);
  assert.equal(state.towers[0].lastShoot, 0);
  assert.equal(state.projectiles.length, 3);
  assert.equal(state.projectiles[0].kind, 'basic');
  assert.ok(state.projectiles.every((projectile) => projectile.hitEnemies instanceof Set));
});

test('combat offense runtime applies frozen and jam fire-rate factors', () => {
  const tower = { x: 0, y: 0, frozenTimer: 0 };
  const state = {
    enemies: [{ x: 20, y: 0, jamAura: { range: 30, fireRateFactor: 2.5 } }],
  };

  assert.equal(getTowerFireRateFactor(state, tower), 2.5);
  assert.equal(getTowerFireRateFactor(state, { ...tower, frozenTimer: 0.1 }), 999);
});

const createEnemyBehaviorTestContext = (stateOverrides = {}) => {
  const calls = {
    areaDamage: [],
    bossUpdates: [],
    healthSyncs: 0,
    particles: [],
    spawns: [],
    waves: [],
  };
  const state = {
    gameTime: 0.1,
    player: { x: 100, y: 0, radius: 12, hp: 100 },
    towers: [],
    enemies: [],
    ...stateOverrides,
  };

  return {
    calls,
    state,
    context: {
      state,
      spawnAround: (...args) => calls.spawns.push(args),
      spawnImpactWave: (...args) => calls.waves.push(args),
      updateBossBehavior: (...args) => calls.bossUpdates.push(args),
      damageTarget: (target, amount) => {
        target.hp -= amount;
      },
      damageArea: (...args) => calls.areaDamage.push(args),
      spawnParticle: (...args) => calls.particles.push(args),
      syncHudHealth: () => {
        calls.healthSyncs += 1;
      },
    },
  };
};

test('enemy behavior runtime keeps burrowed enemies paused until emergence', () => {
  const enemy = {
    x: 0,
    y: 0,
    radius: 10,
    hp: 30,
    hitFlash: 0,
    slowTimer: 0,
    slowRatio: 1,
    burrowed: true,
    burrowTimer: 0.5,
    baseSpeed: 100,
  };
  const { calls, context } = createEnemyBehaviorTestContext({ enemies: [enemy] });

  const result = updateEnemyBehaviorRuntime({ enemy, dt: 0.1, ...context });

  assert.equal(result.continueLoop, true);
  assert.equal(enemy.burrowed, true);
  assert.equal(enemy.burrowTimer, 0.4);
  assert.equal(enemy.x, 0);
  assert.equal(calls.waves.length, 0);

  enemy.burrowTimer = 0.05;
  const emergeResult = updateEnemyBehaviorRuntime({ enemy, dt: 0.1, ...context });

  assert.equal(emergeResult.continueLoop, false);
  assert.equal(enemy.burrowed, false);
  assert.equal(calls.waves.length, 1);
});

test('enemy behavior runtime moves enemies and applies contact damage', () => {
  const enemy = {
    x: 5,
    y: 0,
    radius: 10,
    hp: 30,
    hitFlash: 1,
    slowTimer: 0,
    slowRatio: 1,
    baseSpeed: 0,
    damage: 20,
  };
  const { calls, context, state } = createEnemyBehaviorTestContext({
    player: { x: 0, y: 0, radius: 12, hp: 100 },
    enemies: [enemy],
  });

  const result = updateEnemyBehaviorRuntime({ enemy, dt: 0.2, ...context });

  assert.equal(result.continueLoop, false);
  assert.equal(state.player.hp, 96);
  assert.equal(calls.healthSyncs, 1);
  assert.equal(calls.particles.length, 1);
  assert.equal(enemy.hitFlash, 0);
});

test('enemy behavior runtime handles aura healing, summons, and fuse explosions', () => {
  const ally = { x: 20, y: 0, radius: 8, hp: 5, maxHp: 20 };
  const enemy = {
    x: 0,
    y: 0,
    radius: 10,
    hp: 30,
    hitFlash: 0,
    slowTimer: 0,
    slowRatio: 1,
    baseSpeed: 0,
    damage: 0,
    healAura: { range: 50, amount: 10 },
    summon: { interval: 0.2, type: 'BASIC', count: 2 },
    summonTimer: 0.1,
    explode: { fuse: 1, radius: 40, damage: 12 },
    fuseTimer: 0.05,
  };
  const { calls, context } = createEnemyBehaviorTestContext({
    enemies: [enemy, ally],
  });

  updateEnemyBehaviorRuntime({ enemy, dt: 0.1, ...context });

  assert.equal(ally.hp, 6);
  assert.equal(calls.spawns.length, 1);
  assert.equal(calls.spawns[0][1], 'BASIC');
  assert.equal(calls.spawns[0][2], 2);
  assert.equal(calls.areaDamage.length, 1);
  assert.equal(enemy.hp, 0);
});

const createEnemyDefeatTestContext = (stateOverrides = {}) => {
  const calls = {
    cueCount: 0,
    enrages: [],
    moneySyncs: 0,
    openedRewards: 0,
    particles: [],
    spawns: [],
  };
  const state = {
    drops: [],
    enemies: [],
    hazards: [],
    mode: 'normal',
    money: 10,
    wave: {
      awaitingReward: false,
      pendingRewardBossUid: null,
      pendingRewardBossEncounterUid: null,
    },
    ...stateOverrides,
  };

  return {
    calls,
    state,
    context: {
      state,
      spawnParticle: (...args) => calls.particles.push(args),
      spawnAround: (...args) => calls.spawns.push(args),
      playBossDefeatCue: () => {
        calls.cueCount += 1;
      },
      syncHudMoney: () => {
        calls.moneySyncs += 1;
      },
      openBossReward: () => {
        calls.openedRewards += 1;
        state.wave.awaitingReward = true;
        state.wave.pendingRewardBossUid = null;
        state.wave.pendingRewardBossEncounterUid = null;
      },
      enrageEncounterPartner: (...args) => calls.enrages.push(args),
    },
  };
};

test('enemy defeat runtime removes normal enemies, drops gems, and spawns death units', () => {
  const enemy = {
    x: 12,
    y: 18,
    hp: 0,
    color: COLORS.enemyBasic,
    value: 3,
    deathSpawn: { type: 'BASIC', count: 2, spread: 44 },
  };
  const survivor = { hp: 20 };
  const { calls, context, state } = createEnemyDefeatTestContext({
    enemies: [survivor, enemy],
  });

  const result = settleEnemyDefeatRuntime({ enemy, enemyIndex: 1, ...context });

  assert.deepEqual(result, { defeated: true, rewardAction: null });
  assert.deepEqual(state.enemies, [survivor]);
  assert.equal(state.drops.length, 1);
  assert.equal(state.drops[0].value, 3);
  assert.equal(state.drops[0].color, COLORS.gem);
  assert.equal(calls.particles[0][3], 8);
  assert.equal(calls.spawns[0][1], 'BASIC');
  assert.equal(calls.openedRewards, 0);
});

test('enemy defeat runtime settles boss rewards immediately when aftermath is clear', () => {
  const boss = {
    uid: 'boss-1',
    x: 0,
    y: 0,
    hp: 0,
    isBoss: true,
    color: COLORS.enemyTank,
    value: 9,
  };
  const { calls, context, state } = createEnemyDefeatTestContext({
    enemies: [boss],
  });

  const result = settleEnemyDefeatRuntime({ enemy: boss, enemyIndex: 0, ...context });

  assert.deepEqual(result, { defeated: true, rewardAction: 'open-reward' });
  assert.equal(state.enemies.length, 0);
  assert.equal(state.money, 19);
  assert.equal(boss.isDefeated, true);
  assert.equal(calls.cueCount, 1);
  assert.equal(calls.moneySyncs, 1);
  assert.equal(calls.openedRewards, 1);
});

test('enemy defeat runtime waits for boss aftermath before opening rewards', () => {
  const boss = {
    uid: 'boss-1',
    x: 0,
    y: 0,
    hp: 0,
    isBoss: true,
    color: COLORS.enemyTank,
    value: 5,
  };
  const { calls, context, state } = createEnemyDefeatTestContext({
    enemies: [boss],
    hazards: [{ ownerBossUid: 'boss-1' }],
  });

  const result = settleEnemyDefeatRuntime({ enemy: boss, enemyIndex: 0, ...context });

  assert.deepEqual(result, { defeated: true, rewardAction: 'await-boss-aftermath' });
  assert.equal(state.wave.awaitingReward, true);
  assert.equal(state.wave.pendingRewardBossUid, 'boss-1');
  assert.equal(calls.openedRewards, 0);

  state.hazards = [];
  const pendingResult = settlePendingBossRewardRuntime({
    state,
    rewardActive: false,
    openBossReward: context.openBossReward,
  });

  assert.deepEqual(pendingResult, { opened: true, source: 'boss' });
  assert.equal(calls.openedRewards, 1);
  assert.equal(state.wave.pendingRewardBossUid, null);
});

test('debug tower runtime unlocks all blueprints without mutating the catalog', () => {
  const catalog = createInitialTowerCatalog();
  const nextCatalog = unlockAllTowerBlueprints(catalog);

  assert.equal(catalog.find((tower) => tower.id === 'RAPID').available, false);
  assert.equal(nextCatalog.every((tower) => tower.available), true);
  assert.notEqual(nextCatalog[0], catalog[0]);
});

test('debug tower runtime creates preset layout towers around the player', () => {
  const catalog = unlockAllTowerBlueprints(createInitialTowerCatalog());
  let nextUid = 50;

  const towers = createDebugLayoutTowers({
    layoutId: 'balanced',
    catalog,
    player: { x: 1000, y: 500 },
    allocateTowerUid: () => nextUid++,
  });

  assert.equal(towers.length, 6);
  assert.equal(towers[0].id, 'SENTINEL');
  assert.equal(towers[0].uid, 50);
  assert.equal(towers[0].x, 880);
  assert.equal(towers[0].y, 460);
  assert.equal(towers[0].hp, towers[0].maxHp);
  assert.equal(towers[0].lastShoot, 0);
  assert.equal(createDebugLayoutTowers({ layoutId: 'missing', catalog, player: { x: 0, y: 0 }, allocateTowerUid: () => 1 }), null);
});

test('debug tower runtime updates blueprint and placed tower levels safely', () => {
  const catalog = createInitialTowerCatalog();
  const nextCatalog = updateTowerBlueprintLevel({ catalog, towerId: 'BASIC', delta: 1 });

  assert.equal(nextCatalog.find((tower) => tower.id === 'BASIC').level, 1);
  assert.equal(nextCatalog.find((tower) => tower.id === 'CANNON').level, 0);

  const baseTower = createPlacedTower({
    tower: catalog.find((tower) => tower.id === 'BASIC'),
    uid: 88,
    x: 12,
    y: 34,
  });
  baseTower.hp = 20;
  const towers = [baseTower];
  const result = updatePlacedTowerLevel({ towers, towerUid: 88, delta: 1 });

  assert.equal(result.updated, true);
  assert.equal(baseTower.uid, 88);
  assert.equal(baseTower.x, 12);
  assert.equal(baseTower.y, 34);
  assert.equal(baseTower.level, 1);
  assert.equal(baseTower.lastShoot, 0);
  assert.ok(baseTower.maxHp >= 50);
  assert.ok(baseTower.hp >= 20);
  assert.deepEqual(updatePlacedTowerLevel({ towers, towerUid: 404, delta: 1 }), { updated: false, tower: null });
});

test('debug boss runtime clamps phase targets and derives forced hp', () => {
  const boss = {
    maxHp: 1000,
    phases: [
      { name: 'Open', hpBelow: 1 },
      { name: 'Mid', hpBelow: 0.5 },
      { name: 'End', hpBelow: 0.2 },
    ],
  };

  assert.equal(getForcedBossPhaseIndex(boss, 0), 0);
  assert.equal(getForcedBossPhaseIndex(boss, 2), 1);
  assert.equal(getForcedBossPhaseIndex(boss, 99), 2);
  assert.equal(getForcedBossPhaseHp({ boss, phaseIndex: 0 }), 1000);
  assert.equal(getForcedBossPhaseHp({ boss, phaseIndex: 1 }), 750);
  assert.equal(getForcedBossPhaseHp({ boss, phaseIndex: 2 }), 180);
});

test('debug boss runtime forces active bosses and reports phase shift callbacks', () => {
  const boss = {
    uid: 'boss-1',
    isBoss: true,
    maxHp: 1000,
    hp: 1000,
    currentPhaseIndex: 0,
    abilityCooldowns: { commandLine: 8 },
    phases: [
      { name: 'Open', hpBelow: 1 },
      { name: 'Mid', hpBelow: 0.5 },
      { name: 'End', hpBelow: 0.2 },
    ],
  };
  const calls = [];

  const result = forceBossPhaseRuntime({
    enemies: [boss, { isBoss: false }, { isBoss: true, phases: [] }],
    phaseNumber: 3,
    onPhaseShift: (...args) => calls.push(...args),
  });

  assert.deepEqual(result, { updatedCount: 1 });
  assert.equal(boss.currentPhaseIndex, 2);
  assert.equal(boss.hp, 180);
  assert.deepEqual(boss.abilityCooldowns, {});
  assert.equal(calls.length, 1);
  assert.equal(calls[0].boss, boss);
  assert.equal(calls[0].activePhase.name, 'End');
  assert.equal(calls[0].activePhaseIndex, 2);
  assert.equal(calls[0].previousPhaseIndex, 0);

  const samePhaseCalls = [];
  forceBossPhaseRuntime({
    enemies: [boss],
    phaseNumber: 3,
    onPhaseShift: (...args) => samePhaseCalls.push(...args),
  });
  assert.equal(samePhaseCalls[0].previousPhaseIndex, -1);

  assert.deepEqual(forceBossPhaseRuntime({ enemies: [], phaseNumber: 1 }), { updatedCount: 0 });
});

test('tower rules rebuild blueprint stats deterministically by level', () => {
  const baseTower = createInitialTowerCatalog().find((tower) => tower.id === 'BURST');
  const levelTwo = buildTowerAtLevel(baseTower, 2);
  const levelThree = upgradeTower(levelTwo);

  assert.equal(levelTwo.level, 2);
  assert.equal(levelThree.level, 3);
  assert.ok(levelThree.damage > levelTwo.damage);
  assert.ok(levelThree.range > levelTwo.range);
  assert.ok(levelThree.cost > levelTwo.cost);
  assert.ok(levelThree.burstCount >= levelTwo.burstCount);
});

test('tower preview summary surfaces the key derived stats', () => {
  const baseTower = createInitialTowerCatalog().find((tower) => tower.id === 'RAIL');
  const upgraded = buildTowerAtLevel(baseTower, 1);
  const summary = getTowerPreviewSummary(upgraded);

  assert.match(summary, /造价/);
  assert.match(summary, /伤害/);
  assert.match(summary, /射程/);
  assert.match(summary, /穿透/);
});

test('boss summon rules cap active minions by owner and category', () => {
  const enemies = [
    { summonedByBossUid: 'boss-1', summonCategory: 'SPIDERLING' },
    { summonedByBossUid: 'boss-1', summonCategory: 'SPIDERLING' },
    { summonedByBossUid: 'boss-1', summonCategory: 'HATCHLING' },
    { summonedByBossUid: 'boss-2', summonCategory: 'SPIDERLING' },
  ];

  assert.equal(getBossOwnedSummonCount(enemies, 'boss-1', 'SPIDERLING'), 2);
  assert.equal(
    getBossSummonSpawnCount({
      enemies,
      bossUid: 'boss-1',
      summonCategory: 'SPIDERLING',
      requestedCount: 4,
      maxActive: 3,
    }),
    1
  );
  assert.equal(
    getBossSummonSpawnCount({
      enemies,
      bossUid: 'boss-1',
      summonCategory: 'SPIDERLING',
      requestedCount: 2,
      maxActive: 2,
    }),
    0
  );
});

test('boss aftermath checks wait for summoned units and hazards to clear', () => {
  const enemies = [
    { summonedByBossUid: 'boss-1' },
    { encounterUid: 'enc-1' },
    { summonedByEncounterUid: 'enc-1' },
  ];
  const hazards = [
    { ownerBossUid: 'boss-2' },
    { ownerEncounterUid: 'enc-2' },
  ];

  assert.equal(hasPendingBossAftermath(enemies, hazards, 'boss-1'), true);
  assert.equal(hasPendingBossAftermath(enemies, hazards, 'boss-2'), true);
  assert.equal(hasPendingBossAftermath(enemies, hazards, 'boss-3'), false);
  assert.equal(hasPendingEncounterAftermath(enemies, hazards, 'enc-1'), true);
  assert.equal(hasPendingEncounterAftermath(enemies, hazards, 'enc-2'), true);
  assert.equal(hasPendingEncounterAftermath(enemies, hazards, 'enc-3'), false);
});

test('boss reward resolution distinguishes partner enrages, pending aftermath, and reward opens', () => {
  assert.deepEqual(
    getBossRewardResolution({
      boss: { uid: 'boss-1', encounterUid: 'enc-1' },
      enemies: [{ isBoss: true, encounterUid: 'enc-1' }],
      hazards: [],
    }),
    { action: 'enrage-partner', encounterUid: 'enc-1' }
  );

  assert.deepEqual(
    getBossRewardResolution({
      boss: { uid: 'boss-2', encounterUid: 'enc-2' },
      enemies: [{ summonedByEncounterUid: 'enc-2' }],
      hazards: [],
    }),
    { action: 'await-encounter-aftermath', encounterUid: 'enc-2' }
  );

  assert.deepEqual(
    getBossRewardResolution({
      boss: { uid: 'boss-3' },
      enemies: [{ summonedByBossUid: 'boss-3' }],
      hazards: [],
    }),
    { action: 'await-boss-aftermath', bossUid: 'boss-3' }
  );

  assert.deepEqual(
    getBossRewardResolution({
      boss: { uid: 'boss-4' },
      enemies: [],
      hazards: [],
    }),
    { action: 'open-reward' }
  );
});

test('enemy spawn search finds an open slot before falling back to jitter', () => {
  const source = { x: 0, y: 0 };
  const enemyTemplate = { radius: 10 };
  const blockers = [
    { x: 46, y: 0, radius: 20 },
    { x: 14.214, y: 43.748, radius: 20 },
    { x: -37.214, y: 27.038, radius: 20 },
    { x: -37.214, y: -27.038, radius: 20 },
    { x: 14.214, y: -43.748, radius: 20 },
  ];

  const position = findOpenEnemySpawnPosition({
    source,
    enemyTemplate,
    blockers,
    baseRadius: 46,
    randomAngleOffset: () => 0,
    randomJitter: () => 0,
  });

  assert.ok(Math.hypot(position.x - source.x, position.y - source.y) >= 46);
  assert.ok(
    blockers.every(
      (blocker) => Math.hypot(position.x - blocker.x, position.y - blocker.y) >= enemyTemplate.radius + blocker.radius + 10
    )
  );
});
