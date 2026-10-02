import { useEffect, useRef, useState } from 'react';
import { BOSS_ORDER, BOSS_TYPES, COLORS, ENEMY_ORDER, ENEMY_TYPES, STARTING_MONEY, UI_COPY, createInitialTowerCatalog } from '../../data/gameConfig';
import { getBossPresentation, getBossPhaseCalloutText, getBossPhaseHint, getBossPhaseTone } from '../../data/bossPresentation';
import { WAVE_DEBUG_CHECKPOINTS, WAVE_TABLE } from '../../data/waveTable';
import { runBossOptimizedAbility } from '../engine/bossOptimizedAbilities.js';
import { tickBossCombatRuntime, enrageTwinRuntime } from '../engine/bossCombatRuntime.js';
import { createAreaHazard, createLineHazard, movePlayerOnBattlefield, tickPlayerControl } from '../engine/battlefieldRules.js';
import { areBossHudSnapshotsEqual, buildBossHudRuntime } from '../engine/bossHudRuntime.js';
import {
  applyBossPhaseIntroRuntime,
  createBossClimaxAccentEffectPlan,
  createBossPhaseShiftEffectPlan,
  shouldTriggerBossClimaxAccent,
} from '../engine/bossPhasePresentationRuntime.js';
import { updateDropRuntime, updateHazardRuntime, updateProjectileRuntime, updateTransientVisualRuntime } from '../engine/combatFrameRuntime.js';
import { getTowerFireRateFactor, updatePlayerOffenseRuntime, updateTowerOffenseRuntime } from '../engine/combatOffenseRuntime.js';
import { updateEnemyBehaviorRuntime } from '../engine/enemyBehaviorRuntime.js';
import { settleEnemyDefeatRuntime, settlePendingBossRewardRuntime } from '../engine/enemyDefeatRuntime.js';
import {
  getBossEditorBaseTemplate,
  getBossOwnership,
} from '../engine/encounterRuntime.js';
import { applyWaveSpawnPlanRuntime, spawnBossEncounterRuntimeAt, spawnEnemyRuntimeAt, spawnEnemyGroupRuntime } from '../engine/entitySpawnRuntime.js';

import { getAreaDamageHits, resolveEnemyDamage, resolveTargetDamage } from '../engine/combatRules.js';
import {
  createDebugEntityDragPlacementState,
  createDragPlacementCommitPlan,
  createEmptyDragPlacementState,
  createTowerDragPlacementState,
  evaluateTowerPlacement,
  updateDragPlacementState,
} from '../engine/placementRules.js';
import {
  applyRewardChoiceRuntime,
  getRewardAppliedMessage,
  openBossRewardRuntime,
} from '../engine/rewardFlowRuntime.js';
import {
  applyDebugTowerLayoutRuntime,
  createPlacedTower,
  unlockAllTowerBlueprints,
  updatePlacedTowerLevel,
  updateTowerBlueprintLevel,
} from '../engine/debugTowerRuntime.js';
import { forceBossPhaseRuntime } from '../engine/debugBossRuntime.js';
import {
  DEBUG_SANDBOX_OVERVIEW,
  applyDebugOptionRuntime,
  clearDebugFieldPanelRuntime,
  createDebugBossEditorSpawnPlan,
  enterDebugSandboxPanelRuntime,
  openDebugRewardPanelRuntime,
  resetDebugPanelCombatRuntime,
  startDebugWavePanelRuntime,
} from '../engine/debugFieldRuntime.js';
import { createEmptyWaveState, createRuntimeState } from '../engine/gameState';
import { advanceWaveTickRuntime, createWaveSpawnPlan, startWaveRuntime } from '../engine/waveFlowRuntime.js';
import { formatTime, rand } from '../engine/gameMath';
import { drawGameScene } from '../../view/canvas/canvasRenderer.js';
import useBossEditorRuntime from './useBossEditorRuntime.js';
import useCanvasGameLoop from './useCanvasGameLoop.js';
import useGameAudio from './useGameAudio.js';
import { createPlaytestTelemetry } from '../engine/playtestTelemetry.js';
import { addBossHudArtIds } from '../../view/art/contracts.js';
import { createArtRegistry, loadArtRegistry } from '../../view/art/integration/assetRegistry.js';
import { createPresentationRuntime } from '../../view/art/integration/presentationRuntime.js';

