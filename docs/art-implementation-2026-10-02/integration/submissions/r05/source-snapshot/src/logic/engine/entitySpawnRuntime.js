import { createBossEncounterRuntime, createEnemyRuntimeEntityFromKey } from './encounterRuntime.js';
import { getOwnedSummonBudget, getSummonOwnership } from './battlefieldRules.js';
import { ENEMY_TYPES } from '../../data/gameConfig.js';
import { findOpenEnemySpawnPosition, getBossSummonSpawnCount } from './bossFlowRules.js';

export const spawnEnemyGroupRuntime = ({ state, source, enemyKey, count, radius = 46, options = {} }) => {
  const enemyTemplate = ENEMY_TYPES[enemyKey];
  if (!enemyTemplate) return 0;
  const ownership = getSummonOwnership(source, options);
  const remaining = Math.min(getOwnedSummonBudget({ enemies: state.enemies, ...ownership, requestedCount: count }),
    getBossSummonSpawnCount({ enemies: state.enemies, bossUid: ownership.ownerBossUid,
      summonCategory: ownership.summonCategory ?? enemyKey, requestedCount: count, maxActive: options.maxActive }));
  let spawned = 0;
  for (let index = 0; index < remaining; index++) {
    const point = findOpenEnemySpawnPosition({ source, enemyTemplate,
      blockers: [...state.enemies, ...state.towers, state.player], baseRadius: radius + index * 6 });
    if (spawnEnemyRuntimeAt({ state, enemyKey, ...point, extras: { skipBurrowPosition: true,
      summonedByBossUid: ownership.ownerBossUid, summonedByEncounterUid: ownership.ownerEncounterUid,
      summonCategory: ownership.summonCategory ?? (ownership.ownerBossUid ? enemyKey : null) } })) spawned++;
  }
  return spawned;
};

export const spawnEnemyRuntimeAt = ({ state, enemyKey, x, y, extras = {}, random = Math.random }) => {
  if (extras.summonedByBossUid && getOwnedSummonBudget({ enemies: state.enemies, ownerBossUid: extras.summonedByBossUid,
    ownerEncounterUid: extras.summonedByEncounterUid, requestedCount: 1 }) === 0) return null;
  const enemy = {
    ...createEnemyRuntimeEntityFromKey({ enemyKey, uid: state.nextEnemyUid++ }),
    x,
    y,
    ...extras,
  };
  if (enemy.burrow?.emergeNearPlayer && !extras.skipBurrowPosition) {
    const angle = random() * Math.PI * 2;
    enemy.x = state.player.x + Math.cos(angle) * enemy.burrow.emergeNearPlayer;
    enemy.y = state.player.y + Math.sin(angle) * enemy.burrow.emergeNearPlayer;
  }
  state.enemies.push(enemy);
  return enemy;
};

export const spawnBossEncounterRuntimeAt = ({ state, bossTemplate, x, y }) => {
  const bosses = createBossEncounterRuntime({
    bossTemplate,
    x,
    y,
    allocateEnemyUid: () => state.nextEnemyUid++,
    allocateEncounterUid: () => state.nextBossEncounterUid++,
  });
  state.enemies.push(...bosses);
  return bosses;
};

export const applyWaveSpawnPlanRuntime = ({ state, spawnPlan, random = Math.random }) => {
  const enemies = spawnPlan.enemySpawns.map((enemySpawn) =>
    spawnEnemyRuntimeAt({
      state,
      enemyKey: enemySpawn.enemyKey,
      x: enemySpawn.x,
      y: enemySpawn.y,
      random,
    })
  );
  const bosses = spawnPlan.bossSpawn
    ? spawnBossEncounterRuntimeAt({
        state,
        bossTemplate: spawnPlan.bossSpawn.bossTemplate,
        x: spawnPlan.bossSpawn.x,
        y: spawnPlan.bossSpawn.y,
      })
    : [];

  return {
    enemies,
    bosses,
    bossSpotlightTemplate: spawnPlan.bossSpawn?.bossTemplate ?? null,
  };
};
