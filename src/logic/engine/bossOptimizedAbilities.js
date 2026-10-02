import { BOSS_LIMITS } from '../../data/bossMechanics.js';
import { getBossMechanics, queueMechanicTerrain, spawnBossMechanic } from './bossMechanicEntities.js';
import { runBossAbilityEffect } from './bossAbilityRuntime.js';
import { dist } from './gameMath.js';

const pointFor = (boss, state) => boss.bossState.lockedPlayerPoint ?? state.player;
const ownershipFor = (boss) => ({ ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null });
const beatFor = (boss) => Math.max(0.55, 0.75 - Math.max(0, boss.currentPhaseIndex) * 0.1);
const plant = (context, kind, point, options = {}) => {
  const entity = spawnBossMechanic({ state: context.state, boss: context.boss, kind, ...point, ...options });
  if (entity) queueMechanicTerrain({ ...context, entity });
  return entity;
};

const placeWalls = (context) => {
  const { state, boss } = context;
  const center = pointFor(boss, state);
  for (const wall of getBossMechanics(state, boss.uid, 'wall')) wall.hp = 0;
  const horizontal = Boolean(boss.bossState.horizontalGates);
  for (const side of [-1, 1]) for (const offset of [-110, -60, 60, 110]) {
    const x = horizontal ? center.x + offset : center.x + side * 110;
    const y = horizontal ? center.y + side * 110 : center.y + offset;
    plant(context, 'wall', { x, y }, { radius: 18, hp: 28, limit: BOSS_LIMITS.walls });
  }
};

const stealWithCourier = (context, amount) => {
  const { boss, state, syncHudMoney, spawnFloatingText } = context;
  const stolen = state.debugOptions.infiniteMoney ? 0 : Math.min(state.money, amount);
  if (!stolen) return;
  const courier = plant(context, 'courier', { x: boss.x + 60, y: boss.y + 40 }, { hp: 18, cargo: stolen, limit: BOSS_LIMITS.couriers });
  if (!courier) return;
  state.money -= stolen;
  syncHudMoney();
  spawnFloatingText(courier.x, courier.y - 20, `击破追回 ${stolen}`, boss.color);
};

