import { useEffect, useRef, useState } from 'react';
import { BOSS_ORDER, BOSS_TYPES, COLORS, ENEMY_ORDER, ENEMY_TYPES, UI_COPY, createInitialTowerCatalog } from '../../data/gameConfig';
import { getBossPresentation } from '../../data/bossPresentation';
import { WAVE_DEBUG_CHECKPOINTS, WAVE_TABLE } from '../../data/waveTable';
import { runBossAbilityEffect } from '../engine/bossAbilityRuntime.js';
import { createBossBehaviorNode, DEFAULT_BOSS_ABILITY_COOLDOWNS } from '../engine/bossAuthoringRules.js';
import { updateDropRuntime, updateHazardRuntime, updateProjectileRuntime, updateTransientVisualRuntime } from '../engine/combatFrameRuntime.js';
import { updatePlayerOffenseRuntime, updateTowerOffenseRuntime } from '../engine/combatOffenseRuntime.js';
import { updateEnemyBehaviorRuntime } from '../engine/enemyBehaviorRuntime.js';
import { settleEnemyDefeatRuntime, settlePendingBossRewardRuntime } from '../engine/enemyDefeatRuntime.js';
import { findOpenEnemySpawnPosition, getBossSummonSpawnCount } from '../engine/bossFlowRules.js';
import { getAreaDamageHits, resolveEnemyDamage, resolveTargetDamage } from '../engine/combatRules.js';
import { createWaveDefinition, getSpawnPosition } from '../engine/gameRules';
import { resolveRewardFollowUp, resolveWaveTick, shouldAutoRunWaveFlow } from '../engine/progressionRules.js';
import { evaluateTowerPlacement, updateDragPlacementState } from '../engine/placementRules.js';
import { applyRewardChoiceEffects, buildRewardOfferPlan, materializeRewardChoices, recordRewardOffers, recordRewardPick } from '../engine/rewardRules.js';
import { buildTowerAtLevel } from '../engine/towerRules.js';
import { createEmptyWaveState, createRuntimeState, createWaveRuntimeState } from '../engine/gameState';
import { dist, formatTime, rand } from '../engine/gameMath';
import { drawGameScene, getBossPhaseCalloutText, getBossPhaseHint, getBossPhaseTone } from '../../view/canvas/canvasRenderer.js';
import useBossEditorRuntime from './useBossEditorRuntime.js';
import useCanvasGameLoop from './useCanvasGameLoop.js';
import useGameAudio from './useGameAudio.js';

const DRAG_CANCEL_MARGIN = 18;
const DEBUG_SANDBOX_OVERVIEW = {
  label: 'Free Sandbox',
  focus: 'Drag towers, enemies, and bosses onto the live map.',
};

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const cloneTower = (tower) => ({ ...tower });

const splitEncounterValue = (totalValue, shares) => {
  let remaining = totalValue;
  return shares.map((share, index) => {
    const isLast = index === shares.length - 1;
    const value = isLast ? remaining : Math.max(1, Math.round(totalValue * share));
    remaining -= value;
    return value;
  });
};

const createTwinsEncounterMembers = (bossTemplate) => {
  const [sunValue, moonValue] = splitEncounterValue(bossTemplate.value, [0.5, 0.5]);

  return [
    {
      id: 'TWIN_SOL',
      name: '曜子',
      form: 'twinSun',
      isBoss: true,
      enemyType: 'BOSS',
      hp: Math.round(bossTemplate.maxHp * 0.46),
      maxHp: Math.round(bossTemplate.maxHp * 0.46),
      speed: Math.round(bossTemplate.baseSpeed * 1.26),
      damage: Math.max(8, Math.round(bossTemplate.damage * 0.72)),
      radius: 24,
      color: COLORS.enemyBomber,
      value: sunValue,
      phases: [
        { name: '炽近', hpBelow: 1, abilities: ['solarDash'] },
        { name: '灼线', hpBelow: 0.68, abilities: ['solarDash', 'flareLance', 'twinCrossfire'] },
        { name: '日蚀', hpBelow: 0.34, abilities: ['solarDash', 'flareLance', 'twinCrossfire', 'eclipsePulse'] },
      ],
    },
    {
      id: 'TWIN_LUNA',
      name: '蚀子',
      form: 'twinMoon',
      isBoss: true,
      enemyType: 'BOSS',
      hp: Math.round(bossTemplate.maxHp * 0.54),
      maxHp: Math.round(bossTemplate.maxHp * 0.54),
      speed: Math.round(bossTemplate.baseSpeed * 0.92),
      damage: Math.max(7, Math.round(bossTemplate.damage * 0.62)),
      radius: 26,
      color: COLORS.enemyPhase,
      value: moonValue,
      phases: [
        { name: '月网', hpBelow: 1, abilities: ['lunarSnare'] },
        { name: '锁域', hpBelow: 0.68, abilities: ['lunarSnare', 'shadowArc', 'twinCrossfire'] },
        { name: '残月', hpBelow: 0.34, abilities: ['lunarSnare', 'shadowArc', 'twinCrossfire', 'eclipsePulse'] },
      ],
    },
  ];
};

