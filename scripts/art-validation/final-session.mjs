import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { ROOT, sha256 } from './common.mjs';
import { instrumentDensityObservation } from './final-performance.mjs';

export async function createFinalSession({ sourceRoot, out, browserPath, base = '/', dpr = 1, width = 1440, height = 900, densityObservation = false }) {
  const transformed = [], errors = [], requests = [];
  const config = (await import(pathToFileURL(path.join(sourceRoot, 'tailwind.config.js')).href)).default;
  fs.mkdirSync(out, { recursive: true });
  const server = await createServer({ root: sourceRoot, base, configFile: false, logLevel: 'error', cacheDir: path.join(out, 'vite-cache'),
    css: { postcss: { plugins: [tailwindcss({ ...config, content: [path.join(sourceRoot, 'index.html'), path.join(sourceRoot, 'src/**/*.{js,jsx}')].map(p => p.replaceAll('\\', '/')) }), autoprefixer()] } },
    plugins: [densityObservation && { name: 'read-only-density', enforce: 'pre', transform(code, id) {
      if (!id.replaceAll('\\', '/').endsWith('/src/view/canvas/canvasRenderer.js')) return null;
      const output = instrumentDensityObservation(code);
      transformed.push({ path: id, sourceSha256: sha256(code), servedSha256: sha256(output), method: 'same read-only primitive count/geometry sampler both versions; no file writes' });
      return { code: output, map: null };
    } }, react()].filter(Boolean), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null, fs: { allow: [ROOT, sourceRoot] } } });
  await server.listen();
  const require = createRequire(import.meta.url), { chromium } = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
  let browser;
  try { browser = await chromium.launch({ headless: true, executablePath: browserPath }); }
  catch (error) { await server.close(); throw error; }
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
  page.on('pageerror', error => errors.push(String(error.stack ?? error)));
  page.on('requestfailed', request => requests.push({ url: request.url(), failure: request.failure() }));
  const url = `http://127.0.0.1:${server.httpServer.address().port}${base}`;
  return { page, browser, browserVersion: browser.version(), url, errors, requests, transformed, close: async () => { await browser.close(); await server.close(); } };
}
export async function dismissIntro(page) {
  const collapse = page.getByRole('button', { name: 'Collapse', exact: true }); if (await collapse.isVisible()) await collapse.click();
  const intro = page.getByRole('button', { name: '我知道了', exact: true }); if (await intro.isVisible()) await intro.click();
}
export async function expandDebug(page) { const button = page.getByRole('button', { name: 'Expand', exact: true }); if (await button.isVisible()) await button.click(); }
export async function collapseDebug(page) { const button = page.getByRole('button', { name: 'Collapse', exact: true }); if (await button.isVisible()) await button.click(); }
export async function dragDebugCard(page, { label, boss = false, x, y, hold = false }) {
  await expandDebug(page); await page.getByRole('button', { name: boss ? 'Bosses' : 'Enemies', exact: true }).click();
  const card = page.getByText(label, { exact: true }).first(); await card.scrollIntoViewIfNeeded(); const box = await card.boundingBox();
  if (!box) throw new Error(`Missing actual debug card: ${label}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.getByRole('button', { name: 'Collapse', exact: true }).focus(); await page.keyboard.press('Enter');
  await page.mouse.move(x, y, { steps: 4 }); if (!hold) await page.mouse.up();
}
