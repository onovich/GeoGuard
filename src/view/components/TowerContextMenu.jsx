import { Button, Panel } from './ui.jsx';

export default function TowerContextMenu({ menu, applyTowerContextAction, closeTowerContextMenu }) {
  if (!menu) {
    return null;
  }

  return (
    <Panel
      variant="menu"
      className="absolute z-50 w-32 text-sm font-bold text-slate-700 pointer-events-auto"
      style={{ left: menu.x, top: menu.y }}
      onMouseLeave={closeTowerContextMenu}
    >
      <Button variant="ghost" size="sm" className="block w-full justify-start rounded-none border-0 px-3 py-2 text-left hover:bg-blue-50 hover:text-blue-700" onClick={() => applyTowerContextAction(1)}>
        升级
      </Button>
      <Button variant="ghost" size="sm" className="block w-full justify-start rounded-none border-0 px-3 py-2 text-left hover:bg-amber-50 hover:text-amber-700" onClick={() => applyTowerContextAction(-1)}>
        降级
      </Button>
    </Panel>
  );
}
