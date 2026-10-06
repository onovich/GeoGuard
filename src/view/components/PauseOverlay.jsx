import { useRef } from 'react';
import { playerUi } from '../designSystem.js';
import { Button, Panel, StickerSymbol, OriginalKeycap, useModalFocus } from './ui.jsx';

export default function PauseOverlay({ visible, onResume }) {
  const ref = useRef(null);
  useModalFocus(ref, visible);
  if (!visible) return null;
  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 ${playerUi.backdrop}`} style={playerUi.fontStyle}>
      <Panel ref={ref} variant="stickerModal" role="dialog" aria-modal="true" aria-labelledby="pause-overlay-title" className="my-auto w-full max-w-[420px] px-9 py-9 text-center">
        <StickerSymbol kind="leafLogo" className="mx-auto mb-4 h-12 w-12" />
        <h2 id="pause-overlay-title" className="mb-3 text-[28px] font-extrabold">游戏已暂停</h2>
        <p className="mb-7 text-base leading-7">准备好后继续，按 <OriginalKeycap>Esc</OriginalKeycap> 也可恢复。</p>
        <Button variant="stickerSage" size="stickerLg" onClick={onResume} className="w-full rounded-full">继续游戏</Button>
      </Panel>
    </div>
  );
}
