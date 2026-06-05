import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialTowerCatalog } from '../src/data/gameConfig.js';
import { WAVE_TABLE } from '../src/data/waveTable.js';
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
  const wave16 = createWaveDefinition(16);
  const wave17 = createWaveDefinition(17);

  assert.equal(WAVE_TABLE.length, 16);
  assert.equal(wave1.boss.id, WAVE_TABLE[0].bossId);
  assert.equal(wave16.boss.id, WAVE_TABLE[15].bossId);
  assert.equal(wave17.boss.id, WAVE_TABLE[0].bossId);
  assert.equal(wave1.label, WAVE_TABLE[0].label);
  assert.equal(wave16.focus, WAVE_TABLE[15].focus);
  assert.ok(wave1.queue.length > 0);
  assert.ok(wave16.queue.length > wave1.queue.length);
  assert.ok(wave17.boss.maxHp > wave1.boss.maxHp);
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
  assert.match(choices[0].title, /Unlock/);
  assert.match(choices[1].subtitle, /Lv\./);
  assert.equal(choices[2].title, 'Supply Cache');
  assert.match(choices[2].detail, /economy bump/i);
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

  assert.match(summary, /Cost/);
  assert.match(summary, /Damage/);
  assert.match(summary, /Range/);
  assert.match(summary, /Pierce/);
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
