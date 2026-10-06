import { useRef } from 'react';
import { UI_COPY } from '../../data/gameConfig';
import { playerUi } from '../designSystem.js';
import { Button, Panel, StickerSymbol, OriginalArt, useModalFocus } from './ui.jsx';

export default function OverlayScreen({ gameState, time, currentWave, initGame }) {
  const ref = useRef(null);
  const visible = gameState !== 'PLAYING';
  useModalFocus(ref, visible);
  if (!visible) return null;
  const start = gameState === 'START';

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 ${playerUi.backdrop}`} style={playerUi.fontStyle}>
      <Panel ref={ref} variant="stickerModal" role="dialog" aria-modal="true" aria-labelledby="game-overlay-title" className="relative my-auto w-full max-w-[480px] overflow-hidden px-10 py-10 text-center">
        <StickerSymbol kind={start ? 'leafLogo' : 'shattered'} className="mx-auto mb-5 h-20 w-20" />
        <h1 id="game-overlay-title"><span className="sr-only">{start ? UI_COPY.startTitle : UI_COPY.gameOverTitle}</span><OriginalArt id={start ? 'title-start' : 'title-end'} className="mx-auto h-auto w-[300px] max-w-full" /></h1>
        <div aria-hidden="true" className="mx-auto my-5 flex max-w-[260px] items-center gap-4"><OriginalArt id="divider" className="h-auto min-w-0 flex-1" />{start ? <StickerSymbol kind="gem" className="h-7 w-7" /> : null}<OriginalArt id="divider" className="h-auto min-w-0 flex-1" /></div>
        <p className="mx-auto mb-7 max-w-[330px] text-base leading-7">{start ? UI_COPY.startDescription : `到达第 ${currentWave} 波 · 战斗 ${Math.floor(time / 60)}分${Math.floor(time % 60)}秒`}</p>
        <Button onClick={initGame} variant={start ? 'stickerSage' : 'stickerCoral'} size="stickerLg" className="w-full rounded-full">{start ? '开始游戏' : '重新挑战'}</Button>
        {start && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? (
          <Button onClick={() => initGame({ debug: true })} variant="stickerQuiet" size="stickerMd" className="mt-3 w-full">开发测试入口</Button>
        ) : null}
      </Panel>
    </div>
  );
}
