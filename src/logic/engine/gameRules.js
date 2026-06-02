import { BOSS_TYPES } from '../../data/gameConfig';
import { dist } from './gameMath';

export const getSpawnPosition = (camera, viewportWidth, viewportHeight) => {
  const angle = Math.random() * Math.PI * 2;
  const spawnRadius = Math.max(viewportWidth, viewportHeight) / 2 + 100;

  return {
    x: camera.x + Math.cos(angle) * spawnRadius,
    y: camera.y + Math.sin(angle) * spawnRadius,
  };
};

export const canPlaceTower = (position, towerConfig, player, towers) => {
  const tooClosePlayer = dist(position, player) < towerConfig.radius + player.radius + 5;
  const tooCloseTower = towers.some((tower) => dist(position, tower) < towerConfig.radius + tower.radius + 5);

  return !tooClosePlayer && !tooCloseTower;
};

export const canPlaceTowerOnField = (position, towerConfig, player, towers, enemies) => {
  const blockedByEnemy = enemies.some((enemy) => dist(position, enemy) < towerConfig.radius + enemy.radius + 8);
  return canPlaceTower(position, towerConfig, player, towers) && !blockedByEnemy;
};

const interleaveGroups = (groups) => {
  const queue = [];
  const maxCount = Math.max(...groups.map((group) => group.count));

  for (let index = 0; index < maxCount; index += 1) {
    for (const group of groups) {
      if (index < group.count) {
        queue.push(group.type);
      }
    }
  }

  return queue;
};

const WAVE_RECIPES = [
  { bossId: 'COMMANDER', spawnInterval: 0.95, groups: [{ type: 'BASIC', count: 9 }] },
  { bossId: 'HUNTER', spawnInterval: 0.9, groups: [{ type: 'BASIC', count: 11 }, { type: 'FAST', count: 5 }] },
  { bossId: 'FORTRESS', spawnInterval: 0.86, groups: [{ type: 'BASIC', count: 12 }, { type: 'FAST', count: 5 }, { type: 'TANK', count: 2 }] },
  { bossId: 'PRISM', spawnInterval: 0.82, groups: [{ type: 'BASIC', count: 13 }, { type: 'FAST', count: 4 }, { type: 'SHARD', count: 4 }] },
  { bossId: 'HIVE', spawnInterval: 0.78, groups: [{ type: 'BASIC', count: 12 }, { type: 'TANK', count: 2 }, { type: 'SHIELD', count: 3 }] },
  { bossId: 'FROST_JUDGE', spawnInterval: 0.74, groups: [{ type: 'BASIC', count: 12 }, { type: 'FAST', count: 6 }, { type: 'BOMBER', count: 3 }] },
  { bossId: 'RAIL_WARLORD', spawnInterval: 0.7, groups: [{ type: 'BASIC', count: 10 }, { type: 'TANK', count: 3 }, { type: 'SHARD', count: 4 }, { type: 'MEDIC', count: 2 }] },
  { bossId: 'COLLECTOR', spawnInterval: 0.66, groups: [{ type: 'BASIC', count: 10 }, { type: 'FAST', count: 7 }, { type: 'SHIELD', count: 3 }, { type: 'JAMMER', count: 2 }] },
  { bossId: 'TWINS', spawnInterval: 0.63, groups: [{ type: 'BASIC', count: 9 }, { type: 'SHARD', count: 4 }, { type: 'SCOUT', count: 4 }, { type: 'PHASE', count: 4 }] },
  { bossId: 'DRAGON', spawnInterval: 0.6, groups: [{ type: 'BASIC', count: 8 }, { type: 'TANK', count: 3 }, { type: 'BOMBER', count: 4 }, { type: 'SCOUT', count: 5 }] },
  { bossId: 'SPIDER_MATRIARCH', spawnInterval: 0.57, groups: [{ type: 'BASIC', count: 8 }, { type: 'SHARD', count: 5 }, { type: 'MEDIC', count: 2 }, { type: 'BURROWER', count: 3 }] },
  { bossId: 'ASTROLABE', spawnInterval: 0.54, groups: [{ type: 'BASIC', count: 8 }, { type: 'SHIELD', count: 4 }, { type: 'JAMMER', count: 3 }, { type: 'PHASE', count: 5 }] },
  { bossId: 'BLOOD_FORGE', spawnInterval: 0.51, groups: [{ type: 'BASIC', count: 7 }, { type: 'TANK', count: 4 }, { type: 'BOMBER', count: 4 }, { type: 'SIEGE', count: 3 }] },
  { bossId: 'VOID_CONDUCTOR', spawnInterval: 0.48, groups: [{ type: 'BASIC', count: 7 }, { type: 'FAST', count: 8 }, { type: 'JAMMER', count: 3 }, { type: 'PHASE', count: 5 }] },
  { bossId: 'LABYRINTH_KEEPER', spawnInterval: 0.45, groups: [{ type: 'BASIC', count: 6 }, { type: 'SHIELD', count: 5 }, { type: 'BURROWER', count: 4 }, { type: 'SIEGE', count: 4 }] },
  { bossId: 'NIGHTMARE_BLOOM', spawnInterval: 0.42, groups: [{ type: 'BASIC', count: 6 }, { type: 'SHARD', count: 6 }, { type: 'MEDIC', count: 3 }, { type: 'BEACON', count: 3 }, { type: 'PHASE', count: 4 }] },
];

const scaleGroupsForCycle = (groups, cycleNumber, waveNumber) =>
  groups.map((group) => ({
    ...group,
    count: group.count + cycleNumber * (group.type === 'BASIC' ? 4 : 2) + Math.floor(waveNumber / 24),
  }));

export const createWaveDefinition = (waveNumber) => {
  const recipe = WAVE_RECIPES[(waveNumber - 1) % WAVE_RECIPES.length];
  const cycleNumber = Math.floor((waveNumber - 1) / WAVE_RECIPES.length);
  const groups = scaleGroupsForCycle(recipe.groups, cycleNumber, waveNumber);
  const bossTemplate = BOSS_TYPES[recipe.bossId];
  const hpScale = 1 + waveNumber * 0.07 + cycleNumber * 0.25;
  const damageScale = 1 + cycleNumber * 0.12;

  return {
    number: waveNumber,
    spawnInterval: Math.max(0.32, recipe.spawnInterval - cycleNumber * 0.04),
    queue: interleaveGroups(groups),
    boss: {
      ...bossTemplate,
      enemyType: 'BOSS',
      hp: Math.round(bossTemplate.hp * hpScale),
      maxHp: Math.round(bossTemplate.hp * hpScale),
      damage: Math.round((bossTemplate.damage + waveNumber * 1.4) * damageScale),
      value: bossTemplate.value + waveNumber * 6,
      isBoss: true,
    },
  };
};

export const findNearestTarget = (source, candidates, maxRange) => {
  let nearestDistance = maxRange;
  let target = null;

  for (const candidate of candidates) {
    const distance = dist(source, candidate);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      target = candidate;
    }
  }

  return target;
};
