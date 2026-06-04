import { useEffect, useRef, useState } from 'react';
import { BOSS_ORDER, BOSS_TYPES, COLORS, ENEMY_ORDER, ENEMY_TYPES, TOWER_LIBRARY, UI_COPY, createInitialTowerCatalog } from '../../data/gameConfig';
import { getBossPresentation } from '../../data/bossPresentation';
import { canPlaceTowerOnField, createWaveDefinition, findNearestTarget, getSpawnPosition } from '../engine/gameRules';
import { createRuntimeState } from '../engine/gameState';
import { dist, drawRoundRect, formatTime, rand, toWorldPoint } from '../engine/gameMath';

const DRAG_CANCEL_MARGIN = 18;

const createProjectile = (x, y, angle, speed, damage, extras = {}) => ({
  x,
  y,
  previousX: x,
  previousY: y,
  vx: Math.cos(angle) * speed,
  vy: Math.sin(angle) * speed,
  damage,
  life: extras.life ?? 1.5,
  color: extras.color ?? COLORS.projectile,
  kind: extras.kind ?? 'basic',
  radius: extras.radius ?? 4,
  pierce: extras.pierce ?? 0,
  splash: extras.splash,
  slowRatio: extras.slowRatio,
  slowDuration: extras.slowDuration,
  hitEnemies: extras.hitEnemies,
});

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const cloneTower = (tower) => ({ ...tower });

const splitEncounterValue = (totalValue, shares) => {
  let remaining = totalValue;
  return shares.map((share, index) => {
    const isLast = index === shares.length - 1;
    const value = isLast ? remaining : Math.max(1, Math.round(totalValue * share));
    remaining -= value;
    return value;
  });
};

const createTwinsEncounterMembers = (bossTemplate) => {
  const [sunValue, moonValue] = splitEncounterValue(bossTemplate.value, [0.5, 0.5]);

  return [
    {
      id: 'TWIN_SOL',
      name: '曜子',
      form: 'twinSun',
      isBoss: true,
      enemyType: 'BOSS',
      hp: Math.round(bossTemplate.maxHp * 0.46),
      maxHp: Math.round(bossTemplate.maxHp * 0.46),
      speed: Math.round(bossTemplate.baseSpeed * 1.26),
      damage: Math.max(8, Math.round(bossTemplate.damage * 0.72)),
      radius: 24,
      color: COLORS.enemyBomber,
      value: sunValue,
      phases: [
        { name: '炽近', hpBelow: 1, abilities: ['solarDash'] },
        { name: '灼线', hpBelow: 0.68, abilities: ['solarDash', 'flareLance', 'twinCrossfire'] },
        { name: '日蚀', hpBelow: 0.34, abilities: ['solarDash', 'flareLance', 'twinCrossfire', 'eclipsePulse'] },
      ],
    },
    {
      id: 'TWIN_LUNA',
      name: '蚀子',
      form: 'twinMoon',
      isBoss: true,
      enemyType: 'BOSS',
      hp: Math.round(bossTemplate.maxHp * 0.54),
      maxHp: Math.round(bossTemplate.maxHp * 0.54),
      speed: Math.round(bossTemplate.baseSpeed * 0.92),
      damage: Math.max(7, Math.round(bossTemplate.damage * 0.62)),
      radius: 26,
      color: COLORS.enemyPhase,
      value: moonValue,
      phases: [
        { name: '月网', hpBelow: 1, abilities: ['lunarSnare'] },
        { name: '锁域', hpBelow: 0.68, abilities: ['lunarSnare', 'shadowArc', 'twinCrossfire'] },
        { name: '残月', hpBelow: 0.34, abilities: ['lunarSnare', 'shadowArc', 'twinCrossfire', 'eclipsePulse'] },
      ],
    },
  ];
};

const getBossPhaseOverrides = (bossTemplate) => {
  if (bossTemplate.id === 'COMMANDER') {
    return [
      { name: '列阵', hpBelow: 1, abilities: ['summonFormation', 'commandLine'] },
      { name: '压阵', hpBelow: 0.6, abilities: ['summonFormation', 'commandLine', 'shieldPulse', 'phalanxAdvance'] },
      { name: '破阵', hpBelow: 0.3, abilities: ['summonFormation', 'shieldPulse', 'phalanxAdvance', 'commandRush'] },
    ];
  }
  if (bossTemplate.id === 'HUNTER') {
    return [
      { name: '试探', hpBelow: 1, abilities: ['dashAtPlayer', 'markPrey'] },
      { name: '围猎', hpBelow: 0.7, abilities: ['dashAtPlayer', 'markPrey', 'summonScouts', 'pincerRush'] },
      { name: '残猎', hpBelow: 0.35, abilities: ['dashAtPlayer', 'markPrey', 'pincerRush', 'afterimageBurst', 'feintStrike'] },
    ];
  }
  if (bossTemplate.id === 'FORTRESS') {
    return [
      { name: '推城', hpBelow: 1, abilities: ['summonSiege', 'bastionMortar'] },
      { name: '重甲', hpBelow: 0.5, abilities: ['summonSiege', 'bastionMortar', 'fortify', 'shockRam'] },
      { name: '崩垒', hpBelow: 0.2, abilities: ['summonSiege', 'fortify', 'shockRam', 'quake', 'bunkerRing'] },
    ];
  }
  if (bossTemplate.id === 'PRISM') {
    return [
      { name: '折光', hpBelow: 1, abilities: ['prismBeam', 'refractVolley'] },
      { name: '镜列', hpBelow: 0.66, abilities: ['prismBeam', 'refractVolley', 'mirrorSummon', 'prismLattice'] },
      { name: '棱镜', hpBelow: 0.33, abilities: ['prismBeam', 'mirrorSummon', 'prismLattice', 'tripleBeam', 'mirrorStep'] },
    ];
  }
  if (bossTemplate.id === 'HIVE') {
    return [
      { name: '铺巢', hpBelow: 1, abilities: ['spawnHive', 'broodShift'] },
      { name: '孵潮', hpBelow: 0.75, abilities: ['spawnHive', 'broodShift', 'hivePulse', 'summonSwarm'] },
      { name: '迁巢', hpBelow: 0.35, abilities: ['spawnHive', 'hivePulse', 'summonSwarm', 'hiveCollapse', 'broodShift'] },
    ];
  }
  if (bossTemplate.id === 'FROST_JUDGE') {
    return [
      { name: '冰审', hpBelow: 1, abilities: ['frostRing', 'whiteout'] },
      { name: '封判', hpBelow: 0.6, abilities: ['frostRing', 'whiteout', 'freezeTower', 'glacialPrison'] },
      { name: '寒狱', hpBelow: 0.25, abilities: ['frostRing', 'freezeTower', 'glacialPrison', 'summonFrostGuards', 'coldSnap'] },
    ];
  }
  if (bossTemplate.id === 'RAIL_WARLORD') {
    return [
      { name: '锁线', hpBelow: 1, abilities: ['railShot', 'crosshairBarrage'] },
      { name: '钉杀', hpBelow: 0.7, abilities: ['railShot', 'markTower', 'crosshairBarrage', 'suppressiveGrid'] },
      { name: '歼灭', hpBelow: 0.4, abilities: ['railShot', 'markTower', 'suppressiveGrid', 'overload', 'killLane'] },
    ];
  }
  if (bossTemplate.id === 'COLLECTOR') {
    return [
      { name: '抽税', hpBelow: 1, abilities: ['stealMoney', 'taxBeacon'] },
      { name: '搬运', hpBelow: 0.5, abilities: ['stealMoney', 'taxBeacon', 'summonScouts', 'paydaySweep'] },
      { name: '收账', hpBelow: 0.25, abilities: ['stealMoney', 'summonScouts', 'paydaySweep', 'ransomBurst', 'repossess'] },
    ];
  }
  if (bossTemplate.id === 'BLOOD_FORGE') {
    return [
      { name: '铸火', hpBelow: 1, abilities: ['forgeArmor', 'slagDrop'] },
      { name: '献炉', hpBelow: 0.58, abilities: ['forgeArmor', 'slagDrop', 'sacrificeMinions', 'brandLine'] },
      { name: '过热', hpBelow: 0.24, abilities: ['forgeArmor', 'sacrificeMinions', 'brandLine', 'moltenBurst', 'forgeDetonation'] },
    ];
  }
  if (bossTemplate.id === 'VOID_CONDUCTOR') {
    return [
      { name: '起拍', hpBelow: 1, abilities: ['conductLines', 'pulseMeasure'] },
      { name: '切分', hpBelow: 0.68, abilities: ['conductLines', 'pulseMeasure', 'tempoShift', 'syncopate'] },
      { name: '终章', hpBelow: 0.34, abilities: ['conductLines', 'tempoShift', 'syncopate', 'finale', 'crescendo'] },
    ];
  }
  if (bossTemplate.id === 'LABYRINTH_KEEPER') {
    return [
      { name: '筑墙', hpBelow: 1, abilities: ['raiseWalls', 'corridorClamp'] },
      { name: '换门', hpBelow: 0.65, abilities: ['raiseWalls', 'corridorClamp', 'gateSwap', 'mazeFold'] },
      { name: '迷狱', hpBelow: 0.3, abilities: ['raiseWalls', 'gateSwap', 'mazeFold', 'mazeCrush', 'deadEnd'] },
    ];
  }
  if (bossTemplate.id === 'NIGHTMARE_BLOOM') {
    return [
      { name: '播种', hpBelow: 1, abilities: ['seedPods', 'blightRoots'] },
      { name: '绽瘴', hpBelow: 0.68, abilities: ['seedPods', 'blightRoots', 'poisonBloom', 'sporeBurst'] },
      { name: '花园', hpBelow: 0.33, abilities: ['seedPods', 'poisonBloom', 'sporeBurst', 'gardenWake', 'creepingCanopy'] },
    ];
  }
  if (bossTemplate.id === 'DRAGON') {
    return [
      { name: '盘旋', hpBelow: 1, abilities: ['dragonStrafe', 'emberWake'] },
      { name: '俯冲', hpBelow: 0.66, abilities: ['dragonStrafe', 'emberWake', 'wingBuffet', 'meteorRain'] },
      { name: '天火', hpBelow: 0.3, abilities: ['dragonStrafe', 'wingBuffet', 'meteorRain', 'skyDive', 'infernoRing'] },
    ];
  }
  if (bossTemplate.id === 'SPIDER_MATRIARCH') {
    return [
      { name: '织杀', hpBelow: 1, abilities: ['webTrap', 'silkVolley'] },
      { name: '孵潮', hpBelow: 0.7, abilities: ['webTrap', 'silkVolley', 'spawnSpiderlings', 'broodAmbush'] },
      { name: '巢域', hpBelow: 0.35, abilities: ['webTrap', 'spawnSpiderlings', 'broodAmbush', 'nestBloom', 'webField'] },
    ];
  }
  if (bossTemplate.id === 'ASTROLABE') {
    return [
      { name: '引潮', hpBelow: 1, abilities: ['gravityWell', 'starfall'] },
      { name: '轨域', hpBelow: 0.62, abilities: ['gravityWell', 'orbitalShots', 'starfall', 'orbitalLock'] },
      { name: '奇点', hpBelow: 0.28, abilities: ['gravityWell', 'orbitalShots', 'orbitalLock', 'singularity', 'eventHorizon'] },
    ];
  }
  return bossTemplate.phases;
};

const enrichBossTemplate = (bossTemplate) => ({
  ...bossTemplate,
  phases: getBossPhaseOverrides(bossTemplate),
});

const getTowerPreviewSummary = (tower) => {
  const tags = [`价格 ${tower.cost}`, `伤害 ${tower.damage}`, `射程 ${tower.range}`];
  if (tower.splash) tags.push(`爆炸 ${tower.splash}`);
  if (tower.pierce) tags.push(`穿透 ${tower.pierce}`);
  if (tower.slowRatio) tags.push('减速');
  if (tower.burstCount) tags.push(`散射 ${tower.burstCount}`);
  return tags.join(' / ');
};

const upgradeTowerStats = (tower) => {
  return {
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
  };
};

const buildTowerAtLevel = (tower, level) => {
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

const upgradeTower = (tower) => buildTowerAtLevel(tower, (tower.level ?? 0) + 1);
const downgradeTower = (tower) => buildTowerAtLevel(tower, (tower.level ?? 0) - 1);

const drawTowerShape = (ctx, tower, x, y, color, alpha = 1) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  if (tower.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(x, y, tower.radius, 0, Math.PI * 2);
    ctx.fill();
  } else if (tower.shape === 'square') {
    drawRoundRect(ctx, x - tower.radius, y - tower.radius, tower.radius * 2, tower.radius * 2, 4);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x, y - tower.radius - 2);
    ctx.lineTo(x + tower.radius + 2, y + tower.radius);
    ctx.lineTo(x - tower.radius - 2, y + tower.radius);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
};

const drawTowerUpgradeBadge = (ctx, tower, x, y) => {
  if (!tower.level) {
    return;
  }

  const badgeWidth = 26;
  const badgeHeight = 14;
  const badgeX = x - badgeWidth / 2;
  const badgeY = y - tower.radius - 18;

  ctx.save();
  ctx.fillStyle = '#fef3c7';
  drawRoundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 7);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#b45309';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`+${tower.level}`, x, badgeY + badgeHeight / 2 + 0.5);
  ctx.restore();
};

