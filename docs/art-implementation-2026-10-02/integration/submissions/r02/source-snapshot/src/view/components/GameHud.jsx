import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { UI_COPY } from '../../data/gameConfig';
import { cx, playerUi } from '../designSystem.js';
import { Button, CharacterIcon, Panel, StickerSymbol } from './ui.jsx';

export default function GameHud({
  gameState, paused, togglePause, health, maxHealth, money, formattedTime,
  currentWave, debugMode, bossHud = [], audioSettings, setAudioEnabled,
  setAudioVolume, onLayout,
}) {
  const rootRef = useRef(null);
  const layoutCallback = useRef(onLayout);
  layoutCallback.current = onLayout;
  const [showControlsHint, setShowControlsHint] = useState(true);
  const [hintCountdown, setHintCountdown] = useState(30);
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

  useLayoutEffect(() => {
    if (gameState !== 'PLAYING' || !rootRef.current) return;
    const report = () => layoutCallback.current?.({ bottom: rootRef.current.getBoundingClientRect().bottom });
    report();
    const observer = new ResizeObserver(report);
    observer.observe(rootRef.current);
    window.addEventListener('resize', report);
    return () => { observer.disconnect(); window.removeEventListener('resize', report); };
  }, [gameState]);

  useEffect(() => {
    if (!showControlsHint || gameState !== 'PLAYING' || !isMobile) return;
    if (hintCountdown > 0) {
      const timer = setTimeout(() => setHintCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    setShowControlsHint(false);
  }, [showControlsHint, hintCountdown, gameState, isMobile]);

  if (gameState !== 'PLAYING') return null;
  const healthRatio = Math.max(0, Math.min(1, health / Math.max(1, maxHealth)));

  return (
    <>
      <div ref={rootRef} data-player-hud className="pointer-events-none absolute left-4 right-4 top-4 z-20" style={playerUi.fontStyle}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
          <Panel variant="stickerHud" className="flex w-[min(200px,22vw)] items-center gap-2 px-2 py-1">
            <StickerSymbol kind="heart" className="h-6 w-6" />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2 text-sm font-bold leading-4"><span>HP</span><span className="tabular-nums">{health}/{maxHealth}</span></div>
              <div role="progressbar" aria-label="玩家生命" aria-valuenow={health} aria-valuemin={0} aria-valuemax={maxHealth} className="mt-1 h-1.5 overflow-hidden rounded-full border border-[#4B281C]/45 bg-[#EDE7DC]">
                <div className="h-full bg-[#F4ADA0] transition-[width] duration-150 motion-reduce:transition-none" style={{ width: `${healthRatio * 100}%` }} />
              </div>
            </div>
          </Panel>
          <Panel variant="stickerHud" className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold leading-5 tabular-nums">
            <span>{debugMode ? 'TEST FIELD' : `WAVE ${currentWave}`}</span>
            <span className="mx-0.5 h-4 w-px bg-[#4B281C]/25" />
            <StickerSymbol kind="clock" className="h-4 w-4" /><span>{formattedTime}</span>
          </Panel>
          <div className="pointer-events-auto flex flex-wrap items-start justify-end gap-2" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
            <Panel variant="stickerHud" className="flex items-center gap-1.5 px-2 py-1 text-lg font-bold leading-6 tabular-nums"><StickerSymbol kind="gem" className="h-6 w-6" /><span>{money}</span></Panel>
            <Button variant="sticker" size="sm" onClick={togglePause} className="h-9 text-sm">{paused ? '继续' : '暂停'}</Button>
            {audioSettings && setAudioEnabled && setAudioVolume ? (
              <Panel variant="stickerHud" className="flex h-9 items-center gap-1.5 px-1.5 py-1">
                <Button variant="stickerQuiet" size="xs" onClick={() => setAudioEnabled(!audioSettings.enabled)} aria-label={audioSettings.enabled ? '关闭声音' : '开启声音'} aria-pressed={Boolean(audioSettings.enabled)} className="border-0 p-0.5">
                  <StickerSymbol kind={audioSettings.enabled ? 'sound' : 'muted'} className="h-5 w-5" />
                </Button>
                <input aria-label="音量" type="range" min="0" max="1" step="0.01" value={audioSettings.volume} onChange={e => setAudioVolume(Number(e.target.value))} onKeyDown={e => { if (e.key !== 'Escape') e.stopPropagation(); }} onKeyUp={e => { if (e.key !== 'Escape') e.stopPropagation(); }} className={cx('w-14 cursor-pointer accent-[#4B281C]', playerUi.focus)} />
              </Panel>
            ) : null}
          </div>
        </div>
        {bossHud.length > 0 ? (
          <Panel variant="stickerHud" data-boss-hud className="mx-auto mt-1 w-[min(680px,100%)] px-2.5 py-2">
            {bossHud.map(group => (
              <section key={group.id} aria-label={group.title} className="mb-2 last:mb-0">
                <h2 className="text-center text-sm font-extrabold leading-4">{group.title}</h2>
                <div className="mt-0.5 flex flex-col">
                  {group.members.map(member => (
                    <div key={member.id} data-boss-member={member.id} className="grid min-h-8 grid-cols-[32px_50px_minmax(64px,1fr)_110px_minmax(140px,1fr)] items-center gap-x-2">
                      <CharacterIcon artId={member.artId} label={member.name} className="h-8 w-8" />
                      <span className="text-sm font-bold leading-4">{member.name}</span>
                      <div role="progressbar" aria-label={`${member.name}生命比例`} aria-valuenow={Math.round(member.hpRatio * 100)} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full border border-[#4B281C]/45 bg-[#EDE7DC]">
                        <div className="h-full bg-[#F4ADA0] transition-[width] duration-150 motion-reduce:transition-none" style={{ width: `${Math.max(0, Math.min(1, member.hpRatio)) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold leading-4">{member.phase}{member.enraged ? ' · ENRAGED' : ''}{member.phaseCount > 0 ? ` · P${Math.min(member.phaseCount, (member.phaseIndex ?? 0) + 1)}/${member.phaseCount}` : ''}</span>
                      <span className={cx('text-sm leading-4', member.exposed && 'font-extrabold')}>{member.actionLabel}{member.guardCount > 0 ? ` · 护卫 ${member.guardCount}` : ''}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-0.5 border-t border-[#4B281C]/20 pt-0.5 text-sm leading-[18px]">对策：{group.counterplay}</p>
              </section>
            ))}
          </Panel>
        ) : null}
      </div>
      {showControlsHint ? (
        <div className="pointer-events-none absolute bottom-[300px] left-4 right-4 z-20 flex justify-center" style={playerUi.fontStyle}>
          <Panel variant="stickerPanel" className="pointer-events-auto flex max-w-full items-center gap-2 px-3 py-2 text-sm leading-5">
            <span>{isMobile ? UI_COPY.controlsMobile : UI_COPY.controlsPc}</span>
            <Button variant="stickerQuiet" size="xs" onClick={() => setShowControlsHint(false)} className="shrink-0 text-xs">{isMobile ? `知道了 (${hintCountdown}s)` : '我知道了'}</Button>
          </Panel>
        </div>
      ) : null}
    </>
  );
}
