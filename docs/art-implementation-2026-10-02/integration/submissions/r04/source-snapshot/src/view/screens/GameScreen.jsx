import { useCallback, useState } from 'react';
import BuildBar from '../components/BuildBar';
import DebugSpawnPanel from '../components/DebugSpawnPanel';
import GameHud from '../components/GameHud';
import OverlayScreen from '../components/OverlayScreen';
import PlaytestExport from '../components/PlaytestExport';
import StatusBanner from '../components/StatusBanner';
import TowerContextMenu from '../components/TowerContextMenu';
import WaveRewardOverlay from '../components/WaveRewardOverlay';
import PauseOverlay from '../components/PauseOverlay.jsx';
import useGeoGuardGame from '../../logic/hooks/useGeoGuardGame';

export default function GameScreen() {
  const [hudBottom, setHudBottom] = useState(64);
  const handleHudLayout = useCallback(({ bottom }) => {
    if (Number.isFinite(bottom)) setHudBottom(previous => Math.abs(previous - bottom) > 0.5 ? bottom : previous);
  }, []);
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
    <div className="relative w-full h-screen overflow-hidden select-none touch-none bg-[#FFF9EF] font-sans">
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
        onLayout={handleHudLayout}
      />
      <StatusBanner waveMsg={waveMsg} topInset={hudBottom + 8} />
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
      <PauseOverlay visible={paused && gameState === 'PLAYING' && !rewardState.active} onResume={togglePause} />
    </div>
  );
}
