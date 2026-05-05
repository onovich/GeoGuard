import { useEffect, useRef, useState } from 'react';
import { COLORS, ENEMY_TYPES, UI_COPY, createInitialTowerCatalog } from '../../data/gameConfig';
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

const upgradeTower = (tower) => {
  const nextLevel = tower.level + 1;
  return {
    ...tower,
    level: nextLevel,
    cost: Math.round(tower.cost * 1.32),
    damage: Math.max(tower.damage + 1, Math.round(tower.damage * 1.22)),
    range: Math.round(tower.range * 1.08),
    hp: Math.round(tower.hp * 1.16),
    fireRate: Math.max(0.1, Number((tower.fireRate * 0.93).toFixed(2))),
    splash: tower.splash ? Math.round(tower.splash * 1.14) : tower.splash,
    pierce: tower.pierce ? tower.pierce + 1 : tower.pierce,
    slowDuration: tower.slowDuration ? Number((tower.slowDuration * 1.12).toFixed(2)) : tower.slowDuration,
    slowRatio: tower.slowRatio ? Math.max(0.25, Number((tower.slowRatio - 0.06).toFixed(2))) : tower.slowRatio,
    burstCount: tower.burstCount && nextLevel === 3 ? tower.burstCount + 1 : tower.burstCount,
  };
};

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
  const [towerCatalog, setTowerCatalog] = useState(createInitialTowerCatalog());
  const [rewardState, setRewardState] = useState({ active: false, choices: [] });

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

  const syncHudMoney = () => setMoney(game.current.money);
  const syncHudHealth = () => setHealth(Math.max(0, Math.floor(game.current.player.hp)));

  const getTowerById = (towerId) => towerCatalogRef.current.find((tower) => tower.id === towerId);

  const createEnemyFromKey = (enemyKey) => {
    const baseEnemy = ENEMY_TYPES[enemyKey];
    return {
      ...baseEnemy,
      hp: baseEnemy.hp,
      maxHp: baseEnemy.hp,
      baseSpeed: baseEnemy.speed,
      slowTimer: 0,
      slowRatio: 1,
      hitFlash: 0,
    };
  };

  const createBossEnemy = (bossTemplate) => ({
    ...bossTemplate,
    hp: bossTemplate.hp,
    maxHp: bossTemplate.maxHp ?? bossTemplate.hp,
    baseSpeed: bossTemplate.speed,
    slowTimer: 0,
    slowRatio: 1,
    hitFlash: 0,
  });

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
    };
    setCurrentWave(waveNumber);
    showWaveMessage(`${UI_COPY.waveIncoming} ${waveNumber}`);
  };

  const initGame = () => {
    const initialCatalog = createInitialTowerCatalog();
    towerCatalogRef.current = initialCatalog;
    setTowerCatalog(initialCatalog);
    game.current = {
      ...createRuntimeState(),
      isMobile: window.innerWidth < 768,
      towerCatalog: initialCatalog,
    };
    setMoney(20);
    setHealth(100);
    setTime(0);
    setRewardState({ active: false, choices: [] });
    setDragTowerId(null);
    setCurrentWave(1);
    setGameState('PLAYING');
    showWaveMessage(UI_COPY.introBanner, 2200);
    startWave(1);
  };

  const evaluatePlacement = (tower, clientX, clientY) => {
    const worldPoint = toWorldPoint(clientX, clientY, game.current.camera, window.innerWidth, window.innerHeight);
    if (!tower) {
      return { worldPoint, canPlace: false, invalidReason: UI_COPY.invalidPlacement };
    }

    if (game.current.money < tower.cost) {
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
    const tower = towerOverride ?? getTowerById(game.current.dragPlacement.towerId);
    if (!tower) {
      return;
    }

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
    game.current.dragPlacement = { active: false, towerId: null, pointerX: 0, pointerY: 0, worldX: 0, worldY: 0, canPlace: false, invalidReason: null };
    setDragTowerId(null);
  };

  const tryBuildDraggedTower = (clientX, clientY) => {
    const tower = getTowerById(game.current.dragPlacement.towerId);
    if (!tower) {
      clearDragPlacement();
      return;
    }

    const buildBarRect = game.current.buildBarRect;
    if (
      buildBarRect &&
      clientX >= buildBarRect.left - DRAG_CANCEL_MARGIN &&
      clientX <= buildBarRect.right + DRAG_CANCEL_MARGIN &&
      clientY >= buildBarRect.top - DRAG_CANCEL_MARGIN &&
      clientY <= buildBarRect.bottom + DRAG_CANCEL_MARGIN
    ) {
      clearDragPlacement();
      return;
    }

    const placement = evaluatePlacement(tower, clientX, clientY);
    if (!placement.canPlace) {
      spawnFloatingText(placement.worldPoint.x, placement.worldPoint.y, placement.invalidReason, COLORS.danger);
      clearDragPlacement();
      return;
    }

    game.current.money -= tower.cost;
    syncHudMoney();
    game.current.towers.push({
      ...cloneTower(tower),
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
      towerId,
      pointerX: clientX,
      pointerY: clientY,
      worldX: 0,
      worldY: 0,
      canPlace: false,
      invalidReason: null,
    };
    setDragTowerId(towerId);
    updateDragPlacement(clientX, clientY, tower);
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
      tower.lastShoot += dt;
      if (tower.hp <= 0) {
        spawnParticle(tower.x, tower.y, tower.color, 30, 80);
        state.towers.splice(towerIndex, 1);
        continue;
      }

      if (tower.lastShoot >= tower.fireRate) {
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

    while (state.wave.queue.length > 0 && state.wave.spawnTimer >= state.wave.spawnInterval) {
      state.wave.spawnTimer -= state.wave.spawnInterval;
      const enemyKey = state.wave.queue.shift();
      const spawnPosition = getSpawnPosition(state.camera, window.innerWidth, window.innerHeight);
      state.enemies.push({ ...createEnemyFromKey(enemyKey), x: spawnPosition.x, y: spawnPosition.y });
    }
    state.wave.spawnTimer += dt;

    if (state.wave.queue.length === 0 && !state.wave.bossSpawned && state.enemies.length === 0) {
      const spawnPosition = getSpawnPosition(state.camera, window.innerWidth, window.innerHeight);
      state.enemies.push({ ...createBossEnemy(state.wave.boss), x: spawnPosition.x, y: spawnPosition.y });
      state.wave.bossSpawned = true;
      showWaveMessage(`${UI_COPY.bossIncoming} · ${state.wave.boss.name}`);
    }

    for (let enemyIndex = state.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
      const enemy = state.enemies[enemyIndex];
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 5);
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      if (enemy.slowTimer <= 0) {
        enemy.slowRatio = 1;
      }

      let target = state.player;
      let minDistance = dist(enemy, state.player);
      for (const tower of state.towers) {
        const towerDistance = dist(enemy, tower);
        if (towerDistance < minDistance) {
          minDistance = towerDistance;
          target = tower;
        }
      }

      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      const effectiveSpeed = enemy.baseSpeed * enemy.slowRatio;
      enemy.x += Math.cos(angle) * effectiveSpeed * dt;
      enemy.y += Math.sin(angle) * effectiveSpeed * dt;

      if (minDistance < enemy.radius + target.radius) {
        target.hp -= enemy.damage * dt;
        if (target === state.player && state.gameTime % 0.5 < dt) {
          spawnParticle(target.x, target.y, COLORS.enemyBasic, 3, 30);
          syncHudHealth();
        }
      }

      if (enemy.hp <= 0) {
        spawnParticle(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 18 : 8);
        state.drops.push({ x: enemy.x, y: enemy.y, value: enemy.value, radius: 4 + enemy.value, color: COLORS.gem, magnetized: false });
        state.enemies.splice(enemyIndex, 1);
        if (enemy.isBoss) {
          state.money += enemy.value;
          syncHudMoney();
          openBossReward();
        }
      }
    }

    if (state.player.hp <= 0) {
      setGameState('GAMEOVER');
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
        if (projectile.hitEnemies && projectile.hitEnemies.has(enemy)) continue;
        if (dist(projectile, enemy) < projectile.radius + enemy.radius + 4) {
          hit = true;
          enemy.hp -= projectile.damage;
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
                otherEnemy.hp -= projectile.damage * 0.5;
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
      ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : enemy.color;
      drawRoundRect(ctx, enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2, 5);
      ctx.fill();
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
      }
      if (enemy.hp < enemy.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 10, 40, 4);
        ctx.fillStyle = enemy.isBoss ? COLORS.boss : COLORS.enemyBasic;
        ctx.fillRect(enemy.x - 20, enemy.y - enemy.radius - 10, 40 * (enemy.hp / enemy.maxHp), 4);
      }
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

    const dragTower = state.dragPlacement.active ? getTowerById(state.dragPlacement.towerId) : null;
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
    dragTowerId,
    towerTypes: towerCatalog.filter((tower) => tower.available).sort((left, right) => left.sortOrder - right.sortOrder),
    rewardState,
    applyRewardChoice,
    setBuildBarRect,
  };
}