import { UI_COPY } from '../../data/gameConfig';

export default function WaveRewardOverlay({ rewardState, applyRewardChoice }) {
  if (!rewardState.active) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-40 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-4xl rounded-[28px] bg-white/95 shadow-2xl p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold tracking-[0.3em]">BOSS CLEAR</div>
          <h2 className="mt-4 text-3xl font-black text-slate-800">{UI_COPY.rewardTitle}</h2>
          <p className="mt-2 text-slate-500 font-medium">{UI_COPY.rewardSubtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {rewardState.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => applyRewardChoice(choice)}
              className="text-left rounded-3xl border border-slate-200 bg-slate-50 hover:bg-white hover:-translate-y-1 transition-all shadow-sm p-5"
            >
              <div className="text-xs font-bold tracking-[0.2em] text-slate-400">{choice.type === 'unlock' ? 'NEW TOWER' : 'UPGRADE'}</div>
              <div className="mt-2 text-xl font-black text-slate-800">{choice.title}</div>
              <div className="mt-2 text-sm font-semibold text-slate-500">{choice.subtitle}</div>
              <div className="mt-3 text-sm leading-6 text-slate-600">{choice.detail}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}