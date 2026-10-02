import { loadEngine, createScene } from './scene-kit.mjs';
import { gameplaySnapshot, deepFreeze } from './snapshot.mjs';
const engine = await loadEngine(p => import(`/src/${p}`));
const { drawGameScene } = await import('/src/view/canvas/canvasRenderer.js');
const canvas = document.getElementById('scene'), ctx = canvas.getContext('2d');
let scene = null, drawCount = 0;
function resize() {
  canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio;
  canvas.style.width = `${innerWidth}px`;canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
function draw() {
  drawGameScene(ctx, canvas, { state: scene.state,
    getTowerById: id => scene.state.towerCatalog.find(t => t.id === id),
    getDebugDragEntity: (kind, id) => kind === 'boss' ? engine.encounter.getBossEditorBaseTemplate(id) : engine.config.ENEMY_TYPES[id] });
  drawCount++;
}
window.artQA = {
  ready: true,
  load(options) { resize();scene = createScene(engine, options);drawCount = 0;draw();return this.snapshot(); },
  step(frames = 1, hz = 60) { if (!Number.isInteger(frames) || frames < 0 || frames > 100000) throw new Error('Invalid frame count'); for(let n = 0;n < frames;n++)scene.step(1/hz);draw();return this.snapshot(); },
  snapshot() { return { provenance: scene.provenance, state: gameplaySnapshot(scene.state), rng: scene.random.inspect(), drawCount, viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio } }; },
  purity(frames = 30) {
    const before = JSON.stringify(gameplaySnapshot(scene.state)), initialTransform = [...ctx.getTransform().toFloat64Array()];
    const originalRandom = Math.random;let randomCalls = 0, error = null;
    deepFreeze(scene.state);
    Math.random = () => { randomCalls++;throw new Error('Renderer consumed gameplay Math.random'); };
    try { for(let i = 0;i < frames;i++)draw(); } catch(e) { error = String(e.stack ?? e); } finally { Math.random = originalRandom; }
    const after = JSON.stringify(gameplaySnapshot(scene.state)), finalTransform = [...ctx.getTransform().toFloat64Array()];
    return { frames, error, randomCalls, stateUnchanged: before === after, transformRestored: JSON.stringify(initialTransform) === JSON.stringify(finalTransform), passed: !error && randomCalls === 0 && before === after && JSON.stringify(initialTransform) === JSON.stringify(finalTransform), before: JSON.parse(before), after: JSON.parse(after) };
  },
  async sampleCharacter(sample) {
    if (!sample.actor || !sample.frame) return { status: 'pending', reason: 'No approved concrete actor/frame mapping for this reference action' };
    if(sample.actor.artId!==sample.artId||sample.key!==`${sample.artId}/${sample.referenceAction}`)throw new Error('Sample identity/reference mismatch');
    const api = await import('/src/view/art/characters/index.js');
    const actionMapping=api.characterManifest[sample.artId]?.actions?.[sample.referenceAction];
    if(!actionMapping)return {status:'pending',reason:'Production manifest has no mapping for this exact reference action'};
    const result = await api.loadCharacterArt();
    resize();ctx.clearRect(0,0,canvas.width,canvas.height);
    const actor = structuredClone(sample.actor), frame = structuredClone(sample.frame);
    deepFreeze(actor);deepFreeze(frame);
    const original = Math.random;let rngCalls = 0;
    Math.random = () => { rngCalls++;throw new Error('Character renderer consumed shared RNG'); };
    try {
      const drawResult = api.drawCharacter(ctx, actor, frame, result.assets);
      return { status: drawResult.drawn && result.status === 'ready' ? 'captured_unreviewed' : 'incomplete', load: { status: result.status, errors: result.errors }, productionActionMapping:actionMapping, drawResult, anchors: api.getCharacterAnchors(actor, frame), rngCalls, actor, frame };
    } finally { Math.random = original; }
  },
  async measure({ seconds = 60, warmup = 10 } = {}) {
    const frames = [], longTasks = [];let observer = null;
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) { observer = new PerformanceObserver(list => longTasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))); observer.observe({ entryTypes: ['longtask'] }); }
    let first = null, previous = null;
    return new Promise(resolve => {
      function tick(time) {
        if(first === null)first = time;
        const elapsed = (time-first)/1000;
        const start = performance.now();draw();const renderMs = performance.now()-start;
        if(previous !== null && elapsed >= warmup)frames.push({ at:time, interval:time-previous, renderMs });
        previous = time;
        if(elapsed < seconds+warmup)requestAnimationFrame(tick);
        else {observer?.disconnect();resolve({ scope:'stationary real Canvas draw-only stress; not full gameplay FPS', seconds, warmup, actualElapsed:elapsed, frames, longTasks, memory:performance.memory?{usedJSHeapSize:performance.memory.usedJSHeapSize,totalJSHeapSize:performance.memory.totalJSHeapSize}:null, counts:{enemies:scene.state.enemies.length,towers:scene.state.towers.length,projectiles:scene.state.projectiles.length,hazards:scene.state.hazards.length}, visibility:document.visibilityState, provenance:scene.provenance });}
      }
      requestAnimationFrame(tick);
    });
  },
};
document.getElementById('status').textContent = 'Independent QA / real production Canvas / constructed fixture';
