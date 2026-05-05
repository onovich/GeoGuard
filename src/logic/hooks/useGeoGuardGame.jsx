import { useEffect, useRef, useState } from 'react';
import { COLORS, TOWER_TYPES, UI_COPY } from '../../data/gameConfig';
import { canPlaceTower, findNearestTarget, getSpawnPosition, resolveEnemyType } from '../engine/gameRules';
import { createRuntimeState } from '../engine/gameState';
import { dist, drawRoundRect, formatTime, rand, toWorldPoint } from '../engine/gameMath';

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
  isPlayer: true,
  hitEnemies: extras.hitEnemies,
});

export default function useGeoGuardGame() {
  const canvasRef = useRef(null);
  const game = useRef(createRuntimeState());
  const [gameState, setGameState] = useState('START');
  const [money, setMoney] = useState(0);
  const [health, setHealth] = useState(100);
  const [maxHealth] = useState(100);
  const [time, setTime] = useState(0);
  const [selectedTower, setSelectedTower] = useState(null);
  const [waveMsg, setWaveMsg] = useState('');

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

  const initGame = () => {
    game.current = {
      ...createRuntimeState(),
      isMobile: window.innerWidth < 768,
    };
    setMoney(20);
    setHealth(100);
    setTime(0);
    setSelectedTower(null);
    setGameState('PLAYING');
    setWaveMsg(UI_COPY.introBanner);
    window.setTimeout(() => setWaveMsg(''), 3000);
  };

  const tryBuildTower = (screenX, screenY) => {
    if (!selectedTower) {
      return;
    }

    const worldPoint = toWorldPoint(
      screenX,
      screenY,
      game.current.camera,
      window.innerWidth,
      window.innerHeight
    );

    if (game.current.money < selectedTower.cost) {
      spawnFloatingText(worldPoint.x, worldPoint.y, UI_COPY.insufficientFunds, COLORS.enemyBasic);
      return;
    }

    if (!canPlaceTower(worldPoint, selectedTower, game.current.player, game.current.towers)) {
      spawnFloatingText(worldPoint.x, worldPoint.y, UI_COPY.invalidPlacement, COLORS.enemyBasic);
      return;
    }

    game.current.money -= selectedTower.cost;
    syncHudMoney();
    game.current.towers.push({
      ...selectedTower,
      x: worldPoint.x,
      y: worldPoint.y,
      hp: selectedTower.hp,
      maxHp: selectedTower.hp,
      lastShoot: 0,
    });
    spawnParticle(worldPoint.x, worldPoint.y, selectedTower.color, 15, 60);
    setSelectedTower(null);
  };

  const update = (dt) => {
    const state = game.current;
    state.gameTime += dt;

    if (Math.floor(state.gameTime) > time) {
      setTime(Math.floor(state.gameTime));
    }

    state.difficultyMultiplier = 1 + (state.gameTime / 60) * 0.5;
    state.spawnInterval = Math.max(0.2, 1.5 - state.gameTime / 120);

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
        state.projectiles.push(
          createProjectile(state.player.x, state.player.y, angle, 400, state.player.damage, {
            kind: 'basic',
            radius: 4,
          })
        );
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
          const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
          state.projectiles.push(
            createProjectile(tower.x, tower.y, angle, 500, tower.damage, {
              splash: tower.splash,
              pierce: tower.pierce || 0,
              life: 2,
              color: tower.color,
              kind: tower.splash ? 'cannon' : tower.pierce ? 'sniper' : 'basic',
              radius: tower.splash ? 7 : tower.pierce ? 3 : 4,
              hitEnemies: new Set(),
            })
          );
          tower.lastShoot = 0;
        }
      }
    }

    state.spawnTimer += dt;
    if (state.spawnTimer >= state.spawnInterval) {
      state.spawnTimer = 0;
      const spawnPosition = getSpawnPosition(state.camera, window.innerWidth, window.innerHeight);
      const enemyType = resolveEnemyType(state.gameTime);
      state.enemies.push({
        x: spawnPosition.x,
        y: spawnPosition.y,
        ...enemyType,
        hp: enemyType.hp * state.difficultyMultiplier,
        maxHp: enemyType.hp * state.difficultyMultiplier,
        hitFlash: 0,
      });
    }

    for (let enemyIndex = state.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
      const enemy = state.enemies[enemyIndex];
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 5);

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
      enemy.x += Math.cos(angle) * enemy.speed * dt;
      enemy.y += Math.sin(angle) * enemy.speed * dt;

      if (minDistance < enemy.radius + target.radius) {
        target.hp -= enemy.damage * dt;
        if (target === state.player && state.gameTime % 0.5 < dt) {
          spawnParticle(target.x, target.y, COLORS.enemyBasic, 3, 30);
          syncHudHealth();
        }
      }

      if (enemy.hp <= 0) {
        spawnParticle(enemy.x, enemy.y, enemy.color, 8);
        state.drops.push({
          x: enemy.x,
          y: enemy.y,
          value: enemy.value,
          radius: 4 + enemy.value,
          color: COLORS.gem,
          magnetized: false,
        });
        state.enemies.splice(enemyIndex, 1);
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
        if (projectile.hitEnemies && projectile.hitEnemies.has(enemy)) {
          continue;
        }

        if (dist(projectile, enemy) < 8 + enemy.radius) {
          hit = true;
          enemy.hp -= projectile.damage;
          enemy.hitFlash = 1;
          spawnFloatingText(enemy.x, enemy.y - 15, Math.floor(projectile.damage), COLORS.text);
          spawnParticle(projectile.x, projectile.y, projectile.color, 5, 40);

          if (projectile.kind === 'sniper') {
            spawnParticle(projectile.x, projectile.y, COLORS.towerSniper, 10, 80);
          }

          if (projectile.hitEnemies) {
            projectile.hitEnemies.add(enemy);
          }

          if (projectile.splash) {
            spawnImpactWave(projectile.x, projectile.y, {
              startRadius: 10,
              maxRadius: projectile.splash,
              growth: 320,
              life: 0.22,
              color: COLORS.towerCannon,
              lineWidth: 5,
              fillAlpha: 0.16,
            });
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
            spawnImpactWave(projectile.x, projectile.y, {
              startRadius: 4,
              maxRadius: 18,
              growth: 240,
              life: 0.12,
              color: COLORS.towerSniper,
              lineWidth: 3,
              fillAlpha: 0,
            });
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
            if (game.current) {
              game.current.player.radius = 12;
            }
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
      if (particle.life <= 0) {
        state.particles.splice(particleIndex, 1);
      }
    }

    for (let waveIndex = state.impactWaves.length - 1; waveIndex >= 0; waveIndex -= 1) {
      const impactWave = state.impactWaves[waveIndex];
      impactWave.radius = Math.min(impactWave.maxRadius, impactWave.radius + impactWave.growth * dt);
      impactWave.life -= dt;
      if (impactWave.life <= 0) {
        state.impactWaves.splice(waveIndex, 1);
      }
    }

    for (let textIndex = state.floatingTexts.length - 1; textIndex >= 0; textIndex -= 1) {
      const floatingText = state.floatingTexts[textIndex];
      floatingText.y += floatingText.vy * dt;
      floatingText.life -= dt;
      if (floatingText.life <= 0) {
        state.floatingTexts.splice(textIndex, 1);
      }
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

      ctx.fillStyle = tower.color;
      if (tower.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (tower.shape === 'square') {
        drawRoundRect(ctx, tower.x - tower.radius, tower.y - tower.radius, tower.radius * 2, tower.radius * 2, 4);
        ctx.fill();
      } else if (tower.shape === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(tower.x, tower.y - tower.radius - 2);
        ctx.lineTo(tower.x + tower.radius + 2, tower.y + tower.radius);
        ctx.lineTo(tower.x - tower.radius - 2, tower.y + tower.radius);
        ctx.closePath();
        ctx.fill();
      }

      if (tower.hp < tower.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(tower.x - 15, tower.y + tower.radius + 8, 30, 4);
        ctx.fillStyle = '#2ecc71';
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

      if (enemy.hp < enemy.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(enemy.x - 10, enemy.y - enemy.radius - 8, 20, 3);
        ctx.fillStyle = COLORS.enemyBasic;
        ctx.fillRect(enemy.x - 10, enemy.y - enemy.radius - 8, 20 * (enemy.hp / enemy.maxHp), 3);
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
        const angle = Math.atan2(projectile.vy, projectile.vx);
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
        ctx.rotate(angle);
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

    if (selectedTower && state.pointer.active && !state.joystick.active) {
      const previewPoint = toWorldPoint(state.pointer.x, state.pointer.y, state.camera, width, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(previewPoint.x, previewPoint.y, selectedTower.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.globalAlpha = 0.6;
      ctx.fillStyle = selectedTower.color;
      ctx.beginPath();
      ctx.arc(previewPoint.x, previewPoint.y, selectedTower.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

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
      if (gameState !== 'PLAYING') {
        return;
      }

      const isTouch = event.type.includes('touch');
      const source = isTouch ? event.touches[0] : event;
      const clientX = source.clientX;
      const clientY = source.clientY;

      if (isTouch && clientX < window.innerWidth / 2 && !selectedTower) {
        game.current.joystick = {
          active: true,
          startX: clientX,
          startY: clientY,
          currentX: clientX,
          currentY: clientY,
          dirX: 0,
          dirY: 0,
        };
        return;
      }

      game.current.pointer.active = true;
      tryBuildTower(clientX, clientY);
    };

    const handlePointerMove = (event) => {
      const isTouch = event.type.includes('touch');
      if (isTouch && !event.touches[0]) {
        return;
      }

      const source = isTouch ? event.touches[0] : event;
      const clientX = source.clientX;
      const clientY = source.clientY;

      game.current.pointer.x = clientX;
      game.current.pointer.y = clientY;

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

    const handlePointerUp = () => {
      game.current.pointer.active = false;
      game.current.joystick.active = false;
      game.current.joystick.dirX = 0;
      game.current.joystick.dirY = 0;
    };

    let animationFrameId;
    const loop = (timestamp) => {
      if (!game.current.lastTime) {
        game.current.lastTime = timestamp;
      }
      const dt = (timestamp - game.current.lastTime) / 1000;
      game.current.lastTime = timestamp;

      if (gameState === 'PLAYING') {
        update(dt);
      }

      draw(ctx, canvas);
      animationFrameId = window.requestAnimationFrame(loop);
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    resizeCanvas();
    animationFrameId = window.requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, selectedTower, time]);

  return {
    canvasRef,
    game,
    gameState,
    money,
    health,
    maxHealth,
    time,
    formattedTime: formatTime(time),
    selectedTower,
    setSelectedTower,
    waveMsg,
    initGame,
    towerTypes: Object.values(TOWER_TYPES),
  };
}