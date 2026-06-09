export const getForcedBossPhaseIndex = (boss, phaseNumber) =>
  Math.max(0, Math.min((boss.phases?.length ?? 1) - 1, phaseNumber - 1));

export const getForcedBossPhaseHp = ({ boss, phaseIndex }) => {
  const lowerBound = boss.phases[phaseIndex].hpBelow;
  const upperBound = phaseIndex === 0 ? 1 : boss.phases[phaseIndex - 1].hpBelow;
  const targetRatio =
    phaseIndex >= boss.phases.length - 1
      ? Math.max(0.18, lowerBound * 0.72)
      : (upperBound + lowerBound) * 0.5;
  return Math.max(1, Math.round(boss.maxHp * targetRatio));
};

export const forceBossPhaseRuntime = ({ enemies, phaseNumber, onPhaseShift }) => {
  const bosses = enemies.filter((enemy) => enemy.isBoss && enemy.phases?.length);
  for (const boss of bosses) {
    const nextPhaseIndex = getForcedBossPhaseIndex(boss, phaseNumber);
    const previousPhaseIndex = boss.currentPhaseIndex ?? 0;
    boss.currentPhaseIndex = nextPhaseIndex;
    boss.abilityCooldowns = {};
    boss.hp = getForcedBossPhaseHp({ boss, phaseIndex: nextPhaseIndex });
    onPhaseShift?.({
      boss,
      activePhase: boss.phases[nextPhaseIndex],
      activePhaseIndex: nextPhaseIndex,
      previousPhaseIndex: previousPhaseIndex === nextPhaseIndex ? -1 : previousPhaseIndex,
    });
  }

  return { updatedCount: bosses.length };
};
