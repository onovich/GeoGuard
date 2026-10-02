import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { ROOT, argsMap, fileHash, writeJSON } from './common.mjs';
import { candidateManifest, candidateFingerprint, reusableLogicEvidence, verifyFinalLock } from './final-lock.mjs';
const out = path.resolve(argsMap().out), root = path.join(out, 'candidate');
const approved = 'f353ca072173dfb8e63f4b06506f0e4ad345cecc276fab8bfedf163d18ec3ac6';
const integration = path.join(ROOT, 'docs/art-implementation-2026-10-02/integration/submissions/r05');
assert.equal(fileHash(path.join(integration, 'packet.json')), '16628f7a2513088f112655618d8301b8f3553990c3f39b8b7bcf79faf652ff30');
const packet = JSON.parse(fs.readFileSync(path.join(integration, 'packet.json')));
for (const file of packet.files) assert.equal(fileHash(path.join(integration, file.path)), file.sha256, file.path);
const files = candidateManifest(path.join(integration, 'source-final'));
assert.equal(files.length, 880); assert.equal(candidateFingerprint(files), approved);
assert.equal(candidateFingerprint(candidateManifest(ROOT)), approved, 'Active source is not the approved candidate');
if (fs.existsSync(root)) throw new Error('Refusing to overwrite an existing final snapshot');
for (const file of files) {
  const target = path.join(root, file.path); fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(integration, 'source-final', file.path), target); fs.chmodSync(target, 0o444);
}
assert.equal(candidateFingerprint(candidateManifest(root)), approved);
const inputSource = path.join(ROOT, 'docs/art-implementation-2026-10-02/characters/submissions/r04/qa-action-inputs-375.json');
const inputPath = path.join(out, 'frozen-inputs/qa-action-inputs-375.json');
fs.mkdirSync(path.dirname(inputPath), { recursive: true }); fs.copyFileSync(inputSource, inputPath); fs.chmodSync(inputPath, 0o444);
const reviewPath = path.join(ROOT, 'docs/art-implementation-2026-10-02/reviews/integration-r05.md');
const lock = { schemaVersion: 1, status: 'approved_frozen', createdAt: new Date().toISOString(), sourceRoot: root, sourceFingerprint: approved, files, worldZoom: 1.25,
  authority: { reviewPath, reviewSha256: fileHash(reviewPath), integrationPacketSha256: fileHash(path.join(integration, 'packet.json')), verifiedPacketFiles: packet.files.length },
  inputs: { path: inputPath, sha256: fileHash(inputPath), producerPath: inputSource, characterPacketSha256: '29b0c819836463d6712e26b13947953ad50b61b49347d97c0a1ff75d7ef542c3' } };
const lockPath = path.join(out, 'candidate-lock.json'); writeJSON(lockPath, lock);
const lockSha256 = fileHash(lockPath); verifyFinalLock(lockPath, lockSha256);
const logic = reusableLogicEvidence(root, JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/art-implementation-2026-10-02/qa/submissions/r03/logic-freeze.json'))));
assert.equal(logic.reusable, true);
const prepPath = path.join(out, 'PREPARATION.json'), prep = JSON.parse(fs.readFileSync(prepPath));
writeJSON(prepPath, { ...prep, status: 'approved_frozen_final_checks_starting', lockPath, lockSha256, sourceFingerprint: approved, primaryOnlyReceipt: true, priorLogic: logic, performance: 'waiting_for_UI_sampling_to_finish', finalSealed: false });
console.log(JSON.stringify({ lockPath, lockSha256, sourceFingerprint: approved, files: files.length, verifiedIntegrationFiles: packet.files.length, reviewSha256: lock.authority.reviewSha256, logic }));
