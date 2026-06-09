import { COLORS } from '../../data/gameConfig.js';

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

const createVisualEffectPlan = () => ({
  impactWaves: [],
  particles: [],
  floatingTexts: [],
});

const addImpactWave = (plan, x, y, options) => {
  plan.impactWaves.push({ x, y, options });
};

const addParticles = (plan, x, y, color, count, speedBase) => {
  plan.particles.push({ x, y, color, count, speedBase });
};

const addFloatingText = (plan, x, y, text, color, options = {}) => {
  plan.floatingTexts.push({ x, y, text, color, options });
};

export const createBossPhaseShiftEffectPlan = ({
  boss,
  activePhase,
  activePhaseIndex,
  previousPhaseIndex,
  partner = null,
  getCalloutText = () => '',
}) => {
  const presentationPlan = createBossPhaseShiftPresentationPlan({
    boss,
    activePhase,
    activePhaseIndex,
    previousPhaseIndex,
    getCalloutText,
  });
  const effectPlan = {
    cue: 'boss_phase_shift',
    phaseIntro: presentationPlan.phaseIntro,
    cameraShake: presentationPlan.cameraShake,
    message: presentationPlan.message,
    bossState: {},
    ...createVisualEffectPlan(),
  };

  addImpactWave(effectPlan, boss.x, boss.y, {
    startRadius: boss.radius * 0.55,
    maxRadius: boss.radius + 58 + activePhaseIndex * 12,
    growth: 320,
    life: 0.46,
    color: boss.color,
    lineWidth: 5,
    fillAlpha: 0.12,
    dash: [14, 8],
    spokes: 5 + activePhaseIndex * 2,
    spin: 0.7,
  });
  addImpactWave(effectPlan, boss.x, boss.y, {
    startRadius: boss.radius * 0.3,
    maxRadius: boss.radius + 28,
    growth: 260,
    life: 0.3,
    color: '#ffffff',
    lineWidth: 2,
    fillAlpha: 0,
    dash: [3, 9],
    spokes: 0,
    spin: -1,
  });
  addParticles(effectPlan, boss.x, boss.y, boss.color, 20 + activePhaseIndex * 6, 90 + activePhaseIndex * 20);
  addFloatingText(effectPlan, boss.x, boss.y - boss.radius - 20, activePhase.name, boss.color, {
    life: 1.05,
    vy: -24,
    font: 'bold 16px system-ui, sans-serif',
    outlineColor: 'rgba(15,23,42,0.55)',
  });

  if ((boss.form === 'twinSun' || boss.form === 'twinMoon') && partner) {
    const midX = (boss.x + partner.x) * 0.5;
    const midY = (boss.y + partner.y) * 0.5;
    addImpactWave(effectPlan, partner.x, partner.y, {
      startRadius: partner.radius * 0.4,
      maxRadius: partner.radius + 36,
      growth: 280,
      life: 0.34,
      color: partner.color,
      lineWidth: 3,
      fillAlpha: 0.08,
      dash: [8, 8],
      spokes: 4 + activePhaseIndex,
    });
    addImpactWave(effectPlan, midX, midY, {
      startRadius: 10,
      maxRadius: 62 + activePhaseIndex * 12,
      growth: 260,
      life: 0.4,
      color: '#ffffff',
      lineWidth: 2,
      fillAlpha: 0.04,
      dash: [4, 8],
      spokes: 6,
    });
    addParticles(effectPlan, midX, midY, '#ffffff', 12 + activePhaseIndex * 4, 80);
  }

  if (boss.form === 'dragon') {
    for (const offset of [-1, 1]) {
      addImpactWave(effectPlan, boss.x - boss.radius * 0.45, boss.y + offset * boss.radius * 0.28, {
        startRadius: 12,
        maxRadius: boss.radius + 70 + activePhaseIndex * 16,
        growth: 360,
        life: 0.42,
        color: offset === -1 ? '#ffd166' : '#ff9f43',
        lineWidth: 3,
        fillAlpha: 0.08,
        dash: [10, 10],
        spokes: 5 + activePhaseIndex,
        spin: offset * 0.8,
      });
    }
    addParticles(effectPlan, boss.x - boss.radius * 0.65, boss.y, '#ffd166', 10 + activePhaseIndex * 4, 120);
  }

  if (boss.form === 'spider') {
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      addImpactWave(effectPlan, boss.x + Math.cos(angle) * boss.radius * 1.4, boss.y + Math.sin(angle) * boss.radius * 1.1, {
        startRadius: 6,
        maxRadius: 30 + activePhaseIndex * 8,
        growth: 220,
        life: 0.3,
        color: boss.color,
        lineWidth: 2,
        fillAlpha: 0.06,
        dash: [3, 7],
        spokes: 4,
      });
    }
  }

  if (boss.form === 'astrolabe') {
    for (let ring = 0; ring < 3; ring += 1) {
      addImpactWave(effectPlan, boss.x, boss.y, {
        startRadius: boss.radius * (0.4 + ring * 0.18),
        maxRadius: boss.radius + 42 + ring * 22 + activePhaseIndex * 10,
        growth: 240 - ring * 22,
        life: 0.48 + ring * 0.05,
        color: ring === 1 ? '#ffffff' : boss.color,
        lineWidth: ring === 1 ? 2 : 3,
        fillAlpha: ring === 1 ? 0.02 : 0.06,
        dash: ring === 1 ? [2, 8] : [5, 9],
        spokes: 4 + ring + activePhaseIndex,
        spin: ring % 2 === 0 ? 0.8 : -0.8,
      });
    }
    effectPlan.bossState.orbitalIndexDelta = 1;
  }

  return effectPlan;
};

