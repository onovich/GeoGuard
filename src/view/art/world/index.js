import { originalEffectsData } from './originalEffectsData.js';
import { unsupported } from './palette.js';
import { drawProjectile } from './projectiles.js';
import { drawDrop, drawParticle, drawImpactWave, drawFeedback, drawLink } from './feedback.js';

export const WORLD_ART_SCHEMA_VERSION = 1;
export { worldManifest } from './manifest.js';
export { drawWorldBackground } from './ground.js';
export { drawHazard } from './hazards.js';
export { drawActorOverlay, drawPlacement } from './overlays.js';

let originalShadowPromise;
let originalEffectsPromise;
function loadOriginalEffects(baseUrl='') {
  originalEffectsPromise ??= Promise.all(Object.entries(originalEffectsData).map(async([key,data])=>{
    const image=new Image();image.src=`${baseUrl ? `${baseUrl.replace(/\/$/,'')}/` : '/'}${data.src}`;
    await image.decode();return [key,image];
  })).then(rows=>Object.fromEntries(rows)).catch(error=>{originalEffectsPromise=null;throw error;});
  return originalEffectsPromise;
}
function loadOriginalShadow(baseUrl='') {
  originalShadowPromise ??= new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('original ground-shadow PNG decode failed'));
    image.src=`${baseUrl ? `${baseUrl.replace(/\/$/,'')}/` : '/'}art/original/v1/root-shadow-ground.png`;
  }).catch(error=>{originalShadowPromise=null;throw error;});
  return originalShadowPromise;
}
export async function loadWorldArt({baseUrl,signal}={}) {
  if(signal?.aborted)return {status:'failed',assets:null,errors:[{url:'world:v1',reason:'aborted'}]};
  // Actual cropped PNG resources are decoded once and reused; no ornamental vector compilation.
  try {
    const [originalShadow,originalEffects]=await Promise.all([loadOriginalShadow(baseUrl),loadOriginalEffects(baseUrl)]);
    return {status:'ready',assets:{originalShadow,originalEffects},errors:[]};
  } catch(error) {
    return {status:'failed',assets:null,errors:[{url:'world:v1',reason:String(error?.message??error)}]};
  }
}

const drawers={projectile:drawProjectile,drop:drawDrop,particle:drawParticle,impactWave:drawImpactWave,feedback:drawFeedback,link:drawLink};
export function drawWorldItem(ctx,item,frame,assets) {
  const auditAssets=assets?.onSourceDraw?{...assets,sourceContext:{kind:item?.kind,uid:item?.uid,key:item?.key,sourceKey:item?.sourceKey,targetKey:item?.targetKey??item?.data?.targetKey,childKeys:item?.data?.childKeys,eventType:item?.data?.type,amount:item?.data?.amount,position:[item?.x,item?.y],style:item?.style}}:assets;
  return drawers[item?.kind]?.(ctx,item,frame,auditAssets) ?? unsupported;
}
