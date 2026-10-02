import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeState } from '../src/logic/engine/gameState.js';
import { applyPlayerSlow, tickPlayerControl, movePlayerOnBattlefield, getAreaWarningDuration, getSummonOwnership, getOwnedSummonBudget } from '../src/logic/engine/battlefieldRules.js';

test('player control has a speed floor, expires and cannot be refreshed into permanent slow', () => {
  const { player } = createRuntimeState();
  assert.equal(applyPlayerSlow(player, 0.1, 8), true);
  assert.equal(player.slowRatio, 0.65);
  assert.equal(player.slowTimer, 2);
  tickPlayerControl(player, 1.8);
  assert.equal(applyPlayerSlow(player, 0.1, 8), false);
  tickPlayerControl(player, 0.3);
  assert.equal(player.slowRatio, 1);
  assert.equal(applyPlayerSlow(player, 0.5, 2), false);
  tickPlayerControl(player, 1.1);
  assert.equal(applyPlayerSlow(player, 0.5, 2), true);
});
test('area warnings leave time to exit even when the player is slowed', () => {
  const { player } = createRuntimeState();
  player.slowRatio = 0.65;
  const delay = getAreaWarningDuration({ player, x: 0, y: 0, radius: 120, delay: 0.65 });
  assert.ok(delay * 117 > 140);
});
test('solid walls stop movement, gaps remain passable and destroyed walls stop blocking', () => {
  const { player } = createRuntimeState();
  const wall = { x: 60, y: 0, radius: 20, hp: 24, mechanic: { solid: true } };
  movePlayerOnBattlefield({ player, dx: 1, dy: 0, dt: 1, enemies: [wall] });
  assert.ok(player.x <= 28);
  wall.hp = 0;
  movePlayerOnBattlefield({ player, dx: 1, dy: 0, dt: 1, enemies: [wall] });
  assert.ok(player.x > 180);
});
test('second-generation summons inherit ownership and share a total budget', () => {
  const ownership = getSummonOwnership({ summonedByBossUid: 7, summonedByEncounterUid: 3, summonCategory: 'hive' });
  assert.equal(ownership.ownerBossUid, 7);
  const enemies = Array.from({ length: 24 }, (_, uid) => ({ uid, hp: 20, summonedByBossUid: uid % 2 ? 7 : 8, summonedByEncounterUid: 3 }));
  assert.equal(getOwnedSummonBudget({ enemies, ...ownership, requestedCount: 5 }), 0);
});
