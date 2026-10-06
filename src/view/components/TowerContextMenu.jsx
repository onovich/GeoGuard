import { Button, Panel } from './ui.jsx';

export default function TowerContextMenu({ menu, applyTowerContextAction, closeTowerContextMenu }) {
  if (!menu) {
    return null;
  }

  return (
    <Panel
      variant="stickerPanel"
      className="absolute z-50 w-32 space-y-1 p-1 text-sm font-bold text-[#4B281C] pointer-events-auto"
      style={{ left: menu.x, top: menu.y }}
      onMouseLeave={closeTowerContextMenu}
    >
      <Button variant="stickerSage" size="stickerSm" className="block w-full justify-start px-3 py-2 text-left" onClick={() => applyTowerContextAction(1)}>
        升级
      </Button>
      <Button variant="stickerHoney" size="stickerSm" className="block w-full justify-start px-3 py-2 text-left" onClick={() => applyTowerContextAction(-1)}>
        降级
      </Button>
    </Panel>
  );
}
