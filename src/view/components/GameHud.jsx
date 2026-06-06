export default function GameHud({
  gameState,
  health,
  maxHealth,
  money,
  formattedTime,
  currentWave,
  waveOverview,
  debugMode,
  bossHud = [],
  audioSettings,
  setAudioEnabled,
  setAudioVolume,
}) {
  if (gameState !== 'PLAYING') {
    return null;
  }

  return (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
      <div className="flex flex-col gap-1 w-32 md:w-48 bg-white/80 p-2 rounded-xl shadow-sm backdrop-blur-sm pointer-events-auto">
        <div className="flex justify-between text-sm font-bold text-gray-700">
          <span>HP</span>
          <span>
            {health}/{maxHealth}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 transition-all duration-200" style={{ width: `${(health / maxHealth) * 100}%` }}></div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 min-w-[220px]">
        <div className="flex flex-col items-center text-slate-700 bg-white/80 px-6 py-2 rounded-2xl shadow-sm backdrop-blur-sm min-w-[130px]">
          <span className="text-xs font-bold tracking-[0.2em] text-slate-400">{debugMode ? 'TEST FIELD' : `WAVE ${currentWave}`}</span>
          <span className="text-2xl font-black">{formattedTime}</span>
          {waveOverview?.label ? (
            <div className="mt-1 text-center">
              <div className="text-[11px] font-bold text-slate-600">{waveOverview.label}</div>
              {waveOverview.focus ? <div className="text-[10px] leading-4 text-slate-500 max-w-[240px]">{waveOverview.focus}</div> : null}
            </div>
          ) : null}
        </div>
        {bossHud.length > 0 ? (
          <div className="w-[260px] md:w-[340px] bg-slate-900/78 text-white px-3 py-2 rounded-2xl shadow-lg backdrop-blur-sm">
            {bossHud.map((group) => (
              <div key={group.id} className="mb-2 last:mb-0">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-300 mb-1">
                  <span>{group.title}</span>
                  <span>{group.members.length > 1 ? 'ENCOUNTER' : 'BOSS'}</span>
                </div>
                {group.summary ? <div className="mb-1.5 text-[11px] leading-4 text-slate-300">{group.summary}</div> : null}
                {group.threats?.length ? (
                  <div className="mb-1.5 flex flex-wrap gap-1">
                    {group.threats.map((threat) => (
                      <span
                        key={`${group.id}-${threat}`}
                        className="rounded-md border border-white/12 bg-white/6 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-200"
                      >
                        {threat}
                      </span>
                    ))}
                  </div>
                ) : null}
                {group.counterplay ? <div className="mb-1.5 text-[10px] leading-4 text-slate-400">Counter: {group.counterplay}</div> : null}
                <div className="flex flex-col gap-1.5">
                  {group.members.map((member) => {
                    const phaseIndex = member.phaseIndex ?? 0;
                    const phaseCount = member.phaseCount ?? 0;
                    const phaseLabel = member.enraged ? `${member.phase} · ENRAGED` : member.phase;
                    const phaseTone = member.phaseTone ?? member.color;

                    return (
                      <div key={member.id}>
                        <div className="flex items-center justify-between text-xs text-slate-100 mb-1">
                          <span>{member.name}</span>
                          <span className={member.enraged ? 'text-amber-300' : 'text-slate-300'}>{phaseLabel}</span>
                        </div>
                        {phaseCount > 0 ? (
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: phaseCount }).map((_, index) => (
                                <span
                                  key={`${member.id}-phase-${index}`}
                                  className="block h-1.5 w-5 rounded-full transition-all duration-150"
                                  style={{
                                    backgroundColor: index <= phaseIndex ? member.color : 'rgba(255,255,255,0.12)',
                                    opacity: index === phaseIndex ? 1 : index < phaseIndex ? 0.58 : 1,
                                  }}
                                ></span>
                              ))}
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                              P{Math.min(phaseCount, phaseIndex + 1)}/{phaseCount}
                            </span>
                          </div>
                        ) : null}
                        {member.phaseHint ? (
                          <div
                            className="mb-1 inline-flex max-w-full rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.14em]"
                            style={{
                              color: phaseTone,
                              borderColor: `${phaseTone}55`,
                              backgroundColor: `${phaseTone}14`,
                            }}
                          >
                            {member.phaseHint}
                          </div>
                        ) : null}
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-150" style={{ width: `${member.hpRatio * 100}%`, backgroundColor: member.color }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-xl shadow-sm backdrop-blur-sm">
          <div className="w-4 h-4 bg-emerald-400 rotate-45 rounded-sm shadow-inner"></div>
          <span className="text-xl font-bold text-slate-700">{money}</span>
        </div>

        <div className="min-w-[188px] rounded-xl bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Audio</span>
            <button
              onClick={() => setAudioEnabled(!audioSettings.enabled)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                audioSettings.enabled ? 'bg-slate-900 text-white hover:bg-slate-950' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {audioSettings.enabled ? 'Sound On' : 'Muted'}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audioSettings.volume}
              onChange={(event) => setAudioVolume(Number(event.target.value))}
              className="w-full accent-slate-800"
            />
            <span className="w-10 text-right text-xs font-bold text-slate-500">{Math.round(audioSettings.volume * 100)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
