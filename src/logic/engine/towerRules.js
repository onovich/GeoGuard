import { TOWER_LIBRARY } from '../../data/gameConfig.js';

export const getTowerPreviewSummary = (tower) => {
  const tags = [`造价 ${tower.cost}`, `伤害 ${tower.damage}`, `射程 ${tower.range}`];
  if (tower.splash) tags.push(`溅射 ${tower.splash}`);
  if (tower.pierce) tags.push(`穿透 ${tower.pierce}`);
  if (tower.slowRatio) tags.push('减速');
  if (tower.burstCount) tags.push(`连发 ${tower.burstCount}`);
  return tags.join(' / ');
};

export const upgradeTowerStats = (tower) => ({
  ...tower,
  level: tower.level + 1,
  cost: Math.round(tower.cost * 1.32),
  damage: Math.max(tower.damage + 1, Math.round(tower.damage * 1.22)),
  range: Math.round(tower.range * 1.08),
  hp: Math.round(tower.hp * 1.16),
  fireRate: Math.max(0.1, Number((tower.fireRate * 0.93).toFixed(2))),
  splash: tower.splash ? Math.round(tower.splash * 1.14) : tower.splash,
  pierce: tower.pierce ? tower.pierce + 1 : tower.pierce,
  slowDuration: tower.slowDuration ? Number((tower.slowDuration * 1.12).toFixed(2)) : tower.slowDuration,
  slowRatio: tower.slowRatio ? Math.max(0.25, Number((tower.slowRatio - 0.06).toFixed(2))) : tower.slowRatio,
  burstCount: tower.burstCount && tower.level + 1 === 3 ? tower.burstCount + 1 : tower.burstCount,
});

export const buildTowerAtLevel = (tower, level) => {
  const baseTower = TOWER_LIBRARY[tower.id];
  const maxLevel = tower.maxLevel ?? 3;
  let nextTower = {
    ...baseTower,
    available: tower.available ?? true,
    level: 0,
    maxLevel,
    sortOrder: tower.sortOrder,
  };
  const targetLevel = Math.max(0, Math.min(maxLevel, level));

  for (let index = 0; index < targetLevel; index += 1) {
    nextTower = upgradeTowerStats(nextTower);
  }

  return nextTower;
};

export const upgradeTower = (tower) => buildTowerAtLevel(tower, (tower.level ?? 0) + 1);
export const downgradeTower = (tower) => buildTowerAtLevel(tower, (tower.level ?? 0) - 1);
