import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const out = import.meta.dirname, root = path.resolve(out, '../../../../..'), ownerRoot = path.resolve(out, '../..');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const record = relative => { const bytes = fs.readFileSync(path.join(root, relative)); return { path: relative.replaceAll('\\', '/'), sha256: hash(bytes), bytes: bytes.length }; };
if (fs.existsSync(path.join(out, 'packet.json'))) throw new Error('Do not overwrite sealed r04');
const validation = JSON.parse(fs.readFileSync(path.join(out, 'validation.json'), 'utf8'));
const modulePath = 'src/view/art/characters/enemyRigData.js';
const moduleBytes = fs.readFileSync(path.join(root, modulePath));
if (hash(moduleBytes) !== validation.moduleSha256) throw new Error('Source changed after sampling');
if (!validation.other11IdentitiesDeepEqual || !validation.scoutAllOtherFieldsDeepEqual || validation.maxExactSubdivisionCurveError !== 0 || !validation.allThreeEndpointRastersByteIdentical || !validation.attackEntryExitByteIdenticalToNeutral) throw new Error('Repair proof failed');
fs.writeFileSync(path.join(out, 'after-enemyRigData.js'), moduleBytes);
const visual = { method: 'actual functions.view_image inspection after generation', images: ['scout-attack-timeline.png', 'scout-endpoints.png'], observations: ['At p=.25/.75 both feet retain filled sole volume instead of thin brown lines', 'All nine frames have one hood/eye and two connected legs', 'Neutral/crouch/chase endpoint outlines match pre-edit geometry; two-foot midpoint128', 'Actual bottom edge differences are explicitly shown and preserved; no whole-body translation'], status: 'pending_external_primary_review' };
fs.writeFileSync(path.join(out, 'visual-inspection.json'), `${JSON.stringify(visual, null, 2)}\n`, 'utf8');
const docs = fs.readdirSync(out).filter(name => name !== 'packet.json' && !name.endsWith('.tmp')).map(name => record(path.relative(root, path.join(out, name))));
for (const file of docs.filter(f => /\.(?:js|mjs|md|json|svg)$/.test(f.path))) {
  const bytes = fs.readFileSync(path.join(root, file.path));
  if (bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191) throw new Error('BOM found');
}
const packet = { schemaVersion: 1, owner: 'enemy-batch', revision: 'r04', status: 'ready_for_review', scope: 'SCOUT only: four exact C2 subdivisions repair continuous foot correspondence', files: [record(modulePath), ...docs], namedExport: { file: modulePath, name: 'ENEMY_RIGS', unchanged: true }, dependencies: [record('docs/art-implementation-2026-10-02/characters/submissions/r04/path-morph-contract.md'), record('docs/art-implementation-2026-10-02/enemy-batch/submissions/r02/packet.json'), record('docs/art-implementation-2026-10-02/enemy-batch/submissions/r03/packet.json'), record('docs/art-implementation-2026-10-02/reviews/enemy-batch-r02.md')], samplerSnapshot: { path: 'src/view/art/characters/rig.js', sha256: validation.samplerSha256, mode: 'read-only in-memory code snapshot; group data injected; no shared code edit' }, changedPaths: ['SCOUT/crouch/long-leg-left', 'SCOUT/crouch/long-leg-right', 'SCOUT/chase/long-leg-left', 'SCOUT/chase/long-leg-right'], checks: { exactC2SubdivisionMaxError: 0, other11RigsDeepEqual: true, scoutOtherFieldsDeepEqual: true, threeEndpointPngsByteIdentical: true, attackEntryExitPngsByteIdenticalToNeutral: true, nineProgressSamples: true, footJointMeanXAlways128: true, fixedRootAndCollisionCenter: true, noInputMutation: true, minFootSoleFillPixels: Math.min(...validation.samples.flatMap(s => Object.values(s.feet).map(f => f.footBandFillPixels))), noSharedRigRegistryPublicOrOldRevisionWrites: true }, inheritedBodyApproval: 'external enemy-batch-r02.md; this new fix not self-approved', openIssues: [{ id: 'E01-SCOUT', status: 'repair_submitted_for_primary_visual_review', remaining: 'Role owner must reaggregate and QA actual combined playback' }, { id: 'E02-alpha-bottom', status: 'constraint_disclosed_not_changed', detail: 'Original neutral/crouch/chase raster bottoms236/238/234 remain byte-identical. Attack range233..236 reflects local morph; exact all-pose alpha baseline was not claimed. Making all bottoms equal would change approved endpoint contours.' }], summary: '按主审指令只拆SCOUT四条腿的原C2，保端点/器官/关节；九帧脚掌保留填充，实际底边差异如实记录，待复审。' };
const bytes = Buffer.from(`${JSON.stringify(packet, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(out, 'packet.json.tmp'), bytes); fs.renameSync(path.join(out, 'packet.json.tmp'), path.join(out, 'packet.json'));
for (const file of packet.files) if (record(file.path).sha256 !== file.sha256) throw new Error('Changed during sealing');
const ready = { schemaVersion: 1, owner: 'enemy-batch', revision: 'r04', status: 'ready_for_review', scope: packet.scope, packetPath: 'submissions/r04/packet.json', packetSha256: hash(bytes), readyAt: new Date().toISOString(), sourceResourceRevision: 'r02' };
fs.writeFileSync(path.join(ownerRoot, 'READY.json.tmp'), `${JSON.stringify(ready, null, 2)}\n`, 'utf8'); fs.renameSync(path.join(ownerRoot, 'READY.json.tmp'), path.join(ownerRoot, 'READY.json'));
console.log(JSON.stringify({ packetSha256: ready.packetSha256, fileCount: packet.files.length, changedPaths: 4, other11RigsUnchanged: true, endpointRastersIdentical: true, minFootSoleFillPixels: packet.checks.minFootSoleFillPixels }));