const drawBossBody = (ctx, enemy) => {
  const r = enemy.radius;
  const phaseLevel = (enemy.currentPhaseIndex ?? 0) + 1;
  ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : enemy.color;

  if (enemy.form === 'twins') {
    ctx.beginPath();
    ctx.arc(enemy.x - r * 0.45, enemy.y, r * 0.62, 0, Math.PI * 2);
    ctx.arc(enemy.x + r * 0.45, enemy.y, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.boss;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(enemy.x - r * 0.25, enemy.y);
    ctx.lineTo(enemy.x + r * 0.25, enemy.y);
    ctx.stroke();
    return;
  }

  if (enemy.form === 'twinSun') {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r * 0.68, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      ctx.beginPath();
      ctx.moveTo(enemy.x + Math.cos(angle) * r * 0.82, enemy.y + Math.sin(angle) * r * 0.82);
      ctx.lineTo(enemy.x + Math.cos(angle) * r * 1.18, enemy.y + Math.sin(angle) * r * 1.18);
      ctx.stroke();
    }
    if (phaseLevel >= 3) {
      ctx.strokeStyle = 'rgba(255,245,184,0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, r * 0.94, 0, Math.PI * 2);
      ctx.stroke();
      for (let index = 0; index < 4; index += 1) {
        const angle = (Math.PI * 2 * index) / 4 + Math.PI / 8;
        ctx.beginPath();
        ctx.moveTo(enemy.x + Math.cos(angle) * r * 1.02, enemy.y + Math.sin(angle) * r * 1.02);
        ctx.lineTo(enemy.x + Math.cos(angle) * r * 1.34, enemy.y + Math.sin(angle) * r * 1.34);
        ctx.stroke();
      }
    }
    return;
  }

  if (enemy.form === 'twinMoon') {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r * 0.74, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.bg;
    ctx.beginPath();
    ctx.arc(enemy.x + r * 0.24, enemy.y - r * 0.08, r * 0.56, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r * 0.96, -Math.PI / 3, Math.PI / 2);
    ctx.stroke();
    if (phaseLevel >= 3) {
      ctx.strokeStyle = 'rgba(214,239,255,0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x - r * 0.08, enemy.y, r * 1.08, -Math.PI * 0.52, Math.PI * 0.68);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(enemy.x - r * 0.12, enemy.y, r * 0.78, -Math.PI * 0.46, Math.PI * 0.62);
      ctx.stroke();
    }
    return;
  }

  if (enemy.form === 'dragon') {
    for (let index = 3; index >= 0; index -= 1) {
      ctx.globalAlpha = 0.35 + index * 0.12;
      ctx.beginPath();
      ctx.ellipse(enemy.x - index * r * 0.42, enemy.y + Math.sin(index) * r * 0.18, r * (0.58 - index * 0.05), r * 0.42, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(enemy.x - r * 0.1, enemy.y - r * 0.88);
    ctx.lineTo(enemy.x + r * 0.26, enemy.y - r * 0.18);
    ctx.lineTo(enemy.x - r * 0.34, enemy.y - r * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(enemy.x + r * 0.12, enemy.y + r * 0.88);
    ctx.lineTo(enemy.x + r * 0.4, enemy.y + r * 0.22);
    ctx.lineTo(enemy.x - r * 0.18, enemy.y + r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(enemy.x + r * 0.95, enemy.y);
    ctx.lineTo(enemy.x + r * 0.25, enemy.y - r * 0.65);
    ctx.lineTo(enemy.x + r * 0.28, enemy.y + r * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.arc(enemy.x + r * 0.78, enemy.y - r * 0.12, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    if (phaseLevel >= 2) {
      ctx.strokeStyle = 'rgba(255,214,102,0.78)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(enemy.x + r * 0.62, enemy.y - r * 0.52);
      ctx.lineTo(enemy.x + r * 0.94, enemy.y - r * 0.9);
      ctx.moveTo(enemy.x + r * 0.66, enemy.y + r * 0.52);
      ctx.lineTo(enemy.x + r * 1.02, enemy.y + r * 0.9);
      ctx.stroke();
    }
    if (phaseLevel >= 3) {
      ctx.fillStyle = 'rgba(255,214,102,0.32)';
      ctx.beginPath();
      ctx.ellipse(enemy.x + r * 0.18, enemy.y, r * 0.56, r * 0.92, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (enemy.form === 'spider') {
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y, r * 0.78, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(enemy.x + r * 0.24, enemy.y - r * 0.08, r * 0.14, 0, Math.PI * 2);
    ctx.arc(enemy.x - r * 0.06, enemy.y + r * 0.06, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 4;
    for (let side = -1; side <= 1; side += 2) {
      for (let leg = 0; leg < 4; leg += 1) {
        const y = enemy.y - r * 0.45 + leg * r * 0.3;
        ctx.beginPath();
        ctx.moveTo(enemy.x + side * r * 0.45, y);
        ctx.lineTo(enemy.x + side * r * 1.15, y + (leg - 1.5) * 5);
        ctx.stroke();
      }
    }
    if (phaseLevel >= 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(enemy.x - r * 0.32, enemy.y - r * 0.14);
      ctx.lineTo(enemy.x + r * 0.3, enemy.y + r * 0.1);
      ctx.moveTo(enemy.x - r * 0.26, enemy.y + r * 0.18);
      ctx.lineTo(enemy.x + r * 0.22, enemy.y - r * 0.2);
      ctx.stroke();
    }
    if (phaseLevel >= 3) {
      ctx.fillStyle = 'rgba(217,249,157,0.3)';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(enemy.x + side * r * 0.34, enemy.y - r * 0.18, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }

  if (enemy.form === 'astrolabe') {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 3;
    for (const rotation of [0, Math.PI / 3, -Math.PI / 3]) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.1, r * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let index = 0; index < 3; index += 1) {
      const angle = (Math.PI * 2 * index) / 3 + (enemy.currentPhaseIndex ?? 0) * 0.35;
      ctx.beginPath();
      ctx.arc(enemy.x + Math.cos(angle) * r * 0.9, enemy.y + Math.sin(angle) * r * 0.9, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    if (phaseLevel >= 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, r * 1.24, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (phaseLevel >= 3) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (enemy.form === 'forge') {
    drawRoundRect(ctx, enemy.x - r * 0.82, enemy.y - r * 0.7, r * 1.64, r * 1.4, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(enemy.x - r * 0.5, enemy.y - r * 0.18, r, r * 0.36);
    return;
  }

  if (enemy.form === 'conductor') {
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y - r);
    ctx.lineTo(enemy.x + r * 0.82, enemy.y);
    ctx.lineTo(enemy.x, enemy.y + r);
    ctx.lineTo(enemy.x - r * 0.82, enemy.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.boss;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(enemy.x - r, enemy.y - r * 0.65);
    ctx.lineTo(enemy.x + r, enemy.y + r * 0.65);
    ctx.stroke();
    return;
  }

  if (enemy.form === 'labyrinth') {
    drawRoundRect(ctx, enemy.x - r, enemy.y - r, r * 2, r * 2, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(enemy.x - r * 0.6, enemy.y - r * 0.5);
    ctx.lineTo(enemy.x + r * 0.5, enemy.y - r * 0.5);
    ctx.lineTo(enemy.x + r * 0.5, enemy.y + r * 0.15);
    ctx.lineTo(enemy.x - r * 0.45, enemy.y + r * 0.15);
    ctx.lineTo(enemy.x - r * 0.45, enemy.y + r * 0.62);
    ctx.stroke();
    return;
  }

  if (enemy.form === 'bloom') {
    for (let petal = 0; petal < 6; petal += 1) {
      const angle = (Math.PI * 2 * petal) / 6;
      ctx.beginPath();
      ctx.ellipse(enemy.x + Math.cos(angle) * r * 0.42, enemy.y + Math.sin(angle) * r * 0.42, r * 0.36, r * 0.68, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = COLORS.boss;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  drawRoundRect(ctx, enemy.x - r, enemy.y - r, r * 2, r * 2, 5);
  ctx.fill();
};

const getHazardGlyph = (hazard) => {
  if (hazard.type === 'area') {
    if (['gravity', 'singularity', 'horizon', 'star'].includes(hazard.label)) return '◎';
    if (['web', 'nest', 'brood', 'shade', 'spore', 'garden', 'poison', 'vine', 'silk'].includes(hazard.label)) return '✳';
    if (['frost', 'prison', 'moon'].includes(hazard.label)) return '✦';
    if (['mortar', 'bunker', 'meteor', 'ember', 'dive', 'slag', 'inferno', 'eclipse'].includes(hazard.label)) return '✹';
    if (['wall', 'gate'].includes(hazard.label)) return '□';
    if (['beat', 'coin'].includes(hazard.label)) return '◌';
  }

  if (['charge', 'ram', 'hunt', 'slash', 'solar', 'breath', 'strafe'].includes(hazard.label)) return '>>';
  if (['rail', 'crosshair', 'grid', 'overload', 'tempo', 'orbit', 'lock'].includes(hazard.label)) return '||';
  if (['refract', 'lattice', 'mirror', 'flare', 'shadow', 'crossfire', 'sunbolt', 'moonbolt'].includes(hazard.label)) return '<>';
  if (['formation', 'wall', 'gate', 'maze'].includes(hazard.label)) return '[]';
  if (['brand', 'coinline'].includes(hazard.label)) return '//';
  return '';
};

const drawBossPhaseAura = (ctx, enemy) => {
  const timer = enemy.bossState.phaseIntroTimer ?? 0;
  if (timer <= 0) return;

  const duration = enemy.bossState.phaseIntroDuration ?? 1;
  const t = Math.max(0, Math.min(1, timer / duration));
  const eased = 1 - t;
  const radius = enemy.radius + 14 + eased * 20;
  const rotation = eased * Math.PI * 1.6 * (enemy.uid % 2 === 0 ? 1 : -1);
  const shardCount = 4 + (enemy.currentPhaseIndex ?? 0) * 2;

  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(rotation);
  ctx.globalAlpha = 0.2 + t * 0.45;
  ctx.strokeStyle = enemy.color;
  ctx.lineWidth = 2 + t * 2;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.strokeRect(-radius * 0.72, -radius * 0.72, radius * 1.44, radius * 1.44);

  ctx.fillStyle = enemy.color;
  ctx.globalAlpha = 0.22 + t * 0.28;
  for (let index = 0; index < shardCount; index += 1) {
    const angle = (Math.PI * 2 * index) / shardCount;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 5, y - 10);
    ctx.lineTo(x + 5, y - 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
};

const drawBossShowcaseAccent = (ctx, enemy) => {
  const phaseLevel = (enemy.currentPhaseIndex ?? 0) + 1;
  const pulse = 0.72 + Math.sin((enemy.x + enemy.y + enemy.uid) * 0.01 + phaseLevel) * 0.08;

  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  if (enemy.form === 'dragon') {
    ctx.globalAlpha = 0.18 + phaseLevel * 0.05;
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.moveTo(-enemy.radius * 0.28, -enemy.radius * 0.16);
    ctx.quadraticCurveTo(-enemy.radius * (1.2 + phaseLevel * 0.08), -enemy.radius * (1 + phaseLevel * 0.06), -enemy.radius * 0.1, -enemy.radius * 0.3);
    ctx.quadraticCurveTo(-enemy.radius * 0.9, -enemy.radius * 0.1, -enemy.radius * 0.15, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-enemy.radius * 0.12, enemy.radius * 0.18);
    ctx.quadraticCurveTo(-enemy.radius * (1.05 + phaseLevel * 0.1), enemy.radius * (0.95 + phaseLevel * 0.06), -enemy.radius * 0.08, enemy.radius * 0.34);
    ctx.quadraticCurveTo(-enemy.radius * 0.88, enemy.radius * 0.18, -enemy.radius * 0.04, 0.08);
    ctx.closePath();
    ctx.fill();
    if (phaseLevel >= 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-enemy.radius * 0.2, 0);
      ctx.lineTo(-enemy.radius * 1.1, -enemy.radius * 0.46);
      ctx.moveTo(-enemy.radius * 0.12, enemy.radius * 0.1);
      ctx.lineTo(-enemy.radius * 1.02, enemy.radius * 0.52);
      ctx.stroke();
    }
    if (phaseLevel >= 3) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = 'rgba(255,196,87,0.85)';
      for (let index = 0; index < 3; index += 1) {
        ctx.beginPath();
        ctx.arc(-enemy.radius * (0.55 + index * 0.22), Math.sin(index) * enemy.radius * 0.18, enemy.radius * (0.08 + index * 0.02), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (enemy.form === 'spider') {
    ctx.globalAlpha = 0.16 + phaseLevel * 0.04;
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 7]);
    for (let ring = 0; ring < phaseLevel; ring += 1) {
      const radius = enemy.radius * (1 + ring * 0.28);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      for (let spoke = 0; spoke < 6; spoke += 1) {
        const angle = (Math.PI * 2 * spoke) / 6 + ring * 0.22;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * enemy.radius * 0.34, Math.sin(angle) * enemy.radius * 0.34);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.stroke();
      }
    }
  }

  if (enemy.form === 'astrolabe') {
    ctx.globalAlpha = 0.22 + phaseLevel * 0.04;
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 2;
    ctx.rotate((enemy.currentPhaseIndex ?? 0) * 0.35 + enemy.uid * 0.04);
    for (let ring = 0; ring < Math.min(3, phaseLevel + 1); ring += 1) {
      const radius = enemy.radius * (0.92 + ring * 0.32);
      ctx.setLineDash(ring % 2 === 0 ? [5, 8] : [2, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      for (let node = 0; node < 3 + ring; node += 1) {
        const angle = (Math.PI * 2 * node) / (3 + ring);
        ctx.fillStyle = ring === 2 ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.38)';
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, enemy.radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (enemy.form === 'twinSun' || enemy.form === 'twinMoon') {
    ctx.globalAlpha = 0.16 + phaseLevel * 0.05;
    ctx.strokeStyle = enemy.form === 'twinSun' ? 'rgba(255,211,102,0.9)' : 'rgba(148,212,255,0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash(enemy.form === 'twinSun' ? [9, 6] : [4, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * (1.05 + phaseLevel * 0.16), 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(phaseLevel * 0.28);
    ctx.setLineDash([]);
    for (let index = 0; index < phaseLevel + 1; index += 1) {
      const angle = (Math.PI * 2 * index) / (phaseLevel + 1);
      const radius = enemy.radius * (0.92 + phaseLevel * 0.08);
      ctx.fillStyle = enemy.form === 'twinSun' ? 'rgba(255,245,184,0.78)' : 'rgba(214,239,255,0.72)';
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, enemy.radius * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
};

const drawBossEncounterLinks = (ctx, enemies) => {
  const encounterGroups = new Map();
  for (const enemy of enemies) {
    if (!enemy.isBoss || !enemy.encounterUid) continue;
    const list = encounterGroups.get(enemy.encounterUid) ?? [];
    list.push(enemy);
    encounterGroups.set(enemy.encounterUid, list);
  }

  for (const members of encounterGroups.values()) {
    if (members.length !== 2) continue;
    const [a, b] = members;
    const midX = (a.x + b.x) * 0.5;
    const midY = (a.y + b.y) * 0.5;
    const distance = dist(a, b);
    const beamAlpha = Math.max(0.14, Math.min(0.34, 0.36 - distance / 900));

    ctx.save();
    ctx.globalAlpha = beamAlpha;
    ctx.strokeStyle = 'rgba(255,255,255,0.68)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.arc(midX, midY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = a.twinRole === 'sun' ? a.color : b.color;
    ctx.beginPath();
    ctx.arc(midX, midY, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
};

const getBossPhaseCallout = (boss, activePhaseIndex) => {
  if (boss.form === 'twinSun' || boss.form === 'twinMoon') {
    return activePhaseIndex >= 2 ? '双体封位进入终幕，交叉火线会更主动地收拢空间。' : '双子开始联动逼位，注意两体的交叉站位。';
  }
  if (boss.form === 'dragon') {
    return activePhaseIndex >= 2 ? '龙翼开始封场，俯冲后的余焰会把安全区切碎。' : '空域在收紧，横切躲避会比后撤更稳。';
  }
  if (boss.form === 'spider') {
    return activePhaseIndex >= 2 ? '巢域扩张到终幕密度，退路会被蛛网和孵化点一起压缩。' : '蜘蛛开始经营场地，优先留意网区和包围方向。';
  }
  if (boss.form === 'astrolabe') {
    return activePhaseIndex >= 2 ? '奇点开始收束，牵引和锁线会把原本安全的角落变成陷阱。' : '轨道开始成形，提前给转向留空间。';
  }
  return activePhaseIndex >= 2 ? 'Boss 进入高压阶段，节奏和空间关系都在改变。' : 'Boss 的出招结构正在变化，准备切换应对节奏。';
};

const getBossPhaseHint = (boss, activePhaseIndex) => {
  const phaseTier = Math.max(0, Math.min(2, activePhaseIndex));

  const phaseHintsByForm = {
    commander: ['Advance', 'Shield Wall', 'Breakthrough'],
    hunter: ['Probe', 'Pincer', 'Execution'],
    fortress: ['Siege', 'Fortify', 'Crush'],
    prism: ['Refraction', 'Mirrors', 'Overload'],
    hive: ['Nest', 'Swarm', 'Collapse'],
    frostJudge: ['Slowfield', 'Freeze Mark', 'Judgment'],
    railWarlord: ['Targeting', 'Suppression', 'Kill Lane'],
    collector: ['Tax', 'Escort', 'Repossess'],
    twinSun: ['Pressure', 'Crossfire', 'Eclipse'],
    twinMoon: ['Snare', 'Lockdown', 'Eclipse'],
    dragon: ['Strafe', 'Air Supremacy', 'Inferno Dive'],
    spider: ['Webs', 'Encircle', 'Nest Bloom'],
    astrolabe: ['Gravity', 'Orbital Lock', 'Event Horizon'],
    forge: ['Armor', 'Sacrifice', 'Detonation'],
    conductor: ['Tempo', 'Syncopate', 'Finale'],
    labyrinth: ['Corridor', 'Gate Shift', 'Dead End'],
    bloom: ['Seed', 'Blight', 'Canopy'],
  };

  const hints = phaseHintsByForm[boss.form];
  if (hints?.[phaseTier]) {
    return hints[phaseTier];
  }

  return phaseTier === 0 ? 'Setup' : phaseTier === 1 ? 'Pressure' : 'Burst';
};

const drawImpactWaveAccent = (ctx, impactWave, alpha) => {
  const progress = 1 - alpha;
  const accentColor = impactWave.accentColor ?? impactWave.color;
  const secondaryColor = impactWave.secondaryColor ?? '#ffffff';
  const nodeCount = impactWave.nodeCount ?? 6;

  if (impactWave.style === 'twinFinisher') {
    ctx.save();
    ctx.translate(impactWave.x, impactWave.y);
    ctx.rotate(progress * Math.PI * 1.4);
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.ellipse(0, 0, impactWave.radius * 0.92, impactWave.radius * 0.54, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(-progress * Math.PI * 2);
    ctx.strokeStyle = accentColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, impactWave.radius * 0.54, impactWave.radius * 0.92, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let index = 0; index < nodeCount; index += 1) {
      const angle = (Math.PI * 2 * index) / nodeCount;
      ctx.fillStyle = index % 2 === 0 ? accentColor : secondaryColor;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * impactWave.radius * 0.78, Math.sin(angle) * impactWave.radius * 0.44, impactWave.radius * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha * 0.5;
    ctx.lineWidth = 1.8;
    if (impactWave.anchorA && impactWave.anchorB) {
      ctx.strokeStyle = secondaryColor;
      ctx.setLineDash([4, 10]);
      ctx.beginPath();
      ctx.moveTo(impactWave.anchorA.x, impactWave.anchorA.y);
      ctx.lineTo(impactWave.anchorB.x, impactWave.anchorB.y);
      ctx.stroke();
    }
    for (const anchor of [impactWave.anchorA, impactWave.anchorB]) {
      if (!anchor) continue;
      ctx.strokeStyle = anchor.color ?? accentColor;
      ctx.beginPath();
      ctx.moveTo(impactWave.x, impactWave.y);
      ctx.lineTo(anchor.x, anchor.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (impactWave.style === 'dragonFinisher') {
    ctx.save();
    ctx.translate(impactWave.x, impactWave.y);
    ctx.rotate((impactWave.rotation ?? 0) + progress * 0.45);
    for (let index = 0; index < 3; index += 1) {
      ctx.globalAlpha = alpha * (0.75 - index * 0.12);
      ctx.strokeStyle = index === 1 ? secondaryColor : accentColor;
      ctx.lineWidth = 2 + index * 0.8;
      ctx.setLineDash(index === 2 ? [10, 8] : []);
      ctx.beginPath();
      ctx.arc(0, 0, impactWave.radius * (0.45 + index * 0.22), -0.95, 0.95);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let index = 0; index < 4; index += 1) {
      const flameX = -impactWave.radius * (0.22 + index * 0.16);
      const flameY = Math.sin(progress * 6 + index) * impactWave.radius * 0.16;
      ctx.globalAlpha = alpha * (0.5 - index * 0.08);
      ctx.fillStyle = index % 2 === 0 ? accentColor : secondaryColor;
      ctx.beginPath();
      ctx.moveTo(flameX, flameY - impactWave.radius * 0.08);
      ctx.quadraticCurveTo(flameX - impactWave.radius * 0.08, flameY, flameX, flameY + impactWave.radius * 0.08);
      ctx.quadraticCurveTo(flameX + impactWave.radius * 0.06, flameY, flameX, flameY - impactWave.radius * 0.08);
      ctx.fill();
    }
    ctx.restore();
  }

  if (impactWave.style === 'spiderFinisher') {
    ctx.save();
    ctx.translate(impactWave.x, impactWave.y);
    ctx.rotate(progress * 0.3);
    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 8]);
    for (let ring = 0; ring < 2; ring += 1) {
      const radius = impactWave.radius * (0.46 + ring * 0.34);
      ctx.beginPath();
      for (let index = 0; index < nodeCount; index += 1) {
        const angle = (Math.PI * 2 * index) / nodeCount;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.86;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = secondaryColor;
    for (let index = 0; index < nodeCount; index += 1) {
      const angle = (Math.PI * 2 * index) / nodeCount;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * impactWave.radius * 0.26, Math.sin(angle) * impactWave.radius * 0.22);
      ctx.lineTo(Math.cos(angle) * impactWave.radius * 0.8, Math.sin(angle) * impactWave.radius * 0.68);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (impactWave.style === 'astrolabeFinisher') {
    ctx.save();
    ctx.translate(impactWave.x, impactWave.y);
    ctx.rotate((impactWave.rotation ?? 0) - progress * 0.65);
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.globalAlpha = alpha * (0.86 - ring * 0.18);
      ctx.strokeStyle = ring === 1 ? secondaryColor : accentColor;
      ctx.lineWidth = ring === 1 ? 1.8 : 2.4;
      ctx.setLineDash(ring === 1 ? [3, 9] : [8, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, impactWave.radius * (0.42 + ring * 0.22), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let index = 0; index < nodeCount; index += 1) {
      const angle = (Math.PI * 2 * index) / nodeCount;
      const x = Math.cos(angle) * impactWave.radius * 0.86;
      const y = Math.sin(angle) * impactWave.radius * 0.86;
      ctx.globalAlpha = alpha * 0.75;
      ctx.strokeStyle = accentColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = index % 2 === 0 ? secondaryColor : accentColor;
      ctx.beginPath();
      ctx.arc(x, y, impactWave.radius * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

const drawAreaHazardAccent = (ctx, hazard, progress) => {
  const alpha = 0.16 + (1 - progress) * 0.18;

  if (hazard.label === 'eclipse') {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(hazard.x - hazard.radius * 0.14, hazard.y, hazard.radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = hazard.color;
    ctx.beginPath();
    ctx.arc(hazard.x - hazard.radius * 0.04, hazard.y, hazard.radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (hazard.label === 'inferno') {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.8;
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI * 2 * index) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * hazard.radius * 0.2, Math.sin(angle) * hazard.radius * 0.2);
      ctx.quadraticCurveTo(
        Math.cos(angle + 0.18) * hazard.radius * 0.52,
        Math.sin(angle + 0.18) * hazard.radius * 0.52,
        Math.cos(angle) * hazard.radius * 0.8,
        Math.sin(angle) * hazard.radius * 0.8
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  if (hazard.label === 'nest') {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fef3c7';
    for (let index = 0; index < 3; index += 1) {
      const angle = (Math.PI * 2 * index) / 3 - Math.PI / 2;
      const x = Math.cos(angle) * hazard.radius * 0.78;
      const y = Math.sin(angle) * hazard.radius * 0.78;
      ctx.beginPath();
      ctx.moveTo(x, y - hazard.radius * 0.06);
      ctx.lineTo(x - hazard.radius * 0.05, y + hazard.radius * 0.06);
      ctx.lineTo(x + hazard.radius * 0.05, y + hazard.radius * 0.06);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  if (hazard.label === 'horizon') {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.rotate((1 - progress) * 0.8);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const x = Math.cos(angle) * hazard.radius * 0.68;
      const y = Math.sin(angle) * hazard.radius * 0.68;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const x = Math.cos(angle) * hazard.radius * 0.68;
      const y = Math.sin(angle) * hazard.radius * 0.68;
      ctx.fillStyle = index % 2 === 0 ? '#ffffff' : hazard.color;
      ctx.beginPath();
      ctx.arc(x, y, hazard.radius * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

const drawLineHazardAccent = (ctx, hazard, progress) => {
  const dx = hazard.x2 - hazard.x;
  const dy = hazard.y2 - hazard.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0.001) return;

  const alpha = 0.18 + (1 - progress) * 0.18;
  const angle = Math.atan2(dy, dx);
  const midX = (hazard.x + hazard.x2) * 0.5;
  const midY = (hazard.y + hazard.y2) * 0.5;

  if (hazard.label === 'crossfire') {
    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    const size = Math.max(12, hazard.width * 1.2);
    ctx.beginPath();
    ctx.moveTo(-size, -size);
    ctx.lineTo(size, size);
    ctx.moveTo(-size, size);
    ctx.lineTo(size, -size);
    ctx.stroke();
    ctx.restore();
  }

  if (hazard.label === 'flare' || hazard.label === 'shadow') {
    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = hazard.label === 'flare' ? '#fde68a' : '#e0e7ff';
    ctx.lineWidth = 1.4;
    const offset = Math.max(10, hazard.width * 1.1);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-length * 0.18, side * offset);
      ctx.lineTo(0, side * (offset * 0.36));
      ctx.lineTo(length * 0.18, side * offset);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (hazard.label === 'breath' || hazard.label === 'strafe' || hazard.label === 'diveTrail') {
    ctx.save();
    ctx.translate(hazard.x, hazard.y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = hazard.label === 'diveTrail' ? '#ffd166' : 'rgba(255,255,255,0.78)';
    ctx.lineWidth = 1.6;
    const amplitude = hazard.label === 'diveTrail' ? hazard.width * 0.48 : hazard.width * 0.34;
    for (let step = 0; step < 4; step += 1) {
      const start = (length * step) / 4;
      const end = start + length * 0.18;
      ctx.beginPath();
      ctx.moveTo(start, 0);
      ctx.quadraticCurveTo((start + end) * 0.5, -amplitude, end, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (hazard.label === 'orbit' || hazard.label === 'lock') {
    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle + (hazard.label === 'orbit' ? (1 - progress) * 0.6 : 0));
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(10, hazard.width), 0, Math.PI * 2);
    ctx.stroke();
    const ringRadius = Math.max(16, hazard.width * 1.65);
    for (let index = 0; index < 4; index += 1) {
      const nodeAngle = (Math.PI * 2 * index) / 4;
      ctx.fillStyle = index % 2 === 0 ? '#ffffff' : hazard.color;
      ctx.beginPath();
      ctx.arc(Math.cos(nodeAngle) * ringRadius, Math.sin(nodeAngle) * ringRadius, Math.max(2.5, hazard.width * 0.22), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

export default function useGeoGuardGame() {
  const canvasRef = useRef(null);
  const game = useRef(createRuntimeState());
  const towerCatalogRef = useRef(createInitialTowerCatalog());
  const [gameState, setGameState] = useState('START');
  const [money, setMoney] = useState(0);
  const [health, setHealth] = useState(100);
  const [maxHealth] = useState(100);
  const [time, setTime] = useState(0);
  const [waveMsg, setWaveMsg] = useState(null);
  const [currentWave, setCurrentWave] = useState(1);
  const [waveOverview, setWaveOverview] = useState({ label: '', focus: '' });
  const [dragTowerId, setDragTowerId] = useState(null);
  const [dragEntity, setDragEntity] = useState(null);
  const [towerCatalog, setTowerCatalog] = useState(createInitialTowerCatalog());
  const [rewardState, setRewardState] = useState({ active: false, choices: [] });
  const [bossHud, setBossHud] = useState([]);
  const [debugOptions, setDebugOptions] = useState({ infiniteMoney: false, infiniteHealth: false });
  const [towerContextMenu, setTowerContextMenu] = useState(null);
  const waveMessageTimeoutRef = useRef(null);

  towerCatalogRef.current = towerCatalog;
  game.current.towerCatalog = towerCatalog;

  useEffect(
    () => () => {
      if (waveMessageTimeoutRef.current) {
        window.clearTimeout(waveMessageTimeoutRef.current);
      }
    },
    []
  );

  const showWaveMessage = (message, duration = 1800) => {
    const nextMessage = typeof message === 'string' ? { title: message, tone: 'system' } : message;
    if (waveMessageTimeoutRef.current) {
      window.clearTimeout(waveMessageTimeoutRef.current);
    }
    setWaveMsg(nextMessage);
    waveMessageTimeoutRef.current = window.setTimeout(() => setWaveMsg(null), duration);
  };

  const spawnParticle = (x, y, color, count, speedBase = 50) => {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * speedBase + 20;
      game.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: rand(0.3, 0.6),
        color,
        size: rand(2, 4),
      });
    }
  };

  const spawnFloatingText = (x, y, text, color, options = {}) => {
    const life = options.life ?? 0.8;
    game.current.floatingTexts.push({
      x,
      y,
      text,
      color,
      life,
      maxLife: life,
      vy: options.vy ?? -30,
      font: options.font ?? 'bold 14px system-ui, sans-serif',
      outlineColor: options.outlineColor ?? null,
    });
  };

  const spawnImpactWave = (x, y, options = {}) => {
    game.current.impactWaves.push({
      x,
      y,
      radius: options.startRadius ?? 6,
      maxRadius: options.maxRadius ?? 54,
      growth: options.growth ?? 220,
      life: options.life ?? 0.28,
      maxLife: options.life ?? 0.28,
      color: options.color ?? COLORS.towerCannon,
      lineWidth: options.lineWidth ?? 4,
      fillAlpha: options.fillAlpha ?? 0.12,
      dash: options.dash ?? [],
      spokes: options.spokes ?? 0,
      spin: options.spin ?? 0,
      style: options.style ?? null,
      accentColor: options.accentColor ?? options.color ?? COLORS.towerCannon,
      secondaryColor: options.secondaryColor ?? '#ffffff',
      nodeCount: options.nodeCount ?? 6,
      anchorA: options.anchorA ?? null,
      anchorB: options.anchorB ?? null,
      rotation: options.rotation ?? 0,
    });
  };

  const syncHudMoney = () => setMoney(game.current.debugOptions.infiniteMoney ? '∞' : game.current.money);
  const syncHudHealth = () => setHealth(game.current.debugOptions.infiniteHealth ? game.current.player.maxHp : Math.max(0, Math.floor(game.current.player.hp)));

  const syncBossHud = () => {
    const bosses = game.current.enemies.filter((enemy) => enemy.isBoss);
    const groups = new Map();
    for (const boss of bosses) {
      const key = boss.encounterUid ? `enc-${boss.encounterUid}` : `boss-${boss.uid}`;
      const presentation = getBossPresentation(boss.encounterBossId ?? boss.id);
      const existing = groups.get(key) ?? {
        id: key,
        title: boss.encounterName ?? boss.name,
        summary: presentation?.summary ?? '',
        threats: presentation?.threats ?? [],
        counterplay: presentation?.counterplay ?? '',
        members: [],
      };
      existing.members.push({
        id: boss.uid,
        name: boss.name,
        color: boss.color,
        hpRatio: Math.max(0, boss.hp / boss.maxHp),
        phase: boss.phases?.[boss.currentPhaseIndex]?.name ?? '',
        phaseIndex: boss.currentPhaseIndex ?? 0,
        phaseCount: boss.phases?.length ?? 0,
        phaseHint: getBossPhaseHint(boss, boss.currentPhaseIndex ?? 0),
        enraged: Boolean(boss.bossState.partnerFallen),
      });
      groups.set(key, existing);
    }

    const nextHud = [...groups.values()].map((group) => ({
      ...group,
      members: group.members.sort((left, right) => left.id - right.id),
    }));
    setBossHud((previous) => {
      const previousJson = JSON.stringify(previous);
      const nextJson = JSON.stringify(nextHud);
      return previousJson === nextJson ? previous : nextHud;
    });
  };

  const showBossSpotlight = (bossTemplate, options = {}) => {
    const presentation = getBossPresentation(bossTemplate.id);
    const subtitleParts = [];
    if (presentation?.threats?.length) {
      subtitleParts.push(`关键词：${presentation.threats.join(' / ')}`);
    }
    if (presentation?.counterplay) {
      subtitleParts.push(`应对：${presentation.counterplay}`);
    }
    showWaveMessage(
      {
        title: `${options.prefix ?? UI_COPY.bossIncoming} · ${bossTemplate.name}`,
        subtitle: subtitleParts.join('  ｜  '),
        tone: 'boss',
        accentColor: bossTemplate.color,
      },
      options.duration ?? 3200
    );
  };

  const addCameraShake = (strength, duration = 0.28) => {
    const camera = game.current.camera;
    camera.shakeTimer = Math.max(camera.shakeTimer ?? 0, duration);
    camera.shakeDuration = Math.max(camera.shakeDuration ?? 0, duration);
    camera.shakeStrength = Math.max(camera.shakeStrength ?? 0, strength);
    camera.shakeSeed = Math.random() * Math.PI * 2;
  };

  const triggerBossPhaseShift = (boss, activePhase, activePhaseIndex, previousPhaseIndex = -1) => {
    boss.bossState.phaseIntroTimer = 1.15;
    boss.bossState.phaseIntroDuration = 1.15;
    addCameraShake(12 + activePhaseIndex * 2, previousPhaseIndex >= 0 ? 0.42 : 0.28);
    spawnImpactWave(boss.x, boss.y, {
      startRadius: boss.radius * 0.55,
      maxRadius: boss.radius + 58 + activePhaseIndex * 12,
      growth: 320,
      life: 0.46,
      color: boss.color,
      lineWidth: 5,
      fillAlpha: 0.12,
      dash: [14, 8],
      spokes: 5 + activePhaseIndex * 2,
      spin: 0.7,
    });
    spawnImpactWave(boss.x, boss.y, {
      startRadius: boss.radius * 0.3,
      maxRadius: boss.radius + 28,
      growth: 260,
      life: 0.3,
      color: '#ffffff',
      lineWidth: 2,
      fillAlpha: 0,
      dash: [3, 9],
      spokes: 0,
      spin: -1,
    });
    spawnParticle(boss.x, boss.y, boss.color, 20 + activePhaseIndex * 6, 90 + activePhaseIndex * 20);
    spawnFloatingText(boss.x, boss.y - boss.radius - 20, activePhase.name, boss.color, {
      life: 1.05,
      vy: -24,
      font: 'bold 16px system-ui, sans-serif',
      outlineColor: 'rgba(15,23,42,0.55)',
    });

    if (previousPhaseIndex >= 0) {
      const shouldAnnounce =
        !boss.encounterUid ||
        boss.form === 'dragon' ||
        boss.form === 'spider' ||
        boss.form === 'astrolabe' ||
        ((boss.form === 'twinSun' || boss.form === 'twinMoon') && boss.twinRole === 'sun');
      if (shouldAnnounce) {
        showWaveMessage(
          {
            title: `${boss.encounterName ?? boss.name} 路 ${activePhase.name}`,
            subtitle: getBossPhaseCallout(boss, activePhaseIndex),
            tone: 'phase',
            accentColor: boss.color,
          },
          1700
        );
      }
    }

    if (boss.form === 'twinSun' || boss.form === 'twinMoon') {
      const partner = getEncounterPartner(boss);
      if (partner) {
        const midX = (boss.x + partner.x) * 0.5;
        const midY = (boss.y + partner.y) * 0.5;
        spawnImpactWave(partner.x, partner.y, {
          startRadius: partner.radius * 0.4,
          maxRadius: partner.radius + 36,
          growth: 280,
          life: 0.34,
          color: partner.color,
          lineWidth: 3,
          fillAlpha: 0.08,
          dash: [8, 8],
          spokes: 4 + activePhaseIndex,
        });
        spawnImpactWave(midX, midY, {
          startRadius: 10,
          maxRadius: 62 + activePhaseIndex * 12,
          growth: 260,
          life: 0.4,
          color: '#ffffff',
          lineWidth: 2,
          fillAlpha: 0.04,
          dash: [4, 8],
          spokes: 6,
        });
        spawnParticle(midX, midY, '#ffffff', 12 + activePhaseIndex * 4, 80);
      }
    }

    if (boss.form === 'dragon') {
      for (const offset of [-1, 1]) {
        spawnImpactWave(boss.x - boss.radius * 0.45, boss.y + offset * boss.radius * 0.28, {
          startRadius: 12,
          maxRadius: boss.radius + 70 + activePhaseIndex * 16,
          growth: 360,
          life: 0.42,
          color: offset === -1 ? '#ffd166' : '#ff9f43',
          lineWidth: 3,
          fillAlpha: 0.08,
          dash: [10, 10],
          spokes: 5 + activePhaseIndex,
          spin: offset * 0.8,
        });
      }
      spawnParticle(boss.x - boss.radius * 0.65, boss.y, '#ffd166', 10 + activePhaseIndex * 4, 120);
    }

    if (boss.form === 'spider') {
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6;
        spawnImpactWave(boss.x + Math.cos(angle) * boss.radius * 1.4, boss.y + Math.sin(angle) * boss.radius * 1.1, {
          startRadius: 6,
          maxRadius: 30 + activePhaseIndex * 8,
          growth: 220,
          life: 0.3,
          color: boss.color,
          lineWidth: 2,
          fillAlpha: 0.06,
          dash: [3, 7],
          spokes: 4,
        });
      }
    }

    if (boss.form === 'astrolabe') {
      for (let ring = 0; ring < 3; ring += 1) {
        spawnImpactWave(boss.x, boss.y, {
          startRadius: boss.radius * (0.4 + ring * 0.18),
          maxRadius: boss.radius + 42 + ring * 22 + activePhaseIndex * 10,
          growth: 240 - ring * 22,
          life: 0.48 + ring * 0.05,
          color: ring === 1 ? '#ffffff' : boss.color,
          lineWidth: ring === 1 ? 2 : 3,
          fillAlpha: ring === 1 ? 0.02 : 0.06,
          dash: ring === 1 ? [2, 8] : [5, 9],
          spokes: 4 + ring + activePhaseIndex,
          spin: ring % 2 === 0 ? 0.8 : -0.8,
        });
      }
      boss.bossState.orbitalIndex = (boss.bossState.orbitalIndex ?? 0) + 1;
    }
  };

  const triggerBossClimaxAccent = (boss) => {
    if (boss.currentPhaseIndex < (boss.phases?.length ?? 0) - 1) return;

    if (boss.form === 'twinSun' || boss.form === 'twinMoon') {
      const partner = getEncounterPartner(boss);
      if (partner) {
        const midX = (boss.x + partner.x) * 0.5;
        const midY = (boss.y + partner.y) * 0.5;
        spawnImpactWave(midX, midY, {
          startRadius: 18,
          maxRadius: 84,
          growth: 190,
          life: 0.36,
          color: '#ffffff',
          lineWidth: 2,
          fillAlpha: 0.04,
          dash: [5, 9],
          spokes: 8,
          spin: 0.9,
        });
        if (dist(boss, partner) > 110) {
          spawnParticle(midX, midY, boss.color, 8, 55);
        }
      }
    }

    if (boss.form === 'dragon') {
      const retreatAngle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x) + Math.PI;
      for (let index = 0; index < 3; index += 1) {
        spawnImpactWave(
          boss.x + Math.cos(retreatAngle) * (28 + index * 20),
          boss.y + Math.sin(retreatAngle) * (18 + index * 18),
          {
            startRadius: 10 + index * 3,
            maxRadius: 34 + index * 12,
            growth: 180,
            life: 0.26 + index * 0.03,
            color: index === 2 ? '#ffd166' : COLORS.enemyBomber,
            lineWidth: 2,
            fillAlpha: 0.08,
            dash: [6, 8],
            spokes: 4,
          }
        );
      }
      spawnParticle(boss.x - boss.radius * 0.6, boss.y, '#ffd166', 6, 70);
    }

    if (boss.form === 'spider') {
      for (let spoke = 0; spoke < 4; spoke += 1) {
        const angle = (Math.PI * 2 * spoke) / 4 + (boss.uid % 3) * 0.18;
        spawnImpactWave(
          boss.x + Math.cos(angle) * boss.radius * 1.45,
          boss.y + Math.sin(angle) * boss.radius * 1.15,
          {
            startRadius: 6,
            maxRadius: 28,
            growth: 160,
            life: 0.24,
            color: boss.color,
            lineWidth: 1.5,
            fillAlpha: 0.05,
            dash: [3, 8],
            spokes: 3,
          }
        );
      }
    }

    if (boss.form === 'astrolabe') {
      spawnImpactWave(boss.x, boss.y, {
        startRadius: boss.radius * 0.85,
        maxRadius: boss.radius + 34,
        growth: 120,
        life: 0.34,
        color: '#ffffff',
        lineWidth: 2,
        fillAlpha: 0.02,
        dash: [2, 7],
        spokes: 7,
        spin: -1.1,
      });
    }
  };

  const getTowerById = (towerId) => towerCatalogRef.current.find((tower) => tower.id === towerId);

  const createEnemyFromKey = (enemyKey) => {
    const baseEnemy = ENEMY_TYPES[enemyKey];
    return {
      ...baseEnemy,
      uid: game.current.nextEnemyUid++,
      hp: baseEnemy.hp,
      maxHp: baseEnemy.hp,
      baseSpeed: baseEnemy.speed,
      shield: baseEnemy.shield ?? 0,
      maxShield: baseEnemy.shield ?? 0,
      slowTimer: 0,
      slowRatio: 1,
      hitFlash: 0,
      abilityTimer: 0,
      summonTimer: 0,
      phaseTimer: baseEnemy.phase?.interval ?? 0,
      phased: false,
      burrowTimer: baseEnemy.burrow ? baseEnemy.burrow.duration : 0,
      burrowed: Boolean(baseEnemy.burrow),
      fuseTimer: null,
      summonedByBossUid: null,
      summonedByEncounterUid: null,
      summonCategory: null,
    };
  };

  const createBossEnemy = (bossTemplate) => {
    const enrichedBoss = enrichBossTemplate(bossTemplate);
    return {
      ...enrichedBoss,
      uid: game.current.nextEnemyUid++,
      hp: enrichedBoss.hp,
      maxHp: enrichedBoss.maxHp ?? enrichedBoss.hp,
    baseSpeed: enrichedBoss.speed,
    shield: 0,
    maxShield: 0,
    slowTimer: 0,
    slowRatio: 1,
    hitFlash: 0,
    currentPhaseIndex: -1,
      abilityCooldowns: {},
      bossState: {},
      isDefeated: false,
    };
  };

  const getBossOwnership = (boss) => ({
    ownerBossUid: boss.uid,
    ownerEncounterUid: boss.encounterUid ?? null,
  });

  const getEncounterPartner = (boss) => {
    if (!boss.encounterUid) return null;
    return game.current.enemies.find((enemy) => enemy.isBoss && enemy.uid !== boss.uid && enemy.encounterUid === boss.encounterUid) ?? null;
  };

  const spawnEnemyAt = (enemyKey, x, y, extras = {}) => {
    const enemy = { ...createEnemyFromKey(enemyKey), x, y, ...extras };
    if (enemy.burrow?.emergeNearPlayer && !extras.skipBurrowPosition) {
      const angle = Math.random() * Math.PI * 2;
      enemy.x = game.current.player.x + Math.cos(angle) * enemy.burrow.emergeNearPlayer;
      enemy.y = game.current.player.y + Math.sin(angle) * enemy.burrow.emergeNearPlayer;
    }
    game.current.enemies.push(enemy);
    return enemy;
  };

  const getBossOwnedSummonCount = (bossUid, summonCategory) =>
    game.current.enemies.filter((enemy) => enemy.summonedByBossUid === bossUid && (!summonCategory || enemy.summonCategory === summonCategory)).length;

  const hasPendingBossAftermath = (bossUid) =>
    game.current.enemies.some((enemy) => enemy.summonedByBossUid === bossUid) ||
    game.current.hazards.some((hazard) => hazard.ownerBossUid === bossUid);

  const hasPendingEncounterAftermath = (encounterUid) =>
    game.current.enemies.some((enemy) => enemy.encounterUid === encounterUid || enemy.summonedByEncounterUid === encounterUid) ||
    game.current.hazards.some((hazard) => hazard.ownerEncounterUid === encounterUid);

  const findOpenEnemySpawnPosition = (source, enemyTemplate, baseRadius = 46) => {
    const blockers = [...game.current.enemies, ...game.current.towers, game.current.player];
    for (let ring = 0; ring < 4; ring += 1) {
      const ringRadius = baseRadius + ring * (enemyTemplate.radius + 18);
      const samples = 10 + ring * 4;
      for (let index = 0; index < samples; index += 1) {
        const angle = (Math.PI * 2 * index) / samples + Math.random() * 0.18;
        const candidate = {
          x: source.x + Math.cos(angle) * ringRadius,
          y: source.y + Math.sin(angle) * ringRadius,
        };
        const overlaps = blockers.some((blocker) => dist(candidate, blocker) < enemyTemplate.radius + (blocker.radius ?? 12) + 10);
        if (!overlaps) {
          return candidate;
        }
      }
    }

    return {
      x: source.x + rand(-18, 18),
      y: source.y + rand(-18, 18),
    };
  };

  const spawnBossEncounterAt = (bossTemplate, x, y) => {
    if (bossTemplate.id === 'TWINS') {
      const encounterUid = game.current.nextBossEncounterUid++;
      const memberTemplates = createTwinsEncounterMembers({
        ...bossTemplate,
        baseSpeed: bossTemplate.baseSpeed ?? bossTemplate.speed,
        maxHp: bossTemplate.maxHp ?? bossTemplate.hp,
      });
      const offsets = [-1, 1];
      const bosses = memberTemplates.map((memberTemplate, index) => {
        const boss = createBossEnemy({
          ...memberTemplate,
          encounterUid,
          encounterBossId: bossTemplate.id,
          encounterName: bossTemplate.name,
          twinRole: index === 0 ? 'sun' : 'moon',
        });
        boss.x = x + offsets[index] * 54;
        boss.y = y + (index === 0 ? -18 : 18);
        return boss;
      });
      game.current.enemies.push(...bosses);
      return bosses;
    }

    const boss = createBossEnemy({
      ...bossTemplate,
      maxHp: bossTemplate.maxHp ?? bossTemplate.hp,
      isBoss: true,
      enemyType: 'BOSS',
    });
    boss.x = x;
    boss.y = y;
    game.current.enemies.push(boss);
    return [boss];
  };

  const spawnBossAt = (bossId, x, y) => {
    const bossTemplate = BOSS_TYPES[bossId];
    if (!bossTemplate) {
      return null;
    }

    const bosses = spawnBossEncounterAt({
      ...bossTemplate,
      maxHp: bossTemplate.hp,
      isBoss: true,
      enemyType: 'BOSS',
    }, x, y);
    showBossSpotlight(bossTemplate, { prefix: '测试 Boss', duration: 2600 });
    return bosses[0] ?? null;
  };

  const startWave = (waveNumber) => {
    const definition = createWaveDefinition(waveNumber);
    game.current.wave = {
      number: waveNumber,
      queue: [...definition.queue],
      spawnInterval: definition.spawnInterval,
      spawnTimer: 0,
      boss: definition.boss,
      bossSpawned: false,
      awaitingReward: false,
      pendingRewardBossUid: null,
      pendingRewardBossEncounterUid: null,
    };
    setCurrentWave(waveNumber);
    setWaveOverview({ label: definition.label ?? '', focus: definition.focus ?? '' });
    showWaveMessage(
      {
        title: `${UI_COPY.waveIncoming} ${waveNumber}`,
        subtitle: definition.label && definition.focus ? `${definition.label} ｜ ${definition.focus}` : definition.label ?? definition.focus ?? '',
        tone: 'wave',
      },
      2400
    );
  };

  const initGame = (options = {}) => {
    const isDebugMode = Boolean(options.debug);
    const initialCatalog = createInitialTowerCatalog().map((tower) => (isDebugMode ? { ...tower, available: true } : tower));
    const nextDebugOptions = { infiniteMoney: isDebugMode, infiniteHealth: isDebugMode };
    towerCatalogRef.current = initialCatalog;
    setTowerCatalog(initialCatalog);
    game.current = {
      ...createRuntimeState(),
      isMobile: window.innerWidth < 768,
      towerCatalog: initialCatalog,
      mode: isDebugMode ? 'debug' : 'normal',
      debugOptions: nextDebugOptions,
      money: isDebugMode ? 999999 : 20,
    };
    setDebugOptions(nextDebugOptions);
    setMoney(isDebugMode ? '∞' : 20);
    setHealth(100);
    setTime(0);
    setRewardState({ active: false, choices: [] });
    setBossHud([]);
    setWaveOverview(isDebugMode ? { label: '自由测试', focus: '敌人与 Boss 由顶部面板手动拖拽生成' } : { label: '', focus: '' });
    setDragTowerId(null);
    setDragEntity(null);
    setTowerContextMenu(null);
    setCurrentWave(1);
    setGameState('PLAYING');
    if (isDebugMode) {
      showWaveMessage(
        {
          title: '开发测试场已开启',
          subtitle: '无限金钱和无限血量默认开启，可在顶部面板切换',
          tone: 'system',
        },
        2600
      );
      game.current.wave = {
        number: 0,
        queue: [],
        spawnInterval: 999,
        spawnTimer: 0,
        boss: null,
        bossSpawned: true,
        awaitingReward: false,
        pendingRewardBossUid: null,
        pendingRewardBossEncounterUid: null,
      };
    } else {
      startWave(1);
    }
  };

  const evaluatePlacement = (tower, clientX, clientY) => {
    const worldPoint = toWorldPoint(clientX, clientY, game.current.camera, window.innerWidth, window.innerHeight);
    if (!tower) {
      return { worldPoint, canPlace: false, invalidReason: UI_COPY.invalidPlacement };
    }

    if (!game.current.debugOptions.infiniteMoney && game.current.money < tower.cost) {
      return { worldPoint, canPlace: false, invalidReason: UI_COPY.insufficientFunds };
    }

    if (!canPlaceTowerOnField(worldPoint, tower, game.current.player, game.current.towers, game.current.enemies)) {
      return { worldPoint, canPlace: false, invalidReason: UI_COPY.invalidPlacement };
    }

    return { worldPoint, canPlace: true, invalidReason: null };
  };

  const updateDragPlacement = (clientX, clientY, towerOverride) => {
    if (!game.current.dragPlacement.active) {
      return;
    }
    const placementKind = game.current.dragPlacement.kind;
    if (placementKind !== 'tower') {
      const worldPoint = toWorldPoint(clientX, clientY, game.current.camera, window.innerWidth, window.innerHeight);
      game.current.dragPlacement = {
        ...game.current.dragPlacement,
        pointerX: clientX,
        pointerY: clientY,
        worldX: worldPoint.x,
        worldY: worldPoint.y,
        canPlace: true,
        invalidReason: null,
      };
      return;
    }

    const tower = towerOverride ?? getTowerById(game.current.dragPlacement.towerId);
    if (!tower) return;

    const placement = evaluatePlacement(tower, clientX, clientY);
    game.current.dragPlacement = {
      ...game.current.dragPlacement,
      pointerX: clientX,
      pointerY: clientY,
      worldX: placement.worldPoint.x,
      worldY: placement.worldPoint.y,
      canPlace: placement.canPlace,
      invalidReason: placement.invalidReason,
    };
  };

  const clearDragPlacement = () => {
    game.current.dragPlacement = { active: false, kind: 'tower', entityId: null, towerId: null, pointerX: 0, pointerY: 0, worldX: 0, worldY: 0, canPlace: false, invalidReason: null };
    setDragTowerId(null);
    setDragEntity(null);
  };

  const tryBuildDraggedTower = (clientX, clientY) => {
    const cancelRects = [game.current.buildBarRect, game.current.debugPanelRect].filter(Boolean);
    if (
      cancelRects.some(
        (rect) =>
          clientX >= rect.left - DRAG_CANCEL_MARGIN &&
          clientX <= rect.right + DRAG_CANCEL_MARGIN &&
          clientY >= rect.top - DRAG_CANCEL_MARGIN &&
          clientY <= rect.bottom + DRAG_CANCEL_MARGIN
      )
    ) {
      clearDragPlacement();
      return;
    }

    if (game.current.dragPlacement.kind === 'enemy' || game.current.dragPlacement.kind === 'boss') {
      const { worldX, worldY, kind, entityId } = game.current.dragPlacement;
      if (kind === 'boss') {
        spawnBossAt(entityId, worldX, worldY);
      } else {
        spawnEnemyAt(entityId, worldX, worldY, { skipBurrowPosition: true });
      }
      spawnParticle(worldX, worldY, kind === 'boss' ? COLORS.boss : ENEMY_TYPES[entityId]?.color ?? COLORS.danger, kind === 'boss' ? 24 : 12, 70);
      clearDragPlacement();
      return;
    }

    const tower = getTowerById(game.current.dragPlacement.towerId);
    if (!tower) {
      clearDragPlacement();
      return;
    }

    const placement = evaluatePlacement(tower, clientX, clientY);
    if (!placement.canPlace) {
      spawnFloatingText(placement.worldPoint.x, placement.worldPoint.y, placement.invalidReason, COLORS.danger);
      clearDragPlacement();
      return;
    }

    if (!game.current.debugOptions.infiniteMoney) {
      game.current.money -= tower.cost;
    }
    syncHudMoney();
    game.current.towers.push({
      ...cloneTower(tower),
      uid: game.current.nextTowerUid++,
      x: placement.worldPoint.x,
      y: placement.worldPoint.y,
      hp: tower.hp,
      maxHp: tower.hp,
      lastShoot: 0,
    });
    spawnParticle(placement.worldPoint.x, placement.worldPoint.y, tower.color, 15, 60);
    clearDragPlacement();
  };

  const beginTowerDrag = (towerId, clientX, clientY) => {
    if (gameState !== 'PLAYING' || rewardState.active) {
      return;
    }
    const tower = getTowerById(towerId);
    if (!tower || !tower.available) {
      return;
    }

    game.current.dragPlacement = {
      active: true,
      kind: 'tower',
      entityId: null,
      towerId,
      pointerX: clientX,
      pointerY: clientY,
      worldX: 0,
      worldY: 0,
      canPlace: false,
      invalidReason: null,
    };
    setDragTowerId(towerId);
    setDragEntity(null);
    updateDragPlacement(clientX, clientY, tower);
  };

  const beginDebugEntityDrag = (kind, entityId, clientX, clientY) => {
    if (gameState !== 'PLAYING' || game.current.mode !== 'debug') {
      return;
    }

    game.current.dragPlacement = {
      active: true,
      kind,
      entityId,
      towerId: null,
      pointerX: clientX,
      pointerY: clientY,
      worldX: 0,
      worldY: 0,
      canPlace: true,
      invalidReason: null,
    };
    setDragTowerId(null);
    setDragEntity({ kind, id: entityId });
    updateDragPlacement(clientX, clientY);
  };

  const buildRewardChoices = (catalog) => {
    const choices = [];
    const upgrades = shuffle(catalog.filter((tower) => tower.available && tower.level < tower.maxLevel));
    const locked = shuffle(catalog.filter((tower) => !tower.available));

    for (const tower of upgrades.slice(0, 2)) {
      const preview = upgradeTower(tower);
      choices.push({
        id: `upgrade-${tower.id}`,
        type: 'upgrade',
        towerId: tower.id,
        title: `升级 ${tower.name}`,
        subtitle: `Lv.${tower.level + 1} -> Lv.${preview.level + 1}`,
        detail: `${tower.cost} -> ${preview.cost}，${getTowerPreviewSummary(preview)}`,
      });
    }

    if (locked.length > 0) {
      const tower = locked[0];
      choices.push({
        id: `unlock-${tower.id}`,
        type: 'unlock',
        towerId: tower.id,
        title: `解锁 ${tower.name}`,
        subtitle: '加入可建造列表',
        detail: `${tower.summary} ${getTowerPreviewSummary(tower)}`,
      });
    }

    let upgradeIndex = 2;
    let lockedIndex = 1;
    while (choices.length < 3 && upgradeIndex < upgrades.length) {
      const tower = upgrades[upgradeIndex];
      const preview = upgradeTower(tower);
      choices.push({
        id: `upgrade-${tower.id}`,
        type: 'upgrade',
        towerId: tower.id,
        title: `升级 ${tower.name}`,
        subtitle: `Lv.${tower.level + 1} -> Lv.${preview.level + 1}`,
        detail: `${tower.cost} -> ${preview.cost}，${getTowerPreviewSummary(preview)}`,
      });
      upgradeIndex += 1;
    }

    while (choices.length < 3 && lockedIndex < locked.length) {
      const tower = locked[lockedIndex];
      choices.push({
        id: `unlock-${tower.id}`,
        type: 'unlock',
        towerId: tower.id,
        title: `解锁 ${tower.name}`,
        subtitle: '加入可建造列表',
        detail: `${tower.summary} ${getTowerPreviewSummary(tower)}`,
      });
      lockedIndex += 1;
    }

    return choices.slice(0, 3);
  };

  const openBossReward = () => {
    game.current.wave.awaitingReward = true;
    game.current.wave.pendingRewardBossUid = null;
    game.current.wave.pendingRewardBossEncounterUid = null;
    setRewardState({ active: true, choices: buildRewardChoices(towerCatalogRef.current) });
  };

  const applyRewardChoice = (choice) => {
    const nextCatalog = towerCatalogRef.current.map((tower) => {
      if (tower.id !== choice.towerId) {
        return tower;
      }
      if (choice.type === 'unlock') {
        return { ...tower, available: true };
      }
      return upgradeTower(tower);
    });

    towerCatalogRef.current = nextCatalog;
    setTowerCatalog(nextCatalog);
    setRewardState({ active: false, choices: [] });
    startWave(currentWave + 1);
  };

  const setDebugOption = (key, value) => {
    const nextOptions = { ...game.current.debugOptions, [key]: value };
    game.current.debugOptions = nextOptions;
    setDebugOptions(nextOptions);
    if (key === 'infiniteMoney' && value) {
      game.current.money = 999999;
    } else if (key === 'infiniteMoney' && !value && game.current.money > 99999) {
      game.current.money = 200;
    }
    if (key === 'infiniteHealth' && value) {
      game.current.player.hp = game.current.player.maxHp;
    }
    syncHudMoney();
    syncHudHealth();
  };

  const changeTowerBlueprintLevel = (towerId, delta) => {
    const nextCatalog = towerCatalogRef.current.map((tower) => {
      if (tower.id !== towerId) return tower;
      return buildTowerAtLevel(tower, (tower.level ?? 0) + delta);
    });
    towerCatalogRef.current = nextCatalog;
    setTowerCatalog(nextCatalog);
  };

  const changePlacedTowerLevel = (towerUid, delta) => {
    const tower = game.current.towers.find((candidate) => candidate.uid === towerUid);
    if (!tower) return;
    const nextTower = buildTowerAtLevel(tower, (tower.level ?? 0) + delta);
    Object.assign(tower, nextTower, {
      uid: tower.uid,
      x: tower.x,
      y: tower.y,
      hp: Math.min(nextTower.hp, Math.max(1, tower.hp + (nextTower.hp - tower.maxHp))),
      maxHp: nextTower.hp,
      lastShoot: tower.lastShoot,
    });
  };

  const openBlueprintContextMenu = (towerId, clientX, clientY) => {
    setTowerContextMenu({ type: 'blueprint', towerId, x: clientX, y: clientY });
  };

  const applyTowerContextAction = (delta) => {
    if (!towerContextMenu) return;
    if (towerContextMenu.type === 'blueprint') {
      changeTowerBlueprintLevel(towerContextMenu.towerId, delta);
    } else {
      changePlacedTowerLevel(towerContextMenu.towerUid, delta);
    }
    setTowerContextMenu(null);
  };

  const getTowerFireRateFactor = (tower) => {
    let factor = tower.frozenTimer > 0 ? 999 : 1;
    for (const enemy of game.current.enemies) {
      if (enemy.jamAura && dist(enemy, tower) <= enemy.jamAura.range) {
        factor = Math.max(factor, enemy.jamAura.fireRateFactor);
      }
    }
    return factor;
  };

  const damageTarget = (target, amount) => {
    if (target === game.current.player && game.current.debugOptions.infiniteHealth) {
      return;
    }
    target.hp -= amount;
  };

  const damageEnemy = (enemy, amount) => {
    const phaseMultiplier = enemy.phased ? enemy.phase?.damageMultiplier ?? 0.25 : 1;
    const armorMultiplier = enemy.armoredTimer > 0 ? 0.65 : 1;
    let remainingDamage = amount * phaseMultiplier * armorMultiplier;

    if (enemy.shield > 0) {
      const shieldDamage = Math.min(enemy.shield, remainingDamage);
      enemy.shield -= shieldDamage;
      remainingDamage -= shieldDamage;
    }

    if (remainingDamage > 0) {
      enemy.hp -= remainingDamage;
    }
  };

  const damageArea = (x, y, radius, amount, options = {}) => {
    if (dist({ x, y }, game.current.player) <= radius + game.current.player.radius) {
      damageTarget(game.current.player, amount);
      syncHudHealth();
    }

    for (const tower of game.current.towers) {
      if (dist({ x, y }, tower) <= radius + tower.radius) {
        damageTarget(tower, amount * (options.towerFactor ?? 1));
      }
    }

    spawnImpactWave(x, y, { maxRadius: radius, growth: 360, life: 0.26, color: options.color ?? COLORS.danger, lineWidth: 4, fillAlpha: 0.12 });
  };

  const spawnAround = (source, enemyKey, count, radius = 46, options = {}) => {
    const enemyTemplate = ENEMY_TYPES[enemyKey];
    if (!enemyTemplate) return 0;

    let remaining = count;
    if (options.ownerBossUid && options.maxActive) {
      const activeCount = getBossOwnedSummonCount(options.ownerBossUid, options.summonCategory ?? enemyKey);
      remaining = Math.max(0, Math.min(count, options.maxActive - activeCount));
    }

    let spawned = 0;
    for (let index = 0; index < remaining; index += 1) {
      const position = findOpenEnemySpawnPosition(source, enemyTemplate, radius + index * 6);
      spawnEnemyAt(enemyKey, position.x, position.y, {
        skipBurrowPosition: true,
        summonedByBossUid: options.ownerBossUid ?? null,
        summonedByEncounterUid: options.ownerEncounterUid ?? null,
        summonCategory: options.summonCategory ?? (options.ownerBossUid ? enemyKey : null),
      });
      spawned += 1;
    }

    return spawned;
  };

  const queueLineHazard = (source, target, options = {}) => {
    const angle = Math.atan2(target.y - source.y, target.x - source.x);
    const length = options.length ?? 620;
    game.current.hazards.push({
      type: 'line',
      x: source.x,
      y: source.y,
      x2: source.x + Math.cos(angle) * length,
      y2: source.y + Math.sin(angle) * length,
      width: options.width ?? 18,
      damage: options.damage ?? 26,
      timer: options.delay ?? 0.8,
      maxTimer: options.delay ?? 0.8,
      color: options.color ?? COLORS.towerRail,
      label: options.label,
      ownerBossUid: options.ownerBossUid ?? null,
      ownerEncounterUid: options.ownerEncounterUid ?? null,
    });
  };

  const queueAreaHazard = (x, y, options = {}) => {
    game.current.hazards.push({
      type: 'area',
      x,
      y,
      radius: options.radius ?? 90,
      damage: options.damage ?? 18,
      slowRatio: options.slowRatio,
      slowDuration: options.slowDuration,
      pull: options.pull ?? 0,
      timer: options.delay ?? 0.9,
      maxTimer: options.delay ?? 0.9,
      color: options.color ?? COLORS.danger,
      label: options.label,
      pulsesRemaining: options.pulses ?? 1,
      pulseInterval: options.pulseInterval ?? Math.max(0.35, (options.delay ?? 0.9) * 0.7),
      radiusStep: options.radiusStep ?? 0,
      damageStep: options.damageStep ?? 0,
      ownerBossUid: options.ownerBossUid ?? null,
      ownerEncounterUid: options.ownerEncounterUid ?? null,
    });
  };

  const chooseBossTarget = (boss) => {
    let target = game.current.player;
    let targetDistance = dist(boss, target);
    for (const tower of game.current.towers) {
      const towerDistance = dist(boss, tower);
      if (towerDistance < targetDistance) {
        target = tower;
        targetDistance = towerDistance;
      }
    }
    return target;
  };

  const runBossAbility = (boss, abilityName) => {
    const target = chooseBossTarget(boss);
    const ownership = getBossOwnership(boss);
    const isClimaxPhase = boss.currentPhaseIndex === boss.phases.length - 1;
    const primeBossAbility = (abilityId, cooldown) => {
      if (!boss.phases?.[boss.currentPhaseIndex]?.abilities?.includes(abilityId)) return;
      const current = boss.abilityCooldowns[abilityId];
      boss.abilityCooldowns[abilityId] = current == null ? cooldown : Math.min(current, cooldown);
    };
    if (abilityName === 'summonFormation') spawnAround(boss, 'BASIC', 4, boss.radius + 32, { ownerBossUid: boss.uid, summonCategory: 'formation', maxActive: 8 });
    if (abilityName === 'commandLine') {
      const angle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      for (let index = -1; index <= 1; index += 1) {
        const offsetX = Math.cos(angle + Math.PI / 2) * index * 42;
        const offsetY = Math.sin(angle + Math.PI / 2) * index * 42;
        queueLineHazard(
          { x: boss.x + offsetX, y: boss.y + offsetY },
          { x: game.current.player.x + offsetX * 0.4, y: game.current.player.y + offsetY * 0.4 },
          { width: 12, damage: 16, color: COLORS.enemyBasic, delay: 0.7, length: 520, label: 'formation', ...ownership }
        );
      }
    }
    if (abilityName === 'shieldPulse') {
      for (const enemy of game.current.enemies) {
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
      const angle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      boss.dashTimer = 0.4;
      boss.dashVx = Math.cos(angle) * 460;
      boss.dashVy = Math.sin(angle) * 460;
      queueLineHazard(boss, game.current.player, { width: 18, damage: 22, color: COLORS.enemyBasic, delay: 0.5, length: 420, label: 'charge', ...ownership });
      spawnImpactWave(boss.x, boss.y, { maxRadius: 58, color: COLORS.enemyBasic, fillAlpha: 0.1 });
    }
    if (abilityName === 'dashAtPlayer') {
      const angle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      boss.dashTimer = 0.42;
      boss.dashVx = Math.cos(angle) * 560;
      boss.dashVy = Math.sin(angle) * 560;
      spawnImpactWave(boss.x, boss.y, { maxRadius: 44, color: boss.color, life: 0.18 });
    }
    if (abilityName === 'markPrey') {
      queueLineHazard(boss, game.current.player, { width: 10, damage: 14, color: COLORS.enemyFast, delay: 0.45, length: 360, label: 'mark', ...ownership });
      queueAreaHazard(game.current.player.x, game.current.player.y, {
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
        const angle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x) + side * 0.6;
        queueLineHazard(
          { x: boss.x + Math.cos(angle) * 20, y: boss.y + Math.sin(angle) * 20 },
          { x: game.current.player.x + Math.cos(angle) * 110, y: game.current.player.y + Math.sin(angle) * 90 },
          { width: 10, damage: 16, color: COLORS.enemyFast, delay: 0.55, length: 460, label: 'slash', ...ownership }
        );
      }
      spawnAround(boss, 'SCOUT', 2, boss.radius + 34, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'pincerScout', maxActive: 6 });
    }
    if (abilityName === 'feintStrike') {
      const retreatAngle = Math.atan2(boss.y - game.current.player.y, boss.x - game.current.player.x);
      boss.x = game.current.player.x + Math.cos(retreatAngle) * 180;
      boss.y = game.current.player.y + Math.sin(retreatAngle) * 140;
      queueLineHazard(boss, game.current.player, { width: 14, damage: 20, color: COLORS.enemyFast, delay: 0.38, length: 300, label: 'charge', ...ownership });
      spawnImpactWave(boss.x, boss.y, { maxRadius: 50, color: COLORS.enemyFast, fillAlpha: 0.1 });
    }
    if (abilityName === 'afterimageBurst') spawnAround(boss, 'PHASE', 3, boss.radius + 42, { ownerBossUid: boss.uid, summonCategory: 'afterimage', maxActive: 6 });
    if (abilityName === 'summonSiege') spawnAround(boss, 'SIEGE', 2, boss.radius + 46, { ownerBossUid: boss.uid, summonCategory: 'siege', maxActive: 5 });
    if (abilityName === 'bastionMortar') {
      const priorityTargets = [...game.current.towers.slice(0, 2), game.current.player].filter(Boolean);
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
      const baseAngle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
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
      queueLineHazard(boss, game.current.player, { width: 16, damage: 22, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
      queueLineHazard({ x: boss.x, y: boss.y }, { x: boss.x + 120, y: boss.y - 260 }, { width: 14, damage: 18, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
      queueLineHazard({ x: boss.x, y: boss.y }, { x: boss.x - 140, y: boss.y - 240 }, { width: 14, damage: 18, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
    }
    if (abilityName === 'mirrorStep') {
      const oldX = boss.x;
      const oldY = boss.y;
      boss.x = game.current.player.x + rand(-180, 180);
      boss.y = game.current.player.y + rand(-120, 120);
      queueLineHazard({ x: oldX, y: oldY }, boss, { width: 12, damage: 18, color: COLORS.enemyPhase, delay: 0.52, length: Math.hypot(boss.x - oldX, boss.y - oldY), label: 'mirror', ...ownership });
      spawnAround(boss, 'PHASE', 1, boss.radius + 28, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'mirrorStep', maxActive: 3 });
      spawnImpactWave(boss.x, boss.y, { maxRadius: 62, color: COLORS.enemyPhase, fillAlpha: 0.1 });
    }
    if (abilityName === 'spawnHive') spawnAround(boss, 'BEACON', 2, boss.radius + 50, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'hive', maxActive: 4 });
    if (abilityName === 'broodShift') {
      const beacons = game.current.enemies.filter((enemy) => enemy.id === 'BEACON' && enemy.summonedByBossUid === boss.uid);
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
      const beacons = game.current.enemies.filter((enemy) => enemy.id === 'BEACON' && enemy.summonedByBossUid === boss.uid);
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
        for (const enemy of game.current.enemies) {
          if (!enemy.isBoss && dist(enemy, anchor) <= 110) {
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + 12);
          }
        }
      }
    }
    if (abilityName === 'summonSwarm') spawnAround(boss, 'SHARD', 5, boss.radius + 45, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'swarm', maxActive: 10 });
    if (abilityName === 'hiveCollapse') {
      const beacons = game.current.enemies.filter((enemy) => enemy.id === 'BEACON' && enemy.summonedByBossUid === boss.uid);
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
      for (const enemy of game.current.enemies) {
        if (enemy !== boss && dist(enemy, boss) <= 180) {
          enemy.slowRatio = Math.min(enemy.slowRatio, 0.72);
          enemy.slowTimer = Math.max(enemy.slowTimer, 2.5);
        }
      }
      damageArea(boss.x, boss.y, 150, 8, { color: COLORS.towerFrost, towerFactor: 0.4 });
    }
    if (abilityName === 'whiteout') {
      for (let index = 0; index < 3; index += 1) {
        queueAreaHazard(game.current.player.x + rand(-120, 120), game.current.player.y + rand(-90, 90), {
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
      const tower = game.current.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, boss) < dist(nearest, boss) ? candidate : nearest), null);
      if (tower) {
        tower.frozenTimer = 3.5;
        spawnImpactWave(tower.x, tower.y, { maxRadius: tower.radius + 24, color: COLORS.towerFrost, fillAlpha: 0.16 });
      }
    }
    if (abilityName === 'glacialPrison') {
      const focus = game.current.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, game.current.player) < dist(nearest, game.current.player) ? candidate : nearest), null) ?? game.current.player;
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
      const targets = [...game.current.towers.slice(0, 3), game.current.player];
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
      queueLineHazard({ x: game.current.player.x - 260, y: game.current.player.y }, { x: game.current.player.x + 260, y: game.current.player.y }, { width: 10, damage: 16, color: COLORS.towerRail, delay: 0.7, length: 520, label: 'crosshair', ...ownership });
      queueLineHazard({ x: game.current.player.x, y: game.current.player.y - 220 }, { x: game.current.player.x, y: game.current.player.y + 220 }, { width: 10, damage: 16, color: COLORS.towerRail, delay: 0.82, length: 440, label: 'crosshair', ...ownership });
    }
    if (abilityName === 'markTower') {
      const tower = game.current.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, boss) < dist(nearest, boss) ? candidate : nearest), null);
      if (tower) queueLineHazard(boss, tower, { width: 12, damage: 28, color: COLORS.towerRail, delay: 0.55, label: 'mark', ...ownership });
    }
    if (abilityName === 'suppressiveGrid') {
      const anchors = game.current.towers.slice(0, 2);
      anchors.forEach((tower, index) => {
        queueLineHazard({ x: tower.x - 180, y: tower.y }, { x: tower.x + 180, y: tower.y }, { width: 9, damage: 14, color: COLORS.towerRail, delay: 0.68 + index * 0.08, length: 360, label: 'grid', ...ownership });
        queueLineHazard({ x: tower.x, y: tower.y - 180 }, { x: tower.x, y: tower.y + 180 }, { width: 9, damage: 14, color: COLORS.towerRail, delay: 0.76 + index * 0.08, length: 360, label: 'grid', ...ownership });
      });
    }
    if (abilityName === 'overload') {
      boss.hp -= Math.min(24, boss.hp - 1);
      queueLineHazard(boss, game.current.player, { width: 20, damage: 38, color: COLORS.towerRail, delay: 0.45, label: 'overload', ...ownership });
    }
    if (abilityName === 'killLane') {
      const angle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      for (const offset of [-0.18, 0.18]) {
        queueLineHazard(
          { x: boss.x + Math.cos(angle + Math.PI / 2) * offset * 180, y: boss.y + Math.sin(angle + Math.PI / 2) * offset * 180 },
          game.current.player,
          { width: 14, damage: 24, color: COLORS.towerRail, delay: 0.75, length: 720, label: 'crosshair', ...ownership }
        );
      }
    }
    if (abilityName === 'stealMoney') {
      if (!game.current.debugOptions.infiniteMoney) {
        const stolen = Math.min(game.current.money, 12);
        game.current.money -= stolen;
        syncHudMoney();
        spawnFloatingText(boss.x, boss.y - boss.radius - 8, `-${stolen}`, COLORS.enemyScout);
      }
    }
    if (abilityName === 'taxBeacon') {
      queueAreaHazard(game.current.player.x, game.current.player.y, {
        radius: 82,
        damage: 8,
        delay: 0.75,
        pulses: 2,
        pulseInterval: 0.5,
        color: COLORS.enemyScout,
        label: 'coin',
        ...ownership,
      });
      if (!game.current.debugOptions.infiniteMoney) {
        const stolen = Math.min(game.current.money, 8);
        game.current.money -= stolen;
        syncHudMoney();
      }
    }
    if (abilityName === 'paydaySweep') {
      for (const side of [-1, 1]) {
        queueLineHazard(
          { x: game.current.player.x + side * 220, y: game.current.player.y - 120 },
          { x: game.current.player.x - side * 220, y: game.current.player.y + 120 },
          { width: 10, damage: 14, color: COLORS.enemyScout, delay: 0.68, length: Math.hypot(440, 240), label: 'coinline', ...ownership }
        );
      }
      spawnAround(boss, 'SCOUT', 2, boss.radius + 34, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'paydayScout', maxActive: 6 });
    }
    if (abilityName === 'ransomBurst') spawnAround(boss, 'SCOUT', 5, boss.radius + 42, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'ransom', maxActive: 8 });
    if (abilityName === 'repossess') {
      const tower = game.current.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, boss) < dist(nearest, boss) ? candidate : nearest), null);
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
      if (!game.current.debugOptions.infiniteMoney) {
        const stolen = Math.min(game.current.money, 18);
        game.current.money -= stolen;
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
      queueLineHazard({ x: boss.x - boss.radius * 0.6, y: boss.y }, game.current.player, { width: 11, damage: 16, color: COLORS.enemyPhase, delay: 0.5, label: 'moonbolt', ownerBossUid: boss.uid });
      queueLineHazard({ x: boss.x + boss.radius * 0.6, y: boss.y }, target, { width: 11, damage: 16, color: COLORS.enemyScout, delay: 0.7, label: 'sunbolt', ownerBossUid: boss.uid });
    }
    if (abilityName === 'twinSwap') {
      const angle = Math.random() * Math.PI * 2;
      boss.x = game.current.player.x + Math.cos(angle) * 170;
      boss.y = game.current.player.y + Math.sin(angle) * 170;
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
      const angle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      boss.dashTimer = 0.34;
      boss.dashVx = Math.cos(angle) * 620;
      boss.dashVy = Math.sin(angle) * 620;
      queueLineHazard(boss, game.current.player, { width: 12, damage: 14, color: boss.color, delay: 0.42, length: 420, label: 'solar', ...ownership });
      spawnImpactWave(boss.x, boss.y, { maxRadius: 52, color: boss.color, fillAlpha: 0.12 });
    }
    if (abilityName === 'flareLance') {
      const baseAngle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      for (const offset of [-0.2, 0, 0.2]) {
        queueLineHazard(
          boss,
          { x: boss.x + Math.cos(baseAngle + offset) * 240, y: boss.y + Math.sin(baseAngle + offset) * 240 },
          { width: offset === 0 ? 16 : 12, damage: offset === 0 ? 22 : 16, color: boss.color, delay: 0.6, length: 640, label: 'flare', ...ownership }
        );
      }
    }
    if (abilityName === 'lunarSnare') {
      queueAreaHazard(game.current.player.x, game.current.player.y, {
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
      queueLineHazard(boss, game.current.player, { width: 12, damage: 18, color: boss.color, delay: 0.55, length: 520, label: 'shadow', ...ownership });
      queueAreaHazard(game.current.player.x + rand(-80, 80), game.current.player.y + rand(-80, 80), {
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
        queueLineHazard(boss, { x: game.current.player.x + 90, y: game.current.player.y - 24 }, { width: 12, damage: 18, color: boss.color, delay: 0.62, length: 640, label: 'crossfire', ...ownership });
        queueLineHazard(partner, { x: game.current.player.x - 90, y: game.current.player.y + 24 }, { width: 12, damage: 18, color: partner.color, delay: 0.62, length: 640, label: 'crossfire', ...getBossOwnership(partner) });
        spawnImpactWave(game.current.player.x, game.current.player.y, { maxRadius: 88, color: COLORS.boss, fillAlpha: 0.06 });
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
          queueAreaHazard(game.current.player.x, game.current.player.y, {
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
      queueLineHazard(boss, game.current.player, { width: 24, damage: 26, color: COLORS.enemyBomber, delay: 0.75, length: 720, label: 'breath', ...ownership });
      queueLineHazard(boss, { x: game.current.player.x + 120, y: game.current.player.y + 40 }, { width: 16, damage: 18, color: COLORS.enemyBomber, delay: 0.85, length: 680, label: 'breath', ...ownership });
      queueLineHazard(boss, { x: game.current.player.x - 120, y: game.current.player.y - 40 }, { width: 16, damage: 18, color: COLORS.enemyBomber, delay: 0.85, length: 680, label: 'breath', ...ownership });
    }
    if (abilityName === 'dragonStrafe') {
      boss.bossState.strafeSide = boss.bossState.strafeSide === 'left' ? 'right' : 'left';
      const side = boss.bossState.strafeSide === 'left' ? -1 : 1;
      const baseAngle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      for (const offset of [-0.28, 0, 0.28]) {
        queueLineHazard(
          { x: boss.x + Math.cos(baseAngle + Math.PI / 2 * side) * 34, y: boss.y + Math.sin(baseAngle + Math.PI / 2 * side) * 34 },
          { x: game.current.player.x + Math.cos(baseAngle + offset) * 180, y: game.current.player.y + Math.sin(baseAngle + offset) * 180 },
          { width: offset === 0 ? 18 : 12, damage: offset === 0 ? 24 : 16, color: COLORS.enemyBomber, delay: 0.7, length: 760, label: 'strafe', ...ownership }
        );
      }
    }
    if (abilityName === 'emberWake') {
      for (let index = 0; index < 3; index += 1) {
        const angle = boss.bossState.strafeSide === 'left' ? Math.PI * 0.75 - index * 0.26 : Math.PI * 0.25 + index * 0.26;
        queueAreaHazard(game.current.player.x + Math.cos(angle) * 110, game.current.player.y + Math.sin(angle) * 80, {
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
      pushTarget(game.current.player, 42);
      for (const tower of game.current.towers) {
        if (dist(tower, boss) <= 210) pushTarget(tower, 24);
      }
      spawnImpactWave(boss.x, boss.y, { maxRadius: 170, color: COLORS.enemyBomber, fillAlpha: 0.1 });
    }
    if (abilityName === 'meteorRain') {
      for (let index = 0; index < 6; index += 1) {
        queueAreaHazard(game.current.player.x + rand(-200, 200), game.current.player.y + rand(-160, 160), {
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
      boss.x = game.current.player.x + Math.cos(angle) * 140;
      boss.y = game.current.player.y + Math.sin(angle) * 120;
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
        spawnImpactWave(game.current.player.x, game.current.player.y, {
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
          rotation: Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x),
        });
      }
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6;
        queueAreaHazard(game.current.player.x + Math.cos(angle) * 140, game.current.player.y + Math.sin(angle) * 110, {
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
      queueAreaHazard(game.current.player.x, game.current.player.y, {
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
        queueAreaHazard(game.current.player.x + rand(-120, 120), game.current.player.y + rand(-90, 90), {
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
        const x = game.current.player.x + Math.cos(angle) * 118;
        const y = game.current.player.y + Math.sin(angle) * 84;
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
        queueAreaHazard(game.current.player.x, game.current.player.y, {
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
      queueAreaHazard(game.current.player.x, game.current.player.y, {
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
        queueAreaHazard(game.current.player.x + Math.cos(angle) * 120, game.current.player.y + Math.sin(angle) * 88, {
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
        const source = { x: game.current.player.x + Math.cos(angle) * 180, y: game.current.player.y + Math.sin(angle) * 140 };
        queueLineHazard(source, game.current.player, { width: 12, damage: 18, color: COLORS.enemyJammer, delay: 0.72, length: Math.hypot(source.x - game.current.player.x, source.y - game.current.player.y), label: 'lock', ...ownership });
      }
    }
    if (abilityName === 'singularity') {
      for (const tower of game.current.towers) {
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
      for (let index = game.current.enemies.length - 1; index >= 0; index -= 1) {
        const enemy = game.current.enemies[index];
        if (enemy !== boss && !enemy.isBoss && dist(enemy, boss) <= 180 && sacrificed < 4) {
          game.current.enemies.splice(index, 1);
          sacrificed += 1;
        }
      }
      boss.hp = Math.min(boss.maxHp, boss.hp + sacrificed * 28);
      boss.shield = Math.max(boss.shield ?? 0, sacrificed * 24);
      damageArea(boss.x, boss.y, 95 + sacrificed * 18, 10 + sacrificed * 4, { color: COLORS.enemySiege, towerFactor: 1.3 });
    }
    if (abilityName === 'brandLine') {
      queueLineHazard(boss, game.current.player, { width: 14, damage: 20, color: COLORS.enemySiege, delay: 0.58, length: 520, label: 'brand', ...ownership });
      queueAreaHazard(game.current.player.x, game.current.player.y, {
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
      const forgeGuards = game.current.enemies.filter((enemy) => enemy.summonedByBossUid === boss.uid && enemy.summonCategory === 'forgeGuard');
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
      queueLineHazard(boss, game.current.player, { width: 12, damage: 18, color: COLORS.towerRail, delay: 0.45, label: 'tempo', ...ownership });
      queueLineHazard({ x: boss.x - 90, y: boss.y - 80 }, { x: boss.x + 180, y: boss.y + 120 }, { width: 10, damage: 15, color: COLORS.towerRail, delay: 0.75, length: 560, label: 'tempo', ...ownership });
    }
    if (abilityName === 'pulseMeasure') {
      for (let index = 0; index < 4; index += 1) {
        queueAreaHazard(game.current.player.x + rand(-150, 150), game.current.player.y + rand(-110, 110), {
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
      for (const tower of game.current.towers) {
        if (dist(tower, boss) <= 260) tower.frozenTimer = Math.max(tower.frozenTimer ?? 0, 1.6);
      }
      spawnAround(boss, 'FAST', 4, boss.radius + 45, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'tempoRunner', maxActive: 8 });
    }
    if (abilityName === 'syncopate') {
      for (let index = 0; index < 3; index += 1) {
        const delay = 0.42 + index * 0.18;
        queueLineHazard(
          { x: game.current.player.x - 220, y: game.current.player.y - 70 + index * 70 },
          { x: game.current.player.x + 220, y: game.current.player.y - 70 + index * 70 },
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
        queueAreaHazard(game.current.player.x, game.current.player.y, {
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
      queueAreaHazard(game.current.player.x, game.current.player.y, { radius: 95, damage: 8, slowRatio: 0.65, slowDuration: 2.2, delay: 0.75, color: COLORS.enemyShield, label: 'wall', ...ownership });
    }
    if (abilityName === 'corridorClamp') {
      queueLineHazard({ x: game.current.player.x - 240, y: game.current.player.y - 110 }, { x: game.current.player.x - 240, y: game.current.player.y + 110 }, { width: 12, damage: 14, color: COLORS.enemyShield, delay: 0.72, length: 220, label: 'gate', ...ownership });
      queueLineHazard({ x: game.current.player.x + 240, y: game.current.player.y - 110 }, { x: game.current.player.x + 240, y: game.current.player.y + 110 }, { width: 12, damage: 14, color: COLORS.enemyShield, delay: 0.72, length: 220, label: 'gate', ...ownership });
    }
    if (abilityName === 'gateSwap') {
      const oldX = boss.x;
      const oldY = boss.y;
      boss.x = game.current.player.x + rand(-210, 210);
      boss.y = game.current.player.y + rand(-160, 160);
      queueLineHazard({ x: oldX, y: oldY }, boss, { width: 18, damage: 20, color: COLORS.enemyShield, delay: 0.6, label: 'gate', ...ownership });
    }
    if (abilityName === 'mazeFold') {
      for (const tower of game.current.towers.slice(0, 2)) {
        queueLineHazard({ x: tower.x - 160, y: tower.y }, { x: tower.x + 160, y: tower.y }, { width: 10, damage: 16, color: COLORS.enemyShield, delay: 0.68, length: 320, label: 'maze', ...ownership });
      }
      queueAreaHazard(game.current.player.x, game.current.player.y, { radius: 84, damage: 12, delay: 0.82, color: COLORS.enemyShield, label: 'wall', ...ownership });
    }
    if (abilityName === 'mazeCrush') {
      for (const tower of game.current.towers.slice(0, 4)) {
        queueAreaHazard(tower.x, tower.y, { radius: 72, damage: 24, delay: 0.7, color: COLORS.enemyShield, label: 'wall', ...ownership });
      }
      queueAreaHazard(game.current.player.x, game.current.player.y, { radius: 88, damage: 18, delay: 0.8, color: COLORS.enemyShield, label: 'wall', ...ownership });
    }
    if (abilityName === 'deadEnd') {
      for (let index = 0; index < 4; index += 1) {
        const angle = (Math.PI * 2 * index) / 4;
        queueAreaHazard(game.current.player.x + Math.cos(angle) * 120, game.current.player.y + Math.sin(angle) * 90, {
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
          { x: game.current.player.x + rand(-110, 110), y: game.current.player.y + rand(-90, 90) },
          { width: 10, damage: 12, color: COLORS.enemyMedic, delay: 0.6 + index * 0.08, length: 420, label: 'vine', ...ownership }
        );
      }
    }
    if (abilityName === 'poisonBloom') queueAreaHazard(game.current.player.x, game.current.player.y, { radius: 110, damage: 14, slowRatio: 0.7, slowDuration: 2, delay: 0.75, color: COLORS.enemyMedic, label: 'poison', ...ownership });
    if (abilityName === 'sporeBurst') {
      for (let index = 0; index < 4; index += 1) {
        const angle = (Math.PI * 2 * index) / 4;
        queueAreaHazard(game.current.player.x + Math.cos(angle) * 90, game.current.player.y + Math.sin(angle) * 80, {
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
      for (const enemy of game.current.enemies) {
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

  const enrageEncounterPartner = (defeatedBoss) => {
    const partner = getEncounterPartner(defeatedBoss);
    if (!partner || partner.bossState.partnerFallen) {
      return;
    }

    partner.bossState.partnerFallen = true;
    partner.baseSpeed *= 1.16;
    partner.damage = Math.round(partner.damage * 1.22);
    partner.shield = Math.max(partner.shield ?? 0, 80);
    partner.maxShield = Math.max(partner.maxShield ?? 0, partner.shield);
    spawnImpactWave(partner.x, partner.y, { maxRadius: partner.radius + 44, color: partner.color, fillAlpha: 0.14 });
    spawnFloatingText(partner.x, partner.y - partner.radius - 16, '狂怒', partner.color);
  };

  const updateBossBehavior = (boss, dt) => {
    const hpRatio = boss.hp / boss.maxHp;
    boss.bossState.climaxAccentTimer = Math.max(0, (boss.bossState.climaxAccentTimer ?? 0) - dt);
    const previousPhaseIndex = boss.currentPhaseIndex ?? -1;
    let activePhaseIndex = 0;
    for (let index = 0; index < boss.phases.length; index += 1) {
      if (hpRatio <= boss.phases[index].hpBelow) {
        activePhaseIndex = index;
      }
    }
    const activePhase = boss.phases[activePhaseIndex];

    if (boss.currentPhaseIndex !== activePhaseIndex) {
      boss.currentPhaseIndex = activePhaseIndex;
      triggerBossPhaseShift(boss, activePhase, activePhaseIndex, previousPhaseIndex);
      boss.bossState.climaxAccentTimer = 0.35;
    }

    if (activePhaseIndex === boss.phases.length - 1 && boss.bossState.climaxAccentTimer <= 0) {
      triggerBossClimaxAccent(boss);
      boss.bossState.climaxAccentTimer = boss.form === 'dragon' ? 0.44 : boss.form === 'astrolabe' ? 0.56 : 0.62;
    }

    for (const abilityName of activePhase.abilities) {
      boss.abilityCooldowns[abilityName] = Math.max(0, (boss.abilityCooldowns[abilityName] ?? 0) - dt);
      const cooldown = {
        summonFormation: 6,
        commandLine: 5.8,
        shieldPulse: 8,
        phalanxAdvance: 8.5,
        commandRush: 7.2,
        dashAtPlayer: 4.5,
        markPrey: 5.2,
        summonScouts: 7,
        pincerRush: 6.8,
        feintStrike: 8.2,
        afterimageBurst: 9,
        summonSiege: 7.5,
        bastionMortar: 6.8,
        fortify: 10,
        shockRam: 8,
        quake: 8,
        bunkerRing: 10.5,
        prismBeam: 4.2,
        refractVolley: 6.2,
        mirrorSummon: 8,
        prismLattice: 8.8,
        tripleBeam: 7,
        mirrorStep: 8.4,
        spawnHive: 8,
        broodShift: 7.5,
        hiveHeal: 9,
        hivePulse: 7.2,
        summonSwarm: 7,
        hiveCollapse: 10.2,
        frostRing: 5.8,
        whiteout: 6.8,
        freezeTower: 8.5,
        glacialPrison: 8.8,
        summonFrostGuards: 9,
        coldSnap: 10.4,
        railShot: 4,
        crosshairBarrage: 6.5,
        markTower: 7,
        suppressiveGrid: 8.6,
        overload: 6,
        killLane: 9.2,
        stealMoney: 5,
        taxBeacon: 6.5,
        paydaySweep: 7.8,
        ransomBurst: 8,
        repossess: 9,
        twinOrbit: 9,
        twinBolt: 3.8,
        twinSwap: 7,
        eclipsePulse: 8,
        solarDash: 4.6,
        flareLance: 7.5,
        lunarSnare: 5.8,
        shadowArc: 7.2,
        twinCrossfire: 9,
        dragonStrafe: 5.2,
        emberWake: 6.2,
        wingBuffet: 7.4,
        dragonBreath: 4.8,
        tailSweep: 6,
        meteorRain: 9,
        skyDive: 8.5,
        infernoRing: 10.2,
        webTrap: 4.5,
        silkVolley: 6.4,
        spawnSpiderlings: 7,
        broodAmbush: 8.2,
        webField: 9,
        nestBloom: 10,
        gravityWell: 5.5,
        starfall: 6.5,
        orbitalShots: 6.5,
        orbitalLock: 8.4,
        singularity: 10,
        eventHorizon: 9.8,
        forgeArmor: 8,
        slagDrop: 6.6,
        sacrificeMinions: 9,
        brandLine: 7.4,
        moltenBurst: 10,
        forgeDetonation: 9.6,
        conductLines: 4,
        pulseMeasure: 5.5,
        tempoShift: 7,
        syncopate: 7.8,
        finale: 10,
        crescendo: 10.5,
        raiseWalls: 7,
        corridorClamp: 6.8,
        gateSwap: 8,
        mazeFold: 8.2,
        mazeCrush: 10,
        deadEnd: 10.2,
        seedPods: 6,
        blightRoots: 6.2,
        poisonBloom: 5.5,
        sporeBurst: 7.5,
        gardenWake: 9,
        creepingCanopy: 10.2,
      }[abilityName] ?? 6;

      if (boss.abilityCooldowns[abilityName] <= 0) {
        runBossAbility(boss, abilityName);
        boss.abilityCooldowns[abilityName] = cooldown;
      }
    }
  };

  const update = (dt) => {
    const state = game.current;
    state.gameTime += dt;
    state.camera.shakeTimer = Math.max(0, (state.camera.shakeTimer ?? 0) - dt);
    if (state.camera.shakeTimer <= 0) {
      state.camera.shakeStrength = 0;
      state.camera.shakeDuration = 0;
    }

    if (Math.floor(state.gameTime) > time) {
      setTime(Math.floor(state.gameTime));
    }

    if (rewardState.active) {
      return;
    }

    let dx = 0;
    let dy = 0;
    if (state.keys.w) dy -= 1;
    if (state.keys.s) dy += 1;
    if (state.keys.a) dx -= 1;
    if (state.keys.d) dx += 1;
    if (state.joystick.active) {
      dx = state.joystick.dirX;
      dy = state.joystick.dirY;
    }

    const movementLength = Math.hypot(dx, dy);
    if (movementLength > 0 && !state.joystick.active) {
      dx /= movementLength;
      dy /= movementLength;
    }

    state.player.x += dx * state.player.speed * dt;
    state.player.y += dy * state.player.speed * dt;
    state.camera.x += (state.player.x - state.camera.x) * 5 * dt;
    state.camera.y += (state.player.y - state.camera.y) * 5 * dt;

    state.player.lastShoot += dt;
    if (state.player.lastShoot >= state.player.shootCd) {
      const target = findNearestTarget(state.player, state.enemies, state.player.range);
      if (target) {
        const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x);
        state.projectiles.push(createProjectile(state.player.x, state.player.y, angle, 400, state.player.damage, { kind: 'basic', radius: 4 }));
        state.player.lastShoot = 0;
      }
    }

    for (let towerIndex = state.towers.length - 1; towerIndex >= 0; towerIndex -= 1) {
      const tower = state.towers[towerIndex];
      tower.frozenTimer = Math.max(0, (tower.frozenTimer ?? 0) - dt);
      tower.lastShoot += dt;
      if (tower.hp <= 0) {
        spawnParticle(tower.x, tower.y, tower.color, 30, 80);
        state.towers.splice(towerIndex, 1);
        continue;
      }

      if (tower.lastShoot >= tower.fireRate * getTowerFireRateFactor(tower)) {
        const target = findNearestTarget(tower, state.enemies, tower.range);
        if (target) {
          const baseAngle = Math.atan2(target.y - tower.y, target.x - tower.x);
          const burstCount = tower.burstCount ?? 1;
          for (let index = 0; index < burstCount; index += 1) {
            const offset = burstCount === 1 ? 0 : (index - (burstCount - 1) / 2) * (tower.spread ?? 0.12);
            const projectileKind = tower.splash ? 'cannon' : tower.pierce ? 'sniper' : 'basic';
            state.projectiles.push(
              createProjectile(tower.x, tower.y, baseAngle + offset, tower.projectileSpeed ?? 500, tower.damage, {
                splash: tower.splash,
                pierce: tower.pierce || 0,
                life: tower.projectileLife ?? 2,
                color: tower.color,
                kind: projectileKind,
                radius: tower.splash ? 7 : tower.pierce ? 3 : 4,
                slowRatio: tower.slowRatio,
                slowDuration: tower.slowDuration,
                hitEnemies: new Set(),
              })
            );
          }
          tower.lastShoot = 0;
        }
      }
    }

    if (state.mode !== 'debug') {
      while (state.wave.queue.length > 0 && state.wave.spawnTimer >= state.wave.spawnInterval) {
        state.wave.spawnTimer -= state.wave.spawnInterval;
        const enemyKey = state.wave.queue.shift();
        const spawnPosition = getSpawnPosition(state.camera, window.innerWidth, window.innerHeight);
        spawnEnemyAt(enemyKey, spawnPosition.x, spawnPosition.y);
      }
      state.wave.spawnTimer += dt;

      if (state.wave.queue.length === 0 && !state.wave.bossSpawned && state.enemies.length === 0) {
        const spawnPosition = getSpawnPosition(state.camera, window.innerWidth, window.innerHeight);
        spawnBossEncounterAt(state.wave.boss, spawnPosition.x, spawnPosition.y);
        state.wave.bossSpawned = true;
        showBossSpotlight(state.wave.boss);
      }
    }

    for (let enemyIndex = state.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
      const enemy = state.enemies[enemyIndex];
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 5);
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      enemy.armoredTimer = Math.max(0, (enemy.armoredTimer ?? 0) - dt);
      if (enemy.isBoss && enemy.bossState.phaseIntroTimer) {
        enemy.bossState.phaseIntroTimer = Math.max(0, enemy.bossState.phaseIntroTimer - dt);
      }
      if (enemy.slowTimer <= 0) {
        enemy.slowRatio = 1;
      }

      if (enemy.burrowed) {
        enemy.burrowTimer -= dt;
        if (enemy.burrowTimer <= 0) {
          enemy.burrowed = false;
          spawnImpactWave(enemy.x, enemy.y, { maxRadius: 58, color: enemy.color, fillAlpha: 0.12 });
        } else {
          continue;
        }
      }

      if (enemy.phase) {
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.phased = !enemy.phased;
          enemy.phaseTimer = enemy.phased ? enemy.phase.duration : enemy.phase.interval;
        }
      }

      if (enemy.healAura) {
        for (const otherEnemy of state.enemies) {
          if (otherEnemy !== enemy && !otherEnemy.isBoss && dist(enemy, otherEnemy) <= enemy.healAura.range) {
            otherEnemy.hp = Math.min(otherEnemy.maxHp, otherEnemy.hp + enemy.healAura.amount * dt);
          }
        }
      }

      if (enemy.summon) {
        enemy.summonTimer += dt;
        if (enemy.summonTimer >= enemy.summon.interval) {
          enemy.summonTimer = 0;
          spawnAround(enemy, enemy.summon.type, enemy.summon.count, enemy.radius + 28);
          spawnImpactWave(enemy.x, enemy.y, { maxRadius: 70, color: enemy.color, fillAlpha: 0.1 });
        }
      }

      if (enemy.isBoss) {
        updateBossBehavior(enemy, dt);
      }

      let target = state.player;
      let minDistance = dist(enemy, state.player);
      if (enemy.targetMode === 'tower' && state.towers.length > 0) {
        target = state.towers[0];
        minDistance = dist(enemy, target);
      }
      if (enemy.targetMode !== 'player') {
        for (const tower of state.towers) {
          const towerDistance = dist(enemy, tower);
          if (towerDistance < minDistance || (enemy.targetMode === 'tower' && target === state.player)) {
            minDistance = towerDistance;
            target = tower;
          }
        }
      }

      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      const effectiveSpeed = enemy.baseSpeed * enemy.slowRatio;
      if (enemy.dashTimer > 0) {
        enemy.dashTimer -= dt;
        enemy.x += enemy.dashVx * dt;
        enemy.y += enemy.dashVy * dt;
      } else {
        enemy.x += Math.cos(angle) * effectiveSpeed * dt;
        enemy.y += Math.sin(angle) * effectiveSpeed * dt;
      }

      if (minDistance < enemy.radius + target.radius) {
        const damageFactor = target !== state.player ? enemy.towerDamageFactor ?? 1 : 1;
        damageTarget(target, enemy.damage * damageFactor * dt);
        if (target === state.player && state.gameTime % 0.5 < dt) {
          spawnParticle(target.x, target.y, COLORS.enemyBasic, 3, 30);
          syncHudHealth();
        }

        if (enemy.explode) {
          enemy.fuseTimer = enemy.fuseTimer ?? enemy.explode.fuse;
        }
      }

      if (enemy.explode && enemy.fuseTimer !== null) {
        enemy.fuseTimer -= dt;
        if (enemy.fuseTimer <= 0) {
          damageArea(enemy.x, enemy.y, enemy.explode.radius, enemy.explode.damage, { color: enemy.color, towerFactor: 1.25 });
          enemy.hp = 0;
        }
      }

      if (enemy.hp <= 0) {
        spawnParticle(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 18 : 8);
        state.drops.push({ x: enemy.x, y: enemy.y, value: enemy.value, radius: 4 + enemy.value, color: COLORS.gem, magnetized: false });
        if (enemy.deathSpawn) {
          spawnAround(enemy, enemy.deathSpawn.type, enemy.deathSpawn.count, enemy.deathSpawn.spread);
        }
        state.enemies.splice(enemyIndex, 1);
        if (enemy.isBoss && state.mode !== 'debug') {
          state.money += enemy.value;
          syncHudMoney();
          enemy.isDefeated = true;
          if (enemy.encounterUid) {
            const hasLivingEncounterBoss = state.enemies.some((candidate) => candidate.isBoss && candidate.encounterUid === enemy.encounterUid);
            if (hasLivingEncounterBoss) {
              enrageEncounterPartner(enemy);
            } else if (hasPendingEncounterAftermath(enemy.encounterUid)) {
              state.wave.awaitingReward = true;
              state.wave.pendingRewardBossEncounterUid = enemy.encounterUid;
            } else {
              openBossReward();
            }
          } else if (hasPendingBossAftermath(enemy.uid)) {
            state.wave.awaitingReward = true;
            state.wave.pendingRewardBossUid = enemy.uid;
          } else {
            openBossReward();
          }
        }
      }
    }

    if (state.wave.pendingRewardBossUid && !rewardState.active && !hasPendingBossAftermath(state.wave.pendingRewardBossUid)) {
      openBossReward();
    }
    if (state.wave.pendingRewardBossEncounterUid && !rewardState.active && !hasPendingEncounterAftermath(state.wave.pendingRewardBossEncounterUid)) {
      openBossReward();
    }

    state.bossHudTimer = (state.bossHudTimer ?? 0) + dt;
    if (state.bossHudTimer >= 0.12) {
      state.bossHudTimer = 0;
      syncBossHud();
    }

    if (state.player.hp <= 0 && !state.debugOptions.infiniteHealth) {
      setGameState('GAMEOVER');
    } else if (state.debugOptions.infiniteHealth && state.player.hp < state.player.maxHp) {
      state.player.hp = state.player.maxHp;
      syncHudHealth();
    }

    for (let projectileIndex = state.projectiles.length - 1; projectileIndex >= 0; projectileIndex -= 1) {
      const projectile = state.projectiles[projectileIndex];
      projectile.previousX = projectile.x;
      projectile.previousY = projectile.y;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life -= dt;

      let hit = false;
      for (const enemy of state.enemies) {
        if (enemy.burrowed) continue;
        if (projectile.hitEnemies && projectile.hitEnemies.has(enemy)) continue;
        if (dist(projectile, enemy) < projectile.radius + enemy.radius + 4) {
          hit = true;
          damageEnemy(enemy, projectile.damage);
          enemy.hitFlash = 1;
          spawnFloatingText(enemy.x, enemy.y - 15, Math.floor(projectile.damage), projectile.color);
          spawnParticle(projectile.x, projectile.y, projectile.color, 5, 40);

          if (projectile.slowRatio) {
            enemy.slowRatio = Math.min(enemy.slowRatio, projectile.slowRatio);
            enemy.slowTimer = Math.max(enemy.slowTimer, projectile.slowDuration ?? 0.8);
          }

          if (projectile.kind === 'sniper') {
            spawnParticle(projectile.x, projectile.y, COLORS.towerSniper, 10, 80);
          }

          if (projectile.hitEnemies) {
            projectile.hitEnemies.add(enemy);
          }

          if (projectile.splash) {
            spawnImpactWave(projectile.x, projectile.y, { startRadius: 10, maxRadius: projectile.splash, growth: 320, life: 0.22, color: COLORS.towerCannon, lineWidth: 5, fillAlpha: 0.16 });
            spawnParticle(projectile.x, projectile.y, COLORS.towerCannon, 15, projectile.splash);
            for (const otherEnemy of state.enemies) {
              if (otherEnemy !== enemy && dist(projectile, otherEnemy) <= projectile.splash) {
                damageEnemy(otherEnemy, projectile.damage * 0.5);
                otherEnemy.hitFlash = 1;
                spawnFloatingText(otherEnemy.x, otherEnemy.y - 15, Math.floor(projectile.damage * 0.5), COLORS.towerCannon);
              }
            }
          }

          if (projectile.pierce > 0) {
            projectile.pierce -= 1;
            spawnImpactWave(projectile.x, projectile.y, { startRadius: 4, maxRadius: 18, growth: 240, life: 0.12, color: COLORS.towerSniper, lineWidth: 3, fillAlpha: 0 });
            hit = false;
          } else {
            break;
          }
        }
      }

      if (hit || projectile.life <= 0) {
        state.projectiles.splice(projectileIndex, 1);
      }
    }

    for (let dropIndex = state.drops.length - 1; dropIndex >= 0; dropIndex -= 1) {
      const drop = state.drops[dropIndex];
      const dropDistance = dist(drop, state.player);
      if (dropDistance < 80 || drop.magnetized) {
        drop.magnetized = true;
        const angle = Math.atan2(state.player.y - drop.y, state.player.x - drop.x);
        drop.x += Math.cos(angle) * 400 * dt;
        drop.y += Math.sin(angle) * 400 * dt;
        if (dropDistance < state.player.radius + drop.radius) {
          state.money += drop.value;
          syncHudMoney();
          state.player.radius = 14;
          window.setTimeout(() => {
            if (game.current) game.current.player.radius = 12;
          }, 50);
          state.drops.splice(dropIndex, 1);
        }
      }
    }

    for (let particleIndex = state.particles.length - 1; particleIndex >= 0; particleIndex -= 1) {
      const particle = state.particles[particleIndex];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      if (particle.life <= 0) state.particles.splice(particleIndex, 1);
    }

    for (let waveIndex = state.impactWaves.length - 1; waveIndex >= 0; waveIndex -= 1) {
      const impactWave = state.impactWaves[waveIndex];
      impactWave.radius = Math.min(impactWave.maxRadius, impactWave.radius + impactWave.growth * dt);
      impactWave.life -= dt;
      if (impactWave.life <= 0) state.impactWaves.splice(waveIndex, 1);
    }

    for (let hazardIndex = state.hazards.length - 1; hazardIndex >= 0; hazardIndex -= 1) {
      const hazard = state.hazards[hazardIndex];
      hazard.timer -= dt;
      if (hazard.timer > 0) continue;

      if (hazard.type === 'area') {
        const applyAreaEffect = (target) => {
          if (dist(target, hazard) > hazard.radius + target.radius) return false;
          damageTarget(target, hazard.damage);
          if (hazard.pull) {
            const angle = Math.atan2(hazard.y - target.y, hazard.x - target.x);
            target.x += Math.cos(angle) * Math.min(hazard.pull * 0.18, hazard.radius * 0.35);
            target.y += Math.sin(angle) * Math.min(hazard.pull * 0.18, hazard.radius * 0.35);
          }
          return true;
        };

        applyAreaEffect(state.player);
        syncHudHealth();
        for (const tower of state.towers) {
          const towerHit = applyAreaEffect(tower);
          if (towerHit && hazard.slowRatio) {
            tower.frozenTimer = Math.max(tower.frozenTimer ?? 0, hazard.slowDuration ?? 1.4);
          }
        }
        spawnImpactWave(hazard.x, hazard.y, { maxRadius: hazard.radius, color: hazard.color, fillAlpha: 0.12, life: 0.22 });
        hazard.pulsesRemaining -= 1;
        if (hazard.pulsesRemaining > 0) {
          hazard.timer = hazard.pulseInterval;
          hazard.maxTimer = hazard.pulseInterval;
          hazard.radius += hazard.radiusStep;
          hazard.damage += hazard.damageStep;
        } else {
          state.hazards.splice(hazardIndex, 1);
        }
        continue;
      }

      const lineLength = Math.hypot(hazard.x2 - hazard.x, hazard.y2 - hazard.y);
      const lineDx = (hazard.x2 - hazard.x) / lineLength;
      const lineDy = (hazard.y2 - hazard.y) / lineLength;
      const hitLineTarget = (target) => {
        const targetDx = target.x - hazard.x;
        const targetDy = target.y - hazard.y;
        const projection = Math.max(0, Math.min(lineLength, targetDx * lineDx + targetDy * lineDy));
        const closest = { x: hazard.x + lineDx * projection, y: hazard.y + lineDy * projection };
        return dist(target, closest) <= hazard.width + target.radius;
      };

      if (hitLineTarget(state.player)) {
        damageTarget(state.player, hazard.damage);
        syncHudHealth();
      }
      for (const tower of state.towers) {
        if (hitLineTarget(tower)) damageTarget(tower, hazard.damage);
      }
      spawnImpactWave(hazard.x2, hazard.y2, { maxRadius: 36, color: hazard.color, fillAlpha: 0.08, life: 0.18 });
      state.hazards.splice(hazardIndex, 1);
    }

    for (let textIndex = state.floatingTexts.length - 1; textIndex >= 0; textIndex -= 1) {
      const floatingText = state.floatingTexts[textIndex];
      floatingText.y += floatingText.vy * dt;
      floatingText.life -= dt;
      if (floatingText.life <= 0) state.floatingTexts.splice(textIndex, 1);
    }
  };

  const draw = (ctx, canvas) => {
    const state = game.current;
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const shakeRatio =
      state.camera.shakeTimer > 0 && state.camera.shakeDuration > 0 ? state.camera.shakeTimer / state.camera.shakeDuration : 0;
    const shakeStrength = (state.camera.shakeStrength ?? 0) * shakeRatio;
    const shakeAngle = state.gameTime * 30 + (state.camera.shakeSeed ?? 0);
    const cameraX = state.camera.x + Math.cos(shakeAngle) * shakeStrength;
    const cameraY = state.camera.y + Math.sin(shakeAngle * 1.18) * shakeStrength * 0.72;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2 - cameraX, height / 2 - cameraY);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const gridSize = 60;
    const startX = Math.floor((cameraX - width / 2) / gridSize) * gridSize;
    const startY = Math.floor((cameraY - height / 2) / gridSize) * gridSize;
    for (let x = startX; x < cameraX + width / 2; x += gridSize) {
      ctx.moveTo(x, cameraY - height / 2);
      ctx.lineTo(x, cameraY + height / 2);
    }
    for (let y = startY; y < cameraY + height / 2; y += gridSize) {
      ctx.moveTo(cameraX - width / 2, y);
      ctx.lineTo(cameraX + width / 2, y);
    }
    ctx.stroke();

    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    for (const tower of state.towers) {
      ctx.fillStyle = COLORS.towerBase;
      drawRoundRect(ctx, tower.x - tower.radius - 2, tower.y - tower.radius - 2, (tower.radius + 2) * 2, (tower.radius + 2) * 2, 6);
      ctx.fill();
      drawTowerShape(ctx, tower, tower.x, tower.y, tower.color);
      drawTowerUpgradeBadge(ctx, tower, tower.x, tower.y);
      if (tower.frozenTimer > 0) {
        ctx.strokeStyle = COLORS.towerFrost;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (tower.hp < tower.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(tower.x - 15, tower.y + tower.radius + 8, 30, 4);
        ctx.fillStyle = COLORS.success;
        ctx.fillRect(tower.x - 15, tower.y + tower.radius + 8, 30 * (tower.hp / tower.maxHp), 4);
      }
    }

    for (const drop of state.drops) {
      ctx.fillStyle = drop.color;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y - drop.radius);
      ctx.lineTo(drop.x + drop.radius, drop.y);
      ctx.lineTo(drop.x, drop.y + drop.radius);
      ctx.lineTo(drop.x - drop.radius, drop.y);
      ctx.closePath();
      ctx.fill();
    }

    drawBossEncounterLinks(ctx, state.enemies);

    for (const enemy of state.enemies) {
      if (enemy.burrowed) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y, enemy.radius * 1.4, enemy.radius * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }
      ctx.save();
      ctx.globalAlpha = enemy.phased ? 0.42 : 1;
      if (enemy.isBoss) {
        drawBossPhaseAura(ctx, enemy);
        drawBossShowcaseAccent(ctx, enemy);
        drawBossBody(ctx, enemy);
      } else {
        ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : enemy.color;
        drawRoundRect(ctx, enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2, 5);
        ctx.fill();
      }
      if (enemy.shield > 0) {
        ctx.strokeStyle = COLORS.enemyShield;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius + 5, 0, Math.PI * 2 * (enemy.shield / Math.max(enemy.maxShield, enemy.shield)));
        ctx.stroke();
      }
      if (enemy.slowRatio < 1) {
        ctx.strokeStyle = COLORS.towerFrost;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (enemy.isBoss) {
        ctx.strokeStyle = COLORS.boss;
        ctx.lineWidth = 3;
        ctx.strokeRect(enemy.x - enemy.radius - 3, enemy.y - enemy.radius - 3, (enemy.radius + 3) * 2, (enemy.radius + 3) * 2);
        if (enemy.phases?.[enemy.currentPhaseIndex]) {
          const phaseTextWidth = Math.max(38, enemy.phases[enemy.currentPhaseIndex].name.length * 13);
          ctx.fillStyle = enemy.bossState.phaseIntroTimer > 0 ? `${enemy.color}22` : 'rgba(255,255,255,0.92)';
          drawRoundRect(ctx, enemy.x - phaseTextWidth / 2, enemy.y - enemy.radius - 29, phaseTextWidth, 18, 9);
          ctx.fill();
          ctx.strokeStyle = enemy.bossState.phaseIntroTimer > 0 ? enemy.color : COLORS.boss;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = enemy.bossState.phaseIntroTimer > 0 ? enemy.color : COLORS.boss;
          ctx.font = enemy.bossState.phaseIntroTimer > 0 ? 'bold 13px system-ui, sans-serif' : 'bold 12px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(enemy.phases[enemy.currentPhaseIndex].name, enemy.x, enemy.y - enemy.radius - 16);
        }
      }
      if (enemy.hp < enemy.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 10, 40, 4);
        ctx.fillStyle = enemy.isBoss ? COLORS.boss : COLORS.enemyBasic;
        ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 10, 40 * (enemy.hp / enemy.maxHp), 4);
      }
      ctx.restore();
    }

    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.playerStroke;
    ctx.lineWidth = 3;
    ctx.stroke();

    for (const impactWave of state.impactWaves) {
      const alpha = impactWave.life / impactWave.maxLife;
      ctx.save();
      ctx.setLineDash(impactWave.dash ?? []);
      ctx.globalAlpha = alpha * impactWave.fillAlpha;
      ctx.fillStyle = impactWave.color;
      ctx.beginPath();
      ctx.arc(impactWave.x, impactWave.y, impactWave.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = impactWave.color;
      ctx.lineWidth = impactWave.lineWidth;
      ctx.beginPath();
      ctx.arc(impactWave.x, impactWave.y, impactWave.radius, 0, Math.PI * 2);
      ctx.stroke();
      if (impactWave.spokes) {
        ctx.translate(impactWave.x, impactWave.y);
        ctx.rotate((1 - alpha) * Math.PI * (impactWave.spin ?? 0));
        for (let index = 0; index < impactWave.spokes; index += 1) {
          const angle = (Math.PI * 2 * index) / impactWave.spokes;
          const inner = impactWave.radius * 0.55;
          const outer = impactWave.radius + 8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
          ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
          ctx.stroke();
        }
      }
      ctx.restore();
      if (impactWave.style) {
        drawImpactWaveAccent(ctx, impactWave, alpha);
      }
    }
    ctx.globalAlpha = 1;

    for (const hazard of state.hazards) {
      const progress = Math.max(0.15, hazard.timer / hazard.maxTimer);
      ctx.save();
      ctx.globalAlpha = 0.25 + (1 - progress) * 0.35;
      ctx.strokeStyle = hazard.color;
      if (hazard.type === 'area') {
        ctx.fillStyle = hazard.color;
        ctx.globalAlpha = 0.09 + (1 - progress) * 0.12;
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.3 + (1 - progress) * 0.45;
        ctx.lineWidth = 3;
        if (hazard.label === 'web' || hazard.label === 'nest' || hazard.label === 'shade' || hazard.label === 'silk') ctx.setLineDash([4, 8]);
        else if (hazard.label === 'brood') ctx.setLineDash([10, 6]);
        else if (hazard.label === 'frost' || hazard.label === 'prison' || hazard.label === 'moon') ctx.setLineDash([18, 6]);
        else if (hazard.label === 'gravity' || hazard.label === 'singularity' || hazard.label === 'horizon') ctx.setLineDash([3, 7]);
        else if (hazard.label === 'star') ctx.setLineDash([2, 10]);
        else if (hazard.label === 'mortar' || hazard.label === 'bunker') ctx.setLineDash([16, 10]);
        else if (hazard.label === 'ember' || hazard.label === 'meteor' || hazard.label === 'dive' || hazard.label === 'inferno' || hazard.label === 'eclipse') ctx.setLineDash([8, 6]);
        else if (hazard.label === 'slag') ctx.setLineDash([14, 6]);
        else if (hazard.label === 'beat') ctx.setLineDash([3, 11]);
        else if (hazard.label === 'coin') ctx.setLineDash([6, 12]);
        else if (hazard.label === 'spore' || hazard.label === 'garden' || hazard.label === 'poison') ctx.setLineDash([5, 9]);
        else ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
        ctx.stroke();
        if (hazard.pulsesRemaining > 1) {
          ctx.globalAlpha = 0.16 + (1 - progress) * 0.18;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, hazard.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
        if (hazard.label === 'web' || hazard.label === 'silk' || hazard.label === 'nest') {
          ctx.globalAlpha = 0.18 + (1 - progress) * 0.16;
          ctx.strokeStyle = hazard.color;
          ctx.lineWidth = 1.4;
          ctx.setLineDash([]);
          for (let spoke = 0; spoke < 6; spoke += 1) {
            const angle = (Math.PI * 2 * spoke) / 6;
            ctx.beginPath();
            ctx.moveTo(hazard.x, hazard.y);
            ctx.lineTo(hazard.x + Math.cos(angle) * hazard.radius, hazard.y + Math.sin(angle) * hazard.radius);
            ctx.stroke();
          }
        }
        if (hazard.label === 'gravity' || hazard.label === 'singularity' || hazard.label === 'horizon') {
          ctx.globalAlpha = 0.16 + (1 - progress) * 0.18;
          ctx.strokeStyle = hazard.color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, Math.max(12, hazard.radius * 0.32), 0, Math.PI * 2);
          ctx.stroke();
          if (hazard.label === 'singularity') {
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, Math.max(8, hazard.radius * 0.18), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (hazard.label === 'eclipse' || hazard.label === 'inferno') {
          ctx.globalAlpha = 0.16 + (1 - progress) * 0.14;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, hazard.radius * 0.72, 0, Math.PI * 2);
          ctx.stroke();
        }
        drawAreaHazardAccent(ctx, hazard, progress);
        const areaGlyph = getHazardGlyph(hazard);
        if (areaGlyph) {
          ctx.globalAlpha = 0.34 + (1 - progress) * 0.26;
          ctx.fillStyle = hazard.color;
          ctx.font = `bold ${Math.max(12, Math.round(hazard.radius * 0.22))}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(areaGlyph, hazard.x, hazard.y);
        }
      } else {
        ctx.lineWidth = hazard.width * (0.7 + (1 - progress) * 0.5);
        if (hazard.label === 'formation' || hazard.label === 'wall') ctx.setLineDash([18, 8]);
        else if (hazard.label === 'charge' || hazard.label === 'ram' || hazard.label === 'solar' || hazard.label === 'breath' || hazard.label === 'strafe' || hazard.label === 'diveTrail') ctx.setLineDash([24, 10]);
        else if (hazard.label === 'mark' || hazard.label === 'slash' || hazard.label === 'hunt') ctx.setLineDash([8, 10]);
        else if (hazard.label === 'refract' || hazard.label === 'lattice' || hazard.label === 'mirror' || hazard.label === 'flare' || hazard.label === 'shadow' || hazard.label === 'crossfire' || hazard.label === 'sunbolt' || hazard.label === 'moonbolt') ctx.setLineDash([4, 6]);
        else if (hazard.label === 'rail' || hazard.label === 'crosshair' || hazard.label === 'grid' || hazard.label === 'overload' || hazard.label === 'orbit' || hazard.label === 'lock') ctx.setLineDash([2, 8]);
        else if (hazard.label === 'coinline') ctx.setLineDash([10, 14]);
        else if (hazard.label === 'brood') ctx.setLineDash([14, 6]);
        else if (hazard.label === 'brand' || hazard.label === 'tempo') ctx.setLineDash([6, 10]);
        else if (hazard.label === 'gate' || hazard.label === 'maze') ctx.setLineDash([20, 6]);
        else if (hazard.label === 'vine') ctx.setLineDash([5, 7]);
        else ctx.setLineDash([14, 10]);
        ctx.beginPath();
        ctx.moveTo(hazard.x, hazard.y);
        ctx.lineTo(hazard.x2, hazard.y2);
        ctx.stroke();
        if (hazard.label === 'refract' || hazard.label === 'lattice') {
          ctx.globalAlpha = 0.14 + (1 - progress) * 0.12;
          ctx.lineWidth = Math.max(2, hazard.width * 0.26);
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(hazard.x, hazard.y);
          ctx.lineTo(hazard.x2, hazard.y2);
          ctx.stroke();
        }
        if (hazard.label === 'crossfire' || hazard.label === 'orbit' || hazard.label === 'lock') {
          const midX = (hazard.x + hazard.x2) * 0.5;
          const midY = (hazard.y + hazard.y2) * 0.5;
          ctx.globalAlpha = 0.2 + (1 - progress) * 0.22;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(midX, midY, Math.max(8, hazard.width * 0.9), 0, Math.PI * 2);
          ctx.stroke();
        }
        if (hazard.label === 'breath' || hazard.label === 'strafe') {
          ctx.globalAlpha = 0.12 + (1 - progress) * 0.12;
          ctx.lineWidth = Math.max(3, hazard.width * 1.5);
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(hazard.x, hazard.y);
          ctx.lineTo(hazard.x2, hazard.y2);
          ctx.stroke();
        }
        drawLineHazardAccent(ctx, hazard, progress);
        const dx = hazard.x2 - hazard.x;
        const dy = hazard.y2 - hazard.y;
        const angle = Math.atan2(dy, dx);
        const headSize = Math.max(8, hazard.width * 0.8);
        const glyph = getHazardGlyph(hazard);
        ctx.save();
        ctx.translate(hazard.x2, hazard.y2);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.3 + (1 - progress) * 0.34;
        ctx.fillStyle = hazard.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-headSize, headSize * 0.45);
        ctx.lineTo(-headSize, -headSize * 0.45);
        ctx.closePath();
        ctx.fill();
        if (glyph) {
          ctx.translate(-Math.hypot(dx, dy) * 0.5, 0);
          ctx.rotate(-angle);
          ctx.font = `bold ${Math.max(11, Math.round(hazard.width * 1.15))}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(glyph, 0, 0);
        }
        ctx.restore();
      }
      ctx.restore();
    }

    ctx.shadowBlur = 4;
    for (const projectile of state.projectiles) {
      ctx.fillStyle = projectile.color;
      if (projectile.kind === 'cannon') {
        ctx.save();
        ctx.translate(projectile.x, projectile.y);
        ctx.rotate(Math.atan2(projectile.vy, projectile.vx));
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, projectile.radius + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = projectile.color;
        drawRoundRect(ctx, -projectile.radius, -projectile.radius, projectile.radius * 2, projectile.radius * 2, 3);
        ctx.fill();
        ctx.restore();
      } else if (projectile.kind === 'sniper') {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = projectile.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(projectile.previousX, projectile.previousY);
        ctx.lineTo(projectile.x, projectile.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.translate(projectile.x, projectile.y);
        ctx.rotate(Math.atan2(projectile.vy, projectile.vx));
        ctx.beginPath();
        ctx.moveTo(projectile.radius * 3, 0);
        ctx.lineTo(-projectile.radius * 2, projectile.radius);
        ctx.lineTo(-projectile.radius * 2, -projectile.radius);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const dragTower = state.dragPlacement.active && state.dragPlacement.kind === 'tower' ? getTowerById(state.dragPlacement.towerId) : null;
    if (dragTower) {
      const placementColor = state.dragPlacement.canPlace ? COLORS.success : COLORS.danger;
      ctx.fillStyle = `${placementColor}22`;
      ctx.strokeStyle = placementColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.dragPlacement.worldX, state.dragPlacement.worldY, dragTower.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawTowerShape(ctx, dragTower, state.dragPlacement.worldX, state.dragPlacement.worldY, placementColor, 0.75);
    }

    if (state.dragPlacement.active && state.dragPlacement.kind !== 'tower') {
      const entity = state.dragPlacement.kind === 'boss' ? BOSS_TYPES[state.dragPlacement.entityId] : ENEMY_TYPES[state.dragPlacement.entityId];
      if (entity) {
        ctx.save();
        ctx.globalAlpha = 0.72;
        if (state.dragPlacement.kind === 'boss') {
          drawBossShowcaseAccent(ctx, {
            ...entity,
            x: state.dragPlacement.worldX,
            y: state.dragPlacement.worldY,
            uid: -1,
            currentPhaseIndex: 1,
            bossState: {},
            hitFlash: 0,
          });
          drawBossBody(ctx, {
            ...entity,
            x: state.dragPlacement.worldX,
            y: state.dragPlacement.worldY,
            uid: -1,
            currentPhaseIndex: 1,
            bossState: {},
            hitFlash: 0,
          });
          ctx.strokeStyle = COLORS.boss;
          ctx.lineWidth = 3;
          ctx.strokeRect(state.dragPlacement.worldX - entity.radius - 4, state.dragPlacement.worldY - entity.radius - 4, (entity.radius + 4) * 2, (entity.radius + 4) * 2);
        } else {
          ctx.fillStyle = entity.color;
          drawRoundRect(ctx, state.dragPlacement.worldX - entity.radius, state.dragPlacement.worldY - entity.radius, entity.radius * 2, entity.radius * 2, 5);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    for (const particle of state.particles) {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    for (const floatingText of state.floatingTexts) {
      ctx.font = floatingText.font ?? 'bold 14px system-ui, sans-serif';
      ctx.fillStyle = floatingText.color;
      ctx.globalAlpha = floatingText.life / floatingText.maxLife;
      if (floatingText.outlineColor) {
        ctx.strokeStyle = floatingText.outlineColor;
        ctx.lineWidth = 3;
        ctx.strokeText(floatingText.text, floatingText.x, floatingText.y);
      }
      ctx.fillText(floatingText.text, floatingText.x, floatingText.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (state.joystick.active) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.beginPath();
      ctx.arc(state.joystick.startX, state.joystick.startY, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(state.joystick.currentX, state.joystick.currentY, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      game.current.isMobile = window.innerWidth < 768;
    };

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
        if (key.includes('up')) game.current.keys.w = true;
        else if (key.includes('down')) game.current.keys.s = true;
        else if (key.includes('left')) game.current.keys.a = true;
        else if (key.includes('right')) game.current.keys.d = true;
        else game.current.keys[key] = true;
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
        if (key.includes('up')) game.current.keys.w = false;
        else if (key.includes('down')) game.current.keys.s = false;
        else if (key.includes('left')) game.current.keys.a = false;
        else if (key.includes('right')) game.current.keys.d = false;
        else game.current.keys[key] = false;
      }
    };

    const handlePointerDown = (event) => {
      setTowerContextMenu(null);
      if (gameState !== 'PLAYING' || rewardState.active || game.current.dragPlacement.active) return;
      const isTouch = event.type.includes('touch');
      const source = isTouch ? event.touches[0] : event;
      const clientX = source.clientX;
      const clientY = source.clientY;
      if (isTouch && clientX < window.innerWidth / 2) {
        game.current.joystick = { active: true, startX: clientX, startY: clientY, currentX: clientX, currentY: clientY, dirX: 0, dirY: 0 };
      }
    };

    const handlePointerMove = (event) => {
      const isTouch = event.type.includes('touch');
      if (isTouch && !event.touches[0]) return;
      const source = isTouch ? event.touches[0] : event;
      const clientX = source.clientX;
      const clientY = source.clientY;

      if ((game.current.joystick.active || game.current.dragPlacement.active) && event.cancelable) {
        event.preventDefault();
      }

      game.current.pointer.x = clientX;
      game.current.pointer.y = clientY;

      if (game.current.dragPlacement.active) {
        updateDragPlacement(clientX, clientY);
        return;
      }

      if (game.current.joystick.active) {
        game.current.joystick.currentX = clientX;
        game.current.joystick.currentY = clientY;
        const dx = clientX - game.current.joystick.startX;
        const dy = clientY - game.current.joystick.startY;
        const distance = Math.hypot(dx, dy);
        const maxDistance = 50;
        if (distance > 0) {
          game.current.joystick.dirX = (dx / distance) * Math.min(distance / maxDistance, 1);
          game.current.joystick.dirY = (dy / distance) * Math.min(distance / maxDistance, 1);
        }
      }
    };

    const handlePointerUp = (event) => {
      const isTouch = event.type.includes('touch');
      const source = isTouch && event.changedTouches?.[0] ? event.changedTouches[0] : event;
      const clientX = source?.clientX ?? game.current.pointer.x;
      const clientY = source?.clientY ?? game.current.pointer.y;

      if (game.current.dragPlacement.active) {
        tryBuildDraggedTower(clientX, clientY);
      }

      game.current.joystick.active = false;
      game.current.joystick.dirX = 0;
      game.current.joystick.dirY = 0;
    };

    const handleContextMenu = (event) => {
      event.preventDefault();
      if (gameState !== 'PLAYING') return;
      const worldPoint = toWorldPoint(event.clientX, event.clientY, game.current.camera, window.innerWidth, window.innerHeight);
      const tower = game.current.towers.find((candidate) => dist(candidate, worldPoint) <= candidate.radius + 10);
      if (tower) {
        setTowerContextMenu({ type: 'instance', towerUid: tower.uid, towerId: tower.id, x: event.clientX, y: event.clientY });
      }
    };

    let animationFrameId;
    const loop = (timestamp) => {
      if (!game.current.lastTime) game.current.lastTime = timestamp;
      const dt = (timestamp - game.current.lastTime) / 1000;
      game.current.lastTime = timestamp;
      if (gameState === 'PLAYING') update(dt);
      draw(ctx, canvas);
      animationFrameId = window.requestAnimationFrame(loop);
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    resizeCanvas();
    animationFrameId = window.requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, rewardState.active]);

  const setBuildBarRect = (rect) => {
    game.current.buildBarRect = rect;
  };

  const setDebugPanelRect = (rect) => {
    game.current.debugPanelRect = rect;
  };

  return {
    canvasRef,
    gameState,
    money,
    health,
    maxHealth,
    time,
    currentWave,
    waveOverview,
    formattedTime: formatTime(time),
    waveMsg,
    bossHud,
    initGame,
    beginTowerDrag,
    beginDebugEntityDrag,
    dragTowerId,
    dragEntity,
    towerTypes: towerCatalog.filter((tower) => tower.available).sort((left, right) => left.sortOrder - right.sortOrder),
    allTowerTypes: [...towerCatalog].sort((left, right) => left.sortOrder - right.sortOrder),
    enemyTypes: ENEMY_ORDER.map((enemyId) => ENEMY_TYPES[enemyId]),
    bossTypes: BOSS_ORDER.map((bossId) => BOSS_TYPES[bossId]),
    rewardState,
    applyRewardChoice,
    setBuildBarRect,
    setDebugPanelRect,
    debugMode: game.current.mode === 'debug',
    debugOptions,
    setDebugOption,
    openBlueprintContextMenu,
    towerContextMenu,
    applyTowerContextAction,
    closeTowerContextMenu: () => setTowerContextMenu(null),
  };
}