const DRAG_CANCEL_MARGIN = 18;
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

export default function useGeoGuardGame() {
  const { audioSettings, setAudioEnabled, setAudioVolume, playCue, resumeAudio } = useGameAudio();
  const canvasRef = useRef(null);
  const game = useRef(createRuntimeState());
  const artRef = useRef(null);
  if (!artRef.current) artRef.current = { registry: createArtRegistry(), runtime: createPresentationRuntime({ getTowerFireRateFactor }) };
  const telemetry = useRef(createPlaytestTelemetry());
  const exportPausedRef = useRef(false);
  let damageContext = 'contact-or-ability';
  const viewport = () => ({ width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio || 1 });
  const towerCatalogRef = useRef(createInitialTowerCatalog());
  const [gameState, setGameState] = useState('START');
  const [paused, setPaused] = useState(false);
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

  useEffect(() => {
    const controller = new AbortController();
    void loadArtRegistry(artRef.current.registry, { baseUrl: import.meta.env.BASE_URL, signal: controller.signal });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    // Read-only QA evidence from the actual game; no fixture injection or new controls.
    const inspect = () => structuredClone({
      gameState, paused, rewardActive: rewardState.active, state: game.current,
      presentation: artRef.current.runtime.inspect(),
      art: { status: artRef.current.registry.status, errors: artRef.current.registry.errors,
        drawErrors: artRef.current.registry.drawErrors, fallbackArtIds: [...artRef.current.registry.fallbackArtIds],
        availableIds: artRef.current.registry.characters?.assets?.availableIds ?? [] },
    });
    window.__GEOGUARD_ART_INSPECT__ = inspect;
    return () => { if (window.__GEOGUARD_ART_INSPECT__ === inspect) delete window.__GEOGUARD_ART_INSPECT__; };
  }, [gameState, paused, rewardState.active]);

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

  const syncHudMoney = (source) => {
    telemetry.current.money(game.current, typeof source === 'string' ? source : 'runtime-unclassified');
    setMoney(game.current.debugOptions.infiniteMoney ? '∞' : game.current.money);
  };
  const syncHudHealth = () => setHealth(game.current.debugOptions.infiniteHealth ? game.current.player.maxHp : Math.max(0, Math.floor(game.current.player.hp)));

  const applyDebugUiResetState = (uiResetState) => {
    artRef.current.runtime.reset(game.current);
    setRewardState(uiResetState.rewardState);
    setBossHud(uiResetState.bossHud);
    setTowerContextMenu(uiResetState.towerContextMenu);
    clearDragPlacement();
  };

  const resetCombatState = ({ clearTowers = false } = {}) => {
    applyDebugUiResetState(resetDebugPanelCombatRuntime({ state: game.current, clearTowers }));
  };

  const enterDebugSandbox = ({ clearTowers = false, announce = false } = {}) => {
    const sandboxState = enterDebugSandboxPanelRuntime({ state: game.current, clearTowers, announce });
    applyDebugUiResetState(sandboxState);
    setDebugWaveFlow(sandboxState.debugWaveFlow);
    setCurrentWave(sandboxState.currentWave);
    setWaveOverview(sandboxState.waveOverview);
    if (sandboxState.message) {
      showWaveMessage(sandboxState.message, sandboxState.messageDuration);
    }
  };

  const syncBossHud = () => {
    const nextHud = addBossHudArtIds(buildBossHudRuntime({
      enemies: game.current.enemies,
      getPhaseHint: getBossPhaseHint,
      getPhaseTone: getBossPhaseTone,
    }), game.current.enemies);
    setBossHud((previous) => {
      return areBossHudSnapshotsEqual(previous, nextHud) ? previous : nextHud;
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

  const emitBossVisualEffectPlan = (effectPlan) => {
    if (!effectPlan) {
      return;
    }

    for (const impactWave of effectPlan.impactWaves) {
      spawnImpactWave(impactWave.x, impactWave.y, impactWave.options);
    }

    for (const particle of effectPlan.particles) {
      spawnParticle(particle.x, particle.y, particle.color, particle.count, particle.speedBase);
    }

    for (const floatingText of effectPlan.floatingTexts) {
      spawnFloatingText(floatingText.x, floatingText.y, floatingText.text, floatingText.color, floatingText.options);
    }
  };

  const triggerBossPhaseShift = (boss, activePhase, activePhaseIndex, previousPhaseIndex = -1) => {
    const effectPlan = createBossPhaseShiftEffectPlan({
      boss,
      activePhase,
      activePhaseIndex,
      previousPhaseIndex,
      getCalloutText: getBossPhaseCalloutText,
      partner: getEncounterPartner(boss),
    });

    void playCue(effectPlan.cue);
    applyBossPhaseIntroRuntime({ boss, duration: effectPlan.phaseIntro.duration });
    addCameraShake(effectPlan.cameraShake.strength, effectPlan.cameraShake.duration);
    emitBossVisualEffectPlan(effectPlan);
    if (effectPlan.bossState.orbitalIndexDelta) {
      boss.bossState.orbitalIndex = (boss.bossState.orbitalIndex ?? 0) + effectPlan.bossState.orbitalIndexDelta;
    }

    if (effectPlan.message) {
      showWaveMessage(effectPlan.message.waveMessage, effectPlan.message.duration);
    }
  };

  const triggerBossClimaxAccent = (boss) => {
    emitBossVisualEffectPlan(
      createBossClimaxAccentEffectPlan({
        boss,
        partner: getEncounterPartner(boss),
        player: game.current.player,
      })
    );
  };

  const getTowerById = (towerId) => towerCatalogRef.current.find((tower) => tower.id === towerId);

  const getDebugDragEntity = (kind, entityId) =>
    kind === 'boss' ? applyDebugBossAuthoring(getBossEditorBaseTemplate(entityId)) : ENEMY_TYPES[entityId];

  const getEncounterPartner = (boss) => {
    if (!boss.encounterUid) return null;
    return game.current.enemies.find((enemy) => enemy.isBoss && enemy.uid !== boss.uid && enemy.encounterUid === boss.encounterUid) ?? null;
  };

  const spawnEnemyAt = (enemyKey, x, y, extras = {}) => {
    const entity = spawnEnemyRuntimeAt({ state: game.current, enemyKey, x, y, extras });
    if (entity?.summonedByBossUid) artRef.current.runtime.captureBirths(game.current, [entity],
      game.current.enemies.find(enemy => enemy.uid === entity.summonedByBossUid));
    return entity;
  };

  const spawnBossEncounterAt = (bossTemplate, x, y) => {
    return spawnBossEncounterRuntimeAt({ state: game.current, bossTemplate, x, y });
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

  const applyWaveStartState = (waveStart) => {
    setDebugWaveFlow(waveStart.debugWaveFlow);
    setCurrentWave(waveStart.currentWave);
    setWaveOverview(waveStart.waveOverview);
    showWaveMessage(waveStart.waveMessage, 2400);
  };

  const startWave = (waveNumber) => {
    telemetry.current.event(game.current, 'wave_transition', { nextWave: waveNumber, hp: game.current.player.hp, money: game.current.money });
    const waveStart = startWaveRuntime({
      state: game.current,
      waveNumber,
      applyBossAuthoring: applyDebugBossAuthoring,
    });
    applyWaveStartState(waveStart);
    telemetry.current.event(game.current, 'wave_start', { plannedEnemies: game.current.wave.queue.length, boss: game.current.wave.boss?.id ?? game.current.wave.boss });
  };

  const initGame = (options = {}) => {
    telemetry.current.end(game.current, 'restarted', viewport());
    const previousReport = telemetry.current.export(game.current, viewport());
    if (previousReport) { try { localStorage.setItem('geoguard-last-playtest', JSON.stringify(previousReport)); } catch { /* Export remains available in memory if storage is full. */ } }
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
      money: isDebugMode ? 999999 : STARTING_MONEY,
    };
    artRef.current.runtime.reset(game.current);
    telemetry.current.start(game.current, { sessionId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${performance.now()}`, build: import.meta.env.VITE_BUILD_ID ?? '0.1.0-local', viewport: viewport(), inputCapabilities: { touchPoints: navigator.maxTouchPoints ?? 0 }, debugOptions: nextDebugOptions });
    setDebugOptions(nextDebugOptions);
    setDebugWaveFlow(false);
    setMoney(isDebugMode ? '∞' : STARTING_MONEY);
    setPaused(false);
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
    game.current.dragPlacement = createEmptyDragPlacementState();
    setDragTowerId(null);
    setDragEntity(null);
  };

  useEffect(() => {
    if (paused || rewardState.active) {
      clearDragPlacement();
      setTowerContextMenu(null);
    }
  }, [paused, rewardState.active]);

  const tryBuildDraggedTower = (clientX, clientY) => {
    const cancelRects = [game.current.buildBarRect, game.current.debugPanelRect].filter(Boolean);
    const tower = game.current.dragPlacement.kind === 'tower' ? getTowerById(game.current.dragPlacement.towerId) : null;
    const placement = tower ? evaluatePlacement(tower, clientX, clientY) : null;
    const commitPlan = createDragPlacementCommitPlan({
      dragPlacement: game.current.dragPlacement,
      clientX,
      clientY,
      cancelRects,
      cancelMargin: DRAG_CANCEL_MARGIN,
      tower,
      placement,
    });

    if (commitPlan.type === 'idle') {
      return;
    }
    telemetry.current.event(game.current, 'build_attempt', { towerId: tower?.id, result: commitPlan.type, reason: commitPlan.invalidReason, screen: { x: clientX, y: clientY }, world: commitPlan.worldPoint });

    if (commitPlan.type === 'cancel') {
      clearDragPlacement();
      return;
    }

    if (commitPlan.type === 'spawn-debug-entity') {
      const { worldPoint, kind, entityId } = commitPlan;
      if (kind === 'boss') {
        spawnBossAt(entityId, worldPoint.x, worldPoint.y);
      } else {
        spawnEnemyAt(entityId, worldPoint.x, worldPoint.y, { skipBurrowPosition: true });
        void playCue('ui_confirm');
      }
      spawnParticle(worldPoint.x, worldPoint.y, kind === 'boss' ? COLORS.boss : ENEMY_TYPES[entityId]?.color ?? COLORS.danger, kind === 'boss' ? 24 : 12, 70);
      clearDragPlacement();
      return;
    }

    if (commitPlan.type === 'missing-tower') {
      clearDragPlacement();
      return;
    }

    if (commitPlan.type === 'reject-tower') {
      void playCue('ui_error');
      spawnFloatingText(commitPlan.worldPoint.x, commitPlan.worldPoint.y, commitPlan.invalidReason, COLORS.danger);
      clearDragPlacement();
      return;
    }

    if (!game.current.debugOptions.infiniteMoney) {
      game.current.money -= tower.cost;
    }
    syncHudMoney('build');
    game.current.towers.push(
      createPlacedTower({
        tower,
        uid: game.current.nextTowerUid++,
        x: commitPlan.worldPoint.x,
        y: commitPlan.worldPoint.y,
      })
    );
    telemetry.current.syncEntities(game.current);
    void playCue('tower_place');
    spawnParticle(commitPlan.worldPoint.x, commitPlan.worldPoint.y, tower.color, 15, 60);
    clearDragPlacement();
  };

  const beginTowerDrag = (towerId, clientX, clientY, touchId = null) => {
    if (gameState !== 'PLAYING' || rewardState.active || paused) {
      return;
    }
    const tower = getTowerById(towerId);
    if (!tower || !tower.available) {
      return;
    }

    game.current.dragPlacement = createTowerDragPlacementState({ towerId, clientX, clientY, touchId });
    telemetry.current.event(game.current, 'build_drag_start', { towerId, device: touchId === null ? 'pointer' : 'touch', screen: { x: clientX, y: clientY } });
    setDragTowerId(towerId);
    setDragEntity(null);
    updateDragPlacement(clientX, clientY, tower);
  };

  const beginDebugEntityDrag = (kind, entityId, clientX, clientY) => {
    if (gameState !== 'PLAYING' || game.current.mode !== 'debug') {
      return;
    }

    game.current.dragPlacement = createDebugEntityDragPlacementState({ kind, entityId, clientX, clientY });
    setDragTowerId(null);
    setDragEntity({ kind, id: entityId });
    updateDragPlacement(clientX, clientY);
  };

  const openBossReward = () => {
    telemetry.current.event(game.current, 'reward_open', { hp: game.current.player.hp, money: game.current.money });
    void playCue('reward_open');
    setRewardState(
      openBossRewardRuntime({
        state: game.current,
        catalog: towerCatalogRef.current,
        currentWave,
        hudMoney: money,
      })
    );
  };

  const applyRewardChoice = (choice) => {
    if (!rewardState.active || !rewardState.choices.some((offer) => offer.id === choice.id)) return;
    telemetry.current.event(game.current, 'reward_choice', { choice: { id: choice.id, title: choice.title, type: choice.type, towerId: choice.towerId }, offers: rewardState.choices.map(c => ({ id: c.id, title: c.title, type: c.type, towerId: c.towerId })), hpBefore: game.current.player.hp, moneyBefore: game.current.money });
    void playCue('reward_pick');
    const previousCatalog = towerCatalogRef.current;
    const rewardResult = applyRewardChoiceRuntime({
      state: game.current,
      catalog: previousCatalog,
      choice,
      currentWave,
    });

    if (rewardResult.catalog !== previousCatalog) {
      towerCatalogRef.current = rewardResult.catalog;
      setTowerCatalog(rewardResult.catalog);
    }

    if (rewardResult.money !== game.current.money) {
      game.current.money = rewardResult.money;
      syncHudMoney('reward');
    }

    if (rewardResult.hp !== game.current.player.hp) {
      game.current.player.hp = rewardResult.hp;
      syncHudHealth();
    }

    setRewardState(rewardResult.rewardState);
    const followUp = rewardResult.followUp;
    if (followUp.type === 'debug-stay') {
      showWaveMessage(getRewardAppliedMessage(choice), 1600);
      return;
    }
    startWave(followUp.waveNumber);
  };
  const setDebugOption = (key, value) => {
    const nextOptions = applyDebugOptionRuntime({ state: game.current, key, value });
    setDebugOptions(nextOptions);
    syncHudMoney();
    syncHudHealth();
  };

  const unlockAllBlueprints = () => {
    void playCue('ui_confirm');
    const nextCatalog = unlockAllTowerBlueprints(towerCatalogRef.current);
    towerCatalogRef.current = nextCatalog;
    setTowerCatalog(nextCatalog);
    showWaveMessage({ title: 'All Towers Unlocked', subtitle: 'Every blueprint is now available in the build bar.', tone: 'system' }, 1500);
  };

  const applyDebugLayout = (layoutId) => {
    if (game.current.mode !== 'debug') {
      return;
    }

    const layoutResult = applyDebugTowerLayoutRuntime({
      state: game.current,
      layoutId,
      catalog: towerCatalogRef.current,
    });
    if (!layoutResult.applied) {
      return;
    }

    for (const tower of layoutResult.towers) {
      spawnParticle(tower.x, tower.y, tower.color, 12, 60);
    }

    showWaveMessage(layoutResult.message, layoutResult.messageDuration);
  };

  const clearDebugField = ({ clearTowers = false, sandbox = false } = {}) => {
    if (game.current.mode !== 'debug') {
      return;
    }
    if (sandbox) {
      enterDebugSandbox({ clearTowers, announce: true });
      return;
    }
    const clearState = clearDebugFieldPanelRuntime({ state: game.current, clearTowers });
    applyDebugUiResetState(clearState);
    showWaveMessage(clearState.message, clearState.messageDuration);
  };

  const startDebugWave = (waveNumber) => {
    if (game.current.mode !== 'debug') {
      return;
    }
    const waveStart = startDebugWavePanelRuntime({
      state: game.current,
      waveNumber,
      applyBossAuthoring: applyDebugBossAuthoring,
    });
    applyDebugUiResetState(waveStart);
    applyWaveStartState(waveStart);
  };

  const openDebugReward = () => {
    if (game.current.mode !== 'debug') {
      return;
    }
    void playCue('reward_open');
    setRewardState(
      openDebugRewardPanelRuntime({
        state: game.current,
        catalog: towerCatalogRef.current,
        currentWave,
        hudMoney: money,
      })
    );
  };

  const spawnBossFromEditor = () => {
    const spawnPlan = createDebugBossEditorSpawnPlan({
      gameState,
      mode: game.current.mode,
      selectedBossId: bossEditor.selectedBossId,
      player: game.current.player,
    });

    if (spawnPlan.type !== 'spawn-boss') {
      return;
    }

    spawnBossAt(spawnPlan.bossId, spawnPlan.spawnPoint.x, spawnPlan.spawnPoint.y);
  };

  const forceBossPhase = (phaseNumber) => {
    if (game.current.mode !== 'debug') {
      return;
    }

    const phaseResult = forceBossPhaseRuntime({
      enemies: game.current.enemies,
      phaseNumber,
      onPhaseShift: ({ boss, activePhase, activePhaseIndex, previousPhaseIndex }) => {
        triggerBossPhaseShift(boss, activePhase, activePhaseIndex, previousPhaseIndex);
      },
    });
    if (!phaseResult.updatedCount) {
      showWaveMessage({ title: 'No Active Boss', subtitle: 'Drag in a boss or start a debug wave first.', tone: 'system' }, 1500);
      return;
    }

    syncBossHud();
  };

  const changeTowerBlueprintLevel = (towerId, delta) => {
    if (game.current.mode !== 'debug') return;
    const nextCatalog = updateTowerBlueprintLevel({ catalog: towerCatalogRef.current, towerId, delta });
    towerCatalogRef.current = nextCatalog;
    setTowerCatalog(nextCatalog);
  };

  const changePlacedTowerLevel = (towerUid, delta) => {
    if (game.current.mode !== 'debug') return;
    updatePlacedTowerLevel({ towers: game.current.towers, towerUid, delta });
  };

  const openBlueprintContextMenu = (towerId, clientX, clientY) => {
    if (game.current.mode !== 'debug') return;
    setTowerContextMenu({ type: 'blueprint', towerId, x: clientX, y: clientY });
  };

  const applyTowerContextAction = (delta) => {
    if (!towerContextMenu || game.current.mode !== 'debug') return;
    if (towerContextMenu.type === 'blueprint') {
      changeTowerBlueprintLevel(towerContextMenu.towerId, delta);
    } else {
      changePlacedTowerLevel(towerContextMenu.towerUid, delta);
    }
    setTowerContextMenu(null);
  };

  const damageTarget = (target, amount) => {
    const hpBefore = Math.max(0, target.hp);
    const damageResult = resolveTargetDamage({
      targetHp: target.hp,
      amount,
      infiniteHealth: target === game.current.player && game.current.debugOptions.infiniteHealth,
    });
    target.hp = damageResult.hp;
    telemetry.current.damage(game.current, target, hpBefore - Math.max(0, target.hp), 0, damageContext);
  };

  const damageEnemy = (enemy, amount) => {
    const hpBefore = Math.max(0, enemy.hp), shieldBefore = enemy.shield ?? 0;
    const damageResult = resolveEnemyDamage(enemy, amount);
    enemy.hp = damageResult.hp;
    enemy.shield = damageResult.shield;
    telemetry.current.damage(game.current, enemy, hpBefore - Math.max(0, enemy.hp), shieldBefore - enemy.shield, 'player-or-tower');
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
    const firstNewIndex = game.current.enemies.length;
    const spawned = spawnEnemyGroupRuntime({ state: game.current, source, enemyKey, count, radius, options });
    artRef.current.runtime.captureBirths(game.current, game.current.enemies.slice(firstNewIndex), source);
    return spawned;
  };

  const queueLineHazard = (source, target, options = {}) => {
    game.current.hazards.push(createLineHazard(source, target, { color: COLORS.towerRail, ...options }));
  };

  const queueAreaHazard = (x, y, options = {}) => {
    game.current.hazards.push(createAreaHazard(game.current.player, x, y, { color: COLORS.danger, ...options }));
  };

  const runBossAbility = (boss, abilityName) => {
    const firstNewIndex = game.current.enemies.length;
    runBossOptimizedAbility({
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
    artRef.current.runtime.captureBirths(game.current, game.current.enemies.slice(firstNewIndex), boss);
  };

  const enrageEncounterPartner = (defeatedBoss) => {
    const partner = enrageTwinRuntime(game.current, defeatedBoss);
    if (partner) {
      spawnImpactWave(partner.x, partner.y, { maxRadius: partner.radius + 44, color: partner.color, fillAlpha: 0.14 });
      spawnFloatingText(partner.x, partner.y - partner.radius - 16, '独奏 · 新招式', partner.color);
    }
  };

  const updateBossBehavior = (boss, dt) => {
    const result = tickBossCombatRuntime({ state: game.current, boss, dt,
      runAbility: runBossAbility,
      onPhaseShift: ({ boss, activePhase, activePhaseIndex, previousPhaseIndex }) =>
        triggerBossPhaseShift(boss, activePhase, activePhaseIndex, previousPhaseIndex),
    });
    if (result.type === 'execute' && shouldTriggerBossClimaxAccent(boss)) triggerBossClimaxAccent(boss);
    if (result.type === 'execute') telemetry.current.event(game.current, 'boss_ability', { bossId: boss.id, ability: result.ability, phase: boss.currentPhaseIndex });
  };

  const update = (dt) => {
    if (paused || rewardState.active) return;
    const state = game.current;
    const previousPosition = { x: state.player.x, y: state.player.y };
    damageContext = 'contact-or-ability';
    state.gameTime += dt;
    state.camera.shakeTimer = Math.max(0, (state.camera.shakeTimer ?? 0) - dt);
    if (state.camera.shakeTimer <= 0) {
      state.camera.shakeStrength = 0;
      state.camera.shakeDuration = 0;
    }

    if (Math.floor(state.gameTime) > time) {
      setTime(Math.floor(state.gameTime));
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

    tickPlayerControl(state.player, dt);
    movePlayerOnBattlefield({ player: state.player, dx, dy, dt, enemies: state.enemies });
    state.camera.x += (state.player.x - state.camera.x) * 5 * dt;
    state.camera.y += (state.player.y - state.camera.y) * 5 * dt;

    const firstNewProjectile = state.projectiles.length;
    updatePlayerOffenseRuntime({ state, dt });
    updateTowerOffenseRuntime({ state, dt, spawnParticle });
    artRef.current.runtime.captureShots(state, firstNewProjectile);

    const waveTick = advanceWaveTickRuntime({ state, dt });
    const waveSpawnPlan = createWaveSpawnPlan({
      waveTick,
      camera: state.camera,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });

    const waveSpawnResult = applyWaveSpawnPlanRuntime({ state, spawnPlan: waveSpawnPlan });
    telemetry.current.syncEntities(state);
    if (waveSpawnResult.bossSpotlightTemplate) {
      showBossSpotlight(waveSpawnResult.bossSpotlightTemplate);
    }

    for (let enemyIndex = state.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
      const enemy = state.enemies[enemyIndex];
      const firstMechanicChild = state.enemies.length;
      const mechanicStep = artRef.current.runtime.beginMechanicStep(state, enemy);
      const enemyUpdate = updateEnemyBehaviorRuntime({
        state,
        enemy,
        dt,
        spawnAround,
        spawnImpactWave,
        updateBossBehavior,
        queueAreaHazard,
        damageTarget,
        damageArea,
        spawnParticle,
        syncHudHealth,
      });
      if (enemy.mechanic) artRef.current.runtime.captureBirths(state, state.enemies.slice(firstMechanicChild), enemy);
      artRef.current.runtime.endMechanicStep(state, enemy, mechanicStep, dt);
      if (enemyUpdate.continueLoop) {
        continue;
      }

      if (enemy.hp <= 0) telemetry.current.defeated(state, enemy);
      const moneyBeforeDefeat = state.money;
      const defeatResult = settleEnemyDefeatRuntime({
        state,
        enemy,
        enemyIndex,
        spawnParticle,
        spawnAround,
        playBossDefeatCue: () => {
          void playCue('boss_defeat');
        },
        syncHudMoney: () => syncHudMoney('defeat-settlement'),
        openBossReward,
        enrageEncounterPartner,
      });
      artRef.current.runtime.captureDefeat(state, enemy, defeatResult, moneyBeforeDefeat);
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
      damageEnemy: (enemy, amount, projectile) => {
        damageEnemy(enemy, amount);
        artRef.current.runtime.captureHit(state, enemy, projectile);
      },
      spawnFloatingText,
      spawnParticle,
      spawnImpactWave,
    });
    updateDropRuntime({
      state,
      dt,
      syncHudMoney: () => syncHudMoney('pickup'),
      pulsePlayerPickupRadius: () => {
        window.setTimeout(() => {
          if (game.current) game.current.player.radius = 12;
        }, 50);
      },
    });
    updateTransientVisualRuntime({ state, dt });
    damageContext = 'telegraphed-hazard';
    const resolvingMechanicHazards = state.hazards.filter(hazard => hazard.ownerMechanicUid != null && hazard.timer <= dt);
    updateHazardRuntime({
      state,
      dt,
      damageTarget,
      spawnImpactWave,
      syncHudHealth,
    });
    artRef.current.runtime.captureHazardPulses(state, resolvingMechanicHazards);
    telemetry.current.frame(state, dt, { x: dx, y: dy, device: state.joystick.active ? (state.joystick.touchId == null ? 'pointer' : 'touch') : 'keyboard' }, previousPosition, viewport());
    if (state.player.hp <= 0 && !state.debugOptions.infiniteHealth) telemetry.current.end(state, 'dead', viewport());
  };

  useCanvasGameLoop({
    canvasRef,
    game,
    gameState,
    rewardActive: rewardState.active,
    paused,
    onPause: () => setPaused(true),
    onTogglePause: () => setPaused((value) => !value),
    resumeAudio,
    closeTowerContextMenu: () => setTowerContextMenu(null),
    setTowerContextMenu,
    updateDragPlacement,
    tryBuildDraggedTower,
    update,
    onFrameTiming: seconds => telemetry.current.frameTiming(seconds),
    drawScene: (ctx, canvas) => drawGameScene(ctx, canvas, { state: game.current, getTowerById, getDebugDragEntity,
      art: artRef.current, paused: paused || rewardState.active || gameState !== 'PLAYING' }),
  });

  const setBuildBarRect = (rect) => {
    game.current.buildBarRect = rect;
  };

  const setDebugPanelRect = (rect) => {
    game.current.debugPanelRect = rect;
  };

  useEffect(() => {
    telemetry.current.event(game.current, paused ? 'pause' : 'resume');
  }, [paused]);
  useEffect(() => {
    const onVisibility = () => telemetry.current.event(game.current, 'visibility', { hidden: document.hidden });
    const onResize = () => telemetry.current.event(game.current, 'viewport_change', viewport());
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    if (gameState === 'GAMEOVER') {
      try { localStorage.setItem('geoguard-last-playtest', JSON.stringify(telemetry.current.export(game.current, viewport()))); } catch { /* Manual export remains available. */ }
    }
    return () => { document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('resize', onResize); };
  }, [gameState]);

  return {
    exportPlaytest: () => {
      if (gameState === 'PLAYING' && !paused && !rewardState.active) { exportPausedRef.current = true; setPaused(true); }
      return telemetry.current.export(game.current, viewport());
    },
    closePlaytestExport: () => { if (exportPausedRef.current) { exportPausedRef.current = false; setPaused(false); } },
    exportPreviousPlaytest: () => { try { return JSON.parse(localStorage.getItem('geoguard-last-playtest')); } catch { return null; } },
    canvasRef,
    gameState,
    paused,
    togglePause: () => { if (!rewardState.active) setPaused((value) => !value); },
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
