export default function StatusBanner({ waveMsg }) {
  if (!waveMsg) {
    return null;
  }

  return (
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-2xl font-bold text-slate-700 bg-white/80 px-6 py-3 rounded-full shadow-lg animate-pulse pointer-events-none">
      {waveMsg}
    </div>
  );
}