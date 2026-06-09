import { COLORS } from '../../data/gameConfig.js';
import { getPulledPosition, isLineHazardHit, isTargetWithinArea } from './combatRules.js';
import { dist } from './gameMath.js';

export const updateProjectileRuntime = ({
  state,
  dt,
  damageEnemy,
  spawnFloatingText,
  spawnParticle,
  spawnImpactWave,
}) => {
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
};

export const updateDropRuntime = ({ state, dt, syncHudMoney, pulsePlayerPickupRadius }) => {
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
        pulsePlayerPickupRadius();
        state.drops.splice(dropIndex, 1);
      }
    }
  }
};

export const updateTransientVisualRuntime = ({ state, dt }) => {
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

export const updateHazardRuntime = ({ state, dt, damageTarget, spawnImpactWave, syncHudHealth }) => {
  for (let hazardIndex = state.hazards.length - 1; hazardIndex >= 0; hazardIndex -= 1) {
    const hazard = state.hazards[hazardIndex];
    hazard.timer -= dt;
    if (hazard.timer > 0) continue;

    if (hazard.type === 'area') {
      if (isTargetWithinArea(hazard, hazard.radius, state.player)) {
        damageTarget(state.player, hazard.damage);
        const pulledPlayerPosition = getPulledPosition({ target: state.player, hazard });
        state.player.x = pulledPlayerPosition.x;
        state.player.y = pulledPlayerPosition.y;
      }
      syncHudHealth();
      for (const tower of state.towers) {
        const towerHit = isTargetWithinArea(hazard, hazard.radius, tower);
        if (towerHit) {
          damageTarget(tower, hazard.damage);
          const pulledTowerPosition = getPulledPosition({ target: tower, hazard });
          tower.x = pulledTowerPosition.x;
          tower.y = pulledTowerPosition.y;
        }
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

    if (isLineHazardHit({ hazard, target: state.player })) {
      damageTarget(state.player, hazard.damage);
      syncHudHealth();
    }
    for (const tower of state.towers) {
      if (isLineHazardHit({ hazard, target: tower })) damageTarget(tower, hazard.damage);
    }
    spawnImpactWave(hazard.x2, hazard.y2, { maxRadius: 36, color: hazard.color, fillAlpha: 0.08, life: 0.18 });
    state.hazards.splice(hazardIndex, 1);
  }
};
