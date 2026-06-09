import { useEffect, useRef, useState } from 'react';
import BossEditorPanel from './BossEditorPanel';
import { Badge, Button, Panel, SectionHeading } from './ui.jsx';
import { cx, ui } from '../designSystem.js';

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
      className={cx(ui.card.spawn, active ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200')}
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
  bossEditor,
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
    <Panel ref={containerRef} variant="glassPanel" className="absolute left-1/2 top-3 z-30 w-[min(1120px,96vw)] -translate-x-1/2 pointer-events-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 px-3 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" className="font-black" onClick={() => setExpanded((value) => !value)}>
              {expanded ? 'Collapse' : 'Expand'}
            </Button>
            <span className="text-sm font-black text-slate-700">Dev Test Field</span>
            <Badge variant={debugWaveFlow ? 'info' : 'success'}>
              {statusTitle}
            </Badge>
          </div>
          <div className={cx('mt-1', ui.text.muted)}>{statusDetail}</div>
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
          <div className={ui.segment.group}>
            <button className={cx(ui.segment.item, section === 'enemy' && ui.segment.active)} onClick={() => setSection('enemy')}>
              Enemies
            </button>
            <button className={cx(ui.segment.item, section === 'boss' && ui.segment.active)} onClick={() => setSection('boss')}>
              Bosses
            </button>
            <button className={cx(ui.segment.item, section === 'author' && ui.segment.active)} onClick={() => setSection('author')}>
              Author
            </button>
          </div>
        </div>
      </div>

      {expanded ? (
        <>
          <div className="border-t border-slate-200 px-3 py-3">
            <SectionHeading className="mb-2">Quick Actions</SectionHeading>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => clearDebugField({ sandbox: true })}>
                Sandbox
              </Button>
              <Button onClick={() => clearDebugField()}>Clear Enemies</Button>
              <Button variant="danger" onClick={() => clearDebugField({ clearTowers: true })}>
                Clear All
              </Button>
              <Button variant="accent" onClick={openDebugReward}>
                Open Reward
              </Button>
              <Button onClick={unlockAllBlueprints}>Unlock All Towers</Button>
            </div>
          </div>

          <div className="border-t border-slate-200 px-3 py-3">
            <SectionHeading className="mb-2">Wave Checkpoints</SectionHeading>
            <div className="flex flex-wrap gap-2">
              {debugWaveCheckpoints.map((waveNumber) => (
                <Button key={waveNumber} onClick={() => startDebugWave(waveNumber)}>
                  Wave {waveNumber}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 px-3 py-3">
            <SectionHeading className="mb-2">Tower Layouts</SectionHeading>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => applyDebugLayout('balanced')}>Balanced</Button>
              <Button onClick={() => applyDebugLayout('spread')}>Spread</Button>
              <Button onClick={() => applyDebugLayout('boss')}>Boss Duel</Button>
            </div>
          </div>

          <div className="border-t border-slate-200 px-3 py-3">
            <SectionHeading className="mb-2">Boss Phase Jump</SectionHeading>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => forceBossPhase(1)}>Phase 1</Button>
              <Button onClick={() => forceBossPhase(2)}>Phase 2</Button>
              <Button onClick={() => forceBossPhase(3)}>Phase 3</Button>
            </div>
          </div>

          {section === 'author' ? (
            <BossEditorPanel bossTypes={bossTypes} bossEditor={bossEditor} />
          ) : (
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
          )}
        </>
      ) : null}
    </Panel>
  );
}