const getBossPhaseOverrides = (bossTemplate) => {
  if (bossTemplate.id === 'COMMANDER') {
    return [
      { name: '列阵', hpBelow: 1, abilities: ['summonFormation', 'commandLine'] },
      { name: '压阵', hpBelow: 0.6, abilities: ['summonFormation', 'commandLine', 'shieldPulse', 'phalanxAdvance'] },
      { name: '破阵', hpBelow: 0.3, abilities: ['summonFormation', 'shieldPulse', 'phalanxAdvance', 'commandRush'] },
    ];
  }
  if (bossTemplate.id === 'HUNTER') {
    return [
      { name: '试探', hpBelow: 1, abilities: ['dashAtPlayer', 'markPrey'] },
      { name: '围猎', hpBelow: 0.7, abilities: ['dashAtPlayer', 'markPrey', 'summonScouts', 'pincerRush'] },
      { name: '残猎', hpBelow: 0.35, abilities: ['dashAtPlayer', 'markPrey', 'pincerRush', 'afterimageBurst', 'feintStrike'] },
    ];
  }
  if (bossTemplate.id === 'FORTRESS') {
    return [
      { name: '推城', hpBelow: 1, abilities: ['summonSiege', 'bastionMortar'] },
      { name: '重甲', hpBelow: 0.5, abilities: ['summonSiege', 'bastionMortar', 'fortify', 'shockRam'] },
      { name: '崩垒', hpBelow: 0.2, abilities: ['summonSiege', 'fortify', 'shockRam', 'quake', 'bunkerRing'] },
    ];
  }
  if (bossTemplate.id === 'PRISM') {
    return [
      { name: '折光', hpBelow: 1, abilities: ['prismBeam', 'refractVolley'] },
      { name: '镜列', hpBelow: 0.66, abilities: ['prismBeam', 'refractVolley', 'mirrorSummon', 'prismLattice'] },
      { name: '棱镜', hpBelow: 0.33, abilities: ['prismBeam', 'mirrorSummon', 'prismLattice', 'tripleBeam', 'mirrorStep'] },
    ];
  }
  if (bossTemplate.id === 'HIVE') {
    return [
      { name: '铺巢', hpBelow: 1, abilities: ['spawnHive', 'broodShift'] },
      { name: '孵潮', hpBelow: 0.75, abilities: ['spawnHive', 'broodShift', 'hivePulse', 'summonSwarm'] },
      { name: '迁巢', hpBelow: 0.35, abilities: ['spawnHive', 'hivePulse', 'summonSwarm', 'hiveCollapse', 'broodShift'] },
    ];
  }
  if (bossTemplate.id === 'FROST_JUDGE') {
    return [
      { name: '冰审', hpBelow: 1, abilities: ['frostRing', 'whiteout'] },
      { name: '封判', hpBelow: 0.6, abilities: ['frostRing', 'whiteout', 'freezeTower', 'glacialPrison'] },
      { name: '寒狱', hpBelow: 0.25, abilities: ['frostRing', 'freezeTower', 'glacialPrison', 'summonFrostGuards', 'coldSnap'] },
    ];
  }
  if (bossTemplate.id === 'RAIL_WARLORD') {
    return [
      { name: '锁线', hpBelow: 1, abilities: ['railShot', 'crosshairBarrage'] },
      { name: '钉杀', hpBelow: 0.7, abilities: ['railShot', 'markTower', 'crosshairBarrage', 'suppressiveGrid'] },
      { name: '歼灭', hpBelow: 0.4, abilities: ['railShot', 'markTower', 'suppressiveGrid', 'overload', 'killLane'] },
    ];
  }
  if (bossTemplate.id === 'COLLECTOR') {
    return [
      { name: '抽税', hpBelow: 1, abilities: ['stealMoney', 'taxBeacon'] },
      { name: '搬运', hpBelow: 0.5, abilities: ['stealMoney', 'taxBeacon', 'summonScouts', 'paydaySweep'] },
      { name: '收账', hpBelow: 0.25, abilities: ['stealMoney', 'summonScouts', 'paydaySweep', 'ransomBurst', 'repossess'] },
    ];
  }
  if (bossTemplate.id === 'BLOOD_FORGE') {
    return [
      { name: '铸火', hpBelow: 1, abilities: ['forgeArmor', 'slagDrop'] },
      { name: '献炉', hpBelow: 0.58, abilities: ['forgeArmor', 'slagDrop', 'sacrificeMinions', 'brandLine'] },
      { name: '过热', hpBelow: 0.24, abilities: ['forgeArmor', 'sacrificeMinions', 'brandLine', 'moltenBurst', 'forgeDetonation'] },
    ];
  }
  if (bossTemplate.id === 'VOID_CONDUCTOR') {
    return [
      { name: '起拍', hpBelow: 1, abilities: ['conductLines', 'pulseMeasure'] },
      { name: '切分', hpBelow: 0.68, abilities: ['conductLines', 'pulseMeasure', 'tempoShift', 'syncopate'] },
      { name: '终章', hpBelow: 0.34, abilities: ['conductLines', 'tempoShift', 'syncopate', 'finale', 'crescendo'] },
    ];
  }
  if (bossTemplate.id === 'LABYRINTH_KEEPER') {
    return [
      { name: '筑墙', hpBelow: 1, abilities: ['raiseWalls', 'corridorClamp'] },
      { name: '换门', hpBelow: 0.65, abilities: ['raiseWalls', 'corridorClamp', 'gateSwap', 'mazeFold'] },
      { name: '迷狱', hpBelow: 0.3, abilities: ['raiseWalls', 'gateSwap', 'mazeFold', 'mazeCrush', 'deadEnd'] },
    ];
  }
  if (bossTemplate.id === 'NIGHTMARE_BLOOM') {
    return [
      { name: '播种', hpBelow: 1, abilities: ['seedPods', 'blightRoots'] },
      { name: '绽瘴', hpBelow: 0.68, abilities: ['seedPods', 'blightRoots', 'poisonBloom', 'sporeBurst'] },
      { name: '花园', hpBelow: 0.33, abilities: ['seedPods', 'poisonBloom', 'sporeBurst', 'gardenWake', 'creepingCanopy'] },
    ];
  }
  if (bossTemplate.id === 'DRAGON') {
    return [
      { name: '盘旋', hpBelow: 1, abilities: ['dragonStrafe', 'emberWake'] },
      { name: '俯冲', hpBelow: 0.66, abilities: ['dragonStrafe', 'emberWake', 'wingBuffet', 'meteorRain'] },
      { name: '天火', hpBelow: 0.3, abilities: ['dragonStrafe', 'wingBuffet', 'meteorRain', 'skyDive', 'infernoRing'] },
    ];
  }
  if (bossTemplate.id === 'SPIDER_MATRIARCH') {
    return [
      { name: '织杀', hpBelow: 1, abilities: ['webTrap', 'silkVolley'] },
      { name: '孵潮', hpBelow: 0.7, abilities: ['webTrap', 'silkVolley', 'spawnSpiderlings', 'broodAmbush'] },
      { name: '巢域', hpBelow: 0.35, abilities: ['webTrap', 'spawnSpiderlings', 'broodAmbush', 'nestBloom', 'webField'] },
    ];
  }
  if (bossTemplate.id === 'ASTROLABE') {
    return [
      { name: '引潮', hpBelow: 1, abilities: ['gravityWell', 'starfall'] },
      { name: '轨域', hpBelow: 0.62, abilities: ['gravityWell', 'orbitalShots', 'starfall', 'orbitalLock'] },
      { name: '奇点', hpBelow: 0.28, abilities: ['gravityWell', 'orbitalShots', 'orbitalLock', 'singularity', 'eventHorizon'] },
    ];
  }
  return bossTemplate.phases;
};

const enrichBossTemplate = (bossTemplate) => ({
  ...bossTemplate,
  phases: getBossPhaseOverrides(bossTemplate),
});

const getBossEditorBaseTemplate = (bossId) => {
  const bossTemplate = BOSS_TYPES[bossId];
  return bossTemplate ? enrichBossTemplate(bossTemplate) : null;
};