// These handlers add concrete interactable mechanics. Other authored patterns keep their geometry.
const handlers = {
  markTower: (c) => {
    const tower = [...c.state.towers].filter((tower) => tower.hp > 0).sort((a, b) => dist(a, c.boss) - dist(b, c.boss))[0];
    if (tower) plant(c, 'reticle', { x: (tower.x + c.boss.x) / 2, y: (tower.y + c.boss.y) / 2 }, { hp: 16, targetUid: tower.uid, limit: 2 });
  },
  mirrorStep: (c) => {
    const p = pointFor(c.boss, c.state);
    const angle = Math.atan2(c.boss.y - p.y, c.boss.x - p.x) + Math.PI / 2;
    const old = { x: c.boss.x, y: c.boss.y };
    c.boss.x = p.x + Math.cos(angle) * 190;
    c.boss.y = p.y + Math.sin(angle) * 190;
    c.queueLineHazard(old, c.boss, { length: dist(old, c.boss), width: 10, damage: 14, delay: 1,
      label: 'mirror', color: c.boss.color, ...ownershipFor(c.boss) });
  },
  spawnHive: (c) => {
    for (const side of [-1, 1]) plant(c, 'nest', { x: c.boss.x + side * 85, y: c.boss.y + 45 }, { hp: 36, limit: BOSS_LIMITS.nests });
  },
  broodShift: (c) => {
    const nodes = getBossMechanics(c.state, c.boss.uid, 'nest');
    if (!nodes.length) return handlers.spawnHive(c);
    const node = nodes[(c.boss.bossState.migrationIndex ?? 0) % nodes.length];
    c.boss.bossState.migrationIndex = (c.boss.bossState.migrationIndex ?? 0) + 1;
    c.boss.x = node.x + 48;
    c.boss.y = node.y;
  },
  hivePulse: (c) => {
    for (const node of getBossMechanics(c.state, c.boss.uid, 'nest')) {
      c.queueAreaHazard(node.x, node.y, { radius: 80, damage: 8, delay: 1, label: 'brood', color: c.boss.color,
        ...ownershipFor(c.boss), ownerMechanicUid: node.uid });
    }
  },
  hiveCollapse: (c) => {
    for (const node of getBossMechanics(c.state, c.boss.uid, 'nest')) {
      c.queueAreaHazard(node.x, node.y, { radius: 100, damage: 14, delay: 1.2, label: 'brood', color: c.boss.color,
        ...ownershipFor(c.boss), ownerMechanicUid: node.uid });
    }
  },
  stealMoney: (c) => stealWithCourier(c, 12),
  taxBeacon: (c) => {
    const point = pointFor(c.boss, c.state);
    c.queueAreaHazard(point.x, point.y, { radius: 64, damage: 8, delay: 1, label: 'coin', color: c.boss.color, ...ownershipFor(c.boss) });
  },
  repossess: (c) => {
    const point = c.boss.bossState.lockedTarget ?? pointFor(c.boss, c.state);
    c.queueAreaHazard(point.x, point.y, { radius: 70, damage: 16, delay: 1.1, label: 'coin', color: c.boss.color, ...ownershipFor(c.boss) });
    stealWithCourier(c, 8);
  },
  frostRing: (c) => c.queueAreaHazard(c.boss.x, c.boss.y, { radius: 135, damage: 8, slowRatio: 0.75,
    slowDuration: 1.4, delay: 1.1, label: 'frost', color: c.boss.color, ...ownershipFor(c.boss) }),
  freezeTower: (c) => {
    const tower = [...c.state.towers].filter((tower) => tower.hp > 0).sort((a, b) => dist(a, c.boss) - dist(b, c.boss))[0];
    if (tower) plant(c, 'seal', { x: (tower.x + c.boss.x) / 2, y: (tower.y + c.boss.y) / 2 }, { hp: 16, targetUid: tower.uid, limit: 2 });
  },
  coldSnap: (c) => {
    for (const tower of [...c.state.towers].filter((tower) => tower.hp > 0).sort((a, b) => b.cost - a.cost).slice(0, 2)) {
      plant(c, 'seal', { x: (tower.x + c.boss.x) / 2, y: (tower.y + c.boss.y) / 2 }, { hp: 16, targetUid: tower.uid, limit: 2 });
    }
  },
  webTrap: (c) => plant(c, 'web', pointFor(c.boss, c.state), { hp: 16, limit: BOSS_LIMITS.webs }),
  silkVolley: (c) => {
    const p = pointFor(c.boss, c.state);
    for (const side of [-1, 1]) plant(c, 'web', { x: p.x + side * 85, y: p.y + 45 }, { hp: 16, limit: BOSS_LIMITS.webs });
  },
  nestBloom: (c) => {
    for (const side of [-1, 1]) plant(c, 'web', { x: c.boss.x + side * 100, y: c.boss.y + 70 }, { hp: 20, limit: BOSS_LIMITS.webs });
  },
  webField: (c) => {
    handlers.nestBloom(c);
    c.spawnAround(c.boss, 'SPLINTER', 3, 45, { ...ownershipFor(c.boss), summonCategory: 'spiderling', maxActive: 10 });
  },
  seedPods: (c) => {
    for (const side of [-1, 1]) plant(c, 'root', { x: c.boss.x + side * 90, y: c.boss.y + 55 }, { hp: 24, limit: BOSS_LIMITS.roots });
  },
  gardenWake: (c) => {
    handlers.seedPods(c);
    for (const enemy of c.state.enemies) if (!enemy.isBoss && !enemy.mechanic && dist(enemy, c.boss) < 220) enemy.hp = Math.min(enemy.maxHp, enemy.hp + 12);
    c.spawnAround(c.boss, 'SHARD', 3, 50, { ...ownershipFor(c.boss), summonCategory: 'gardenShard', maxActive: 8 });
  },
  creepingCanopy: (c) => handlers.seedPods(c),
  raiseWalls: (c) => placeWalls(c),
  gateSwap: (c) => { c.boss.bossState.horizontalGates = !c.boss.bossState.horizontalGates; placeWalls(c); },
  mazeCrush: (c) => {
    for (const wall of getBossMechanics(c.state, c.boss.uid, 'wall')) {
      c.queueAreaHazard(wall.x, wall.y, { radius: 48, damage: 12, delay: 1.2, label: 'wall', color: c.boss.color,
        ...ownershipFor(c.boss), ownerMechanicUid: wall.uid });
    }
  },
  deadEnd: (c) => handlers.mazeCrush(c),
  gravityWell: (c) => {
    const p = pointFor(c.boss, c.state);
    c.queueAreaHazard(p.x, p.y, { radius: 100, damage: 7, pull: 80, maxPullStep: 14, delay: 1.1,
      pulses: 2, pulseInterval: 1.2, label: 'gravity', color: c.boss.color, ...ownershipFor(c.boss) });
  },
  singularity: (c) => c.queueAreaHazard(c.boss.x, c.boss.y, { radius: 180, damage: 12, pull: 90, maxPullStep: 16,
    delay: 1.5, pulses: 3, pulseInterval: 1.2, label: 'singularity', color: c.boss.color, ...ownershipFor(c.boss) }),
  sacrificeMinions: (c) => {
    const marked = c.boss.bossState.sacrificeTargets ?? [];
    const victims = c.state.enemies.filter((enemy) => marked.includes(enemy.uid) && enemy.hp > 0 && dist(enemy, c.boss) <= 180);
    for (const enemy of victims) { enemy.hp = 0; enemy.consumed = true; }
    c.boss.hp = Math.min(c.boss.maxHp, c.boss.hp + victims.length * 28);
    c.boss.shield = Math.max(c.boss.shield ?? 0, victims.length * 24);
    c.boss.maxShield = Math.max(c.boss.maxShield ?? 0, c.boss.shield);
    c.boss.bossState.forgeHeat = victims.length;
    c.queueAreaHazard(c.boss.x, c.boss.y, { radius: 95 + victims.length * 12, damage: 8 + victims.length * 3,
      delay: 1, label: 'slag', color: c.boss.color, ...ownershipFor(c.boss) });
  },
  quake: (c) => c.queueAreaHazard(c.boss.x, c.boss.y, { radius: 120, damage: 14, delay: 1,
    label: 'bunker', color: c.boss.color, ...ownershipFor(c.boss) }),
  wingBuffet: (c) => c.queueAreaHazard(c.boss.x, c.boss.y, { radius: 150, damage: 12, pull: -80, delay: 1.1,
    label: 'breath', color: c.boss.color, ...ownershipFor(c.boss) }),
  skyDive: (c) => {
    const p = pointFor(c.boss, c.state);
    const distance = Math.max(1, dist(c.boss, p));
    c.boss.dashTimer = Math.min(0.6, distance / 500);
    c.boss.dashVx = (p.x - c.boss.x) / distance * 500;
    c.boss.dashVy = (p.y - c.boss.y) / distance * 500;
    c.queueAreaHazard(p.x, p.y, { radius: 100, damage: 22, delay: 1.3, label: 'dive', color: c.boss.color, ...ownershipFor(c.boss) });
  },
  conductLines: (c) => {
    const p = pointFor(c.boss, c.state);
    for (const [index, side] of [-1, 1].entries()) c.queueLineHazard({ x: p.x - 220, y: p.y + side * 50 },
      { x: p.x + 220, y: p.y + side * 50 }, { width: 10, damage: 12, delay: (index + 1) * beatFor(c.boss),
        length: 440, label: 'tempo', color: c.boss.color, ...ownershipFor(c.boss) });
  },
  pulseMeasure: (c) => {
    const p = pointFor(c.boss, c.state);
    for (const [index, [x, y]] of [[-90, -60], [90, -60], [90, 60], [-90, 60]].entries()) {
      c.queueAreaHazard(p.x + x, p.y + y, { radius: 40, damage: 7, delay: (index + 1) * beatFor(c.boss),
        label: 'beat', color: c.boss.color, ...ownershipFor(c.boss) });
    }
  },
  tempoShift: (c) => {
    c.boss.bossState.nextBeat = c.boss.bossState.combatTime + beatFor(c.boss);
    c.spawnAround(c.boss, 'FAST', 2, 48, { ...ownershipFor(c.boss), summonCategory: 'tempoRunner', maxActive: 6 });
  },
  syncopate: (c) => {
    const p = pointFor(c.boss, c.state);
    for (let index = 0; index < 3; index++) c.queueLineHazard({ x: p.x - 220, y: p.y - 70 + index * 70 },
      { x: p.x + 220, y: p.y - 70 + index * 70 }, { width: 9, damage: 12, delay: (index + 1) * beatFor(c.boss),
        length: 440, label: 'tempo', color: c.boss.color, ...ownershipFor(c.boss) });
  },
  crescendo: (c) => {
    const p = pointFor(c.boss, c.state);
    for (let index = 0; index < 4; index++) c.queueAreaHazard(p.x, p.y, { radius: 40 + index * 18, damage: 8,
      delay: (index + 1) * beatFor(c.boss), label: 'beat', color: c.boss.color, ...ownershipFor(c.boss) });
  },
  finale: (c) => {
    for (let index = 0; index < 8; index++) {
      const angle = index * Math.PI / 4;
      c.queueLineHazard(c.boss, { x: c.boss.x + Math.cos(angle) * 220, y: c.boss.y + Math.sin(angle) * 220 },
        { width: 9, damage: 12, delay: beatFor(c.boss) * 2, length: 620, label: 'tempo', color: c.boss.color, ...ownershipFor(c.boss) });
    }
  },
  soloSolarVolley: (c) => {
    const p = pointFor(c.boss, c.state);
    const angle = Math.atan2(p.y - c.boss.y, p.x - c.boss.x);
    for (const offset of [-0.35, 0, 0.35]) c.queueLineHazard(c.boss,
      { x: c.boss.x + Math.cos(angle + offset) * 300, y: c.boss.y + Math.sin(angle + offset) * 300 },
      { width: 10, damage: 14, delay: 0.9, label: 'flare', color: c.boss.color, ...ownershipFor(c.boss) });
  },
  soloLunarOrbit: (c) => {
    const p = pointFor(c.boss, c.state);
    for (let index = 0; index < 4; index++) {
      const angle = index * Math.PI / 2;
      c.queueAreaHazard(p.x + Math.cos(angle) * 130, p.y + Math.sin(angle) * 130,
        { radius: 45, damage: 10, delay: 1, label: 'moon', color: c.boss.color, ...ownershipFor(c.boss) });
    }
  },
};

export const runBossOptimizedAbility = (context) => {
  const handler = handlers[context.abilityName];
  if (handler) handler(context);
  else runBossAbilityEffect(context);
};
