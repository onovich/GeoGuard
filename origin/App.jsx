import React, { useEffect, useRef, useState } from 'react';

// --- 游戏配置与常量 ---
const COLORS = {
  bg: '#f0f4f8',
  grid: '#e2e8f0',
  player: '#4a90e2',
  playerStroke: '#357abd',
  enemyBasic: '#e74c3c',
  enemyFast: '#f39c12',
  enemyTank: '#8e44ad',
  gem: '#2ecc71',
  towerBase: '#bdc3c7',
  towerBasic: '#3498db',
  towerCannon: '#e67e22',
  towerSniper: '#9b59b6',
  projectile: '#f1c40f',
  particle: '#ecf0f1',
  text: '#2c3e50',
  uiBg: 'rgba(255, 255, 255, 0.85)',
};

const TOWER_TYPES = {
  BASIC: { id: 'BASIC', name: '速射塔', cost: 15, color: COLORS.towerBasic, radius: 14, range: 180, fireRate: 0.3, damage: 6, hp: 50, shape: 'circle' },
  CANNON: { id: 'CANNON', name: '榴弹炮', cost: 40, color: COLORS.towerCannon, radius: 16, range: 140, fireRate: 1.5, damage: 15, splash: 60, hp: 80, shape: 'square' },
  SNIPER: { id: 'SNIPER', name: '穿透塔', cost: 80, color: COLORS.towerSniper, radius: 14, range: 350, fireRate: 2.0, damage: 35, pierce: 3, hp: 40, shape: 'triangle' }
};

// --- 工具函数 ---
const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const rand = (min, max) => Math.random() * (max - min) + min;

