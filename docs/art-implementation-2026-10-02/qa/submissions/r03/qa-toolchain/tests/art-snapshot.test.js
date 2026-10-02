import test from 'node:test';
import assert from 'node:assert/strict';
import { gameplaySnapshot, seededRandom, withRandom, deepFreeze } from '../scripts/art-validation/snapshot.mjs';

const fixture = () => {
  const target = { uid: 2, hp: 7, sourceUid: 'must-keep' };
  return { player: { hp: 100 }, towers: [], enemies: [target], projectiles: [{ x: 1, previousX: 0, damage: 8, life: 2, sourceUid: 'player', sourceArtId: 'hero:PLAYER', shotIndex: 0, hitEnemies: new Set([target]) }] };
};
test('art snapshot preserves collision history and maps hit targets without losing gameplay fields', () => {
  const state = fixture(), result = gameplaySnapshot(state, { omitProjectileMetadata: true });
  assert.deepEqual(result.projectiles[0].hitEnemies, { $set: [{ $entity: 'enemy:2' }] });
  assert.equal(result.enemies[0].sourceUid, 'must-keep');
  assert.equal(result.projectiles[0].previousX, 0);
  assert.equal(result.projectiles[0].life, 2);
  assert.equal(result.projectiles[0].sourceUid, undefined);
  assert.equal(gameplaySnapshot(state).projectiles[0].sourceUid, 'player');
});
test('art snapshot cannot hide order, hit, damage, timing or position regressions', () => {
  for (const field of ['x', 'previousX', 'damage', 'life']) {
    const state = fixture(), before = gameplaySnapshot(state, { omitProjectileMetadata: true });
    state.projectiles[0][field] += 0.001;
    assert.notDeepEqual(gameplaySnapshot(state, { omitProjectileMetadata: true }), before, field);
  }
  const state = fixture();state.enemies.push({ uid: 3, hp: 7 });
  const before = gameplaySnapshot(state);state.enemies.reverse();assert.notDeepEqual(gameplaySnapshot(state), before);
  const a = fixture(), b = fixture(); b.projectiles[0].hitEnemies.clear(); assert.notDeepEqual(gameplaySnapshot(a), gameplaySnapshot(b));
});
test('deterministic QA random scope restores global generator on failure and tracks consumption', () => {
  const original = Math.random, a = seededRandom(7), b = seededRandom(7);
  assert.equal(a(), b());
  assert.throws(() => withRandom(a, () => { Math.random(); throw new Error('probe'); }), /probe/);
  assert.equal(Math.random, original);assert.equal(a.inspect().calls, 2);
});
test('freeze rejects nested DTO writes; snapshots additionally detect Set mutation', () => {
  const state = fixture(), before = gameplaySnapshot(state); deepFreeze(state);
  assert.throws(() => { state.player.hp = 0; }, TypeError);
  state.projectiles[0].hitEnemies.clear();
  assert.notDeepEqual(gameplaySnapshot(state), before);
});
