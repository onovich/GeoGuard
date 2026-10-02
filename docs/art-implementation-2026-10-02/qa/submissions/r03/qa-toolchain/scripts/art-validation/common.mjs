import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const BASELINE = '23ce1a33d0a72674286d67ba80c8f7b1260153e2';
export const DEFAULT_OUT = path.join(ROOT, 'docs/art-implementation-2026-10-02/qa/submissions/r02');
export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
export const fileHash = file => sha256(fs.readFileSync(file));
export const normalizedTextHash = file => sha256(fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n'));
export function writeJSON(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}
export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.error || result.status !== 0) throw new Error(`${command} ${args.join(' ')}: ${result.error ?? result.stderr ?? result.status}`);
  return result.stdout;
}
export function argsMap(args = process.argv.slice(2)) {
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i]?.startsWith('--') || args[i + 1] === undefined) throw new Error('Expected --name value pairs');
    result[args[i].slice(2)] = args[i + 1];
  }
  return result;
}
export function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
export function sourceManifest(root) {
  return ['src', 'scripts/player-sim', 'tests'].flatMap(p => walk(path.join(root, p)))
    .concat(['scripts/boss-simulation.mjs', 'package.json', 'package-lock.json', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js', 'index.html'].map(p => path.join(root, p)).filter(fs.existsSync))
    .filter(p => !path.basename(p).startsWith('art-')).sort().map(p => ({ path: path.relative(root, p).replaceAll('\\', '/'), sha256: fileHash(p), normalizedTextSha256: normalizedTextHash(p), normalization: 'CRLF to LF only; no whitespace/token edits', bytes: fs.statSync(p).size }));
}
export function compareManifests(before, after) {
  const a = new Map(before.map(f => [f.path, f])), b = new Map(after.map(f => [f.path, f]));
  return [...new Set([...a.keys(), ...b.keys()])].sort().filter(p => a.get(p)?.sha256 !== b.get(p)?.sha256).map(p => ({ path: p, before: a.get(p)?.sha256 ?? null, after: b.get(p)?.sha256 ?? null,
    normalizedBefore: a.get(p)?.normalizedTextSha256 ?? null, normalizedAfter: b.get(p)?.normalizedTextSha256 ?? null,
    kind: a.get(p)?.normalizedTextSha256 && a.get(p)?.normalizedTextSha256 === b.get(p)?.normalizedTextSha256 ? 'line_endings_only' : 'content_change_or_unavailable_normalization' }));
}
