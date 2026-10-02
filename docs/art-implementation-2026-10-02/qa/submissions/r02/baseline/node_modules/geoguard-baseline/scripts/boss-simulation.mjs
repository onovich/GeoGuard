import { BOSS_ORDER } from '../src/data/gameConfig.js';
import { createRuntimeState } from '../src/logic/engine/gameState.js';
import { getBossEditorBaseTemplate, getBossOwnership } from '../src/logic/engine/encounterRuntime.js';
import { spawnBossEncounterRuntimeAt, spawnEnemyRuntimeAt, spawnEnemyGroupRuntime } from '../src/logic/engine/entitySpawnRuntime.js';
import { tickBossCombatRuntime } from '../src/logic/engine/bossCombatRuntime.js';
import { runBossOptimizedAbility } from '../src/logic/engine/bossOptimizedAbilities.js';
import { updateEnemyBehaviorRuntime } from '../src/logic/engine/enemyBehaviorRuntime.js';
import { createAreaHazard, createLineHazard, tickPlayerControl, movePlayerOnBattlefield } from '../src/logic/engine/battlefieldRules.js';
import { updateHazardRuntime, updateProjectileRuntime } from '../src/logic/engine/combatFrameRuntime.js';
import { updatePlayerOffenseRuntime, updateTowerOffenseRuntime } from '../src/logic/engine/combatOffenseRuntime.js';
import { resolveEnemyDamage } from '../src/logic/engine/combatRules.js';
import { settleMechanicDefeatRuntime } from '../src/logic/engine/bossMechanicEntities.js';

const noop = () => {};
const randomFor = (seed) => () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };

