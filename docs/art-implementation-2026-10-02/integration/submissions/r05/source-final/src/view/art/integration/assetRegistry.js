const loadGroup = async (loadModule, loadExport, baseUrl, signal) => {
  try {
    const module = await loadModule();
    const loaded = await module[loadExport]({ baseUrl, signal });
    return { module, ...loaded };
  } catch (error) {
    return { module: null, assets: null, status: 'failed', errors: [{ url: loadExport, reason: String(error?.message ?? error) }] };
  }
};

export const createArtRegistry = () => ({ status: 'idle', characters: null, world: null, errors: [], drawErrors: [], fallbackArtIds: new Set() });

export const loadArtRegistry = async (registry, { baseUrl, signal, loaders } = {}) => {
  registry.status = 'loading';
  const imports = loaders ?? {
    characters: () => import('../characters/index.js'),
    world: () => import('../world/index.js'),
  };
  const [characters, world] = await Promise.all([
    loadGroup(imports.characters, 'loadCharacterArt', baseUrl, signal),
    loadGroup(imports.world, 'loadWorldArt', baseUrl, signal),
  ]);
  if (signal?.aborted) return registry;
  registry.characters = characters; registry.world = world;
  registry.errors = [...(characters.errors ?? []), ...(world.errors ?? [])];
  registry.status = characters.status === 'ready' && world.status === 'ready' ? 'ready' :
    characters.module || world.module ? 'partial' : 'failed';
  return registry;
};

// A failed paint stays local to the art layer. Always restore the caller's context.
export const callArt = (registry, ctx, group, method, args) => {
  const entry = registry?.[group];
  if (!entry?.module?.[method] || entry.status === 'failed') return false;
  ctx.save();
  try {
    const result = entry.module[method](ctx, ...args);
    return result?.drawn !== false;
  } catch (error) {
    const message = `${group}.${method}: ${error?.message ?? error}`;
    if (!registry.drawErrors.includes(message) && registry.drawErrors.length < 16) registry.drawErrors.push(message);
    return false;
  } finally { ctx.restore(); }
};
