import { UI_COPY } from '../../data/gameConfig';

export default function OverlayScreen({ gameState, time, initGame }) {
  if (gameState === 'PLAYING') {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full mx-4 transform transition-all">
        <h1 className="text-4xl font-black text-slate-800 mb-2">{gameState === 'START' ? UI_COPY.startTitle : UI_COPY.gameOverTitle}</h1>
        <p className="text-slate-500 mb-8 font-medium">
          {gameState === 'START' ? UI_COPY.startDescription : `你生存了 ${Math.floor(time / 60)}分${time % 60}秒`}
        </p>

        <button onClick={initGame} className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:translate-y-0">
          {gameState === 'START' ? '开始游戏' : '重新挑战'}
        </button>

        <div className="mt-6 text-xs text-slate-400 text-left bg-slate-50 p-4 rounded-xl">
          <strong>控制说明：</strong>
          <br />
          {'💻 '}{UI_COPY.controlsPc}
          <br />
          {'📱 '}{UI_COPY.controlsMobile}
        </div>
      </div>
    </div>
  );
}