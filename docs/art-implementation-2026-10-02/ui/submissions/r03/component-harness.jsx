import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../../../src/styles/index.css';
import GameHud from '../../../../../src/view/components/GameHud.jsx';
import BuildBar from '../../../../../src/view/components/BuildBar.jsx';
import OverlayScreen from '../../../../../src/view/components/OverlayScreen.jsx';
import PauseOverlay from '../../../../../src/view/components/PauseOverlay.jsx';
import WaveRewardOverlay from '../../../../../src/view/components/WaveRewardOverlay.jsx';
import StatusBanner from '../../../../../src/view/components/StatusBanner.jsx';
import { createInitialTowerCatalog, BOSS_TYPES } from '../../../../../src/data/gameConfig.js';
import { buildTowerAtLevel } from '../../../../../src/logic/engine/towerRules.js';
import { buildRewardOfferPlan, materializeRewardChoices, applyRewardChoiceEffects } from '../../../../../src/logic/engine/rewardRules.js';
import { createBossEncounterRuntime } from '../../../../../src/logic/engine/encounterRuntime.js';
import { buildBossHudRuntime } from '../../../../../src/logic/engine/bossHudRuntime.js';
import { resolveCharacterArtId } from '../../../../../src/view/art/characters/index.js';

const base = createInitialTowerCatalog();
const towers = base.map((tower, i) => buildTowerAtLevel({ ...tower, available: true }, [1, 0, 2, 0, 1, 0, 0, 1, 3][i]));
const allMax = base.map(tower => buildTowerAtLevel({ ...tower, available: true }, 3));
const inputs = {
  'reward-one': { catalog: allMax, waveNumber: 34, money: 80, hp: 100, maxHp: 100, infiniteMoney: false },
  'reward-two': { catalog: allMax, waveNumber: 34, money: 80, hp: 50, maxHp: 100, infiniteMoney: false },
  'reward-three': { catalog: base.map(tower => tower.id === 'FROST' ? { ...tower, available: false } : buildTowerAtLevel({ ...tower, available: true }, tower.id === 'BASIC' ? 0 : 3)), waveNumber: 32, money: 20, hp: 100, maxHp: 100, infiniteMoney: false },
};
const rewards = Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, materializeRewardChoices(input.catalog, buildRewardOfferPlan(input))]));
let uid = 0;
const makeBosses = template => createBossEncounterRuntime({ bossTemplate: template, x: 0, y: 0, allocateEnemyUid: () => ++uid, allocateEncounterUid: () => 1 });
const twins = makeBosses(BOSS_TYPES.TWINS);
twins.forEach((boss, i) => { boss.hp = Math.floor(boss.maxHp * 0.5); boss.currentPhaseIndex = 1; boss.bossState.actionMode = i === 0 ? 'idle' : 'attack'; });
const hive = makeBosses(BOSS_TYPES.HIVE);
hive[0].hp = Math.floor(hive[0].maxHp * 0.5); hive[0].currentPhaseIndex = 1; hive[0].bossState.actionMode = 'recover'; hive[0].damageTakenMultiplier = 1.2;
const survivor = structuredClone(twins[1]); survivor.bossState.partnerFallen = true; survivor.bossState.actionMode = 'recover'; survivor.damageTakenMultiplier = 1.35;
const hud = enemies => buildBossHudRuntime({ enemies }).map(group => ({ ...group, members: group.members.map(member => ({ ...member, artId: resolveCharacterArtId({ domain: 'boss', ...enemies.find(boss => boss.uid === member.id) }) })) }));
const longestBoss = Object.values(BOSS_TYPES).map(template => { const enemies = makeBosses(template); enemies.forEach(boss => { boss.hp = Math.floor(boss.maxHp * 0.2); boss.currentPhaseIndex = 2; boss.bossState.actionMode = 'attack'; }); return hud(enemies); }).sort((a, b) => b.reduce((n, g) => n + g.title.length + g.counterplay.length, 0) - a.reduce((n, g) => n + g.title.length + g.counterplay.length, 0))[0];
const events = [];
window.uiFixtureAudit = { kind: 'actual-React-component-fixture-not-game-loop', events, rewards, inputs: Object.fromEntries(Object.entries(inputs).map(([id, i]) => [id, { wave: i.waveNumber, hp: i.hp, money: i.money, choices: rewards[id].length }])) };

function Harness() {
  const [mode, setMode] = useState('twins');
  const [dragTowerId, setDragTowerId] = useState(null);
  const [paused, setPaused] = useState(false);
  const [topInset, setTopInset] = useState(64);
  const [audioSettings, setAudio] = useState({ enabled: true, volume: 0.6 });
  const gameState = mode === 'start' ? 'START' : mode === 'end' ? 'GAMEOVER' : 'PLAYING';
  useEffect(() => {
    window.setUiFixture = value => { setMode(value); setPaused(value === 'pause'); setDragTowerId(null); };
    const clear = () => setDragTowerId(null);
    window.addEventListener('mouseup', clear);
    return () => window.removeEventListener('mouseup', clear);
  }, []);
  return <div className="relative h-screen w-full overflow-hidden bg-[#FFF9EF]">
    <GameHud gameState={gameState} paused={paused} togglePause={() => setPaused(value => !value)} health={62} maxHealth={100} money={18} currentWave={27} formattedTime="16:20" bossHud={mode === 'long-boss' ? longestBoss : mode === 'single' ? hud(hive) : mode === 'survivor' ? hud([survivor]) : hud(twins)} audioSettings={audioSettings}
      setAudioEnabled={enabled => { events.push({ type: 'audio-enabled', enabled }); setAudio(value => ({ ...value, enabled })); }} setAudioVolume={volume => { events.push({ type: 'audio-volume', volume }); setAudio(value => ({ ...value, volume })); }} onLayout={({ bottom }) => setTopInset(value => value === bottom + 8 ? value : bottom + 8)} />
    <BuildBar gameState={gameState} money={18} dragTowerId={dragTowerId} towerTypes={towers} setBuildBarRect={rect => { window.uiFixtureAudit.buildBarRect = rect; }} beginTowerDrag={(id, x, y) => { events.push({ type: 'begin-drag', id, x, y }); setDragTowerId(id); }} openBlueprintContextMenu={(id, x, y) => events.push({ type: 'context', id, x, y })} />
    <StatusBanner waveMsg={mode === 'status' ? { title: 'Boss 出现', tone: 'boss' } : null} topInset={topInset} />
    <OverlayScreen gameState={gameState} time={980} currentWave={27} initGame={() => { events.push({ type: 'init' }); setMode('twins'); }} />
    <PauseOverlay visible={paused} onResume={() => { events.push({ type: 'resume' }); setPaused(false); }} />
    <WaveRewardOverlay rewardState={{ active: Boolean(rewards[mode]), choices: rewards[mode] ?? [] }} applyRewardChoice={choice => {
      events.push({ type: 'reward', id: choice.id, result: applyRewardChoiceEffects({ ...inputs[mode], choice }) }); setMode('twins');
    }} />
  </div>;
}
createRoot(document.getElementById('root')).render(<Harness />);
