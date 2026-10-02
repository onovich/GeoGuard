import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { ROOT, argsMap, writeJSON } from './common.mjs';
import { verifyFinalLock } from './final-lock.mjs';
import { createFinalSession, dismissIntro, expandDebug, collapseDebug, dragDebugCard } from './final-session.mjs';

const args = argsMap(), lock = verifyFinalLock(path.resolve(args.lock), args['lock-sha']), out = path.resolve(args.out);
if (fs.existsSync(out)) throw new Error('New skill-run directory required');
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/art-implementation-2026-10-02/qa/submissions/r01/skill-coverage.json')));
const session = await createFinalSession({ sourceRoot: lock.sourceRoot, out, browserPath: args.browser, width: 1440, height: 900 });
const { page } = session, results = [], errors = [];
const snap = () => page.evaluate(() => window.__GEOGUARD_ART_QA__.snapshot());
async function save(stage, name) {
  if (!stage) return null;
  const image = stage.image; delete stage.image;
  writeJSON(path.join(out, name + '.json'), stage);
  if (image) fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(image.split(',')[1], 'base64'));
  return { state: name + '.json', image: image ? name + '.png' : null };
}
try {
  await page.goto(session.url + '?artqa=1'); await page.getByRole('button', { name: '开发测试入口', exact: true }).click(); await dismissIntro(page);
  await page.waitForFunction(() => window.__GEOGUARD_ART_QA__ && window.__GEOGUARD_ART_INSPECT__().art.status === 'ready');
  const labels = await page.evaluate(async () => { const c = await import('/src/data/gameConfig.js'); return c.BOSS_ORDER.map(id => ({ id, name: c.BOSS_TYPES[id].name })); });
  for (const boss of labels) for (const phaseIndex of [0, 1, 2]) {
    const sceneId = `${boss.id}-P${phaseIndex + 1}`, expected = plan.phaseCases.filter(c => c.encounter === boss.id && c.phaseIndex === phaseIndex);
    const seen = new Set(), casts = [], trace = [];
    try {
      await page.evaluate(() => window.__GEOGUARD_ART_QA__.reset({ seed: 20261001, mode: 'debug' })); await collapseDebug(page);
      const tower = page.locator('[data-tower-card="BASIC"]'); const box = await tower.boundingBox(); assert.ok(box);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(570, 450, { steps: 5 }); await page.mouse.up();
      await dragDebugCard(page, { label: boss.name, boss: true, x: 1282, y: 440 });
      trace.push({ operation: 'real-GUI-build', tower: 'BASIC', screen: [570, 450] }, { operation: 'real-GUI-boss-drag', bossId: boss.id, screen: [1282, 440] });
      await expandDebug(page); await page.getByRole('button', { name: `Phase ${phaseIndex + 1}`, exact: true }).click(); await collapseDebug(page);
      trace.push({ operation: 'real-GUI-phase-button-once-per-scene', phase: phaseIndex + 1 });
      await page.keyboard.down('a'); trace.push({ operation: 'real-keyboard-hold-a', reason: 'Keep the player moving away so observation does not end early from its automatic damage; no stats/AI changes.' });
      for (let cycle = 0; cycle < expected.length + 6 && seen.size < expected.length; cycle++) {
        // No phase reset between casts: original cursor/cooldowns run naturally.
        const observed = await page.evaluate(async ({ phaseIndex }) => {
          const qa = window.__GEOGUARD_ART_QA__, records = [], active = new Map();
          const evidence = (snapshot, frame) => ({ frame, gameTime: snapshot.semantic.state.gameTime, snapshot, image: document.querySelector('canvas').toDataURL('image/png') });
          let last = qa.snapshot();
          for (let frame = 0; frame < 3000; frame++) {
            const advanced = qa.step({ frames: 1, dt: 1 / 60 });
            if (!advanced.advancedFrames) return { records, blocked: advanced.blocked, final: qa.snapshot() };
            const next = qa.snapshot();
            if (next.control.droppedEvents) return { records, error: 'event ledger overflow', final: next };
            for (const current of next.semantic.state.enemies.filter(e => e.isBoss && e.currentPhaseIndex === phaseIndex)) {
              const previous = last.semantic.state.enemies.find(e => e.uid === current.uid), bs = current.bossState;
              const key = `${current.uid}/${bs.castAbility}`;
              if (bs.actionMode === 'windup' && !active.has(key)) active.set(key, { uid: current.uid, role: current.twinRole ?? 'boss', phaseIndex, ability: bs.castAbility, windup: evidence(next, frame), execute: null, recover: null });
              const record = active.get(key); if (!record) continue;
              const actuallyExecuted = previous?.bossState?.actionMode === 'windup' && bs.actionMode !== 'windup' && (current.abilityCooldowns?.[bs.castAbility] ?? 0) > (previous.abilityCooldowns?.[bs.castAbility] ?? 0);
              if (actuallyExecuted && !record.execute) { record.execute = evidence(next, frame); record.directToRecover = bs.actionMode === 'recover'; }
              if (record.execute && bs.actionMode === 'recover' && !record.recover) { record.recover = evidence(next, frame); records.push(record); }
            }
            if (records.length && next.semantic.state.enemies.filter(e => e.isBoss).every(e => e.bossState.actionMode !== 'windup' && e.bossState.actionMode !== 'attack')) return { records, final: next, frames: frame + 1 };
            if (!next.semantic.state.enemies.some(e => e.isBoss)) return { records, reason: 'boss defeated through real gameplay before requested coverage', final: next };
            last = next;
            if (frame % 120 === 0) await new Promise(resolve => setTimeout(resolve, 0));
          }
          return { records, reason: 'bounded50s cast window elapsed', final: qa.snapshot() };
        }, { phaseIndex });
        if (observed.error || observed.blocked) throw new Error(observed.error ?? observed.blocked);
        for (const record of observed.records) {
          const matching = expected.find(c => c.ability === record.ability && c.role === record.role);
          const key = matching?.sceneId ?? `${sceneId}-${record.role}-${record.ability}`;
          if (seen.has(key)) continue;
          const evidence = {};
          for (const stage of ['windup', 'execute', 'recover']) evidence[stage] = await save(record[stage], `${key}-${stage}`);
          casts.push({ key, ability: record.ability, role: record.role, phaseIndex, actualExecute: Boolean(record.execute), directToRecover: record.directToRecover, evidence, visualStatus: 'captured_unreviewed' });
          if (matching && record.execute && record.recover) seen.add(key);
        }
        if (observed.final.art.fallbackArtIds.length || observed.final.art.drawErrors.length || observed.final.presentation.errors.length) throw new Error('Production fallback or art error during actual skill');
        if (!observed.final.semantic.state.enemies.some(e => e.isBoss)) break;
      }
      await page.keyboard.up('a');
      const beforeCleanup = await snap();
      await expandDebug(page); await page.getByRole('button', { name: 'Clear Enemies', exact: true }).click(); await collapseDebug(page);
      await page.evaluate(() => window.__GEOGUARD_ART_QA__.step({ frames: 30, dt: 1 / 60 }));
      const afterCleanup = await snap();
      assert.equal(afterCleanup.semantic.state.enemies.length, 0); assert.equal(afterCleanup.semantic.state.hazards.length, 0);
      writeJSON(path.join(out, sceneId + '-cleanup.json'), { provenance: 'actual GUI Clear Enemies and 30 real hook frames; not boss-death reward proof', before: beforeCleanup, after: afterCleanup });
      await page.screenshot({ path: path.join(out, sceneId + '-cleanup.png') });
      const missing = expected.filter(c => !seen.has(c.sceneId)).map(c => c.sceneId);
      const result = { sceneId, expected: expected.map(c => c.sceneId), completed: [...seen], missing, casts, inputTrace: trace, status: missing.length ? 'coverage_incomplete' : 'actual_dispatch_observed', scope: 'One real GUI phase activation, then unmodified scheduler/cooldowns and real keyboard movement; not a normal campaign phase-transition/economy proof' };
      writeJSON(path.join(out, sceneId + '-report.json'), result); results.push(result); console.log(JSON.stringify({ sceneId, expected: expected.length, observed: seen.size, missing }));
    } catch (error) {
      const result = { sceneId, error: String(error.stack ?? error), casts, inputTrace: trace, status: 'failed' }; errors.push(result.error); results.push(result); writeJSON(path.join(out, sceneId + '-report.json'), result); writeJSON(path.join(out, sceneId + '-failure.json'), await snap().catch(() => null)); await page.screenshot({ path: path.join(out, sceneId + '-failure.png') });
    }
    writeJSON(path.join(out, 'progress.json'), { results, errors });
  }
} finally {
  await session.close(); verifyFinalLock(path.resolve(args.lock), args['lock-sha']);
  const abilities = [...new Set(results.flatMap(r => r.casts ?? []).filter(c => c.actualExecute).map(c => c.ability))];
  writeJSON(path.join(out, 'report.json'), { sourceFingerprint: lock.sourceFingerprint, results, errors: [...errors, ...session.errors], actualDefaultAbilitiesObserved: abilities, uniqueAbilities: abilities.length, expectedDefault: 93, actualPhaseCases: results.reduce((n, r) => n + (r.completed?.length ?? 0), 0), expectedPhaseCases: 180, survivorAbilities: 'separate real defeat/enrage evidence required; sandbox defeat intentionally does not enrage', visualApproval: false });
}
