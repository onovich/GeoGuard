import { seededRandom, withRandom } from './snapshot.mjs';

// Imports are injected so exactly the same QA driver runs fixed baseline and candidate.
export async function loadEngine(importer) {
  const paths = {
    config: 'data/gameConfig.js', state: 'logic/engine/gameState.js', spawn: 'logic/engine/entitySpawnRuntime.js',
    encounter: 'logic/engine/encounterRuntime.js', combat: 'logic/engine/bossCombatRuntime.js', ability: 'logic/engine/bossOptimizedAbilities.js',
    behavior: 'logic/engine/enemyBehaviorRuntime.js', battlefield: 'logic/engine/battlefieldRules.js',
    frame: 'logic/engine/combatFrameRuntime.js', offense: 'logic/engine/combatOffenseRuntime.js',
    rules: 'logic/engine/combatRules.js', mechanics: 'logic/engine/bossMechanicEntities.js',
    towers: 'logic/engine/debugTowerRuntime.js', levels: 'logic/engine/towerRules.js', wave: 'logic/engine/gameRules.js',
  };
  return Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, value]) => [key, await importer(value)])));
}

export function createScene(engine, { kind = 'density', bossId = 'TWINS', seed = 20261001, phaseSeconds = 12, offense = false } = {}) {
  const random = seededRandom(seed), state = engine.state.createRuntimeState();
  state.player.x = 160; state.player.y = 100; state.money = 100;
  const casts = [], hits = [];
  const noop = () => {};
  let bosses = [];
  withRandom(random, () => {
    state.towers = engine.config.TOWER_ORDER.map((id, i) => {
      const template = state.towerCatalog.find(t => t.id === id);
      const tower = engine.levels.buildTowerAtLevel(template, i % 4);
      return engine.towers.createPlacedTower({ tower, uid: state.nextTowerUid++, x: -250 + (i % 5) * 105, y: 100 + Math.floor(i / 5) * 95 });
    });
    if (kind === 'density' || kind === 'catalog') {
      const keys = kind === 'catalog' ? Object.keys(engine.config.ENEMY_TYPES) : Array.from({ length: 24 }, (_, i) => i % 4 === 0 ? 'TANK' : 'BASIC');
      keys.forEach((enemyKey, i) => engine.spawn.spawnEnemyRuntimeAt({ state, enemyKey, x: -310 + (i % 8) * 82, y: -215 + Math.floor(i / 8) * 76, extras: { skipBurrowPosition: true } }));
      engine.offense.updateTowerOffenseRuntime({ state, dt: 3, spawnParticle: noop });
      engine.offense.updatePlayerOffenseRuntime({ state, dt: 3 });
      state.towers.forEach((t, i) => { if (i % 2) t.hp = Math.max(1, Math.floor(t.maxHp * 0.6)); });
    } else if (kind === 'boss') {
      bosses = engine.spawn.spawnBossEncounterRuntimeAt({ state, bossTemplate: engine.encounter.getBossEditorBaseTemplate(bossId), x: -120, y: -90 });
      state.player.hp = 10000;
      state.towers.forEach(t => { t.hp = 10000; });
    } else throw new Error(`Unknown QA scene ${kind}`);
  });
  const spawnAround = (source, enemyKey, count, radius, options) => engine.spawn.spawnEnemyGroupRuntime({ state, source, enemyKey, count, radius, options });
  const queueAreaHazard = (x, y, options) => state.hazards.push(engine.battlefield.createAreaHazard(state.player, x, y, options));
  const queueLineHazard = (source, target, options) => state.hazards.push(engine.battlefield.createLineHazard(source, target, options));
  const damageTarget = (target, amount) => { hits.push({ frameTime: state.gameTime, target: target === state.player ? 'player' : target.uid, amount }); target.hp -= amount; };
  const damageEnemy = (enemy, amount) => { hits.push({ frameTime: state.gameTime, enemy: enemy.uid, amount }); Object.assign(enemy, engine.rules.resolveEnemyDamage(enemy, amount)); };
  const damageArea = (x, y, radius, amount) => {
    for (const target of [state.player, ...state.towers]) if (Math.hypot(target.x - x, target.y - y) <= radius + target.radius) damageTarget(target, amount);
  };
  const runAbility = (boss, abilityName) => {
    casts.push({ time: state.gameTime, uid: boss.uid, phase: boss.currentPhaseIndex, abilityName });
    engine.ability.runBossOptimizedAbility({ state, boss, abilityName, spawnAround, queueAreaHazard, queueLineHazard, damageTarget, damageArea,
      spawnEnemyAt: (enemyKey, x, y, extras) => engine.spawn.spawnEnemyRuntimeAt({ state, enemyKey, x, y, extras }),
      getBossOwnership: engine.encounter.getBossOwnership,
      getEncounterPartner: source => bosses.find(b => b !== source && b.hp > 0), spawnImpactWave: noop, spawnFloatingText: noop, syncHudMoney: noop });
  };
  const step = dt => withRandom(random, () => {
    state.gameTime += dt;
    if (kind === 'boss') {
      const phaseIndex = Math.min(2, Math.floor(state.gameTime / phaseSeconds));
      for (const boss of bosses) {
        const phase = boss.phases[Math.min(phaseIndex, boss.phases.length - 1)];
        boss.hp = boss.maxHp * (phaseIndex ? Math.max(0.05, phase.hpBelow - 0.02) : 1);
      }
    }
    engine.battlefield.tickPlayerControl(state.player, dt);
    engine.battlefield.movePlayerOnBattlefield({ player: state.player, dx: Math.cos(state.gameTime * 0.6), dy: Math.sin(state.gameTime * 0.6), dt, enemies: state.enemies });
    for (const enemy of [...state.enemies]) engine.behavior.updateEnemyBehaviorRuntime({ state, enemy, dt, spawnAround, queueAreaHazard,
      updateBossBehavior: (boss, stepDt) => engine.combat.tickBossCombatRuntime({ state, boss, dt: stepDt, runAbility }),
      damageTarget, damageArea, spawnParticle: noop, spawnImpactWave: noop, syncHudHealth: noop });
    if (offense) {
      engine.offense.updatePlayerOffenseRuntime({ state, dt });
      engine.offense.updateTowerOffenseRuntime({ state, dt, spawnParticle: noop });
      engine.frame.updateProjectileRuntime({ state, dt, damageEnemy, spawnFloatingText: noop, spawnParticle: noop, spawnImpactWave: noop });
    }
    engine.frame.updateHazardRuntime({ state, dt, damageTarget, spawnImpactWave: noop, syncHudHealth: noop });
    for (let index = state.enemies.length - 1; index >= 0; index--) {
      if (state.enemies[index].hp > 0 || state.enemies[index].isBoss) continue;
      engine.mechanics.settleMechanicDefeatRuntime({ state, enemy: state.enemies[index] });
      state.enemies.splice(index, 1);
    }
    return state;
  });
  return { state, step, random, casts, hits, bosses,
    provenance: { kind, bossId: kind === 'boss' ? bossId : null, seed, phaseSeconds, offense,
      scope: 'constructed QA fixture using real exported engine; boss phase probe forces HP, no claim of normal economy or full gameplay reachability' } };
}
