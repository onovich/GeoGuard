import { createBossEncounterRuntime, createEnemyRuntimeEntityFromKey } from './encounterRuntime.js';

export const spawnEnemyRuntimeAt = ({ state, enemyKey, x, y, extras = {}, random = Math.random }) => {
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
