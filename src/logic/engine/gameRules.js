import { BOSS_ORDER, BOSS_TYPES, ENEMY_TYPES } from '../../data/gameConfig';
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

export const createWaveDefinition = (waveNumber) => {
  const groups = [{ type: 'BASIC', count: 7 + waveNumber * 2 }];

  if (waveNumber >= 2) {
    groups.push({ type: 'FAST', count: 3 + waveNumber });
  }

  if (waveNumber >= 3) {
    groups.push({ type: 'TANK', count: 1 + Math.floor(waveNumber / 2) });
  }

  if (waveNumber >= 4) {
    groups.push({ type: 'SHARD', count: 2 + Math.floor(waveNumber / 2) });
  }

  if (waveNumber >= 5) {
    groups.push({ type: 'SHIELD', count: 1 + Math.floor(waveNumber / 3) });
  }

  if (waveNumber >= 6) {
    groups.push({ type: 'BOMBER', count: 1 + Math.floor(waveNumber / 3) });
  }

  if (waveNumber >= 7) {
    groups.push({ type: 'MEDIC', count: 1 + Math.floor(waveNumber / 4) });
  }

  if (waveNumber >= 8) {
    groups.push({ type: 'JAMMER', count: 1 + Math.floor(waveNumber / 5) });
  }

  if (waveNumber >= 9) {
    groups.push({ type: 'PHASE', count: 2 + Math.floor(waveNumber / 4) });
  }

  if (waveNumber >= 10) {
    groups.push({ type: 'SCOUT', count: 2 + Math.floor(waveNumber / 4) });
  }

  if (waveNumber >= 11) {
    groups.push({ type: 'BEACON', count: 1 + Math.floor(waveNumber / 5) });
  }

  if (waveNumber >= 12) {
    groups.push({ type: 'BURROWER', count: 1 + Math.floor(waveNumber / 5) });
  }

  if (waveNumber >= 13) {
    groups.push({ type: 'SIEGE', count: 1 + Math.floor(waveNumber / 6) });
  }

  const bossTemplate = BOSS_TYPES[BOSS_ORDER[(waveNumber - 1) % BOSS_ORDER.length]];
  const hpScale = 1 + waveNumber * 0.12;

  return {
    number: waveNumber,
    spawnInterval: Math.max(0.35, 0.95 - waveNumber * 0.05),
    queue: interleaveGroups(groups),
    boss: {
      ...bossTemplate,
      enemyType: 'BOSS',
      hp: Math.round(bossTemplate.hp * hpScale),
      maxHp: Math.round(bossTemplate.hp * hpScale),
      damage: Math.round(bossTemplate.damage + waveNumber * 2),
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
