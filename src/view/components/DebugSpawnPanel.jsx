import { useEffect, useRef, useState } from 'react';

const getEnemyTags = (enemy) => {
  const tags = [`HP ${enemy.hp}`, `速 ${enemy.speed}`, `伤 ${enemy.damage}`];
  if (enemy.shield) tags.push(`盾 ${enemy.shield}`);
  if (enemy.deathSpawn) tags.push('分裂');
  if (enemy.healAura) tags.push('治疗');
  if (enemy.explode) tags.push('自爆');
  if (enemy.jamAura) tags.push('干扰');
  if (enemy.phase) tags.push('相位');
  if (enemy.burrow) tags.push('掘地');
  if (enemy.summon) tags.push('召唤');
  if (enemy.targetMode === 'tower') tags.push('攻城');
  if (enemy.targetMode === 'player') tags.push('追猎');
  return tags.join(' / ');
};

function SpawnCard({ item, kind, active, beginDebugEntityDrag }) {
  const startDrag = (clientX, clientY) => beginDebugEntityDrag(kind, item.id, clientX, clientY);

  return (
    <div
      className={`min-w-[136px] cursor-grab rounded-lg border bg-white px-3 py-2 shadow-sm active:cursor-grabbing ${active ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}
      onMouseDown={(event) => {
        if (event.button !== 0) return;
        startDrag(event.clientX, event.clientY);
      }}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        startDrag(touch.clientX, touch.clientY);
      }}
    >
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 rounded-sm shadow-inner" style={{ backgroundColor: item.color }} />
        <span className="text-sm font-black text-slate-700">{item.name}</span>
      </div>
      <p className="mt-1 text-[11px] font-semibold leading-tight text-slate-500">
        {kind === 'boss' ? `${item.personality} / ${item.phases.length} 阶段` : getEnemyTags(item)}
      </p>
    </div>
  );
}

export default function DebugSpawnPanel({ debugMode, debugOptions, setDebugOption, enemyTypes, bossTypes, dragEntity, beginDebugEntityDrag, setDebugPanelRect }) {
  const containerRef = useRef(null);
  const [expanded, setExpanded] = useState(true);
  const [section, setSection] = useState('enemy');

  useEffect(() => {
    if (!debugMode || !containerRef.current) return;
    const syncRect = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setDebugPanelRect({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
    };
    syncRect();
    window.addEventListener('resize', syncRect);
    return () => window.removeEventListener('resize', syncRect);
  }, [debugMode, expanded, section, setDebugPanelRect]);

  if (!debugMode) {
    return null;
  }

  const activeList = section === 'enemy' ? enemyTypes : bossTypes;

  return (
    <div ref={containerRef} className="absolute left-1/2 top-3 z-30 w-[min(980px,94vw)] -translate-x-1/2 rounded-xl border border-slate-200 bg-white/90 shadow-lg backdrop-blur-md pointer-events-auto">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <button className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-black text-white" onClick={() => setExpanded((value) => !value)}>
            {expanded ? '收起' : '展开'}
          </button>
          <span className="text-sm font-black text-slate-700">开发测试场</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={debugOptions.infiniteMoney} onChange={(event) => setDebugOption('infiniteMoney', event.target.checked)} />
            无限金钱
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={debugOptions.infiniteHealth} onChange={(event) => setDebugOption('infiniteHealth', event.target.checked)} />
            无限血量
          </label>
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button className={`rounded-md px-3 py-1 ${section === 'enemy' ? 'bg-white shadow-sm' : ''}`} onClick={() => setSection('enemy')}>
              敌人
            </button>
            <button className={`rounded-md px-3 py-1 ${section === 'boss' ? 'bg-white shadow-sm' : ''}`} onClick={() => setSection('boss')}>
              Boss
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="flex gap-2 overflow-x-auto border-t border-slate-200 px-3 py-3">
          {activeList.map((item) => (
            <SpawnCard key={item.id} item={item} kind={section === 'enemy' ? 'enemy' : 'boss'} active={dragEntity?.kind === (section === 'enemy' ? 'enemy' : 'boss') && dragEntity?.id === item.id} beginDebugEntityDrag={beginDebugEntityDrag} />
          ))}
        </div>
      )}
    </div>
  );
}
