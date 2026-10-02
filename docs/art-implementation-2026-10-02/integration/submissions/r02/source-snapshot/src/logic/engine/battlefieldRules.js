import { BOSS_LIMITS } from '../../data/bossMechanics.js';
import { dist } from './gameMath.js';

export const applyPlayerSlow = (player, ratio, duration = 1.5) => {
  if (!ratio || (player.controlGraceTimer ?? 0) > 0 || (player.slowTimer ?? 0) > 0) return false;
  player.slowRatio = Math.max(BOSS_LIMITS.minPlayerSlow, Math.min(1, ratio));
  player.slowTimer = Math.min(BOSS_LIMITS.maxPlayerSlowDuration, Math.max(0, duration));
  return true;
};

export const tickPlayerControl = (player, dt) => {
  player.controlGraceTimer = Math.max(0, (player.controlGraceTimer ?? 0) - dt);
  const wasSlowed = (player.slowTimer ?? 0) > 0;
  player.slowTimer = Math.max(0, (player.slowTimer ?? 0) - dt);
  if (wasSlowed && player.slowTimer === 0) player.controlGraceTimer = BOSS_LIMITS.controlGrace;
  if (player.slowTimer === 0) player.slowRatio = 1;
  return player.speed * (player.slowRatio ?? 1);
};

export const getAreaWarningDuration = ({ player, x, y, radius, delay }) => {
  const escapeDistance = Math.max(0, radius + player.radius + 8 - Math.hypot(player.x - x, player.y - y));
  const speed = Math.max(1, player.speed * (player.slowRatio ?? 1));
  return Math.max(delay, escapeDistance / speed + 0.25);
};

export const movePlayerOnBattlefield = ({ player, dx, dy, dt, enemies }) => {
  const speed = player.speed * (player.slowRatio ?? 1);
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) * speed * dt / 8));
  const solids = enemies.filter((enemy) => enemy.mechanic?.solid && enemy.hp > 0);
  const open = (x, y) => solids.every((wall) => Math.hypot(x - wall.x, y - wall.y) >= wall.radius + player.radius);
  for (let step = 0; step < steps; step++) {
    const nextX = player.x + dx * speed * dt / steps;
    if (open(nextX, player.y)) player.x = nextX;
    const nextY = player.y + dy * speed * dt / steps;
    if (open(player.x, nextY)) player.y = nextY;
  }
  return { x: player.x, y: player.y };
};

export const getSummonOwnership = (source, options = {}) => ({
  ownerBossUid: options.ownerBossUid ?? source.summonedByBossUid ?? (source.isBoss ? source.uid : null),
  ownerEncounterUid: options.ownerEncounterUid ?? source.summonedByEncounterUid ?? source.encounterUid ?? null,
  summonCategory: options.summonCategory ?? source.summonCategory,
});

export const getOwnedSummonBudget = ({ enemies, ownerBossUid, ownerEncounterUid, requestedCount }) => {
  if (!ownerBossUid) return requestedCount;
  const occupied = enemies.filter((enemy) => enemy.hp > 0 && !enemy.isBoss &&
    (ownerEncounterUid ? enemy.summonedByEncounterUid === ownerEncounterUid : enemy.summonedByBossUid === ownerBossUid)).length;
  return Math.max(0, Math.min(requestedCount, BOSS_LIMITS.summonedUnits - occupied));
};

export const createLineHazard = (source, target, options = {}) => {
  const angle = Math.atan2(target.y - source.y, target.x - source.x);
  const length = options.length ?? 620;
  const delay = options.delay ?? 0.8;
  return { ...options, type: 'line', x: source.x, y: source.y,
    x2: source.x + Math.cos(angle) * length, y2: source.y + Math.sin(angle) * length,
    width: options.width ?? 18, damage: options.damage ?? 26, timer: delay, maxTimer: delay,
    ownerBossUid: options.ownerBossUid ?? null, ownerEncounterUid: options.ownerEncounterUid ?? null,
  };
};

export const createAreaHazard = (player, x, y, options = {}) => {
  const radius = options.radius ?? 90;
  const delay = options.terrain ? options.delay ?? 0.9 : getAreaWarningDuration({ player, x, y, radius, delay: options.delay ?? 0.9 });
  return { ...options, type: 'area', x, y, radius, damage: options.damage ?? 18,
    pull: options.pull ?? 0, maxPullStep: options.maxPullStep ?? 18,
    timer: delay, maxTimer: delay, pulsesRemaining: options.pulses ?? 1,
    pulseInterval: options.pulseInterval ?? Math.max(0.5, delay * 0.7),
    radiusStep: options.radiusStep ?? 0, damageStep: options.damageStep ?? 0,
    ownerBossUid: options.ownerBossUid ?? null, ownerEncounterUid: options.ownerEncounterUid ?? null,
  };
};

export const findMechanicPosition = (state, point, radius) => {
  const blockers = [...state.towers, state.player, ...state.enemies.filter((enemy) => enemy.hp > 0 && enemy.mechanic?.solid)];
  for (let ring = 0; ring < 5; ring++) {
    for (let index = 0; index < 12; index++) {
      const angle = index * Math.PI / 6;
      const candidate = { x: point.x + Math.cos(angle) * ring * 28, y: point.y + Math.sin(angle) * ring * 28 };
      if (blockers.every((entity) => dist(candidate, entity) >= radius + entity.radius + 8)) return candidate;
    }
  }
  return null;
};
