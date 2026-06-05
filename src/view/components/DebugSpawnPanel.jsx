import { useEffect, useRef, useState } from 'react';

const getEnemyTags = (enemy) => {
  const tags = [`HP ${enemy.hp}`, `SPD ${enemy.speed}`, `DMG ${enemy.damage}`];
  if (enemy.shield) tags.push(`Shield ${enemy.shield}`);
  if (enemy.deathSpawn) tags.push('Split');
  if (enemy.healAura) tags.push('Heal');
  if (enemy.explode) tags.push('Explode');
  if (enemy.jamAura) tags.push('Jam');
  if (enemy.phase) tags.push('Phase');
  if (enemy.burrow) tags.push('Burrow');
  if (enemy.summon) tags.push('Summon');
  if (enemy.targetMode === 'tower') tags.push('Siege');
  if (enemy.targetMode === 'player') tags.push('Hunter');
  return tags.join(' / ');
};

function SpawnCard({ item, kind, active, beginDebugEntityDrag }) {
  const startDrag = (clientX, clientY) => beginDebugEntityDrag(kind, item.id, clientX, clientY);

  return (
    <div
      className={`min-w-[152px] cursor-grab rounded-lg border bg-white px-3 py-2 shadow-sm active:cursor-grabbing ${active ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}
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
        {kind === 'boss' ? `${item.personality} / ${item.phases.length} phases` : getEnemyTags(item)}
      </p>
    </div>
  );
}

function ActionButton({ children, onClick, tone = 'default' }) {
  const toneClass =
    tone === 'primary'
      ? 'bg-slate-900 text-white hover:bg-slate-950'
      : tone === 'danger'
        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
        : tone === 'accent'
          ? 'bg-sky-50 text-sky-700 hover:bg-sky-100'
          : 'bg-white text-slate-700 hover:bg-slate-50';

  return (
    <button className={`rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold transition-colors ${toneClass}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default function DebugSpawnPanel({
  debugMode,
  debugWaveFlow,
  debugOptions,
  setDebugOption,
  enemyTypes,
  bossTypes,
  dragEntity,
  beginDebugEntityDrag,
  setDebugPanelRect,
  currentWave,
  waveOverview,
  debugWaveCheckpoints,
  waveTable,
  startDebugWave,
  clearDebugField,
  openDebugReward,
  unlockAllBlueprints,
  applyDebugLayout,
  forceBossPhase,
}) {
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
  const activeWaveMeta = waveTable.find((wave) => wave.number === currentWave);
  const statusTitle = debugWaveFlow ? `Wave ${currentWave}` : 'Sandbox';
  const statusDetail = debugWaveFlow
    ? activeWaveMeta?.label ?? waveOverview?.label ?? 'Live wave flow'
    : 'Manual spawns, manual rewards, infinite testing';

  return (
    <div ref={containerRef} className="absolute left-1/2 top-3 z-30 w-[min(1120px,96vw)] -translate-x-1/2 rounded-xl border border-slate-200 bg-white/92 shadow-lg backdrop-blur-md pointer-events-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 px-3 py-3">
        <div>
          <div className="flex items-center gap-2">
            <button className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-black text-white" onClick={() => setExpanded((value) => !value)}>
              {expanded ? 'Collapse' : 'Expand'}
            </button>
            <span className="text-sm font-black text-slate-700">Dev Test Field</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] ${debugWaveFlow ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {statusTitle}
            </span>
          </div>
          <div className="mt-1 text-xs font-medium text-slate-500">{statusDetail}</div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={debugOptions.infiniteMoney} onChange={(event) => setDebugOption('infiniteMoney', event.target.checked)} />
            Infinite Money
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={debugOptions.infiniteHealth} onChange={(event) => setDebugOption('infiniteHealth', event.target.checked)} />
            Infinite HP
          </label>
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button className={`rounded-md px-3 py-1 ${section === 'enemy' ? 'bg-white shadow-sm' : ''}`} onClick={() => setSection('enemy')}>
              Enemies
            </button>
            <button className={`rounded-md px-3 py-1 ${section === 'boss' ? 'bg-white shadow-sm' : ''}`} onClick={() => setSection('boss')}>
              Bosses
            </button>
          </div>
        </div>
      </div>

      {expanded ? (
        <>
          <div className="border-t border-slate-200 px-3 py-3">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Quick Actions</div>
            <div className="flex flex-wrap gap-2">
              <ActionButton tone="primary" onClick={() => clearDebugField({ sandbox: true })}>
                Sandbox
              </ActionButton>
              <ActionButton onClick={() => clearDebugField()}>Clear Enemies</ActionButton>
              <ActionButton tone="danger" onClick={() => clearDebugField({ clearTowers: true })}>
                Clear All
              </ActionButton>
              <ActionButton tone="accent" onClick={openDebugReward}>
                Open Reward
              </ActionButton>
              <ActionButton onClick={unlockAllBlueprints}>Unlock All Towers</ActionButton>
            </div>
          </div>

          <div className="border-t border-slate-200 px-3 py-3">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Wave Checkpoints</div>
            <div className="flex flex-wrap gap-2">
              {debugWaveCheckpoints.map((waveNumber) => (
                <ActionButton key={waveNumber} onClick={() => startDebugWave(waveNumber)}>
                  Wave {waveNumber}
                </ActionButton>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 px-3 py-3">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Tower Layouts</div>
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={() => applyDebugLayout('balanced')}>Balanced</ActionButton>
              <ActionButton onClick={() => applyDebugLayout('spread')}>Spread</ActionButton>
              <ActionButton onClick={() => applyDebugLayout('boss')}>Boss Duel</ActionButton>
            </div>
          </div>

          <div className="border-t border-slate-200 px-3 py-3">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Boss Phase Jump</div>
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={() => forceBossPhase(1)}>Phase 1</ActionButton>
              <ActionButton onClick={() => forceBossPhase(2)}>Phase 2</ActionButton>
              <ActionButton onClick={() => forceBossPhase(3)}>Phase 3</ActionButton>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-slate-200 px-3 py-3">
            {activeList.map((item) => (
              <SpawnCard
                key={item.id}
                item={item}
                kind={section === 'enemy' ? 'enemy' : 'boss'}
                active={dragEntity?.kind === (section === 'enemy' ? 'enemy' : 'boss') && dragEntity?.id === item.id}
                beginDebugEntityDrag={beginDebugEntityDrag}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
