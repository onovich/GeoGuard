const TONE_STYLES = {
  boss: {
    panelClass: 'bg-slate-900/90 text-white border-white/10 shadow-[0_18px_48px_rgba(15,23,42,0.3)]',
    eyebrowClass: 'text-white/55',
    subtitleClass: 'text-white/72',
  },
  phase: {
    panelClass: 'bg-slate-950/88 text-white border-white/12 shadow-[0_18px_48px_rgba(15,23,42,0.36)]',
    eyebrowClass: 'text-amber-200/80',
    subtitleClass: 'text-white/70',
  },
  wave: {
    panelClass: 'bg-white/92 text-slate-800 border-sky-200/80 shadow-[0_18px_40px_rgba(148,163,184,0.24)]',
    eyebrowClass: 'text-sky-600/80',
    subtitleClass: 'text-slate-500',
  },
  system: {
    panelClass: 'bg-white/88 text-slate-800 border-white/70 shadow-[0_14px_32px_rgba(148,163,184,0.2)]',
    eyebrowClass: 'text-slate-500',
    subtitleClass: 'text-slate-500',
  },
};

export default function StatusBanner({ waveMsg }) {
  if (!waveMsg) {
    return null;
  }

  const message = typeof waveMsg === 'string' ? { title: waveMsg, tone: 'system' } : waveMsg;
  const toneStyle = TONE_STYLES[message.tone] ?? TONE_STYLES.system;

  return (
    <div className="absolute top-[19%] left-1/2 z-20 w-[min(92vw,760px)] -translate-x-1/2 pointer-events-none">
      <div
        className={`rounded-3xl border px-5 py-4 backdrop-blur-md ${toneStyle.panelClass}`}
        style={message.accentColor ? { boxShadow: `0 18px 48px ${message.accentColor}33` } : undefined}
      >
        <div className={`text-[11px] font-black tracking-[0.22em] uppercase ${toneStyle.eyebrowClass}`}>
          {message.tone === 'boss' ? 'Encounter' : message.tone === 'phase' ? 'Phase Shift' : message.tone === 'wave' ? 'Wave' : 'Status'}
        </div>
        <div className="mt-1 text-2xl font-black leading-tight">{message.title}</div>
        {message.subtitle ? <div className={`mt-1 text-sm leading-5 ${toneStyle.subtitleClass}`}>{message.subtitle}</div> : null}
      </div>
    </div>
  );
}
