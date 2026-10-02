const round = value => Math.round((Number(value) || 0) * 100) / 100;
const countTypes = items => items.reduce((counts, item) => {
  const key = item.id ?? item.type ?? 'unknown'; counts[key] = (counts[key] ?? 0) + 1; return counts;
}, {});

export function createPlaytestTelemetry({ now = () => Date.now(), eventLimit = 20000, sampleLimit = 3600 } = {}) {
  let data = null, lastSample = -Infinity, lastInput = '', lastInputTime = -Infinity, lastMoney = 0;
  let enemies = new Map(), towers = new Map(), identities = new WeakMap(), nextId = 1;
  const id = object => { if (!identities.has(object)) identities.set(object, nextId++); return identities.get(object); };
  const stamp = state => ({ timestamp: new Date(now()).toISOString(), wallSeconds: round((now() - data.startedAtMs) / 1000), battleSeconds: round(state.gameTime), wave: state.wave.number });
  const wave = state => data.waves[state.wave.number] ??= { wave: state.wave.number, spawned: {}, defeated: {}, towerBuilt: {}, towerLost: {}, damageToPlayer: 0, damageToTowers: 0, damageToEnemies: 0, damageToBosses: 0, maxBossNoDamageSeconds: 0, moneyChanges: {}, movingSeconds: 0, stationarySeconds: 0, bossOffscreenSeconds: 0, noNearbyEnemySeconds: 0, distanceMoved: 0 };
  const append = (list, item, limit, key) => {
    if (list.length >= limit) { list.shift(); data.truncation[key]++; }
    list.push(item);
  };
  function event(state, type, detail = {}) {
    if (!data || data.endedAt) return;
    append(data.events, { ...detail, ...(detail.type ? { entityType: detail.type } : {}), ...stamp(state), type }, eventLimit, 'eventsDropped');
  }
  function syncEntities(state) {
    if (!data || data.endedAt) return;
    const nextEnemies = new Map(), nextTowers = new Map();
    for (const enemy of state.enemies) {
      const uid = id(enemy); const previous = enemies.get(uid);
      const item = { uid, type: enemy.id ?? 'unknown', boss: Boolean(enemy.isBoss), mechanism: Boolean(enemy.mechanic), x: round(enemy.x), y: round(enemy.y), hp: round(enemy.hp), maxHp: enemy.maxHp, phase: enemy.currentPhaseIndex ?? null, action: enemy.bossState?.actionMode ?? null, ability: enemy.bossState?.castAbility ?? null };
      nextEnemies.set(uid, item);
      if (!previous) { const w = wave(state); w.spawned[item.type] = (w.spawned[item.type] ?? 0) + 1; event(state, 'enemy_spawn', item); }
      else if (item.boss && (item.phase !== previous.phase || item.action !== previous.action)) event(state, 'boss_state', item);
    }
    for (const [uid, old] of enemies) if (!nextEnemies.has(uid)) {
      // Removal is not always a kill: sacrifices, cleanup and escaped couriers are separate cases.
      event(state, 'enemy_removed', { ...old, outcome: 'removed-not-confirmed-kill' });
    }
    for (const tower of state.towers) {
      const uid = id(tower), item = { uid, type: tower.id, x: round(tower.x), y: round(tower.y), hp: round(tower.hp), level: tower.level ?? 0 };
      nextTowers.set(uid, item);
      if (!towers.has(uid)) { const w = wave(state); w.towerBuilt[item.type] = (w.towerBuilt[item.type] ?? 0) + 1; event(state, 'tower_created', item); }
    }
    for (const [uid, old] of towers) if (!nextTowers.has(uid)) {
      const w = wave(state); w.towerLost[old.type] = (w.towerLost[old.type] ?? 0) + 1;
      event(state, 'tower_removed', { ...old, outcome: state.mode === 'debug' ? 'debug-or-destroyed' : 'destroyed' });
    }
    enemies = nextEnemies; towers = nextTowers;
  }
  function sample(state, viewport, force = false) {
    if (!data || (!force && state.gameTime - lastSample < 2)) return;
    lastSample = state.gameTime;
    const visible = enemy => Math.abs(enemy.x - state.camera.x) <= viewport.width / 2 + enemy.radius && Math.abs(enemy.y - state.camera.y) <= viewport.height / 2 + enemy.radius;
    const nearby = state.enemies.filter(e => Math.hypot(e.x - state.player.x, e.y - state.player.y) <= state.player.range + e.radius);
    const snapshot = { ...stamp(state), viewport, player: { x: round(state.player.x), y: round(state.player.y), hp: round(state.player.hp), slow: round(state.player.slowTimer), range: state.player.range }, camera: { x: round(state.camera.x), y: round(state.camera.y) }, money: state.money,
      enemies: { total: state.enemies.length, visible: state.enemies.filter(visible).length, nearPlayer: nearby.length, byType: countTypes(state.enemies), queued: state.wave.queue.length, bossSpawned: state.wave.bossSpawned, positions: state.enemies.map(e => ({ uid: id(e), type: e.id, x: round(e.x), y: round(e.y), hp: round(e.hp), boss: Boolean(e.isBoss), mechanism: e.mechanic?.kind })) },
      bosses: state.enemies.filter(e => e.isBoss).map(e => ({ uid: id(e), type: e.id, x: round(e.x), y: round(e.y), hp: round(e.hp), maxHp: e.maxHp, phase: e.currentPhaseIndex, action: e.bossState?.actionMode, visible: visible(e), distance: round(Math.hypot(e.x - state.player.x, e.y - state.player.y)) })),
      towers: { total: state.towers.length, byType: countTypes(state.towers), instances: state.towers.map(t => ({ uid: id(t), type: t.id, x: round(t.x), y: round(t.y), hp: round(t.hp), level: t.level ?? 0 })) },
      drops: { count: state.drops.length, value: state.drops.reduce((sum, d) => sum + d.value, 0) }, hazards: state.hazards.map(h => ({ type: h.type, x: round(h.x), y: round(h.y), x2: h.x2, y2: h.y2, radius: h.radius, width: h.width, delay: h.delay, timer: h.timer, terrain: Boolean(h.terrain) })),
      blueprints: state.towerCatalog.filter(t => t.available).map(t => ({ type: t.id, level: t.level ?? 0, cost: t.cost })) };
    append(data.samples, snapshot, sampleLimit, 'samplesDropped');
    wave(state).latest = snapshot;
  }
  return {
    start(state, metadata) {
      identities = new WeakMap(); nextId = 1; enemies = new Map(); towers = new Map(); lastSample = -Infinity; lastInput = ''; lastInputTime = -Infinity; lastMoney = state.money;
      data = { schema: 'geoguard-human-playtest-v1', sessionId: metadata.sessionId, build: metadata.build, startedAt: new Date(now()).toISOString(), startedAtMs: now(), mode: state.mode, metadata, endedAt: null, outcome: 'in-progress', truncation: { eventsDropped: 0, samplesDropped: 0 }, performance: { frames: 0, wallFrameSeconds: 0, over50ms: 0, maxFrameSeconds: 0 }, waves: {}, events: [], samples: [] };
      event(state, 'session_start', { initialMoney: state.money, initialHp: state.player.hp });
    }, event, syncEntities, sample,
    money(state, source = 'runtime-unclassified') {
      if (!data || data.endedAt) return;
      const delta = state.money - lastMoney; lastMoney = state.money;
      if (delta) { const w = wave(state); w.moneyChanges[source] = round((w.moneyChanges[source] ?? 0) + delta); event(state, 'money_change', { source, delta, balance: state.money }); }
    },
    damage(state, target, hpDamage, shieldDamage = 0, source = 'unclassified') {
      if (!data || data.endedAt || (hpDamage <= 0 && shieldDamage <= 0)) return;
      const kind = target === state.player ? 'player' : state.towers.includes(target) ? 'tower' : 'enemy';
      const w = wave(state), key = { player: 'damageToPlayer', tower: 'damageToTowers', enemy: 'damageToEnemies' }[kind];
      w[key] += hpDamage;
      if (target.isBoss && hpDamage > 0) { w.damageToBosses += hpDamage; w.lastBossDamageAt = state.gameTime; }
      if (kind !== 'enemy') event(state, 'damage', { target: kind, uid: id(target), targetType: target.id, hpDamage: round(hpDamage), shieldDamage: round(shieldDamage), source, hpAfter: round(target.hp), x: round(target.x), y: round(target.y), nearbyEnemies: state.enemies.filter(e => Math.hypot(e.x - target.x, e.y - target.y) < 220).length });
    },
    defeated(state, enemy) { if (!data || data.endedAt) return; if (enemy.consumed) { event(state, 'enemy_consumed', { uid: id(enemy), enemyType: enemy.id }); return; } const w = wave(state); w.defeated[enemy.id] = (w.defeated[enemy.id] ?? 0) + 1; event(state, 'enemy_defeated', { uid: id(enemy), enemyType: enemy.id, boss: Boolean(enemy.isBoss) }); },
    frameTiming(seconds) { if (!data || data.endedAt) return; const p = data.performance; p.frames++; p.wallFrameSeconds += seconds; if (seconds > 0.05) p.over50ms++; p.maxFrameSeconds = Math.max(p.maxFrameSeconds, seconds); },
    frame(state, dt, input, previousPosition, viewport) {
      if (!data || data.endedAt) return;
      syncEntities(state); const w = wave(state);
      w.distanceMoved += Math.hypot(state.player.x - previousPosition.x, state.player.y - previousPosition.y);
      w[Math.hypot(input.x, input.y) > 0 ? 'movingSeconds' : 'stationarySeconds'] += dt;
      const isVisible = e => Math.abs(e.x - state.camera.x) <= viewport.width / 2 + e.radius && Math.abs(e.y - state.camera.y) <= viewport.height / 2 + e.radius;
      const bosses = state.enemies.filter(e => e.isBoss && e.hp > 0);
      if (bosses.length) { w.bossStartedAt ??= state.gameTime; w.maxBossNoDamageSeconds = Math.max(w.maxBossNoDamageSeconds, state.gameTime - (w.lastBossDamageAt ?? w.bossStartedAt)); }
      if (bosses.length && !bosses.some(isVisible)) w.bossOffscreenSeconds += dt;
      if (!state.enemies.some(e => e.hp > 0 && Math.hypot(e.x - state.player.x, e.y - state.player.y) <= state.player.range + e.radius)) w.noNearbyEnemySeconds += dt;
      const token = `${round(input.x)},${round(input.y)},${input.device}`;
      if (token !== lastInput && state.gameTime - lastInputTime >= 0.1) { event(state, 'movement_input', { ...input, x: round(input.x), y: round(input.y) }); lastInput = token; lastInputTime = state.gameTime; }
      this.money(state); sample(state, viewport);
    },
    end(state, outcome, viewport) { if (!data || data.endedAt) return; syncEntities(state); sample(state, viewport, true); event(state, 'session_end', { outcome }); data.outcome = outcome; data.endedAt = new Date(now()).toISOString(); data.final = { ...stamp(state), hp: round(state.player.hp), money: state.money }; },
    export(state, viewport) {
      if (!data) return null;
      if (!data.endedAt) { syncEntities(state); sample(state, viewport, true); }
      return JSON.parse(JSON.stringify({ ...data, exportedAt: new Date(now()).toISOString(), coverage: { sampleIntervalSeconds: 2, movementChangeMinimumSeconds: 0.1, damageSource: 'runtime-context-not-exact-ability', replay: false }, current: data.final ?? { ...stamp(state), hp: round(state.player.hp), money: state.money } }));
    },
  };
}
