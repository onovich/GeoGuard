import { COLORS } from '../../data/gameConfig.js';
import { dist } from './gameMath.js';
import { tickBossMechanicRuntime } from './bossMechanicEntities.js';

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
  queueAreaHazard,
}) => {
  if (enemy.hp <= 0) return { continueLoop: false };
  enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 5);
  enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
  enemy.armoredTimer = Math.max(0, (enemy.armoredTimer ?? 0) - dt);
  if (enemy.isBoss && enemy.bossState.phaseIntroTimer && !enemy.bossState.combatClockManaged) {
    enemy.bossState.phaseIntroTimer = Math.max(0, enemy.bossState.phaseIntroTimer - dt);
  }
  if (enemy.slowTimer <= 0) {
    enemy.slowRatio = 1;
  }
  if (enemy.mechanic) {
    tickBossMechanicRuntime({ state, enemy, dt, spawnAround, queueAreaHazard });
    return { continueLoop: false };
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
      if (otherEnemy !== enemy && otherEnemy.hp > 0 && !otherEnemy.isBoss && !otherEnemy.mechanic && dist(enemy, otherEnemy) <= enemy.healAura.range) {
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

  let movementTarget = target;
  if (enemy.isBoss && enemy.form === 'dragon' && enemy.bossState.actionMode === 'idle') {
    enemy.bossState.patrolAngle = (enemy.bossState.patrolAngle ?? 0) + dt * 0.7;
    movementTarget = { x: state.player.x + Math.cos(enemy.bossState.patrolAngle) * 240,
      y: state.player.y + Math.sin(enemy.bossState.patrolAngle) * 180 };
  }
  const angle = Math.atan2(movementTarget.y - enemy.y, movementTarget.x - enemy.x);
  const effectiveSpeed = enemy.baseSpeed * enemy.slowRatio;
  if (enemy.dashTimer > 0) {
    enemy.dashTimer -= dt;
    enemy.x += enemy.dashVx * dt;
    enemy.y += enemy.dashVy * dt;
  } else if (!enemy.isBoss || enemy.bossState.actionMode === 'idle') {
    enemy.x += Math.cos(angle) * effectiveSpeed * dt;
    enemy.y += Math.sin(angle) * effectiveSpeed * dt;
  }

  const contactActive = !enemy.isBoss || ['idle', 'attack'].includes(enemy.bossState.actionMode ?? 'idle');
  if (contactActive && target.hp > 0 && minDistance < enemy.radius + target.radius) {
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
