import { compileVectors } from './vectors.js';
import { unsupported } from './palette.js';
import { drawProjectile } from './projectiles.js';
import { drawDrop, drawParticle, drawImpactWave, drawFeedback, drawLink } from './feedback.js';

export const WORLD_ART_SCHEMA_VERSION = 1;
export { worldManifest } from './manifest.js';
export { drawWorldBackground } from './ground.js';
export { drawHazard } from './hazards.js';
export { drawActorOverlay, drawPlacement } from './overlays.js';

let compiled;
export async function loadWorldArt({baseUrl,signal}={}) {
  if(signal?.aborted)return {status:'failed',assets:null,errors:[{url:'world:v1',reason:'aborted'}]};
  // Paths are local source data, so no network/decode requirement, DOM or async rendering.
  try {
    compiled ??= compileVectors();
    return {status:'ready',assets:compiled,errors:[]};
  } catch(error) {
    return {status:'failed',assets:null,errors:[{url:'world:v1',reason:String(error?.message??error)}]};
  }
}

const drawers={projectile:drawProjectile,drop:drawDrop,particle:drawParticle,impactWave:drawImpactWave,feedback:drawFeedback,link:drawLink};
export function drawWorldItem(ctx,item,frame,assets) {
  return drawers[item?.kind]?.(ctx,item,frame,assets) ?? unsupported;
}
