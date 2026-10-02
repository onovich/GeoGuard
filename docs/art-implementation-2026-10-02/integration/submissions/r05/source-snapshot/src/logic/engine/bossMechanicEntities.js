import { BOSS_LIMITS, MECHANIC_LABELS } from '../../data/bossMechanics.js';
import { findMechanicPosition, getOwnedSummonBudget } from './battlefieldRules.js';

export const getBossMechanics = (state, bossUid, kind) => state.enemies.filter((enemy) => enemy.hp > 0 &&
  enemy.summonedByBossUid === bossUid && enemy.mechanic && (!kind || enemy.mechanic.kind === kind));

export const spawnBossMechanic = ({ state, boss, kind, x, y, hp = 24, radius = 13, limit = BOSS_LIMITS.mechanicsPerBoss, cargo = 0, targetUid = null }) => {
  if (!getOwnedSummonBudget({ enemies: state.enemies, ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid, requestedCount: 1 }) || getBossMechanics(state, boss.uid).length >= BOSS_LIMITS.mechanicsPerBoss || getBossMechanics(state, boss.uid, kind).length >= limit) return null;
  const point = findMechanicPosition(state, { x, y }, radius);
  if (!point) return null;
  const entity = {
    uid: state.nextEnemyUid++, id: `MECHANIC_${kind.toUpperCase()}`, name: MECHANIC_LABELS[kind],
    ...point, hp, maxHp: hp, radius, damage: 0, speed: 0, baseSpeed: 0, value: 0,
    color: boss.color, shield: 0, maxShield: 0, slowTimer: 0, slowRatio: 1, hitFlash: 0,
    summonedByBossUid: boss.uid, summonedByEncounterUid: boss.encounterUid ?? null,
    summonCategory: `mechanic:${kind}`,
    mechanic: { kind, cargo, targetUid, solid: kind === 'wall', timer: ['seal', 'reticle'].includes(kind) ? 1.5 : 3,
      life: kind === 'courier' ? 8 : kind === 'wall' ? 14 : ['seal', 'reticle'].includes(kind) ? 2 : 18,
    },
  };
  if (kind === 'courier') {
    const angle = Math.atan2(entity.y - state.player.y, entity.x - state.player.x);
    entity.mechanic.escapeVx = Math.cos(angle) * 95;
    entity.mechanic.escapeVy = Math.sin(angle) * 95;
  }
  state.enemies.push(entity);
  return entity;
};

export const queueMechanicTerrain = ({ state, boss, entity, queueAreaHazard }) => {
  const kind = entity.mechanic.kind;
  if (kind !== 'web' && kind !== 'root') return;
  queueAreaHazard(entity.x, entity.y, {
    radius: kind === 'web' ? 52 : 44,
    damage: kind === 'web' ? 3 : 4, delay: 1.1, pulses: 10, pulseInterval: 1,
    radiusStep: kind === 'root' ? 2 : 0, slowRatio: kind === 'web' ? 0.65 : 0.8, slowDuration: 1.2,
    terrain: true, label: kind === 'web' ? 'web' : 'poison', color: boss.color,
    ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, ownerMechanicUid: entity.uid,
  });
};

export const tickBossMechanicRuntime = ({ state, enemy, dt, spawnAround, queueAreaHazard }) => {
  const mechanic = enemy.mechanic;
  if (!mechanic || enemy.hp <= 0) return;
  const boss = state.enemies.find((entity) => entity.uid === enemy.summonedByBossUid && entity.isBoss && entity.hp > 0);
  if (!boss) { enemy.hp = 0; return; }
  mechanic.life -= dt;
  mechanic.timer -= dt;
  if (mechanic.kind === 'courier') {
    enemy.x += mechanic.escapeVx * dt;
    enemy.y += mechanic.escapeVy * dt;
    if (mechanic.life <= 0) { mechanic.escaped = true; enemy.hp = 0; }
    return;
  }
  if (mechanic.life <= 0) { enemy.hp = 0; return; }
  if (mechanic.timer > 0) return;
  if (mechanic.kind === 'nest') {
    spawnAround(enemy, 'BASIC', 3, 32, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid,
      summonCategory: 'hiveBrood', maxActive: 12 });
    mechanic.timer = 6;
  } else if (mechanic.kind === 'seal') {
    const tower = state.towers.find((candidate) => candidate.uid === mechanic.targetUid && candidate.hp > 0);
    if (tower) tower.frozenTimer = Math.max(tower.frozenTimer ?? 0, 1.6);
    enemy.hp = 0;
  } else if (mechanic.kind === 'reticle') {
    const tower = state.towers.find((candidate) => candidate.uid === mechanic.targetUid && candidate.hp > 0);
    if (tower) queueAreaHazard(tower.x, tower.y, { radius: 32, damage: 22, delay: 0.8,
      label: 'mark', color: boss.color, ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null });
    enemy.hp = 0;
  } else if (mechanic.kind === 'root') {
    const angle = (enemy.uid % 6) * Math.PI / 3;
    const child = spawnBossMechanic({ state, boss, kind: 'root', x: enemy.x + Math.cos(angle) * 92, y: enemy.y + Math.sin(angle) * 92,
      hp: 24, limit: BOSS_LIMITS.roots });
    if (child) {
      child.mechanic.parentUid = enemy.uid;
      queueMechanicTerrain({ state, boss, entity: child, queueAreaHazard });
    }
    mechanic.timer = 4;
  } else {
    mechanic.timer = 100;
  }
};

export const settleMechanicDefeatRuntime = ({ state, enemy }) => {
  if (!enemy.mechanic || enemy.mechanic.settled) return 0;
  enemy.mechanic.settled = true;
  state.hazards = state.hazards.filter((hazard) => hazard.ownerMechanicUid !== enemy.uid);
  const refund = enemy.mechanic.kind === 'courier' && !enemy.mechanic.escaped ? enemy.mechanic.cargo : 0;
  state.money += refund;
  return refund;
};

export const expireBossMechanicsRuntime = (state, boss) => {
  for (const enemy of state.enemies) {
    if (enemy.mechanic && enemy.summonedByBossUid === boss.uid) enemy.hp = 0;
  }
  // Sustained terrain ends with its owner; ordinary attack aftermath still settles normally.
  state.hazards = state.hazards.filter((hazard) => !(hazard.terrain && hazard.ownerBossUid === boss.uid));
};
