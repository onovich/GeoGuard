import { resolveRewardFollowUp } from './progressionRules.js';
import {
  applyRewardChoiceEffects,
  buildRewardOfferPlan,
  materializeRewardChoices,
  recordRewardOffers,
  recordRewardPick,
} from './rewardRules.js';

export const createRewardClosedState = () => ({
  active: false,
  choices: [],
});

export const createRewardOpenState = (choices) => ({
  active: true,
  choices,
});

export const buildRuntimeRewardChoices = ({ state, catalog, currentWave, hudMoney }) => {
  const waveNumber = Math.max(1, state.wave.number || currentWave || 1);
  const plan = buildRewardOfferPlan({
    catalog,
    waveNumber,
    money: typeof hudMoney === 'number' ? hudMoney : state.money,
    hp: state.player.hp,
    maxHp: state.player.maxHp,
    infiniteMoney: state.debugOptions.infiniteMoney,
    history: state.rewardHistory,
  });

  return materializeRewardChoices(catalog, plan);
};

export const openBossRewardRuntime = ({ state, catalog, currentWave, hudMoney }) => {
  state.wave.awaitingReward = true;
  state.wave.pendingRewardBossUid = null;
  state.wave.pendingRewardBossEncounterUid = null;

  const choices = buildRuntimeRewardChoices({ state, catalog, currentWave, hudMoney });
  state.rewardHistory = recordRewardOffers(state.rewardHistory, choices);
  return createRewardOpenState(choices);
};

export const getRewardAppliedMessage = (choice) => ({
  title: 'Reward Applied',
  subtitle: choice.title,
  tone: 'system',
});

export const applyRewardChoiceRuntime = ({ state, catalog, choice, currentWave }) => {
  state.rewardHistory = recordRewardPick(state.rewardHistory, choice);
  const rewardResult = applyRewardChoiceEffects({
    catalog,
    choice,
    money: state.money,
    hp: state.player.hp,
    maxHp: state.player.maxHp,
  });

  return {
    ...rewardResult,
    rewardState: createRewardClosedState(),
    followUp: resolveRewardFollowUp({
      mode: state.mode,
      debugWaveFlow: state.debugWaveFlow,
      currentWave,
    }),
  };
};
