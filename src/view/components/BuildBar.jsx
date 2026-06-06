import { useEffect, useMemo, useRef, useState } from 'react';
import { UI_COPY } from '../../data/gameConfig';

export default function BuildBar({ gameState, money, dragTowerId, beginTowerDrag, towerTypes, setBuildBarRect, openBlueprintContextMenu }) {
  const containerRef = useRef(null);
  const pendingTouchRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const clearPendingTouch = () => {
    if (pendingTouchRef.current?.timer) {
      window.clearTimeout(pendingTouchRef.current.timer);
    }
    pendingTouchRef.current = null;
  };

  useEffect(() => {
    const syncRect = () => {
      if (!containerRef.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      setBuildBarRect({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
    };

    syncRect();
    window.addEventListener('resize', syncRect);
    return () => window.removeEventListener('resize', syncRect);
  }, [setBuildBarRect, towerTypes.length]);

  useEffect(() => {
    const syncOverflow = () => {
      if (!containerRef.current) {
        return;
      }

      const element = containerRef.current;
      const overflow = element.scrollWidth - element.clientWidth > 6;
      const left = element.scrollLeft > 8;
      const right = element.scrollLeft + element.clientWidth < element.scrollWidth - 8;
      setIsOverflowing(overflow);
      setShowLeftFade(overflow && left);
      setShowRightFade(overflow && right);
    };

    const syncTouchMode = () => {
      setIsTouchDevice(window.matchMedia?.('(pointer: coarse)').matches ?? window.innerWidth < 768);
    };

    syncTouchMode();
    syncOverflow();
    window.addEventListener('resize', syncOverflow);
    window.addEventListener('resize', syncTouchMode);
    const element = containerRef.current;
    element?.addEventListener('scroll', syncOverflow, { passive: true });

    return () => {
      window.removeEventListener('resize', syncOverflow);
      window.removeEventListener('resize', syncTouchMode);
      element?.removeEventListener('scroll', syncOverflow);
    };
  }, [towerTypes.length]);

  if (gameState !== 'PLAYING') {
    return null;
  }

  return (
    <div className="absolute bottom-6 left-1/2 z-20 w-[min(92vw,920px)] -translate-x-1/2">
      <div className="relative">
        {showLeftFade ? <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 rounded-l-2xl bg-gradient-to-r from-white/95 to-transparent" /> : null}
        {showRightFade ? <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 rounded-r-2xl bg-gradient-to-l from-white/95 to-transparent" /> : null}

        <div
          ref={containerRef}
          className="flex gap-2 overflow-x-auto rounded-2xl bg-white/80 p-1.5 shadow-lg backdrop-blur-md pointer-events-auto"
          style={{ touchAction: 'pan-x' }}
        >
          {towerTypes.map((tower) => (
            <div
              key={tower.id}
              onMouseDown={(event) => {
                if (event.button !== 0) return;
                beginTowerDrag(tower.id, event.clientX, event.clientY);
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                openBlueprintContextMenu(tower.id, event.clientX, event.clientY);
              }}
              onTouchStart={(event) => {
                const touch = event.touches[0];
                clearPendingTouch();
                pendingTouchRef.current = {
                  towerId: tower.id,
                  startX: touch.clientX,
                  startY: touch.clientY,
                  touchId: touch.identifier,
                  timer: window.setTimeout(() => {
                    beginTowerDrag(tower.id, touch.clientX, touch.clientY, touch.identifier);
                    pendingTouchRef.current = null;
                  }, 180),
                };
              }}
              onTouchMove={(event) => {
                if (!pendingTouchRef.current) {
                  return;
                }

                const touch = event.touches[0];
                const dx = Math.abs(touch.clientX - pendingTouchRef.current.startX);
                const dy = touch.clientY - pendingTouchRef.current.startY;

                if (dy < -12 && dx < 18) {
                  beginTowerDrag(tower.id, touch.clientX, touch.clientY, pendingTouchRef.current.touchId);
                  clearPendingTouch();
                  return;
                }

                if (dx > 10 || dy > 10) {
                  clearPendingTouch();
                }
              }}
              onTouchEnd={() => {
                clearPendingTouch();
              }}
              onTouchCancel={() => {
                clearPendingTouch();
              }}
              className={`relative flex min-w-[72px] flex-col items-center rounded-xl border-2 p-1.5 transition-all cursor-grab active:cursor-grabbing ${
                typeof money === 'number' && money < tower.cost ? 'opacity-60' : 'hover:-translate-y-1'
              } ${dragTowerId === tower.id ? 'scale-105 border-blue-500 bg-blue-50' : 'border-transparent bg-white'}`}
            >
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg shadow-inner" style={{ backgroundColor: tower.color }}>
                {tower.shape === 'circle' && <div className="h-4 w-4 rounded-full bg-white/80"></div>}
                {tower.shape === 'square' && <div className="h-4 w-4 rounded-sm bg-white/80"></div>}
                {tower.shape === 'triangle' && <div className="h-0 w-0 border-b-[14px] border-l-[8px] border-r-[8px] border-b-white/80 border-l-transparent border-r-transparent"></div>}
              </div>

              {tower.level > 0 ? (
                <div className="absolute right-1 top-1 flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-700 shadow-sm">
                  <span>UP</span>
                  <span>+{tower.level}</span>
                </div>
              ) : null}

              <span className="text-center text-xs font-bold leading-tight text-slate-700">{tower.name}</span>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <div className="h-2 w-2 rotate-45 bg-emerald-400"></div> {tower.cost}
              </span>
              <span className={`text-[10px] font-semibold ${tower.level > 0 ? 'text-amber-600' : 'text-slate-400'}`}>Lv.{tower.level + 1}/4</span>

              {dragTowerId === tower.id ? (
                <div className="absolute -top-10 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white animate-fade-in-up">
                  {UI_COPY.buildHint}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
