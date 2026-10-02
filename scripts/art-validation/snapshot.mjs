// Shared by Node comparisons and the real-browser QA page. Preserve array order.
export function gameplaySnapshot(state, { omitProjectileMetadata = false } = {}) {
  const projectileObjects = new WeakSet(state.projectiles ?? []);
  const entities = new Map([[state.player, 'hero:player'], ...(state.towers ?? []).map(e => [e, `tower:${e.uid}`]), ...(state.enemies ?? []).map(e => [e, `enemy:${e.uid}`])]);
  const seen = new WeakMap();
  const visit = (value, at) => {
    if (value === undefined) return { $undefined: true };
    if (typeof value === 'number' && !Number.isFinite(value)) return { $number: String(value) };
    if (value === null || typeof value !== 'object') {
      if (typeof value === 'function') throw new Error(`Function in gameplay state: ${at}`);
      return value;
    }
    if (value instanceof Set) return { $set: [...value].map((v, i) => entities.has(v) ? { $entity: entities.get(v) } : visit(v, `${at}/set/${i}`)) };
    if (seen.has(value)) return { $ref: seen.get(value) };
    seen.set(value, at);
    if (Array.isArray(value)) return value.map((v, i) => visit(v, `${at}/${i}`));
    return Object.fromEntries(Object.keys(value).sort().filter(k => !(omitProjectileMetadata && projectileObjects.has(value) && ['sourceArtId', 'sourceUid', 'shotIndex'].includes(k)))
      .map(k => [k, visit(value[k], `${at}/${k}`)]));
  };
  return visit(state, 'state');
}
export function deepFreeze(value, visited = new WeakSet()) {
  if (!value || typeof value !== 'object' || visited.has(value)) return value;
  visited.add(value);
  for (const child of value instanceof Set ? value : Object.values(value)) deepFreeze(child, visited);
  return Object.freeze(value);
}
export function seededRandom(seed) {
  let calls = 0;
  const random = () => { calls++; seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  random.inspect = () => ({ seed, calls });
  return random;
}
export function withRandom(random, fn) {
  const previous = Math.random;
  Math.random = random;
  try { return fn(); } finally { Math.random = previous; }
}
