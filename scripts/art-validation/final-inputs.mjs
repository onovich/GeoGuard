import assert from 'node:assert/strict';
import { sha256 } from './common.mjs';

// Input adaptation only. A sampled pose is never an actual ability dispatch.
export function adaptFinalInputs(input, actionKeys, skillKeys) {
  assert.equal(input.entries.length, 375);
  assert.deepEqual(input.entries.map(e => e.key).sort(), [...actionKeys].sort());
  assert.equal(new Set(input.entries.map(e => e.key)).size, 375);
  assert.equal(new Set(input.entries.map(e => e.artId)).size, 48);
  assert.deepEqual(input.bossAbilitySamples.map(e => `skill:${e.abilityId}`).sort(), [...skillKeys].sort());
  const samples = [], defects = [];
  const append = (entry, sample, index, kind, ownerIndex = 0) => {
    for (const scale of ['runtime', 'source']) {
      const actor = sample[`${scale}Actor`];
      const token = [kind, entry.key, entry.artId, ownerIndex, index, sample.label, scale].join('|');
      const id = `${kind}-${samples.length.toString().padStart(5, '0')}-${sha256(token).slice(0, 12)}`;
      const drawable = sample.execution === 'drawCharacter';
      const reasons = [];
      if (drawable) {
        if (!actor || actor.artId !== entry.artId) reasons.push('missing-or-mismatched-actor');
        else {
          for (const field of ['x', 'y', 'radius', 'referenceRadius', 'aimAngle', 'poseTime', 'poseProgress', 'movementSpeed', 'alpha', 'level', 'hp', 'maxHp', 'shield', 'maxShield', 'hitFlash']) if (!Number.isFinite(actor[field])) reasons.push(`invalid-${field}`);
          if (!(actor.radius > 0 && actor.referenceRadius > 0)) reasons.push('nonpositive-radius');
        }
        if (!sample.frame?.viewport || !Number.isFinite(sample.frame.time)) reasons.push('invalid-frame');
      }
      if (reasons.length) defects.push({ id, key: entry.key, label: sample.label, scale, reasons });
      samples.push({ id, kind, key: entry.key, artId: entry.artId, referenceAction: kind === 'action' ? entry.action : null,
        abilityId: kind === 'skill-pose' ? entry.abilityId : null, label: sample.label, sampleIndex: index, ownerIndex, scale,
        execution: sample.execution, diagnosticOnly: Boolean(sample.diagnosticOnly), archiveOnly: Boolean(entry.archiveOnly),
        bodyReuseKey: entry.bodyReuseKey ?? null, upstreamPointer: entry.upstreamPointer ?? null, mappingMode: entry.mappingMode ?? null,
        runtimeEvent: entry.runtimeEvent ?? [], effectKeys: entry.effectKeys ?? [], sourceLocators: entry.bodySourceLocators ?? [],
        actor: actor ?? null, frame: sample.frame ?? null, status: drawable && !reasons.length ? 'ready_to_sample' : drawable ? 'invalid_input' : 'dependency_wait',
        visualStatus: 'not_run', runtimeDispatchProven: false });
    }
  };
  for (const entry of input.entries) entry.samples.forEach((s, i) => append(entry, s, i, 'action'));
  for (const ability of input.bossAbilitySamples) ability.owners.forEach((owner, ownerIndex) => owner.samples.forEach((s, i) => append({ ...owner, abilityId: ability.abilityId, key: `skill:${ability.abilityId}` }, s, i, 'skill-pose', ownerIndex)));
  assert.equal(new Set(samples.map(s => s.id)).size, samples.length);
  return { schemaVersion: 1, producerRevision: input.revision, status: 'prepared_not_executed', counts: { actions: input.entries.length, identities: 48, skillKeys: input.bossAbilitySamples.length, actionSamples: samples.filter(s => s.kind === 'action').length / 2, skillPoseSamples: samples.filter(s => s.kind === 'skill-pose').length / 2, capturesBothScales: samples.length, inputDefects: defects.length, pendingCaptures: samples.filter(s => s.status === 'dependency_wait').length }, defects, samples };
}

export function detectSharedObjects(runtime, presentation) {
  const live = new WeakSet(), seen = new WeakSet();
  const collect = value => { if (!value || typeof value !== 'object' || live.has(value)) return; live.add(value); for (const child of value instanceof Set ? value : Object.values(value)) collect(child); };
  collect(runtime);
  const overlaps = [];
  const visit = (value, at) => { if (!value || typeof value !== 'object' || seen.has(value)) return; seen.add(value); if (live.has(value)) overlaps.push(at); for (const [key, child] of value instanceof Set ? [...value].map((v, i) => [i, v]) : Object.entries(value)) visit(child, `${at}/${key}`); };
  visit(presentation, 'presentation');
  return overlaps;
}
