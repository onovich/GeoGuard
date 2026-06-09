import { useEffect, useRef, useState } from 'react';
import { BOSS_ORDER, BOSS_TYPES, COLORS, ENEMY_ORDER, ENEMY_TYPES, UI_COPY, createInitialTowerCatalog } from '../../data/gameConfig';
import { getBossPresentation } from '../../data/bossPresentation';
import { WAVE_DEBUG_CHECKPOINTS, WAVE_TABLE } from '../../data/waveTable';
import { createBossBehaviorNode, DEFAULT_BOSS_ABILITY_COOLDOWNS } from '../engine/bossAuthoringRules.js';
import {
  findOpenEnemySpawnPosition,
  getBossRewardResolution,
  getBossSummonSpawnCount,
  hasPendingBossAftermath,
  hasPendingEncounterAftermath,
} from '../engine/bossFlowRules.js';
import { getAreaDamageHits, getPulledPosition, isLineHazardHit, isTargetWithinArea, resolveEnemyDamage, resolveTargetDamage } from '../engine/combatRules.js';
import { createWaveDefinition, findNearestTarget, getSpawnPosition } from '../engine/gameRules';
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

const createProjectile = (x, y, angle, speed, damage, extras = {}) => ({
  x,
  y,
  previousX: x,
  previousY: y,
  vx: Math.cos(angle) * speed,
  vy: Math.sin(angle) * speed,
  damage,
  life: extras.life ?? 1.5,
  color: extras.color ?? COLORS.projectile,
  kind: extras.kind ?? 'basic',
  radius: extras.radius ?? 4,
  pierce: extras.pierce ?? 0,
  splash: extras.splash,
  slowRatio: extras.slowRatio,
  slowDuration: extras.slowDuration,
  hitEnemies: extras.hitEnemies,
});

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

  const getTowerFireRateFactor = (tower) => {
    let factor = tower.frozenTimer > 0 ? 999 : 1;
    for (const enemy of game.current.enemies) {
      if (enemy.jamAura && dist(enemy, tower) <= enemy.jamAura.range) {
        factor = Math.max(factor, enemy.jamAura.fireRateFactor);
      }
    }
    return factor;
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

  const chooseBossTarget = (boss) => {
    let target = game.current.player;
    let targetDistance = dist(boss, target);
    for (const tower of game.current.towers) {
      const towerDistance = dist(boss, tower);
      if (towerDistance < targetDistance) {
        target = tower;
        targetDistance = towerDistance;
      }
    }
    return target;
  };

  const runBossAbility = (boss, abilityName) => {
    const target = chooseBossTarget(boss);
    const ownership = getBossOwnership(boss);
    const isClimaxPhase = boss.currentPhaseIndex === boss.phases.length - 1;
    const primeBossAbility = (abilityId, cooldown) => {
      if (!boss.phases?.[boss.currentPhaseIndex]?.abilities?.includes(abilityId)) return;
      const current = boss.abilityCooldowns[abilityId];
      boss.abilityCooldowns[abilityId] = current == null ? cooldown : Math.min(current, cooldown);
    };
    if (abilityName === 'summonFormation') spawnAround(boss, 'BASIC', 4, boss.radius + 32, { ownerBossUid: boss.uid, summonCategory: 'formation', maxActive: 8 });
    if (abilityName === 'commandLine') {
      const angle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      for (let index = -1; index <= 1; index += 1) {
        const offsetX = Math.cos(angle + Math.PI / 2) * index * 42;
        const offsetY = Math.sin(angle + Math.PI / 2) * index * 42;
        queueLineHazard(
          { x: boss.x + offsetX, y: boss.y + offsetY },
          { x: game.current.player.x + offsetX * 0.4, y: game.current.player.y + offsetY * 0.4 },
          { width: 12, damage: 16, color: COLORS.enemyBasic, delay: 0.7, length: 520, label: 'formation', ...ownership }
        );
      }
    }
    if (abilityName === 'shieldPulse') {
      for (const enemy of game.current.enemies) {
        if (enemy !== boss && dist(enemy, boss) <= 160) {
          enemy.shield = Math.max(enemy.shield ?? 0, 18);
          enemy.maxShield = Math.max(enemy.maxShield ?? 0, enemy.shield);
          enemy.armoredTimer = 4;
        }
      }
      spawnImpactWave(boss.x, boss.y, { maxRadius: 160, color: COLORS.enemyShield, fillAlpha: 0.08 });
    }
    if (abilityName === 'phalanxAdvance') {
      spawnAround(boss, 'SHIELD', 2, boss.radius + 36, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'phalanx', maxActive: 6 });
      queueAreaHazard(boss.x, boss.y, {
        radius: 145,
        damage: 10,
        delay: 0.75,
        slowRatio: 0.72,
        slowDuration: 1.6,
        pulses: 2,
        pulseInterval: 0.6,
        radiusStep: 12,
        color: COLORS.enemyShield,
        label: 'wall',
        ...ownership,
      });
    }
    if (abilityName === 'commandRush') {
      const angle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      boss.dashTimer = 0.4;
      boss.dashVx = Math.cos(angle) * 460;
      boss.dashVy = Math.sin(angle) * 460;
      queueLineHazard(boss, game.current.player, { width: 18, damage: 22, color: COLORS.enemyBasic, delay: 0.5, length: 420, label: 'charge', ...ownership });
      spawnImpactWave(boss.x, boss.y, { maxRadius: 58, color: COLORS.enemyBasic, fillAlpha: 0.1 });
    }
    if (abilityName === 'dashAtPlayer') {
      const angle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      boss.dashTimer = 0.42;
      boss.dashVx = Math.cos(angle) * 560;
      boss.dashVy = Math.sin(angle) * 560;
      spawnImpactWave(boss.x, boss.y, { maxRadius: 44, color: boss.color, life: 0.18 });
    }
    if (abilityName === 'markPrey') {
      queueLineHazard(boss, game.current.player, { width: 10, damage: 14, color: COLORS.enemyFast, delay: 0.45, length: 360, label: 'mark', ...ownership });
      queueAreaHazard(game.current.player.x, game.current.player.y, {
        radius: 64,
        damage: 10,
        delay: 0.8,
        pulses: 2,
        pulseInterval: 0.42,
        color: COLORS.enemyFast,
        label: 'hunt',
        ...ownership,
      });
    }
    if (abilityName === 'summonScouts') spawnAround(boss, 'SCOUT', 3, boss.radius + 38, { ownerBossUid: boss.uid, summonCategory: 'scouts', maxActive: 6 });
    if (abilityName === 'pincerRush') {
      for (const side of [-1, 1]) {
        const angle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x) + side * 0.6;
        queueLineHazard(
          { x: boss.x + Math.cos(angle) * 20, y: boss.y + Math.sin(angle) * 20 },
          { x: game.current.player.x + Math.cos(angle) * 110, y: game.current.player.y + Math.sin(angle) * 90 },
          { width: 10, damage: 16, color: COLORS.enemyFast, delay: 0.55, length: 460, label: 'slash', ...ownership }
        );
      }
      spawnAround(boss, 'SCOUT', 2, boss.radius + 34, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'pincerScout', maxActive: 6 });
    }
    if (abilityName === 'feintStrike') {
      const retreatAngle = Math.atan2(boss.y - game.current.player.y, boss.x - game.current.player.x);
      boss.x = game.current.player.x + Math.cos(retreatAngle) * 180;
      boss.y = game.current.player.y + Math.sin(retreatAngle) * 140;
      queueLineHazard(boss, game.current.player, { width: 14, damage: 20, color: COLORS.enemyFast, delay: 0.38, length: 300, label: 'charge', ...ownership });
      spawnImpactWave(boss.x, boss.y, { maxRadius: 50, color: COLORS.enemyFast, fillAlpha: 0.1 });
    }
    if (abilityName === 'afterimageBurst') spawnAround(boss, 'PHASE', 3, boss.radius + 42, { ownerBossUid: boss.uid, summonCategory: 'afterimage', maxActive: 6 });
    if (abilityName === 'summonSiege') spawnAround(boss, 'SIEGE', 2, boss.radius + 46, { ownerBossUid: boss.uid, summonCategory: 'siege', maxActive: 5 });
    if (abilityName === 'bastionMortar') {
      const priorityTargets = [...game.current.towers.slice(0, 2), game.current.player].filter(Boolean);
      priorityTargets.forEach((targetPoint, index) => {
        queueAreaHazard(targetPoint.x, targetPoint.y, {
          radius: 72,
          damage: 20,
          delay: 0.9 + index * 0.12,
          color: COLORS.enemyTank,
          label: 'mortar',
          ...ownership,
        });
      });
    }
    if (abilityName === 'fortify') {
      boss.shield = Math.max(boss.shield ?? 0, 70);
      boss.maxShield = Math.max(boss.maxShield ?? 0, boss.shield);
      spawnImpactWave(boss.x, boss.y, { maxRadius: 92, color: COLORS.enemyTank, fillAlpha: 0.1 });
    }
    if (abilityName === 'shockRam') {
      const angle = Math.atan2(target.y - boss.y, target.x - boss.x);
      boss.dashTimer = 0.48;
      boss.dashVx = Math.cos(angle) * 380;
      boss.dashVy = Math.sin(angle) * 380;
      queueLineHazard(boss, target, { width: 22, damage: 24, color: COLORS.enemyTank, delay: 0.62, length: 360, label: 'ram', ...ownership });
      spawnImpactWave(boss.x, boss.y, { maxRadius: 66, color: COLORS.enemyTank, fillAlpha: 0.12 });
    }
    if (abilityName === 'quake') damageArea(boss.x, boss.y, 120, 18, { color: COLORS.enemyTank, towerFactor: 1.8 });
    if (abilityName === 'bunkerRing') {
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6;
        queueAreaHazard(boss.x + Math.cos(angle) * 130, boss.y + Math.sin(angle) * 110, {
          radius: 58,
          damage: 16,
          delay: 0.78 + index * 0.04,
          pulses: 2,
          pulseInterval: 0.55,
          color: COLORS.enemyTank,
          label: 'bunker',
          ...ownership,
        });
      }
    }
    if (abilityName === 'prismBeam') queueLineHazard(boss, target, { width: 18, damage: 24, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
    if (abilityName === 'refractVolley') {
      const baseAngle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      for (const offset of [-0.45, -0.15, 0.15, 0.45]) {
        queueLineHazard(
          boss,
          { x: boss.x + Math.cos(baseAngle + offset) * 180, y: boss.y + Math.sin(baseAngle + offset) * 180 },
          { width: 10, damage: 14, color: COLORS.enemyPhase, delay: 0.55, length: 560, label: 'refract', ...ownership }
        );
      }
    }
    if (abilityName === 'mirrorSummon') spawnAround(boss, 'PHASE', 2, boss.radius + 48, { ownerBossUid: boss.uid, summonCategory: 'mirror', maxActive: 5 });
    if (abilityName === 'prismLattice') {
      const offsets = [
        { x: -120, y: -80 },
        { x: 120, y: -80 },
        { x: -120, y: 80 },
        { x: 120, y: 80 },
      ];
      offsets.forEach((offset) => {
        queueLineHazard(
          { x: boss.x + offset.x, y: boss.y + offset.y },
          { x: boss.x - offset.x, y: boss.y - offset.y },
          { width: 10, damage: 16, color: COLORS.enemyPhase, delay: 0.75, length: Math.hypot(offset.x * 2, offset.y * 2), label: 'lattice', ...ownership }
        );
      });
    }
    if (abilityName === 'tripleBeam') {
      queueLineHazard(boss, game.current.player, { width: 16, damage: 22, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
      queueLineHazard({ x: boss.x, y: boss.y }, { x: boss.x + 120, y: boss.y - 260 }, { width: 14, damage: 18, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
      queueLineHazard({ x: boss.x, y: boss.y }, { x: boss.x - 140, y: boss.y - 240 }, { width: 14, damage: 18, color: COLORS.enemyPhase, ownerBossUid: boss.uid });
    }
    if (abilityName === 'mirrorStep') {
      const oldX = boss.x;
      const oldY = boss.y;
      boss.x = game.current.player.x + rand(-180, 180);
      boss.y = game.current.player.y + rand(-120, 120);
      queueLineHazard({ x: oldX, y: oldY }, boss, { width: 12, damage: 18, color: COLORS.enemyPhase, delay: 0.52, length: Math.hypot(boss.x - oldX, boss.y - oldY), label: 'mirror', ...ownership });
      spawnAround(boss, 'PHASE', 1, boss.radius + 28, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'mirrorStep', maxActive: 3 });
      spawnImpactWave(boss.x, boss.y, { maxRadius: 62, color: COLORS.enemyPhase, fillAlpha: 0.1 });
    }
    if (abilityName === 'spawnHive') spawnAround(boss, 'BEACON', 2, boss.radius + 50, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'hive', maxActive: 4 });
    if (abilityName === 'broodShift') {
      const beacons = game.current.enemies.filter((enemy) => enemy.id === 'BEACON' && enemy.summonedByBossUid === boss.uid);
      if (beacons.length > 0) {
        const beacon = beacons[Math.floor(Math.random() * beacons.length)];
        const oldX = boss.x;
        const oldY = boss.y;
        boss.x = beacon.x + rand(-24, 24);
        boss.y = beacon.y + rand(-24, 24);
        queueLineHazard({ x: oldX, y: oldY }, boss, { width: 12, damage: 14, color: COLORS.enemyBeacon, delay: 0.5, length: Math.hypot(boss.x - oldX, boss.y - oldY), label: 'brood', ...ownership });
        spawnImpactWave(boss.x, boss.y, { maxRadius: 76, color: COLORS.enemyBeacon, fillAlpha: 0.12 });
      } else {
        spawnAround(boss, 'BEACON', 1, boss.radius + 44, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'hive', maxActive: 4 });
      }
    }
    if (abilityName === 'hiveHeal') boss.hp = Math.min(boss.maxHp, boss.hp + 42);
    if (abilityName === 'hivePulse') {
      const beacons = game.current.enemies.filter((enemy) => enemy.id === 'BEACON' && enemy.summonedByBossUid === boss.uid);
      const anchors = beacons.length > 0 ? beacons : [boss];
      for (const anchor of anchors.slice(0, 3)) {
        queueAreaHazard(anchor.x, anchor.y, {
          radius: 92,
          damage: 10,
          delay: 0.7,
          pulses: 2,
          pulseInterval: 0.55,
          radiusStep: 10,
          color: COLORS.enemyBeacon,
          label: 'brood',
          ...ownership,
        });
        for (const enemy of game.current.enemies) {
          if (!enemy.isBoss && dist(enemy, anchor) <= 110) {
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + 12);
          }
        }
      }
    }
    if (abilityName === 'summonSwarm') spawnAround(boss, 'SHARD', 5, boss.radius + 45, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'swarm', maxActive: 10 });
    if (abilityName === 'hiveCollapse') {
      const beacons = game.current.enemies.filter((enemy) => enemy.id === 'BEACON' && enemy.summonedByBossUid === boss.uid);
      for (const beacon of beacons.slice(0, 4)) {
        queueAreaHazard(beacon.x, beacon.y, {
          radius: 104,
          damage: 16,
          delay: 0.8,
          pulses: 2,
          pulseInterval: 0.48,
          radiusStep: 14,
          color: COLORS.enemyBeacon,
          label: 'brood',
          ...ownership,
        });
        spawnAround(beacon, 'SHARD', 2, 28, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'collapseShard', maxActive: 8 });
      }
    }
    if (abilityName === 'frostRing') {
      for (const enemy of game.current.enemies) {
        if (enemy !== boss && dist(enemy, boss) <= 180) {
          enemy.slowRatio = Math.min(enemy.slowRatio, 0.72);
          enemy.slowTimer = Math.max(enemy.slowTimer, 2.5);
        }
      }
      damageArea(boss.x, boss.y, 150, 8, { color: COLORS.towerFrost, towerFactor: 0.4 });
    }
    if (abilityName === 'whiteout') {
      for (let index = 0; index < 3; index += 1) {
        queueAreaHazard(game.current.player.x + rand(-120, 120), game.current.player.y + rand(-90, 90), {
          radius: 74,
          damage: 8,
          delay: 0.6 + index * 0.14,
          slowRatio: 0.42,
          slowDuration: 2.4,
          pulses: 2,
          pulseInterval: 0.5,
          color: COLORS.towerFrost,
          label: 'frost',
          ...ownership,
        });
      }
    }
    if (abilityName === 'freezeTower') {
      const tower = game.current.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, boss) < dist(nearest, boss) ? candidate : nearest), null);
      if (tower) {
        tower.frozenTimer = 3.5;
        spawnImpactWave(tower.x, tower.y, { maxRadius: tower.radius + 24, color: COLORS.towerFrost, fillAlpha: 0.16 });
      }
    }
    if (abilityName === 'glacialPrison') {
      const focus = game.current.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, game.current.player) < dist(nearest, game.current.player) ? candidate : nearest), null) ?? game.current.player;
      queueAreaHazard(focus.x, focus.y, {
        radius: 90,
        damage: 12,
        delay: 0.75,
        slowRatio: 0.3,
        slowDuration: 3.1,
        pulses: 2,
        pulseInterval: 0.5,
        color: COLORS.towerFrost,
        label: 'prison',
        ...ownership,
      });
    }
    if (abilityName === 'summonFrostGuards') spawnAround(boss, 'SHIELD', 3, boss.radius + 48, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'frostGuard', maxActive: 6 });
    if (abilityName === 'coldSnap') {
      const targets = [...game.current.towers.slice(0, 3), game.current.player];
      targets.forEach((targetPoint, index) => {
        queueAreaHazard(targetPoint.x, targetPoint.y, {
          radius: 68,
          damage: 16,
          delay: 0.72 + index * 0.08,
          slowRatio: 0.36,
          slowDuration: 2.8,
          color: COLORS.towerFrost,
          label: 'frost',
          ...ownership,
        });
      });
    }
    if (abilityName === 'railShot') queueLineHazard(boss, target, { width: 14, damage: 34, color: COLORS.towerRail, delay: 0.65, label: 'rail', ...ownership });
    if (abilityName === 'crosshairBarrage') {
      queueLineHazard({ x: game.current.player.x - 260, y: game.current.player.y }, { x: game.current.player.x + 260, y: game.current.player.y }, { width: 10, damage: 16, color: COLORS.towerRail, delay: 0.7, length: 520, label: 'crosshair', ...ownership });
      queueLineHazard({ x: game.current.player.x, y: game.current.player.y - 220 }, { x: game.current.player.x, y: game.current.player.y + 220 }, { width: 10, damage: 16, color: COLORS.towerRail, delay: 0.82, length: 440, label: 'crosshair', ...ownership });
    }
    if (abilityName === 'markTower') {
      const tower = game.current.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, boss) < dist(nearest, boss) ? candidate : nearest), null);
      if (tower) queueLineHazard(boss, tower, { width: 12, damage: 28, color: COLORS.towerRail, delay: 0.55, label: 'mark', ...ownership });
    }
    if (abilityName === 'suppressiveGrid') {
      const anchors = game.current.towers.slice(0, 2);
      anchors.forEach((tower, index) => {
        queueLineHazard({ x: tower.x - 180, y: tower.y }, { x: tower.x + 180, y: tower.y }, { width: 9, damage: 14, color: COLORS.towerRail, delay: 0.68 + index * 0.08, length: 360, label: 'grid', ...ownership });
        queueLineHazard({ x: tower.x, y: tower.y - 180 }, { x: tower.x, y: tower.y + 180 }, { width: 9, damage: 14, color: COLORS.towerRail, delay: 0.76 + index * 0.08, length: 360, label: 'grid', ...ownership });
      });
    }
    if (abilityName === 'overload') {
      boss.hp -= Math.min(24, boss.hp - 1);
      queueLineHazard(boss, game.current.player, { width: 20, damage: 38, color: COLORS.towerRail, delay: 0.45, label: 'overload', ...ownership });
    }
    if (abilityName === 'killLane') {
      const angle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      for (const offset of [-0.18, 0.18]) {
        queueLineHazard(
          { x: boss.x + Math.cos(angle + Math.PI / 2) * offset * 180, y: boss.y + Math.sin(angle + Math.PI / 2) * offset * 180 },
          game.current.player,
          { width: 14, damage: 24, color: COLORS.towerRail, delay: 0.75, length: 720, label: 'crosshair', ...ownership }
        );
      }
    }
    if (abilityName === 'stealMoney') {
      if (!game.current.debugOptions.infiniteMoney) {
        const stolen = Math.min(game.current.money, 12);
        game.current.money -= stolen;
        syncHudMoney();
        spawnFloatingText(boss.x, boss.y - boss.radius - 8, `-${stolen}`, COLORS.enemyScout);
      }
    }
    if (abilityName === 'taxBeacon') {
      queueAreaHazard(game.current.player.x, game.current.player.y, {
        radius: 82,
        damage: 8,
        delay: 0.75,
        pulses: 2,
        pulseInterval: 0.5,
        color: COLORS.enemyScout,
        label: 'coin',
        ...ownership,
      });
      if (!game.current.debugOptions.infiniteMoney) {
        const stolen = Math.min(game.current.money, 8);
        game.current.money -= stolen;
        syncHudMoney();
      }
    }
    if (abilityName === 'paydaySweep') {
      for (const side of [-1, 1]) {
        queueLineHazard(
          { x: game.current.player.x + side * 220, y: game.current.player.y - 120 },
          { x: game.current.player.x - side * 220, y: game.current.player.y + 120 },
          { width: 10, damage: 14, color: COLORS.enemyScout, delay: 0.68, length: Math.hypot(440, 240), label: 'coinline', ...ownership }
        );
      }
      spawnAround(boss, 'SCOUT', 2, boss.radius + 34, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'paydayScout', maxActive: 6 });
    }
    if (abilityName === 'ransomBurst') spawnAround(boss, 'SCOUT', 5, boss.radius + 42, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'ransom', maxActive: 8 });
    if (abilityName === 'repossess') {
      const tower = game.current.towers.reduce((nearest, candidate) => (!nearest || dist(candidate, boss) < dist(nearest, boss) ? candidate : nearest), null);
      if (tower) {
        damageTarget(tower, 22);
        queueAreaHazard(tower.x, tower.y, {
          radius: 76,
          damage: 12,
          delay: 0.72,
          color: COLORS.enemyScout,
          label: 'coin',
          ...ownership,
        });
      }
      if (!game.current.debugOptions.infiniteMoney) {
        const stolen = Math.min(game.current.money, 18);
        game.current.money -= stolen;
        syncHudMoney();
        spawnFloatingText(boss.x, boss.y - boss.radius - 8, `-${stolen}`, COLORS.enemyScout);
      }
    }
    if (abilityName === 'twinOrbit') {
      boss.shield = Math.max(boss.shield ?? 0, 34);
      boss.maxShield = Math.max(boss.maxShield ?? 0, boss.shield);
      spawnImpactWave(boss.x, boss.y, { maxRadius: 118, color: boss.color, fillAlpha: 0.08 });
    }
    if (abilityName === 'twinBolt') {
      queueLineHazard({ x: boss.x - boss.radius * 0.6, y: boss.y }, game.current.player, { width: 11, damage: 16, color: COLORS.enemyPhase, delay: 0.5, label: 'moonbolt', ownerBossUid: boss.uid });
      queueLineHazard({ x: boss.x + boss.radius * 0.6, y: boss.y }, target, { width: 11, damage: 16, color: COLORS.enemyScout, delay: 0.7, label: 'sunbolt', ownerBossUid: boss.uid });
    }
    if (abilityName === 'twinSwap') {
      const angle = Math.random() * Math.PI * 2;
      boss.x = game.current.player.x + Math.cos(angle) * 170;
      boss.y = game.current.player.y + Math.sin(angle) * 170;
      spawnAround(boss, 'PHASE', 2, boss.radius + 34, { ownerBossUid: boss.uid, summonCategory: 'swapEcho', maxActive: 4 });
      spawnImpactWave(boss.x, boss.y, { maxRadius: 74, color: boss.color, fillAlpha: 0.12 });
    }
    if (abilityName === 'eclipsePulse') {
      queueAreaHazard(boss.x, boss.y, {
        radius: 170,
        damage: 20,
        delay: 0.68,
        color: COLORS.enemyPhase,
        label: 'eclipse',
        ...ownership,
      });
      if (isClimaxPhase) {
        const partner = getEncounterPartner(boss);
        spawnImpactWave(boss.x, boss.y, {
          startRadius: boss.radius * 0.75,
          maxRadius: 168,
          growth: 210,
          life: 0.72,
          color: boss.color,
          accentColor: boss.color,
          secondaryColor: '#ffffff',
          fillAlpha: 0.04,
          lineWidth: 3,
          dash: [6, 10],
          spokes: 6,
          spin: 1,
          style: 'twinFinisher',
          nodeCount: 6,
          anchorA: { x: boss.x, y: boss.y, color: boss.color },
          anchorB: partner ? { x: partner.x, y: partner.y, color: partner.color } : null,
        });
      }
    }
    if (abilityName === 'solarDash') {
      const angle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      boss.dashTimer = 0.34;
      boss.dashVx = Math.cos(angle) * 620;
      boss.dashVy = Math.sin(angle) * 620;
      queueLineHazard(boss, game.current.player, { width: 12, damage: 14, color: boss.color, delay: 0.42, length: 420, label: 'solar', ...ownership });
      spawnImpactWave(boss.x, boss.y, { maxRadius: 52, color: boss.color, fillAlpha: 0.12 });
    }
    if (abilityName === 'flareLance') {
      const baseAngle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      for (const offset of [-0.2, 0, 0.2]) {
        queueLineHazard(
          boss,
          { x: boss.x + Math.cos(baseAngle + offset) * 240, y: boss.y + Math.sin(baseAngle + offset) * 240 },
          { width: offset === 0 ? 16 : 12, damage: offset === 0 ? 22 : 16, color: boss.color, delay: 0.6, length: 640, label: 'flare', ...ownership }
        );
      }
    }
    if (abilityName === 'lunarSnare') {
      queueAreaHazard(game.current.player.x, game.current.player.y, {
        radius: 92,
        damage: 10,
        slowRatio: 0.38,
        slowDuration: 2.9,
        delay: 0.7,
        color: boss.color,
        label: 'moon',
        ...ownership,
      });
    }
    if (abilityName === 'shadowArc') {
      queueLineHazard(boss, game.current.player, { width: 12, damage: 18, color: boss.color, delay: 0.55, length: 520, label: 'shadow', ...ownership });
      queueAreaHazard(game.current.player.x + rand(-80, 80), game.current.player.y + rand(-80, 80), {
        radius: 76,
        damage: 14,
        slowRatio: 0.52,
        slowDuration: 2.2,
        delay: 0.82,
        color: boss.color,
        label: 'shade',
        ...ownership,
      });
    }
    if (abilityName === 'twinCrossfire') {
      const partner = getEncounterPartner(boss);
      if (partner && boss.uid < partner.uid) {
        queueLineHazard(boss, { x: game.current.player.x + 90, y: game.current.player.y - 24 }, { width: 12, damage: 18, color: boss.color, delay: 0.62, length: 640, label: 'crossfire', ...ownership });
        queueLineHazard(partner, { x: game.current.player.x - 90, y: game.current.player.y + 24 }, { width: 12, damage: 18, color: partner.color, delay: 0.62, length: 640, label: 'crossfire', ...getBossOwnership(partner) });
        spawnImpactWave(game.current.player.x, game.current.player.y, { maxRadius: 88, color: COLORS.boss, fillAlpha: 0.06 });
        if (isClimaxPhase) {
          const midX = (boss.x + partner.x) * 0.5;
          const midY = (boss.y + partner.y) * 0.5;
          spawnImpactWave(midX, midY, {
            startRadius: 22,
            maxRadius: 138,
            growth: 196,
            life: 0.84,
            color: '#ffffff',
            accentColor: boss.color,
            secondaryColor: partner.color,
            fillAlpha: 0.03,
            lineWidth: 2.5,
            dash: [5, 11],
            spokes: 8,
            spin: 1.2,
            style: 'twinFinisher',
            nodeCount: 8,
            anchorA: { x: boss.x, y: boss.y, color: boss.color },
            anchorB: { x: partner.x, y: partner.y, color: partner.color },
          });
          queueAreaHazard(game.current.player.x, game.current.player.y, {
            radius: 112,
            damage: 18,
            delay: 0.96,
            pulses: 2,
            pulseInterval: 0.42,
            color: '#ffffff',
            label: 'eclipse',
            ...ownership,
          });
          primeBossAbility('eclipsePulse', 1.15);
          const partnerOwnership = getEncounterPartner(boss);
          if (partnerOwnership) {
            const partnerCurrent = partnerOwnership.abilityCooldowns.eclipsePulse;
            partnerOwnership.abilityCooldowns.eclipsePulse = partnerCurrent == null ? 1.15 : Math.min(partnerCurrent, 1.15);
          }
        }
      }
    }
    if (abilityName === 'dragonBreath') {
      queueLineHazard(boss, game.current.player, { width: 24, damage: 26, color: COLORS.enemyBomber, delay: 0.75, length: 720, label: 'breath', ...ownership });
      queueLineHazard(boss, { x: game.current.player.x + 120, y: game.current.player.y + 40 }, { width: 16, damage: 18, color: COLORS.enemyBomber, delay: 0.85, length: 680, label: 'breath', ...ownership });
      queueLineHazard(boss, { x: game.current.player.x - 120, y: game.current.player.y - 40 }, { width: 16, damage: 18, color: COLORS.enemyBomber, delay: 0.85, length: 680, label: 'breath', ...ownership });
    }
    if (abilityName === 'dragonStrafe') {
      boss.bossState.strafeSide = boss.bossState.strafeSide === 'left' ? 'right' : 'left';
      const side = boss.bossState.strafeSide === 'left' ? -1 : 1;
      const baseAngle = Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x);
      for (const offset of [-0.28, 0, 0.28]) {
        queueLineHazard(
          { x: boss.x + Math.cos(baseAngle + Math.PI / 2 * side) * 34, y: boss.y + Math.sin(baseAngle + Math.PI / 2 * side) * 34 },
          { x: game.current.player.x + Math.cos(baseAngle + offset) * 180, y: game.current.player.y + Math.sin(baseAngle + offset) * 180 },
          { width: offset === 0 ? 18 : 12, damage: offset === 0 ? 24 : 16, color: COLORS.enemyBomber, delay: 0.7, length: 760, label: 'strafe', ...ownership }
        );
      }
    }
    if (abilityName === 'emberWake') {
      for (let index = 0; index < 3; index += 1) {
        const angle = boss.bossState.strafeSide === 'left' ? Math.PI * 0.75 - index * 0.26 : Math.PI * 0.25 + index * 0.26;
        queueAreaHazard(game.current.player.x + Math.cos(angle) * 110, game.current.player.y + Math.sin(angle) * 80, {
          radius: 58 + index * 8,
          damage: 10 + index * 2,
          delay: 0.65 + index * 0.1,
          pulses: 2,
          pulseInterval: 0.6,
          radiusStep: 14,
          color: COLORS.enemyBomber,
          label: 'inferno',
          ...ownership,
        });
      }
    }
    if (abilityName === 'wingBuffet') {
      damageArea(boss.x, boss.y, 165, 16, { color: COLORS.enemyBomber, towerFactor: 1.15 });
      const pushTarget = (target, amount) => {
        const angle = Math.atan2(target.y - boss.y, target.x - boss.x);
        target.x += Math.cos(angle) * amount;
        target.y += Math.sin(angle) * amount;
      };
      pushTarget(game.current.player, 42);
      for (const tower of game.current.towers) {
        if (dist(tower, boss) <= 210) pushTarget(tower, 24);
      }
      spawnImpactWave(boss.x, boss.y, { maxRadius: 170, color: COLORS.enemyBomber, fillAlpha: 0.1 });
    }
    if (abilityName === 'meteorRain') {
      for (let index = 0; index < 6; index += 1) {
        queueAreaHazard(game.current.player.x + rand(-200, 200), game.current.player.y + rand(-160, 160), {
          radius: 50 + (index % 2) * 8,
          damage: 22,
          delay: 0.95 + index * 0.1,
          color: COLORS.enemyBomber,
          label: 'meteor',
          ...ownership,
        });
      }
    }
    if (abilityName === 'skyDive') {
      const oldX = boss.x;
      const oldY = boss.y;
      const angle = Math.random() * Math.PI * 2;
      boss.x = game.current.player.x + Math.cos(angle) * 140;
      boss.y = game.current.player.y + Math.sin(angle) * 120;
      spawnImpactWave(oldX, oldY, { maxRadius: 70, color: COLORS.enemyBomber, fillAlpha: 0.08 });
      queueLineHazard({ x: oldX, y: oldY }, boss, { width: 10, damage: 14, delay: 0.45, length: Math.hypot(boss.x - oldX, boss.y - oldY), color: COLORS.enemyBomber, label: 'diveTrail', ...ownership });
      queueAreaHazard(boss.x, boss.y, { radius: 118, damage: 28, delay: 0.8, color: COLORS.enemyBomber, label: 'dive', ...ownership });
      if (isClimaxPhase) {
        spawnImpactWave(boss.x, boss.y, {
          startRadius: 18,
          maxRadius: 126,
          growth: 188,
          life: 0.88,
          color: COLORS.enemyBomber,
          accentColor: '#ff9f43',
          secondaryColor: '#ffd166',
          fillAlpha: 0.03,
          lineWidth: 3,
          dash: [7, 9],
          spokes: 5,
          spin: 0.8,
          style: 'dragonFinisher',
          rotation: angle,
        });
        for (let index = 0; index < 4; index += 1) {
          const orbitAngle = (Math.PI * 2 * index) / 4;
          queueAreaHazard(boss.x + Math.cos(orbitAngle) * 78, boss.y + Math.sin(orbitAngle) * 62, {
            radius: 54,
            damage: 14,
            delay: 1 + index * 0.05,
            pulses: 2,
            pulseInterval: 0.45,
            radiusStep: 8,
            color: COLORS.enemyBomber,
            label: 'inferno',
            ...ownership,
          });
        }
        primeBossAbility('infernoRing', 1.05);
      }
    }
    if (abilityName === 'infernoRing') {
      if (isClimaxPhase) {
        spawnImpactWave(game.current.player.x, game.current.player.y, {
          startRadius: 28,
          maxRadius: 150,
          growth: 220,
          life: 0.66,
          color: COLORS.enemyBomber,
          accentColor: '#ffd166',
          secondaryColor: '#ff9f43',
          fillAlpha: 0.02,
          lineWidth: 2.6,
          dash: [8, 10],
          spokes: 6,
          spin: 0.65,
          style: 'dragonFinisher',
          rotation: Math.atan2(game.current.player.y - boss.y, game.current.player.x - boss.x),
        });
      }
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6;
        queueAreaHazard(game.current.player.x + Math.cos(angle) * 140, game.current.player.y + Math.sin(angle) * 110, {
          radius: 60,
          damage: 18,
          delay: 0.8 + index * 0.05,
          pulses: 2,
          pulseInterval: 0.55,
          radiusStep: 10,
          color: COLORS.enemyBomber,
          label: 'inferno',
          ...ownership,
        });
      }
    }
    if (abilityName === 'webTrap') {
      queueAreaHazard(game.current.player.x, game.current.player.y, {
        radius: 86,
        damage: 8,
        slowRatio: 0.42,
        slowDuration: 2.8,
        delay: 0.65,
        pulses: 2,
        pulseInterval: 0.55,
        radiusStep: 8,
        color: COLORS.enemyBurrower,
        label: 'web',
        ...ownership,
      });
    }
    if (abilityName === 'silkVolley') {
      for (let index = 0; index < 3; index += 1) {
        queueAreaHazard(game.current.player.x + rand(-120, 120), game.current.player.y + rand(-90, 90), {
          radius: 62,
          damage: 8,
          slowRatio: 0.5,
          slowDuration: 2.2,
          delay: 0.55 + index * 0.1,
          color: COLORS.enemyBurrower,
          label: 'silk',
          ...ownership,
        });
      }
    }
    if (abilityName === 'spawnSpiderlings') spawnAround(boss, 'SPLINTER', 6, boss.radius + 38, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'spiderling', maxActive: 10 });
    if (abilityName === 'broodAmbush') {
      spawnAround(boss, 'BURROWER', 2, boss.radius + 50, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'broodBurrower', maxActive: 4 });
      for (let index = 0; index < 4; index += 1) {
        const angle = (Math.PI * 2 * index) / 4 + Math.random() * 0.3;
        const x = game.current.player.x + Math.cos(angle) * 118;
        const y = game.current.player.y + Math.sin(angle) * 84;
        spawnEnemyAt('SPLINTER', x, y, {
          skipBurrowPosition: true,
          summonedByBossUid: boss.uid,
          summonedByEncounterUid: boss.encounterUid ?? null,
          summonCategory: 'ambushSpiderling',
        });
      }
    }
    if (abilityName === 'webField') {
      if (isClimaxPhase) {
        spawnImpactWave(boss.x, boss.y, {
          startRadius: 26,
          maxRadius: 184,
          growth: 210,
          life: 0.7,
          color: COLORS.enemyBurrower,
          accentColor: COLORS.enemyBurrower,
          secondaryColor: '#d9f99d',
          fillAlpha: 0.03,
          lineWidth: 2,
          dash: [4, 8],
          spokes: 8,
          spin: 0.4,
          style: 'spiderFinisher',
          nodeCount: 8,
        });
      }
      queueAreaHazard(boss.x, boss.y, {
        radius: 170,
        damage: 9,
        slowRatio: 0.52,
        slowDuration: 3,
        delay: 0.8,
        pulses: 3,
        pulseInterval: 0.75,
        radiusStep: 12,
        color: COLORS.enemyBurrower,
        label: 'web',
        ...ownership,
      });
      spawnAround(boss, 'BURROWER', 2, boss.radius + 52, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'burrowEscort', maxActive: 4 });
    }
    if (abilityName === 'nestBloom') {
      for (let index = 0; index < 3; index += 1) {
        const angle = (Math.PI * 2 * index) / 3 + Math.random() * 0.24;
        queueAreaHazard(boss.x + Math.cos(angle) * 140, boss.y + Math.sin(angle) * 110, {
          radius: 72,
          damage: 10,
          slowRatio: 0.56,
          slowDuration: 2.8,
          delay: 0.75,
          pulses: 3,
          pulseInterval: 0.65,
          radiusStep: 10,
          color: COLORS.enemyBurrower,
          label: 'nest',
          ...ownership,
        });
      }
      spawnAround(boss, 'SPLINTER', 4, boss.radius + 34, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'nestShard', maxActive: 12 });
      if (isClimaxPhase) {
        spawnImpactWave(boss.x, boss.y, {
          startRadius: boss.radius * 0.8,
          maxRadius: 152,
          growth: 190,
          life: 0.82,
          color: COLORS.enemyBurrower,
          accentColor: COLORS.enemyBurrower,
          secondaryColor: '#ffffff',
          fillAlpha: 0.04,
          lineWidth: 2.4,
          dash: [4, 9],
          spokes: 6,
          spin: 0.5,
          style: 'spiderFinisher',
          nodeCount: 6,
        });
        queueAreaHazard(game.current.player.x, game.current.player.y, {
          radius: 98,
          damage: 12,
          slowRatio: 0.58,
          slowDuration: 2.8,
          delay: 0.92,
          pulses: 2,
          pulseInterval: 0.5,
          radiusStep: 12,
          color: COLORS.enemyBurrower,
          label: 'nest',
          ...ownership,
        });
        primeBossAbility('webField', 1.1);
      }
    }
    if (abilityName === 'gravityWell') {
      queueAreaHazard(game.current.player.x, game.current.player.y, {
        radius: 120,
        damage: 10,
        pull: 220,
        delay: 0.7,
        pulses: 2,
        pulseInterval: 0.6,
        radiusStep: 18,
        color: COLORS.enemyJammer,
        label: 'gravity',
        ...ownership,
      });
    }
    if (abilityName === 'starfall') {
      for (let index = 0; index < 4; index += 1) {
        const angle = (Math.PI * 2 * index) / 4 + Math.random() * 0.22;
        queueAreaHazard(game.current.player.x + Math.cos(angle) * 120, game.current.player.y + Math.sin(angle) * 88, {
          radius: 58,
          damage: 14,
          delay: 0.65 + index * 0.08,
          color: COLORS.enemyJammer,
          label: 'star',
          ...ownership,
        });
      }
    }
    if (abilityName === 'orbitalShots') {
      const angleOffset = (boss.bossState.orbitalIndex ?? 0) * 0.34;
      boss.bossState.orbitalIndex = (boss.bossState.orbitalIndex ?? 0) + 1;
      for (let index = 0; index < 5; index += 1) {
        const angle = angleOffset + (Math.PI * 2 * index) / 5;
        queueLineHazard(
          { x: boss.x + Math.cos(angle) * 86, y: boss.y + Math.sin(angle) * 86 },
          { x: boss.x - Math.cos(angle) * 160, y: boss.y - Math.sin(angle) * 160 },
          { width: 10, damage: 18, color: COLORS.enemyJammer, delay: 0.6, length: 560, label: 'orbit', ...ownership }
        );
      }
    }
    if (abilityName === 'orbitalLock') {
      for (let index = 0; index < 4; index += 1) {
        const angle = (Math.PI * 2 * index) / 4;
        const source = { x: game.current.player.x + Math.cos(angle) * 180, y: game.current.player.y + Math.sin(angle) * 140 };
        queueLineHazard(source, game.current.player, { width: 12, damage: 18, color: COLORS.enemyJammer, delay: 0.72, length: Math.hypot(source.x - game.current.player.x, source.y - game.current.player.y), label: 'lock', ...ownership });
      }
    }
    if (abilityName === 'singularity') {
      for (const tower of game.current.towers) {
        const angle = Math.atan2(boss.y - tower.y, boss.x - tower.x);
        tower.x += Math.cos(angle) * 34;
        tower.y += Math.sin(angle) * 34;
      }
      queueAreaHazard(boss.x, boss.y, {
        radius: 210,
        damage: 20,
        pull: 340,
        delay: 0.95,
        pulses: 3,
        pulseInterval: 0.55,
        radiusStep: -12,
        color: COLORS.enemyJammer,
        label: 'singularity',
        ...ownership,
      });
      if (isClimaxPhase) {
        spawnImpactWave(boss.x, boss.y, {
          startRadius: boss.radius * 0.9,
          maxRadius: 198,
          growth: 176,
          life: 0.94,
          color: COLORS.enemyJammer,
          accentColor: COLORS.enemyJammer,
          secondaryColor: '#ffffff',
          fillAlpha: 0.03,
          lineWidth: 3,
          dash: [4, 10],
          spokes: 7,
          spin: 0.7,
          style: 'astrolabeFinisher',
          nodeCount: 7,
          rotation: (boss.bossState.orbitalIndex ?? 0) * 0.34,
        });
        for (let index = 0; index < 4; index += 1) {
          const angle = (Math.PI * 2 * index) / 4;
          const source = { x: boss.x + Math.cos(angle) * 180, y: boss.y + Math.sin(angle) * 180 };
          queueLineHazard(source, boss, {
            width: 10,
            damage: 16,
            color: COLORS.enemyJammer,
            delay: 1.02 + index * 0.05,
            length: Math.hypot(source.x - boss.x, source.y - boss.y),
            label: 'lock',
            ...ownership,
          });
        }
        primeBossAbility('eventHorizon', 1.05);
      }
    }
    if (abilityName === 'eventHorizon') {
      if (isClimaxPhase) {
        spawnImpactWave(boss.x, boss.y, {
          startRadius: 32,
          maxRadius: 220,
          growth: 192,
          life: 0.76,
          color: COLORS.enemyJammer,
          accentColor: '#a78bfa',
          secondaryColor: '#ffffff',
          fillAlpha: 0.02,
          lineWidth: 2.8,
          dash: [3, 11],
          spokes: 6,
          spin: 0.8,
          style: 'astrolabeFinisher',
          nodeCount: 6,
          rotation: boss.bossState.orbitalIndex ?? 0,
        });
      }
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6;
        queueAreaHazard(boss.x + Math.cos(angle) * 150, boss.y + Math.sin(angle) * 150, {
          radius: 68,
          damage: 16,
          pull: 180,
          delay: 0.75 + index * 0.05,
          pulses: 2,
          pulseInterval: 0.6,
          color: COLORS.enemyJammer,
          label: 'horizon',
          ...ownership,
        });
      }
    }
    if (abilityName === 'forgeArmor') {
      boss.shield = Math.max(boss.shield ?? 0, 90);
      boss.maxShield = Math.max(boss.maxShield ?? 0, boss.shield);
      spawnAround(boss, 'SHIELD', 2, boss.radius + 42, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'forgeGuard', maxActive: 6 });
    }
    if (abilityName === 'slagDrop') {
      for (let index = 0; index < 4; index += 1) {
        const angle = (Math.PI * 2 * index) / 4 + Math.random() * 0.2;
        queueAreaHazard(boss.x + Math.cos(angle) * 130, boss.y + Math.sin(angle) * 100, {
          radius: 64,
          damage: 14,
          delay: 0.7 + index * 0.08,
          pulses: 2,
          pulseInterval: 0.55,
          color: COLORS.enemySiege,
          label: 'slag',
          ...ownership,
        });
      }
    }
    if (abilityName === 'sacrificeMinions') {
      let sacrificed = 0;
      for (let index = game.current.enemies.length - 1; index >= 0; index -= 1) {
        const enemy = game.current.enemies[index];
        if (enemy !== boss && !enemy.isBoss && dist(enemy, boss) <= 180 && sacrificed < 4) {
          game.current.enemies.splice(index, 1);
          sacrificed += 1;
        }
      }
      boss.hp = Math.min(boss.maxHp, boss.hp + sacrificed * 28);
      boss.shield = Math.max(boss.shield ?? 0, sacrificed * 24);
      damageArea(boss.x, boss.y, 95 + sacrificed * 18, 10 + sacrificed * 4, { color: COLORS.enemySiege, towerFactor: 1.3 });
    }
    if (abilityName === 'brandLine') {
      queueLineHazard(boss, game.current.player, { width: 14, damage: 20, color: COLORS.enemySiege, delay: 0.58, length: 520, label: 'brand', ...ownership });
      queueAreaHazard(game.current.player.x, game.current.player.y, {
        radius: 82,
        damage: 12,
        delay: 0.82,
        pulses: 2,
        pulseInterval: 0.48,
        color: COLORS.enemySiege,
        label: 'slag',
        ...ownership,
      });
    }
    if (abilityName === 'moltenBurst') {
      for (let index = 0; index < 6; index += 1) {
        const angle = (Math.PI * 2 * index) / 6;
        queueAreaHazard(boss.x + Math.cos(angle) * 150, boss.y + Math.sin(angle) * 150, { radius: 62, damage: 22, delay: 0.8, color: COLORS.enemySiege, label: 'slag', ...ownership });
      }
    }
    if (abilityName === 'forgeDetonation') {
      const forgeGuards = game.current.enemies.filter((enemy) => enemy.summonedByBossUid === boss.uid && enemy.summonCategory === 'forgeGuard');
      for (const guard of forgeGuards.slice(0, 4)) {
        queueAreaHazard(guard.x, guard.y, {
          radius: 84,
          damage: 18,
          delay: 0.7,
          pulses: 2,
          pulseInterval: 0.42,
          color: COLORS.enemySiege,
          label: 'slag',
          ...ownership,
        });
      }
    }
    if (abilityName === 'conductLines') {
      queueLineHazard(boss, game.current.player, { width: 12, damage: 18, color: COLORS.towerRail, delay: 0.45, label: 'tempo', ...ownership });
      queueLineHazard({ x: boss.x - 90, y: boss.y - 80 }, { x: boss.x + 180, y: boss.y + 120 }, { width: 10, damage: 15, color: COLORS.towerRail, delay: 0.75, length: 560, label: 'tempo', ...ownership });
    }
    if (abilityName === 'pulseMeasure') {
      for (let index = 0; index < 4; index += 1) {
        queueAreaHazard(game.current.player.x + rand(-150, 150), game.current.player.y + rand(-110, 110), {
          radius: 54,
          damage: 10,
          delay: 0.5 + index * 0.16,
          color: COLORS.towerRail,
          label: 'beat',
          ...ownership,
        });
      }
    }
    if (abilityName === 'tempoShift') {
      for (const tower of game.current.towers) {
        if (dist(tower, boss) <= 260) tower.frozenTimer = Math.max(tower.frozenTimer ?? 0, 1.6);
      }
      spawnAround(boss, 'FAST', 4, boss.radius + 45, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'tempoRunner', maxActive: 8 });
    }
    if (abilityName === 'syncopate') {
      for (let index = 0; index < 3; index += 1) {
        const delay = 0.42 + index * 0.18;
        queueLineHazard(
          { x: game.current.player.x - 220, y: game.current.player.y - 70 + index * 70 },
          { x: game.current.player.x + 220, y: game.current.player.y - 70 + index * 70 },
          { width: 9, damage: 14, color: COLORS.towerRail, delay, length: 440, label: 'tempo', ...ownership }
        );
      }
    }
    if (abilityName === 'finale') {
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        queueLineHazard(boss, { x: boss.x + Math.cos(angle) * 220, y: boss.y + Math.sin(angle) * 220 }, { width: 9, damage: 16, color: COLORS.towerRail, delay: 0.55, length: 620, label: 'tempo', ...ownership });
      }
    }
    if (abilityName === 'crescendo') {
      for (let index = 0; index < 5; index += 1) {
        queueAreaHazard(game.current.player.x, game.current.player.y, {
          radius: 46 + index * 16,
          damage: 8 + index * 2,
          delay: 0.4 + index * 0.14,
          color: COLORS.towerRail,
          label: 'beat',
          ...ownership,
        });
      }
    }
    if (abilityName === 'raiseWalls') {
      spawnAround(boss, 'SIEGE', 3, boss.radius + 58, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'wallGuard', maxActive: 6 });
      queueAreaHazard(game.current.player.x, game.current.player.y, { radius: 95, damage: 8, slowRatio: 0.65, slowDuration: 2.2, delay: 0.75, color: COLORS.enemyShield, label: 'wall', ...ownership });
    }
    if (abilityName === 'corridorClamp') {
      queueLineHazard({ x: game.current.player.x - 240, y: game.current.player.y - 110 }, { x: game.current.player.x - 240, y: game.current.player.y + 110 }, { width: 12, damage: 14, color: COLORS.enemyShield, delay: 0.72, length: 220, label: 'gate', ...ownership });
      queueLineHazard({ x: game.current.player.x + 240, y: game.current.player.y - 110 }, { x: game.current.player.x + 240, y: game.current.player.y + 110 }, { width: 12, damage: 14, color: COLORS.enemyShield, delay: 0.72, length: 220, label: 'gate', ...ownership });
    }
    if (abilityName === 'gateSwap') {
      const oldX = boss.x;
      const oldY = boss.y;
      boss.x = game.current.player.x + rand(-210, 210);
      boss.y = game.current.player.y + rand(-160, 160);
      queueLineHazard({ x: oldX, y: oldY }, boss, { width: 18, damage: 20, color: COLORS.enemyShield, delay: 0.6, label: 'gate', ...ownership });
    }
    if (abilityName === 'mazeFold') {
      for (const tower of game.current.towers.slice(0, 2)) {
        queueLineHazard({ x: tower.x - 160, y: tower.y }, { x: tower.x + 160, y: tower.y }, { width: 10, damage: 16, color: COLORS.enemyShield, delay: 0.68, length: 320, label: 'maze', ...ownership });
      }
      queueAreaHazard(game.current.player.x, game.current.player.y, { radius: 84, damage: 12, delay: 0.82, color: COLORS.enemyShield, label: 'wall', ...ownership });
    }
    if (abilityName === 'mazeCrush') {
      for (const tower of game.current.towers.slice(0, 4)) {
        queueAreaHazard(tower.x, tower.y, { radius: 72, damage: 24, delay: 0.7, color: COLORS.enemyShield, label: 'wall', ...ownership });
      }
      queueAreaHazard(game.current.player.x, game.current.player.y, { radius: 88, damage: 18, delay: 0.8, color: COLORS.enemyShield, label: 'wall', ...ownership });
    }
    if (abilityName === 'deadEnd') {
      for (let index = 0; index < 4; index += 1) {
        const angle = (Math.PI * 2 * index) / 4;
        queueAreaHazard(game.current.player.x + Math.cos(angle) * 120, game.current.player.y + Math.sin(angle) * 90, {
          radius: 68,
          damage: 16,
          delay: 0.7 + index * 0.06,
          color: COLORS.enemyShield,
          label: 'wall',
          ...ownership,
        });
      }
    }
    if (abilityName === 'seedPods') spawnAround(boss, 'MEDIC', 2, boss.radius + 46, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'seedPod', maxActive: 5 });
    if (abilityName === 'blightRoots') {
      for (let index = 0; index < 3; index += 1) {
        queueLineHazard(
          { x: boss.x + rand(-70, 70), y: boss.y + rand(-70, 70) },
          { x: game.current.player.x + rand(-110, 110), y: game.current.player.y + rand(-90, 90) },
          { width: 10, damage: 12, color: COLORS.enemyMedic, delay: 0.6 + index * 0.08, length: 420, label: 'vine', ...ownership }
        );
      }
    }
    if (abilityName === 'poisonBloom') queueAreaHazard(game.current.player.x, game.current.player.y, { radius: 110, damage: 14, slowRatio: 0.7, slowDuration: 2, delay: 0.75, color: COLORS.enemyMedic, label: 'poison', ...ownership });
    if (abilityName === 'sporeBurst') {
      for (let index = 0; index < 4; index += 1) {
        const angle = (Math.PI * 2 * index) / 4;
        queueAreaHazard(game.current.player.x + Math.cos(angle) * 90, game.current.player.y + Math.sin(angle) * 80, {
          radius: 64,
          damage: 10,
          delay: 0.7 + index * 0.05,
          pulses: 2,
          pulseInterval: 0.52,
          color: COLORS.enemyMedic,
          label: 'spore',
          ...ownership,
        });
      }
    }
    if (abilityName === 'gardenWake') {
      for (const enemy of game.current.enemies) {
        if (enemy !== boss && dist(enemy, boss) <= 260) enemy.hp = Math.min(enemy.maxHp, enemy.hp + 20);
      }
      spawnAround(boss, 'SHARD', 6, boss.radius + 50, { ownerBossUid: boss.uid, ownerEncounterUid: boss.encounterUid ?? null, summonCategory: 'gardenShard', maxActive: 10 });
      queueAreaHazard(boss.x, boss.y, { radius: 210, damage: 16, slowRatio: 0.68, slowDuration: 2.4, delay: 0.85, color: COLORS.enemyMedic, label: 'garden', ...ownership });
    }
    if (abilityName === 'creepingCanopy') {
      for (let index = 0; index < 5; index += 1) {
        const angle = (Math.PI * 2 * index) / 5;
        queueAreaHazard(boss.x + Math.cos(angle) * 150, boss.y + Math.sin(angle) * 120, {
          radius: 74,
          damage: 12,
          delay: 0.72 + index * 0.06,
          pulses: 3,
          pulseInterval: 0.48,
          color: COLORS.enemyMedic,
          label: 'spore',
          ...ownership,
        });
      }
    }
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

    state.player.lastShoot += dt;
    if (state.player.lastShoot >= state.player.shootCd) {
      const target = findNearestTarget(state.player, state.enemies, state.player.range);
      if (target) {
        const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x);
        state.projectiles.push(createProjectile(state.player.x, state.player.y, angle, 400, state.player.damage, { kind: 'basic', radius: 4 }));
        state.player.lastShoot = 0;
      }
    }

    for (let towerIndex = state.towers.length - 1; towerIndex >= 0; towerIndex -= 1) {
      const tower = state.towers[towerIndex];
      tower.frozenTimer = Math.max(0, (tower.frozenTimer ?? 0) - dt);
      tower.lastShoot += dt;
      if (tower.hp <= 0) {
        spawnParticle(tower.x, tower.y, tower.color, 30, 80);
        state.towers.splice(towerIndex, 1);
        continue;
      }

      if (tower.lastShoot >= tower.fireRate * getTowerFireRateFactor(tower)) {
        const target = findNearestTarget(tower, state.enemies, tower.range);
        if (target) {
          const baseAngle = Math.atan2(target.y - tower.y, target.x - tower.x);
          const burstCount = tower.burstCount ?? 1;
          for (let index = 0; index < burstCount; index += 1) {
            const offset = burstCount === 1 ? 0 : (index - (burstCount - 1) / 2) * (tower.spread ?? 0.12);
            const projectileKind = tower.splash ? 'cannon' : tower.pierce ? 'sniper' : 'basic';
            state.projectiles.push(
              createProjectile(tower.x, tower.y, baseAngle + offset, tower.projectileSpeed ?? 500, tower.damage, {
                splash: tower.splash,
                pierce: tower.pierce || 0,
                life: tower.projectileLife ?? 2,
                color: tower.color,
                kind: projectileKind,
                radius: tower.splash ? 7 : tower.pierce ? 3 : 4,
                slowRatio: tower.slowRatio,
                slowDuration: tower.slowDuration,
                hitEnemies: new Set(),
              })
            );
          }
          tower.lastShoot = 0;
        }
      }
    }

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
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 5);
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      enemy.armoredTimer = Math.max(0, (enemy.armoredTimer ?? 0) - dt);
      if (enemy.isBoss && enemy.bossState.phaseIntroTimer) {
        enemy.bossState.phaseIntroTimer = Math.max(0, enemy.bossState.phaseIntroTimer - dt);
      }
      if (enemy.slowTimer <= 0) {
        enemy.slowRatio = 1;
      }

      if (enemy.burrowed) {
        enemy.burrowTimer -= dt;
        if (enemy.burrowTimer <= 0) {
          enemy.burrowed = false;
          spawnImpactWave(enemy.x, enemy.y, { maxRadius: 58, color: enemy.color, fillAlpha: 0.12 });
        } else {
          continue;
        }
      }

      if (enemy.phase) {
        enemy.phaseTimer -= dt;
        if (enemy.phaseTimer <= 0) {
          enemy.phased = !enemy.phased;
          enemy.phaseTimer = enemy.phased ? enemy.phase.duration : enemy.phase.interval;
        }
      }

      if (enemy.healAura) {
        for (const otherEnemy of state.enemies) {
          if (otherEnemy !== enemy && !otherEnemy.isBoss && dist(enemy, otherEnemy) <= enemy.healAura.range) {
            otherEnemy.hp = Math.min(otherEnemy.maxHp, otherEnemy.hp + enemy.healAura.amount * dt);
          }
        }
      }

      if (enemy.summon) {
        enemy.summonTimer += dt;
        if (enemy.summonTimer >= enemy.summon.interval) {
          enemy.summonTimer = 0;
          spawnAround(enemy, enemy.summon.type, enemy.summon.count, enemy.radius + 28);
          spawnImpactWave(enemy.x, enemy.y, { maxRadius: 70, color: enemy.color, fillAlpha: 0.1 });
        }
      }

      if (enemy.isBoss) {
        updateBossBehavior(enemy, dt);
      }

      let target = state.player;
      let minDistance = dist(enemy, state.player);
      if (enemy.targetMode === 'tower' && state.towers.length > 0) {
        target = state.towers[0];
        minDistance = dist(enemy, target);
      }
      if (enemy.targetMode !== 'player') {
        for (const tower of state.towers) {
          const towerDistance = dist(enemy, tower);
          if (towerDistance < minDistance || (enemy.targetMode === 'tower' && target === state.player)) {
            minDistance = towerDistance;
            target = tower;
          }
        }
      }

      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      const effectiveSpeed = enemy.baseSpeed * enemy.slowRatio;
      if (enemy.dashTimer > 0) {
        enemy.dashTimer -= dt;
        enemy.x += enemy.dashVx * dt;
        enemy.y += enemy.dashVy * dt;
      } else {
        enemy.x += Math.cos(angle) * effectiveSpeed * dt;
        enemy.y += Math.sin(angle) * effectiveSpeed * dt;
      }

      if (minDistance < enemy.radius + target.radius) {
        const damageFactor = target !== state.player ? enemy.towerDamageFactor ?? 1 : 1;
        damageTarget(target, enemy.damage * damageFactor * dt);
        if (target === state.player && state.gameTime % 0.5 < dt) {
          spawnParticle(target.x, target.y, COLORS.enemyBasic, 3, 30);
          syncHudHealth();
        }

        if (enemy.explode) {
          enemy.fuseTimer = enemy.fuseTimer ?? enemy.explode.fuse;
        }
      }

      if (enemy.explode && enemy.fuseTimer !== null) {
        enemy.fuseTimer -= dt;
        if (enemy.fuseTimer <= 0) {
          damageArea(enemy.x, enemy.y, enemy.explode.radius, enemy.explode.damage, { color: enemy.color, towerFactor: 1.25 });
          enemy.hp = 0;
        }
      }

      if (enemy.hp <= 0) {
        spawnParticle(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 18 : 8);
        state.drops.push({ x: enemy.x, y: enemy.y, value: enemy.value, radius: 4 + enemy.value, color: COLORS.gem, magnetized: false });
        if (enemy.deathSpawn) {
          spawnAround(enemy, enemy.deathSpawn.type, enemy.deathSpawn.count, enemy.deathSpawn.spread);
        }
        state.enemies.splice(enemyIndex, 1);
        if (enemy.isBoss && (state.mode !== 'debug' || state.debugWaveFlow)) {
          void playCue('boss_defeat');
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
        }
      }
    }

    if (state.wave.pendingRewardBossUid && !rewardState.active && !hasPendingBossAftermath(state.enemies, state.hazards, state.wave.pendingRewardBossUid)) {
      openBossReward();
    }
    if (state.wave.pendingRewardBossEncounterUid && !rewardState.active && !hasPendingEncounterAftermath(state.enemies, state.hazards, state.wave.pendingRewardBossEncounterUid)) {
      openBossReward();
    }

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

    for (let projectileIndex = state.projectiles.length - 1; projectileIndex >= 0; projectileIndex -= 1) {
      const projectile = state.projectiles[projectileIndex];
      projectile.previousX = projectile.x;
      projectile.previousY = projectile.y;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life -= dt;

      let hit = false;
      for (const enemy of state.enemies) {
        if (enemy.burrowed) continue;
        if (projectile.hitEnemies && projectile.hitEnemies.has(enemy)) continue;
        if (dist(projectile, enemy) < projectile.radius + enemy.radius + 4) {
          hit = true;
          damageEnemy(enemy, projectile.damage);
          enemy.hitFlash = 1;
          spawnFloatingText(enemy.x, enemy.y - 15, Math.floor(projectile.damage), projectile.color);
          spawnParticle(projectile.x, projectile.y, projectile.color, 5, 40);

          if (projectile.slowRatio) {
            enemy.slowRatio = Math.min(enemy.slowRatio, projectile.slowRatio);
            enemy.slowTimer = Math.max(enemy.slowTimer, projectile.slowDuration ?? 0.8);
          }

          if (projectile.kind === 'sniper') {
            spawnParticle(projectile.x, projectile.y, COLORS.towerSniper, 10, 80);
          }

          if (projectile.hitEnemies) {
            projectile.hitEnemies.add(enemy);
          }

          if (projectile.splash) {
            spawnImpactWave(projectile.x, projectile.y, { startRadius: 10, maxRadius: projectile.splash, growth: 320, life: 0.22, color: COLORS.towerCannon, lineWidth: 5, fillAlpha: 0.16 });
            spawnParticle(projectile.x, projectile.y, COLORS.towerCannon, 15, projectile.splash);
            for (const otherEnemy of state.enemies) {
              if (otherEnemy !== enemy && dist(projectile, otherEnemy) <= projectile.splash) {
                damageEnemy(otherEnemy, projectile.damage * 0.5);
                otherEnemy.hitFlash = 1;
                spawnFloatingText(otherEnemy.x, otherEnemy.y - 15, Math.floor(projectile.damage * 0.5), COLORS.towerCannon);
              }
            }
          }

          if (projectile.pierce > 0) {
            projectile.pierce -= 1;
            spawnImpactWave(projectile.x, projectile.y, { startRadius: 4, maxRadius: 18, growth: 240, life: 0.12, color: COLORS.towerSniper, lineWidth: 3, fillAlpha: 0 });
            hit = false;
          } else {
            break;
          }
        }
      }

      if (hit || projectile.life <= 0) {
        state.projectiles.splice(projectileIndex, 1);
      }
    }

    for (let dropIndex = state.drops.length - 1; dropIndex >= 0; dropIndex -= 1) {
      const drop = state.drops[dropIndex];
      const dropDistance = dist(drop, state.player);
      if (dropDistance < 80 || drop.magnetized) {
        drop.magnetized = true;
        const angle = Math.atan2(state.player.y - drop.y, state.player.x - drop.x);
        drop.x += Math.cos(angle) * 400 * dt;
        drop.y += Math.sin(angle) * 400 * dt;
        if (dropDistance < state.player.radius + drop.radius) {
          state.money += drop.value;
          syncHudMoney();
          state.player.radius = 14;
          window.setTimeout(() => {
            if (game.current) game.current.player.radius = 12;
          }, 50);
          state.drops.splice(dropIndex, 1);
        }
      }
    }

    for (let particleIndex = state.particles.length - 1; particleIndex >= 0; particleIndex -= 1) {
      const particle = state.particles[particleIndex];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      if (particle.life <= 0) state.particles.splice(particleIndex, 1);
    }

    for (let waveIndex = state.impactWaves.length - 1; waveIndex >= 0; waveIndex -= 1) {
      const impactWave = state.impactWaves[waveIndex];
      impactWave.radius = Math.min(impactWave.maxRadius, impactWave.radius + impactWave.growth * dt);
      impactWave.life -= dt;
      if (impactWave.life <= 0) state.impactWaves.splice(waveIndex, 1);
    }

    for (let hazardIndex = state.hazards.length - 1; hazardIndex >= 0; hazardIndex -= 1) {
      const hazard = state.hazards[hazardIndex];
      hazard.timer -= dt;
      if (hazard.timer > 0) continue;

      if (hazard.type === 'area') {
        if (isTargetWithinArea(hazard, hazard.radius, state.player)) {
          damageTarget(state.player, hazard.damage);
          const pulledPlayerPosition = getPulledPosition({ target: state.player, hazard });
          state.player.x = pulledPlayerPosition.x;
          state.player.y = pulledPlayerPosition.y;
        }
        syncHudHealth();
        for (const tower of state.towers) {
          const towerHit = isTargetWithinArea(hazard, hazard.radius, tower);
          if (towerHit) {
            damageTarget(tower, hazard.damage);
            const pulledTowerPosition = getPulledPosition({ target: tower, hazard });
            tower.x = pulledTowerPosition.x;
            tower.y = pulledTowerPosition.y;
          }
          if (towerHit && hazard.slowRatio) {
            tower.frozenTimer = Math.max(tower.frozenTimer ?? 0, hazard.slowDuration ?? 1.4);
          }
        }
        spawnImpactWave(hazard.x, hazard.y, { maxRadius: hazard.radius, color: hazard.color, fillAlpha: 0.12, life: 0.22 });
        hazard.pulsesRemaining -= 1;
        if (hazard.pulsesRemaining > 0) {
          hazard.timer = hazard.pulseInterval;
          hazard.maxTimer = hazard.pulseInterval;
          hazard.radius += hazard.radiusStep;
          hazard.damage += hazard.damageStep;
        } else {
          state.hazards.splice(hazardIndex, 1);
        }
        continue;
      }

      if (isLineHazardHit({ hazard, target: state.player })) {
        damageTarget(state.player, hazard.damage);
        syncHudHealth();
      }
      for (const tower of state.towers) {
        if (isLineHazardHit({ hazard, target: tower })) damageTarget(tower, hazard.damage);
      }
      spawnImpactWave(hazard.x2, hazard.y2, { maxRadius: 36, color: hazard.color, fillAlpha: 0.08, life: 0.18 });
      state.hazards.splice(hazardIndex, 1);
    }

    for (let textIndex = state.floatingTexts.length - 1; textIndex >= 0; textIndex -= 1) {
      const floatingText = state.floatingTexts[textIndex];
      floatingText.y += floatingText.vy * dt;
      floatingText.life -= dt;
      if (floatingText.life <= 0) state.floatingTexts.splice(textIndex, 1);
    }
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
