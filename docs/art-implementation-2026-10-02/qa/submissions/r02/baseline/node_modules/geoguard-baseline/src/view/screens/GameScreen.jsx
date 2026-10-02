import BuildBar from '../components/BuildBar';
import DebugSpawnPanel from '../components/DebugSpawnPanel';
import GameHud from '../components/GameHud';
import OverlayScreen from '../components/OverlayScreen';
import PlaytestExport from '../components/PlaytestExport';
import StatusBanner from '../components/StatusBanner';
import TowerContextMenu from '../components/TowerContextMenu';
import WaveRewardOverlay from '../components/WaveRewardOverlay';
import useGeoGuardGame from '../../logic/hooks/useGeoGuardGame';
import { Button, Panel } from '../components/ui.jsx';

export default function GameScreen() {
  const {
    canvasRef,
    exportPlaytest,
    closePlaytestExport,
    exportPreviousPlaytest,
    gameState,
    paused,
    togglePause,
    money,
    health,
    maxHealth,
    time,
    currentWave,
    waveOverview,
    formattedTime,
    waveMsg,
    bossHud,
    audioSettings,
    initGame,
    towerTypes,
    enemyTypes,
    bossTypes,
    beginTowerDrag,
    beginDebugEntityDrag,
    dragTowerId,
    dragEntity,
    rewardState,
    applyRewardChoice,
    setBuildBarRect,
    setDebugPanelRect,
    debugMode,
    debugWaveFlow,
    debugOptions,
    setDebugOption,
    setAudioEnabled,
    setAudioVolume,
    debugWaveCheckpoints,
    waveTable,
    startDebugWave,
    clearDebugField,
    openDebugReward,
    unlockAllBlueprints,
    applyDebugLayout,
    forceBossPhase,
    bossEditor,
    openBlueprintContextMenu,
    towerContextMenu,
    applyTowerContextAction,
    closeTowerContextMenu,
  } = useGeoGuardGame();

  return (
    <div className="relative w-full h-screen overflow-hidden select-none touch-none bg-[#f0f4f8] font-sans">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full block" />
      <GameHud
        gameState={gameState}
        paused={paused}
        togglePause={togglePause}
        health={health}
        maxHealth={maxHealth}
        money={money}
        formattedTime={formattedTime}
        currentWave={currentWave}
        waveOverview={waveOverview}
        debugMode={debugMode}
        bossHud={bossHud}
        audioSettings={audioSettings}
        setAudioEnabled={setAudioEnabled}
        setAudioVolume={setAudioVolume}
      />
      <StatusBanner waveMsg={waveMsg} />
      <DebugSpawnPanel
        debugMode={debugMode}
        debugWaveFlow={debugWaveFlow}
        debugOptions={debugOptions}
        setDebugOption={setDebugOption}
        enemyTypes={enemyTypes}
        bossTypes={bossTypes}
        dragEntity={dragEntity}
        beginDebugEntityDrag={beginDebugEntityDrag}
        setDebugPanelRect={setDebugPanelRect}
        currentWave={currentWave}
        waveOverview={waveOverview}
        debugWaveCheckpoints={debugWaveCheckpoints}
        waveTable={waveTable}
        startDebugWave={startDebugWave}
        clearDebugField={clearDebugField}
        openDebugReward={openDebugReward}
        unlockAllBlueprints={unlockAllBlueprints}
        applyDebugLayout={applyDebugLayout}
        forceBossPhase={forceBossPhase}
        bossEditor={bossEditor}
      />
      <BuildBar gameState={gameState} money={money} dragTowerId={dragTowerId} beginTowerDrag={beginTowerDrag} towerTypes={towerTypes} setBuildBarRect={setBuildBarRect} openBlueprintContextMenu={openBlueprintContextMenu} />
      <TowerContextMenu menu={towerContextMenu} applyTowerContextAction={applyTowerContextAction} closeTowerContextMenu={closeTowerContextMenu} />
      <WaveRewardOverlay rewardState={rewardState} applyRewardChoice={applyRewardChoice} />
      <OverlayScreen gameState={gameState} time={time} currentWave={currentWave} initGame={initGame} />
      <PlaytestExport gameState={gameState} exportPlaytest={exportPlaytest} closePlaytestExport={closePlaytestExport} exportPreviousPlaytest={exportPreviousPlaytest} />
      {paused && gameState === 'PLAYING' && !rewardState.active && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <Panel variant="modalPanel" className="mx-4 w-full max-w-sm p-6 text-center">
            <h2 className="mb-2 text-2xl font-black text-slate-800">游戏已暂停</h2>
            <p className="mb-5 text-sm text-slate-500">准备好后继续，按 Esc 也可恢复。</p>
            <Button onClick={togglePause} variant="blue" size="lg" className="w-full">继续游戏</Button>
          </Panel>
        </div>
      )}
    </div>
  );
}
