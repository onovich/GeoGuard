import { COLORS } from '../../data/gameConfig.js';
import { findNearestTarget } from './gameRules.js';
import { dist } from './gameMath.js';

export const createProjectile = (x, y, angle, speed, damage, extras = {}) => ({
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

export const getTowerFireRateFactor = (state, tower) => {
  let factor = tower.frozenTimer > 0 ? 999 : 1;
  for (const enemy of state.enemies) {
    if (enemy.jamAura && dist(enemy, tower) <= enemy.jamAura.range) {
      factor = Math.max(factor, enemy.jamAura.fireRateFactor);
    }
  }
  return factor;
};

export const updatePlayerOffenseRuntime = ({ state, dt }) => {
  state.player.lastShoot += dt;
  if (state.player.lastShoot < state.player.shootCd) {
    return;
  }

  const target = findNearestTarget(state.player, state.enemies, state.player.range);
  if (!target) {
    return;
  }

  const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x);
  state.projectiles.push(createProjectile(state.player.x, state.player.y, angle, 400, state.player.damage, { kind: 'basic', radius: 4 }));
  state.player.lastShoot = 0;
};

export const updateTowerOffenseRuntime = ({ state, dt, spawnParticle }) => {
  for (let towerIndex = state.towers.length - 1; towerIndex >= 0; towerIndex -= 1) {
    const tower = state.towers[towerIndex];
    tower.frozenTimer = Math.max(0, (tower.frozenTimer ?? 0) - dt);
    tower.lastShoot += dt;
    if (tower.hp <= 0) {
      spawnParticle(tower.x, tower.y, tower.color, 30, 80);
      state.towers.splice(towerIndex, 1);
      continue;
    }

    if (tower.lastShoot >= tower.fireRate * getTowerFireRateFactor(state, tower)) {
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
};
