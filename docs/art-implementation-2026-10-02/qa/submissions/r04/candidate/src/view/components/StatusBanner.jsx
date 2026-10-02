import { cx, playerUi } from '../designSystem.js';
import { Panel } from './ui.jsx';

const tones = { boss: 'bg-[#F9E4DC]', phase: 'bg-[#F8E8C8]', wave: 'bg-[#E6F0F4]', system: 'bg-[#FFF9EF]' };

export default function StatusBanner({ waveMsg, topInset }) {
  if (!waveMsg) return null;
  const message = typeof waveMsg === 'string' ? { title: waveMsg, tone: 'system' } : waveMsg;
  return (
    <div role="status" className="pointer-events-none absolute left-1/2 z-20 w-[min(92vw,540px)] -translate-x-1/2" style={{ ...playerUi.fontStyle, top: Number.isFinite(topInset) ? topInset : '13%' }}>
      <Panel variant="stickerPanel" className={cx('px-4 py-2 text-center text-lg font-extrabold leading-6', tones[message.tone] ?? tones.system)}>
        {message.title}
      </Panel>
    </div>
  );
}
