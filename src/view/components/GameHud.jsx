import { useState, useEffect } from 'react';
import { UI_COPY } from '../../data/gameConfig';
import { Button, Panel } from './ui.jsx';

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
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
      <Panel variant="hud" className="flex flex-col gap-1 w-32 md:w-48 p-2 pointer-events-auto">
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

      <div className="flex flex-col items-center gap-2 min-w-[220px]">
        <Panel variant="hud" className="flex flex-col items-center text-slate-700 px-6 py-2 min-w-[130px]">
          <span className="text-xs font-bold tracking-[0.2em] text-slate-400">{debugMode ? 'TEST FIELD' : `WAVE ${currentWave}`}</span>
          <span className="text-2xl font-black">{formattedTime}</span>
        </Panel>
        {bossHud.length > 0 ? (
          <Panel variant="darkHud" className="w-[260px] md:w-[340px] px-3 py-1.5">
            {bossHud.map((group) => (
              <div key={group.id} className="mb-1 last:mb-0">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-slate-300 mb-0.5">
                  <span>{group.title}</span>
                </div>
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
        <Panel variant="hud" className="flex items-center gap-2 px-4 py-2">
          <div className="w-4 h-4 bg-emerald-400 rotate-45 rounded-sm shadow-inner"></div>
          <span className="text-xl font-bold text-slate-700">{money}</span>
        </Panel>

      </div>
      </div>
      {showControlsHint && (
        <div className="absolute bottom-40 left-0 w-full flex justify-center pointer-events-none z-50">
          <Panel variant="card" className="pointer-events-auto flex items-center gap-3 rounded-full border-2 border-yellow-300 bg-yellow-400 px-5 py-2 text-[11px] font-black tracking-widest text-slate-900 shadow-[0_4px_16px_rgba(250,204,21,0.5)] md:text-sm">
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
