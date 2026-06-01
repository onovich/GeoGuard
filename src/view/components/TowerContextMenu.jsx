export default function TowerContextMenu({ menu, applyTowerContextAction, closeTowerContextMenu }) {
  if (!menu) {
    return null;
  }

  return (
    <div
      className="absolute z-50 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-xl pointer-events-auto"
      style={{ left: menu.x, top: menu.y }}
      onMouseLeave={closeTowerContextMenu}
    >
      <button className="block w-full px-3 py-2 text-left hover:bg-blue-50 hover:text-blue-700" onClick={() => applyTowerContextAction(1)}>
        升级
      </button>
      <button className="block w-full px-3 py-2 text-left hover:bg-amber-50 hover:text-amber-700" onClick={() => applyTowerContextAction(-1)}>
        降级
      </button>
    </div>
  );
}
