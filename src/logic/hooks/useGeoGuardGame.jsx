import { useEffect, useRef, useState } from 'react';
import { BOSS_ORDER, BOSS_TYPES, COLORS, ENEMY_ORDER, ENEMY_TYPES, UI_COPY, createInitialTowerCatalog } from '../../data/gameConfig';
import { getBossPresentation, getBossPhaseCalloutText, getBossPhaseHint, getBossPhaseTone } from '../../data/bossPresentation';
import { WAVE_DEBUG_CHECKPOINTS, WAVE_TABLE } from '../../data/waveTable';
import { runBossAbilityEffect } from '../engine/bossAbilityRuntime.js';
import { createBossBehaviorNode, DEFAULT_BOSS_ABILITY_COOLDOWNS } from '../engine/bossAuthoringRules.js';
import { areBossHudSnapshotsEqual, buildBossHudRuntime } from '../engine/bossHudRuntime.js';
import {
  applyBossPhaseIntroRuntime,
  createBossClimaxAccentEffectPlan,
  createBossPhaseShiftEffectPlan,
  getBossClimaxAccentCooldown,
  shouldTriggerBossClimaxAccent,
} from '../engine/bossPhasePresentationRuntime.js';
import { updateDropRuntime, updateHazardRuntime, updateProjectileRuntime, updateTransientVisualRuntime } from '../engine/combatFrameRuntime.js';
import { updatePlayerOffenseRuntime, updateTowerOffenseRuntime } from '../engine/combatOffenseRuntime.js';
import { updateEnemyBehaviorRuntime } from '../engine/enemyBehaviorRuntime.js';
import { settleEnemyDefeatRuntime, settlePendingBossRewardRuntime } from '../engine/enemyDefeatRuntime.js';
import {
  getBossEditorBaseTemplate,
  getBossOwnership,
} from '../engine/encounterRuntime.js';
import { applyWaveSpawnPlanRuntime, spawnBossEncounterRuntimeAt, spawnEnemyRuntimeAt } from '../engine/entitySpawnRuntime.js';
import { findOpenEnemySpawnPosition, getBossSummonSpawnCount } from '../engine/bossFlowRules.js';
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

const DRAG_CANCEL_MARGIN = 18;
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

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

  const applyDebugUiResetState = (uiResetState) => {
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
    const nextHud = buildBossHudRuntime({
      enemies: game.current.enemies,
      getPhaseHint: getBossPhaseHint,
      getPhaseTone: getBossPhaseTone,
    });
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
    return spawnEnemyRuntimeAt({ state: game.current, enemyKey, x, y, extras });
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
    const waveStart = startWaveRuntime({
      state: game.current,
      waveNumber,
      applyBossAuthoring: applyDebugBossAuthoring,
    });
    applyWaveStartState(waveStart);
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
    game.current.dragPlacement = createEmptyDragPlacementState();
    setDragTowerId(null);
    setDragEntity(null);
  };

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
    syncHudMoney();
    game.current.towers.push(
      createPlacedTower({
        tower,
        uid: game.current.nextTowerUid++,
        x: commitPlan.worldPoint.x,
        y: commitPlan.worldPoint.y,
      })
    );
    void playCue('tower_place');
    spawnParticle(commitPlan.worldPoint.x, commitPlan.worldPoint.y, tower.color, 15, 60);
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

    game.current.dragPlacement = createTowerDragPlacementState({ towerId, clientX, clientY, touchId });
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
      syncHudMoney();
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
    const nextCatalog = updateTowerBlueprintLevel({ catalog: towerCatalogRef.current, towerId, delta });
    towerCatalogRef.current = nextCatalog;
    setTowerCatalog(nextCatalog);
  };

  const changePlacedTowerLevel = (towerUid, delta) => {
    updatePlacedTowerLevel({ towers: game.current.towers, towerUid, delta });
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

    if (shouldTriggerBossClimaxAccent(boss) && boss.bossState.climaxAccentTimer <= 0) {
      triggerBossClimaxAccent(boss);
      boss.bossState.climaxAccentTimer = getBossClimaxAccentCooldown(boss);
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

    const waveTick = advanceWaveTickRuntime({ state, dt });
    const waveSpawnPlan = createWaveSpawnPlan({
      waveTick,
      camera: state.camera,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });

    const waveSpawnResult = applyWaveSpawnPlanRuntime({ state, spawnPlan: waveSpawnPlan });
    if (waveSpawnResult.bossSpotlightTemplate) {
      showBossSpotlight(waveSpawnResult.bossSpotlightTemplate);
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
