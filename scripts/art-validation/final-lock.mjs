import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { walk, sha256, fileHash, sourceManifest, compareManifests } from './common.mjs';

export function candidateManifest(root) {
  return [...walk(path.join(root, 'src')), ...walk(path.join(root, 'public')), ...['index.html', 'package.json', 'package-lock.json', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js'].map(p => path.join(root, p)).filter(fs.existsSync)]
    .sort().map(p => ({ path: path.relative(root, p).replaceAll('\\', '/'), sha256: fileHash(p), bytes: fs.statSync(p).size }));
}
export const candidateFingerprint = files => sha256(JSON.stringify(files));
export function verifyFinalLock(lockPath, expectedLockSha) {
  assert.match(expectedLockSha ?? '', /^[a-f0-9]{64}$/i, 'Explicit primary-issued lock SHA required');
  assert.equal(fileHash(lockPath), expectedLockSha, 'Lock SHA mismatch');
  const lock = JSON.parse(fs.readFileSync(lockPath));
  assert.equal(lock.status, 'approved_frozen');
  assert.ok(path.isAbsolute(lock.sourceRoot), 'Frozen source root must be absolute');
  assert.equal(fileHash(lock.authority.reviewPath), lock.authority.reviewSha256);
  const actual = candidateManifest(lock.sourceRoot);
  assert.deepEqual(actual, lock.files, 'Frozen source/assets differ');
  assert.equal(candidateFingerprint(actual), lock.sourceFingerprint);
  assert.equal(fileHash(lock.inputs.path), lock.inputs.sha256, 'Producer input changed');
  return lock;
}
export function reusableLogicEvidence(sourceRoot, previousFreeze) {
  const current = sourceManifest(sourceRoot).filter(f => previousFreeze.scope.some(s => f.path.startsWith(s + '/')));
  const changes = compareManifests(previousFreeze.candidateManifest, current);
  return { reusable: changes.length === 0, changes, action: changes.length ? 'primary_review_required_do_not_automatically_rerun' : 'reference_approved_r03_no_rerun' };
}
