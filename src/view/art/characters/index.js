import { characterManifest } from './manifest.js';
import { buildCharacterPlan, getPlanAnchors } from './rig.js';
import { originalPartSources, loadOriginalParts, drawOriginalParts, getOriginalPixelBounds, getOriginalPixelMuzzles } from './originalPixels.js';
import { originalLayerData } from './originalLayerData.js';
import { originalFrameData } from './originalFrameData.js';

export const CHARACTER_ART_SCHEMA_VERSION = 1;
export { characterManifest };

const hasIdentity = (id) => Object.hasOwn(characterManifest, id);
export const usesOriginalPixels = artId => Object.hasOwn(originalPartSources, artId);

export function resolveCharacterArtId({ domain, id, isBoss, twinRole, mechanicKind } = {}) {
  if (domain && !['hero', 'tower', 'enemy', 'boss', 'mechanic'].includes(domain) && !isBoss && !mechanicKind) return null;
  if (domain === 'hero') return 'hero:PLAYER';
  if (mechanicKind || domain === 'mechanic') {
    const kind = String(mechanicKind ?? id ?? '').replace(/^MECHANIC_/, '').toUpperCase();
    return hasIdentity(`mechanic:${kind}`) ? `mechanic:${kind}` : null;
  }
  if (isBoss || domain === 'boss') {
    if (twinRole === 'sun' || id === 'TWIN_SOL') return 'boss:TWINS_SUN';
    if (twinRole === 'moon' || id === 'TWIN_LUNA') return 'boss:TWINS_MOON';
    const base = String(id ?? '').replace(/_T[123]$/, '');
    return hasIdentity(`boss:${base}`) ? `boss:${base}` : null;
  }
  const key = `${domain === 'tower' ? 'tower' : 'enemy'}:${id}`;
  return hasIdentity(key) ? key : null;
}

const baseUrl = () => import.meta.env?.BASE_URL ?? '/';
const withBase = (base, resource) => `${base.endsWith('/') ? base : `${base}/`}${resource}`;

export function getCharacterIcon(artId) {
  if(originalLayerData[artId])return {src:withBase(baseUrl(),originalLayerData[artId].icon),width:256,height:256,alt:characterManifest[artId]?.icon?.alt??artId};
  if (artId === 'tower:BASIC') return { src: withBase(baseUrl(), 'art/original/v1/characters/basic/neutral-repaired.png'), width: 310, height: 302, alt: '速射塔' };
    if (artId === 'tower:BURST') return {src:withBase(baseUrl(),'art/original/v1/characters/burst/neutral-composite.png'),width:256,height:256,alt:'散射塔'};
    if (Object.hasOwn(originalFrameData,artId)) {
      const frame=originalFrameData[artId].frames.neutral;
      return {src:withBase(baseUrl(),frame.src),width:frame.size[0],height:frame.size[1],alt:characterManifest[artId]?.icon?.alt??artId};
    }
  return null; // Unknown/missing source icon is explicit; never use historic vector exports.
}

export async function loadCharacterArt({ baseUrl: resourceBase = baseUrl(), signal } = {}) {
  if (signal?.aborted) return { status: 'failed', assets: null, errors: [{ url: resourceBase, reason: 'aborted' }] };
  // Every registered player identity requires actual decoded source PNGs.
  const availableIds = Object.values(characterManifest).filter((entry) => entry.status === 'produced_pending_review').map((entry) => entry.artId);
  const originals = await loadOriginalParts(resourceBase, signal);
  const errors = Object.values(characterManifest).filter((entry) => !availableIds.includes(entry.artId)).map((entry) => ({ url: withBase(resourceBase, `art/characters/v1/${entry.artId.replace(':', '/').toLowerCase()}/body.svg`), reason: 'not-produced' }));
  return { status: errors.length || originals.errors.length ? 'partial' : 'ready', assets: { schemaVersion: 1, kind: 'original-pixels-migration', availableIds, baseUrl: resourceBase, originalBodies: originals.bodies }, errors: [...errors, ...originals.errors] };
}

export function drawCharacter(ctx, actor, frame, assets) {
  const entry = characterManifest[actor?.artId];
  if (!entry || entry.status !== 'produced_pending_review') return { drawn: false, reason: 'missing' };
  if (!assets?.availableIds?.includes(actor.artId)) return { drawn: false, reason: 'not-ready' };
  const plan = buildCharacterPlan(actor, frame);
  if (!plan) return { drawn: false, reason: 'unsupported' };
  if (Object.hasOwn(originalPartSources, actor.artId)) {
    const drawn = drawOriginalParts(ctx, plan, assets.originalBodies?.[actor.artId],assets.onSourceDraw);
    return { drawn, reason: drawn ? undefined : 'original-pixels-not-loaded' };
  }
  return { drawn: false, reason: 'missing-original-source-registration' };
}

let characterProfile=null;
export const setCharacterProfile=callback=>{characterProfile=typeof callback==='function'?callback:null};
const timedCharacter=(metric,actor,work)=>{if(!characterProfile)return work();const start=performance.now();try{return work()}finally{characterProfile(metric,actor.artId,performance.now()-start)}};
export function getCharacterAnchors(actor, frame) {
  const plan = timedCharacter('plan',actor,()=>buildCharacterPlan(actor, frame));
  if(!plan)return null;
    const anchors=timedCharacter('functionalAnchors',actor,()=>getPlanAnchors(plan,{measureAuthoredBounds:!usesOriginalPixels(actor.artId)})),actualBounds=timedCharacter('alphaBounds',actor,()=>getOriginalPixelBounds(plan)),actualMuzzles=timedCharacter('muzzles',actor,()=>getOriginalPixelMuzzles(plan));
    return usesOriginalPixels(actor.artId)?{...anchors,muzzles:actualMuzzles??[],bounds:actualBounds,pixelBoundsStatus:actualBounds?'measured':'not-loaded'}:anchors;
}
