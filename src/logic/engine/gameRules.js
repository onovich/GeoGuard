import { ENEMY_TYPES } from '../../data/gameConfig';
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

const BOSS_ARCHETYPES = [
  { key: 'BASIC', name: '方阵统帅', speedFactor: 1.1, damageFactor: 2.2, radiusBonus: 14 },
  { key: 'FAST', name: '疾袭领主', speedFactor: 1.25, damageFactor: 2, radiusBonus: 12 },
  { key: 'TANK', name: '重装堡垒', speedFactor: 0.95, damageFactor: 2.8, radiusBonus: 18 },
];

export const createWaveDefinition = (waveNumber) => {
  const groups = [{ type: 'BASIC', count: 7 + waveNumber * 2 }];

  if (waveNumber >= 2) {
    groups.push({ type: 'FAST', count: 3 + waveNumber });
  }

  if (waveNumber >= 3) {
    groups.push({ type: 'TANK', count: 1 + Math.floor(waveNumber / 2) });
  }

  const bossArchetype = BOSS_ARCHETYPES[(waveNumber - 1) % BOSS_ARCHETYPES.length];
  const bossBase = ENEMY_TYPES[bossArchetype.key];
  const bossHp = Math.round((bossBase.hp * 7 + waveNumber * 55) * (1 + waveNumber * 0.08));

  return {
    number: waveNumber,
    spawnInterval: Math.max(0.35, 0.95 - waveNumber * 0.05),
    queue: interleaveGroups(groups),
    boss: {
      ...bossBase,
      id: `BOSS_${bossArchetype.key}`,
      name: bossArchetype.name,
      hp: bossHp,
      maxHp: bossHp,
      speed: Math.round(bossBase.speed * bossArchetype.speedFactor),
      damage: Math.round(bossBase.damage * bossArchetype.damageFactor + waveNumber * 2),
      radius: bossBase.radius + bossArchetype.radiusBonus,
      value: 22 + waveNumber * 6,
      isBoss: true,
      color: bossBase.color,
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