import { createEmptyWaveState } from './gameState.js';
import { buildRuntimeRewardChoices } from './rewardFlowRuntime.js';

export const DEBUG_SANDBOX_OVERVIEW = {
  label: 'Free Sandbox',
  focus: 'Drag towers, enemies, and bosses onto the live map.',
};

const DEBUG_FIELD_CLEAR_MESSAGES = {
  reset: {
    title: 'Field Reset',
    subtitle: 'Enemies, hazards, and towers cleared.',
    tone: 'system',
  },
  clear: {
    title: 'Field Cleared',
    subtitle: 'Enemies, hazards, and projectiles removed.',
    tone: 'system',
  },
};

export const getDebugFieldClearMessage = ({ clearTowers = false } = {}) => ({
  ...(clearTowers ? DEBUG_FIELD_CLEAR_MESSAGES.reset : DEBUG_FIELD_CLEAR_MESSAGES.clear),
});

export const createDebugRewardState = (choices) => ({
  active: true,
  choices,
});

export const createDebugUiResetState = () => ({
  rewardState: { active: false, choices: [] },
  bossHud: [],
  towerContextMenu: null,
});

export const getDebugBossSpawnPoint = ({ player, distance = 180, yOffset = -30 }) => ({
  x: player.x + distance,
  y: player.y + yOffset,
});

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

export const resetDebugPanelCombatRuntime = ({ state, clearTowers = false }) => {
  resetCombatRuntimeState({ state, clearTowers });
  return createDebugUiResetState();
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

export const enterDebugSandboxPanelRuntime = ({ state, clearTowers = false, announce = false }) => {
  const uiResetState = resetDebugPanelCombatRuntime({ state, clearTowers });
  const sandboxState = enterDebugSandboxRuntime({ state });
  return {
    ...uiResetState,
    ...sandboxState,
    message: announce
      ? {
          title: 'Sandbox Ready',
          subtitle: 'Manual spawn mode is active again.',
          tone: 'system',
        }
      : null,
    messageDuration: 1800,
  };
};

export const clearDebugFieldPanelRuntime = ({ state, clearTowers = false }) => ({
  ...resetDebugPanelCombatRuntime({ state, clearTowers }),
  message: getDebugFieldClearMessage({ clearTowers }),
  messageDuration: 1500,
});

export const openDebugRewardPanelRuntime = ({ state, catalog, currentWave, hudMoney }) =>
  createDebugRewardState(
    buildRuntimeRewardChoices({
      state,
      catalog,
      currentWave,
      hudMoney,
    })
  );

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
