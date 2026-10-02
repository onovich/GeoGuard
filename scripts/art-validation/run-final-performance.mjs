import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { ROOT, argsMap, fileHash, writeJSON } from './common.mjs';
import { verifyFinalLock, candidateManifest, candidateFingerprint } from './final-lock.mjs';
import { createFinalSession, dismissIntro, expandDebug, collapseDebug, dragDebugCard } from './final-session.mjs';
import { installRafProbe, beginRafProbe, readRafProbe, summarizeRafProbe, compareDensity } from './final-performance.mjs';

const args = argsMap(), lock = verifyFinalLock(path.resolve(args.lock), args['lock-sha']), out = path.resolve(args.out);
if (args['exclusive-confirmed'] !== 'UI-and-root-browsers-closed') throw new Error('Primary UI/root completion notification must precede exclusive performance');
if (fs.existsSync(out)) throw new Error('New performance directory required');
const baseline = path.join(ROOT, 'docs/art-implementation-2026-10-02/qa/submissions/r02/baseline/browser');
const baselineFingerprint = candidateFingerprint(candidateManifest(baseline));
const runs = [], schedule = [];
for (let trial = 1; trial <= 3; trial++) for (const version of ['baseline', 'candidate']) schedule.push({ version, trial, profile: 'matched-density', dpr: 1 });
schedule.push({ version: 'candidate', trial: 1, profile: 'normal-real-level', dpr: 2 }, { version: 'candidate', trial: 1, profile: 'dense-with-real-hazards', dpr: 2 });
for (const spec of schedule.filter(spec => !args.only || spec.profile === args.only)) {
  const name = `${spec.profile}-${spec.version}-${spec.trial}-dpr${spec.dpr}`, dir = path.join(out, name);
  const session = await createFinalSession({ sourceRoot: spec.version === 'baseline' ? baseline : lock.sourceRoot, out: dir, browserPath: args.browser, dpr: spec.dpr, densityObservation: true });
  const { page } = session, inputs = [];
  let result;
  console.log(JSON.stringify({ starting: name }));
  try {
    await page.goto(session.url); await page.getByRole('button', { name: spec.profile === 'normal-real-level' ? '开始游戏' : '开发测试入口', exact: true }).click(); await dismissIntro(page);
    if (spec.profile === 'normal-real-level') {
      for (const offset of [-140, 140]) {
        const card = page.locator('[data-tower-card="BASIC"]'); const box = await card.boundingBox(); assert.ok(box);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(720 + offset * 1.25, 450, { steps: 5 }); await page.mouse.up(); inputs.push({ type: 'build', tower: 'BASIC', world: [offset, 0] });
      }
    } else {
      await expandDebug(page); await page.getByRole('button', { name: 'Balanced', exact: true }).click(); await collapseDebug(page); inputs.push({ type: 'actual-GUI-preset', name: 'Balanced' });
      const zoom = spec.version === 'baseline' ? 1 : 1.25;
      // Same world placements in both versions. No bridge, phase edits or RNG
      // replacements; real RAF/update continues throughout actual GUI setup.
      for (const [label, x] of [['蜂巢建筑师', 260], ['冰环审判者', -260]]) {
        const bx = args['sustain-presets'] === 'true' ? 0 : x, by = args['sustain-presets'] === 'true' ? 0 : -40;
        await dragDebugCard(page, { label, boss: true, x: Math.round(720 + bx * zoom), y: Math.round(450 + by * zoom) }); inputs.push({ type: 'boss-drag', label, world: [bx, by] });
      }
      const labels = ['方阵兵', '疾袭兵', '重装兵', '裂片兵', '护盾兵', '医疗棱镜', '爆破球', '干扰体', '相位兵', '掘地者', '信标兵', '斥候', '攻城块'];
      for (let ring = 0; ring < 2; ring++) for (let i = 0; i < labels.length; i++) {
        const angle = i / labels.length * Math.PI * 2 + ring * .16, x = Math.round(Math.cos(angle) * (220 + ring * 40)), y = Math.round(Math.sin(angle) * (70 + ring * 20));
        const label = args['sustain-presets'] === 'true' ? '重装兵' : labels[i], ex = args['sustain-presets'] === 'true' ? 0 : x, ey = args['sustain-presets'] === 'true' ? 0 : y;
        await dragDebugCard(page, { label, x: Math.round(720 + ex * zoom), y: Math.round(450 + ey * zoom) }); inputs.push({ type: 'enemy-drag', label, world: [ex, ey] });
      }
      if (args['sustain-presets'] === 'true') { await expandDebug(page); await page.getByRole('button', { name: 'Balanced', exact: true }).click(); await collapseDebug(page); }
    }
    await page.screenshot({ path: path.join(dir, 'before-warmup.png') });
    await installRafProbe(page); const begun = await beginRafProbe(page); assert.equal(begun.manual, false);
    for (let block = 0; block < 7; block++) {
      if (spec.profile === 'normal-real-level') { const key = ['d', 's', 'a', 'w'][block % 4]; await page.keyboard.down(key); await page.waitForTimeout(10000); await page.keyboard.up(key); inputs.push({ type: 'keyboard', key, wallSeconds: 10 }); }
      else if (args['sustain-presets'] === 'true') {
        for (let segment = 0; segment < 2; segment++) {
          await expandDebug(page); const preset = (block * 2 + segment) % 2 ? 'Spread' : 'Balanced';
          await page.getByRole('button', { name: preset, exact: true }).click(); await collapseDebug(page);
          inputs.push({ type: 'actual-GUI-tower-preset-during-measurement', preset, block, segment, note: 'Replaces towers through original UI, no HP setter. This user-input workload and its cost are included.' });
          await page.waitForTimeout(5000);
        }
      } else await page.waitForTimeout(10000);
      console.log(JSON.stringify({ running: name, elapsedSeconds: (block + 1) * 10 }));
    }
    await page.waitForFunction(() => window.__GEOGUARD_FINAL_PERF__.done, { timeout: 5000 });
    const probe = await readRafProbe(page), summary = summarizeRafProbe(probe);
    await page.screenshot({ path: path.join(dir, 'after-measurement.png') });
    await page.getByRole('button', { name: '试玩数据', exact: true }).click();
    const telemetry = JSON.parse(await page.getByLabel('试玩 JSON 数据').inputValue()); writeJSON(path.join(dir, 'telemetry.json'), telemetry);
    const art = await page.evaluate(() => window.__GEOGUARD_ART_INSPECT__?.() ?? null); if (art) writeJSON(path.join(dir, 'actual-state.json'), art);
    writeJSON(path.join(dir, 'raf-and-density.json'), probe);
    result = { ...spec, name, summary, browserVersion: session.browserVersion, inputs, transformed: session.transformed, errors: session.errors, requests: session.requests,
      art: art ? { fallbackArtIds: art.art.fallbackArtIds, drawErrors: art.art.drawErrors, errors: art.presentation.errors } : null,
      limitations: ['Unseeded actual RAF gameplay/GUI setup, so matching count distributions is required before comparison.', 'Debug density uses actual sandbox presets/spawns and infinite player HP; it is not a normal economy claim.', 'Both versions have the same primitive density observer at renderer entry; observer overhead is included.', 'Screenshots taken before warmup and after measurement, not in the measurement window.'] };
    if (spec.profile === 'dense-with-real-hazards') {
      result.requiredHazardsMissing = summary.hazardFramesObserved === 0;
      result.requiredCrossfireMissing = !(summary.distributions.towers.p50 > 0 && summary.distributions.projectiles.p95 > 0);
      result.sustainedGuiPresets = args['sustain-presets'] === 'true';
    }
  } catch (error) { result = { ...spec, name, error: String(error.stack ?? error), errors: session.errors }; await page.screenshot({ path: path.join(dir, 'failure.png') }).catch(() => {}); }
  finally { await session.close(); }
  writeJSON(path.join(dir, 'report.json'), result); runs.push(result); writeJSON(path.join(out, 'progress.json'), { runs });
}
const comparisons = [1, 2, 3].map(trial => {
  const a = runs.find(r => r.profile === 'matched-density' && r.version === 'baseline' && r.trial === trial), b = runs.find(r => r.profile === 'matched-density' && r.version === 'candidate' && r.trial === trial);
  return { trial, ...(a?.summary && b?.summary ? compareDensity(a.summary, b.summary) : { comparable: false, directRegressionRatio: null, reason: 'not present or failed run' }) };
}).filter(() => !args.only);
verifyFinalLock(path.resolve(args.lock), args['lock-sha']); assert.equal(candidateFingerprint(candidateManifest(baseline)), baselineFingerprint);
const pass = runs.every(r => r.summary?.valid && !r.error && !r.errors.length && !r.requiredHazardsMissing && !r.requiredCrossfireMissing);
writeJSON(path.join(out, 'report.json'), { scope: args.only ? 'Targeted real-game RAF follow-up for identified missing load coverage' : 'Eight required real-game RAF samples, exclusive browser workload', frozenSourceFingerprint: lock.sourceFingerprint, baselineFingerprint, environment: { node: process.version, cpu: os.cpus()[0]?.model, cores: os.cpus().length, headless: true, browser: args.browser }, runs, comparisons, pass, comparisonApproved: false });
console.log(JSON.stringify({ complete: runs.length, valid: runs.filter(r => r.summary?.valid).length, comparisons }));
if (!pass) process.exitCode = 1;
