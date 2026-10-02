import { useRef } from 'react';
import { UI_COPY } from '../../data/gameConfig';
import { playerUi } from '../designSystem.js';
import { Button, Panel, StickerSymbol, useModalFocus } from './ui.jsx';

export default function OverlayScreen({ gameState, time, currentWave, initGame }) {
  const ref = useRef(null);
  const visible = gameState !== 'PLAYING';
  useModalFocus(ref, visible);
  if (!visible) return null;
  const start = gameState === 'START';

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 ${playerUi.backdrop}`} style={playerUi.fontStyle}>
      <Panel ref={ref} variant="stickerModal" role="dialog" aria-modal="true" aria-labelledby="game-overlay-title" className="my-auto w-full max-w-sm px-7 py-8 text-center">
        <StickerSymbol kind={start ? 'blueprint' : 'heart'} className="mx-auto mb-4 h-16 w-16" />
        <h1 id="game-overlay-title" className="mb-3 text-3xl font-extrabold leading-tight">{start ? UI_COPY.startTitle : UI_COPY.gameOverTitle}</h1>
        <p className="mb-7 text-sm leading-6">{start ? UI_COPY.startDescription : `到达第 ${currentWave} 波 · 战斗 ${Math.floor(time / 60)}分${time % 60}秒`}</p>
        <Button onClick={initGame} variant="stickerPrimary" size="lg" className="w-full text-lg">{start ? '开始游戏' : '重新挑战'}</Button>
        {start && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? (
          <Button onClick={() => initGame({ debug: true })} variant="primary" size="lg" className="mt-3 w-full text-base">开发测试入口</Button>
        ) : null}
      </Panel>
    </div>
  );
}
