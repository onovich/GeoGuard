// Read-only RAF observer: no patched random, timers, game setters or manual steps.
export async function installRafProbe(page) {
  await page.evaluate(() => {
    const probe = { active: false, frames: [], density: [], visibility: [], longTasks: [], start: 0, warmup: 0, duration: 0, done: false };
    window.__GEOGUARD_FINAL_PERF__ = probe;
    window.__GEOGUARD_FINAL_DENSITY__ = observation => { if (probe.active) probe.density.push({ at: performance.now(), ...observation }); };
    let previous = null;
    document.addEventListener('visibilitychange', () => { if (probe.active) probe.visibility.push({ at: performance.now(), state: document.visibilityState }); });
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
      const observer = new PerformanceObserver(list => { if (probe.active) probe.longTasks.push(...list.getEntries().map(e => ({ at: e.startTime, duration: e.duration }))); });
      observer.observe({ entryTypes: ['longtask'] });
    }
    const tick = now => {
      if (probe.active) {
        const elapsed = (now - probe.start) / 1000;
        if (previous !== null && elapsed >= probe.warmup) probe.frames.push({ at: now, interval: now - previous });
        if (elapsed >= probe.warmup + probe.duration) { probe.active = false; probe.done = true; }
      }
      previous = now; requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
export async function beginRafProbe(page, { warmup = 10, seconds = 60 } = {}) {
  return page.evaluate(({ warmup, seconds }) => {
    const probe = window.__GEOGUARD_FINAL_PERF__;
    if (!probe) throw new Error('Install RAF observer first');
    Object.assign(probe, { active: true, done: false, frames: [], density: [], longTasks: [], visibility: [{ at: performance.now(), state: document.visibilityState }], start: performance.now(), warmup, duration: seconds });
    return { start: probe.start, warmup, seconds, manual: window.__GEOGUARD_ART_QA__?.snapshot().control.manual ?? false };
  }, { warmup, seconds });
}
export async function readRafProbe(page) { return page.evaluate(() => structuredClone(window.__GEOGUARD_FINAL_PERF__)); }
const percentile = (values, ratio) => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? null; };
export function summarizeRafProbe(probe) {
  const frames = probe.frames.filter(f => f.at >= probe.start + probe.warmup * 1000 && f.at <= probe.start + (probe.warmup + probe.duration + 0.5) * 1000);
  const density = probe.density.filter(f => f.at >= probe.start + probe.warmup * 1000);
  const dt = density.length > 1 ? density.at(-1).gameTime - density[0].gameTime : 0;
  const wall = density.length > 1 ? (density.at(-1).at - density[0].at) / 1000 : 0;
  const valid = probe.done && frames.length > 0 && wall >= probe.duration - 3 && dt >= wall * 0.85 && probe.visibility.every(v => v.state === 'visible');
  const distribution = field => ({ min: density.length ? Math.min(...density.map(d => d[field])) : null, p50: percentile(density.map(d => d[field]), 0.5), p95: percentile(density.map(d => d[field]), 0.95), max: density.length ? Math.max(...density.map(d => d[field])) : null });
  return { scope: 'actual browser RAF with actual game-time progress; observer overhead is included', valid, frames: frames.length, p50: percentile(frames.map(f => f.interval), .5), p95: percentile(frames.map(f => f.interval), .95), p99: percentile(frames.map(f => f.interval), .99), over50ms: frames.filter(f => f.interval > 50).length, over100ms: frames.filter(f => f.interval > 100).length, observedGameSeconds: dt, observedWallSeconds: wall, densitySamples: density.length,
    distributions: Object.fromEntries(['enemies', 'towers', 'projectiles', 'hazards', 'bosses'].map(k => [k, distribution(k)])), hazardFramesObserved: density.filter(d => d.hazards > 0).length, failure: valid ? null : 'insufficient real update progression, sample duration or visibility; never certify a paused/end-screen RAF as game FPS' };
}
// Optional symmetric served-module instrumentation for counts: never writes the source
// checkout and sends ONLY copied primitive values/geometry, no live state references.
// Preserve source/served SHA and use this same transform on both versions.
export function instrumentDensityObservation(code) {
  const legacy = 'export const drawGameScene = (ctx, canvas, { state, getTowerById, getDebugDragEntity }) => {';
  const modern = 'export const drawGameScene = (ctx, canvas, options) => {';
  const token = code.includes(legacy) ? legacy : code.includes(modern) ? modern : null;
  if (!token || code.split(token).length !== 2) throw new Error('Unknown renderer entry; do not guess instrumentation');
  const state = token === legacy ? 'state' : 'options.state';
  const insert = `\n  if (globalThis.__GEOGUARD_FINAL_DENSITY__ && performance.now() >= (globalThis.__GEOGUARD_FINAL_DENSITY_NEXT__ ?? 0)) {\n    globalThis.__GEOGUARD_FINAL_DENSITY_NEXT__ = performance.now() + 500;\n    const qaObserved = ${state};\n    globalThis.__GEOGUARD_FINAL_DENSITY__({gameTime:qaObserved.gameTime,enemies:qaObserved.enemies.length,towers:qaObserved.towers.length,projectiles:qaObserved.projectiles.length,hazards:qaObserved.hazards.length,bosses:qaObserved.enemies.filter(e=>e.isBoss).length,worldHazards:qaObserved.hazards.map(h=>({type:h.type,x:h.x,y:h.y,x2:h.x2,y2:h.y2,radius:h.radius,width:h.width,timer:h.timer,ownerBossUid:h.ownerBossUid}))});\n  }\n`;
  return code.replace(token, token + insert);
}
export function compareDensity(a, b) {
  const fields = ['enemies', 'towers', 'projectiles', 'hazards', 'bosses'];
  const ranges = fields.map(field => {
    const left = a.distributions[field], right = b.distributions[field];
    const scale = Math.max(1, left.p50 ?? 0, right.p50 ?? 0, left.p95 ?? 0, right.p95 ?? 0);
    return { field, medianRelativeGap: Math.abs((left.p50 ?? 0) - (right.p50 ?? 0)) / scale, p95RelativeGap: Math.abs((left.p95 ?? 0) - (right.p95 ?? 0)) / scale };
  });
  const comparable = a.valid && b.valid && ranges.every(r => r.medianRelativeGap <= .15 && r.p95RelativeGap <= .15);
  return { comparable, criterion: 'QA screening, not exact load equivalence: all count p50/p95 gaps <=15%; primary reviews geometry and distributions too', ranges, directRegressionRatio: comparable ? b.p95 / a.p95 : null, conclusion: comparable ? 'load screening passed; visual hazard distribution still needs review' : 'loads differ or measurement invalid; no direct regression ratio' };
}