export const shouldTriggerBossClimaxAccent = (boss) => {
  const phaseCount = boss.phases?.length ?? 0;
  return phaseCount > 0 && boss.currentPhaseIndex >= phaseCount - 1;
};

export const getBossClimaxAccentCooldown = (boss) =>
  boss.form === 'dragon' ? 0.44 : boss.form === 'astrolabe' ? 0.56 : 0.62;

export const createBossClimaxAccentEffectPlan = ({ boss, partner = null, player }) => {
  if (!shouldTriggerBossClimaxAccent(boss)) {
    return null;
  }

  const effectPlan = createVisualEffectPlan();

  if ((boss.form === 'twinSun' || boss.form === 'twinMoon') && partner) {
    const midX = (boss.x + partner.x) * 0.5;
    const midY = (boss.y + partner.y) * 0.5;
    addImpactWave(effectPlan, midX, midY, {
      startRadius: 18,
      maxRadius: 84,
      growth: 190,
      life: 0.36,
      color: '#ffffff',
      lineWidth: 2,
      fillAlpha: 0.04,
      dash: [5, 9],
      spokes: 8,
      spin: 0.9,
    });
    if (Math.hypot(boss.x - partner.x, boss.y - partner.y) > 110) {
      addParticles(effectPlan, midX, midY, boss.color, 8, 55);
    }
  }

  if (boss.form === 'dragon') {
    const retreatAngle = Math.atan2(player.y - boss.y, player.x - boss.x) + Math.PI;
    for (let index = 0; index < 3; index += 1) {
      addImpactWave(
        effectPlan,
        boss.x + Math.cos(retreatAngle) * (28 + index * 20),
        boss.y + Math.sin(retreatAngle) * (18 + index * 18),
        {
          startRadius: 10 + index * 3,
          maxRadius: 34 + index * 12,
          growth: 180,
          life: 0.26 + index * 0.03,
          color: index === 2 ? '#ffd166' : COLORS.enemyBomber,
          lineWidth: 2,
          fillAlpha: 0.08,
          dash: [6, 8],
          spokes: 4,
        }
      );
    }
    addParticles(effectPlan, boss.x - boss.radius * 0.6, boss.y, '#ffd166', 6, 70);
  }

  if (boss.form === 'spider') {
    for (let spoke = 0; spoke < 4; spoke += 1) {
      const angle = (Math.PI * 2 * spoke) / 4 + (boss.uid % 3) * 0.18;
      addImpactWave(effectPlan, boss.x + Math.cos(angle) * boss.radius * 1.45, boss.y + Math.sin(angle) * boss.radius * 1.15, {
        startRadius: 6,
        maxRadius: 28,
        growth: 160,
        life: 0.24,
        color: boss.color,
        lineWidth: 1.5,
        fillAlpha: 0.05,
        dash: [3, 8],
        spokes: 3,
      });
    }
  }

  if (boss.form === 'astrolabe') {
    addImpactWave(effectPlan, boss.x, boss.y, {
      startRadius: boss.radius * 0.85,
      maxRadius: boss.radius + 34,
      growth: 120,
      life: 0.34,
      color: '#ffffff',
      lineWidth: 2,
      fillAlpha: 0.02,
      dash: [2, 7],
      spokes: 7,
      spin: -1.1,
    });
  }

  return effectPlan;
};
