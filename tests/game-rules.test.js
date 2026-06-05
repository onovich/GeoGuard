import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialTowerCatalog } from '../src/data/gameConfig.js';
import { WAVE_TABLE } from '../src/data/waveTable.js';
import { canPlaceTowerOnField, createWaveDefinition } from '../src/logic/engine/gameRules.js';
import { createRuntimeState } from '../src/logic/engine/gameState.js';

test('initial tower catalog exposes only the starting blueprints', () => {
  const catalog = createInitialTowerCatalog();

  assert.equal(catalog.length, 9);
  assert.deepEqual(
    catalog.filter((tower) => tower.available).map((tower) => tower.id),
    ['BASIC', 'CANNON', 'SNIPER']
  );
  assert.ok(catalog.every((tower, index) => tower.sortOrder === index));
  assert.ok(catalog.every((tower) => tower.level === 0 && tower.maxLevel === 3));
});

test('wave definitions map to the authored table and scale on later cycles', () => {
  const wave1 = createWaveDefinition(1);
  const wave16 = createWaveDefinition(16);
  const wave17 = createWaveDefinition(17);

  assert.equal(WAVE_TABLE.length, 16);
  assert.equal(wave1.boss.id, WAVE_TABLE[0].bossId);
  assert.equal(wave16.boss.id, WAVE_TABLE[15].bossId);
  assert.equal(wave17.boss.id, WAVE_TABLE[0].bossId);
  assert.equal(wave1.label, WAVE_TABLE[0].label);
  assert.equal(wave16.focus, WAVE_TABLE[15].focus);
  assert.ok(wave1.queue.length > 0);
  assert.ok(wave16.queue.length > wave1.queue.length);
  assert.ok(wave17.boss.maxHp > wave1.boss.maxHp);
});

test('tower placement is blocked by player, towers, and enemies', () => {
  const state = createRuntimeState();
  const tower = createInitialTowerCatalog().find((candidate) => candidate.id === 'BASIC');
  const player = { ...state.player, x: 0, y: 0 };
  const towers = [{ x: 80, y: 0, radius: tower.radius }];
  const enemies = [{ x: 170, y: 0, radius: 12 }];

  assert.equal(canPlaceTowerOnField({ x: 10, y: 0 }, tower, player, [], []), false, 'player body should block placement');
  assert.equal(canPlaceTowerOnField({ x: 80, y: 0 }, tower, player, towers, []), false, 'existing towers should block placement');
  assert.equal(canPlaceTowerOnField({ x: 170, y: 0 }, tower, player, [], enemies), false, 'enemies should block placement');
  assert.equal(canPlaceTowerOnField({ x: 240, y: 0 }, tower, player, towers, enemies), true, 'open ground should allow placement');
});

test('runtime state enables debug wave flow flag separately from normal mode', () => {
  const state = createRuntimeState();

  assert.equal(state.mode, 'normal');
  assert.equal(state.debugWaveFlow, false);
  assert.equal(state.wave.bossSpawned, false);
  assert.deepEqual(state.debugOptions, { infiniteMoney: false, infiniteHealth: false });
});
