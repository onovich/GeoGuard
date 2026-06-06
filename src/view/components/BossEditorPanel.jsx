import { useEffect, useMemo, useState } from 'react';

function TreeNode({ node, abilityOptions, onChange, onRemove }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Behavior Node</div>
        <button className="rounded-md border border-rose-200 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50" onClick={onRemove}>
          Remove
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-[minmax(0,1.3fr)_92px_108px]">
        <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
          Ability
          <select
            value={node.abilityId}
            onChange={(event) => {
              const nextAbilityId = event.target.value;
              const abilityOption = abilityOptions.find((option) => option.id === nextAbilityId);
              onChange({ abilityId: nextAbilityId, cooldown: abilityOption?.defaultCooldown ?? node.cooldown });
            }}
            className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-700"
          >
            {abilityOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} · {option.category}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
          Cooldown
          <input
            type="number"
            min="0.4"
            step="0.1"
            value={node.cooldown}
            onChange={(event) => onChange({ cooldown: Number(event.target.value) })}
            className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-700"
          />
        </label>

        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] font-bold text-slate-600">
          <input type="checkbox" checked={node.enabled !== false} onChange={(event) => onChange({ enabled: event.target.checked })} />
          Enabled
        </label>
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
          Trigger Hint
          <input
            value={node.condition ?? ''}
            onChange={(event) => onChange({ condition: event.target.value })}
            placeholder="when ready / punish clump / phase opener"
            className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-700"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
          Designer Note
          <input
            value={node.note ?? ''}
            onChange={(event) => onChange({ note: event.target.value })}
            placeholder="What this node is teaching or threatening"
            className="rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-700"
          />
        </label>
      </div>
    </div>
  );
}

export default function BossEditorPanel({ bossTypes, bossEditor }) {
  const [importText, setImportText] = useState(bossEditor.exportDraft);
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
    setImportText(bossEditor.exportDraft);
  }, [bossEditor.exportDraft, bossEditor.selectedBossId]);

  const selectedBoss = useMemo(
    () => bossTypes.find((boss) => boss.id === bossEditor.selectedBossId) ?? bossTypes[0],
    [bossEditor.selectedBossId, bossTypes]
  );

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(bossEditor.exportDraft);
      setImportStatus('Draft copied to clipboard.');
    } catch {
      setImportStatus('Clipboard copy failed. You can still copy from the JSON box.');
    }
  };

  const applyImport = () => {
    const result = bossEditor.importDraft(importText);
    setImportStatus(result.ok ? 'Draft imported.' : `Import failed: ${result.error}`);
  };

  return (
    <div className="border-t border-slate-200 px-3 py-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Boss Authoring Lab</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">Phase tree editor for debug spawns and debug wave bosses.</div>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
          <input type="checkbox" checked={bossEditor.useDraftOverrides} onChange={(event) => bossEditor.setUseDraftOverrides(event.target.checked)} />
          Use authored override in debug
        </label>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
              Boss
              <select
                value={bossEditor.selectedBossId}
                onChange={(event) => bossEditor.setSelectedBossId(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              >
                {bossTypes.map((boss) => (
                  <option key={boss.id} value={boss.id}>
                    {boss.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
              Display Name
              <input
                value={bossEditor.draft.name}
                onChange={(event) => bossEditor.updateIdentity({ name: event.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
              Personality
              <input
                value={bossEditor.draft.personality}
                onChange={(event) => bossEditor.updateIdentity({ personality: event.target.value })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
            Encounter Summary
            <textarea
              value={bossEditor.draft.summary ?? ''}
              onChange={(event) => bossEditor.updateIdentity({ summary: event.target.value })}
              rows={2}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-950" onClick={bossEditor.spawnBossFromEditor}>
              Spawn Edited Boss
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50" onClick={bossEditor.resetDraft}>
              Reset This Boss
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50" onClick={copyDraft}>
              Copy JSON
            </button>
          </div>

          <div className="space-y-3">
            {bossEditor.draft.phases.map((phase, phaseIndex) => (
              <div key={phase.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Root → Phase {phaseIndex + 1}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500">{phase.nodes.length} nodes</div>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_110px]">
                  <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
                    Phase Name
                    <input
                      value={phase.name}
                      onChange={(event) => bossEditor.updatePhase(phaseIndex, { name: event.target.value })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-[11px] font-bold text-slate-500">
                    HP Below
                    <input
                      type="number"
                      min="0.05"
                      max="1"
                      step="0.01"
                      value={phase.hpBelow}
                      onChange={(event) => bossEditor.updatePhase(phaseIndex, { hpBelow: Number(event.target.value) })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                    />
                  </label>
                </div>

                <div className="mt-3 space-y-3 border-l-2 border-slate-200 pl-4">
                  {phase.nodes.map((node) => (
                    <TreeNode
                      key={node.id}
                      node={node}
                      abilityOptions={bossEditor.abilityOptions}
                      onChange={(patch) => bossEditor.updateNode(phaseIndex, node.id, patch)}
                      onRemove={() => bossEditor.removeNode(phaseIndex, node.id)}
                    />
                  ))}
                </div>

                <button
                  className="mt-3 rounded-lg border border-dashed border-sky-300 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100"
                  onClick={() => bossEditor.addNode(phaseIndex)}
                >
                  Add Behavior Node
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Live Draft JSON</div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              Export, tweak, then re-import. Debug spawns and debug wave bosses can use this authored override.
            </div>
          </div>

          {selectedBoss ? (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <div className="font-black text-slate-700">{selectedBoss.name}</div>
              <div className="mt-1">{selectedBoss.personality}</div>
              <div className="mt-1 text-[11px] text-slate-500">{selectedBoss.phases.length} phases in the live profile.</div>
            </div>
          ) : null}

          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            rows={26}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 font-mono text-[11px] leading-5 text-slate-700"
          />

          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-950" onClick={applyImport}>
              Apply JSON
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50" onClick={() => setImportText(bossEditor.exportDraft)}>
              Refresh From Draft
            </button>
          </div>

          {importStatus ? <div className="text-xs font-semibold text-slate-500">{importStatus}</div> : null}
        </div>
      </div>
    </div>
  );
}
