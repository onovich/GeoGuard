import { UI_COPY } from '../../data/gameConfig';

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

        <div className="grid gap-3 md:grid-cols-3">
          {rewardState.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => applyRewardChoice(choice)}
              className="text-left rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:-translate-y-1 transition-all shadow-sm p-4 md:p-4.5 min-h-[160px] md:min-h-[180px]"
            >
              <div className="text-[10px] md:text-xs font-bold tracking-[0.18em] text-slate-400">{choice.type === 'unlock' ? 'NEW TOWER' : 'UPGRADE'}</div>
              <div className="mt-2 text-lg md:text-xl font-black text-slate-800 leading-tight">{choice.title}</div>
              <div className="mt-1.5 text-xs md:text-sm font-semibold text-slate-500">{choice.subtitle}</div>
              <div className="mt-2.5 text-xs md:text-sm leading-5 text-slate-600">{choice.detail}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}