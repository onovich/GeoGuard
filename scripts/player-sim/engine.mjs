import { createRuntimeState } from '../../src/logic/engine/gameState.js';
import { advanceWaveTickRuntime, createWaveSpawnPlan, startWaveRuntime } from '../../src/logic/engine/waveFlowRuntime.js';
import { applyWaveSpawnPlanRuntime, spawnEnemyRuntimeAt, spawnEnemyGroupRuntime } from '../../src/logic/engine/entitySpawnRuntime.js';
import { getBossOwnership } from '../../src/logic/engine/encounterRuntime.js';
import { tickBossCombatRuntime, enrageTwinRuntime } from '../../src/logic/engine/bossCombatRuntime.js';
import { runBossOptimizedAbility } from '../../src/logic/engine/bossOptimizedAbilities.js';
import { updateEnemyBehaviorRuntime } from '../../src/logic/engine/enemyBehaviorRuntime.js';
import { updatePlayerOffenseRuntime, updateTowerOffenseRuntime } from '../../src/logic/engine/combatOffenseRuntime.js';
import { updateHazardRuntime, updateProjectileRuntime, updateDropRuntime } from '../../src/logic/engine/combatFrameRuntime.js';
import { createAreaHazard, createLineHazard, tickPlayerControl, movePlayerOnBattlefield } from '../../src/logic/engine/battlefieldRules.js';
import { resolveEnemyDamage, resolveTargetDamage, getAreaDamageHits } from '../../src/logic/engine/combatRules.js';
import { settleEnemyDefeatRuntime, settlePendingBossRewardRuntime } from '../../src/logic/engine/enemyDefeatRuntime.js';
import { openBossRewardRuntime, applyRewardChoiceRuntime } from '../../src/logic/engine/rewardFlowRuntime.js';
import { evaluateTowerPlacement } from '../../src/logic/engine/placementRules.js';
import { createPlacedTower } from '../../src/logic/engine/debugTowerRuntime.js';
import { buildBossHudRuntime } from '../../src/logic/engine/bossHudRuntime.js';
import { MECHANIC_LABELS } from '../../src/data/bossMechanics.js';

export const PLAYER_PROFILES = {
  novice: { reaction: 0.7, buildTime: 1.2, width: 1280, height: 800 },
  builder: { reaction: 0.4, buildTime: 0.9, width: 1280, height: 800 },
  mobile: { reaction: 0.3, buildTime: 1.1, width: 390, height: 844 },
};
const seedCases = { A: 20261001, B: 7, C: 314159 };
const noop = () => {};
const round = (value, places = 1) => Number(value.toFixed(places));
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// Clip the rendered line before exposing it: off-screen endpoints are not player knowledge.
export const clipScreenLine = (line, width, height) => {
  let lo = 0, hi = 1;
  const dx = line.x2 - line.x, dy = line.y2 - line.y;
  for (const [p, q] of [[-dx, line.x], [dx, width - line.x], [-dy, line.y], [dy, height - line.y]]) {
    if (!p && q < 0) return null;
    if (!p) continue;
    const t = q / p;
    if (p < 0) lo = Math.max(lo, t); else hi = Math.min(hi, t);
    if (lo > hi) return null;
  }
  return { x: round(line.x + dx * lo), y: round(line.y + dy * lo),
    x2: round(line.x + dx * hi), y2: round(line.y + dy * hi) };
};

