import { COLORS } from '../../data/gameConfig.js';
import { dist } from './gameMath.js';

export const updateEnemyBehaviorRuntime = ({
  state,
  enemy,
  dt,
  spawnAround,
  spawnImpactWave,
  updateBossBehavior,
  damageTarget,
  damageArea,
  spawnParticle,
  syncHudHealth,
}) => {
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
      return { continueLoop: true };
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

  return { continueLoop: false };
};
