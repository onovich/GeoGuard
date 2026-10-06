import test from 'node:test';
import assert from 'node:assert/strict';
import { drawOriginalParts, originalPartSources } from '../src/view/art/characters/originalPixels.js';

test('required formal source parts fail before any cached drawing or receipt', () => {
  for (const artId of ['tower:SNIPER', 'tower:RAIL']) {
    for (const missing of originalPartSources[artId]) {
      const images = Object.fromEntries(originalPartSources[artId].map(s => [s.part, { src: s.src }]));
      delete images[missing.part];
      const ctx = new Proxy({}, { get() { throw new Error('missing source must prevent all canvas consumption'); } });
      assert.equal(drawOriginalParts(ctx, { artId, actor: {} }, images, () => {
        throw new Error('missing source must not claim a source receipt');
      }), false, artId + '/' + missing.part);
    }
  }
});
