import assert from 'node:assert/strict';

// Actual pointer/keyboard controls; only the approved DEV clock and read-only
// snapshot are evaluated. No setters, HP edits, forced spawn or fake DOM events.
export async function runFinalGuiChecks({ page, url, viewport, zoom, twinName, capture, saveSnapshot }) {
  const records = [];
  const snapshot = async label => { const value = await page.evaluate(() => window.__GEOGUARD_ART_QA__.snapshot()); await saveSnapshot(label, value); return value; };
  const reset = mode => page.evaluate(mode => window.__GEOGUARD_ART_QA__.reset({ seed: 1729, mode }), mode);
  const step = frames => page.evaluate(frames => window.__GEOGUARD_ART_QA__.step({ frames, dt: 1 / 60 }), frames);
  const drag = async (card, x, y, label, cancelAt = null, whileHeld = null) => {
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox(); assert.ok(box);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    if (whileHeld) await whileHeld();
    await page.mouse.move(x, y, { steps: 12 }); await capture(`${label}-ghost`);
    const held = await snapshot(`${label}-held`);
    if (cancelAt) await page.mouse.move(cancelAt.x, cancelAt.y, { steps: 12 });
    await page.mouse.up();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    return { held, after: await snapshot(`${label}-after`) };
  };
  await page.goto(url);
  await page.getByRole('button', { name: '开始游戏', exact: true }).click();
  await page.waitForFunction(() => window.__GEOGUARD_ART_QA__ && window.__GEOGUARD_ART_INSPECT__().art.status === 'ready');
  const intro = page.getByRole('button', { name: '我知道了', exact: true }); if (await intro.isVisible()) await intro.click();
  await reset('normal');
  const initial = await snapshot('normal-reset');
  assert.equal(initial.art.availableIds.length, 48);
  const basic = page.locator('[data-tower-card="BASIC"]');
  await basic.waitFor();
  const bar = await page.locator('[data-build-scroll]').boundingBox(); assert.ok(bar);
  // I06: reset again while the same BuildBar remains mounted; never resize to
  // accidentally repair its stale rectangle before testing return-to-bar.
  await reset('normal');
  const beforeCancel = await snapshot('I06-before');
  const canceled = await drag(basic, viewport.width / 2 + 120, viewport.height / 2, 'I06', { x: bar.x + 20, y: bar.y + bar.height / 2 });
  assert.equal(canceled.after.semantic.state.money, beforeCancel.semantic.state.money);
  assert.equal(canceled.after.semantic.state.towers.length, beforeCancel.semantic.state.towers.length);
  assert.equal(canceled.after.semantic.state.dragPlacement.active, false);
  // The approved fix reads the mounted DOM rectangle at commit. A null old
  // runtime cache is allowed; outcome and the real DOM rect are the oracle.
  assert.ok((await page.locator('[data-build-scroll]').boundingBox())?.width > 0);
  records.push({ id: 'I06', status: 'pass', evidence: ['I06-before', 'I06-held', 'I06-after'] });
  const target = { x: viewport.width / 2 + 120, y: viewport.height / 2 };
  const built = await drag(basic, target.x, target.y, 'build');
  const tower = built.after.semantic.state.towers.at(-1), ghost = built.held.semantic.state.dragPlacement;
  assert.ok(tower); assert.equal(tower.x, ghost.worldX); assert.equal(tower.y, ghost.worldY);
  const camera = built.held.semantic.state.camera;
  assert.ok(Math.abs(tower.x - (camera.x + (target.x - viewport.width / 2) / zoom)) < 1e-7);
  assert.ok(Math.abs(tower.y - (camera.y + (target.y - viewport.height / 2) / zoom)) < 1e-7);
  assert.equal(built.after.semantic.state.money, beforeCancel.semantic.state.money - 15);
  const overlap = await drag(basic, target.x, target.y, 'overlap');
  assert.equal(overlap.after.semantic.state.towers.length, 1); assert.equal(overlap.after.semantic.state.money, built.after.semantic.state.money);
  const insufficient = await drag(page.locator('[data-tower-card="SNIPER"]'), viewport.width / 2 - 130, viewport.height / 2, 'insufficient');
  assert.equal(insufficient.after.semantic.state.towers.length, 1); assert.equal(insufficient.after.semantic.state.money, built.after.semantic.state.money);
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const paused = await snapshot('paused'); const blocked = await step(60);
  assert.equal(blocked.advancedFrames, 0); assert.equal(blocked.blocked, 'paused');
  assert.equal((await snapshot('paused-after-step')).semantic.state.gameTime, paused.semantic.state.gameTime);
  await page.getByRole('button', { name: '继续游戏', exact: true }).click();
  await page.keyboard.down('d'); await step(30); await page.keyboard.up('d');
  assert.ok((await snapshot('resumed')).semantic.state.player.x > paused.semantic.state.player.x);
  records.push({ id: 'normal-pointer-and-pause', status: 'pass' });
  await reset('debug');
  const expand = page.getByRole('button', { name: 'Expand', exact: true }); if (await expand.isVisible()) await expand.click();
  await page.getByRole('button', { name: 'Bosses', exact: true }).click();
  const twins = page.getByText(twinName, { exact: true }).first();
  const twinDrag = await drag(twins, viewport.width / 2 + 150, viewport.height * .62, 'I07', null, async () => {
    await page.getByRole('button', { name: 'Collapse', exact: true }).focus(); await page.keyboard.press('Enter');
  });
  assert.deepEqual(twinDrag.held.art.fallbackArtIds, [], 'I07: no fallback while twin ghost is held');
  assert.deepEqual(twinDrag.after.art.fallbackArtIds, [], 'No default-path fallback after release');
  const members = twinDrag.after.semantic.state.enemies.filter(e => e.isBoss && ['sun', 'moon'].includes(e.twinRole));
  assert.equal(members.length, 2);
  assert.ok(twinDrag.after.presentation.actors.some(a => a.artId === 'boss:TWINS_SUN'));
  assert.ok(twinDrag.after.presentation.actors.some(a => a.artId === 'boss:TWINS_MOON'));
  records.push({ id: 'I07', status: 'pass', evidence: ['I07-held', 'I07-after'] });
  return { scope: 'Real pointer + approved DEV clock; no normal boss-reward/end certification', records, remaining: ['all nine cards via real scroll', 'camera-offset and resize round trip', 'normal boss reward chain and each reward position/count/type', 'death/end/restart', 'blur visibility pause'] };
}
