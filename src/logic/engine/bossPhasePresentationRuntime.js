export const BOSS_PHASE_INTRO_DURATION = 1.15;

const ALWAYS_ANNOUNCE_ENCOUNTER_FORMS = new Set(['dragon', 'spider', 'astrolabe']);

export const applyBossPhaseIntroRuntime = ({ boss, duration = BOSS_PHASE_INTRO_DURATION }) => {
  boss.bossState.phaseIntroTimer = duration;
  boss.bossState.phaseIntroDuration = duration;
  return boss.bossState;
};

export const shouldAnnounceBossPhaseShift = ({ boss, previousPhaseIndex }) => {
  if (previousPhaseIndex < 0) {
    return false;
  }
  if (!boss.encounterUid) {
    return true;
  }
  if (ALWAYS_ANNOUNCE_ENCOUNTER_FORMS.has(boss.form)) {
    return true;
  }
  return (boss.form === 'twinSun' || boss.form === 'twinMoon') && boss.twinRole === 'sun';
};

export const createBossPhaseShiftPresentationPlan = ({
  boss,
  activePhase,
  activePhaseIndex,
  previousPhaseIndex,
  getCalloutText = () => '',
}) => {
  const shouldAnnounce = shouldAnnounceBossPhaseShift({ boss, previousPhaseIndex });

  return {
    phaseIntro: { duration: BOSS_PHASE_INTRO_DURATION },
    cameraShake: {
      strength: 12 + activePhaseIndex * 2,
      duration: previousPhaseIndex >= 0 ? 0.42 : 0.28,
    },
    message: shouldAnnounce
      ? {
          waveMessage: {
            title: `${boss.encounterName ?? boss.name} · ${activePhase.name}`,
            subtitle: getCalloutText(boss, activePhaseIndex),
            tone: 'phase',
            accentColor: boss.color,
          },
          duration: 1700,
        }
      : null,
  };
};

export const shouldTriggerBossClimaxAccent = (boss) => {
  const phaseCount = boss.phases?.length ?? 0;
  return phaseCount > 0 && boss.currentPhaseIndex >= phaseCount - 1;
};

export const getBossClimaxAccentCooldown = (boss) =>
  boss.form === 'dragon' ? 0.44 : boss.form === 'astrolabe' ? 0.56 : 0.62;
