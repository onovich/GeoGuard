import { useEffect, useRef, useState } from 'react';
import { UI_COPY } from '../../data/gameConfig';
import { cx, playerUi, ui } from '../designSystem.js';
import { CharacterIcon, Panel, StickerSymbol } from './ui.jsx';

export default function BuildBar({ gameState, money, dragTowerId, beginTowerDrag, towerTypes, setBuildBarRect, openBlueprintContextMenu }) {
  const containerRef = useRef(null);
  const pendingTouchRef = useRef(null);
  const rectCallback = useRef(setBuildBarRect);
  rectCallback.current = setBuildBarRect;
  const [edges, setEdges] = useState({ left: false, right: false });
  const [hover, setHover] = useState(null);

  const clearPendingTouch = () => {
    if (pendingTouchRef.current?.timer) window.clearTimeout(pendingTouchRef.current.timer);
    pendingTouchRef.current = null;
  };

  useEffect(() => {
    if (gameState !== 'PLAYING' || !containerRef.current) return;
    const element = containerRef.current;
    const sync = () => {
      const rect = element.getBoundingClientRect();
      rectCallback.current?.({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
      const overflow = element.scrollWidth - element.clientWidth > 6;
      const next = { left: overflow && element.scrollLeft > 8, right: overflow && element.scrollLeft + element.clientWidth < element.scrollWidth - 8 };
      setEdges(previous => previous.left === next.left && previous.right === next.right ? previous : next);
    };
    const onScroll = () => { sync(); setHover(null); };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(element);
    window.addEventListener('resize', sync);
    element.addEventListener('scroll', onScroll, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('resize', sync); element.removeEventListener('scroll', onScroll); };
  }, [gameState, towerTypes.length]);

  useEffect(() => { setHover(null); }, [dragTowerId, gameState]);
  useEffect(() => () => clearPendingTouch(), []);

  const showTooltip = (tower, event) => {
    if (dragTowerId || !containerRef.current) return;
    const card = event.currentTarget.getBoundingClientRect();
    const bar = containerRef.current.getBoundingClientRect();
    setHover({ id: tower.id, left: Math.max(0, Math.min(card.left - bar.left, bar.width - 360)) });
  };
  const hoveredTower = hover && towerTypes.find(tower => tower.id === hover.id);
  if (gameState !== 'PLAYING') return null;

  return (
    <div data-build-bar className="absolute bottom-6 left-1/2 z-20 w-[min(92vw,920px)] -translate-x-1/2" style={playerUi.fontStyle}>
      {hoveredTower && !dragTowerId ? (
        <Panel variant="stickerPanel" role="tooltip" id="tower-build-description" className="pointer-events-none absolute bottom-[calc(100%+8px)] w-max max-w-[min(360px,90vw)] px-2.5 py-2 text-sm leading-5" style={{ left: hover.left }}>
          <p>{hoveredTower.summary}</p><p className="mt-1 tabular-nums">伤害 {hoveredTower.damage} · 间隔 {hoveredTower.fireRate}秒 · 射程 {hoveredTower.range}</p>
        </Panel>
      ) : null}
      {dragTowerId ? <Panel variant="stickerPanel" className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 text-sm">{UI_COPY.buildHint}</Panel> : null}
      <div className="relative">
        {edges.left ? <div aria-hidden="true" className="pointer-events-none absolute bottom-5 left-0 top-0 z-10 w-4 rounded-l-[14px] bg-gradient-to-r from-[#FFF9EF] to-transparent" /> : null}
        {edges.right ? <div aria-hidden="true" className="pointer-events-none absolute bottom-5 right-0 top-0 z-10 w-4 rounded-r-[14px] bg-gradient-to-l from-[#FFF9EF] to-transparent" /> : null}
        <Panel ref={containerRef} variant="stickerPanel" data-build-scroll tabIndex={0} aria-label="防御塔建造栏，可拖动水平滚动条查看其他塔" className={cx('pointer-events-auto flex gap-2 overflow-x-auto p-2', playerUi.scrollbar, playerUi.focus)} style={{ touchAction: 'pan-x', scrollbarColor: '#957969 #EBE2D3' }}>
          {towerTypes.map(tower => {
            const lowFunds = typeof money === 'number' && money < tower.cost;
            return (
              <div key={tower.id} data-tower-card={tower.id} tabIndex={0} aria-label={`${tower.name}，费用${tower.cost}，等级${tower.level + 1}/4${lowFunds ? '，资金不足，仍可起拖' : ''}`} aria-describedby={hover?.id === tower.id ? 'tower-build-description' : undefined}
                onMouseEnter={event => showTooltip(tower, event)} onFocus={event => showTooltip(tower, event)} onMouseLeave={() => setHover(null)} onBlur={() => setHover(null)}
                onMouseDown={event => { if (event.button !== 0) return; setHover(null); beginTowerDrag(tower.id, event.clientX, event.clientY); }}
                onContextMenu={event => { event.preventDefault(); openBlueprintContextMenu(tower.id, event.clientX, event.clientY); }}
                onTouchStart={event => {
                  const touch = event.changedTouches[0]; clearPendingTouch();
                  pendingTouchRef.current = { towerId: tower.id, startX: touch.clientX, startY: touch.clientY, touchId: touch.identifier, timer: window.setTimeout(() => { beginTowerDrag(tower.id, touch.clientX, touch.clientY, touch.identifier); pendingTouchRef.current = null; }, 180) };
                }}
                onTouchMove={event => {
                  if (!pendingTouchRef.current) return;
                  const touch = event.changedTouches[0];
                  const dx = Math.abs(touch.clientX - pendingTouchRef.current.startX), dy = touch.clientY - pendingTouchRef.current.startY;
                  if (dy < -12 && dx < 18) { beginTowerDrag(tower.id, touch.clientX, touch.clientY, pendingTouchRef.current.touchId); clearPendingTouch(); return; }
                  if (dx > 10 || dy > 10) clearPendingTouch();
                }} onTouchEnd={clearPendingTouch} onTouchCancel={clearPendingTouch}
                className={cx(ui.card.interactive, playerUi.focus, 'relative flex w-[140px] min-w-[140px] shrink-0 cursor-grab flex-col gap-1 rounded-[10px] border-[1.5px] p-2 text-[#4B281C] shadow-none active:cursor-grabbing', dragTowerId === tower.id ? 'border-[#4B281C] !bg-[#F8DDAA]' : lowFunds ? 'border-[#BB7664] !bg-[#FFF9EF]' : 'border-[#4B281C]/40 !bg-[#FFF9EF] hover:border-[#4B281C] hover:!bg-[#F8EEDC]')}>
                <span className="min-h-6 text-base font-extrabold leading-6 [overflow-wrap:anywhere]">{tower.name}</span>
                <div className="flex min-h-16 items-center justify-between gap-1">
                  <CharacterIcon artId={`tower:${tower.id}`} label={tower.name} className="h-16 w-16" />
                  <div className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-0.5 text-lg font-extrabold leading-6 tabular-nums"><StickerSymbol kind="gem" className="h-4 w-4" />{tower.cost}</span>
                    <span className="text-xs font-semibold">Lv.{tower.level + 1}/4</span>
                    {tower.level > 0 ? <span className="rounded bg-[#F8DDAA] px-1 text-xs font-extrabold">UP+{tower.level}</span> : null}
                  </div>
                </div>
                <span className="text-xs leading-4 tabular-nums">{tower.splash ? '范围' : tower.pierce ? '穿透' : tower.slowRatio ? '减速' : tower.burstCount ? '散射' : '单体'} · {tower.fireRate}秒</span>
                <span className={cx('mt-auto min-h-6 rounded px-1 py-1 text-center text-xs font-semibold leading-4', lowFunds ? 'bg-[#F9E4DC]' : 'text-[#70554A]')}>{lowFunds ? '资金不足' : '拖拽建造'}</span>
              </div>
            );
          })}
        </Panel>
      </div>
    </div>
  );
}
