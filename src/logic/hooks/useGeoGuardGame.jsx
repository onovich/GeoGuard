import { useEffect, useRef, useState } from 'react';
import { BOSS_ORDER, BOSS_TYPES, COLORS, ENEMY_ORDER, ENEMY_TYPES, TOWER_LIBRARY, UI_COPY, createInitialTowerCatalog } from '../../data/gameConfig';
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

  if (enemy.form === 'dragon') {
    for (let index = 3; index >= 0; index -= 1) {
      ctx.globalAlpha = 0.35 + index * 0.12;
      ctx.beginPath();
      ctx.ellipse(enemy.x - index * r * 0.42, enemy.y + Math.sin(index) * r * 0.18, r * (0.58 - index * 0.05), r * 0.42, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(enemy.x + r * 0.95, enemy.y);
    ctx.lineTo(enemy.x + r * 0.25, enemy.y - r * 0.65);
    ctx.lineTo(enemy.x + r * 0.28, enemy.y + r * 0.65);
    ctx.closePath();
    ctx.fill();
    return;
  }

  if (enemy.form === 'spider') {
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y, r * 0.78, r * 0.62, 0, 0, Math.PI * 2);
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

export default function useGeoGuardGame() {
  const canvasRef = useRef(null);
  const game = useRef(createRuntimeState());
  const towerCatalogRef = useRef(createInitialTowerCatalog());
  const [gameState, setGameState] = useState('START');
  const [money, setMoney] = useState(0);
  const [health, setHealth] = useState(100);
  const [maxHealth] = useState(100);
  const [time, setTime] = useState(0);
  const [waveMsg, setWaveMsg] = useState('');
  const [currentWave, setCurrentWave] = useState(1);
  const [dragTowerId, setDragTowerId] = useState(null);
  const [dragEntity, setDragEntity] = useState(null);
  const [towerCatalog, setTowerCatalog] = useState(createInitialTowerCatalog());
  const [rewardState, setRewardState] = useState({ active: false, choices: [] });
  const [debugOptions, setDebugOptions] = useState({ infiniteMoney: false, infiniteHealth: false });
  const [towerContextMenu, setTowerContextMenu] = useState(null);

  towerCatalogRef.current = towerCatalog;
  game.current.towerCatalog = towerCatalog;

  const showWaveMessage = (message, duration = 1800) => {
    setWaveMsg(message);
    window.setTimeout(() => setWaveMsg(''), duration);
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

  const spawnFloatingText = (x, y, text, color) => {
    game.current.floatingTexts.push({ x, y, text, color, life: 1, maxLife: 0.8, vy: -30 });
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
    });
  };

  const syncHudMoney = () => setMoney(game.current.debugOptions.infiniteMoney ? '∞' : game.current.money);
  const syncHudHealth = () => setHealth(game.current.debugOptions.infiniteHealth ? game.current.player.maxHp : Math.max(0, Math.floor(game.current.player.hp)));

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
      summonCategory: null,
    };
  };

  const createBossEnemy = (bossTemplate) => ({
    ...bossTemplate,
    uid: game.current.nextEnemyUid++,
    hp: bossTemplate.hp,
    maxHp: bossTemplate.maxHp ?? bossTemplate.hp,
    baseSpeed: bossTemplate.speed,
    shield: 0,
    maxShield: 0,
    slowTimer: 0,
    slowRatio: 1,
    hitFlash: 0,
    currentPhaseIndex: -1,
    abilityCooldowns: {},
    bossState: {},
    isDefeated: false,
  });

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

  const spawnBossAt = (bossId, x, y) => {
    const bossTemplate = BOSS_TYPES[bossId];
    if (!bossTemplate) {
      return null;
    }

    const boss = createBossEnemy({
      ...bossTemplate,
      maxHp: bossTemplate.hp,
      isBoss: true,
      enemyType: 'BOSS',
    });
    boss.x = x;
    boss.y = y;
    game.current.enemies.push(boss);
    showWaveMessage(`测试 Boss · ${boss.name}`);
    return boss;
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
    };
    setCurrentWave(waveNumber);
    showWaveMessage(`${UI_COPY.waveIncoming} ${waveNumber}`);
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
    setDragTowerId(null);
    setDragEntity(null);
    setTowerContextMenu(null);
    setCurrentWave(1);
    setGameState('PLAYING');
    showWaveMessage(isDebugMode ? '开发测试场已开启' : UI_COPY.introBanner, 2200);
    if (isDebugMode) {
      game.current.wave = { number: 0, queue: [], spawnInterval: 999, spawnTimer: 0, boss: null, bossSpawned: true, awaitingReward: false, pendingRewardBossUid: null };
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
      ownerBossUid: options.ownerBossUid ?? null,
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
      ownerBossUid: options.ownerBossUid ?? null,
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
    if (abilityName === 'summonFormation') spawnAround(boss, 'BASIC', 4, boss.radius + 32, { ownerBossUid: boss.uid, summonCategory: 'formation', maxActive: 8 });
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
    if (abilityName === 'dashAtPlayer') {
      const angle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      boss.dashTimer = 0.42;
      boss.dashVx = Math.cos(angle) * 560;
      boss.dashVy = Math.sin(angle) * 560;
      spawnImpactWave(boss.x, boss.y, { maxRadius: 44, color: boss.color, life: 0.18 });
    }
    if (abilityName === 'summonScouts') spawnAround(boss, 'SCOUT', 3, boss.radius + 38, { ownerBossUid: boss.uid, summonCategory: 'scouts', maxActive: 6 });
    if (abilityName === 'afterimageBurst') spawnAround(boss, 'PHASE', 3, boss.radius + 42, { ownerBossUid: boss.uid, summonCategory: 'afterimage', maxActive: 6 });
    if (abilityName === 'summonSiege') spawnAround(boss, 'SIEGE', 2, boss.radius + 46, { ownerBossUid: boss.uid, summonCategory: 'siege', maxActive: 5 });
    if (abilityName === 'fortify') {
      boss.shield = Math.max(boss.shield ?? 0, 70);
      boss.maxShield = Math.max(boss.maxShield ?? 0, boss.shield);
      spawnImpactWave(boss.x, boss.y, { maxRadius: 92, color: COLORS.enemyTank, fillAlpha: 0.1 });
    }
    if (abilityName === 'quake') damageArea(boss.x, boss.y, 120, 18, { color: COLORS.enemyTank, towerFactor: 1.8 });
    if (abilityName === 'prismBeam') queueLineHazard(boss, target, { width: 18, damage: 24, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
    if (abilityName === 'mirrorSummon') spawnAround(boss, 'PHASE', 2, boss.radius + 48, { ownerBossUid: boss.uid, summonCategory: 'mirror', maxActive: 5 });
    if (abilityName === 'tripleBeam') {
      queueLineHazard(boss, game.current.player, { width: 16, damage: 22, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
      queueLineHazard({ x: boss.x, y: boss.y }, { x: boss.x + 120, y: boss.y - 260 }, { width: 14, damage: 18, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
      queueLineHazard({ x: boss.x, y: boss.y }, { x: boss.x - 140, y: boss.y - 240 }, { width: 14, damage: 18, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
    }
    if (abilityName === 'spawnHive') spawnAround(boss, 'BEACON', 2, boss.radius + 50, { ownerBossUid: boss.uid, summonCategory: 'hive', maxActive: 4 });
    if (abilityName === 'hiveHeal') boss.hp = Math.min(boss.maxHp, boss.hp + 42);
    if (abilityName === 'summonSwarm') spawnAround(boss, 'SHARD', 5, boss.radius + 45, { ownerBossUid: boss.uid, summonCategory: 'swarm', maxActive: 10 });
    if (abilityName === 'frostRing') {
      for (const enemy of game.current.enemies) {
        if (enemy !== boss && dist(enemy, boss) <= 180) {
          enemy.slowRatio = Math.min(enemy.slowRatio, 0.72);
          enemy.slowTimer = Math.max(enemy.slowTimer, 2.5);
        }
      }
      damageArea(boss.x, boss.y, 150, 8, { color: COLORS.towerFrost, towerFactor: 0.4 });
    }
    if (abilityName === 'freezeTower') {
      const tower = game.current.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, boss) < dist(nearest, boss) ? candidate : nearest), null);
      if (tower) {
        tower.frozenTimer = 3.5;
        spawnImpactWave(tower.x, tower.y, { maxRadius: tower.radius + 24, color: COLORS.towerFrost, fillAlpha: 0.16 });
      }
    }
    if (abilityName === 'summonFrostGuards') spawnAround(boss, 'SHIELD', 3, boss.radius + 48, { ownerBossUid: boss.uid, summonCategory: 'frostGuard', maxActive: 6 });
    if (abilityName === 'railShot') queueLineHazard(boss, target, { width: 14, damage: 34, color: COLORS.towerRail, delay: 0.65, ownerBossUid: boss.uid });
    if (abilityName === 'markTower') {
      const tower = game.current.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, boss) < dist(nearest, boss) ? candidate : nearest), null);
      if (tower) queueLineHazard(boss, tower, { width: 12, damage: 28, color: COLORS.towerRail, delay: 0.55, ownerBossUid: boss.uid });
    }
    if (abilityName === 'overload') {
      boss.hp -= Math.min(24, boss.hp - 1);
      queueLineHazard(boss, game.current.player, { width: 20, damage: 38, color: COLORS.towerRail, delay: 0.45, ownerBossUid: boss.uid });
    }
    if (abilityName === 'stealMoney') {
      if (!game.current.debugOptions.infiniteMoney) {
        const stolen = Math.min(game.current.money, 12);
        game.current.money -= stolen;
        syncHudMoney();
        spawnFloatingText(boss.x, boss.y - boss.radius - 8, `-${stolen}`, COLORS.enemyScout);
      }
    }
    if (abilityName === 'ransomBurst') spawnAround(boss, 'SCOUT', 5, boss.radius + 42, { ownerBossUid: boss.uid, summonCategory: 'ransom', maxActive: 8 });
    if (abilityName === 'twinOrbit') {
      boss.shield = Math.max(boss.shield ?? 0, 34);
      boss.maxShield = Math.max(boss.maxShield ?? 0, boss.shield);
      spawnImpactWave(boss.x, boss.y, { maxRadius: 118, color: boss.color, fillAlpha: 0.08 });
    }
    if (abilityName === 'twinBolt') {
      queueLineHazard({ x: boss.x - boss.radius * 0.6, y: boss.y }, game.current.player, { width: 11, damage: 16, color: COLORS.enemyPhase, delay: 0.5, ownerBossUid: boss.uid });
      queueLineHazard({ x: boss.x + boss.radius * 0.6, y: boss.y }, target, { width: 11, damage: 16, color: COLORS.enemyScout, delay: 0.7, ownerBossUid: boss.uid });
    }
    if (abilityName === 'twinSwap') {
      const angle = Math.random() * Math.PI * 2;
      boss.x = game.current.player.x + Math.cos(angle) * 170;
      boss.y = game.current.player.y + Math.sin(angle) * 170;
      spawnAround(boss, 'PHASE', 2, boss.radius + 34, { ownerBossUid: boss.uid, summonCategory: 'swapEcho', maxActive: 4 });
      spawnImpactWave(boss.x, boss.y, { maxRadius: 74, color: boss.color, fillAlpha: 0.12 });
    }
    if (abilityName === 'eclipsePulse') damageArea(boss.x, boss.y, 170, 20, { color: COLORS.enemyPhase, towerFactor: 0.8 });
    if (abilityName === 'dragonBreath') {
      queueLineHazard(boss, game.current.player, { width: 24, damage: 26, color: COLORS.enemyBomber, delay: 0.75, length: 720, ownerBossUid: boss.uid });
      queueLineHazard(boss, { x: game.current.player.x + 120, y: game.current.player.y + 40 }, { width: 16, damage: 18, color: COLORS.enemyBomber, delay: 0.85, length: 680, ownerBossUid: boss.uid });
      queueLineHazard(boss, { x: game.current.player.x - 120, y: game.current.player.y - 40 }, { width: 16, damage: 18, color: COLORS.enemyBomber, delay: 0.85, length: 680, ownerBossUid: boss.uid });
    }
    if (abilityName === 'tailSweep') queueAreaHazard(boss.x, boss.y, { radius: 145, damage: 18, delay: 0.55, color: COLORS.enemyBomber, label: 'tail', ownerBossUid: boss.uid });
    if (abilityName === 'meteorRain') {
      for (let index = 0; index < 4; index += 1) {
        queueAreaHazard(game.current.player.x + rand(-180, 180), game.current.player.y + rand(-130, 130), { radius: 54, damage: 24, delay: 1 + index * 0.12, color: COLORS.enemyBomber, ownerBossUid: boss.uid });
      }
    }
    if (abilityName === 'webTrap') queueAreaHazard(game.current.player.x, game.current.player.y, { radius: 86, damage: 8, slowRatio: 0.42, slowDuration: 2.8, delay: 0.65, color: COLORS.enemyBurrower, label: 'web', ownerBossUid: boss.uid });
    if (abilityName === 'spawnSpiderlings') spawnAround(boss, 'SPLINTER', 6, boss.radius + 38, { ownerBossUid: boss.uid, summonCategory: 'spiderling', maxActive: 10 });
    if (abilityName === 'webField') {
      queueAreaHazard(boss.x, boss.y, { radius: 185, damage: 10, slowRatio: 0.5, slowDuration: 3.2, delay: 0.8, color: COLORS.enemyBurrower, label: 'web', ownerBossUid: boss.uid });
      spawnAround(boss, 'BURROWER', 2, boss.radius + 52, { ownerBossUid: boss.uid, summonCategory: 'burrowEscort', maxActive: 4 });
    }
    if (abilityName === 'gravityWell') queueAreaHazard(game.current.player.x, game.current.player.y, { radius: 120, damage: 12, pull: 220, delay: 0.7, color: COLORS.enemyJammer, label: 'gravity', ownerBossUid: boss.uid });
    if (abilityName === 'orbitalShots') {
      for (let index = 0; index < 4; index += 1) {
        const angle = (Math.PI * 2 * index) / 4;
        queueLineHazard({ x: boss.x + Math.cos(angle) * 80, y: boss.y + Math.sin(angle) * 80 }, boss, { width: 10, damage: 18, color: COLORS.enemyJammer, delay: 0.65, length: 520, ownerBossUid: boss.uid });
      }
    }
    if (abilityName === 'singularity') {
      for (const tower of game.current.towers) {
        const angle = Math.atan2(boss.y - tower.y, boss.x - tower.x);
        tower.x += Math.cos(angle) * 34;
        tower.y += Math.sin(angle) * 34;
      }
      queueAreaHazard(boss.x, boss.y, { radius: 210, damage: 24, pull: 340, delay: 1, color: COLORS.enemyJammer, label: 'singularity', ownerBossUid: boss.uid });
    }
    if (abilityName === 'forgeArmor') {
      boss.shield = Math.max(boss.shield ?? 0, 90);
      boss.maxShield = Math.max(boss.maxShield ?? 0, boss.shield);
      spawnAround(boss, 'SHIELD', 2, boss.radius + 42, { ownerBossUid: boss.uid, summonCategory: 'forgeGuard', maxActive: 6 });
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
    if (abilityName === 'moltenBurst') {
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6;
        queueAreaHazard(boss.x + Math.cos(angle) * 150, boss.y + Math.sin(angle) * 150, { radius: 62, damage: 22, delay: 0.8, color: COLORS.enemySiege, ownerBossUid: boss.uid });
      }
    }
    if (abilityName === 'conductLines') {
      queueLineHazard(boss, game.current.player, { width: 12, damage: 18, color: COLORS.towerRail, delay: 0.45, ownerBossUid: boss.uid });
      queueLineHazard({ x: boss.x - 90, y: boss.y - 80 }, { x: boss.x + 180, y: boss.y + 120 }, { width: 10, damage: 15, color: COLORS.towerRail, delay: 0.75, length: 560, ownerBossUid: boss.uid });
    }
    if (abilityName === 'tempoShift') {
      for (const tower of game.current.towers) {
        if (dist(tower, boss) <= 260) tower.frozenTimer = Math.max(tower.frozenTimer ?? 0, 1.6);
      }
      spawnAround(boss, 'FAST', 4, boss.radius + 45, { ownerBossUid: boss.uid, summonCategory: 'tempoRunner', maxActive: 8 });
    }
    if (abilityName === 'finale') {
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        queueLineHazard(boss, { x: boss.x + Math.cos(angle) * 220, y: boss.y + Math.sin(angle) * 220 }, { width: 9, damage: 16, color: COLORS.towerRail, delay: 0.55, length: 620, ownerBossUid: boss.uid });
      }
    }
    if (abilityName === 'raiseWalls') {
      spawnAround(boss, 'SIEGE', 3, boss.radius + 58, { ownerBossUid: boss.uid, summonCategory: 'wallGuard', maxActive: 6 });
      queueAreaHazard(game.current.player.x, game.current.player.y, { radius: 95, damage: 8, slowRatio: 0.65, slowDuration: 2.2, delay: 0.75, color: COLORS.enemyShield, label: 'wall', ownerBossUid: boss.uid });
    }
    if (abilityName === 'gateSwap') {
      const oldX = boss.x;
      const oldY = boss.y;
      boss.x = game.current.player.x + rand(-210, 210);
      boss.y = game.current.player.y + rand(-160, 160);
      queueLineHazard({ x: oldX, y: oldY }, boss, { width: 18, damage: 20, color: COLORS.enemyShield, delay: 0.6, ownerBossUid: boss.uid });
    }
    if (abilityName === 'mazeCrush') {
      for (const tower of game.current.towers.slice(0, 4)) {
        queueAreaHazard(tower.x, tower.y, { radius: 72, damage: 24, delay: 0.7, color: COLORS.enemyShield, label: 'wall', ownerBossUid: boss.uid });
      }
      queueAreaHazard(game.current.player.x, game.current.player.y, { radius: 88, damage: 18, delay: 0.8, color: COLORS.enemyShield, label: 'wall', ownerBossUid: boss.uid });
    }
    if (abilityName === 'seedPods') spawnAround(boss, 'MEDIC', 2, boss.radius + 46, { ownerBossUid: boss.uid, summonCategory: 'seedPod', maxActive: 5 });
    if (abilityName === 'poisonBloom') queueAreaHazard(game.current.player.x, game.current.player.y, { radius: 110, damage: 14, slowRatio: 0.7, slowDuration: 2, delay: 0.75, color: COLORS.enemyMedic, label: 'poison', ownerBossUid: boss.uid });
    if (abilityName === 'gardenWake') {
      for (const enemy of game.current.enemies) {
        if (enemy !== boss && dist(enemy, boss) <= 260) enemy.hp = Math.min(enemy.maxHp, enemy.hp + 20);
      }
      spawnAround(boss, 'SHARD', 6, boss.radius + 50, { ownerBossUid: boss.uid, summonCategory: 'gardenShard', maxActive: 10 });
      queueAreaHazard(boss.x, boss.y, { radius: 210, damage: 16, slowRatio: 0.68, slowDuration: 2.4, delay: 0.85, color: COLORS.enemyMedic, label: 'garden', ownerBossUid: boss.uid });
    }
  };

  const updateBossBehavior = (boss, dt) => {
    const hpRatio = boss.hp / boss.maxHp;
    let activePhaseIndex = 0;
    for (let index = 0; index < boss.phases.length; index += 1) {
      if (hpRatio <= boss.phases[index].hpBelow) {
        activePhaseIndex = index;
      }
    }
    const activePhase = boss.phases[activePhaseIndex];

    if (boss.currentPhaseIndex !== activePhaseIndex) {
      boss.currentPhaseIndex = activePhaseIndex;
      spawnImpactWave(boss.x, boss.y, { maxRadius: boss.radius + 34, color: boss.color, fillAlpha: 0.08 });
    }

    for (const abilityName of activePhase.abilities) {
      boss.abilityCooldowns[abilityName] = Math.max(0, (boss.abilityCooldowns[abilityName] ?? 0) - dt);
      const cooldown = {
        summonFormation: 6,
        shieldPulse: 8,
        dashAtPlayer: 4.5,
        summonScouts: 7,
        afterimageBurst: 9,
        summonSiege: 7.5,
        fortify: 10,
        quake: 8,
        prismBeam: 4.2,
        mirrorSummon: 8,
        tripleBeam: 7,
        spawnHive: 8,
        hiveHeal: 9,
        summonSwarm: 7,
        frostRing: 5.8,
        freezeTower: 8.5,
        summonFrostGuards: 9,
        railShot: 4,
        markTower: 7,
        overload: 6,
        stealMoney: 5,
        ransomBurst: 8,
        twinOrbit: 9,
        twinBolt: 3.8,
        twinSwap: 7,
        eclipsePulse: 8,
        dragonBreath: 4.8,
        tailSweep: 6,
        meteorRain: 9,
        webTrap: 4.5,
        spawnSpiderlings: 7,
        webField: 9,
        gravityWell: 5.5,
        orbitalShots: 6.5,
        singularity: 10,
        forgeArmor: 8,
        sacrificeMinions: 9,
        moltenBurst: 10,
        conductLines: 4,
        tempoShift: 7,
        finale: 10,
        raiseWalls: 7,
        gateSwap: 8,
        mazeCrush: 10,
        seedPods: 6,
        poisonBloom: 5.5,
        gardenWake: 9,
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
        state.enemies.push({ ...createBossEnemy(state.wave.boss), x: spawnPosition.x, y: spawnPosition.y });
        state.wave.bossSpawned = true;
        showWaveMessage(`${UI_COPY.bossIncoming} · ${state.wave.boss.name}`);
      }
    }

    for (let enemyIndex = state.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
      const enemy = state.enemies[enemyIndex];
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 5);
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      enemy.armoredTimer = Math.max(0, (enemy.armoredTimer ?? 0) - dt);
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
          if (hasPendingBossAftermath(enemy.uid)) {
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
        state.hazards.splice(hazardIndex, 1);
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
    const cameraX = state.camera.x;
    const cameraY = state.camera.y;

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
          ctx.fillStyle = COLORS.boss;
          ctx.font = 'bold 12px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(enemy.phases[enemy.currentPhaseIndex].name, enemy.x, enemy.y - enemy.radius - 18);
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
        ctx.setLineDash(hazard.label === 'web' ? [4, 8] : [12, 8]);
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.lineWidth = hazard.width * (0.7 + (1 - progress) * 0.5);
        ctx.setLineDash([14, 10]);
        ctx.beginPath();
        ctx.moveTo(hazard.x, hazard.y);
        ctx.lineTo(hazard.x2, hazard.y2);
        ctx.stroke();
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
        ctx.fillStyle = entity.color;
        drawRoundRect(ctx, state.dragPlacement.worldX - entity.radius, state.dragPlacement.worldY - entity.radius, entity.radius * 2, entity.radius * 2, 5);
        ctx.fill();
        if (state.dragPlacement.kind === 'boss') {
          ctx.strokeStyle = COLORS.boss;
          ctx.lineWidth = 3;
          ctx.strokeRect(state.dragPlacement.worldX - entity.radius - 4, state.dragPlacement.worldY - entity.radius - 4, (entity.radius + 4) * 2, (entity.radius + 4) * 2);
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

    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const floatingText of state.floatingTexts) {
      ctx.fillStyle = floatingText.color;
      ctx.globalAlpha = floatingText.life / floatingText.maxLife;
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
    formattedTime: formatTime(time),
    waveMsg,
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
