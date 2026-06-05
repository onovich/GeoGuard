import { dist } from './gameMath.js';

export const resolveTargetDamage = ({ targetHp, amount, infiniteHealth = false }) => ({
  hp: infiniteHealth ? targetHp : targetHp - amount,
  appliedDamage: infiniteHealth ? 0 : amount,
});

export const resolveEnemyDamage = (enemy, amount) => {
  const phaseMultiplier = enemy.phased ? enemy.phase?.damageMultiplier ?? 0.25 : 1;
  const armorMultiplier = enemy.armoredTimer > 0 ? 0.65 : 1;
  let remainingDamage = amount * phaseMultiplier * armorMultiplier;
  const shield = enemy.shield ?? 0;
  let nextShield = shield;

  if (nextShield > 0) {
    const shieldDamage = Math.min(nextShield, remainingDamage);
    nextShield -= shieldDamage;
    remainingDamage -= shieldDamage;
  }

  const hpDamage = Math.max(0, remainingDamage);
  return {
    hp: enemy.hp - hpDamage,
    shield: nextShield,
    appliedDamage: shield - nextShield + hpDamage,
  };
};

export const isTargetWithinArea = (origin, radius, target) => dist(origin, target) <= radius + target.radius;

export const getAreaDamageHits = ({ origin, radius, player, towers, amount, towerFactor = 1 }) => ({
  playerHit: isTargetWithinArea(origin, radius, player),
  playerDamage: isTargetWithinArea(origin, radius, player) ? amount : 0,
  towerHits: towers.flatMap((tower, index) => (isTargetWithinArea(origin, radius, tower) ? [{ index, damage: amount * towerFactor }] : [])),
});

export const getPulledPosition = ({ target, hazard }) => {
  if (!hazard.pull) {
    return { x: target.x, y: target.y };
  }

  const angle = Math.atan2(hazard.y - target.y, hazard.x - target.x);
  const pullDistance = Math.min(hazard.pull * 0.18, hazard.radius * 0.35);
  return {
    x: target.x + Math.cos(angle) * pullDistance,
    y: target.y + Math.sin(angle) * pullDistance,
  };
};

export const isLineHazardHit = ({ hazard, target }) => {
  const lineLength = Math.hypot(hazard.x2 - hazard.x, hazard.y2 - hazard.y);
  if (lineLength <= 0) {
    return dist(target, hazard) <= hazard.width + target.radius;
  }

  const lineDx = (hazard.x2 - hazard.x) / lineLength;
  const lineDy = (hazard.y2 - hazard.y) / lineLength;
  const targetDx = target.x - hazard.x;
  const targetDy = target.y - hazard.y;
  const projection = Math.max(0, Math.min(lineLength, targetDx * lineDx + targetDy * lineDy));
  const closest = { x: hazard.x + lineDx * projection, y: hazard.y + lineDy * projection };
  return dist(target, closest) <= hazard.width + target.radius;
};
