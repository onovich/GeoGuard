import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { UI_COPY } from '../../data/gameConfig';
import { cx, playerUi } from '../designSystem.js';
import { Button, CharacterIcon, Panel, StickerSymbol, OriginalKeycap, OriginalArt, originalSkin } from './ui.jsx';

export default function GameHud({
  gameState, paused, togglePause, health, maxHealth, money, formattedTime,
  currentWave, debugMode, bossHud = [], audioSettings, setAudioEnabled,
  setAudioVolume, onLayout,
}) {
  const rootRef = useRef(null);
  const layoutCallback = useRef(onLayout);
  layoutCallback.current = onLayout;
  const [showControlsHint, setShowControlsHint] = useState(true);
  const [buildDescriptionVisible, setBuildDescriptionVisible] = useState(false);
  const [hintCountdown, setHintCountdown] = useState(30);
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

  useEffect(() => {
    const update = event => setBuildDescriptionVisible(Boolean(event.detail));
    window.addEventListener('geoguard:build-description', update);
    return () => window.removeEventListener('geoguard:build-description', update);
  }, []);

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
          <Panel variant="stickerHud" style={{ borderColor: '#4B281C80' }} className="flex min-h-11 w-[min(210px,22vw)] items-center gap-2 px-2.5 py-1">
            <StickerSymbol kind="heart" className="h-7 w-7" />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2 font-bold leading-5"><span className="text-xs">HP</span><span className="text-base tabular-nums">{health}/{maxHealth}</span></div>
              <div role="progressbar" aria-label="玩家生命" aria-valuenow={health} aria-valuemin={0} aria-valuemax={maxHealth} className="relative mt-1 h-2.5 overflow-hidden">
                <div className="absolute bottom-[2px] left-[3px] top-[2px] bg-[#F4ADA0] transition-[width] duration-150 motion-reduce:transition-none" style={{ width: `calc(${healthRatio * 100}% - ${healthRatio * 6}px)` }} /><span aria-hidden="true" data-original-art="world/hp-frame" className="pointer-events-none absolute inset-0 border border-transparent" style={originalSkin('world/hp-frame',21,5)} />
              </div>
            </div>
          </Panel>
          <Panel variant="stickerHud" style={{ borderColor: '#4B281C50' }} className="flex min-h-11 items-center gap-2 px-3 py-1.5 text-sm font-bold leading-5 tabular-nums">
            <StickerSymbol kind="wave" className="h-5 w-5" />
            <span>{debugMode ? 'TEST FIELD' : `WAVE ${currentWave}`}</span>
            <OriginalArt id="divider" className="mx-0.5 h-4 w-1 object-fill" />
            <StickerSymbol kind="clock" className="h-4 w-4" /><span>{formattedTime}</span>
          </Panel>
          <div className="pointer-events-auto flex flex-wrap items-start justify-end gap-2" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
            <Panel variant="stickerHud" style={{ borderColor: '#4B281C80' }} className="flex min-h-11 items-center gap-1.5 px-2.5 py-1.5 text-xl font-bold leading-6 tabular-nums"><StickerSymbol kind="gem" className="h-7 w-7" /><span>{money}</span></Panel>
            <Button variant="stickerSage" size="stickerMd" onClick={togglePause}>{paused ? '继续' : '暂停'}</Button>
            {audioSettings && setAudioEnabled && setAudioVolume ? (
              <Panel variant="stickerHud" style={{ borderColor: '#4B281C50' }} className="flex h-11 items-center gap-1.5 px-1.5 py-1">
                <Button variant="stickerQuiet" size="xs" onClick={() => setAudioEnabled(!audioSettings.enabled)} aria-label={audioSettings.enabled ? '关闭声音' : '开启声音'} aria-pressed={Boolean(audioSettings.enabled)} className="border-0 p-0.5">
                  <StickerSymbol kind={audioSettings.enabled ? 'sound' : 'muted'} className="h-5 w-5" />
                </Button>
                <input aria-label="音量" type="range" min="0" max="1" step="0.01" value={audioSettings.volume} onChange={e => setAudioVolume(Number(e.target.value))} onKeyDown={e => { if (e.key !== 'Escape') e.stopPropagation(); }} onKeyUp={e => { if (e.key !== 'Escape') e.stopPropagation(); }} className={cx('w-14 cursor-pointer accent-[#4B281C]', playerUi.focus)} />
              </Panel>
            ) : null}
          </div>
        </div>
        {bossHud.length > 0 ? (
          <Panel variant="stickerHud" data-boss-hud className="mx-auto mt-0.5 w-[min(680px,100%)] px-2.5 py-1">
            {bossHud.map(group => (
              <section key={group.id} aria-label={group.title} className="mb-2 last:mb-0">
                {group.members.length > 1 || group.title !== group.members[0]?.name ? <h2 className="mb-0.5 text-center text-sm font-extrabold leading-4">{group.title}</h2> : null}
                <div data-boss-layout={group.members.length > 1 ? 'multiple' : 'single'} className="flex flex-col gap-0.5">
                  {group.members.map(member => (
                    <div key={member.id} data-boss-member={member.id} className={cx('grid items-center gap-x-2', group.members.length > 1 ? 'grid-cols-[32px_minmax(96px,auto)_minmax(100px,1fr)_minmax(220px,1.4fr)]' : 'grid-cols-[40px_minmax(160px,1fr)_minmax(240px,1.2fr)]')}>
                      <CharacterIcon artId={member.artId} label={member.name} className={group.members.length > 1 ? 'h-8 w-8' : 'row-span-2 h-10 w-10'} />
                      <span className="whitespace-nowrap text-base font-extrabold leading-5">{member.name}</span>
                      <div role="progressbar" aria-label={`${member.name}生命比例`} aria-valuenow={Math.round(member.hpRatio * 100)} aria-valuemin={0} aria-valuemax={100} className={cx('relative h-2.5 overflow-hidden', group.members.length === 1 && 'col-start-2 row-start-2')}>
                        <div className="absolute bottom-[2px] left-[3px] top-[2px] bg-[#F4ADA0] transition-[width] duration-150 motion-reduce:transition-none" style={{ width: `calc(${Math.max(0, Math.min(1, member.hpRatio)) * 100}% - ${Math.max(0, Math.min(1, member.hpRatio)) * 6}px)` }} /><span aria-hidden="true" data-original-art="world/hp-frame" className="pointer-events-none absolute inset-0 border border-transparent" style={originalSkin('world/hp-frame',21,5)} />
                      </div>
                      <div className={cx('min-w-0 text-sm leading-5', group.members.length === 1 && 'col-start-3 row-span-2 row-start-1 pl-2')}>
                        <span className="font-semibold">{member.phase}{member.enraged ? ' · ENRAGED' : ''}{member.phaseCount > 0 ? ` · P${Math.min(member.phaseCount, (member.phaseIndex ?? 0) + 1)}/${member.phaseCount}` : ''}</span>
                        <span className={cx(group.members.length === 1 ? 'block' : 'ml-2', member.exposed && 'font-extrabold')}>{member.actionLabel}{member.guardCount > 0 ? ` · 护卫 ${member.guardCount}` : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <OriginalArt id="divider" className="mt-0.5 h-1 w-full object-fill" /><p className="text-sm leading-[18px]">对策：{group.counterplay}</p>
              </section>
            ))}
          </Panel>
        ) : null}
      </div>
      {showControlsHint && !buildDescriptionVisible ? (
        <div className="pointer-events-none absolute bottom-[238px] left-4 right-4 z-20 flex justify-center" style={playerUi.fontStyle}>
          <Panel variant="stickerPanel" style={{ borderColor: '#4B281C50' }} className="pointer-events-auto flex max-w-full items-center gap-3 px-3 py-1.5 text-sm leading-5">
            {isMobile ? <span>{UI_COPY.controlsMobile}</span> : <span aria-label={UI_COPY.controlsPc} className="flex flex-wrap items-center gap-1.5"><span className="flex gap-1">{'WASD'.split('').map(key => <OriginalKeycap key={key}>{key}</OriginalKeycap>)}</span><span>/ 方向键移动</span><span>· 拖拽塔卡建造</span></span>}
            <Button variant="stickerQuiet" size="stickerSm" onClick={() => setShowControlsHint(false)} className="shrink-0">{isMobile ? `知道了 (${hintCountdown}s)` : '我知道了'}</Button>
          </Panel>
        </div>
      ) : null}
    </>
  );
}
