import { UI_COPY } from '../../data/gameConfig';

export default function BuildBar({ gameState, money, selectedTower, setSelectedTower, towerTypes }) {
  if (gameState !== 'PLAYING') {
    return null;
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg pointer-events-auto">
      {towerTypes.map((tower) => (
        <div
          key={tower.id}
          onClick={() => setSelectedTower(selectedTower?.id === tower.id ? null : tower)}
          className={`relative flex flex-col items-center p-2 rounded-xl cursor-pointer transition-all border-2 ${money < tower.cost ? 'opacity-50 grayscale' : 'hover:-translate-y-1'} ${selectedTower?.id === tower.id ? 'border-blue-500 bg-blue-50 scale-105' : 'border-transparent bg-white'}`}
        >
          <div className="w-10 h-10 mb-1 flex items-center justify-center rounded-lg shadow-inner" style={{ backgroundColor: tower.color }}>
            {tower.shape === 'circle' && <div className="w-4 h-4 bg-white/80 rounded-full"></div>}
            {tower.shape === 'square' && <div className="w-4 h-4 bg-white/80 rounded-sm"></div>}
            {tower.shape === 'triangle' && <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-white/80"></div>}
          </div>
          <span className="text-xs font-bold text-slate-700">{tower.name}</span>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-400 rotate-45"></div> {tower.cost}
          </span>

          {selectedTower?.id === tower.id && (
            <div className="absolute -top-10 whitespace-nowrap bg-slate-800 text-white text-xs px-2 py-1 rounded animate-fade-in-up">
              {UI_COPY.buildHint}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}