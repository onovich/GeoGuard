import { useEffect, useRef, useState } from 'react';
import { UI_COPY } from '../../data/gameConfig';
import { cx, playerUi, ui } from '../designSystem.js';
import { CharacterIcon, Panel, StickerSymbol, OriginalArt, originalSkin } from './ui.jsx';

// Anchor to the visible part of the actual card, never to an offscreen center.
// An edge sliver uses a narrow connector, retaining its actual visible anchor.
const getDescriptionPosition = (card, bar, viewportWidth, inset = 0) => {
  const visibleLeft = Math.max(card.left, bar.left + inset);
  const visibleRight = Math.min(card.right, bar.right - inset);
  if (visibleRight <= visibleLeft) return null;
  const width = Math.min(360, bar.width, viewportWidth - 32);
  const center = (visibleLeft + visibleRight) / 2 - bar.left;
  const left = Math.max(0, Math.min(center - width / 2, bar.width - width));
  const anchor = center - left;
  return { left, width, anchor, edgeTail: anchor < 10 || anchor > width - 10 };
};

export default function BuildBar({ gameState, money, dragTowerId, beginTowerDrag, towerTypes, setBuildBarRect, openBlueprintContextMenu }) {
  const containerRef = useRef(null);
  const pendingTouchRef = useRef(null);
  const rectCallback = useRef(setBuildBarRect);
  rectCallback.current = setBuildBarRect;
  const towerTypesRef = useRef(towerTypes);
  towerTypesRef.current = towerTypes;
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
    const onScroll = () => {
      sync();
      const focusedCard = document.activeElement;
      const tower = element.contains(focusedCard) && towerTypesRef.current.find(item => item.id === focusedCard.dataset.towerCard);
      if (!tower || dragTowerId) { setHover(null); return; }
      // Native focus scrolling runs after onFocus. Re-anchor from the new
      // viewport coordinates rather than discarding the focused description.
      const card = focusedCard.getBoundingClientRect();
      const bar = element.getBoundingClientRect();
      const position = getDescriptionPosition(card, bar, window.innerWidth, element.clientLeft);
      setHover(position ? { id: tower.id, ...position } : null);
    };
    sync();
    const observer = new ResizeObserver(onScroll);
    observer.observe(element);
    window.addEventListener('resize', onScroll);
    element.addEventListener('scroll', onScroll, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('resize', onScroll); element.removeEventListener('scroll', onScroll); };
  }, [gameState, towerTypes.length, dragTowerId]);

  useEffect(() => { setHover(null); }, [dragTowerId, gameState]);
  // Presentation-only coordination: a focused description takes precedence over
  // the dismissible teaching strip. This never changes build/gameplay state.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('geoguard:build-description', { detail: Boolean(hover && !dragTowerId && gameState === 'PLAYING') }));
    return () => window.dispatchEvent(new CustomEvent('geoguard:build-description', { detail: false }));
  }, [hover, dragTowerId, gameState]);
  useEffect(() => () => clearPendingTouch(), []);

  const showTooltip = (tower, event) => {
    if (dragTowerId || !containerRef.current) return;
    const card = event.currentTarget.getBoundingClientRect();
    const bar = containerRef.current.getBoundingClientRect();
    const position = getDescriptionPosition(card, bar, window.innerWidth, containerRef.current.clientLeft);
    setHover(position ? { id: tower.id, ...position } : null);
  };
  const hoveredTower = hover && towerTypes.find(tower => tower.id === hover.id);
  if (gameState !== 'PLAYING') return null;

  return (
    <div data-build-bar className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2" style={{ ...playerUi.fontStyle, width: `min(92vw,920px,${Math.max(1, towerTypes.length) * 140 + Math.max(0, towerTypes.length - 1) * 8 + 16 + 32 + 3}px)` }}>
      {hoveredTower && !dragTowerId ? (
        <Panel variant="stickerPanel" role="tooltip" id="tower-build-description" className="pointer-events-none absolute bottom-[calc(100%+10px)] px-2.5 py-2 text-sm leading-5" style={{ left: hover.left, width: hover.width }}>
          <p>{hoveredTower.summary}</p><p className="mt-1 tabular-nums">伤害 {hoveredTower.damage} · 间隔 {hoveredTower.fireRate}秒 · 射程 {hoveredTower.range}</p>
          <OriginalArt id="arrowDown" data-tooltip-anchor className="absolute -bottom-[9px] h-3 w-3 object-contain" style={{left:hover.anchor-6}} />
        </Panel>
      ) : null}
      {dragTowerId ? <Panel variant="stickerPanel" className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 text-sm">{UI_COPY.buildHint}</Panel> : null}
      <div className="relative">
        {edges.left ? <div aria-hidden="true" className="pointer-events-none absolute bottom-5 left-0 top-0 z-10 flex w-4 items-center"><StickerSymbol kind="arrowLeft" className="h-4 w-4" /></div> : null}
        {edges.right ? <div aria-hidden="true" className="pointer-events-none absolute bottom-5 right-0 top-0 z-10 flex w-4 items-center"><StickerSymbol kind="arrowRight" className="h-4 w-4" /></div> : null}
        <Panel variant="stickerPanel" className="pointer-events-auto relative overflow-hidden p-4"><div ref={containerRef} data-build-scroll tabIndex={0} aria-label="防御塔建造栏，可拖动水平滚动条查看其他塔" className={cx('pointer-events-auto flex gap-2 overflow-x-auto p-2', playerUi.scrollbar, playerUi.focus)} style={{ touchAction: 'pan-x', scrollbarColor: '#957969 #EBE2D3', borderColor: '#4B281C50' }}>
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
                data-original-art="card" style={originalSkin(dragTowerId===tower.id?'button-honey':'card',dragTowerId===tower.id?26:16,12)}
                className={cx(playerUi.focus, 'relative flex min-h-[148px] w-[140px] min-w-[140px] shrink-0 cursor-grab flex-col gap-0.5 border-[1.5px] p-1.5 text-[#4B281C] shadow-none active:cursor-grabbing')}>
                <span className="min-h-5 text-center text-base font-extrabold leading-5 [overflow-wrap:anywhere]">{tower.name}</span>
                <div className="flex min-h-[68px] items-center justify-between gap-0.5">
                  <CharacterIcon artId={`tower:${tower.id}`} label={tower.name} className="h-[68px] w-[68px]" />
                  <div className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-0.5 text-lg font-extrabold leading-6 tabular-nums"><StickerSymbol kind="gem" className="h-4 w-4" />{tower.cost}</span>
                    <span className="text-xs font-medium text-[#70554A]">Lv.{tower.level + 1}/4</span>
                  </div>
                </div>
                <span className="text-center text-xs leading-4 tabular-nums text-[#70554A]">{tower.splash ? '范围' : tower.pierce ? '穿透' : tower.slowRatio ? '减速' : tower.burstCount ? '散射' : '单体'} · {tower.fireRate}秒</span>
                <span className={cx('mt-auto flex min-h-6 items-center justify-center gap-1 px-1 py-0.5 text-sm font-semibold leading-5', lowFunds ? 'text-[#9D5140]' : 'text-[#70554A]')}>{lowFunds ? <StickerSymbol kind="warning" className="h-4 w-4" /> : null}{lowFunds ? '资金不足' : '拖拽建造'}</span>
              </div>
            );
          })}
        </div><div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20" style={{ ...originalSkin('panel', 16), borderStyle: 'solid', borderWidth: 1, borderImageSlice: '16' }} /></Panel>
      </div>
    </div>
  );
}
