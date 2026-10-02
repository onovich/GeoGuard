import fs from 'node:fs';
import path from 'node:path';
import { ROOT, BASELINE, DEFAULT_OUT, argsMap, run, sha256, writeJSON } from './common.mjs';

const args = argsMap();
const dest = path.resolve(args.out ?? path.join(DEFAULT_OUT, 'baseline/node_modules/geoguard-baseline'));
const permitted = path.resolve(DEFAULT_OUT) + path.sep;
if (!dest.startsWith(permitted)) throw new Error('Baseline export must remain in current r02 output boundary');
if (fs.existsSync(path.join(dest, 'baseline-manifest.json'))) throw new Error('Existing baseline export is immutable; verify or select a new empty output directory');
const commit = run('git', ['rev-parse', `${BASELINE}^{commit}`]).trim();
if (commit !== BASELINE) throw new Error('Unexpected baseline commit');
const files = run('git', ['ls-tree', '-r', '--name-only', BASELINE]).trim().split('\n').filter(p => /^(src\/|scripts\/|tests\/|public\/)/.test(p) || /^(package(-lock)?\.json|index\.html|vite\.config\.js|tailwind\.config\.js|postcss\.config\.js)$/.test(p));
const manifest = [];
for (const relative of files) {
  const target = path.resolve(dest, relative);
  if (!target.startsWith(dest + path.sep)) throw new Error('Unsafe git path');
  const bytes = run('git', ['show', `${BASELINE}:${relative}`], { encoding: null });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes);
  manifest.push({ path: relative, sha256: sha256(bytes), bytes: bytes.length });
}
writeJSON(path.join(dest, 'baseline-manifest.json'), { commit, exportedAt: new Date().toISOString(), method: 'read-only git ls-tree/show; no checkout/index/ref changes', sourceRoot: ROOT, files: manifest });
// Keep test-containing export under node_modules so `node --test` does not discover it.
// Vite/React must serve a separate non-node_modules mirror or JSX transforms are skipped.
const browserRoot=path.join(DEFAULT_OUT,'baseline/browser');
if(fs.existsSync(path.join(browserRoot,'baseline-manifest.json')))throw new Error('Browser baseline mirror already exists');
const browserFiles=manifest.filter(f=>!f.path.startsWith('tests/'));
for(const file of browserFiles){const target=path.join(browserRoot,file.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(dest,file.path),target);}
writeJSON(path.join(browserRoot,'baseline-manifest.json'),{commit,method:'byte-for-byte mirror; tests omitted; CSS scanning explicitly rooted here',files:browserFiles});
console.log(JSON.stringify({ commit, exportedFiles: manifest.length, out: dest, browserRoot, browserFiles:browserFiles.length }));