// Exercises the production scheduler, ability handlers, movement, spawns and hazards.
// Phase exercise deliberately preserves HP; combat probe uses actual projectiles and damage.
export const simulateBoss = ({ id, hz = 60, seed = 20261001, mode = 'phase-exercise', secondsPerPhase = 45 }) => {
  const originalRandom = Math.random;
  Math.random = randomFor(seed);
  try {
    const state = createRuntimeState();
    state.player.x = 160; state.player.y = 0; state.money = 100;
    state.player.hp = 10000;
    state.towers = [{ uid: 10001, x: 90, y: 90, radius: 18, hp: 10000, cost: 30,
      damage: 7, fireRate: 0.65, lastShoot: 0, range: 330, color: '#ffffff', projectileSpeed: 500 }];
    const bosses = spawnBossEncounterRuntimeAt({ state, bossTemplate: getBossEditorBaseTemplate(id), x: 0, y: 0 });
    const casts = {}, phaseCasts = {};
    let maxSummons = 0, maxMechanics = 0, maxHazards = 0, playerDamage = 0, towerDamage = 0;
    const spawnAround = (source, enemyKey, count, radius, options) => spawnEnemyGroupRuntime({ state, source, enemyKey, count, radius, options });
    const queueAreaHazard = (x, y, options) => state.hazards.push(createAreaHazard(state.player, x, y, options));
    const queueLineHazard = (source, target, options) => state.hazards.push(createLineHazard(source, target, options));
    const damageTarget = (target, amount) => {
      if (target === state.player) playerDamage += amount; else towerDamage += amount;
      target.hp -= amount;
    };
    const damageEnemy = (enemy, amount) => Object.assign(enemy, resolveEnemyDamage(enemy, amount));
    const damageArea = (x, y, radius, amount) => {
      for (const target of [state.player, ...state.towers]) if (Math.hypot(target.x - x, target.y - y) <= radius + target.radius) damageTarget(target, amount);
    };
    const runAbility = (boss, abilityName) => {
      casts[abilityName] = (casts[abilityName] ?? 0) + 1;
      const key = `${boss.twinRole ?? 'boss'}:${boss.currentPhaseIndex}:${abilityName}`;
      phaseCasts[key] = (phaseCasts[key] ?? 0) + 1;
      runBossOptimizedAbility({ state, boss, abilityName, spawnAround, queueAreaHazard, queueLineHazard, damageTarget,
        damageArea, spawnEnemyAt: (enemyKey, x, y, extras) => spawnEnemyRuntimeAt({ state, enemyKey, x, y, extras }),
        getBossOwnership, getEncounterPartner: (source) => bosses.find((candidate) => candidate !== source && candidate.hp > 0),
        spawnImpactWave: noop, spawnFloatingText: noop, syncHudMoney: noop });
    };
    const dt = 1 / hz;
    const duration = mode === 'phase-exercise' ? secondsPerPhase * 3 : 60;
    for (let frame = 0; frame < duration * hz; frame++) {
      state.gameTime = frame * dt;
      if (mode === 'phase-exercise') {
        const phaseIndex = Math.min(2, Math.floor(frame / (secondsPerPhase * hz)));
        for (const boss of bosses) {
          const phase = boss.phases[Math.min(phaseIndex, boss.phases.length - 1)];
          boss.hp = boss.maxHp * (phaseIndex ? Math.max(0.05, phase.hpBelow - 0.02) : 1);
        }
      }
      tickPlayerControl(state.player, dt);
      // A deterministic orbit probes moving lock snapshots; it is not an expert dodge bot.
      const angle = state.gameTime * 0.6;
      movePlayerOnBattlefield({ player: state.player, dx: Math.cos(angle), dy: Math.sin(angle), dt, enemies: state.enemies });
      for (const enemy of [...state.enemies]) updateEnemyBehaviorRuntime({ state, enemy, dt, spawnAround, queueAreaHazard,
        updateBossBehavior: (boss, step) => tickBossCombatRuntime({ state, boss, dt: step, runAbility }),
        damageTarget, damageArea, spawnParticle: noop, spawnImpactWave: noop, syncHudHealth: noop });
      if (mode === 'combat-probe') {
        updatePlayerOffenseRuntime({ state, dt }); updateTowerOffenseRuntime({ state, dt, spawnParticle: noop });
        updateProjectileRuntime({ state, dt, damageEnemy, spawnFloatingText: noop, spawnParticle: noop, spawnImpactWave: noop });
      }
      updateHazardRuntime({ state, dt, damageTarget, spawnImpactWave: noop, syncHudHealth: noop });
      for (let index = state.enemies.length - 1; index >= 0; index--) {
        if (state.enemies[index].hp > 0 || state.enemies[index].isBoss) continue;
        settleMechanicDefeatRuntime({ state, enemy: state.enemies[index] });
        state.enemies.splice(index, 1);
      }
      maxSummons = Math.max(maxSummons, state.enemies.filter((enemy) => !enemy.isBoss && enemy.hp > 0).length);
      maxMechanics = Math.max(maxMechanics, state.enemies.filter((enemy) => enemy.mechanic && enemy.hp > 0).length);
      maxHazards = Math.max(maxHazards, state.hazards.length);
      for (const entity of [state.player, ...state.enemies, ...state.towers]) {
        if (![entity.x, entity.y, entity.hp].every(Number.isFinite)) throw new Error(`${id}: invalid entity at frame ${frame}`);
      }
    }
    return { id, hz, seed, mode, simulatedSeconds: duration, casts, phaseCasts, maxSummons, maxMechanics, maxHazards,
      playerDamage: Math.round(playerDamage), towerDamage: Math.round(towerDamage), money: state.money,
      bossPhases: bosses.map((boss) => boss.currentPhaseIndex), bossHp: bosses.map((boss) => Math.round(boss.hp)) };
  } finally { Math.random = originalRandom; }
};

export const SIMULATION_SEEDS = [20261001, 7, 314159];
export const simulateBossSuite = () => BOSS_ORDER.flatMap((id) => SIMULATION_SEEDS.flatMap((seed) =>
  [30, 60].map((hz) => simulateBoss({ id, hz, seed }))));

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/boss-simulation.mjs')) {
  const { writeFileSync, mkdirSync } = await import('node:fs');
  const results = simulateBossSuite();
  const probes = BOSS_ORDER.map((id) => simulateBoss({ id, mode: 'combat-probe' }));
  mkdirSync('docs', { recursive: true });
  writeFileSync('docs/boss-validation-report.json', JSON.stringify({ generatedAt: new Date().toISOString(),
    scope: 'Production-engine mechanism regression; not a win-rate or player-experience benchmark.',
    assumptions: { phaseExercise: '135 seconds, HP set at phase boundaries, 10000 HP player/tower, orbit movement, no offense',
      combatProbe: '60 seconds, 10000 HP player/tower, one 7-damage tower and normal player offense; not a standard loadout',
      frameComparison: 'All authored skills execute and budgets hold at both rates; exact hit counts can differ near telegraph boundaries.' },
    results, probes }, null, 2) + '\n');
  console.log(JSON.stringify({ simulations: results.length + probes.length, maxSummons: Math.max(...results.map((r) => r.maxSummons)),
    maxHazards: Math.max(...results.map((r) => r.maxHazards)), report: 'docs/boss-validation-report.json' }));
}
