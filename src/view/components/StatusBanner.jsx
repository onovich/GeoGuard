const TONE_STYLES = {
  boss: {
    panelClass: 'bg-slate-900/90 text-white border-white/10 shadow-[0_18px_48px_rgba(15,23,42,0.3)]',
    eyebrowClass: 'text-white/55',
    subtitleClass: 'text-white/72',
    chipClass: 'bg-white/10 text-white/85 ring-1 ring-white/10',
  },
  phase: {
    panelClass: 'bg-slate-950/88 text-white border-white/12 shadow-[0_18px_48px_rgba(15,23,42,0.36)]',
    eyebrowClass: 'text-amber-200/80',
    subtitleClass: 'text-white/70',
    chipClass: 'bg-amber-300/14 text-amber-100 ring-1 ring-amber-200/20',
  },
  wave: {
    panelClass: 'bg-white/92 text-slate-800 border-sky-200/80 shadow-[0_18px_40px_rgba(148,163,184,0.24)]',
    eyebrowClass: 'text-sky-600/80',
    subtitleClass: 'text-slate-500',
    chipClass: 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/12',
  },
  system: {
    panelClass: 'bg-white/88 text-slate-800 border-white/70 shadow-[0_14px_32px_rgba(148,163,184,0.2)]',
    eyebrowClass: 'text-slate-500',
    subtitleClass: 'text-slate-500',
    chipClass: 'bg-slate-900/5 text-slate-600 ring-1 ring-slate-900/8',
  },
};

const TONE_META = {
  boss: { label: 'Encounter', short: 'B' },
  phase: { label: 'Phase Shift', short: 'P' },
  wave: { label: 'Wave', short: 'W' },
  system: { label: 'Status', short: 'i' },
};

export default function StatusBanner({ waveMsg }) {
  if (!waveMsg) {
    return null;
  }

  const message = typeof waveMsg === 'string' ? { title: waveMsg, tone: 'system' } : waveMsg;
  const toneStyle = TONE_STYLES[message.tone] ?? TONE_STYLES.system;
  const toneMeta = TONE_META[message.tone] ?? TONE_META.system;

  return (
    <div className="absolute top-[13%] left-1/2 z-20 w-[min(92vw,760px)] -translate-x-1/2 pointer-events-none">
      <div
        className={`relative overflow-hidden rounded-3xl border px-5 py-4 backdrop-blur-md ${toneStyle.panelClass}`}
        style={message.accentColor ? { boxShadow: `0 18px 48px ${message.accentColor}33` } : undefined}
      >
        {message.accentColor ? <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: message.accentColor }}></div> : null}
        <div className="relative pl-1">
          <div className="mt-1 text-2xl font-black leading-tight">{message.title}</div>
        </div>
      </div>
    </div>
  );
}