export const createPlayerSimulation = ({ profile = 'novice', scenario = 'A', viewport = 'default', maxSeconds = 900 } = {}) => {
  if (!PLAYER_PROFILES[profile] || !Object.hasOwn(seedCases, scenario)) throw new Error('Unknown player profile or scenario');
  if (!['default', 'desktop', 'mobile'].includes(viewport)) throw new Error('Unknown viewport');
  const timing = PLAYER_PROFILES[profile];
  const size = viewport === 'desktop' ? PLAYER_PROFILES.novice : viewport === 'mobile' ? PLAYER_PROFILES.mobile : timing;
  const { width, height } = size;
  const state = createRuntimeState();
  state.isMobile = width < 768;
  startWaveRuntime({ state, waveNumber: 1 });
  let seed = seedCases[scenario], status = 'playing', rewards = null, channel = 'unknown', pickupRestore = 0;
  let runtimeMs = 0, actions = 0, maxCompletedWave = 0;
  let recentEvents = [];
  const metrics = { towersBuilt: 0, towersLost: 0, buildRejected: 0, moneyCollected: 0, bountyEarned: 0,
    playerDamage: {}, rewardChoices: [], waves: [], actions: 0 };
  const trace = [];
  const withRandom = (fn) => {
    const previous = Math.random;
    Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    try { return fn(); } finally { Math.random = previous; }
  };
  const event = (message) => { recentEvents.push({ at: round(state.gameTime), message }); recentEvents = recentEvents.slice(-12); };
  const screenPoint = (entity) => ({ x: round(entity.x - state.camera.x + width / 2), y: round(entity.y - state.camera.y + height / 2) });
  const isVisible = (entity, radius = entity.radius ?? 0) => {
    const point = screenPoint(entity);
    return point.x + radius >= 0 && point.y + radius >= 0 && point.x - radius <= width && point.y - radius <= height;
  };
  const spawnAround = (source, enemyKey, count, radius, options) => spawnEnemyGroupRuntime({ state, source, enemyKey, count, radius, options });
  const damageTarget = (target, amount) => {
    const applied = resolveTargetDamage({ targetHp: target.hp, amount }); target.hp = applied.hp;
    if (target === state.player) metrics.playerDamage[channel] = (metrics.playerDamage[channel] ?? 0) + applied.appliedDamage;
  };
  const damageEnemy = (enemy, amount) => {
    const result = resolveEnemyDamage(enemy, amount); enemy.hp = result.hp; enemy.shield = result.shield;
  };
  const queueAreaHazard = (x, y, options) => state.hazards.push(createAreaHazard(state.player, x, y, options));
  const queueLineHazard = (source, target, options) => state.hazards.push(createLineHazard(source, target, options));
  const damageArea = (x, y, radius, amount, options = {}) => {
    const hits = getAreaDamageHits({ origin: { x, y }, radius, player: state.player, towers: state.towers, amount, towerFactor: options.towerFactor ?? 1 });
    if (hits.playerHit) damageTarget(state.player, amount);
    for (const hit of hits.towerHits) damageTarget(state.towers[hit.index], hit.damage);
  };
  const openBossReward = () => {
    if (rewards?.active) return;
    rewards = openBossRewardRuntime({ state, catalog: state.towerCatalog, currentWave: state.wave.number });
    maxCompletedWave = Math.max(maxCompletedWave, state.wave.number);
    metrics.waves.push({ wave: state.wave.number, at: round(state.gameTime), hp: round(state.player.hp), money: state.money, towers: state.towers.length });
    event('Boss 击败，选择奖励；战斗暂停');
  };
  const runAbility = (boss, abilityName) => runBossOptimizedAbility({ state, boss, abilityName, spawnAround, queueAreaHazard, queueLineHazard,
    damageTarget, damageArea, spawnImpactWave: noop, spawnFloatingText: noop, syncHudMoney: noop,
    spawnEnemyAt: (enemyKey, x, y, extras) => spawnEnemyRuntimeAt({ state, enemyKey, x, y, extras }), getBossOwnership,
    getEncounterPartner: (source) => state.enemies.find((enemy) => enemy.isBoss && enemy.hp > 0 && enemy.uid !== source.uid && enemy.encounterUid === source.encounterUid) });

  const step = (dx, dy) => {
    if (status !== 'playing' || rewards?.active) return;
    const dt = 1 / 60; state.gameTime += dt;
    if (pickupRestore > 0) { pickupRestore -= dt; if (pickupRestore <= 0) state.player.radius = 12; }
    tickPlayerControl(state.player, dt);
    movePlayerOnBattlefield({ player: state.player, enemies: state.enemies, dx, dy, dt });
    state.camera.x += (state.player.x - state.camera.x) * 5 * dt;
    state.camera.y += (state.player.y - state.camera.y) * 5 * dt;
    updatePlayerOffenseRuntime({ state, dt });
    const towerCount = state.towers.length;
    updateTowerOffenseRuntime({ state, dt, spawnParticle: noop });
    metrics.towersLost += towerCount - state.towers.length;
    const waveTick = advanceWaveTickRuntime({ state, dt });
    const plan = createWaveSpawnPlan({ waveTick, camera: state.camera, viewportWidth: width, viewportHeight: height });
    const spawnResult = applyWaveSpawnPlanRuntime({ state, spawnPlan: plan });
    if (spawnResult.bosses.length) event(`Boss 出现：${spawnResult.bossSpotlightTemplate.name}`);
    channel = 'enemy-contact-or-ability';
    for (let index = state.enemies.length - 1; index >= 0; index--) {
      const enemy = state.enemies[index];
      const update = updateEnemyBehaviorRuntime({ state, enemy, dt, spawnAround, queueAreaHazard, damageTarget, damageArea,
        spawnImpactWave: noop, spawnParticle: noop, syncHudHealth: noop,
        updateBossBehavior: (boss, elapsed) => tickBossCombatRuntime({ state, boss, dt: elapsed, runAbility }) });
      if (update.continueLoop) continue;
      const wasDeadBoss = enemy.hp <= 0 && enemy.isBoss;
      settleEnemyDefeatRuntime({ state, enemy, enemyIndex: index, spawnParticle: noop, spawnAround, playBossDefeatCue: noop,
        syncHudMoney: noop, openBossReward, enrageEncounterPartner: (boss) => enrageTwinRuntime(state, boss) });
      if (wasDeadBoss) metrics.bountyEarned += enemy.value;
    }
    settlePendingBossRewardRuntime({ state, rewardActive: Boolean(rewards?.active), openBossReward });
    // Matches the UI frame's death check before projectile/drop/hazard resolution.
    if (state.player.hp <= 0) status = 'dead';
    updateProjectileRuntime({ state, dt, damageEnemy, spawnFloatingText: noop, spawnParticle: noop, spawnImpactWave: noop });
    const beforePickup = state.money;
    updateDropRuntime({ state, dt, syncHudMoney: noop, pulsePlayerPickupRadius: () => { pickupRestore = 0.05; } });
    metrics.moneyCollected += state.money - beforePickup;
    channel = 'telegraphed-hazard';
    updateHazardRuntime({ state, dt, damageTarget, spawnImpactWave: noop, syncHudHealth: noop });
    if (state.gameTime >= clamp(maxSeconds, 60, 1800)) status = 'time-limit';
  };
  const advance = (seconds, move = {}) => {
    let dx = Number(move.x) || 0, dy = Number(move.y) || 0;
    const norm = Math.hypot(dx, dy); if (norm > 1) { dx /= norm; dy /= norm; }
    for (let frame = 0; frame < Math.ceil(seconds * 60); frame++) {
      if (status !== 'playing' || rewards?.active) break;
      step(dx, dy);
    }
  };
  const observation = () => ({
    schema: 'geoguard-player-v1', status: rewards?.active && status === 'playing' ? 'reward' : status,
    viewport: { width, height }, elapsed: round(state.gameTime), wave: state.wave.number,
    controls: { reactionSeconds: timing.reaction, buildSeconds: timing.buildTime, movement: 'x/y in [-1,1], automatic shooting' },
    player: { ...screenPoint(state.player), radius: state.player.radius, hp: round(Math.max(0, state.player.hp)), maxHp: state.player.maxHp }, money: state.money,
    catalog: state.towerCatalog.filter((tower) => tower.available).map((tower) => ({ id: tower.id, name: tower.name, cost: tower.cost,
      level: tower.level, radius: tower.radius, description: tower.summary, damage: tower.damage, attackInterval: tower.fireRate, range: tower.range })),
    towers: state.towers.filter((tower) => isVisible(tower)).map((tower) => ({ uid: `tower-${tower.uid}`, name: tower.name,
      ...screenPoint(tower), radius: tower.radius, hpRatio: round(Math.max(0, tower.hp / tower.maxHp), 2) })),
    enemies: state.enemies.filter((enemy) => enemy.hp > 0 && isVisible(enemy)).map((enemy) => ({ uid: `seen-${enemy.uid}`,
      kind: enemy.isBoss ? 'boss' : enemy.mechanic ? 'object' : 'unit', ...screenPoint(enemy), radius: enemy.radius,
      color: enemy.color, label: enemy.isBoss ? enemy.name : enemy.mechanic ? MECHANIC_LABELS[enemy.mechanic.kind] : null,
      hpRatio: enemy.hp < enemy.maxHp ? round(Math.max(0, enemy.hp / enemy.maxHp), 2) : null,
      shieldVisible: enemy.shield > 0, faded: Boolean(enemy.phased), underground: Boolean(enemy.burrowed) })),
    drops: state.drops.filter((drop) => isVisible(drop)).map((drop) => ({ ...screenPoint(drop), radius: drop.radius })),
    hazards: state.hazards.flatMap((hazard) => {
      if (hazard.type === 'line') {
        const line = clipScreenLine({ ...screenPoint(hazard), ...(() => { const p = screenPoint({ x: hazard.x2, y: hazard.y2 }); return { x2: p.x, y2: p.y }; })() }, width, height);
        return line ? [{ type: 'line', ...line, width: hazard.width, charge: round(clamp(1 - hazard.timer / hazard.maxTimer, 0, 1), 2) }] : [];
      }
      return isVisible(hazard) ? [{ type: 'area', ...screenPoint(hazard), radius: hazard.radius,
        charge: round(clamp(1 - hazard.timer / hazard.maxTimer, 0, 1), 2) }] : [];
    }),
    bossHud: buildBossHudRuntime({ enemies: state.enemies }).map((group) => ({ title: group.title, counterplay: group.counterplay,
      members: group.members.map((member) => ({ name: member.name, hpRatio: round(member.hpRatio, 2), phase: member.phase,
        phaseNumber: member.phaseIndex + 1, phaseCount: member.phaseCount, action: member.actionLabel, guardCount: member.guardCount })) })),
    windups: state.enemies.filter((enemy) => enemy.hp > 0 && enemy.isBoss && enemy.bossState.actionMode === 'windup')
      .flatMap((boss) => { const p = boss.bossState.lockedTarget; if (!p) return []; const target = screenPoint(p);
        const line = clipScreenLine({ ...screenPoint(boss), x2: target.x, y2: target.y }, width, height);
        return line ? [{ ...line, charge: round(1 - boss.bossState.actionTimer / boss.bossState.windupDuration, 2) }] : []; }),
    rewards: rewards?.active ? rewards.choices.map((choice, index) => ({ index, title: choice.title, description: choice.subtitle,
      detail: choice.detail, type: choice.type, towerId: choice.towerId })) : [], events: [...recentEvents],
  });
  const summary = () => ({ profile, scenario, viewport: { width, height }, status,
    elapsed: round(state.gameTime), waveReached: state.wave.number, wavesCompleted: maxCompletedWave,
    hp: round(Math.max(0, state.player.hp)), money: state.money, towersRemaining: state.towers.length,
    ...metrics, playerDamage: Object.fromEntries(Object.entries(metrics.playerDamage).map(([key, value]) => [key, round(value)])),
    actions, computeMilliseconds: round(runtimeMs), simulatedSecondsPerComputeSecond: round(state.gameTime / Math.max(0.001, runtimeMs / 1000)) });
  const act = (action = {}) => {
    const started = performance.now();
    if (!['move', 'wait', 'build', 'reward', 'stop'].includes(action.type)) throw new Error('Unsupported player action');
    const before = observation(); let feedback = 'ok';
    withRandom(() => {
      if (action.type === 'stop') { status = 'stopped'; return; }
      if (status !== 'playing') { feedback = 'episode ended'; return; }
      if (action.type === 'reward') {
        if (!rewards?.active || !Number.isInteger(action.index) || !rewards.choices[action.index]) { feedback = 'invalid reward choice'; return; }
        const choice = rewards.choices[action.index];
        const result = applyRewardChoiceRuntime({ state, catalog: state.towerCatalog, choice, currentWave: state.wave.number });
        state.towerCatalog = result.catalog; state.money = result.money; state.player.hp = result.hp;
        metrics.rewardChoices.push({ wave: state.wave.number, title: choice.title });
        rewards = result.rewardState;
        startWaveRuntime({ state, waveNumber: result.followUp.waveNumber }); event(`进入第 ${state.wave.number} 波`);
        return;
      }
      if (rewards?.active) { feedback = 'choose a reward first'; return; }
      const duration = clamp(Number(action.seconds) || timing.reaction, timing.reaction, 3);
      if (action.type === 'build') {
        // Commit after the manual drag time. No instant building or free micro-placement attempts.
        advance(Math.max(duration, timing.buildTime));
        const tower = state.towerCatalog.find((candidate) => candidate.available && candidate.id === action.towerId);
        const x = Number(action.x), y = Number(action.y);
        if (status !== 'playing' || rewards?.active) { feedback = 'build interrupted'; return; }
        if (!tower || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > width || y < 0 || y > height - 130) {
          feedback = 'unavailable tower or outside build area'; metrics.buildRejected++; return;
        }
        const placement = evaluateTowerPlacement({ tower, clientX: x, clientY: y, camera: state.camera,
          viewportWidth: width, viewportHeight: height, player: state.player, towers: state.towers, enemies: state.enemies,
          money: state.money, infiniteMoney: false, invalidPlacementText: '位置与角色、塔或敌人重叠', insufficientFundsText: '资金不足' });
        if (!placement.canPlace) { feedback = placement.invalidReason; metrics.buildRejected++; return; }
        state.money -= tower.cost;
        state.towers.push(createPlacedTower({ tower, uid: state.nextTowerUid++, ...placement.worldPoint }));
        metrics.towersBuilt++; event(`建造 ${tower.name}`);
      } else advance(duration, action.type === 'move' ? action.move : {});
    });
    actions++; metrics.actions = actions; runtimeMs += performance.now() - started;
    const after = observation();
    trace.push({ action: JSON.parse(JSON.stringify(action)), at: after.elapsed, wave: after.wave, hp: after.player.hp,
      money: after.money, feedback, visibleEnemies: after.enemies.length, visibleHazards: after.hazards.length,
      boss: after.bossHud.map((group) => group.title), hpChange: round(after.player.hp - before.player.hp) });
    return { feedback, observation: after, ...(status !== 'playing' ? { debrief: summary() } : {}) };
  };
  return { observe: observation, act, debrief: () => { if (status === 'playing') throw new Error('Debrief is available after episode ends'); return summary(); },
    exportAudit: () => ({ summary: summary(), trace }) };
};
