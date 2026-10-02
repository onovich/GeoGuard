import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { argsMap, writeJSON, fileHash } from './common.mjs';

const args = argsMap(), inputDir = path.resolve(args.input), out = path.resolve(args.out);
if (fs.existsSync(out)) throw new Error('New contact directory required'); fs.mkdirSync(out, { recursive: true });
const rows = fs.readFileSync(path.join(inputDir, 'samples.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
const source = rows.filter(r => r.kind === 'action' && r.scale === 'source' && r.status === 'captured_unreviewed');
const keys = [...new Set(source.map(r => r.key))]; if (keys.length !== 375) throw new Error(`Expected375 exact keys, got${keys.length}`);
const choose = list => list.find(r => /\/0\.5$/.test(r.label)) ?? list[Math.floor(list.length / 2)];
const representatives = keys.map(key => choose(source.filter(r => r.key === key)));
const runtime = [...new Set(source.map(r => r.actor.artId))].map(artId => {
  const all = rows.filter(r => r.kind === 'action' && r.scale === 'runtime' && r.actor.artId === artId);
  const neutral = all.filter(r => /NEUTRAL|IDLE|INTACT/.test(r.key.split('/')[1]));
  return choose(neutral.length ? neutral : all);
});
const risks = source.filter(r => /enemy:SCOUT|tower:SENTINEL|boss:FORTRESS/.test(r.key) || /OPEN|DIR_LEFT|DIR_UP/.test(r.key) && /boss:/.test(r.key));
const pages = [], index = [];
const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
for (const [family, selected] of [['references-375', representatives], ['runtime-48', runtime], ['risk-transitions', risks]]) for (let start = 0; start < selected.length; start += 20) {
  const slice = selected.slice(start, start + 20), name = `${family}-${String(start / 20 + 1).padStart(2, '0')}`;
  const tiles = slice.map((r, i) => {
    const original = path.join(inputDir, r.screenshot.file); if (fileHash(original) !== r.screenshot.sha256) throw new Error(`Original changed: ${original}`);
    const data = fs.readFileSync(original).toString('base64');
    index.push({ family, contact: name + '.png', cell: i + 1, key: r.key, sampleId: r.id, label: r.label, scale: r.scale, originalPath: original, originalSha256: r.screenshot.sha256, visualStatus: 'not_reviewed' });
    return `<figure><img src="data:image/png;base64,${data}" width="256" height="256"><figcaption>${escape(r.key)}<br>${escape(r.label)} · ${escape(r.id)}</figcaption></figure>`;
  }).join('');
  const html = `<!doctype html><meta charset="utf-8"><title>${name}</title><style>*{box-sizing:border-box}body{margin:0;padding:8px;background:#efe8df;color:#30251d;font:12px system-ui}h1{font-size:18px;margin:4px 0 8px}main{display:grid;grid-template-columns:repeat(5,256px);gap:8px}figure{margin:0;background:#fff9ef;width:256px}img{display:block;width:256px;height:256px}figcaption{height:44px;padding:3px;font-size:10px;overflow-wrap:anywhere;overflow:hidden}</style><h1>${name} — original browser PNGs, 1:1 pixels, layout only</h1><main>${tiles}</main>`;
  fs.writeFileSync(path.join(out, name + '.html'), html, 'utf8'); pages.push({ name, tiles: slice.length, height: 50 + Math.ceil(slice.length / 5) * 308 });
}
const { chromium } = createRequire(import.meta.url)(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const browser = await chromium.launch({ headless: true, executablePath: args.browser });
try {
  const page = await browser.newPage({ viewport: { width: 1328, height: 1300 }, deviceScaleFactor: 1 });
  for (const item of pages) { await page.setViewportSize({ width: 1328, height: item.height }); await page.goto(pathToFileURL(path.join(out, item.name + '.html')).href); await page.locator('img').evaluateAll(images => Promise.all(images.map(i => i.decode()))); await page.screenshot({ path: path.join(out, item.name + '.png'), fullPage: true }); item.sha256 = fileHash(path.join(out, item.name + '.png')); }
} finally { await browser.close(); }
writeJSON(path.join(out, 'index.json'), { provenance: 'Composition only of SHA-verified actual output PNGs at exactly256x256; original pixels/files unchanged; no new art, recolor, crop or generated substitute', exactReferenceKeys: keys.length, pages, index, visualApproval: false });
console.log(JSON.stringify({ pages: pages.length, referenceKeys: keys.length, indexedCells: index.length }));
