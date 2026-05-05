import { ENEMY_TYPES } from '../../data/gameConfig';
import { dist } from './gameMath';

export const resolveEnemyType = (gameTime, randomValue = Math.random()) => {
  if (gameTime > 60 && randomValue > 0.9) {
    return ENEMY_TYPES.TANK;
  }

  if (gameTime > 30 && randomValue > 0.7) {
    return ENEMY_TYPES.FAST;
  }

  return ENEMY_TYPES.BASIC;
};

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