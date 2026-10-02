import { COLORS } from '../../data/gameConfig.js';
import { getBossRewardResolution, hasPendingBossAftermath, hasPendingEncounterAftermath } from './bossFlowRules.js';
import { expireBossMechanicsRuntime, settleMechanicDefeatRuntime } from './bossMechanicEntities.js';

export const settleEnemyDefeatRuntime = ({
  state,
  enemy,
  enemyIndex,
  spawnParticle,
  spawnAround,
  playBossDefeatCue,
  syncHudMoney,
  openBossReward,
  enrageEncounterPartner,
}) => {
  if (enemy.hp > 0) {
    return { defeated: false, rewardAction: null };
  }

  spawnParticle(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 18 : 8);
  if (settleMechanicDefeatRuntime({ state, enemy }) > 0) syncHudMoney();
  // Wave bosses pay immediately; leaving another gem would pay the bounty twice.
  const paysImmediately = enemy.isBoss && (state.mode !== 'debug' || state.debugWaveFlow);
  if (!paysImmediately && enemy.value > 0 && !enemy.consumed) {
    state.drops.push({ x: enemy.x, y: enemy.y, value: enemy.value, radius: Math.min(12, 4 + Math.sqrt(enemy.value)), color: COLORS.gem, magnetized: false });
  }
  if (enemy.deathSpawn && !enemy.consumed) {
    spawnAround(enemy, enemy.deathSpawn.type, enemy.deathSpawn.count, enemy.deathSpawn.spread);
  }
  state.enemies.splice(enemyIndex, 1);
  if (enemy.isBoss) expireBossMechanicsRuntime(state, enemy);

  if (!enemy.isBoss || (state.mode === 'debug' && !state.debugWaveFlow)) {
    return { defeated: true, rewardAction: null };
  }

  playBossDefeatCue();
  state.money += enemy.value;
  syncHudMoney();
  enemy.isDefeated = true;

  const rewardResolution = getBossRewardResolution({
    boss: enemy,
    enemies: state.enemies,
    hazards: state.hazards,
  });

  if (rewardResolution.action === 'enrage-partner') {
    enrageEncounterPartner(enemy);
  } else if (rewardResolution.action === 'await-encounter-aftermath') {
    state.wave.awaitingReward = true;
    state.wave.pendingRewardBossEncounterUid = rewardResolution.encounterUid;
  } else if (rewardResolution.action === 'await-boss-aftermath') {
    state.wave.awaitingReward = true;
    state.wave.pendingRewardBossUid = rewardResolution.bossUid;
  } else {
    openBossReward();
  }

  return { defeated: true, rewardAction: rewardResolution.action };
};

export const settlePendingBossRewardRuntime = ({ state, rewardActive, openBossReward }) => {
  if (rewardActive) {
    return { opened: false, source: null };
  }

  if (state.wave.pendingRewardBossUid && !hasPendingBossAftermath(state.enemies, state.hazards, state.wave.pendingRewardBossUid)) {
    openBossReward();
    return { opened: true, source: 'boss' };
  }

  if (
    state.wave.pendingRewardBossEncounterUid &&
    !hasPendingEncounterAftermath(state.enemies, state.hazards, state.wave.pendingRewardBossEncounterUid)
  ) {
    openBossReward();
    return { opened: true, source: 'encounter' };
  }

  return { opened: false, source: null };
};
