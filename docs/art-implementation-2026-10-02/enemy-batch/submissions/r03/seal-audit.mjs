import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const out = import.meta.dirname, root = path.resolve(out, '../../../../..'), ownerRoot = path.resolve(out, '../..');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const record = relative => { const bytes = fs.readFileSync(path.join(root, relative)); return { path: relative.replaceAll('\\', '/'), sha256: hash(bytes), bytes: bytes.length }; };
if (fs.existsSync(path.join(out, 'packet.json'))) throw new Error('Do not overwrite a sealed audit');
const audit = JSON.parse(fs.readFileSync(path.join(out, 'morph-pair-audit.json'), 'utf8'));
const r02PacketPath = 'docs/art-implementation-2026-10-02/enemy-batch/submissions/r02/packet.json';
const r02 = JSON.parse(fs.readFileSync(path.join(root, r02PacketPath), 'utf8'));
const moduleRecord = record('src/view/art/characters/enemyRigData.js');
const sealedModule = r02.files.find(f => f.path === moduleRecord.path);
if (sealedModule.sha256 !== moduleRecord.sha256) throw new Error('Sealed r02 module changed');
if (audit.dependencies[0].sha256 !== moduleRecord.sha256) throw new Error('Read audit module snapshot stale');
const docs = fs.readdirSync(out).filter(name => name !== 'packet.json' && !name.endsWith('.tmp')).map(name => record(path.relative(root, path.join(out, name))));
for (const file of docs) {
  const bytes = fs.readFileSync(path.join(root, file.path));
  if (bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191) throw new Error('BOM present');
}
const packet = { schemaVersion: 1, owner: 'enemy-batch', revision: 'r03', status: 'ready_for_review', scope: 'read_only_topology_pairing_audit_no_new_resource_revision', sourceProductionPacket: record(r02PacketPath), externalBodyAcceptance: record('docs/art-implementation-2026-10-02/reviews/enemy-batch-r02.md'), dependencies: audit.dependencies, files: docs, findings: { sevenIdentityOrganIdsAndOrderStable: true, requestedVariantPairs: 8, extraSquashPair: 1, changedPaths: 21, changedEllipses: 4, rawSignatureDifferences: audit.findings.incompatiblePathPairs, minimumDataAdditionUnderCurrentGeneric: 0, semanticPairSuggestions: ['SCOUT long-leg-left/right: split returning foot C3 instead of long leg C1', 'SIEGE fist-right: rotate target closed start to upper inner fist, subdivide neutral C1/C4'], confirmedPlaybackDefects: 0 }, mutations: { runtimeSourceWrites: 0, publicResourceWrites: 0, r02Writes: 0, extraShapeMorphFields: 0, repeatedPlaybackTests: 0 }, limitations: ['Raw signature differences do not establish failure of generic interpolation', 'Authored landmark pairing suggestions are unapplied and not confirmed visible defects', 'E01 remains open until shared owner/QA verifies current generic playback'], summary: '七身份同名器官/顺序均守恒；命令例外、21路径顶点及28变化关节配对已列。当前generic下最低新增数据0，SCOUT脚弧与SIEGE拳闭合起点提供更精确语义配对供主审转公共负责人。' };
const bytes = Buffer.from(`${JSON.stringify(packet, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(out, 'packet.json.tmp'), bytes); fs.renameSync(path.join(out, 'packet.json.tmp'), path.join(out, 'packet.json'));
for (const file of docs) if (record(file.path).sha256 !== file.sha256) throw new Error('Audit file changed during seal');
const ready = { schemaVersion: 1, owner: 'enemy-batch', revision: 'r03', status: 'ready_for_review', scope: packet.scope, packetPath: 'submissions/r03/packet.json', packetSha256: hash(bytes), sourceResourceRevision: 'r02', readyAt: new Date().toISOString() };
fs.writeFileSync(path.join(ownerRoot, 'READY.json.tmp'), `${JSON.stringify(ready, null, 2)}\n`, 'utf8'); fs.renameSync(path.join(ownerRoot, 'READY.json.tmp'), path.join(ownerRoot, 'READY.json'));
console.log(JSON.stringify({ scope: packet.scope, packetSha256: ready.packetSha256, auditFiles: docs.length, minimumNewFields: 0, runtimeOrPublicWrites: 0 }));
