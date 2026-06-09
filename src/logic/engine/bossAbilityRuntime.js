import { COLORS } from '../../data/gameConfig.js';
import { dist, rand } from './gameMath.js';

const chooseBossTarget = (state, boss) => {
  let target = state.player;
  let targetDistance = dist(boss, target);
  for (const tower of state.towers) {
    const towerDistance = dist(boss, tower);
    if (towerDistance < targetDistance) {
      target = tower;
      targetDistance = towerDistance;
    }
  }
  return target;
};

export const runBossAbilityEffect = ({
  boss,
  abilityName,
  state,
  spawnAround,
  queueLineHazard,
  queueAreaHazard,
  spawnImpactWave,
  damageArea,
  damageTarget,
  spawnEnemyAt,
  spawnFloatingText,
  syncHudMoney,
  getBossOwnership,
  getEncounterPartner,
}) => {
  const target = chooseBossTarget(state, boss);
  const ownership = getBossOwnership(boss);
  const isClimaxPhase = boss.currentPhaseIndex === boss.phases.length - 1;
  const primeBossAbility = (abilityId, cooldown) => {
    if (!boss.phases?.[boss.currentPhaseIndex]?.abilities?.includes(abilityId)) return;
    const current = boss.abilityCooldowns[abilityId];
    boss.abilityCooldowns[abilityId] = current == null ? cooldown : Math.min(current, cooldown);
  };
  if (abilityName === 'summonFormation') spawnAround(boss, 'BASIC', 4, boss.radius + 32, { ownerBossUid: boss.uid, summonCategory: 'formation', maxActive: 8 });
  if (abilityName === 'commandLine') {
    const angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
    for (let index = -1; index <= 1; index += 1) {
      const offsetX = Math.cos(angle + Math.PI / 2) * index * 42;
      const offsetY = Math.sin(angle + Math.PI / 2) * index * 42;
      queueLineHazard(
        { x: boss.x + offsetX, y: boss.y + offsetY },
        { x: state.player.x + offsetX * 0.4, y: state.player.y + offsetY * 0.4 },
        { width: 12, damage: 16, color: COLORS.enemyBasic, delay: 0.7, length: 520, label: 'formation', ...ownership }
      );
    }
  }
  if (abilityName === 'shieldPulse') {
    for (const enemy of state.enemies) {
      if (enemy !== boss && dist(enemy, boss) <= 160) {
        enemy.shield = Math.max(enemy.shield ?? 0, 18);
        enemy.maxShield = Math.max(enemy.maxShield ?? 0, enemy.shield);
        enemy.armoredTimer = 4;
      }
    }
    spawnImpactWave(boss.x, boss.y, { maxRadius: 160, color: COLORS.enemyShield, fillAlpha: 0.08 });
  }
  if (abilityName === 'phalanxAdvance') {
    spawnAround(boss, 'SHIELD', 2, boss.radius + 36, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'phalanx', maxActive: 6 });
    queueAreaHazard(boss.x, boss.y, {
      radius: 145,
      damage: 10,
      delay: 0.75,
      slowRatio: 0.72,
      slowDuration: 1.6,
      pulses: 2,
      pulseInterval: 0.6,
      radiusStep: 12,
      color: COLORS.enemyShield,
      label: 'wall',
      ...ownership,
    });
  }
  if (abilityName === 'commandRush') {
    const angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
    boss.dashTimer = 0.4;
    boss.dashVx = Math.cos(angle) * 460;
    boss.dashVy = Math.sin(angle) * 460;
    queueLineHazard(boss, state.player, { width: 18, damage: 22, color: COLORS.enemyBasic, delay: 0.5, length: 420, label: 'charge', ...ownership });
    spawnImpactWave(boss.x, boss.y, { maxRadius: 58, color: COLORS.enemyBasic, fillAlpha: 0.1 });
  }
  if (abilityName === 'dashAtPlayer') {
    const angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
    boss.dashTimer = 0.42;
    boss.dashVx = Math.cos(angle) * 560;
    boss.dashVy = Math.sin(angle) * 560;
    spawnImpactWave(boss.x, boss.y, { maxRadius: 44, color: boss.color, life: 0.18 });
  }
  if (abilityName === 'markPrey') {
    queueLineHazard(boss, state.player, { width: 10, damage: 14, color: COLORS.enemyFast, delay: 0.45, length: 360, label: 'mark', ...ownership });
    queueAreaHazard(state.player.x, state.player.y, {
      radius: 64,
      damage: 10,
      delay: 0.8,
      pulses: 2,
      pulseInterval: 0.42,
      color: COLORS.enemyFast,
      label: 'hunt',
      ...ownership,
    });
  }
  if (abilityName === 'summonScouts') spawnAround(boss, 'SCOUT', 3, boss.radius + 38, { ownerBossUid: boss.uid, summonCategory: 'scouts', maxActive: 6 });
  if (abilityName === 'pincerRush') {
    for (const side of [-1, 1]) {
      const angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x) + side * 0.6;
      queueLineHazard(
        { x: boss.x + Math.cos(angle) * 20, y: boss.y + Math.sin(angle) * 20 },
        { x: state.player.x + Math.cos(angle) * 110, y: state.player.y + Math.sin(angle) * 90 },
        { width: 10, damage: 16, color: COLORS.enemyFast, delay: 0.55, length: 460, label: 'slash', ...ownership }
      );
    }
    spawnAround(boss, 'SCOUT', 2, boss.radius + 34, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'pincerScout', maxActive: 6 });
  }
  if (abilityName === 'feintStrike') {
    const retreatAngle = Math.atan2(boss.y - state.player.y, boss.x - state.player.x);
    boss.x = state.player.x + Math.cos(retreatAngle) * 180;
    boss.y = state.player.y + Math.sin(retreatAngle) * 140;
    queueLineHazard(boss, state.player, { width: 14, damage: 20, color: COLORS.enemyFast, delay: 0.38, length: 300, label: 'charge', ...ownership });
    spawnImpactWave(boss.x, boss.y, { maxRadius: 50, color: COLORS.enemyFast, fillAlpha: 0.1 });
  }
  if (abilityName === 'afterimageBurst') spawnAround(boss, 'PHASE', 3, boss.radius + 42, { ownerBossUid: boss.uid, summonCategory: 'afterimage', maxActive: 6 });
  if (abilityName === 'summonSiege') spawnAround(boss, 'SIEGE', 2, boss.radius + 46, { ownerBossUid: boss.uid, summonCategory: 'siege', maxActive: 5 });
  if (abilityName === 'bastionMortar') {
    const priorityTargets = [...state.towers.slice(0, 2), state.player].filter(Boolean);
    priorityTargets.forEach((targetPoint, index) => {
      queueAreaHazard(targetPoint.x, targetPoint.y, {
        radius: 72,
        damage: 20,
        delay: 0.9 + index * 0.12,
        color: COLORS.enemyTank,
        label: 'mortar',
        ...ownership,
      });
    });
  }
  if (abilityName === 'fortify') {
    boss.shield = Math.max(boss.shield ?? 0, 70);
    boss.maxShield = Math.max(boss.maxShield ?? 0, boss.shield);
    spawnImpactWave(boss.x, boss.y, { maxRadius: 92, color: COLORS.enemyTank, fillAlpha: 0.1 });
  }
  if (abilityName === 'shockRam') {
    const angle = Math.atan2(target.y - boss.y, target.x - boss.x);
    boss.dashTimer = 0.48;
    boss.dashVx = Math.cos(angle) * 380;
    boss.dashVy = Math.sin(angle) * 380;
    queueLineHazard(boss, target, { width: 22, damage: 24, color: COLORS.enemyTank, delay: 0.62, length: 360, label: 'ram', ...ownership });
    spawnImpactWave(boss.x, boss.y, { maxRadius: 66, color: COLORS.enemyTank, fillAlpha: 0.12 });
  }
  if (abilityName === 'quake') damageArea(boss.x, boss.y, 120, 18, { color: COLORS.enemyTank, towerFactor: 1.8 });
  if (abilityName === 'bunkerRing') {
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      queueAreaHazard(boss.x + Math.cos(angle) * 130, boss.y + Math.sin(angle) * 110, {
        radius: 58,
        damage: 16,
        delay: 0.78 + index * 0.04,
        pulses: 2,
        pulseInterval: 0.55,
        color: COLORS.enemyTank,
        label: 'bunker',
        ...ownership,
      });
    }
  }
  if (abilityName === 'prismBeam') queueLineHazard(boss, target, { width: 18, damage: 24, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
  if (abilityName === 'refractVolley') {
    const baseAngle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
    for (const offset of [-0.45, -0.15, 0.15, 0.45]) {
      queueLineHazard(
        boss,
        { x: boss.x + Math.cos(baseAngle + offset) * 180, y: boss.y + Math.sin(baseAngle + offset) * 180 },
        { width: 10, damage: 14, color: COLORS.enemyPhase, delay: 0.55, length: 560, label: 'refract', ...ownership }
      );
    }
  }
  if (abilityName === 'mirrorSummon') spawnAround(boss, 'PHASE', 2, boss.radius + 48, { ownerBossUid: boss.uid, summonCategory: 'mirror', maxActive: 5 });
  if (abilityName === 'prismLattice') {
    const offsets = [
      { x: -120, y: -80 },
      { x: 120, y: -80 },
      { x: -120, y: 80 },
      { x: 120, y: 80 },
    ];
    offsets.forEach((offset) => {
      queueLineHazard(
        { x: boss.x + offset.x, y: boss.y + offset.y },
        { x: boss.x - offset.x, y: boss.y - offset.y },
        { width: 10, damage: 16, color: COLORS.enemyPhase, delay: 0.75, length: Math.hypot(offset.x * 2, offset.y * 2), label: 'lattice', ...ownership }
      );
    });
  }
  if (abilityName === 'tripleBeam') {
    queueLineHazard(boss, state.player, { width: 16, damage: 22, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
    queueLineHazard({ x: boss.x, y: boss.y }, { x: boss.x + 120, y: boss.y - 260 }, { width: 14, damage: 18, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
    queueLineHazard({ x: boss.x, y: boss.y }, { x: boss.x - 140, y: boss.y - 240 }, { width: 14, damage: 18, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
  }
  if (abilityName === 'mirrorStep') {
    const oldX = boss.x;
    const oldY = boss.y;
    boss.x = state.player.x + rand(-180, 180);
    boss.y = state.player.y + rand(-120, 120);
    queueLineHazard({ x: oldX, y: oldY }, boss, { width: 12, damage: 18, color: COLORS.enemyPhase, delay: 0.52, length: Math.hypot(boss.x - oldX, boss.y - oldY), label: 'mirror', ...ownership });
    spawnAround(boss, 'PHASE', 1, boss.radius + 28, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'mirrorStep', maxActive: 3 });
    spawnImpactWave(boss.x, boss.y, { maxRadius: 62, color: COLORS.enemyPhase, fillAlpha: 0.1 });
  }
  if (abilityName === 'spawnHive') spawnAround(boss, 'BEACON', 2, boss.radius + 50, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'hive', maxActive: 4 });
  if (abilityName === 'broodShift') {
    const beacons = state.enemies.filter((enemy) => enemy.id === 'BEACON' && enemy.summonedByBossUid === boss.uid);
    if (beacons.length > 0) {
      const beacon = beacons[Math.floor(Math.random() * beacons.length)];
      const oldX = boss.x;
      const oldY = boss.y;
      boss.x = beacon.x + rand(-24, 24);
      boss.y = beacon.y + rand(-24, 24);
      queueLineHazard({ x: oldX, y: oldY }, boss, { width: 12, damage: 14, color: COLORS.enemyBeacon, delay: 0.5, length: Math.hypot(boss.x - oldX, boss.y - oldY), label: 'brood', ...ownership });
      spawnImpactWave(boss.x, boss.y, { maxRadius: 76, color: COLORS.enemyBeacon, fillAlpha: 0.12 });
    } else {
      spawnAround(boss, 'BEACON', 1, boss.radius + 44, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'hive', maxActive: 4 });
    }
  }
  if (abilityName === 'hiveHeal') boss.hp = Math.min(boss.maxHp, boss.hp + 42);
  if (abilityName === 'hivePulse') {
    const beacons = state.enemies.filter((enemy) => enemy.id === 'BEACON' && enemy.summonedByBossUid === boss.uid);
    const anchors = beacons.length > 0 ? beacons : [boss];
    for (const anchor of anchors.slice(0, 3)) {
      queueAreaHazard(anchor.x, anchor.y, {
        radius: 92,
        damage: 10,
        delay: 0.7,
        pulses: 2,
        pulseInterval: 0.55,
        radiusStep: 10,
        color: COLORS.enemyBeacon,
        label: 'brood',
        ...ownership,
      });
      for (const enemy of state.enemies) {
        if (!enemy.isBoss && dist(enemy, anchor) <= 110) {
          enemy.hp = Math.min(enemy.maxHp, enemy.hp + 12);
        }
      }
    }
  }
  if (abilityName === 'summonSwarm') spawnAround(boss, 'SHARD', 5, boss.radius + 45, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'swarm', maxActive: 10 });
  if (abilityName === 'hiveCollapse') {
    const beacons = state.enemies.filter((enemy) => enemy.id === 'BEACON' && enemy.summonedByBossUid === boss.uid);
    for (const beacon of beacons.slice(0, 4)) {
      queueAreaHazard(beacon.x, beacon.y, {
        radius: 104,
        damage: 16,
        delay: 0.8,
        pulses: 2,
        pulseInterval: 0.48,
        radiusStep: 14,
        color: COLORS.enemyBeacon,
        label: 'brood',
        ...ownership,
      });
      spawnAround(beacon, 'SHARD', 2, 28, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'collapseShard', maxActive: 8 });
    }
  }
  if (abilityName === 'frostRing') {
    for (const enemy of state.enemies) {
      if (enemy !== boss && dist(enemy, boss) <= 180) {
        enemy.slowRatio = Math.min(enemy.slowRatio, 0.72);
        enemy.slowTimer = Math.max(enemy.slowTimer, 2.5);
      }
    }
    damageArea(boss.x, boss.y, 150, 8, { color: COLORS.towerFrost, towerFactor: 0.4 });
  }
  if (abilityName === 'whiteout') {
    for (let index = 0; index < 3; index += 1) {
      queueAreaHazard(state.player.x + rand(-120, 120), state.player.y + rand(-90, 90), {
        radius: 74,
        damage: 8,
        delay: 0.6 + index * 0.14,
        slowRatio: 0.42,
        slowDuration: 2.4,
        pulses: 2,
        pulseInterval: 0.5,
        color: COLORS.towerFrost,
        label: 'frost',
        ...ownership,
      });
    }
  }
  if (abilityName === 'freezeTower') {
    const tower = state.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, boss) < dist(nearest, boss) ? candidate : nearest), null);
    if (tower) {
      tower.frozenTimer = 3.5;
      spawnImpactWave(tower.x, tower.y, { maxRadius: tower.radius + 24, color: COLORS.towerFrost, fillAlpha: 0.16 });
    }
  }
  if (abilityName === 'glacialPrison') {
    const focus = state.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, state.player) < dist(nearest, state.player) ? candidate : nearest), null) ?? state.player;
    queueAreaHazard(focus.x, focus.y, {
      radius: 90,
      damage: 12,
      delay: 0.75,
      slowRatio: 0.3,
      slowDuration: 3.1,
      pulses: 2,
      pulseInterval: 0.5,
      color: COLORS.towerFrost,
      label: 'prison',
      ...ownership,
    });
  }
  if (abilityName === 'summonFrostGuards') spawnAround(boss, 'SHIELD', 3, boss.radius + 48, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'frostGuard', maxActive: 6 });
  if (abilityName === 'coldSnap') {
    const targets = [...state.towers.slice(0, 3), state.player];
    targets.forEach((targetPoint, index) => {
      queueAreaHazard(targetPoint.x, targetPoint.y, {
        radius: 68,
        damage: 16,
        delay: 0.72 + index * 0.08,
        slowRatio: 0.36,
        slowDuration: 2.8,
        color: COLORS.towerFrost,
        label: 'frost',
        ...ownership,
      });
    });
  }
  if (abilityName === 'railShot') queueLineHazard(boss, target, { width: 14, damage: 34, color: COLORS.towerRail, delay: 0.65, label: 'rail', ...ownership });
  if (abilityName === 'crosshairBarrage') {
    queueLineHazard({ x: state.player.x - 260, y: state.player.y }, { x: state.player.x + 260, y: state.player.y }, { width: 10, damage: 16, color: COLORS.towerRail, delay: 0.7, length: 520, label: 'crosshair', ...ownership });
    queueLineHazard({ x: state.player.x, y: state.player.y - 220 }, { x: state.player.x, y: state.player.y + 220 }, { width: 10, damage: 16, color: COLORS.towerRail, delay: 0.82, length: 440, label: 'crosshair', ...ownership });
  }
  if (abilityName === 'markTower') {
    const tower = state.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, boss) < dist(nearest, boss) ? candidate : nearest), null);
    if (tower) queueLineHazard(boss, tower, { width: 12, damage: 28, color: COLORS.towerRail, delay: 0.55, label: 'mark', ...ownership });
  }
  if (abilityName === 'suppressiveGrid') {
    const anchors = state.towers.slice(0, 2);
    anchors.forEach((tower, index) => {
      queueLineHazard({ x: tower.x - 180, y: tower.y }, { x: tower.x + 180, y: tower.y }, { width: 9, damage: 14, color: COLORS.towerRail, delay: 0.68 + index * 0.08, length: 360, label: 'grid', ...ownership });
      queueLineHazard({ x: tower.x, y: tower.y - 180 }, { x: tower.x, y: tower.y + 180 }, { width: 9, damage: 14, color: COLORS.towerRail, delay: 0.76 + index * 0.08, length: 360, label: 'grid', ...ownership });
    });
  }
  if (abilityName === 'overload') {
    boss.hp -= Math.min(24, boss.hp - 1);
    queueLineHazard(boss, state.player, { width: 20, damage: 38, color: COLORS.towerRail, delay: 0.45, label: 'overload', ...ownership });
  }
  if (abilityName === 'killLane') {
    const angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
    for (const offset of [-0.18, 0.18]) {
      queueLineHazard(
        { x: boss.x + Math.cos(angle + Math.PI / 2) * offset * 180, y: boss.y + Math.sin(angle + Math.PI / 2) * offset * 180 },
        state.player,
        { width: 14, damage: 24, color: COLORS.towerRail, delay: 0.75, length: 720, label: 'crosshair', ...ownership }
      );
    }
  }
  if (abilityName === 'stealMoney') {
    if (!state.debugOptions.infiniteMoney) {
      const stolen = Math.min(state.money, 12);
      state.money -= stolen;
      syncHudMoney();
      spawnFloatingText(boss.x, boss.y - boss.radius - 8, `-${stolen}`, COLORS.enemyScout);
    }
  }
  if (abilityName === 'taxBeacon') {
    queueAreaHazard(state.player.x, state.player.y, {
      radius: 82,
      damage: 8,
      delay: 0.75,
      pulses: 2,
      pulseInterval: 0.5,
      color: COLORS.enemyScout,
      label: 'coin',
      ...ownership,
    });
    if (!state.debugOptions.infiniteMoney) {
      const stolen = Math.min(state.money, 8);
      state.money -= stolen;
      syncHudMoney();
    }
  }
  if (abilityName === 'paydaySweep') {
    for (const side of [-1, 1]) {
      queueLineHazard(
        { x: state.player.x + side * 220, y: state.player.y - 120 },
        { x: state.player.x - side * 220, y: state.player.y + 120 },
        { width: 10, damage: 14, color: COLORS.enemyScout, delay: 0.68, length: Math.hypot(440, 240), label: 'coinline', ...ownership }
      );
    }
    spawnAround(boss, 'SCOUT', 2, boss.radius + 34, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'paydayScout', maxActive: 6 });
  }
  if (abilityName === 'ransomBurst') spawnAround(boss, 'SCOUT', 5, boss.radius + 42, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'ransom', maxActive: 8 });
  if (abilityName === 'repossess') {
    const tower = state.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, boss) < dist(nearest, boss) ? candidate : nearest), null);
    if (tower) {
      damageTarget(tower, 22);
      queueAreaHazard(tower.x, tower.y, {
        radius: 76,
        damage: 12,
        delay: 0.72,
        color: COLORS.enemyScout,
        label: 'coin',
        ...ownership,
      });
    }
    if (!state.debugOptions.infiniteMoney) {
      const stolen = Math.min(state.money, 18);
      state.money -= stolen;
      syncHudMoney();
      spawnFloatingText(boss.x, boss.y - boss.radius - 8, `-${stolen}`, COLORS.enemyScout);
    }
  }
  if (abilityName === 'twinOrbit') {
    boss.shield = Math.max(boss.shield ?? 0, 34);
    boss.maxShield = Math.max(boss.maxShield ?? 0, boss.shield);
    spawnImpactWave(boss.x, boss.y, { maxRadius: 118, color: boss.color, fillAlpha: 0.08 });
  }
  if (abilityName === 'twinBolt') {
    queueLineHazard({ x: boss.x - boss.radius * 0.6, y: boss.y }, state.player, { width: 11, damage: 16, color: COLORS.enemyPhase, delay: 0.5, label: 'moonbolt', ownerBossUid: boss.uid });
    queueLineHazard({ x: boss.x + boss.radius * 0.6, y: boss.y }, target, { width: 11, damage: 16, color: COLORS.enemyScout, delay: 0.7, label: 'sunbolt', ownerBossUid: boss.uid });
  }
  if (abilityName === 'twinSwap') {
    const angle = Math.random() * Math.PI * 2;
    boss.x = state.player.x + Math.cos(angle) * 170;
    boss.y = state.player.y + Math.sin(angle) * 170;
    spawnAround(boss, 'PHASE', 2, boss.radius + 34, { ownerBossUid: boss.uid, summonCategory: 'swapEcho', maxActive: 4 });
    spawnImpactWave(boss.x, boss.y, { maxRadius: 74, color: boss.color, fillAlpha: 0.12 });
  }
  if (abilityName === 'eclipsePulse') {
    queueAreaHazard(boss.x, boss.y, {
      radius: 170,
      damage: 20,
      delay: 0.68,
      color: COLORS.enemyPhase,
      label: 'eclipse',
      ...ownership,
    });
    if (isClimaxPhase) {
      const partner = getEncounterPartner(boss);
      spawnImpactWave(boss.x, boss.y, {
        startRadius: boss.radius * 0.75,
        maxRadius: 168,
        growth: 210,
        life: 0.72,
        color: boss.color,
        accentColor: boss.color,
        secondaryColor: '#ffffff',
        fillAlpha: 0.04,
        lineWidth: 3,
        dash: [6, 10],
        spokes: 6,
        spin: 1,
        style: 'twinFinisher',
        nodeCount: 6,
        anchorA: { x: boss.x, y: boss.y, color: boss.color },
        anchorB: partner ? { x: partner.x, y: partner.y, color: partner.color } : null,
      });
    }
  }
  if (abilityName === 'solarDash') {
    const angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
    boss.dashTimer = 0.34;
    boss.dashVx = Math.cos(angle) * 620;
    boss.dashVy = Math.sin(angle) * 620;
    queueLineHazard(boss, state.player, { width: 12, damage: 14, color: boss.color, delay: 0.42, length: 420, label: 'solar', ...ownership });
    spawnImpactWave(boss.x, boss.y, { maxRadius: 52, color: boss.color, fillAlpha: 0.12 });
  }
  if (abilityName === 'flareLance') {
    const baseAngle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
    for (const offset of [-0.2, 0, 0.2]) {
      queueLineHazard(
        boss,
        { x: boss.x + Math.cos(baseAngle + offset) * 240, y: boss.y + Math.sin(baseAngle + offset) * 240 },
        { width: offset === 0 ? 16 : 12, damage: offset === 0 ? 22 : 16, color: boss.color, delay: 0.6, length: 640, label: 'flare', ...ownership }
      );
    }
  }
  if (abilityName === 'lunarSnare') {
    queueAreaHazard(state.player.x, state.player.y, {
      radius: 92,
      damage: 10,
      slowRatio: 0.38,
      slowDuration: 2.9,
      delay: 0.7,
      color: boss.color,
      label: 'moon',
      ...ownership,
    });
  }
  if (abilityName === 'shadowArc') {
    queueLineHazard(boss, state.player, { width: 12, damage: 18, color: boss.color, delay: 0.55, length: 520, label: 'shadow', ...ownership });
    queueAreaHazard(state.player.x + rand(-80, 80), state.player.y + rand(-80, 80), {
      radius: 76,
      damage: 14,
      slowRatio: 0.52,
      slowDuration: 2.2,
      delay: 0.82,
      color: boss.color,
      label: 'shade',
      ...ownership,
    });
  }
  if (abilityName === 'twinCrossfire') {
    const partner = getEncounterPartner(boss);
    if (partner && boss.uid < partner.uid) {
      queueLineHazard(boss, { x: state.player.x + 90, y: state.player.y - 24 }, { width: 12, damage: 18, color: boss.color, delay: 0.62, length: 640, label: 'crossfire', ...ownership });
      queueLineHazard(partner, { x: state.player.x - 90, y: state.player.y + 24 }, { width: 12, damage: 18, color: partner.color, delay: 0.62, length: 640, label: 'crossfire', ...getBossOwnership(partner) });
      spawnImpactWave(state.player.x, state.player.y, { maxRadius: 88, color: COLORS.boss, fillAlpha: 0.06 });
      if (isClimaxPhase) {
        const midX = (boss.x + partner.x) * 0.5;
        const midY = (boss.y + partner.y) * 0.5;
        spawnImpactWave(midX, midY, {
          startRadius: 22,
          maxRadius: 138,
          growth: 196,
          life: 0.84,
          color: '#ffffff',
          accentColor: boss.color,
          secondaryColor: partner.color,
          fillAlpha: 0.03,
          lineWidth: 2.5,
          dash: [5, 11],
          spokes: 8,
          spin: 1.2,
          style: 'twinFinisher',
          nodeCount: 8,
          anchorA: { x: boss.x, y: boss.y, color: boss.color },
          anchorB: { x: partner.x, y: partner.y, color: partner.color },
        });
        queueAreaHazard(state.player.x, state.player.y, {
          radius: 112,
          damage: 18,
          delay: 0.96,
          pulses: 2,
          pulseInterval: 0.42,
          color: '#ffffff',
          label: 'eclipse',
          ...ownership,
        });
        primeBossAbility('eclipsePulse', 1.15);
        const partnerOwnership = getEncounterPartner(boss);
        if (partnerOwnership) {
          const partnerCurrent = partnerOwnership.abilityCooldowns.eclipsePulse;
          partnerOwnership.abilityCooldowns.eclipsePulse = partnerCurrent == null ? 1.15 : Math.min(partnerCurrent, 1.15);
        }
      }
    }
  }
  if (abilityName === 'dragonBreath') {
    queueLineHazard(boss, state.player, { width: 24, damage: 26, color: COLORS.enemyBomber, delay: 0.75, length: 720, label: 'breath', ...ownership });
    queueLineHazard(boss, { x: state.player.x + 120, y: state.player.y + 40 }, { width: 16, damage: 18, color: COLORS.enemyBomber, delay: 0.85, length: 680, label: 'breath', ...ownership });
    queueLineHazard(boss, { x: state.player.x - 120, y: state.player.y - 40 }, { width: 16, damage: 18, color: COLORS.enemyBomber, delay: 0.85, length: 680, label: 'breath', ...ownership });
  }
  if (abilityName === 'dragonStrafe') {
    boss.bossState.strafeSide = boss.bossState.strafeSide === 'left' ? 'right' : 'left';
    const side = boss.bossState.strafeSide === 'left' ? -1 : 1;
    const baseAngle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
    for (const offset of [-0.28, 0, 0.28]) {
      queueLineHazard(
        { x: boss.x + Math.cos(baseAngle + Math.PI / 2 * side) * 34, y: boss.y + Math.sin(baseAngle + Math.PI / 2 * side) * 34 },
        { x: state.player.x + Math.cos(baseAngle + offset) * 180, y: state.player.y + Math.sin(baseAngle + offset) * 180 },
        { width: offset === 0 ? 18 : 12, damage: offset === 0 ? 24 : 16, color: COLORS.enemyBomber, delay: 0.7, length: 760, label: 'strafe', ...ownership }
      );
    }
  }
  if (abilityName === 'emberWake') {
    for (let index = 0; index < 3; index += 1) {
      const angle = boss.bossState.strafeSide === 'left' ? Math.PI * 0.75 - index * 0.26 : Math.PI * 0.25 + index * 0.26;
      queueAreaHazard(state.player.x + Math.cos(angle) * 110, state.player.y + Math.sin(angle) * 80, {
        radius: 58 + index * 8,
        damage: 10 + index * 2,
        delay: 0.65 + index * 0.1,
        pulses: 2,
        pulseInterval: 0.6,
        radiusStep: 14,
        color: COLORS.enemyBomber,
        label: 'inferno',
        ...ownership,
      });
    }
  }
  if (abilityName === 'wingBuffet') {
    damageArea(boss.x, boss.y, 165, 16, { color: COLORS.enemyBomber, towerFactor: 1.15 });
    const pushTarget = (target, amount) => {
      const angle = Math.atan2(target.y - boss.y, target.x - boss.x);
      target.x += Math.cos(angle) * amount;
      target.y += Math.sin(angle) * amount;
    };
    pushTarget(state.player, 42);
    for (const tower of state.towers) {
      if (dist(tower, boss) <= 210) pushTarget(tower, 24);
    }
    spawnImpactWave(boss.x, boss.y, { maxRadius: 170, color: COLORS.enemyBomber, fillAlpha: 0.1 });
  }
  if (abilityName === 'meteorRain') {
    for (let index = 0; index < 6; index += 1) {
      queueAreaHazard(state.player.x + rand(-200, 200), state.player.y + rand(-160, 160), {
        radius: 50 + (index % 2) * 8,
        damage: 22,
        delay: 0.95 + index * 0.1,
        color: COLORS.enemyBomber,
        label: 'meteor',
        ...ownership,
      });
    }
  }
  if (abilityName === 'skyDive') {
    const oldX = boss.x;
    const oldY = boss.y;
    const angle = Math.random() * Math.PI * 2;
    boss.x = state.player.x + Math.cos(angle) * 140;
    boss.y = state.player.y + Math.sin(angle) * 120;
    spawnImpactWave(oldX, oldY, { maxRadius: 70, color: COLORS.enemyBomber, fillAlpha: 0.08 });
    queueLineHazard({ x: oldX, y: oldY }, boss, { width: 10, damage: 14, delay: 0.45, length: Math.hypot(boss.x - oldX, boss.y - oldY), color: COLORS.enemyBomber, label: 'diveTrail', ...ownership });
    queueAreaHazard(boss.x, boss.y, { radius: 118, damage: 28, delay: 0.8, color: COLORS.enemyBomber, label: 'dive', ...ownership });
    if (isClimaxPhase) {
      spawnImpactWave(boss.x, boss.y, {
        startRadius: 18,
        maxRadius: 126,
        growth: 188,
        life: 0.88,
        color: COLORS.enemyBomber,
        accentColor: '#ff9f43',
        secondaryColor: '#ffd166',
        fillAlpha: 0.03,
        lineWidth: 3,
        dash: [7, 9],
        spokes: 5,
        spin: 0.8,
        style: 'dragonFinisher',
        rotation: angle,
      });
      for (let index = 0; index < 4; index += 1) {
        const orbitAngle = (Math.PI * 2 * index) / 4;
        queueAreaHazard(boss.x + Math.cos(orbitAngle) * 78, boss.y + Math.sin(orbitAngle) * 62, {
          radius: 54,
          damage: 14,
          delay: 1 + index * 0.05,
          pulses: 2,
          pulseInterval: 0.45,
          radiusStep: 8,
          color: COLORS.enemyBomber,
          label: 'inferno',
          ...ownership,
        });
      }
      primeBossAbility('infernoRing', 1.05);
    }
  }
  if (abilityName === 'infernoRing') {
    if (isClimaxPhase) {
      spawnImpactWave(state.player.x, state.player.y, {
        startRadius: 28,
        maxRadius: 150,
        growth: 220,
        life: 0.66,
        color: COLORS.enemyBomber,
        accentColor: '#ffd166',
        secondaryColor: '#ff9f43',
        fillAlpha: 0.02,
        lineWidth: 2.6,
        dash: [8, 10],
        spokes: 6,
        spin: 0.65,
        style: 'dragonFinisher',
        rotation: Math.atan2(state.player.y - boss.y, state.player.x - boss.x),
      });
    }
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      queueAreaHazard(state.player.x + Math.cos(angle) * 140, state.player.y + Math.sin(angle) * 110, {
        radius: 60,
        damage: 18,
        delay: 0.8 + index * 0.05,
        pulses: 2,
        pulseInterval: 0.55,
        radiusStep: 10,
        color: COLORS.enemyBomber,
        label: 'inferno',
        ...ownership,
      });
    }
  }
  if (abilityName === 'webTrap') {
    queueAreaHazard(state.player.x, state.player.y, {
      radius: 86,
      damage: 8,
      slowRatio: 0.42,
      slowDuration: 2.8,
      delay: 0.65,
      pulses: 2,
      pulseInterval: 0.55,
      radiusStep: 8,
      color: COLORS.enemyBurrower,
      label: 'web',
      ...ownership,
    });
  }
  if (abilityName === 'silkVolley') {
    for (let index = 0; index < 3; index += 1) {
      queueAreaHazard(state.player.x + rand(-120, 120), state.player.y + rand(-90, 90), {
        radius: 62,
        damage: 8,
        slowRatio: 0.5,
        slowDuration: 2.2,
        delay: 0.55 + index * 0.1,
        color: COLORS.enemyBurrower,
        label: 'silk',
        ...ownership,
      });
    }
  }
  if (abilityName === 'spawnSpiderlings') spawnAround(boss, 'SPLINTER', 6, boss.radius + 38, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'spiderling', maxActive: 10 });
  if (abilityName === 'broodAmbush') {
    spawnAround(boss, 'BURROWER', 2, boss.radius + 50, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'broodBurrower', maxActive: 4 });
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI * 2 * index) / 4 + Math.random() * 0.3;
      const x = state.player.x + Math.cos(angle) * 118;
      const y = state.player.y + Math.sin(angle) * 84;
      spawnEnemyAt('SPLINTER', x, y, {
        skipBurrowPosition: true,
        summonedByBossUid: boss.uid,
        summonedByEncounterUid: boss.encounterUid ?? null,
        summonCategory: 'ambushSpiderling',
      });
    }
  }
  if (abilityName === 'webField') {
    if (isClimaxPhase) {
      spawnImpactWave(boss.x, boss.y, {
        startRadius: 26,
        maxRadius: 184,
        growth: 210,
        life: 0.7,
        color: COLORS.enemyBurrower,
        accentColor: COLORS.enemyBurrower,
        secondaryColor: '#d9f99d',
        fillAlpha: 0.03,
        lineWidth: 2,
        dash: [4, 8],
        spokes: 8,
        spin: 0.4,
        style: 'spiderFinisher',
        nodeCount: 8,
      });
    }
    queueAreaHazard(boss.x, boss.y, {
      radius: 170,
      damage: 9,
      slowRatio: 0.52,
      slowDuration: 3,
      delay: 0.8,
      pulses: 3,
      pulseInterval: 0.75,
      radiusStep: 12,
      color: COLORS.enemyBurrower,
      label: 'web',
      ...ownership,
    });
    spawnAround(boss, 'BURROWER', 2, boss.radius + 52, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'burrowEscort', maxActive: 4 });
  }
  if (abilityName === 'nestBloom') {
    for (let index = 0; index < 3; index += 1) {
      const angle = (Math.PI * 2 * index) / 3 + Math.random() * 0.24;
      queueAreaHazard(boss.x + Math.cos(angle) * 140, boss.y + Math.sin(angle) * 110, {
        radius: 72,
        damage: 10,
        slowRatio: 0.56,
        slowDuration: 2.8,
        delay: 0.75,
        pulses: 3,
        pulseInterval: 0.65,
        radiusStep: 10,
        color: COLORS.enemyBurrower,
        label: 'nest',
        ...ownership,
      });
    }
    spawnAround(boss, 'SPLINTER', 4, boss.radius + 34, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'nestShard', maxActive: 12 });
    if (isClimaxPhase) {
      spawnImpactWave(boss.x, boss.y, {
        startRadius: boss.radius * 0.8,
        maxRadius: 152,
        growth: 190,
        life: 0.82,
        color: COLORS.enemyBurrower,
        accentColor: COLORS.enemyBurrower,
        secondaryColor: '#ffffff',
        fillAlpha: 0.04,
        lineWidth: 2.4,
        dash: [4, 9],
        spokes: 6,
        spin: 0.5,
        style: 'spiderFinisher',
        nodeCount: 6,
      });
      queueAreaHazard(state.player.x, state.player.y, {
        radius: 98,
        damage: 12,
        slowRatio: 0.58,
        slowDuration: 2.8,
        delay: 0.92,
        pulses: 2,
        pulseInterval: 0.5,
        radiusStep: 12,
        color: COLORS.enemyBurrower,
        label: 'nest',
        ...ownership,
      });
      primeBossAbility('webField', 1.1);
    }
  }
  if (abilityName === 'gravityWell') {
    queueAreaHazard(state.player.x, state.player.y, {
      radius: 120,
      damage: 10,
      pull: 220,
      delay: 0.7,
      pulses: 2,
      pulseInterval: 0.6,
      radiusStep: 18,
      color: COLORS.enemyJammer,
      label: 'gravity',
      ...ownership,
    });
  }
  if (abilityName === 'starfall') {
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI * 2 * index) / 4 + Math.random() * 0.22;
      queueAreaHazard(state.player.x + Math.cos(angle) * 120, state.player.y + Math.sin(angle) * 88, {
        radius: 58,
        damage: 14,
        delay: 0.65 + index * 0.08,
        color: COLORS.enemyJammer,
        label: 'star',
        ...ownership,
      });
    }
  }
  if (abilityName === 'orbitalShots') {
    const angleOffset = (boss.bossState.orbitalIndex ?? 0) * 0.34;
    boss.bossState.orbitalIndex = (boss.bossState.orbitalIndex ?? 0) + 1;
    for (let index = 0; index < 5; index += 1) {
      const angle = angleOffset + (Math.PI * 2 * index) / 5;
      queueLineHazard(
        { x: boss.x + Math.cos(angle) * 86, y: boss.y + Math.sin(angle) * 86 },
        { x: boss.x - Math.cos(angle) * 160, y: boss.y - Math.sin(angle) * 160 },
        { width: 10, damage: 18, color: COLORS.enemyJammer, delay: 0.6, length: 560, label: 'orbit', ...ownership }
      );
    }
  }
  if (abilityName === 'orbitalLock') {
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI * 2 * index) / 4;
      const source = { x: state.player.x + Math.cos(angle) * 180, y: state.player.y + Math.sin(angle) * 140 };
      queueLineHazard(source, state.player, { width: 12, damage: 18, color: COLORS.enemyJammer, delay: 0.72, length: Math.hypot(source.x - state.player.x, source.y - state.player.y), label: 'lock', ...ownership });
    }
  }
  if (abilityName === 'singularity') {
    for (const tower of state.towers) {
      const angle = Math.atan2(boss.y - tower.y, boss.x - tower.x);
      tower.x += Math.cos(angle) * 34;
      tower.y += Math.sin(angle) * 34;
    }
    queueAreaHazard(boss.x, boss.y, {
      radius: 210,
      damage: 20,
      pull: 340,
      delay: 0.95,
      pulses: 3,
      pulseInterval: 0.55,
      radiusStep: -12,
      color: COLORS.enemyJammer,
      label: 'singularity',
      ...ownership,
    });
    if (isClimaxPhase) {
      spawnImpactWave(boss.x, boss.y, {
        startRadius: boss.radius * 0.9,
        maxRadius: 198,
        growth: 176,
        life: 0.94,
        color: COLORS.enemyJammer,
        accentColor: COLORS.enemyJammer,
        secondaryColor: '#ffffff',
        fillAlpha: 0.03,
        lineWidth: 3,
        dash: [4, 10],
        spokes: 7,
        spin: 0.7,
        style: 'astrolabeFinisher',
        nodeCount: 7,
        rotation: (boss.bossState.orbitalIndex ?? 0) * 0.34,
      });
      for (let index = 0; index < 4; index += 1) {
        const angle = (Math.PI * 2 * index) / 4;
        const source = { x: boss.x + Math.cos(angle) * 180, y: boss.y + Math.sin(angle) * 180 };
        queueLineHazard(source, boss, {
          width: 10,
          damage: 16,
          color: COLORS.enemyJammer,
          delay: 1.02 + index * 0.05,
          length: Math.hypot(source.x - boss.x, source.y - boss.y),
          label: 'lock',
          ...ownership,
        });
      }
      primeBossAbility('eventHorizon', 1.05);
    }
  }
  if (abilityName === 'eventHorizon') {
    if (isClimaxPhase) {
      spawnImpactWave(boss.x, boss.y, {
        startRadius: 32,
        maxRadius: 220,
        growth: 192,
        life: 0.76,
        color: COLORS.enemyJammer,
        accentColor: '#a78bfa',
        secondaryColor: '#ffffff',
        fillAlpha: 0.02,
        lineWidth: 2.8,
        dash: [3, 11],
        spokes: 6,
        spin: 0.8,
        style: 'astrolabeFinisher',
        nodeCount: 6,
        rotation: boss.bossState.orbitalIndex ?? 0,
      });
    }
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      queueAreaHazard(boss.x + Math.cos(angle) * 150, boss.y + Math.sin(angle) * 150, {
        radius: 68,
        damage: 16,
        pull: 180,
        delay: 0.75 + index * 0.05,
        pulses: 2,
        pulseInterval: 0.6,
        color: COLORS.enemyJammer,
        label: 'horizon',
        ...ownership,
      });
    }
  }
  if (abilityName === 'forgeArmor') {
    boss.shield = Math.max(boss.shield ?? 0, 90);
    boss.maxShield = Math.max(boss.maxShield ?? 0, boss.shield);
    spawnAround(boss, 'SHIELD', 2, boss.radius + 42, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'forgeGuard', maxActive: 6 });
  }
  if (abilityName === 'slagDrop') {
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI * 2 * index) / 4 + Math.random() * 0.2;
      queueAreaHazard(boss.x + Math.cos(angle) * 130, boss.y + Math.sin(angle) * 100, {
        radius: 64,
        damage: 14,
        delay: 0.7 + index * 0.08,
        pulses: 2,
        pulseInterval: 0.55,
        color: COLORS.enemySiege,
        label: 'slag',
        ...ownership,
      });
    }
  }
  if (abilityName === 'sacrificeMinions') {
    let sacrificed = 0;
    for (let index = state.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = state.enemies[index];
      if (enemy !== boss && !enemy.isBoss && dist(enemy, boss) <= 180 && sacrificed < 4) {
        state.enemies.splice(index, 1);
        sacrificed += 1;
      }
    }
    boss.hp = Math.min(boss.maxHp, boss.hp + sacrificed * 28);
    boss.shield = Math.max(boss.shield ?? 0, sacrificed * 24);
    damageArea(boss.x, boss.y, 95 + sacrificed * 18, 10 + sacrificed * 4, { color: COLORS.enemySiege, towerFactor: 1.3 });
  }
  if (abilityName === 'brandLine') {
    queueLineHazard(boss, state.player, { width: 14, damage: 20, color: COLORS.enemySiege, delay: 0.58, length: 520, label: 'brand', ...ownership });
    queueAreaHazard(state.player.x, state.player.y, {
      radius: 82,
      damage: 12,
      delay: 0.82,
      pulses: 2,
      pulseInterval: 0.48,
      color: COLORS.enemySiege,
      label: 'slag',
      ...ownership,
    });
  }
  if (abilityName === 'moltenBurst') {
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      queueAreaHazard(boss.x + Math.cos(angle) * 150, boss.y + Math.sin(angle) * 150, { radius: 62, damage: 22, delay: 0.8, color: COLORS.enemySiege, label: 'slag', ...ownership });
    }
  }
  if (abilityName === 'forgeDetonation') {
    const forgeGuards = state.enemies.filter((enemy) => enemy.summonedByBossUid === boss.uid && enemy.summonCategory === 'forgeGuard');
    for (const guard of forgeGuards.slice(0, 4)) {
      queueAreaHazard(guard.x, guard.y, {
        radius: 84,
        damage: 18,
        delay: 0.7,
        pulses: 2,
        pulseInterval: 0.42,
        color: COLORS.enemySiege,
        label: 'slag',
        ...ownership,
      });
    }
  }
  if (abilityName === 'conductLines') {
    queueLineHazard(boss, state.player, { width: 12, damage: 18, color: COLORS.towerRail, delay: 0.45, label: 'tempo', ...ownership });
    queueLineHazard({ x: boss.x - 90, y: boss.y - 80 }, { x: boss.x + 180, y: boss.y + 120 }, { width: 10, damage: 15, color: COLORS.towerRail, delay: 0.75, length: 560, label: 'tempo', ...ownership });
  }
  if (abilityName === 'pulseMeasure') {
    for (let index = 0; index < 4; index += 1) {
      queueAreaHazard(state.player.x + rand(-150, 150), state.player.y + rand(-110, 110), {
        radius: 54,
        damage: 10,
        delay: 0.5 + index * 0.16,
        color: COLORS.towerRail,
        label: 'beat',
        ...ownership,
      });
    }
  }
  if (abilityName === 'tempoShift') {
    for (const tower of state.towers) {
      if (dist(tower, boss) <= 260) tower.frozenTimer = Math.max(tower.frozenTimer ?? 0, 1.6);
    }
    spawnAround(boss, 'FAST', 4, boss.radius + 45, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'tempoRunner', maxActive: 8 });
  }
  if (abilityName === 'syncopate') {
    for (let index = 0; index < 3; index += 1) {
      const delay = 0.42 + index * 0.18;
      queueLineHazard(
        { x: state.player.x - 220, y: state.player.y - 70 + index * 70 },
        { x: state.player.x + 220, y: state.player.y - 70 + index * 70 },
        { width: 9, damage: 14, color: COLORS.towerRail, delay, length: 440, label: 'tempo', ...ownership }
      );
    }
  }
  if (abilityName === 'finale') {
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      queueLineHazard(boss, { x: boss.x + Math.cos(angle) * 220, y: boss.y + Math.sin(angle) * 220 }, { width: 9, damage: 16, color: COLORS.towerRail, delay: 0.55, length: 620, label: 'tempo', ...ownership });
    }
  }
  if (abilityName === 'crescendo') {
    for (let index = 0; index < 5; index += 1) {
      queueAreaHazard(state.player.x, state.player.y, {
        radius: 46 + index * 16,
        damage: 8 + index * 2,
        delay: 0.4 + index * 0.14,
        color: COLORS.towerRail,
        label: 'beat',
        ...ownership,
      });
    }
  }
  if (abilityName === 'raiseWalls') {
    spawnAround(boss, 'SIEGE', 3, boss.radius + 58, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'wallGuard', maxActive: 6 });
    queueAreaHazard(state.player.x, state.player.y, { radius: 95, damage: 8, slowRatio: 0.65, slowDuration: 2.2, delay: 0.75, color: COLORS.enemyShield, label: 'wall', ...ownership });
  }
  if (abilityName === 'corridorClamp') {
    queueLineHazard({ x: state.player.x - 240, y: state.player.y - 110 }, { x: state.player.x - 240, y: state.player.y + 110 }, { width: 12, damage: 14, color: COLORS.enemyShield, delay: 0.72, length: 220, label: 'gate', ...ownership });
    queueLineHazard({ x: state.player.x + 240, y: state.player.y - 110 }, { x: state.player.x + 240, y: state.player.y + 110 }, { width: 12, damage: 14, color: COLORS.enemyShield, delay: 0.72, length: 220, label: 'gate', ...ownership });
  }
  if (abilityName === 'gateSwap') {
    const oldX = boss.x;
    const oldY = boss.y;
    boss.x = state.player.x + rand(-210, 210);
    boss.y = state.player.y + rand(-160, 160);
    queueLineHazard({ x: oldX, y: oldY }, boss, { width: 18, damage: 20, color: COLORS.enemyShield, delay: 0.6, label: 'gate', ...ownership });
  }
  if (abilityName === 'mazeFold') {
    for (const tower of state.towers.slice(0, 2)) {
      queueLineHazard({ x: tower.x - 160, y: tower.y }, { x: tower.x + 160, y: tower.y }, { width: 10, damage: 16, color: COLORS.enemyShield, delay: 0.68, length: 320, label: 'maze', ...ownership });
    }
    queueAreaHazard(state.player.x, state.player.y, { radius: 84, damage: 12, delay: 0.82, color: COLORS.enemyShield, label: 'wall', ...ownership });
  }
  if (abilityName === 'mazeCrush') {
    for (const tower of state.towers.slice(0, 4)) {
      queueAreaHazard(tower.x, tower.y, { radius: 72, damage: 24, delay: 0.7, color: COLORS.enemyShield, label: 'wall', ...ownership });
    }
    queueAreaHazard(state.player.x, state.player.y, { radius: 88, damage: 18, delay: 0.8, color: COLORS.enemyShield, label: 'wall', ...ownership });
  }
  if (abilityName === 'deadEnd') {
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI * 2 * index) / 4;
      queueAreaHazard(state.player.x + Math.cos(angle) * 120, state.player.y + Math.sin(angle) * 90, {
        radius: 68,
        damage: 16,
        delay: 0.7 + index * 0.06,
        color: COLORS.enemyShield,
        label: 'wall',
        ...ownership,
      });
    }
  }
  if (abilityName === 'seedPods') spawnAround(boss, 'MEDIC', 2, boss.radius + 46, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'seedPod', maxActive: 5 });
  if (abilityName === 'blightRoots') {
    for (let index = 0; index < 3; index += 1) {
      queueLineHazard(
        { x: boss.x + rand(-70, 70), y: boss.y + rand(-70, 70) },
        { x: state.player.x + rand(-110, 110), y: state.player.y + rand(-90, 90) },
        { width: 10, damage: 12, color: COLORS.enemyMedic, delay: 0.6 + index * 0.08, length: 420, label: 'vine', ...ownership }
      );
    }
  }
  if (abilityName === 'poisonBloom') queueAreaHazard(state.player.x, state.player.y, { radius: 110, damage: 14, slowRatio: 0.7, slowDuration: 2, delay: 0.75, color: COLORS.enemyMedic, label: 'poison', ...ownership });
  if (abilityName === 'sporeBurst') {
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI * 2 * index) / 4;
      queueAreaHazard(state.player.x + Math.cos(angle) * 90, state.player.y + Math.sin(angle) * 80, {
        radius: 64,
        damage: 10,
        delay: 0.7 + index * 0.05,
        pulses: 2,
        pulseInterval: 0.52,
        color: COLORS.enemyMedic,
        label: 'spore',
        ...ownership,
      });
    }
  }
  if (abilityName === 'gardenWake') {
    for (const enemy of state.enemies) {
      if (enemy !== boss && dist(enemy, boss) <= 260) enemy.hp = Math.min(enemy.maxHp, enemy.hp + 20);
    }
    spawnAround(boss, 'SHARD', 6, boss.radius + 50, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'gardenShard', maxActive: 10 });
    queueAreaHazard(boss.x, boss.y, { radius: 210, damage: 16, slowRatio: 0.68, slowDuration: 2.4, delay: 0.85, color: COLORS.enemyMedic, label: 'garden', ...ownership });
  }
  if (abilityName === 'creepingCanopy') {
    for (let index = 0; index < 5; index += 1) {
      const angle = (Math.PI * 2 * index) / 5;
      queueAreaHazard(boss.x + Math.cos(angle) * 150, boss.y + Math.sin(angle) * 120, {
        radius: 74,
        damage: 12,
        delay: 0.72 + index * 0.06,
        pulses: 3,
        pulseInterval: 0.48,
        color: COLORS.enemyMedic,
        label: 'spore',
        ...ownership,
      });
    }
  }
};

