import { useState, useEffect } from 'react';
import { UI_COPY } from '../../data/gameConfig';
import { Button, Panel } from './ui.jsx';

export default function GameHud({
  gameState,
  togglePause,
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
  const [showControlsHint, setShowControlsHint] = useState(true);
  const [hintCountdown, setHintCountdown] = useState(30);
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

  useEffect(() => {
    if (!showControlsHint || gameState !== 'PLAYING' || !isMobile) return;
    if (hintCountdown > 0) {
      const timer = setTimeout(() => setHintCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowControlsHint(false);
    }
  }, [showControlsHint, hintCountdown, gameState, isMobile]);

  if (gameState !== 'PLAYING') {
    return null;
  }

  return (
    <>
      <div className="absolute top-0 left-0 w-full p-2 md:p-4 flex justify-between gap-2 items-start pointer-events-none">
      <Panel variant="hud" className="flex flex-col gap-1 w-24 md:w-48 shrink-0 p-2 pointer-events-auto">
        <div className="flex justify-between text-sm font-bold text-gray-700">
          <span>HP</span>
          <span>
            {health}/{maxHealth}
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 transition-all duration-200" style={{ width: `${(health / maxHealth) * 100}%` }}></div>
        </div>
      </Panel>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
        <Panel variant="hud" className="flex flex-col items-center text-slate-700 px-3 md:px-6 py-2">
          <span className="text-xs font-bold tracking-[0.2em] text-slate-400">{debugMode ? 'TEST FIELD' : `WAVE ${currentWave}`}</span>
          <span className="text-2xl font-black">{formattedTime}</span>
        </Panel>
        {bossHud.length > 0 ? (
          <Panel variant="darkHud" className="absolute top-24 left-1/2 -translate-x-1/2 w-[min(90vw,340px)] px-3 py-1.5">
            {bossHud.map((group) => (
              <div key={group.id} className="mb-1 last:mb-0">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-slate-300 mb-0.5">
                  <span>{group.title}</span>
                </div>
                <p className="mb-1 text-[11px] leading-4 text-slate-300">{group.counterplay}</p>
                <div className="flex flex-col gap-1">
                  {group.members.map((member) => {
                    const phaseIndex = member.phaseIndex ?? 0;
                    const phaseCount = member.phaseCount ?? 0;
                    const phaseLabel = member.enraged ? `${member.phase} · ENRAGED` : member.phase;
                    const phaseTone = member.phaseTone ?? member.color;

                    return (
                      <div key={member.id}>
                        <div className="flex items-center justify-between text-[11px] text-slate-100 mb-0.5">
                          <span>{member.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={member.enraged ? 'text-amber-300 text-[10px]' : 'text-slate-300 text-[10px]'}>{phaseLabel}</span>
                            {phaseCount > 0 && (
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 bg-slate-800/80 px-1 rounded">
                                P{Math.min(phaseCount, phaseIndex + 1)}/{phaseCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-150" style={{ width: `${member.hpRatio * 100}%`, backgroundColor: member.color }}></div>
                        </div>
                        <div className={`mt-0.5 text-[10px] ${member.exposed ? 'text-amber-300' : 'text-slate-300'}`}>{member.actionLabel}{member.guardCount > 0 ? ` · 护卫 ${member.guardCount}` : ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </Panel>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 pointer-events-auto">
        <Panel variant="hud" className="flex items-center gap-2 px-2 md:px-4 py-2">
          <div className="w-4 h-4 bg-emerald-400 rotate-45 rounded-sm shadow-inner"></div>
          <span className="text-xl font-bold text-slate-700">{money}</span>
        </Panel>
        <Button variant="ghost" size="sm" onClick={togglePause} className="bg-white/90">暂停</Button>

      </div>
      </div>
      {showControlsHint && (
        <div className="absolute bottom-40 left-0 w-full flex justify-center pointer-events-none z-50">
          <Panel variant="card" className="pointer-events-auto mx-3 flex max-w-full items-center gap-2 rounded-xl border-2 border-yellow-300 bg-yellow-400 px-3 py-2 text-[11px] font-bold text-slate-900 shadow-md md:text-sm">
            <span>{isMobile ? `📱 ${UI_COPY.controlsMobile}` : `💻 ${UI_COPY.controlsPc}`}</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowControlsHint(false)}
              className="ml-2 rounded-full bg-slate-900/10 px-2.5 py-1 text-[10px] text-slate-800 hover:bg-slate-900/20 active:scale-95 md:text-xs"
            >
              {isMobile ? `知道了 (${hintCountdown}s)` : '我知道了'}
            </Button>
          </Panel>
        </div>
      )}
    </>
  );
}
