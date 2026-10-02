import { buildTowerAtLevel } from './towerRules.js';

export const DEBUG_TOWER_LAYOUTS = {
  balanced: [
    ['SENTINEL', -120, -40],
    ['BASIC', -40, -120],
    ['CANNON', 0, 105],
    ['FROST', 130, -35],
    ['SNIPER', 210, -120],
    ['RAPID', -210, 110],
  ],
  spread: [
    ['RAIL', -260, -150],
    ['SNIPER', 250, -140],
    ['MORTAR', 0, -210],
    ['BURST', -200, 170],
    ['FROST', 0, 180],
    ['CANNON', 210, 165],
  ],
  boss: [
    ['SENTINEL', -150, 0],
    ['SENTINEL', 150, 0],
    ['CANNON', 0, 140],
    ['FROST', 0, -145],
    ['BURST', -210, 140],
    ['RAIL', 220, -120],
  ],
};

export const createPlacedTower = ({ tower, uid, x, y }) => ({
  ...tower,
  uid,
  x,
  y,
  hp: tower.hp,
  maxHp: tower.hp,
  lastShoot: 0,
});

export const unlockAllTowerBlueprints = (catalog) => catalog.map((tower) => ({ ...tower, available: true }));

export const createDebugLayoutTowers = ({ layoutId, catalog, player, allocateTowerUid }) => {
  const layout = DEBUG_TOWER_LAYOUTS[layoutId];
  if (!layout) {
    return null;
  }

  return layout
    .map(([towerId, offsetX, offsetY]) => {
      const tower = catalog.find((candidate) => candidate.id === towerId);
      if (!tower) {
        return null;
      }
      return createPlacedTower({
        tower,
        uid: allocateTowerUid(),
        x: player.x + offsetX,
        y: player.y + offsetY,
      });
    })
    .filter(Boolean);
};

export const applyDebugTowerLayoutRuntime = ({ state, layoutId, catalog }) => {
  const towers = createDebugLayoutTowers({
    layoutId,
    catalog,
    player: state.player,
    allocateTowerUid: () => state.nextTowerUid++,
  });
  if (!towers) {
    return {
      applied: false,
      towers: [],
      message: null,
    };
  }

  state.towers = towers;
  return {
    applied: true,
    towers,
    message: {
      title: 'Layout Loaded',
      subtitle: `${layoutId} preset applied`,
      tone: 'system',
    },
    messageDuration: 1500,
  };
};

export const updateTowerBlueprintLevel = ({ catalog, towerId, delta }) =>
  catalog.map((tower) => {
    if (tower.id !== towerId) return tower;
    return buildTowerAtLevel(tower, (tower.level ?? 0) + delta);
  });

export const updatePlacedTowerLevel = ({ towers, towerUid, delta }) => {
  const tower = towers.find((candidate) => candidate.uid === towerUid);
  if (!tower) {
    return { updated: false, tower: null };
  }

  const nextTower = buildTowerAtLevel(tower, (tower.level ?? 0) + delta);
  Object.assign(tower, nextTower, {
    uid: tower.uid,
    x: tower.x,
    y: tower.y,
    hp: Math.min(nextTower.hp, Math.max(1, tower.hp + (nextTower.hp - tower.maxHp))),
    maxHp: nextTower.hp,
    lastShoot: tower.lastShoot,
  });

  return { updated: true, tower };
};
