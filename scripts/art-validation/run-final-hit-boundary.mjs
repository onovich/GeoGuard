import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { argsMap, writeJSON } from './common.mjs';
import { verifyFinalLock } from './final-lock.mjs';
import { detectSharedObjects } from './final-inputs.mjs';
import { loadEngine } from './scene-kit.mjs';
import { createFinalSession, dismissIntro, collapseDebug, dragDebugCard } from './final-session.mjs';

const args = argsMap(), lock = verifyFinalLock(path.resolve(args.lock), args['lock-sha']), out = path.resolve(args.out);
if (fs.existsSync(out)) throw new Error('New boundary evidence directory required');
fs.mkdirSync(out, { recursive: true });
const engine = await loadEngine(p => import(pathToFileURL(path.join(lock.sourceRoot, 'src', p)).href));
const { createPresentationRuntime } = await import(pathToFileURL(path.join(lock.sourceRoot, 'src/view/art/integration/presentationRuntime.js')).href);
const moduleCases = [];
for (const towerId of ['BASIC', 'CANNON', 'SNIPER', 'BURST']) {
  const state = engine.state.createRuntimeState(), presentation = createPresentationRuntime({ getTowerFireRateFactor: engine.offense.getTowerFireRateFactor });
  const tower = engine.towers.createPlacedTower({ tower: engine.levels.buildTowerAtLevel(state.towerCatalog.find(t => t.id === towerId), 0), uid: 41, x: 0, y: 0 }); tower.lastShoot = tower.fireRate; state.towers = [tower];
  const points = towerId === 'CANNON' ? [[5, 0], [5, 25]] : towerId === 'SNIPER' ? [[5, 0], [10, 0], [15, 0]] : [[5, 0]];
  state.enemies = points.map(([x, y], i) => ({ id: 'TANK', uid: i + 1, x, y, radius: 2, hp: 1e6, maxHp: 1e6, slowRatio: 1, slowTimer: 0 }));
  engine.offense.updateTowerOffenseRuntime({ state, dt: 1 / 60, spawnParticle() {} });
  const born = [...state.projectiles]; presentation.captureShots(state, 0);
  engine.frame.updateProjectileRuntime({ state, dt: 1 / 60, damageEnemy(enemy, amount, projectile) { Object.assign(enemy, engine.rules.resolveEnemyDamage(enemy, amount)); presentation.captureHit(state, enemy, projectile); }, spawnFloatingText() {}, spawnParticle() {}, spawnImpactWave() {} });
  const prepared = presentation.prepare(state, { width: 1440, height: 900, dpr: 1 }, { x: 0, y: 0 }, false);
  const drawingDto = { frame: prepared.frame, actors: prepared.actors.map(entry => entry.actor), retired: prepared.retired, items: prepared.items, hazards: prepared.hazards, links: prepared.links };
  const overlap = detectSharedObjects(state, drawingDto); assert.deepEqual(overlap, []);
  const eventsBefore = structuredClone(presentation.inspect().events), drawingBefore = JSON.stringify(drawingDto);
  for (const projectile of born) { projectile.sourceUid = -1; projectile.sourceArtId = 'mutation-probe'; projectile.shotIndex = 999; projectile.x += 1234; projectile.vx += 555; projectile.hitEnemies?.clear(); }
  assert.deepEqual(presentation.inspect().events, eventsBefore); assert.equal(JSON.stringify(drawingDto), drawingBefore);
  const hits = eventsBefore.filter(e => e.type === 'hit'); assert.ok(hits.length > 0);
  assert.ok(hits.every(e => e.sourceArtId === `tower:${towerId}` && e.sourceKey.endsWith('/tower/41')));
  if (towerId === 'BURST') assert.deepEqual(hits.map(e => e.shotIndex), [3, 2, 1, 0]);
  presentation.reset(engine.state.createRuntimeState()); assert.equal(presentation.inspect().events.length, 0); assert.equal(presentation.inspect().actors.length, 0);
  moduleCases.push({ towerId, hits, sharedReferences: overlap, originalMutationDidNotChangeEventsOrDrawingDto: true, resetCleared: true });
}
writeJSON(path.join(out, 'production-copy-module.json'), { scope: 'Frozen real presentation module and engine fixture; complements actual hook below, no replacement for GUI', cases: moduleCases });
const session = await createFinalSession({ sourceRoot: lock.sourceRoot, out: path.join(out, 'browser'), browserPath: args.browser });
const { page } = session, cases = [];
try {
  await page.goto(session.url + '?artqa=1'); await page.getByRole('button', { name: '开发测试入口', exact: true }).click(); await dismissIntro(page);
  await page.waitForFunction(() => window.__GEOGUARD_ART_QA__ && window.__GEOGUARD_ART_INSPECT__().art.status === 'ready');
  for (const towerId of ['BASIC', 'CANNON', 'SNIPER', 'BURST']) {
    await page.evaluate(() => window.__GEOGUARD_ART_QA__.reset({ seed: 1729, mode: 'debug' })); await collapseDebug(page);
    const card = page.locator(`[data-tower-card="${towerId}"]`); await card.scrollIntoViewIfNeeded(); const box = await card.boundingBox(); assert.ok(box);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(870, 450, { steps: 5 }); await page.mouse.up();
    const positions = towerId === 'CANNON' ? [[140, 0], [140, 40]] : towerId === 'SNIPER' ? [[300, 0], [330, 0], [360, 0]] : [[140, 0]];
    for (const [x, y] of positions) await dragDebugCard(page, { label: '重装兵', x: Math.round(720 + x * 1.25), y: Math.round(450 + y * 1.25) });
    let snapshot, hitEvents;
    for (let frame = 0; frame < 240; frame++) {
      await page.evaluate(() => window.__GEOGUARD_ART_QA__.step({ frames: 1, dt: 1 / 60 }));
      snapshot = await page.evaluate(() => window.__GEOGUARD_ART_QA__.snapshot());
      hitEvents = snapshot.eventLog.filter(e => e.type === 'hit' && e.sourceArtId === `tower:${towerId}`);
      if (hitEvents.length >= (towerId === 'BURST' ? 4 : positions.length)) break;
    }
    const shots = snapshot.eventLog.filter(e => e.type === 'shot' && e.sourceArtId === `tower:${towerId}`);
    const shotKeys = new Set(shots.map(e => e.projectileKey));
    writeJSON(path.join(out, towerId + '-actual-hook.json'), snapshot);
    assert.ok(hitEvents.length >= positions.length, `${towerId} actual hits missing`); assert.ok(hitEvents.every(e => shotKeys.has(e.projectileKey)));
    if (towerId === 'BURST') assert.deepEqual(hitEvents.slice(0, 4).map(e => e.shotIndex), [3, 2, 1, 0]);
    assert.deepEqual(snapshot.art.fallbackArtIds, []); assert.deepEqual(snapshot.presentation.errors, []);
    await page.screenshot({ path: path.join(out, towerId + '-actual-hook.png') }); writeJSON(path.join(out, towerId + '-actual-hook.json'), snapshot);
    cases.push({ towerId, scope: 'Real GUI tower/enemy placement then actual hook update via approved clock; no runtime mutation', hits: hitEvents, shots, pass: true });
  }
} catch (error) { cases.push({ pass: false, error: String(error.stack ?? error) }); await page.screenshot({ path: path.join(out, 'failure.png') }).catch(() => {}); }
finally { await session.close(); verifyFinalLock(path.resolve(args.lock), args['lock-sha']); writeJSON(path.join(out, 'report.json'), { moduleCases: moduleCases.length, actualHookCases: cases, errors: session.errors, pass: cases.length === 4 && cases.every(c => c.pass) && !session.errors.length }); }
