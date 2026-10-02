import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ENEMY_RIGS } from '../../../../../src/view/art/characters/enemyRigData.js';

const out = import.meta.dirname, root = path.resolve(out, '../../../../..'), ownerRoot = path.resolve(out, '../..');
const sha = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const record = relative => { const buffer = fs.readFileSync(path.join(root, relative)); return { path: relative.replaceAll('\\', '/'), bytes: buffer.length, sha256: sha(buffer) }; };
const filesIn = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? filesIn(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
if (fs.existsSync(path.join(out, 'packet.json'))) throw new Error('Sealed revision must not be overwritten');
const manifest = read('docs/art-implementation-2026-10-02/enemy-batch/submissions/r02/manifest.json');
const raster = read('docs/art-implementation-2026-10-02/enemy-batch/submissions/r02/raster-audit.json');
const checks = read('docs/art-implementation-2026-10-02/enemy-batch/submissions/r02/sampler-checks.json');
const sourceActions = read('docs/art-implementation-2026-10-02/enemy-batch/submissions/r01/actions.json');
const currentRigs = JSON.stringify(ENEMY_RIGS);
if (Object.keys(ENEMY_RIGS).length !== 12 || Object.keys(manifest).length !== 12) throw new Error('Identity set differs');
if (checks.groupModuleSha256 !== record('src/view/art/characters/enemyRigData.js').sha256) throw new Error('Module changed after export');
if (checks.items.some(i => i.maxRootError > 1e-9 || i.maxCenterError > 1e-9 || i.moveSeamMatrixError > 1e-8 || i.inputMutation)) throw new Error('Sampler audit failed');
const publicBodies = raster.filter(i => i.path.startsWith('public/') && i.width === 256);
if (publicBodies.length !== 108 || publicBodies.some(i => i.touchesCanvasEdge || i.transparentPixels === 0 || i.substantialAlphaComponents !== 1)) throw new Error('Transparent body audit failed');
const actionKeys = Object.values(manifest).flatMap(i => Object.keys(i.actions).map(a => `${i.artId}/${a}`));
if (actionKeys.length !== 67 || new Set(actionKeys).size !== 67 || sourceActions.items.some(i => !actionKeys.includes(i.key))) throw new Error('Action key coverage differs');
const sourceFile = fs.readFileSync(path.join(root, 'src/view/art/characters/enemyRigData.js'), 'utf8');
if (/^import\s/m.test(sourceFile) || !currentRigs || sourceFile.includes('Math.random')) throw new Error('Invalid runtime dependency');
for (const rig of Object.values(ENEMY_RIGS)) {
  if (rig.softPivot.some((v, i) => v !== rig.root[i]) || [...rig.root, ...rig.center, rig.collisionRadius, rig.referenceRadius].some(v => !Number.isFinite(v))) throw new Error('Nonfinite source geometry');
  const allPoses = [rig.shapes, ...Object.values(rig.variants ?? {}).map(v => v.shapes)];
  for (const shapes of allPoses) for (const shape of shapes) {
    if (/(?:eye|mouth|tongue|tooth|cross|lid)/.test(shape.id) && shape.space === 'fixed') throw new Error('Fixed-space face introduced');
  }
}
const moduleFile = 'src/view/art/characters/enemyRigData.js';
const publicDirs = Object.values(manifest).map(i => path.dirname(path.join(root, 'public', i.sourceFile)));
const localDocs = [...filesIn(out), ...filesIn(path.resolve(out, '../r01'))].filter(file => !['packet.json', 'READY', 'READY.json'].includes(path.basename(file)) && !file.endsWith('.tmp'));
const allFiles = [...new Set([path.join(root, moduleFile), ...publicDirs.flatMap(filesIn), ...localDocs])].sort();
const fileRecords = allFiles.map(file => record(path.relative(root, file)));
for (const file of allFiles.filter(f => /\.(?:js|mjs|md|json|svg)$/.test(f))) {
  const bytes = fs.readFileSync(file);
  if (bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191) throw new Error(`BOM present ${file}`);
}
const dependencyPaths = ['docs/art-implementation-2026-10-02/characters/submissions/r03/rig-data-output-contract.md', 'docs/art-implementation-2026-10-02/reviews/character-group-contract.md', 'docs/art-implementation-2026-10-02/integration/submissions/r01/packet.json'];
const packet = {
  schemaVersion: 1, owner: 'enemy-batch', revision: 'r02', status: 'ready_for_review', scope: '12 independent enemy body rigs and transparent editable resources; not runtime integration',
  namedExport: { file: moduleFile, export: 'ENEMY_RIGS', type: 'plain serializable object' },
  dependencies: dependencyPaths.map(record), samplerObservation: { path: checks.samplerPath, sha256: checks.samplerSha256, mode: checks.mode, notRegisteredApiVerification: true },
  counts: { identitiesPrepared: 12, actionMappings: 67, uniqueApprovedBodyConceptCells: 48, finalBodyBoardsActuallyViewed: 7, bodyTransparent256PNGs: 108, icons64PNGs: 12, publicAssetFiles: publicDirs.flatMap(filesIn).length, sampleCases: checks.totalCases, primaryAcceptedIdentities: 0 },
  coveredIdentities: Object.keys(ENEMY_RIGS), coveredActions: actionKeys,
  files: fileRecords,
  tests: { finiteBezierPathsMatrices: 'passed offline export', rootAndCollisionCenterInvariance: 'passed 1620 combinations', zeroInputMutation: 'passed', moveCycleSeam: 'passed tolerance1e-8', untrimmedTransparentBodyCanvas: '108 PNGs at256x256', noRasterCanvasEdgeTouches: true, oneConnectedAlphaBodyPerFrame: true, faceBodyAttachment: 'no fixed-space facial shapes; actual visual inspection recorded', splinterNeutralActionAlphaBottom: 'both y226; zero whole-body translation', bomCheck: 'all text UTF8 without BOM', gameplayIntegration: 'not performed' },
  openIssues: [{ id: 'E01', severity: 'shared-sampler-follow-up', title: 'Static variant entry/exit is not interpolated', evidence: 'submissions/r02/transition-limitations.json and attack-progress-1/2/3.png', owner: 'characters shared rig owner', status: 'reported; group does not modify shared sampler' }],
  limitations: ['Production assets pending primary visual acceptance; accepted count remains zero', 'Shared registry/API playback and live game/device/performance verification belong to combined integration/QA', '1x radius5 SPLINTER and radius8 FAST/SCOUT have limited facial detail; exact size sheet provided without upscale', 'SPLINTER HOP body differs from airborne source cell according to primary precheck; source provenance retained, production approval pending'],
  summary: '12独立轮廓、器官与透明源/动作/小图已制作；SPLINTER改为守住实际底边的上轮廓拉伸；公共接入及连续变体过渡尚待汇总验收。',
};
const packetBytes = Buffer.from(`${JSON.stringify(packet, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(out, 'packet.json.tmp'), packetBytes); fs.renameSync(path.join(out, 'packet.json.tmp'), path.join(out, 'packet.json'));
// Verify every sealed resource before publishing the sole owner pointer.
for (const file of packet.files) if (record(file.path).sha256 !== file.sha256) throw new Error(`File changed during seal ${file.path}`);
const ready = { schemaVersion: 1, owner: 'enemy-batch', revision: 'r02', status: 'ready_for_review', packetPath: 'submissions/r02/packet.json', packetSha256: sha(packetBytes), readyAt: new Date().toISOString(), scope: packet.scope, primaryAcceptedIdentities: 0 };
fs.writeFileSync(path.join(ownerRoot, 'READY.json.tmp'), `${JSON.stringify(ready, null, 2)}\n`, 'utf8');
fs.renameSync(path.join(ownerRoot, 'READY.json.tmp'), path.join(ownerRoot, 'READY.json'));
console.log(JSON.stringify({ packetSha256: ready.packetSha256, files: packet.files.length, identitiesPrepared: 12, statesMapped: 67, primaryAccepted: 0, openIssues: packet.openIssues.map(i => i.id) }));