// 圆角矩形绘制
const drawRoundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export default function App() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('START'); // START, PLAYING, GAMEOVER
  const [money, setMoney] = useState(0);
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [time, setTime] = useState(0);
  const [selectedTower, setSelectedTower] = useState(null);
  const [waveMsg, setWaveMsg] = useState('');

  // 游戏核心状态 (使用 ref 避免 React 频繁重渲染导致卡顿)
  const game = useRef({
    player: { x: 0, y: 0, vx: 0, vy: 0, speed: 180, radius: 12, hp: 100, maxHp: 100, lastShoot: 0, shootCd: 0.5, damage: 8, range: 200 },
    camera: { x: 0, y: 0 },
    keys: { w: false, a: false, s: false, d: false },
    joystick: { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, dirX: 0, dirY: 0 },
    pointer: { x: 0, y: 0, active: false },
    enemies: [],
    towers: [],
    projectiles: [],
    drops: [],
    particles: [],
    floatingTexts: [],
    lastTime: 0,
    gameTime: 0,
    money: 20, // 初始资金
    spawnTimer: 0,
    spawnInterval: 1.5,
    difficultyMultiplier: 1,
    isMobile: false
  });

  // --- 初始化与事件绑定 ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 处理高分屏模糊
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      game.current.isMobile = window.innerWidth < 768;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 键盘事件
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key) || ['arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
        if(key.includes('up')) game.current.keys['w'] = true;
        else if(key.includes('down')) game.current.keys['s'] = true;
        else if(key.includes('left')) game.current.keys['a'] = true;
        else if(key.includes('right')) game.current.keys['d'] = true;
        else game.current.keys[key] = true;
      }
    };
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key) || ['arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
        if(key.includes('up')) game.current.keys['w'] = false;
        else if(key.includes('down')) game.current.keys['s'] = false;
        else if(key.includes('left')) game.current.keys['a'] = false;
        else if(key.includes('right')) game.current.keys['d'] = false;
        else game.current.keys[key] = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 鼠标/触摸事件 (用于获取世界坐标和建造)
    const handlePointerDown = (e) => {
      if (gameState !== 'PLAYING') return;
      
      const isTouch = e.type.includes('touch');
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;

      // 移动端处理：左侧半屏为摇杆区域，右侧或选中塔时为建造/交互区域
      if (isTouch && clientX < window.innerWidth / 2 && !selectedTower) {
        game.current.joystick = {
          active: true,
          startX: clientX, startY: clientY,
          currentX: clientX, currentY: clientY,
          dirX: 0, dirY: 0
        };
        return;
      }

      game.current.pointer.active = true;
      tryBuildTower(clientX, clientY);
    };

    const handlePointerMove = (e) => {
      const isTouch = e.type.includes('touch');
      if (isTouch && !e.touches[0]) return;
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;

      game.current.pointer.x = clientX;
      game.current.pointer.y = clientY;

      if (game.current.joystick.active) {
        game.current.joystick.currentX = clientX;
        game.current.joystick.currentY = clientY;
        const dx = clientX - game.current.joystick.startX;
        const dy = clientY - game.current.joystick.startY;
        const distance = Math.hypot(dx, dy);
        const maxDist = 50;
        
        if (distance > 0) {
          game.current.joystick.dirX = dx / distance * Math.min(distance / maxDist, 1);
          game.current.joystick.dirY = dy / distance * Math.min(distance / maxDist, 1);
        }
      }
    };

    const handlePointerUp = () => {
      game.current.pointer.active = false;
      game.current.joystick.active = false;
      game.current.joystick.dirX = 0;
      game.current.joystick.dirY = 0;
    };

    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    let animationFrameId;
    const loop = (timestamp) => {
      if (!game.current.lastTime) game.current.lastTime = timestamp;
      const dt = (timestamp - game.current.lastTime) / 1000;
      game.current.lastTime = timestamp;

      if (gameState === 'PLAYING') {
        update(dt);
      }
      draw(ctx, canvas);
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);

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
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, selectedTower]); // 依赖中加入 selectedTower 以便事件处理器能拿到最新值

  // --- 游戏逻辑 ---
  const initGame = () => {
    game.current = {
      ...game.current,
      player: { x: 0, y: 0, vx: 0, vy: 0, speed: 180, radius: 12, hp: 100, maxHp: 100, lastShoot: 0, shootCd: 0.5, damage: 8, range: 200 },
      camera: { x: 0, y: 0 },
      enemies: [], towers: [], projectiles: [], drops: [], particles: [], floatingTexts: [],
      gameTime: 0, money: 20, spawnTimer: 0, spawnInterval: 1.5, difficultyMultiplier: 1,
    };
    setMoney(20);
    setHealth(100);
    setTime(0);
    setSelectedTower(null);
    setGameState('PLAYING');
    setWaveMsg('生存并建立你的防线');
    setTimeout(() => setWaveMsg(''), 3000);
  };

  const spawnParticle = (x, y, color, count, speedBase = 50) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * speedBase + 20;
      game.current.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: rand(0.3, 0.6),
        color,
        size: rand(2, 4)
      });
    }
  };

  const spawnFloatingText = (x, y, text, color) => {
    game.current.floatingTexts.push({ x, y, text, color, life: 1, maxLife: 0.8, vy: -30 });
  };

  const tryBuildTower = (screenX, screenY) => {
    if (!selectedTower) return;
    
    // 将屏幕坐标转换为世界坐标
    const worldX = screenX + game.current.camera.x - window.innerWidth / 2;
    const worldY = screenY + game.current.camera.y - window.innerHeight / 2;
    
    // 检查资金
    if (game.current.money < selectedTower.cost) {
      spawnFloatingText(worldX, worldY, "资金不足", COLORS.enemyBasic);
      return;
    }

    // 检查碰撞 (不能建在玩家或已有塔上)
    const tooClosePlayer = dist({x: worldX, y: worldY}, game.current.player) < selectedTower.radius + game.current.player.radius + 5;
    const tooCloseTower = game.current.towers.some(t => dist({x: worldX, y: worldY}, t) < selectedTower.radius + t.radius + 5);
    
    if (tooClosePlayer || tooCloseTower) {
       spawnFloatingText(worldX, worldY, "位置无效", COLORS.enemyBasic);
       return;
    }

    // 建造
    game.current.money -= selectedTower.cost;
    setMoney(game.current.money);
    game.current.towers.push({
      ...selectedTower,
      x: worldX, y: worldY,
      hp: selectedTower.hp, maxHp: selectedTower.hp,
      lastShoot: 0
    });
    spawnParticle(worldX, worldY, selectedTower.color, 15, 60);
    setSelectedTower(null); // 建完后取消选中
  };

  const update = (dt) => {
    const state = game.current;
    state.gameTime += dt;
    if (Math.floor(state.gameTime) > time) {
      setTime(Math.floor(state.gameTime));
    }

    // 难度曲线
    state.difficultyMultiplier = 1 + (state.gameTime / 60) * 0.5;
    state.spawnInterval = Math.max(0.2, 1.5 - (state.gameTime / 120));

    // --- 玩家输入与移动 ---
    let dx = 0, dy = 0;
    if (state.keys.w) dy -= 1;
    if (state.keys.s) dy += 1;
    if (state.keys.a) dx -= 1;
    if (state.keys.d) dx += 1;

    // 摇杆覆盖键盘输入
    if (state.joystick.active) {
      dx = state.joystick.dirX;
      dy = state.joystick.dirY;
    }

    // 归一化对角线速度
    const len = Math.hypot(dx, dy);
    if (len > 0 && !state.joystick.active) {
      dx /= len; dy /= len;
    }

    state.player.x += dx * state.player.speed * dt;
    state.player.y += dy * state.player.speed * dt;

    // --- 相机跟随 ---
    // 平滑跟随
    state.camera.x += (state.player.x - state.camera.x) * 5 * dt;
    state.camera.y += (state.player.y - state.camera.y) * 5 * dt;

    // --- 玩家攻击 ---
    state.player.lastShoot += dt;
    if (state.player.lastShoot >= state.player.shootCd) {
      // 寻找最近的敌人
      let nearestDist = state.player.range;
      let target = null;
      for (const enemy of state.enemies) {
        const d = dist(state.player, enemy);
        if (d < nearestDist) {
          nearestDist = d;
          target = enemy;
        }
      }
      if (target) {
        const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x);
        state.projectiles.push({
          x: state.player.x, y: state.player.y,
          vx: Math.cos(angle) * 400, vy: Math.sin(angle) * 400,
          damage: state.player.damage,
          life: 1.5,
          color: COLORS.projectile,
          pierce: 0,
          isPlayer: true
        });
        state.player.lastShoot = 0;
      }
    }

    // --- 防御塔攻击 ---
    for (let i = state.towers.length - 1; i >= 0; i--) {
      const tower = state.towers[i];
      tower.lastShoot += dt;
      if (tower.hp <= 0) {
        spawnParticle(tower.x, tower.y, tower.color, 30, 80);
        state.towers.splice(i, 1);
        continue;
      }

      if (tower.lastShoot >= tower.fireRate) {
        let nearestDist = tower.range;
        let target = null;
        for (const enemy of state.enemies) {
          const d = dist(tower, enemy);
          if (d < nearestDist) {
            nearestDist = d;
            target = enemy;
          }
        }
        if (target) {
          const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
          state.projectiles.push({
            x: tower.x, y: tower.y,
            vx: Math.cos(angle) * 500, vy: Math.sin(angle) * 500,
            damage: tower.damage,
            splash: tower.splash,
            pierce: tower.pierce || 0,
            life: 2,
            color: tower.color,
            isPlayer: true,
            hitEnemies: new Set() // 用于记录穿透攻击已击中的敌人
          });
          tower.lastShoot = 0;
        }
      }
    }

    // --- 敌人生成 ---
    state.spawnTimer += dt;
    if (state.spawnTimer >= state.spawnInterval) {
      state.spawnTimer = 0;
      // 在屏幕外围生成
      const angle = Math.random() * Math.PI * 2;
      const spawnRadius = Math.max(window.innerWidth, window.innerHeight) / 2 + 100;
      const x = state.camera.x + Math.cos(angle) * spawnRadius;
      const y = state.camera.y + Math.sin(angle) * spawnRadius;

      const randType = Math.random();
      let type = { color: COLORS.enemyBasic, hp: 20, speed: 100, damage: 5, radius: 10, value: 1 };
      
      if (state.gameTime > 30 && randType > 0.7) {
        type = { color: COLORS.enemyFast, hp: 15, speed: 180, damage: 3, radius: 8, value: 2 };
      } else if (state.gameTime > 60 && randType > 0.9) {
        type = { color: COLORS.enemyTank, hp: 80, speed: 60, damage: 15, radius: 16, value: 5 };
      }

      // 应用难度倍数
      state.enemies.push({
        x, y,
        ...type,
        hp: type.hp * state.difficultyMultiplier,
        maxHp: type.hp * state.difficultyMultiplier,
        hitFlash: 0
      });
    }

    // --- 敌人逻辑 ---
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const enemy = state.enemies[i];
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 5);

      // 寻找最近的目标 (玩家或塔)
      let target = state.player;
      let minDist = dist(enemy, state.player);
      for (const tower of state.towers) {
        const d = dist(enemy, tower);
        if (d < minDist) {
          minDist = d;
          target = tower;
        }
      }

      // 移动
      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      enemy.x += Math.cos(angle) * enemy.speed * dt;
      enemy.y += Math.sin(angle) * enemy.speed * dt;

      // 碰撞伤害
      if (minDist < enemy.radius + target.radius) {
        target.hp -= enemy.damage * dt; // 持续接触伤害
        if (target === state.player && state.gameTime % 0.5 < dt) {
           // 玩家受伤特效减弱触发频率
           spawnParticle(target.x, target.y, COLORS.enemyBasic, 3, 30);
           setHealth(Math.max(0, Math.floor(target.hp)));
        }
      }

      // 死亡
      if (enemy.hp <= 0) {
        spawnParticle(enemy.x, enemy.y, enemy.color, 8);
        // 掉落水晶
        state.drops.push({
          x: enemy.x, y: enemy.y,
          value: enemy.value,
          radius: 4 + enemy.value,
          color: COLORS.gem,
          magnetized: false
        });
        state.enemies.splice(i, 1);
      }
    }

    // --- 玩家死亡检测 ---
    if (state.player.hp <= 0) {
      setGameState('GAMEOVER');
    }

    // --- 投射物逻辑 ---
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const proj = state.projectiles[i];
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      let hit = false;
      for (const enemy of state.enemies) {
        if (proj.hitEnemies && proj.hitEnemies.has(enemy)) continue;

        if (dist(proj, enemy) < 8 + enemy.radius) {
          // 命中
          hit = true;
          enemy.hp -= proj.damage;
          enemy.hitFlash = 1;
          spawnFloatingText(enemy.x, enemy.y - 15, Math.floor(proj.damage), COLORS.text);
          spawnParticle(proj.x, proj.y, proj.color, 5, 40);

          if (proj.hitEnemies) proj.hitEnemies.add(enemy);

          // 范围伤害逻辑
          if (proj.splash) {
             spawnParticle(proj.x, proj.y, COLORS.towerCannon, 15, proj.splash);
             for(const otherEnemy of state.enemies) {
               if(otherEnemy !== enemy && dist(proj, otherEnemy) <= proj.splash) {
                  otherEnemy.hp -= proj.damage * 0.5;
                  otherEnemy.hitFlash = 1;
                  spawnFloatingText(otherEnemy.x, otherEnemy.y - 15, Math.floor(proj.damage*0.5), COLORS.text);
               }
             }
          }

          if (proj.pierce > 0) {
            proj.pierce--;
            hit = false; // 继续飞行
          } else {
            break;
          }
        }
      }

      if (hit || proj.life <= 0) {
        state.projectiles.splice(i, 1);
      }
    }

    // --- 掉落物拾取逻辑 ---
    for (let i = state.drops.length - 1; i >= 0; i--) {
      const drop = state.drops[i];
      const d = dist(drop, state.player);
      
      if (d < 80 || drop.magnetized) { // 磁吸范围
        drop.magnetized = true;
        const speed = 400;
        const angle = Math.atan2(state.player.y - drop.y, state.player.x - drop.x);
        drop.x += Math.cos(angle) * speed * dt;
        drop.y += Math.sin(angle) * speed * dt;

        if (d < state.player.radius + drop.radius) {
          state.money += drop.value;
          setMoney(state.money);
          // 拾取音效视觉反馈
          state.player.radius = 14; // 稍微变大
          setTimeout(() => { if(game.current) game.current.player.radius = 12; }, 50);
          state.drops.splice(i, 1);
        }
      }
    }

    // --- 粒子和浮动文字 ---
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
      const ft = state.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) state.floatingTexts.splice(i, 1);
    }
  };

  const draw = (ctx, canvas) => {
    const state = game.current;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    const cx = state.camera.x;
    const cy = state.camera.y;

    // 清屏与背景颜色
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    // 应用相机偏移，使其中心点对齐屏幕中心
    ctx.translate(w / 2 - cx, h / 2 - cy);

    // 绘制舒适的网格
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const gridSize = 60;
    const startX = Math.floor((cx - w / 2) / gridSize) * gridSize;
    const startY = Math.floor((cy - h / 2) / gridSize) * gridSize;
    for (let x = startX; x < cx + w / 2; x += gridSize) {
      ctx.moveTo(x, cy - h / 2); ctx.lineTo(x, cy + h / 2);
    }
    for (let y = startY; y < cy + h / 2; y += gridSize) {
      ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx + w / 2, y);
    }
    ctx.stroke();

    // 开启软阴影 (针对实体)
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // 绘制防御塔
    for (const tower of state.towers) {
      // 塔基座
      ctx.fillStyle = COLORS.towerBase;
      drawRoundRect(ctx, tower.x - tower.radius - 2, tower.y - tower.radius - 2, (tower.radius + 2) * 2, (tower.radius + 2) * 2, 6);
      ctx.fill();

      ctx.fillStyle = tower.color;
      if (tower.shape === 'circle') {
        ctx.beginPath(); ctx.arc(tower.x, tower.y, tower.radius, 0, Math.PI * 2); ctx.fill();
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

      // 血条
      if (tower.hp < tower.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(tower.x - 15, tower.y + tower.radius + 8, 30, 4);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(tower.x - 15, tower.y + tower.radius + 8, 30 * (tower.hp / tower.maxHp), 4);
      }
    }

    // 绘制掉落物 (水晶)
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

    // 绘制敌人
    for (const enemy of state.enemies) {
      ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : enemy.color;
      drawRoundRect(ctx, enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2, 5);
      ctx.fill();
      
      // 简单血条
      if (enemy.hp < enemy.maxHp) {
         ctx.fillStyle = 'rgba(0,0,0,0.3)';
         ctx.fillRect(enemy.x - 10, enemy.y - enemy.radius - 8, 20, 3);
         ctx.fillStyle = '#e74c3c';
         ctx.fillRect(enemy.x - 10, enemy.y - enemy.radius - 8, 20 * (enemy.hp / enemy.maxHp), 3);
      }
    }

    // 绘制玩家
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.radius, 0, Math.PI * 2);
    ctx.fill();
    // 玩家光环/描边
    ctx.strokeStyle = COLORS.playerStroke;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 绘制投射物
    ctx.shadowBlur = 4;
    for (const proj of state.projectiles) {
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 关闭阴影以绘制粒子和文字，提高性能
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 绘制粒子
    for (const p of state.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 绘制浮动文字
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    for (const ft of state.floatingTexts) {
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.life / ft.maxLife;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0;

    // --- 绘制交互预览 ---
    if (selectedTower && state.pointer.active && !state.joystick.active) {
      const worldX = state.pointer.x + cx - w / 2;
      const worldY = state.pointer.y + cy - h / 2;
      
      // 预览范围
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(worldX, worldY, selectedTower.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 预览塔
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = selectedTower.color;
      ctx.beginPath(); ctx.arc(worldX, worldY, selectedTower.radius, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    ctx.restore(); // 恢复相机变换

    // --- HUD 绘制 (不受相机影响) ---
    // 虚拟摇杆
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

  // --- UI 组件渲染 ---
  return (
    <div className="relative w-full h-screen overflow-hidden select-none touch-none bg-[#f0f4f8] font-sans">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full block"
      />

      {/* 顶部 HUD */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
          {/* 血条 */}
          <div className="flex flex-col gap-1 w-32 md:w-48 bg-white/80 p-2 rounded-xl shadow-sm backdrop-blur-sm pointer-events-auto">
            <div className="flex justify-between text-sm font-bold text-gray-700">
              <span>HP</span>
              <span>{health}/{maxHealth}</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-200"
                style={{ width: `${(health / maxHealth) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* 时间 */}
          <div className="text-2xl font-black text-slate-700 bg-white/80 px-6 py-2 rounded-2xl shadow-sm backdrop-blur-sm">
             {Math.floor(time / 60).toString().padStart(2, '0')}:{(time % 60).toString().padStart(2, '0')}
          </div>

          {/* 资金 */}
          <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-xl shadow-sm backdrop-blur-sm pointer-events-auto">
             <div className="w-4 h-4 bg-emerald-400 rotate-45 rounded-sm shadow-inner"></div>
             <span className="text-xl font-bold text-slate-700">{money}</span>
          </div>
        </div>
      )}

      {/* 居中提示 */}
      {waveMsg && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-2xl font-bold text-slate-700 bg-white/80 px-6 py-3 rounded-full shadow-lg animate-pulse pointer-events-none">
          {waveMsg}
        </div>
      )}

      {/* 底部建造栏 */}
      {gameState === 'PLAYING' && (
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg pointer-events-auto">
           {Object.values(TOWER_TYPES).map(tower => (
             <div 
                key={tower.id}
                onClick={() => setSelectedTower(selectedTower?.id === tower.id ? null : tower)}
                className={`relative flex flex-col items-center p-2 rounded-xl cursor-pointer transition-all border-2
                  ${money < tower.cost ? 'opacity-50 grayscale' : 'hover:-translate-y-1'}
                  ${selectedTower?.id === tower.id ? 'border-blue-500 bg-blue-50 scale-105' : 'border-transparent bg-white'}
                `}
             >
                <div 
                  className="w-10 h-10 mb-1 flex items-center justify-center rounded-lg shadow-inner"
                  style={{ backgroundColor: tower.color }}
                >
                  {/* 简单的图标表示 */}
                  {tower.shape === 'circle' && <div className="w-4 h-4 bg-white/80 rounded-full"></div>}
                  {tower.shape === 'square' && <div className="w-4 h-4 bg-white/80 rounded-sm"></div>}
                  {tower.shape === 'triangle' && <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-white/80"></div>}
                </div>
                <span className="text-xs font-bold text-slate-700">{tower.name}</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-400 rotate-45"></div> {tower.cost}
                </span>
                
                {/* 选中时的提示文字 */}
                {selectedTower?.id === tower.id && (
                  <div className="absolute -top-10 whitespace-nowrap bg-slate-800 text-white text-xs px-2 py-1 rounded animate-fade-in-up">
                    点击空地建造
                  </div>
                )}
             </div>
           ))}
         </div>
      )}

      {/* 开始/结束屏幕 */}
      {gameState !== 'PLAYING' && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full mx-4 transform transition-all">
            <h1 className="text-4xl font-black text-slate-800 mb-2">
              {gameState === 'START' ? '吸血鬼塔防' : '防线崩溃'}
            </h1>
            <p className="text-slate-500 mb-8 font-medium">
              {gameState === 'START' 
                ? '移动角色自动射击。收集水晶，在地图上布置你的防御塔阵地。' 
                : `你生存了 ${Math.floor(time / 60)}分${time % 60}秒`}
            </p>
            
            <button 
              onClick={initGame}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:translate-y-0"
            >
              {gameState === 'START' ? '开始游戏' : '重新挑战'}
            </button>

            <div className="mt-6 text-xs text-slate-400 text-left bg-slate-50 p-4 rounded-xl">
              <strong>控制说明：</strong><br/>
              💻 电脑：WASD/方向键移动，鼠标点击底部卡牌后点击空地建造。<br/>
              📱 手机：左侧屏幕拖动摇杆移动，点击卡牌后点击空地建造。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}