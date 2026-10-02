// Imported only by the DEV-gated hook branch. No arbitrary state or spawn API.
export const createDevQaBridge = (readBindings, commit = callback => callback()) => {
  let manual = false, seed = 0, rngState = 0, rngCalls = 0, timers = [], ledger = [], droppedEvents = 0, epochBase = 0;
  const seenEvents = new Set();
  const collectEvents = () => {
    for (const event of readBindings().events?.() ?? []) if (!seenEvents.has(event.eventId)) {
      seenEvents.add(event.eventId); ledger.push(structuredClone(event));
    }
    while (ledger.length > 4096) { seenEvents.delete(ledger.shift().eventId); droppedEvents += 1; }
  };
  const random = () => {
    rngCalls += 1;
    let value = rngState = (rngState + 0x6D2B79F5) >>> 0;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  const run = (callback, ...args) => {
    if (!manual) return callback(...args);
    const previous = Math.random;
    Math.random = random;
    try {
      const result = callback(...args);
      if (result?.then) throw new TypeError('QA RNG scopes must be synchronous.');
      return result;
    } finally { Math.random = previous; collectEvents(); }
  };
  const blockReason = () => {
    const b = readBindings();
    return b.gameState !== 'PLAYING' ? b.gameState : b.paused ? 'paused' : b.rewardActive ? 'reward' : b.hidden() ? 'hidden' : null;
  };
  const control = () => ({ manual, seed, rngState, rngCalls, pendingTimers: timers.length, droppedEvents });
  const snapshot = () => {
    const raw = readBindings().snapshot();
    const { lastTime, buildBarRect, debugPanelRect, ...state } = raw.state;
    state.joystick = { ...state.joystick, touchId: state.joystick?.touchId ?? null };
    const normalize = value => {
      if (typeof value === 'string') return value.replace(/^(\d+)\/(?=(hero|tower|enemy|boss|mechanic|event|projectile|drop|particle|impactWave)\/)/, (_, epoch) => `run${Number(epoch) - epochBase}/`);
      if (value instanceof Set) return { set: [...value].map(normalize) };
      if (Array.isArray(value)) return value.map(normalize);
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalize(entry)]));
      return value;
    };
    const events = ledger.map(({ eventId, projectileKey, epoch, ...event }) => event);
    // Wall-clock frame bookkeeping, DOM geometry and presentation allocation IDs
    // are reported separately, not confused with simulation semantics.
    return structuredClone({ schemaVersion: 1, control: control(),
      semantic: normalize({ gameState: raw.gameState, paused: raw.paused, rewardState: raw.rewardState, state, events }),
      presentation: raw.presentation, eventLog: ledger, art: raw.art, geometry: { buildBarRect, debugPanelRect } });
  };
  const reset = ({ seed: nextSeed = 1, mode = 'normal' } = {}) => {
    if (!Number.isInteger(nextSeed) || nextSeed < 0 || nextSeed > 0xFFFFFFFF) throw new RangeError('seed must be uint32');
    if (!['normal', 'debug'].includes(mode)) throw new TypeError('mode must be normal or debug');
    // Audio's one-time noise buffer uses native randomness and is outside the
    // logic RNG scope. No await or global random replacement spans this call.
    readBindings().prepareAudio();
    manual = true; seed = nextSeed; rngState = nextSeed; rngCalls = 0; timers = []; ledger = []; droppedEvents = 0; seenEvents.clear();
    commit(() => run(readBindings().initGame, { debug: mode === 'debug' }));
    readBindings().state().lastTime = 0;
    readBindings().draw();
    epochBase = readBindings().snapshot().presentation.epoch;
    return snapshot();
  };
  const flushTimers = () => {
    const time = readBindings().state().gameTime;
    const due = timers.filter(timer => timer.at <= time + 1e-9);
    timers = timers.filter(timer => timer.at > time + 1e-9);
    for (const timer of due) run(timer.callback);
  };
  const step = ({ frames = 1, dt = 1 / 60 } = {}) => {
    if (!manual) throw new Error('Call reset before manual stepping.');
    if (!Number.isInteger(frames) || frames < 1 || frames > 3600) throw new RangeError('frames must be 1..3600');
    if (!Number.isFinite(dt) || dt <= 0 || dt > 0.05) throw new RangeError('dt must be >0 and <=0.05');
    let advancedFrames = 0, blocked = null;
    for (let frame = 0; frame < frames; frame += 1) {
      blocked = blockReason();
      if (blocked) break;
      // React flags must commit between frames so reward/game-over cannot be
      // stepped through using a stale closure from the first frame.
      commit(() => run(readBindings().update, dt));
      flushTimers(); readBindings().draw(); advancedFrames += 1;
    }
    return { requestedFrames: frames, advancedFrames, blocked, gameTime: readBindings().state().gameTime, control: control() };
  };
  const schedule = (callback, delayMs) => {
    if (!manual) return globalThis.setTimeout(callback, delayMs);
    timers.push({ at: readBindings().state().gameTime + delayMs / 1000, callback });
    return null;
  };
  const release = () => {
    const time = readBindings().state().gameTime;
    manual = false;
    for (const timer of timers) globalThis.setTimeout(timer.callback, Math.max(0, timer.at - time) * 1000);
    timers = []; readBindings().state().lastTime = 0;
    return control();
  };
  return { run, schedule, isManual: () => manual, api: Object.freeze({ reset, step, snapshot, release }) };
};
