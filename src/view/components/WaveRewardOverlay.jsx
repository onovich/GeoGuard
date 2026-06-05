import { UI_COPY } from '../../data/gameConfig';

const REWARD_TYPE_STYLES = {
  unlock: {
    badge: 'NEW TOWER',
    badgeClass: 'bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/20',
    panelClass: 'border-emerald-200/80 bg-emerald-50/70 hover:border-emerald-300 hover:bg-white',
    glowClass: 'from-emerald-400/18 via-emerald-300/10 to-transparent',
    accentClass: 'bg-emerald-500',
    cta: 'Unlock Blueprint',
  },
  upgrade: {
    badge: 'UPGRADE',
    badgeClass: 'bg-sky-500/12 text-sky-700 ring-1 ring-sky-500/20',
    panelClass: 'border-sky-200/80 bg-sky-50/70 hover:border-sky-300 hover:bg-white',
    glowClass: 'from-sky-400/18 via-sky-300/10 to-transparent',
    accentClass: 'bg-sky-500',
    cta: 'Apply Upgrade',
  },
};

export default function WaveRewardOverlay({ rewardState, applyRewardChoice }) {
  if (!rewardState.active) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-40 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-[24px] bg-white/95 shadow-2xl p-4 md:p-6">
        <div className="text-center mb-4 md:mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] md:text-xs font-bold tracking-[0.25em]">BOSS CLEAR</div>
          <h2 className="mt-3 text-2xl md:text-[28px] font-black text-slate-800">{UI_COPY.rewardTitle}</h2>
          <p className="mt-1.5 text-sm md:text-base text-slate-500 font-medium">{UI_COPY.rewardSubtitle}</p>
        </div>

        <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-100/80 px-4 py-2 text-[11px] font-semibold text-slate-500">
          <span>Choose 1 reward</span>
          <span>{rewardState.choices.length} options ready</span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {rewardState.choices.map((choice, index) => {
            const rewardStyle = REWARD_TYPE_STYLES[choice.type] ?? REWARD_TYPE_STYLES.upgrade;

            return (
            <button
              key={choice.id}
              onClick={() => applyRewardChoice(choice)}
              className={`group relative overflow-hidden text-left rounded-2xl border transition-all shadow-sm p-4 md:p-4.5 min-h-[180px] md:min-h-[200px] hover:-translate-y-1 hover:shadow-lg ${rewardStyle.panelClass}`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${rewardStyle.glowClass} opacity-80 transition-opacity group-hover:opacity-100`}></div>
              <div className={`absolute inset-x-0 top-0 h-1 ${rewardStyle.accentClass}`}></div>

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] md:text-xs font-bold tracking-[0.18em] ${rewardStyle.badgeClass}`}>
                    {rewardStyle.badge}
                  </div>
                  <div className="text-xs font-black tracking-[0.2em] text-slate-300">0{index + 1}</div>
                </div>

                <div className="mt-3 text-lg md:text-xl font-black text-slate-800 leading-tight">{choice.title}</div>
                <div className="mt-1.5 text-xs md:text-sm font-semibold text-slate-500">{choice.subtitle}</div>

                <div className="mt-3 rounded-xl bg-white/78 px-3 py-2.5 text-xs md:text-sm leading-5 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                  {choice.detail}
                </div>

                <div className="mt-auto pt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{rewardStyle.cta}</div>
              </div>
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
