// Feed only real DEV bridge snapshots captured after actual GUI setup/step.
// This collector never dispatches a skill, changes phase/HP or generates poses.
export function createSkillObserver() {
  const casts = [], active = new Map();
  return {
    ingest(snapshot, provenance) {
      if (provenance?.source !== 'window.__GEOGUARD_ART_QA__.snapshot' || !provenance?.inputTrace || !Number.isInteger(provenance.frame)) throw new Error('Actual bridge and real GUI input provenance required');
      const state = snapshot.semantic.state;
      if (snapshot.control.droppedEvents > 0) throw new Error('Bridge event ledger overflow; missing history cannot pass');
      for (const boss of state.enemies.filter(e => e.isBoss)) {
        const bs = boss.bossState;
        if (!bs?.castAbility) { active.delete(boss.uid); continue; }
        const key = `${boss.uid}/${boss.currentPhaseIndex}/${bs.castAbility}`;
        let record = active.get(boss.uid);
        if (!record || record.key !== key || (bs.actionMode === 'windup' && record.lastMode !== 'windup')) {
          record = { key, uid: boss.uid, bossId: boss.id, twinRole: boss.twinRole ?? null, phaseIndex: boss.currentPhaseIndex, ability: bs.castAbility, inputTrace: provenance.inputTrace, stages: [], lastMode: null, runtimeStatus: 'partial', visualStatus: 'not_reviewed' };
          casts.push(record); active.set(boss.uid, record);
        }
        if (record.lastMode !== bs.actionMode) record.stages.push({ mode: bs.actionMode, frame: provenance.frame, gameTime: state.gameTime, evidence: provenance.snapshotFile ?? null, lockedTarget: structuredClone(bs.lockedTarget ?? null), hazardCount: state.hazards.length, damageTakenMultiplier: boss.damageTakenMultiplier ?? 1 });
        record.lastMode = bs.actionMode;
        const modes = record.stages.map(s => s.mode);
        if (modes.indexOf('windup') >= 0 && modes.indexOf('attack') > modes.indexOf('windup') && modes.indexOf('recover') > modes.indexOf('attack')) record.runtimeStatus = 'lifecycle_observed_requires_effect_cleanup_review';
      }
    },
    report() { return { scope: 'Actual bridge lifecycle observations only; not default phase/all95 or visual approval', casts: structuredClone(casts), uniqueObservedAbilities: [...new Set(casts.map(c => c.ability))], visualApproved: false }; },
  };
}
