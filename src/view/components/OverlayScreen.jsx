import { UI_COPY } from '../../data/gameConfig';
import { Button, Panel } from './ui.jsx';

export default function OverlayScreen({ gameState, time, initGame }) {
  if (gameState === 'PLAYING') {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <Panel variant="modalPanel" className="p-8 text-center max-w-sm w-full mx-4 transform transition-all">
        <h1 className="text-4xl font-black text-slate-800 mb-2">{gameState === 'START' ? UI_COPY.startTitle : UI_COPY.gameOverTitle}</h1>
        <p className="text-slate-500 mb-8 font-medium">
          {gameState === 'START' ? UI_COPY.startDescription : `你生存了 ${Math.floor(time / 60)}分${time % 60}秒`}
        </p>

        <Button onClick={initGame} variant="blue" size="lg" className="w-full py-4 text-lg hover:-translate-y-1">
          {gameState === 'START' ? '开始游戏' : '重新挑战'}
        </Button>

        {gameState === 'START' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
          <Button onClick={() => initGame({ debug: true })} variant="primary" size="lg" className="mt-3 w-full py-3 text-base shadow-md hover:shadow-lg hover:-translate-y-0.5">
            开发测试入口
          </Button>
        )}
      </Panel>
    </div>
  );
}
