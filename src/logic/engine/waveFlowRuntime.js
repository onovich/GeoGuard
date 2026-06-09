import { UI_COPY } from '../../data/gameConfig.js';
import { createWaveDefinition } from './gameRules.js';
import { createWaveRuntimeState } from './gameState.js';

export const createWaveOverview = (definition) => ({
  label: definition.label ?? '',
  focus: definition.focus ?? '',
});

export const createWaveStartMessage = ({ waveNumber, definition }) => ({
  title: `${UI_COPY.waveIncoming} ${waveNumber}`,
  subtitle: definition.label && definition.focus ? `${definition.label} \uFF5C ${definition.focus}` : definition.label ?? definition.focus ?? '',
  tone: 'wave',
});

export const startWaveRuntime = ({ state, waveNumber, applyBossAuthoring = (boss) => boss }) => {
  const definition = createWaveDefinition(waveNumber);
  const isDebugMode = state.mode === 'debug';
  const authoredDefinition = isDebugMode ? { ...definition, boss: applyBossAuthoring(definition.boss) } : definition;

  state.debugWaveFlow = isDebugMode;
  state.wave = createWaveRuntimeState(waveNumber, authoredDefinition);

  return {
    currentWave: waveNumber,
    debugWaveFlow: state.debugWaveFlow,
    waveOverview: createWaveOverview(authoredDefinition),
    waveMessage: createWaveStartMessage({ waveNumber, definition }),
    definition,
    authoredDefinition,
  };
};
