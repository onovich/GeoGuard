import { createEmptyWaveState } from './gameState.js';

export const DEBUG_SANDBOX_OVERVIEW = {
  label: 'Free Sandbox',
  focus: 'Drag towers, enemies, and bosses onto the live map.',
};

export const resetCombatRuntimeState = ({ state, clearTowers = false }) => {
  state.enemies = [];
  if (clearTowers) {
    state.towers = [];
  }
  state.projectiles = [];
  state.drops = [];
  state.particles = [];
  state.impactWaves = [];
  state.hazards = [];
  state.floatingTexts = [];
  state.wave.awaitingReward = false;
  state.wave.pendingRewardBossUid = null;
  state.wave.pendingRewardBossEncounterUid = null;
  return state;
};

export const enterDebugSandboxRuntime = ({ state }) => {
  state.debugWaveFlow = false;
  state.wave = createEmptyWaveState();
  return {
    currentWave: 0,
    debugWaveFlow: false,
    waveOverview: DEBUG_SANDBOX_OVERVIEW,
  };
};

export const applyDebugOptionRuntime = ({ state, key, value }) => {
  const nextOptions = { ...state.debugOptions, [key]: value };
  state.debugOptions = nextOptions;

  if (key === 'infiniteMoney' && value) {
    state.money = 999999;
  } else if (key === 'infiniteMoney' && !value && state.money > 99999) {
    state.money = 200;
  }

  if (key === 'infiniteHealth' && value) {
    state.player.hp = state.player.maxHp;
  }

  return nextOptions;
};
