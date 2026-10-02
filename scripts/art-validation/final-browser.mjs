import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { ROOT, argsMap, fileHash, writeJSON } from './common.mjs';
import { verifyFinalLock } from './final-lock.mjs';
import { adaptFinalInputs } from './final-inputs.mjs';
import { runFinalGuiChecks } from './final-ui-checks.mjs';

const args = argsMap(), lock = verifyFinalLock(path.resolve(args.lock), args['lock-sha']), out = path.resolve(args.out);
if (fs.existsSync(out)) throw new Error('New run directory required; old failures are immutable');
const base = args.base ?? '/geoguard-qa/';
if (!base.startsWith('/') || !base.endsWith('/') || base.includes('..')) throw new Error('Base must be an absolute URL pathname ending in /');
const mode = args.mode ?? 'characters', sourceRoot = lock.sourceRoot;
const input = JSON.parse(fs.readFileSync(lock.inputs.path));
const actions = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/art-implementation-2026-10-02/qa/submissions/r01/action-coverage.json')));
const skills = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/art-implementation-2026-10-02/qa/submissions/r01/skill-coverage.json')));
const adapted = adaptFinalInputs(input, actions.actions.map(x => x.key), skills.skills.map(x => x.key));
if (adapted.defects.length) throw new Error('Producer input defects must be resolved before sampling');
const selected = adapted.samples.slice(Number(args.start ?? 0), Number(args.start ?? 0) + Number(args.limit ?? adapted.samples.length));
const scriptRoot = path.join(ROOT, 'scripts/art-validation');
const tailwind = (await import(pathToFileURL(path.join(sourceRoot, 'tailwind.config.js')).href)).default;
fs.mkdirSync(out, { recursive: true });
const errors = [], network = [], results = [];
const server = await createServer({ root: sourceRoot, base, configFile: false, cacheDir: path.join(out, 'vite-cache'), logLevel: 'error',
  css: { postcss: { plugins: [tailwindcss({ ...tailwind, content: [path.join(sourceRoot, 'index.html'), path.join(sourceRoot, 'src/**/*.{js,jsx}')].map(p => p.replaceAll('\\', '/')) }), autoprefixer()] } },
  plugins: [react(), { name: 'final-qa-page', configureServer(vite) { vite.middlewares.use((req, res, next) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const marker = '/__finalqa/';
    if (!pathname.includes(marker)) return next();
    const name = pathname.slice(pathname.indexOf(marker) + marker.length);
    if (!['final-browser-page.html', 'final-browser-page.mjs', 'snapshot.mjs'].includes(name)) { res.statusCode = 404; return res.end(); }
    res.setHeader('Content-Type', name.endsWith('.html') ? 'text/html' : 'text/javascript'); res.end(fs.readFileSync(path.join(scriptRoot, name)));
  }); } }], server: { host: '127.0.0.1', port: 0, hmr: false, watch: null, fs: { allow: [sourceRoot, ROOT] } } });
let browser, browserVersion = null;
try {
  await server.listen();
  const require = createRequire(import.meta.url);
  const { chromium } = require(args.playwright ?? path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
  browser = await chromium.launch({ headless: true, executablePath: args.browser }); browserVersion = browser.version();
  const page = await browser.newPage({ viewport: { width: Number(args.width ?? 1440), height: Number(args.height ?? 900) }, deviceScaleFactor: Number(args.dpr ?? 1) });
  page.on('pageerror', error => errors.push(String(error.stack ?? error)));
  page.on('requestfailed', request => network.push({ url: request.url(), failure: request.failure() }));
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  if (mode === 'ui') {
    const encounter = await import(pathToFileURL(path.join(sourceRoot, 'src/logic/engine/encounterRuntime.js')).href);
    if (!(Number(lock.worldZoom) > 0)) throw new Error('Primary lock must specify approved worldZoom for inverse-transform checks');
    const result = await runFinalGuiChecks({ page, url: `${origin}${base}?artqa=1`, viewport: { width: Number(args.width ?? 1440), height: Number(args.height ?? 900) }, zoom: Number(lock.worldZoom), twinName: encounter.getBossEditorBaseTemplate('TWINS').name,
      capture: async name => { await page.screenshot({ path: path.join(out, name + '.png') }); },
      saveSnapshot: async (name, value) => writeJSON(path.join(out, name + '.json'), value) });
    writeJSON(path.join(out, 'gui-checks.json'), result); results.push(...result.records);
  } else {
  await page.goto(`${origin}${base}__finalqa/final-browser-page.html`);
  await page.waitForFunction(() => window.finalArtQA?.ready);
  if (mode === 'characters') for (const sample of selected) {
    try {
      const result = await page.evaluate(s => window.finalArtQA.sample(s), sample);
      const file = `${sample.id}.png`;
      if (result.status === 'captured_unreviewed') await page.locator('canvas').screenshot({ path: path.join(out, file) });
      const row = { id: sample.id, key: sample.key, label: sample.label, scale: sample.scale, kind: sample.kind, archiveOnly: sample.archiveOnly, diagnosticOnly: sample.diagnosticOnly, ...result, screenshot: result.status === 'captured_unreviewed' ? { file, sha256: fileHash(path.join(out, file)) } : null };
      fs.appendFileSync(path.join(out, 'samples.jsonl'), JSON.stringify(row) + '\n'); results.push({ id: row.id, status: row.status });
    } catch (error) { const row = { id: sample.id, key: sample.key, status: 'failed', error: String(error.stack ?? error) }; fs.appendFileSync(path.join(out, 'samples.jsonl'), JSON.stringify(row) + '\n'); results.push(row); }
  }
  else if (mode === 'resources') { const result = await page.evaluate(() => window.finalArtQA.resources()); writeJSON(path.join(out, 'resources.json'), result); results.push({ status: result.pass ? 'resource_checks_pass' : 'failed' }); }
  else throw new Error(`Unsupported mode: ${mode}`);
  }
} catch (error) { errors.push(String(error.stack ?? error)); }
finally {
  await browser?.close(); await server.close();
  let stable = true;
  try { verifyFinalLock(path.resolve(args.lock), args['lock-sha']); } catch (error) { stable = false; errors.push(String(error)); }
  writeJSON(path.join(out, 'report.json'), { status: stable && !errors.length && !results.some(r => r.status === 'failed') ? 'executed_requires_review' : 'failed', scope: mode === 'ui' ? 'partial actual GUI/DEV-clock checks; see explicit remaining flows' : 'isolated actual character renderer/resources, not full hook/DOM', frozenSourceFingerprint: lock.sourceFingerprint, lockSha256: args['lock-sha'], inputSha256: lock.inputs.sha256, base, dpr: Number(args.dpr ?? 1), browserVersion, results, errors, network, stable, visualApproved: false });
  if (!stable || errors.length || results.some(r => r.status === 'failed')) process.exitCode = 1;
}
