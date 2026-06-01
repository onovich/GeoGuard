import BuildBar from '../components/BuildBar';
import DebugSpawnPanel from '../components/DebugSpawnPanel';
import GameHud from '../components/GameHud';
import OverlayScreen from '../components/OverlayScreen';
import StatusBanner from '../components/StatusBanner';
import TowerContextMenu from '../components/TowerContextMenu';
import WaveRewardOverlay from '../components/WaveRewardOverlay';
import useGeoGuardGame from '../../logic/hooks/useGeoGuardGame';

export default function GameScreen() {
  const {
    canvasRef,
    gameState,
    money,
    health,
    maxHealth,
    time,
    currentWave,
    formattedTime,
    waveMsg,
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
    debugOptions,
    setDebugOption,
    openBlueprintContextMenu,
    towerContextMenu,
    applyTowerContextAction,
    closeTowerContextMenu,
  } = useGeoGuardGame();

  return (
    <div className="relative w-full h-screen overflow-hidden select-none touch-none bg-[#f0f4f8] font-sans">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full block" />
      <GameHud gameState={gameState} health={health} maxHealth={maxHealth} money={money} formattedTime={formattedTime} currentWave={currentWave} debugMode={debugMode} />
      <StatusBanner waveMsg={waveMsg} />
      <DebugSpawnPanel debugMode={debugMode} debugOptions={debugOptions} setDebugOption={setDebugOption} enemyTypes={enemyTypes} bossTypes={bossTypes} dragEntity={dragEntity} beginDebugEntityDrag={beginDebugEntityDrag} setDebugPanelRect={setDebugPanelRect} />
      <BuildBar gameState={gameState} money={money} dragTowerId={dragTowerId} beginTowerDrag={beginTowerDrag} towerTypes={towerTypes} setBuildBarRect={setBuildBarRect} openBlueprintContextMenu={openBlueprintContextMenu} />
      <TowerContextMenu menu={towerContextMenu} applyTowerContextAction={applyTowerContextAction} closeTowerContextMenu={closeTowerContextMenu} />
      <WaveRewardOverlay rewardState={rewardState} applyRewardChoice={applyRewardChoice} />
      <OverlayScreen gameState={gameState} time={time} initGame={initGame} />
    </div>
  );
}
