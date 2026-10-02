import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { argsMap, writeJSON } from './common.mjs';
import { verifyFinalLock } from './final-lock.mjs';
import { createFinalSession, dismissIntro, collapseDebug, dragDebugCard } from './final-session.mjs';
import { installRafProbe, beginRafProbe, readRafProbe, summarizeRafProbe } from './final-performance.mjs';

const args = argsMap(), lock = verifyFinalLock(path.resolve(args.lock), args['lock-sha']), out = path.resolve(args.out);
if (fs.existsSync(out)) throw new Error('New follow-up directory required');
const session = await createFinalSession({ sourceRoot: lock.sourceRoot, out, browserPath: args.browser, dpr: 2, densityObservation: true });
const { page } = session, trace = [], hitEvents = new Map(), shotEvents = new Map();
const snap = () => page.evaluate(() => window.__GEOGUARD_ART_QA__.snapshot());
const ids = ['BASIC', 'CANNON', 'SNIPER', 'RAPID', 'MORTAR', 'FROST', 'RAIL', 'BURST', 'SENTINEL'];
const placements = ids.map((id, i) => ({ id, x: Math.round(Math.cos(i / ids.length * Math.PI * 2) * 150), y: Math.round(Math.sin(i / ids.length * Math.PI * 2) * 150) }));
async function build(tower) {
  const card = page.locator(`[data-tower-card="${tower.id}"]`); await card.scrollIntoViewIfNeeded(); const box = await card.boundingBox(); assert.ok(box);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(Math.round(720 + tower.x * 1.25), Math.round(450 + tower.y * 1.25), { steps: 4 }); await page.mouse.up();
  trace.push({ at: Date.now(), operation: 'real-GUI-build-or-replenish', ...tower });
}
async function feed(cycle, tanks) {
  for (let i = 0; i < tanks; i++) await dragDebugCard(page, { label: '重装兵', x: 720 + (i % 2 ? 10 : -10), y: 450 });
  const label = cycle % 2 ? '冰环审判者' : '蜂巢建筑师';
  const bossX = cycle % 2 ? 110 : 1330;
  await dragDebugCard(page, { label, boss: true, x: bossX, y: 440 });
  trace.push({ at: Date.now(), operation: 'real-GUI-target-feed', tanks, boss: label, bossScreen: [bossX, 440], location: 'regular targets near invulnerable debug player; bosses beyond tower ring so real warnings can resolve before defeat' });
}
let report;
try {
  await page.goto(session.url + '?artqa=1'); await page.getByRole('button', { name: '开发测试入口', exact: true }).click(); await dismissIntro(page);
  await page.waitForFunction(() => window.__GEOGUARD_ART_QA__ && window.__GEOGUARD_ART_INSPECT__().art.status === 'ready');
  await page.evaluate(() => window.__GEOGUARD_ART_QA__.reset({ seed: 1729, mode: 'debug' })); await collapseDebug(page);
  for (const tower of placements) await build(tower);
  for (let i = 0; i < 3; i++) await feed(i, 6);
  const setup = await snap(); assert.equal(setup.semantic.state.towers.length, 9); assert.ok(setup.semantic.state.enemies.length >= 20);
  writeJSON(path.join(out, 'setup.json'), setup); await page.screenshot({ path: path.join(out, 'setup.png') });
  await page.evaluate(() => window.__GEOGUARD_ART_QA__.release());
  await installRafProbe(page); const begin = await beginRafProbe(page); assert.equal(begin.manual, false);
  let cycle = 0, observedTypes = new Set(), hazardScreens = [];
  while (true) {
    const snapshot = await snap();
    // DEV bridge eventLog collects in manual RNG scopes; after release use the
    // genuine live presentation events, copied by the approved inspector.
    const liveEvents = snapshot.presentation.events;
    for (const event of liveEvents) { if (event.type === 'hit') hitEvents.set(event.eventId, event); if (event.type === 'shot') shotEvents.set(event.eventId, event); }
    fs.appendFileSync(path.join(out, 'live-event-observations.jsonl'), JSON.stringify({ gameTime: snapshot.semantic.state.gameTime, manual: snapshot.control.manual, events: liveEvents }) + '\n');
    for (const tower of snapshot.semantic.state.towers) observedTypes.add(tower.id);
    if ((await readRafProbe(page)).done) break;
    // Keep a real combat workload alive via the original GUI; actor stats and
    // default AI stay untouched. Input/setup costs remain inside the RAF sample.
    for (const placement of placements) if (!snapshot.semantic.state.towers.some(t => t.id === placement.id)) await build(placement);
    await feed(cycle++, 4); await page.waitForTimeout(1000);
    console.log(JSON.stringify({ crossfireCycle: cycle, observedHits: hitEvents.size, observedShots: shotEvents.size, liveTowers: snapshot.semantic.state.towers.length, hazards: snapshot.semantic.state.hazards.length }));
  }
  const probe = await readRafProbe(page), summary = summarizeRafProbe(probe);
  let final = await snap();
  await page.screenshot({ path: path.join(out, 'after-measurement.png') });
  // Capture an attributable real hazard after measurement, avoiding screenshot
  // stalls in the measured interval. Preserve actual state and this timing.
  for (let attempt = 0; attempt < 8 && !final.semantic.state.hazards.length; attempt++) { await feed(cycle++, 2); await page.waitForTimeout(700); final = await snap(); }
  if (final.semantic.state.hazards.length) { await page.screenshot({ path: path.join(out, 'post-measurement-hazard.png') }); hazardScreens.push({ file: 'post-measurement-hazard.png', gameTime: final.semantic.state.gameTime, state: 'post-measurement-hazard.json', timing: 'after measured interval, same real GUI-fed encounter' }); writeJSON(path.join(out, 'post-measurement-hazard.json'), final); }
  writeJSON(path.join(out, 'raf-and-density.json'), probe); writeJSON(path.join(out, 'gui-trace.json'), trace); writeJSON(path.join(out, 'actual-final.json'), final); writeJSON(path.join(out, 'actual-events.json'), { shots: [...shotEvents.values()], hits: [...hitEvents.values()] });
  report = { scope: 'Targeted 1440x900 DPR2 sustained real GUI combat; 10s warmup+60s actual RAF/game update', summary, towersObserved: [...observedTypes], hitEvents: hitEvents.size, shotEvents: shotEvents.size, hazardScreens, transformed: session.transformed, browserVersion: session.browserVersion,
    limitations: ['Manual bridge used only to assemble real-GUI fixtures before release; manual=false during measurement.', 'Infinite player HP/money are actual debug options; default tower/enemy HP, AI, attacks and damage unchanged.', 'Real GUI replenishes missing towers and continually introduces targets because a static setup naturally ends; GUI input and read-only observation costs are included.', 'Hit/shot counts are observed lower bounds from copied live presentation event windows, not exhaustive damage totals.', 'No direct old/new ratio is claimed for this targeted DPR2 crossfire run.'],
    art: final.art, errors: session.errors, pass: summary.valid && summary.distributions.towers.p50 > 0 && summary.distributions.projectiles.p95 > 0 && summary.hazardFramesObserved > 0 && hitEvents.size > 0 && shotEvents.size > 0 && observedTypes.size === 9 && !session.errors.length && final.art.fallbackArtIds.length === 0 };
} catch (error) { report = { pass: false, error: String(error.stack ?? error), errors: session.errors }; await page.screenshot({ path: path.join(out, 'failure.png') }).catch(() => {}); }
finally { await session.close(); verifyFinalLock(path.resolve(args.lock), args['lock-sha']); writeJSON(path.join(out, 'report.json'), report); }
console.log(JSON.stringify({ pass: report.pass, summary: report.summary, hits: report.hitEvents, shots: report.shotEvents, towers: report.towersObserved, error: report.error }));
if (!report.pass) process.exitCode = 1;
