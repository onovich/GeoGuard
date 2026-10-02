import { characterManifest } from './manifest.js';
import { buildCharacterPlan, getPlanAnchors, drawPlan, primeCharacterPaths } from './rig.js';

export const CHARACTER_ART_SCHEMA_VERSION = 1;
export { characterManifest };

const hasIdentity = (id) => Object.hasOwn(characterManifest, id);

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
  const entry = characterManifest[artId];
  return entry?.icon ? { ...entry.icon, src: withBase(baseUrl(), entry.icon.src) } : null;
}

export async function loadCharacterArt({ baseUrl: resourceBase = baseUrl(), signal } = {}) {
  if (signal?.aborted) return { status: 'failed', assets: null, errors: [{ url: resourceBase, reason: 'aborted' }] };
  // Production paths are editable data, so Canvas does not wait on a bitmap decode.
  const availableIds = Object.values(characterManifest).filter((entry) => entry.status === 'produced_pending_review').map((entry) => entry.artId);
  primeCharacterPaths();
  const errors = Object.values(characterManifest).filter((entry) => !availableIds.includes(entry.artId)).map((entry) => ({ url: withBase(resourceBase, `art/characters/v1/${entry.artId.replace(':', '/').toLowerCase()}/body.svg`), reason: 'not-produced' }));
  return { status: errors.length ? 'partial' : 'ready', assets: { schemaVersion: 1, kind: 'editable-vector', availableIds, baseUrl: resourceBase }, errors };
}

export function drawCharacter(ctx, actor, frame, assets) {
  const entry = characterManifest[actor?.artId];
  if (!entry || entry.status !== 'produced_pending_review') return { drawn: false, reason: 'missing' };
  if (!assets?.availableIds?.includes(actor.artId)) return { drawn: false, reason: 'not-ready' };
  const plan = buildCharacterPlan(actor, frame);
  if (!plan) return { drawn: false, reason: 'unsupported' };
  drawPlan(ctx, plan);
  return { drawn: true };
}

export function getCharacterAnchors(actor, frame) {
  const plan = buildCharacterPlan(actor, frame);
  return plan ? getPlanAnchors(plan) : null;
}
