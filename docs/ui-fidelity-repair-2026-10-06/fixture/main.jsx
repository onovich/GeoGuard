import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '/src/styles/index.css';
import GameHud from '/src/view/components/GameHud.jsx';
import BuildBar from '/src/view/components/BuildBar.jsx';
import StatusBanner from '/src/view/components/StatusBanner.jsx';
import OverlayScreen from '/src/view/components/OverlayScreen.jsx';
import PauseOverlay from '/src/view/components/PauseOverlay.jsx';
import WaveRewardOverlay from '/src/view/components/WaveRewardOverlay.jsx';
import { createInitialTowerCatalog, BOSS_TYPES } from '/src/data/gameConfig.js';
import { buildTowerAtLevel } from '/src/logic/engine/towerRules.js';
import { buildRewardOfferPlan, materializeRewardChoices } from '/src/logic/engine/rewardRules.js';
import { createBossEncounterRuntime } from '/src/logic/engine/encounterRuntime.js';
import { buildBossHudRuntime } from '/src/logic/engine/bossHudRuntime.js';
import { addBossHudArtIds } from '/src/view/art/contracts.js';

const cases = ['普通三塔', '九塔不足', '方阵司令', '最长单Boss', '双子', '幸存者', '开始', '暂停', '结束', '三同类奖', '末级链锯奖', '混合三奖', '两奖', '单奖', '波次Banner', '阶段Banner', 'BossBanner'];
const initial = new URLSearchParams(location.search).get('case') || cases[0];
const base = createInitialTowerCatalog();
const all = base.map((tower, i) => buildTowerAtLevel({ ...tower, available: true }, i % 4));
const full = base.map(tower => buildTowerAtLevel({ ...tower, available: true }, 3));
const rewardData = mode => {
  let catalog = base.map(t => ({ ...t, available: true }));
  let hp = 100, money = 100, waveNumber = 1;
  if (mode === '混合三奖') { catalog = full.map(t => t.id === 'FROST' ? { ...t, available: false } : t.id === 'BASIC' ? buildTowerAtLevel(t, 0) : t); money = 20; waveNumber = 32; }
  if (mode === '末级链锯奖') { catalog = full.map(t => t.id === 'RAPID' ? buildTowerAtLevel(t, 2) : t); }
  if (mode === '两奖' || mode === '单奖') { catalog = full; waveNumber = 34; money = 80; hp = mode === '两奖' ? 50 : 100; }
  return { catalog, choices: materializeRewardChoices(catalog, buildRewardOfferPlan({ catalog, waveNumber, money, hp, maxHp: 100, infiniteMoney: false })) };
};
const bossGroups = mode => {
  const longest = Object.values(BOSS_TYPES).filter(t => !/_T/.test(t.id)).sort((a,b) => b.name.length - a.name.length)[0];
  const template = mode === '最长单Boss' ? longest : mode === '双子' || mode === '幸存者' ? BOSS_TYPES.TWINS : BOSS_TYPES.COMMANDER;
  let uid = 1;
  let enemies = createBossEncounterRuntime({ bossTemplate: template, x: 0, y: 0, allocateEnemyUid: () => uid++, allocateEncounterUid: () => 1 });
  enemies.forEach((b,i) => { b.hp = b.maxHp * (0.42 + i * 0.18); b.currentPhaseIndex = 1; b.bossState.actionMode = i ? 'recover' : 'windup'; b.bossState.guardCount = mode === '方阵司令' ? 4 : 0; });
  if (mode === '幸存者') { enemies = enemies.slice(1); enemies[0].bossState.partnerFallen = true; }
  return addBossHudArtIds(buildBossHudRuntime({ enemies }), enemies);
};
function Fixture() {
  const [mode, setMode] = useState(initial), [toolbar, setToolbar] = useState(true);
  const [drag, setDrag] = useState(null), [bannerTop, setBannerTop] = useState(70), [last, setLast] = useState('');
  const [audio, setAudio] = useState({ enabled: true, volume: 0.6 });
  useEffect(() => { const clear = () => setDrag(null); window.addEventListener('mouseup', clear); const keys = e => { if (e.key === 'Escape') {setMode('普通三塔');setDrag(null);} }; window.addEventListener('keydown', keys); return () => {window.removeEventListener('mouseup',clear);window.removeEventListener('keydown',keys);}; }, []);
  const choose = next => { setMode(next); setDrag(null); setLast(''); history.replaceState(null, '', `?case=${encodeURIComponent(next)}`); };
  const gameState = mode === '开始' ? 'START' : mode === '结束' ? 'END' : 'PLAYING';
  const reward = ['三同类奖','末级链锯奖','混合三奖','两奖','单奖'].includes(mode);
  const currentRewards = rewardData(mode);
  const boss = ['方阵司令','最长单Boss','双子','幸存者'].includes(mode) ? bossGroups(mode) : [];
  const waveMsg = mode.endsWith('Banner') ? { title: mode === '波次Banner' ? '波次来袭 27' : mode === '阶段Banner' ? '阶段切换：日蚀' : 'Boss 出现 · 昼夜双子', tone: mode === '波次Banner' ? 'wave' : mode === '阶段Banner' ? 'phase' : 'boss' } : null;
  return <div style={{ position:'relative',width:'100vw',height:'100vh',overflow:'hidden',background:'#FFF9EF',color:'#4B281C' }}>
    <GameHud gameState={gameState} paused={mode === '暂停'} togglePause={() => choose(mode === '暂停' ? '普通三塔' : '暂停')} health={62} maxHealth={100} money={mode === '九塔不足' ? 8 : 60} formattedTime="06:10" currentWave={27} debugMode={false} bossHud={boss} audioSettings={audio} setAudioEnabled={enabled => setAudio(p => ({...p,enabled}))} setAudioVolume={volume => setAudio(p => ({...p,volume}))} onLayout={({bottom}) => setBannerTop(bottom + 8)} />
    <BuildBar gameState={gameState} money={mode === '九塔不足' ? 8 : 60} dragTowerId={drag} beginTowerDrag={id => setDrag(id)} towerTypes={mode === '普通三塔' ? base.filter(t=>t.available) : all} setBuildBarRect={()=>{}} openBlueprintContextMenu={id=>setLast(`上下文事件 ${id}（fixture 不模拟菜单）`)} />
    <StatusBanner waveMsg={waveMsg} topInset={bannerTop} />
    <OverlayScreen gameState={gameState} time={370} currentWave={27} initGame={()=>choose('普通三塔')} />
    <PauseOverlay visible={mode === '暂停'} onResume={()=>choose('普通三塔')} />
    <WaveRewardOverlay rewardState={{active:reward,choices:reward ? currentRewards.choices : []}} towerTypes={currentRewards.catalog} applyRewardChoice={choice=>{choose('普通三塔');setLast(`choice 回调 ${choice.id}（未模拟经济或波次）`);}} />
    <button style={{position:'absolute',left:4,bottom:2,zIndex:100,fontSize:11,background:'#FFF9EF',border:'1px solid #4B281C',padding:'2px 5px'}} onClick={()=>setToolbar(!toolbar)}>组件检查 {toolbar ? '收起' : '展开'}</button>
    {toolbar ? <aside style={{position:'absolute',left:8,top:'35%',zIndex:100,width:200,background:'#FFF9EF',border:'1px dashed #4B281C',borderRadius:8,padding:8,fontSize:12}}><strong>临时组件 Fixture · 非游戏实机</strong><p>生产组件 + 真数据/规则；无AI、无world。截图前收起此框。</p><div style={{display:'flex',flexWrap:'wrap',gap:4}}>{cases.map(c=><button key={c} onClick={()=>choose(c)} style={{border:'1px solid #4B281C',padding:'4px',background:mode===c?'#B6D4AE':'#FFF9EF'}}>{c}</button>)}</div><p>{last}</p></aside> : null}
  </div>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
