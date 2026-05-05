import BuildBar from '../components/BuildBar';
import GameHud from '../components/GameHud';
import OverlayScreen from '../components/OverlayScreen';
import StatusBanner from '../components/StatusBanner';
import useGeoGuardGame from '../../logic/hooks/useGeoGuardGame';

export default function GameScreen() {
  const {
    canvasRef,
    gameState,
    money,
    health,
    maxHealth,
    time,
    formattedTime,
    selectedTower,
    setSelectedTower,
    waveMsg,
    initGame,
    towerTypes,
  } = useGeoGuardGame();

  return (
    <div className="relative w-full h-screen overflow-hidden select-none touch-none bg-[#f0f4f8] font-sans">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full block" />
      <GameHud gameState={gameState} health={health} maxHealth={maxHealth} money={money} formattedTime={formattedTime} />
      <StatusBanner waveMsg={waveMsg} />
      <BuildBar gameState={gameState} money={money} selectedTower={selectedTower} setSelectedTower={setSelectedTower} towerTypes={towerTypes} />
      <OverlayScreen gameState={gameState} time={time} initGame={initGame} />
    </div>
  );
}