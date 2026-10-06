import { cx, playerUi } from '../designSystem.js';
import { Panel, StickerSymbol } from './ui.jsx';

const tones = { boss: { surface: '#F4ADA0', symbol: 'boss' }, phase: { surface: '#F8DDAA', symbol: 'phase' }, wave: { surface: '#B6D4AE', symbol: 'wave' }, system: { surface: '#FFF9EF', symbol: 'leafLogo' } };

export default function StatusBanner({ waveMsg, topInset }) {
  if (!waveMsg) return null;
  const message = typeof waveMsg === 'string' ? { title: waveMsg, tone: 'system' } : waveMsg;
  const tone = tones[message.tone] ?? tones.system;
  return (
    <div role="status" className="pointer-events-none absolute left-1/2 z-20 w-max max-w-[min(92vw,480px)] -translate-x-1/2" style={{ ...playerUi.fontStyle, top: Number.isFinite(topInset) ? topInset : '13%' }}>
      <Panel variant="stickerPanel" style={{ borderColor: '#4B281C70' }} className={cx('flex items-center gap-2 px-3 py-1.5 text-base font-extrabold leading-6')}>
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center"><StickerSymbol kind={tone.symbol} className="h-6 w-6" /></span>
        <span>{message.title}</span>
      </Panel>
    </div>
  );
}
