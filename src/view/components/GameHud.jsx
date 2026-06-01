export default function GameHud({ gameState, health, maxHealth, money, formattedTime, currentWave, debugMode }) {
  if (gameState !== 'PLAYING') {
    return null;
  }

  return (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
      <div className="flex flex-col gap-1 w-32 md:w-48 bg-white/80 p-2 rounded-xl shadow-sm backdrop-blur-sm pointer-events-auto">
        <div className="flex justify-between text-sm font-bold text-gray-700">
          <span>HP</span>
          <span>{health}/{maxHealth}</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-red-500 transition-all duration-200" style={{ width: `${(health / maxHealth) * 100}%` }}></div>
        </div>
      </div>

      <div className="flex flex-col items-center text-slate-700 bg-white/80 px-6 py-2 rounded-2xl shadow-sm backdrop-blur-sm min-w-[130px]">
        <span className="text-xs font-bold tracking-[0.2em] text-slate-400">{debugMode ? 'TEST FIELD' : `WAVE ${currentWave}`}</span>
        <span className="text-2xl font-black">{formattedTime}</span>
      </div>

      <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-xl shadow-sm backdrop-blur-sm pointer-events-auto">
        <div className="w-4 h-4 bg-emerald-400 rotate-45 rounded-sm shadow-inner"></div>
        <span className="text-xl font-bold text-slate-700">{money}</span>
      </div>
    </div>
  );
}
