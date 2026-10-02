import { deepFreeze } from './snapshot.mjs';
const base = new URL('../', location.href);
const api = await import(new URL('src/view/art/characters/index.js', base).href);
const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
const assets = await api.loadCharacterArt({ baseUrl: base.pathname });
const contextState = () => ({ transform: [...ctx.getTransform().toFloat64Array()], alpha: ctx.globalAlpha, composite: ctx.globalCompositeOperation, lineWidth: ctx.lineWidth, stroke: ctx.strokeStyle, fill: ctx.fillStyle, dash: ctx.getLineDash(), font: ctx.font, align: ctx.textAlign, baseline: ctx.textBaseline, shadowBlur: ctx.shadowBlur, shadowX: ctx.shadowOffsetX, shadowY: ctx.shadowOffsetY });
window.finalArtQA = {
  ready: true,
  async sample(sample) {
    if (sample.status !== 'ready_to_sample') return { status: sample.status, reason: 'input not drawable; never count as visual pass' };
    if (sample.artId !== sample.actor.artId) throw new Error('Actor identity mismatch');
    const manifest = api.characterManifest[sample.artId];
    if (!manifest || (sample.kind === 'action' && !manifest.actions?.[sample.referenceAction])) throw new Error('Exact production mapping missing');
    canvas.width = 256 * devicePixelRatio; canvas.height = 256 * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, 256, 256);
    const actor = deepFreeze(structuredClone(sample.actor)), frame = deepFreeze(structuredClone(sample.frame));
    const dtoBefore = JSON.stringify({ actor, frame }), ctxBefore = contextState();
    let rngCalls = 0, result, anchors;
    const random = Math.random;
    Math.random = () => { rngCalls++; throw new Error('Shared Math.random consumed by art'); };
    try { result = api.drawCharacter(ctx, actor, frame, assets.assets); anchors = api.getCharacterAnchors(actor, frame); }
    finally { Math.random = random; }
    const ctxAfter = contextState(), unchanged = dtoBefore === JSON.stringify({ actor, frame });
    const contextRestored = JSON.stringify(ctxBefore) === JSON.stringify(ctxAfter);
    return { status: result.drawn && assets.status === 'ready' && unchanged && contextRestored && !rngCalls ? 'captured_unreviewed' : 'failed', result, anchors, assetStatus: assets.status, errors: assets.errors, purity: { unchanged, contextRestored, rngCalls }, actor, frame, browserDpr: devicePixelRatio, runtimeDispatchProven: false };
  },
  async resources() {
    const checks = [];
    for (const [artId, entry] of Object.entries(api.characterManifest)) {
      const icon = api.getCharacterIcon(artId), url = new URL(icon.src, location.origin);
      const image = new Image(); image.src = url.href;
      let error = null;
      try { await image.decode(); } catch (e) { error = String(e); }
      checks.push({ artId, url: url.href, expectedBase: base.pathname, underBase: url.pathname.startsWith(base.pathname), naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, error, bodyStatus: entry.status, available: assets.assets?.availableIds.includes(artId) ?? false });
    }
    const controller = new AbortController(); controller.abort();
    const aborted = await api.loadCharacterArt({ baseUrl: base.pathname, signal: controller.signal });
    return { scope: '48 real icon URL/decode checks and vector API status; no bitmap body-network claim', checks, load: { status: assets.status, errors: assets.errors }, abort: { status: aborted.status, errors: aborted.errors }, pass: checks.length === 48 && checks.every(c => c.underBase && !c.error && c.available && c.naturalWidth > 0) && aborted.status === 'failed' };
  },
};
