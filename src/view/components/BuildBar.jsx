import { useEffect, useRef } from 'react';
import { UI_COPY } from '../../data/gameConfig';

export default function BuildBar({ gameState, money, dragTowerId, beginTowerDrag, towerTypes, setBuildBarRect }) {
  const containerRef = useRef(null);

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

  if (gameState !== 'PLAYING') {
    return null;
  }

  return (
    <div ref={containerRef} className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg pointer-events-auto max-w-[92vw] overflow-x-auto">
      {towerTypes.map((tower) => (
        <div
          key={tower.id}
          onMouseDown={(event) => beginTowerDrag(tower.id, event.clientX, event.clientY)}
          onTouchStart={(event) => {
            event.preventDefault();
            const touch = event.touches[0];
            beginTowerDrag(tower.id, touch.clientX, touch.clientY);
          }}
          className={`relative flex flex-col items-center p-2 rounded-xl cursor-grab active:cursor-grabbing transition-all border-2 min-w-[78px] ${money < tower.cost ? 'opacity-60' : 'hover:-translate-y-1'} ${dragTowerId === tower.id ? 'border-blue-500 bg-blue-50 scale-105' : 'border-transparent bg-white'}`}
        >
          <div className="w-10 h-10 mb-1 flex items-center justify-center rounded-lg shadow-inner" style={{ backgroundColor: tower.color }}>
            {tower.shape === 'circle' && <div className="w-4 h-4 bg-white/80 rounded-full"></div>}
            {tower.shape === 'square' && <div className="w-4 h-4 bg-white/80 rounded-sm"></div>}
            {tower.shape === 'triangle' && <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-white/80"></div>}
          </div>
          {tower.level > 0 && (
            <div className="absolute top-1 right-1 flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-700 shadow-sm">
              <span>UP</span>
              <span>+{tower.level}</span>
            </div>
          )}
          <span className="text-xs font-bold text-slate-700 text-center leading-tight">{tower.name}</span>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-400 rotate-45"></div> {tower.cost}
          </span>
          <span className={`text-[10px] font-semibold ${tower.level > 0 ? 'text-amber-600' : 'text-slate-400'}`}>Lv.{tower.level + 1}/4</span>

          {dragTowerId === tower.id && (
            <div className="absolute -top-10 whitespace-nowrap bg-slate-800 text-white text-xs px-2 py-1 rounded animate-fade-in-up">
              {UI_COPY.buildHint}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}