export default function useGeoGuardGame() {
  const { audioSettings, setAudioEnabled, setAudioVolume, playCue, resumeAudio } = useGameAudio();
  const canvasRef = useRef(null);
  const game = useRef(createRuntimeState());
  const towerCatalogRef = useRef(createInitialTowerCatalog());
  const [gameState, setGameState] = useState('START');
  const [money, setMoney] = useState(0);
  const [health, setHealth] = useState(100);
  const [maxHealth] = useState(100);
  const [time, setTime] = useState(0);
  const [waveMsg, setWaveMsg] = useState(null);
  const [currentWave, setCurrentWave] = useState(1);
  const [waveOverview, setWaveOverview] = useState({ label: '', focus: '' });
  const [dragTowerId, setDragTowerId] = useState(null);
  const [dragEntity, setDragEntity] = useState(null);
  const [towerCatalog, setTowerCatalog] = useState(createInitialTowerCatalog());
  const [rewardState, setRewardState] = useState({ active: false, choices: [] });
  const [bossHud, setBossHud] = useState([]);
  const [debugOptions, setDebugOptions] = useState({ infiniteMoney: false, infiniteHealth: false });
  const [debugWaveFlow, setDebugWaveFlow] = useState(false);
  const [towerContextMenu, setTowerContextMenu] = useState(null);
  const waveMessageTimeoutRef = useRef(null);
  const bossEditor = useBossEditorRuntime({
    bossOrder: BOSS_ORDER,
    getBossEditorBaseTemplate,
    isDebugMode: () => game.current.mode === 'debug',
  });
  const { applyDebugBossAuthoring, ...bossEditorPanelState } = bossEditor;

  towerCatalogRef.current = towerCatalog;
  game.current.towerCatalog = towerCatalog;

  useEffect(
    () => () => {
      if (waveMessageTimeoutRef.current) {
        window.clearTimeout(waveMessageTimeoutRef.current);
      }
    },
    []
  );

  const showWaveMessage = (message, duration = 1800) => {
    const nextMessage = typeof message === 'string' ? { title: message, tone: 'system' } : message;
    if (waveMessageTimeoutRef.current) {
      window.clearTimeout(waveMessageTimeoutRef.current);
    }
    setWaveMsg(nextMessage);
    waveMessageTimeoutRef.current = window.setTimeout(() => setWaveMsg(null), duration);
  };

  const spawnParticle = (x, y, color, count, speedBase = 50) => {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * speedBase + 20;
      game.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: rand(0.3, 0.6),
        color,
        size: rand(2, 4),
      });
    }
  };

  const spawnFloatingText = (x, y, text, color, options = {}) => {
    const life = options.life ?? 0.8;
    game.current.floatingTexts.push({
      x,
      y,
      text,
      color,
      life,
      maxLife: life,
      vy: options.vy ?? -30,
      font: options.font ?? 'bold 14px system-ui, sans-serif',
      outlineColor: options.outlineColor ?? null,
    });
  };

  const spawnImpactWave = (x, y, options = {}) => {
    game.current.impactWaves.push({
      x,
      y,
      radius: options.startRadius ?? 6,
      maxRadius: options.maxRadius ?? 54,
      growth: options.growth ?? 220,
      life: options.life ?? 0.28,
      maxLife: options.life ?? 0.28,
      color: options.color ?? COLORS.towerCannon,
      lineWidth: options.lineWidth ?? 4,
      fillAlpha: options.fillAlpha ?? 0.12,
      dash: options.dash ?? [],
      spokes: options.spokes ?? 0,
      spin: options.spin ?? 0,
      style: options.style ?? null,
      accentColor: options.accentColor ?? options.color ?? COLORS.towerCannon,
      secondaryColor: options.secondaryColor ?? '#ffffff',
      nodeCount: options.nodeCount ?? 6,
      anchorA: options.anchorA ?? null,
      anchorB: options.anchorB ?? null,
      rotation: options.rotation ?? 0,
    });
  };

  const syncHudMoney = () => setMoney(game.current.debugOptions.infiniteMoney ? '∞' : game.current.money);
  const syncHudHealth = () => setHealth(game.current.debugOptions.infiniteHealth ? game.current.player.maxHp : Math.max(0, Math.floor(game.current.player.hp)));

  const resetCombatState = ({ clearTowers = false } = {}) => {
    game.current.enemies = [];
    if (clearTowers) {
      game.current.towers = [];
    }
    game.current.projectiles = [];
    game.current.drops = [];
    game.current.particles = [];
    game.current.impactWaves = [];
    game.current.hazards = [];
    game.current.floatingTexts = [];
    game.current.wave.awaitingReward = false;
    game.current.wave.pendingRewardBossUid = null;
    game.current.wave.pendingRewardBossEncounterUid = null;
    setRewardState({ active: false, choices: [] });
    setBossHud([]);
    setTowerContextMenu(null);
    clearDragPlacement();
  };

  const enterDebugSandbox = ({ clearTowers = false, announce = false } = {}) => {
    resetCombatState({ clearTowers });
    game.current.debugWaveFlow = false;
    game.current.wave = createEmptyWaveState();
    setDebugWaveFlow(false);
    setCurrentWave(0);
    setWaveOverview(DEBUG_SANDBOX_OVERVIEW);
    if (announce) {
      showWaveMessage(
        {
          title: 'Sandbox Ready',
          subtitle: 'Manual spawn mode is active again.',
          tone: 'system',
        },
        1800
      );
    }
  };

  const syncBossHud = () => {
    const bosses = game.current.enemies.filter((enemy) => enemy.isBoss);
    const groups = new Map();
    for (const boss of bosses) {
      const key = boss.encounterUid ? `enc-${boss.encounterUid}` : `boss-${boss.uid}`;
      const presentation = getBossPresentation(boss.encounterBossId ?? boss.id);
      const existing = groups.get(key) ?? {
        id: key,
        title: boss.encounterName ?? boss.name,
        summary: presentation?.summary ?? '',
        threats: presentation?.threats ?? [],
        counterplay: presentation?.counterplay ?? '',
        members: [],
      };
      existing.members.push({
        id: boss.uid,
        name: boss.name,
        color: boss.color,
        hpRatio: Math.max(0, boss.hp / boss.maxHp),
        phase: boss.phases?.[boss.currentPhaseIndex]?.name ?? '',
        phaseIndex: boss.currentPhaseIndex ?? 0,
        phaseCount: boss.phases?.length ?? 0,
        phaseHint: getBossPhaseHint(boss, boss.currentPhaseIndex ?? 0),
        phaseTone: getBossPhaseTone(boss, boss.currentPhaseIndex ?? 0),
        enraged: Boolean(boss.bossState.partnerFallen),
      });
      groups.set(key, existing);
    }

    const nextHud = [...groups.values()].map((group) => ({
      ...group,
      members: group.members.sort((left, right) => left.id - right.id),
    }));
    setBossHud((previous) => {
      const previousJson = JSON.stringify(previous);
      const nextJson = JSON.stringify(nextHud);
      return previousJson === nextJson ? previous : nextHud;
    });
  };

  const showBossSpotlight = (bossTemplate, options = {}) => {
    void playCue('boss_incoming');
    const presentation = getBossPresentation(bossTemplate.id);
    const subtitleParts = [];
    if (presentation?.threats?.length) {
      subtitleParts.push(`关键词：${presentation.threats.join(' / ')}`);
    }
    if (presentation?.counterplay) {
      subtitleParts.push(`应对：${presentation.counterplay}`);
    }
    showWaveMessage(
      {
        title: `${options.prefix ?? UI_COPY.bossIncoming} · ${bossTemplate.name}`,
        subtitle: subtitleParts.join('  ｜  '),
        tone: 'boss',
        accentColor: bossTemplate.color,
      },
      options.duration ?? 3200
    );
  };

  const addCameraShake = (strength, duration = 0.28) => {
    const camera = game.current.camera;
    camera.shakeTimer = Math.max(camera.shakeTimer ?? 0, duration);
    camera.shakeDuration = Math.max(camera.shakeDuration ?? 0, duration);
    camera.shakeStrength = Math.max(camera.shakeStrength ?? 0, strength);
    camera.shakeSeed = Math.random() * Math.PI * 2;
  };

  const triggerBossPhaseShift = (boss, activePhase, activePhaseIndex, previousPhaseIndex = -1) => {
    void playCue('boss_phase_shift');
    boss.bossState.phaseIntroTimer = 1.15;
    boss.bossState.phaseIntroDuration = 1.15;
    addCameraShake(12 + activePhaseIndex * 2, previousPhaseIndex >= 0 ? 0.42 : 0.28);
    spawnImpactWave(boss.x, boss.y, {
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
    spawnImpactWave(boss.x, boss.y, {
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
    spawnParticle(boss.x, boss.y, boss.color, 20 + activePhaseIndex * 6, 90 + activePhaseIndex * 20);
    spawnFloatingText(boss.x, boss.y - boss.radius - 20, activePhase.name, boss.color, {
      life: 1.05,
      vy: -24,
      font: 'bold 16px system-ui, sans-serif',
      outlineColor: 'rgba(15,23,42,0.55)',
    });

    if (previousPhaseIndex >= 0) {
      const shouldAnnounce =
        !boss.encounterUid ||
        boss.form === 'dragon' ||
        boss.form === 'spider' ||
        boss.form === 'astrolabe' ||
        ((boss.form === 'twinSun' || boss.form === 'twinMoon') && boss.twinRole === 'sun');
      if (shouldAnnounce) {
        showWaveMessage(
          {
            title: `${boss.encounterName ?? boss.name} · ${activePhase.name}`,
            subtitle: getBossPhaseCalloutText(boss, activePhaseIndex),
            tone: 'phase',
            accentColor: boss.color,
          },
          1700
        );
      }
    }

    if (boss.form === 'twinSun' || boss.form === 'twinMoon') {
      const partner = getEncounterPartner(boss);
      if (partner) {
        const midX = (boss.x + partner.x) * 0.5;
        const midY = (boss.y + partner.y) * 0.5;
        spawnImpactWave(partner.x, partner.y, {
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
        spawnImpactWave(midX, midY, {
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
        spawnParticle(midX, midY, '#ffffff', 12 + activePhaseIndex * 4, 80);
      }
    }

    if (boss.form === 'dragon') {
      for (const offset of [-1, 1]) {
        spawnImpactWave(boss.x - boss.radius * 0.45, boss.y + offset * boss.radius * 0.28, {
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
      spawnParticle(boss.x - boss.radius * 0.65, boss.y, '#ffd166', 10 + activePhaseIndex * 4, 120);
    }

    if (boss.form === 'spider') {
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6;
        spawnImpactWave(boss.x + Math.cos(angle) * boss.radius * 1.4, boss.y + Math.sin(angle) * boss.radius * 1.1, {
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
        spawnImpactWave(boss.x, boss.y, {
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
      boss.bossState.orbitalIndex = (boss.bossState.orbitalIndex ?? 0) + 1;
    }
  };

  const triggerBossClimaxAccent = (boss) => {
    if (boss.currentPhaseIndex < (boss.phases?.length ?? 0) - 1) return;

    if (boss.form === 'twinSun' || boss.form === 'twinMoon') {
      const partner = getEncounterPartner(boss);
      if (partner) {
        const midX = (boss.x + partner.x) * 0.5;
        const midY = (boss.y + partner.y) * 0.5;
        spawnImpactWave(midX, midY, {
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
        if (dist(boss, partner) > 110) {
          spawnParticle(midX, midY, boss.color, 8, 55);
        }
      }
    }

    if (boss.form === 'dragon') {
      const retreatAngle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x) + Math.PI;
      for (let index = 0; index < 3; index += 1) {
        spawnImpactWave(
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
      spawnParticle(boss.x - boss.radius * 0.6, boss.y, '#ffd166', 6, 70);
    }

    if (boss.form === 'spider') {
      for (let spoke = 0; spoke < 4; spoke += 1) {
        const angle = (Math.PI * 2 * spoke) / 4 + (boss.uid % 3) * 0.18;
        spawnImpactWave(
          boss.x + Math.cos(angle) * boss.radius * 1.45,
          boss.y + Math.sin(angle) * boss.radius * 1.15,
          {
            startRadius: 6,
            maxRadius: 28,
            growth: 160,
            life: 0.24,
            color: boss.color,
            lineWidth: 1.5,
            fillAlpha: 0.05,
            dash: [3, 8],
            spokes: 3,
          }
        );
      }
    }

    if (boss.form === 'astrolabe') {
      spawnImpactWave(boss.x, boss.y, {
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
  };

  const getTowerById = (towerId) => towerCatalogRef.current.find((tower) => tower.id === towerId);

  const getDebugDragEntity = (kind, entityId) =>
    kind === 'boss' ? applyDebugBossAuthoring(getBossEditorBaseTemplate(entityId)) : ENEMY_TYPES[entityId];

  const createEnemyFromKey = (enemyKey) => {
    const baseEnemy = ENEMY_TYPES[enemyKey];
    return {
      ...baseEnemy,
      uid: game.current.nextEnemyUid++,
      hp: baseEnemy.hp,
      maxHp: baseEnemy.hp,
      baseSpeed: baseEnemy.speed,
      shield: baseEnemy.shield ?? 0,
      maxShield: baseEnemy.shield ?? 0,
      slowTimer: 0,
      slowRatio: 1,
      hitFlash: 0,
      abilityTimer: 0,
      summonTimer: 0,
      phaseTimer: baseEnemy.phase?.interval ?? 0,
      phased: false,
      burrowTimer: baseEnemy.burrow ? baseEnemy.burrow.duration : 0,
      burrowed: Boolean(baseEnemy.burrow),
      fuseTimer: null,
      summonedByBossUid: null,
      summonedByEncounterUid: null,
      summonCategory: null,
    };
  };

  const createBossEnemy = (bossTemplate) => {
    const enrichedBoss = bossTemplate.authoredTemplate ? bossTemplate : enrichBossTemplate(bossTemplate);
    return {
      ...enrichedBoss,
      uid: game.current.nextEnemyUid++,
      hp: enrichedBoss.hp,
      maxHp: enrichedBoss.maxHp ?? enrichedBoss.hp,
    baseSpeed: enrichedBoss.speed,
    shield: 0,
    maxShield: 0,
    slowTimer: 0,
    slowRatio: 1,
    hitFlash: 0,
    currentPhaseIndex: -1,
      abilityCooldowns: {},
      bossState: {},
      isDefeated: false,
    };
  };

  const getBossOwnership = (boss) => ({
    ownerBossUid: boss.uid,
    ownerEncounterUid: boss.encounterUid ?? null,
  });

  const getEncounterPartner = (boss) => {
    if (!boss.encounterUid) return null;
    return game.current.enemies.find((enemy) => enemy.isBoss && enemy.uid !== boss.uid && enemy.encounterUid === boss.encounterUid) ?? null;
  };

  const spawnEnemyAt = (enemyKey, x, y, extras = {}) => {
    const enemy = { ...createEnemyFromKey(enemyKey), x, y, ...extras };
    if (enemy.burrow?.emergeNearPlayer && !extras.skipBurrowPosition) {
      const angle = Math.random() * Math.PI * 2;
      enemy.x = game.current.player.x + Math.cos(angle) * enemy.burrow.emergeNearPlayer;
      enemy.y = game.current.player.y + Math.sin(angle) * enemy.burrow.emergeNearPlayer;
    }
    game.current.enemies.push(enemy);
    return enemy;
  };

  const spawnBossEncounterAt = (bossTemplate, x, y) => {
    if (bossTemplate.id === 'TWINS') {
      const encounterUid = game.current.nextBossEncounterUid++;
      const memberTemplates = createTwinsEncounterMembers({
        ...bossTemplate,
        baseSpeed: bossTemplate.baseSpeed ?? bossTemplate.speed,
        maxHp: bossTemplate.maxHp ?? bossTemplate.hp,
      });
      const offsets = [-1, 1];
      const bosses = memberTemplates.map((memberTemplate, index) => {
        const boss = createBossEnemy({
          ...memberTemplate,
          encounterUid,
          encounterBossId: bossTemplate.id,
          encounterName: bossTemplate.name,
          twinRole: index === 0 ? 'sun' : 'moon',
        });
        boss.x = x + offsets[index] * 54;
        boss.y = y + (index === 0 ? -18 : 18);
        return boss;
      });
      game.current.enemies.push(...bosses);
      return bosses;
    }

    const boss = createBossEnemy({
      ...bossTemplate,
      maxHp: bossTemplate.maxHp ?? bossTemplate.hp,
      isBoss: true,
      enemyType: 'BOSS',
    });
    boss.x = x;
    boss.y = y;
    game.current.enemies.push(boss);
    return [boss];
  };

  const spawnBossAt = (bossId, x, y) => {
    const baseBossTemplate = BOSS_TYPES[bossId];
    const bossTemplate = baseBossTemplate
      ? applyDebugBossAuthoring({
          ...baseBossTemplate,
          maxHp: baseBossTemplate.hp,
          isBoss: true,
          enemyType: 'BOSS',
        })
      : null;
    if (!bossTemplate) {
      return null;
    }

    const bosses = spawnBossEncounterAt(bossTemplate, x, y);
    showBossSpotlight(bossTemplate, { prefix: '测试 Boss', duration: 2600 });
    return bosses[0] ?? null;
  };

  const startWave = (waveNumber) => {
    const definition = createWaveDefinition(waveNumber);
    const authoredDefinition = game.current.mode === 'debug' ? { ...definition, boss: applyDebugBossAuthoring(definition.boss) } : definition;
    game.current.debugWaveFlow = game.current.mode === 'debug';
    setDebugWaveFlow(game.current.mode === 'debug');
    game.current.wave = createWaveRuntimeState(waveNumber, authoredDefinition);
    setCurrentWave(waveNumber);
    setWaveOverview({ label: authoredDefinition.label ?? '', focus: authoredDefinition.focus ?? '' });
    showWaveMessage(
      {
        title: `${UI_COPY.waveIncoming} ${waveNumber}`,
        subtitle: definition.label && definition.focus ? `${definition.label} ｜ ${definition.focus}` : definition.label ?? definition.focus ?? '',
        tone: 'wave',
      },
      2400
    );
  };

  const initGame = (options = {}) => {
    void resumeAudio();
    void playCue('ui_confirm');
    const isDebugMode = Boolean(options.debug);
    const initialCatalog = createInitialTowerCatalog().map((tower) => (isDebugMode ? { ...tower, available: true } : tower));
    const nextDebugOptions = { infiniteMoney: isDebugMode, infiniteHealth: isDebugMode };
    towerCatalogRef.current = initialCatalog;
    setTowerCatalog(initialCatalog);
    game.current = {
      ...createRuntimeState(),
      isMobile: window.innerWidth < 768,
      towerCatalog: initialCatalog,
      mode: isDebugMode ? 'debug' : 'normal',
      debugWaveFlow: false,
      debugOptions: nextDebugOptions,
      money: isDebugMode ? 999999 : 20,
    };
    setDebugOptions(nextDebugOptions);
    setDebugWaveFlow(false);
    setMoney(isDebugMode ? '∞' : 20);
    setHealth(100);
    setTime(0);
    setRewardState({ active: false, choices: [] });
    setBossHud([]);
    setWaveOverview(isDebugMode ? DEBUG_SANDBOX_OVERVIEW : { label: '', focus: '' });
    setDragTowerId(null);
    setDragEntity(null);
    setTowerContextMenu(null);
    setCurrentWave(isDebugMode ? 0 : 1);
    setGameState('PLAYING');
    if (isDebugMode) {
      showWaveMessage(
        {
          title: '开发测试场已开启',
          subtitle: '无限金钱和无限血量默认开启，可在顶部面板切换',
          tone: 'system',
        },
        2600
      );
      game.current.wave = createEmptyWaveState();
    } else {
      startWave(1);
    }
  };

  const evaluatePlacement = (tower, clientX, clientY) => {
    return evaluateTowerPlacement({
      tower,
      clientX,
      clientY,
      camera: game.current.camera,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      player: game.current.player,
      towers: game.current.towers,
      enemies: game.current.enemies,
      money: game.current.money,
      infiniteMoney: game.current.debugOptions.infiniteMoney,
      invalidPlacementText: UI_COPY.invalidPlacement,
      insufficientFundsText: UI_COPY.insufficientFunds,
    });
  };

  const updateDragPlacement = (clientX, clientY, towerOverride) => {
    if (!game.current.dragPlacement.active) {
      return;
    }
    const tower = towerOverride ?? getTowerById(game.current.dragPlacement.towerId);
    if (game.current.dragPlacement.kind === 'tower' && !tower) return;

    game.current.dragPlacement = updateDragPlacementState({
      dragPlacement: game.current.dragPlacement,
      clientX,
      clientY,
      camera: game.current.camera,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      tower,
      player: game.current.player,
      towers: game.current.towers,
      enemies: game.current.enemies,
      money: game.current.money,
      infiniteMoney: game.current.debugOptions.infiniteMoney,
      invalidPlacementText: UI_COPY.invalidPlacement,
      insufficientFundsText: UI_COPY.insufficientFunds,
    });
  };

  const clearDragPlacement = () => {
    game.current.dragPlacement = { active: false, kind: 'tower', entityId: null, towerId: null, pointerX: 0, pointerY: 0, worldX: 0, worldY: 0, canPlace: false, invalidReason: null };
    setDragTowerId(null);
    setDragEntity(null);
  };

  const tryBuildDraggedTower = (clientX, clientY) => {
    const cancelRects = [game.current.buildBarRect, game.current.debugPanelRect].filter(Boolean);
    if (
      cancelRects.some(
        (rect) =>
          clientX >= rect.left - DRAG_CANCEL_MARGIN &&
          clientX <= rect.right + DRAG_CANCEL_MARGIN &&
          clientY >= rect.top - DRAG_CANCEL_MARGIN &&
          clientY <= rect.bottom + DRAG_CANCEL_MARGIN
      )
    ) {
      clearDragPlacement();
      return;
    }

    if (game.current.dragPlacement.kind === 'enemy' || game.current.dragPlacement.kind === 'boss') {
      const { worldX, worldY, kind, entityId } = game.current.dragPlacement;
      if (kind === 'boss') {
        spawnBossAt(entityId, worldX, worldY);
      } else {
        spawnEnemyAt(entityId, worldX, worldY, { skipBurrowPosition: true });
        void playCue('ui_confirm');
      }
      spawnParticle(worldX, worldY, kind === 'boss' ? COLORS.boss : ENEMY_TYPES[entityId]?.color ?? COLORS.danger, kind === 'boss' ? 24 : 12, 70);
      clearDragPlacement();
      return;
    }

    const tower = getTowerById(game.current.dragPlacement.towerId);
    if (!tower) {
      clearDragPlacement();
      return;
    }

    const placement = evaluatePlacement(tower, clientX, clientY);
    if (!placement.canPlace) {
      void playCue('ui_error');
      spawnFloatingText(placement.worldPoint.x, placement.worldPoint.y, placement.invalidReason, COLORS.danger);
      clearDragPlacement();
      return;
    }

    if (!game.current.debugOptions.infiniteMoney) {
      game.current.money -= tower.cost;
    }
    syncHudMoney();
    game.current.towers.push({
      ...cloneTower(tower),
      uid: game.current.nextTowerUid++,
      x: placement.worldPoint.x,
      y: placement.worldPoint.y,
      hp: tower.hp,
      maxHp: tower.hp,
      lastShoot: 0,
    });
    void playCue('tower_place');
    spawnParticle(placement.worldPoint.x, placement.worldPoint.y, tower.color, 15, 60);
    clearDragPlacement();
  };

  const beginTowerDrag = (towerId, clientX, clientY, touchId = null) => {
    if (gameState !== 'PLAYING' || rewardState.active) {
      return;
    }
    const tower = getTowerById(towerId);
    if (!tower || !tower.available) {
      return;
    }

    game.current.dragPlacement = {
      active: true,
      kind: 'tower',
      entityId: null,
      towerId,
      pointerX: clientX,
      pointerY: clientY,
      worldX: 0,
      worldY: 0,
      canPlace: false,
      invalidReason: null,
      touchId,
    };
    setDragTowerId(towerId);
    setDragEntity(null);
    updateDragPlacement(clientX, clientY, tower);
  };

  const beginDebugEntityDrag = (kind, entityId, clientX, clientY) => {
    if (gameState !== 'PLAYING' || game.current.mode !== 'debug') {
      return;
    }

    game.current.dragPlacement = {
      active: true,
      kind,
      entityId,
      towerId: null,
      pointerX: clientX,
      pointerY: clientY,
      worldX: 0,
      worldY: 0,
      canPlace: true,
      invalidReason: null,
    };
    setDragTowerId(null);
    setDragEntity({ kind, id: entityId });
    updateDragPlacement(clientX, clientY);
  };

  const buildRewardChoices = (catalog) => {
    const waveNumber = Math.max(1, game.current.wave.number || currentWave || 1);
    const plan = buildRewardOfferPlan({
      catalog,
      waveNumber,
      money: typeof money === 'number' ? money : game.current.money,
      hp: game.current.player.hp,
      maxHp: game.current.player.maxHp,
      infiniteMoney: game.current.debugOptions.infiniteMoney,
      history: game.current.rewardHistory,
    });

    return materializeRewardChoices(catalog, plan);
  };

  const openBossReward = () => {
    void playCue('reward_open');
    game.current.wave.awaitingReward = true;
    game.current.wave.pendingRewardBossUid = null;
    game.current.wave.pendingRewardBossEncounterUid = null;
    const choices = buildRewardChoices(towerCatalogRef.current);
    game.current.rewardHistory = recordRewardOffers(game.current.rewardHistory, choices);
    setRewardState({ active: true, choices });
  };

  const applyRewardChoice = (choice) => {
    void playCue('reward_pick');
    game.current.rewardHistory = recordRewardPick(game.current.rewardHistory, choice);
    const previousCatalog = towerCatalogRef.current;
    const rewardResult = applyRewardChoiceEffects({
      catalog: previousCatalog,
      choice,
      money: game.current.money,
      hp: game.current.player.hp,
      maxHp: game.current.player.maxHp,
    });

    if (rewardResult.catalog !== previousCatalog) {
      towerCatalogRef.current = rewardResult.catalog;
      setTowerCatalog(rewardResult.catalog);
    }

    if (rewardResult.money !== game.current.money) {
      game.current.money = rewardResult.money;
      syncHudMoney();
    }

    if (rewardResult.hp !== game.current.player.hp) {
      game.current.player.hp = rewardResult.hp;
      syncHudHealth();
    }

    setRewardState({ active: false, choices: [] });
    const followUp = resolveRewardFollowUp({
      mode: game.current.mode,
      debugWaveFlow: game.current.debugWaveFlow,
      currentWave,
    });
    if (followUp.type === 'debug-stay') {
      showWaveMessage(
        {
          title: 'Reward Applied',
          subtitle: choice.title,
          tone: 'system',
        },
        1600
      );
      return;
    }
    startWave(followUp.waveNumber);
  };
  const setDebugOption = (key, value) => {
    const nextOptions = { ...game.current.debugOptions, [key]: value };
    game.current.debugOptions = nextOptions;
    setDebugOptions(nextOptions);
    if (key === 'infiniteMoney' && value) {
      game.current.money = 999999;
    } else if (key === 'infiniteMoney' && !value && game.current.money > 99999) {
      game.current.money = 200;
    }
    if (key === 'infiniteHealth' && value) {
      game.current.player.hp = game.current.player.maxHp;
    }
    syncHudMoney();
    syncHudHealth();
  };

  const unlockAllBlueprints = () => {
    void playCue('ui_confirm');
    const nextCatalog = towerCatalogRef.current.map((tower) => ({ ...tower, available: true }));
    towerCatalogRef.current = nextCatalog;
    setTowerCatalog(nextCatalog);
    showWaveMessage({ title: 'All Towers Unlocked', subtitle: 'Every blueprint is now available in the build bar.', tone: 'system' }, 1500);
  };

  const placeTowerDirect = (towerId, x, y) => {
    const tower = getTowerById(towerId);
    if (!tower) {
      return;
    }
    game.current.towers.push({
      ...cloneTower(tower),
      uid: game.current.nextTowerUid++,
      x,
      y,
      hp: tower.hp,
      maxHp: tower.hp,
      lastShoot: 0,
    });
    spawnParticle(x, y, tower.color, 12, 60);
  };

  const applyDebugLayout = (layoutId) => {
    if (game.current.mode !== 'debug') {
      return;
    }

    const player = game.current.player;
    const layouts = {
      balanced: [
        ['SENTINEL', -120, -40],
        ['BASIC', -40, -120],
        ['CANNON', 0, 105],
        ['FROST', 130, -35],
        ['SNIPER', 210, -120],
        ['RAPID', -210, 110],
      ],
      spread: [
        ['RAIL', -260, -150],
        ['SNIPER', 250, -140],
        ['MORTAR', 0, -210],
        ['BURST', -200, 170],
        ['FROST', 0, 180],
        ['CANNON', 210, 165],
      ],
      boss: [
        ['SENTINEL', -150, 0],
        ['SENTINEL', 150, 0],
        ['CANNON', 0, 140],
        ['FROST', 0, -145],
        ['BURST', -210, 140],
        ['RAIL', 220, -120],
      ],
    };

    const layout = layouts[layoutId];
    if (!layout) {
      return;
    }

    game.current.towers = [];
    for (const [towerId, offsetX, offsetY] of layout) {
      placeTowerDirect(towerId, player.x + offsetX, player.y + offsetY);
    }

    showWaveMessage(
      {
        title: 'Layout Loaded',
        subtitle: `${layoutId} preset applied`,
        tone: 'system',
      },
      1500
    );
  };

  const clearDebugField = ({ clearTowers = false, sandbox = false } = {}) => {
    if (game.current.mode !== 'debug') {
      return;
    }
    if (sandbox) {
      enterDebugSandbox({ clearTowers, announce: true });
      return;
    }
    resetCombatState({ clearTowers });
    if (clearTowers) {
      showWaveMessage({ title: 'Field Reset', subtitle: 'Enemies, hazards, and towers cleared.', tone: 'system' }, 1500);
    } else {
      showWaveMessage({ title: 'Field Cleared', subtitle: 'Enemies, hazards, and projectiles removed.', tone: 'system' }, 1500);
    }
  };

  const startDebugWave = (waveNumber) => {
    if (game.current.mode !== 'debug') {
      return;
    }
    resetCombatState({ clearTowers: false });
    startWave(waveNumber);
  };

  const openDebugReward = () => {
    if (game.current.mode !== 'debug') {
      return;
    }
    void playCue('reward_open');
    setRewardState({ active: true, choices: buildRewardChoices(towerCatalogRef.current) });
  };

  const spawnBossFromEditor = () => {
    if (gameState !== 'PLAYING' || game.current.mode !== 'debug') {
      return;
    }

    const distance = 180;
    spawnBossAt(bossEditor.selectedBossId, game.current.player.x + distance, game.current.player.y - 30);
  };

  const forceBossPhase = (phaseNumber) => {
    if (game.current.mode !== 'debug') {
      return;
    }

    const bosses = game.current.enemies.filter((enemy) => enemy.isBoss && enemy.phases?.length);
    if (!bosses.length) {
      showWaveMessage({ title: 'No Active Boss', subtitle: 'Drag in a boss or start a debug wave first.', tone: 'system' }, 1500);
      return;
    }

    for (const boss of bosses) {
      const nextPhaseIndex = Math.max(0, Math.min((boss.phases?.length ?? 1) - 1, phaseNumber - 1));
      const previousPhaseIndex = boss.currentPhaseIndex ?? 0;
      boss.currentPhaseIndex = nextPhaseIndex;
      boss.abilityCooldowns = {};
      const lowerBound = boss.phases[nextPhaseIndex].hpBelow;
      const upperBound = nextPhaseIndex === 0 ? 1 : boss.phases[nextPhaseIndex - 1].hpBelow;
      const targetRatio = nextPhaseIndex >= (boss.phases.length - 1) ? Math.max(0.18, lowerBound * 0.72) : (upperBound + lowerBound) * 0.5;
      boss.hp = Math.max(1, Math.round(boss.maxHp * targetRatio));
      triggerBossPhaseShift(boss, boss.phases[nextPhaseIndex], nextPhaseIndex, previousPhaseIndex === nextPhaseIndex ? -1 : previousPhaseIndex);
    }
    syncBossHud();
  };

  const changeTowerBlueprintLevel = (towerId, delta) => {
    const nextCatalog = towerCatalogRef.current.map((tower) => {
      if (tower.id !== towerId) return tower;
      return buildTowerAtLevel(tower, (tower.level ?? 0) + delta);
    });
    towerCatalogRef.current = nextCatalog;
    setTowerCatalog(nextCatalog);
  };

  const changePlacedTowerLevel = (towerUid, delta) => {
    const tower = game.current.towers.find((candidate) => candidate.uid === towerUid);
    if (!tower) return;
    const nextTower = buildTowerAtLevel(tower, (tower.level ?? 0) + delta);
    Object.assign(tower, nextTower, {
      uid: tower.uid,
      x: tower.x,
      y: tower.y,
      hp: Math.min(nextTower.hp, Math.max(1, tower.hp + (nextTower.hp - tower.maxHp))),
      maxHp: nextTower.hp,
      lastShoot: tower.lastShoot,
    });
  };

  const openBlueprintContextMenu = (towerId, clientX, clientY) => {
    setTowerContextMenu({ type: 'blueprint', towerId, x: clientX, y: clientY });
  };

  const applyTowerContextAction = (delta) => {
    if (!towerContextMenu) return;
    if (towerContextMenu.type === 'blueprint') {
      changeTowerBlueprintLevel(towerContextMenu.towerId, delta);
    } else {
      changePlacedTowerLevel(towerContextMenu.towerUid, delta);
    }
    setTowerContextMenu(null);
  };

  const damageTarget = (target, amount) => {
    const damageResult = resolveTargetDamage({
      targetHp: target.hp,
      amount,
      infiniteHealth: target === game.current.player && game.current.debugOptions.infiniteHealth,
    });
    target.hp = damageResult.hp;
  };

  const damageEnemy = (enemy, amount) => {
    const damageResult = resolveEnemyDamage(enemy, amount);
    enemy.hp = damageResult.hp;
    enemy.shield = damageResult.shield;
  };

  const damageArea = (x, y, radius, amount, options = {}) => {
    const areaHits = getAreaDamageHits({
      origin: { x, y },
      radius,
      player: game.current.player,
      towers: game.current.towers,
      amount,
      towerFactor: options.towerFactor ?? 1,
    });

    if (areaHits.playerHit) {
      damageTarget(game.current.player, amount);
      syncHudHealth();
    }

    for (const hit of areaHits.towerHits) {
      const tower = game.current.towers[hit.index];
      if (tower) {
        damageTarget(tower, hit.damage);
      }
    }

    spawnImpactWave(x, y, { maxRadius: radius, growth: 360, life: 0.26, color: options.color ?? COLORS.danger, lineWidth: 4, fillAlpha: 0.12 });
  };

  const spawnAround = (source, enemyKey, count, radius = 46, options = {}) => {
    const enemyTemplate = ENEMY_TYPES[enemyKey];
    if (!enemyTemplate) return 0;

    const remaining = getBossSummonSpawnCount({
      enemies: game.current.enemies,
      bossUid: options.ownerBossUid,
      summonCategory: options.summonCategory ?? enemyKey,
      requestedCount: count,
      maxActive: options.maxActive,
    });

    let spawned = 0;
    for (let index = 0; index < remaining; index += 1) {
      const position = findOpenEnemySpawnPosition({
        source,
        enemyTemplate,
        blockers: [...game.current.enemies, ...game.current.towers, game.current.player],
        baseRadius: radius + index * 6,
      });
      spawnEnemyAt(enemyKey, position.x, position.y, {
        skipBurrowPosition: true,
        summonedByBossUid: options.ownerBossUid ?? null,
        summonedByEncounterUid: options.ownerEncounterUid ?? null,
        summonCategory: options.summonCategory ?? (options.ownerBossUid ? enemyKey : null),
      });
      spawned += 1;
    }

    return spawned;
  };

  const queueLineHazard = (source, target, options = {}) => {
    const angle = Math.atan2(target.y - source.y, target.x - source.x);
    const length = options.length ?? 620;
    game.current.hazards.push({
      type: 'line',
      x: source.x,
      y: source.y,
      x2: source.x + Math.cos(angle) * length,
      y2: source.y + Math.sin(angle) * length,
      width: options.width ?? 18,
      damage: options.damage ?? 26,
      timer: options.delay ?? 0.8,
      maxTimer: options.delay ?? 0.8,
      color: options.color ?? COLORS.towerRail,
      label: options.label,
      ownerBossUid: options.ownerBossUid ?? null,
      ownerEncounterUid: options.ownerEncounterUid ?? null,
    });
  };

  const queueAreaHazard = (x, y, options = {}) => {
    game.current.hazards.push({
      type: 'area',
      x,
      y,
      radius: options.radius ?? 90,
      damage: options.damage ?? 18,
      slowRatio: options.slowRatio,
      slowDuration: options.slowDuration,
      pull: options.pull ?? 0,
      timer: options.delay ?? 0.9,
      maxTimer: options.delay ?? 0.9,
      color: options.color ?? COLORS.danger,
      label: options.label,
      pulsesRemaining: options.pulses ?? 1,
      pulseInterval: options.pulseInterval ?? Math.max(0.35, (options.delay ?? 0.9) * 0.7),
      radiusStep: options.radiusStep ?? 0,
      damageStep: options.damageStep ?? 0,
      ownerBossUid: options.ownerBossUid ?? null,
      ownerEncounterUid: options.ownerEncounterUid ?? null,
    });
  };

  const runBossAbility = (boss, abilityName) => {
    runBossAbilityEffect({
      boss,
      abilityName,
      state: game.current,
      spawnAround,
      queueLineHazard,
      queueAreaHazard,
      spawnImpactWave,
      damageArea,
      damageTarget,
      spawnEnemyAt,
      spawnFloatingText,
      syncHudMoney,
      getBossOwnership,
      getEncounterPartner,
    });
  };

  const enrageEncounterPartner = (defeatedBoss) => {
    const partner = getEncounterPartner(defeatedBoss);
    if (!partner || partner.bossState.partnerFallen) {
      return;
    }

    partner.bossState.partnerFallen = true;
    partner.baseSpeed *= 1.16;
    partner.damage = Math.round(partner.damage * 1.22);
    partner.shield = Math.max(partner.shield ?? 0, 80);
    partner.maxShield = Math.max(partner.maxShield ?? 0, partner.shield);
    spawnImpactWave(partner.x, partner.y, { maxRadius: partner.radius + 44, color: partner.color, fillAlpha: 0.14 });
    spawnFloatingText(partner.x, partner.y - partner.radius - 16, '狂怒', partner.color);
  };

  const updateBossBehavior = (boss, dt) => {
    const hpRatio = boss.hp / boss.maxHp;
    boss.bossState.climaxAccentTimer = Math.max(0, (boss.bossState.climaxAccentTimer ?? 0) - dt);
    const previousPhaseIndex = boss.currentPhaseIndex ?? -1;
    let activePhaseIndex = 0;
    for (let index = 0; index < boss.phases.length; index += 1) {
      if (hpRatio <= boss.phases[index].hpBelow) {
        activePhaseIndex = index;
      }
    }
    const activePhase = boss.phases[activePhaseIndex];

    if (boss.currentPhaseIndex !== activePhaseIndex) {
      boss.currentPhaseIndex = activePhaseIndex;
      triggerBossPhaseShift(boss, activePhase, activePhaseIndex, previousPhaseIndex);
      boss.bossState.climaxAccentTimer = 0.35;
    }

    if (activePhaseIndex === boss.phases.length - 1 && boss.bossState.climaxAccentTimer <= 0) {
      triggerBossClimaxAccent(boss);
      boss.bossState.climaxAccentTimer = boss.form === 'dragon' ? 0.44 : boss.form === 'astrolabe' ? 0.56 : 0.62;
    }

    const behaviorNodes =
      activePhase.behaviorNodes?.length
        ? activePhase.behaviorNodes.filter((node) => node.enabled !== false)
        : activePhase.abilities.map((abilityName, nodeIndex) =>
            createBossBehaviorNode(abilityName, activePhaseIndex, nodeIndex, {
              cooldown: DEFAULT_BOSS_ABILITY_COOLDOWNS[abilityName] ?? 6,
            })
          );

    for (const node of behaviorNodes) {
      const abilityName = node.abilityId;
      const cooldown = node.cooldown ?? DEFAULT_BOSS_ABILITY_COOLDOWNS[abilityName] ?? 6;
      boss.abilityCooldowns[abilityName] = Math.max(0, (boss.abilityCooldowns[abilityName] ?? 0) - dt);
      if (boss.abilityCooldowns[abilityName] <= 0) {
        runBossAbility(boss, abilityName);
        boss.abilityCooldowns[abilityName] = cooldown;
      }
    }
  };

  const update = (dt) => {
    const state = game.current;
    state.gameTime += dt;
    state.camera.shakeTimer = Math.max(0, (state.camera.shakeTimer ?? 0) - dt);
    if (state.camera.shakeTimer <= 0) {
      state.camera.shakeStrength = 0;
      state.camera.shakeDuration = 0;
    }

    if (Math.floor(state.gameTime) > time) {
      setTime(Math.floor(state.gameTime));
    }

    if (rewardState.active) {
      return;
    }

    let dx = 0;
    let dy = 0;
    if (state.keys.w) dy -= 1;
    if (state.keys.s) dy += 1;
    if (state.keys.a) dx -= 1;
    if (state.keys.d) dx += 1;
    if (state.joystick.active) {
      dx = state.joystick.dirX;
      dy = state.joystick.dirY;
    }

    const movementLength = Math.hypot(dx, dy);
    if (movementLength > 0 && !state.joystick.active) {
      dx /= movementLength;
      dy /= movementLength;
    }

    state.player.x += dx * state.player.speed * dt;
    state.player.y += dy * state.player.speed * dt;
    state.camera.x += (state.player.x - state.camera.x) * 5 * dt;
    state.camera.y += (state.player.y - state.camera.y) * 5 * dt;

    updatePlayerOffenseRuntime({ state, dt });
    updateTowerOffenseRuntime({ state, dt, spawnParticle });

    const waveTick = resolveWaveTick({
      wave: state.wave,
      dt,
      enemyCount: state.enemies.length,
      autoRun: shouldAutoRunWaveFlow({ mode: state.mode, debugWaveFlow: state.debugWaveFlow }),
    });
    state.wave = waveTick.wave;

    for (const enemyKey of waveTick.spawnEnemyKeys) {
        const spawnPosition = getSpawnPosition(state.camera, window.innerWidth, window.innerHeight);
        spawnEnemyAt(enemyKey, spawnPosition.x, spawnPosition.y);
    }

    if (waveTick.spawnBoss) {
      const spawnPosition = getSpawnPosition(state.camera, window.innerWidth, window.innerHeight);
      spawnBossEncounterAt(state.wave.boss, spawnPosition.x, spawnPosition.y);
      showBossSpotlight(state.wave.boss);
    }

    for (let enemyIndex = state.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
      const enemy = state.enemies[enemyIndex];
      const enemyUpdate = updateEnemyBehaviorRuntime({
        state,
        enemy,
        dt,
        spawnAround,
        spawnImpactWave,
        updateBossBehavior,
        damageTarget,
        damageArea,
        spawnParticle,
        syncHudHealth,
      });
      if (enemyUpdate.continueLoop) {
        continue;
      }

      settleEnemyDefeatRuntime({
        state,
        enemy,
        enemyIndex,
        spawnParticle,
        spawnAround,
        playBossDefeatCue: () => {
          void playCue('boss_defeat');
        },
        syncHudMoney,
        openBossReward,
        enrageEncounterPartner,
      });
    }

    settlePendingBossRewardRuntime({ state, rewardActive: rewardState.active, openBossReward });

    state.bossHudTimer = (state.bossHudTimer ?? 0) + dt;
    if (state.bossHudTimer >= 0.12) {
      state.bossHudTimer = 0;
      syncBossHud();
    }

    if (state.player.hp <= 0 && !state.debugOptions.infiniteHealth) {
      setGameState('GAMEOVER');
    } else if (state.debugOptions.infiniteHealth && state.player.hp < state.player.maxHp) {
      state.player.hp = state.player.maxHp;
      syncHudHealth();
    }

    updateProjectileRuntime({
      state,
      dt,
      damageEnemy,
      spawnFloatingText,
      spawnParticle,
      spawnImpactWave,
    });
    updateDropRuntime({
      state,
      dt,
      syncHudMoney,
      pulsePlayerPickupRadius: () => {
        window.setTimeout(() => {
          if (game.current) game.current.player.radius = 12;
        }, 50);
      },
    });
    updateTransientVisualRuntime({ state, dt });
    updateHazardRuntime({
      state,
      dt,
      damageTarget,
      spawnImpactWave,
      syncHudHealth,
    });
  };

  useCanvasGameLoop({
    canvasRef,
    game,
    gameState,
    rewardActive: rewardState.active,
    resumeAudio,
    closeTowerContextMenu: () => setTowerContextMenu(null),
    setTowerContextMenu,
    updateDragPlacement,
    tryBuildDraggedTower,
    update,
    drawScene: (ctx, canvas) => drawGameScene(ctx, canvas, { state: game.current, getTowerById, getDebugDragEntity }),
  });

  const setBuildBarRect = (rect) => {
    game.current.buildBarRect = rect;
  };

  const setDebugPanelRect = (rect) => {
    game.current.debugPanelRect = rect;
  };

  return {
    canvasRef,
    gameState,
    money,
    health,
    maxHealth,
    time,
    currentWave,
    waveOverview,
    formattedTime: formatTime(time),
    waveMsg,
    bossHud,
    audioSettings,
    initGame,
    beginTowerDrag,
    beginDebugEntityDrag,
    dragTowerId,
    dragEntity,
    towerTypes: towerCatalog.filter((tower) => tower.available).sort((left, right) => left.sortOrder - right.sortOrder),
    allTowerTypes: [...towerCatalog].sort((left, right) => left.sortOrder - right.sortOrder),
    enemyTypes: ENEMY_ORDER.map((enemyId) => ENEMY_TYPES[enemyId]),
    bossTypes: BOSS_ORDER.map((bossId) => applyDebugBossAuthoring(getBossEditorBaseTemplate(bossId))),
    rewardState,
    applyRewardChoice,
    setBuildBarRect,
    setDebugPanelRect,
    debugMode: game.current.mode === 'debug',
    debugWaveFlow,
    debugOptions,
    setDebugOption,
    setAudioEnabled,
    setAudioVolume,
    debugWaveCheckpoints: WAVE_DEBUG_CHECKPOINTS,
    waveTable: WAVE_TABLE,
    startDebugWave,
    clearDebugField,
    openDebugReward,
    unlockAllBlueprints,
    applyDebugLayout,
    forceBossPhase,
    bossEditor: {
      ...bossEditorPanelState,
      spawnBossFromEditor,
    },
    openBlueprintContextMenu,
    towerContextMenu,
    applyTowerContextAction,
    closeTowerContextMenu: () => setTowerContextMenu(null),
  };
}
