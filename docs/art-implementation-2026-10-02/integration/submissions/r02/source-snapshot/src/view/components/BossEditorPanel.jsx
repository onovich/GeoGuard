import { useEffect, useMemo, useState } from 'react';
import { Button, Field, Panel, SectionHeading, SelectInput, TextInput, TextareaInput } from './ui.jsx';
import { cx, ui } from '../designSystem.js';

function TreeNode({ node, abilityOptions, onChange, onRemove }) {
  return (
    <Panel variant="card" className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <SectionHeading className="tracking-[0.16em]">Behavior Node</SectionHeading>
        <Button variant="danger" size="xs" onClick={onRemove}>
          Remove
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-[minmax(0,1.3fr)_92px_108px]">
        <Field label="Ability">
          <SelectInput
            value={node.abilityId}
            onChange={(event) => {
              const nextAbilityId = event.target.value;
              const abilityOption = abilityOptions.find((option) => option.id === nextAbilityId);
              onChange({ abilityId: nextAbilityId, cooldown: abilityOption?.defaultCooldown ?? node.cooldown });
            }}
            className="rounded-md px-2"
          >
            {abilityOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} · {option.category}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Cooldown">
          <TextInput
            strong
            type="number"
            min="0.4"
            step="0.1"
            value={node.cooldown}
            onChange={(event) => onChange({ cooldown: Number(event.target.value) })}
            className="rounded-md px-2"
          />
        </Field>

        <label className={cx(ui.form.checkField, 'rounded-md px-2 py-2 text-[11px]')}>
          <input type="checkbox" checked={node.enabled !== false} onChange={(event) => onChange({ enabled: event.target.checked })} />
          Enabled
        </label>
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <Field label="Trigger Hint">
          <TextInput
            value={node.condition ?? ''}
            onChange={(event) => onChange({ condition: event.target.value })}
            placeholder="when ready / punish clump / phase opener"
            className="rounded-md px-2"
          />
        </Field>
        <Field label="Designer Note">
          <TextInput
            value={node.note ?? ''}
            onChange={(event) => onChange({ note: event.target.value })}
            placeholder="What this node is teaching or threatening"
            className="rounded-md px-2"
          />
        </Field>
      </div>
    </Panel>
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
          <SectionHeading>Boss Authoring Lab</SectionHeading>
          <div className="mt-1 text-sm font-semibold text-slate-700">Phase tree editor for debug spawns and debug wave bosses.</div>
        </div>
        <label className={ui.form.checkField}>
          <input type="checkbox" checked={bossEditor.useDraftOverrides} onChange={(event) => bossEditor.setUseDraftOverrides(event.target.checked)} />
          Use authored override in debug
        </label>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <Field label="Boss">
              <SelectInput
                value={bossEditor.selectedBossId}
                onChange={(event) => bossEditor.setSelectedBossId(event.target.value)}
              >
                {bossTypes.map((boss) => (
                  <option key={boss.id} value={boss.id}>
                    {boss.name}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Display Name">
              <TextInput
                strong
                value={bossEditor.draft.name}
                onChange={(event) => bossEditor.updateIdentity({ name: event.target.value })}
              />
            </Field>

            <Field label="Personality">
              <TextInput
                value={bossEditor.draft.personality}
                onChange={(event) => bossEditor.updateIdentity({ personality: event.target.value })}
              />
            </Field>
          </div>

          <Field label="Encounter Summary">
            <TextareaInput
              value={bossEditor.draft.summary ?? ''}
              onChange={(event) => bossEditor.updateIdentity({ summary: event.target.value })}
              rows={2}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="md" className="font-black" onClick={bossEditor.spawnBossFromEditor}>
              Spawn Edited Boss
            </Button>
            <Button size="md" onClick={bossEditor.resetDraft}>
              Reset This Boss
            </Button>
            <Button size="md" onClick={copyDraft}>
              Copy JSON
            </Button>
          </div>

          <div className="space-y-3">
            {bossEditor.draft.phases.map((phase, phaseIndex) => (
              <Panel key={phase.id} variant="softCard" className="p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <SectionHeading className="text-xs tracking-[0.16em]">
                    Root → Phase {phaseIndex + 1}
                  </SectionHeading>
                  <div className="text-[11px] font-bold text-slate-500">{phase.nodes.length} nodes</div>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_110px]">
                  <Field label="Phase Name">
                    <TextInput
                      strong
                      value={phase.name}
                      onChange={(event) => bossEditor.updatePhase(phaseIndex, { name: event.target.value })}
                    />
                  </Field>

                  <Field label="HP Below">
                    <TextInput
                      strong
                      type="number"
                      min="0.05"
                      max="1"
                      step="0.01"
                      value={phase.hpBelow}
                      onChange={(event) => bossEditor.updatePhase(phaseIndex, { hpBelow: Number(event.target.value) })}
                    />
                  </Field>
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

                <Button variant="accent" size="md" className="mt-3 border-dashed" onClick={() => bossEditor.addNode(phaseIndex)}>
                  Add Behavior Node
                </Button>
              </Panel>
            ))}
          </div>
        </div>

        <Panel variant="softCard" className="space-y-3 p-3">
          <div>
            <SectionHeading>Live Draft JSON</SectionHeading>
            <div className="mt-1 text-xs font-medium text-slate-500">
              Export, tweak, then re-import. Debug spawns and debug wave bosses can use this authored override.
            </div>
          </div>

          {selectedBoss ? (
            <Panel variant="card" className="px-3 py-2 text-xs text-slate-600">
              <div className="font-black text-slate-700">{selectedBoss.name}</div>
              <div className="mt-1">{selectedBoss.personality}</div>
              <div className="mt-1 text-[11px] text-slate-500">{selectedBoss.phases.length} phases in the live profile.</div>
            </Panel>
          ) : null}

          <TextareaInput
            mono
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            rows={26}
            className="w-full"
          />

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="md" className="font-black" onClick={applyImport}>
              Apply JSON
            </Button>
            <Button size="md" onClick={() => setImportText(bossEditor.exportDraft)}>
              Refresh From Draft
            </Button>
          </div>

          {importStatus ? <div className="text-xs font-semibold text-slate-500">{importStatus}</div> : null}
        </Panel>
      </div>
    </div>
  );
}
