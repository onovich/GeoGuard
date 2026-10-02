import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(out, '../../../../..');
const owner = path.resolve(out, '../..');
const relative = absolute => path.relative(repo, absolute).replaceAll('\\', '/');
const doc = file => path.join(out, file);
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const hash = absolute => crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
const jsonWrite = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory() ? walk(path.join(dir, item.name)) : [path.join(dir, item.name)]);
const fp = absolute => ({ path: relative(absolute), sha256: hash(absolute), bytes: fs.statSync(absolute).size });
const manifest = read(doc('manifest.json'));
const verification = read(doc('verification.json'));
const modulePath = path.join(repo, 'src/view/art/characters/bossRigDataB.js');
assert.equal(hash(modulePath), verification.groupDataSHA256, 'Group source changed since export');
assert.equal(hash(path.join(repo, 'src/view/art/characters/rig.js')), verification.sharedSamplerSHA256, 'Shared sampler changed since validation; rerun exporter before sealing');
const expected = ['twins_moon','dragon','spider_matriarch','astrolabe','blood_forge','void_conductor','labyrinth_keeper','nightmare_bloom'];
assert.deepEqual(Object.keys(manifest).map(key => key.split(':')[1].toLowerCase()), expected);
const publicDirs = expected.map(slug => path.join(repo, 'public/art/characters/v1/boss', slug));
for (const dir of publicDirs) assert.ok(relative(dir).startsWith('public/art/characters/v1/boss/'));

const cards = Object.entries(manifest).map(([id, item]) => {
  const slug = id.split(':')[1].toLowerCase();
  const source = item.referenceSources[0];
  return `<section><h2>${id}</h2><p>R (${item.rootPx.join(',')}) · C0 (${item.collisionCenterPx.join(',')}) · r0 ${item.collisionRadiusPx} · runtime r ${item.referenceRuntimeRadius} · ${Object.keys(item.actions).length} action sources</p><p><a href="../../../../../public/art/characters/v1/boss/${slug}/source.svg">Editable transparent source</a> · <a href="../../../../../public/art/characters/v1/boss/${slug}/body.png">256 transparent PNG</a> · <a href="../../../../../public/art/characters/v1/boss/${slug}/icon.svg">64 icon</a> · <a href="previews/${slug}-anchors.png">R / C0 / parts / source circle</a> · <a href="../../../../../${source.path}">Approved body reference</a></p><img src="previews/${slug}-poses.png" alt="${id} fixed-root untrimmed pose sheet"/><img src="previews/${slug}-motion.png" alt="${id} windup and attack intermediate poses"/></section>`;
}).join('\n');
fs.writeFileSync(doc('index.html'), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GeoGuard Boss B · r02 资源审阅</title><style>body{margin:0;background:#FFF9EF;color:#4B281C;font:16px/1.6 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:28px}h1{font-size:28px}h2{font-size:21px}a{color:#75402B}section{margin:30px 0;padding:20px;background:#FFFDF8;border:1px solid #D8C7B1;border-radius:14px}img{display:block;max-width:100%;height:auto;margin:16px 0}p{max-width:1000px}.status{padding:16px;background:#F8E9D5;border-radius:10px}</style><main><h1>Boss 后组 r02 · 8 身份可编辑资源</h1><p class="status">已独立制作，待主审资源验收。81 条原画来源 / 32 身体关键格 / 47 实际技能键。未注册公共 API、未宣称游戏接入或跨 pose 连续性通过。</p><p><a href="README.md">交付说明</a> · <a href="review-notes.md">视觉自检与边界</a> · <a href="manifest.json">完整元数据</a> · <a href="anchor-audit.json">锚点审计</a> · <a href="verification.json">独立验证</a></p><section><h2>实战尺寸与图标</h2><p>下图原文件采用 1 世界单位=1 像素，页面缩放不代表放大游戏资源。</p><img src="previews/runtime-size-contact-sheet.png" alt="Runtime radius body pose contact sheet"/><a href="previews/runtime-size-contact-sheet-2x.png">2× 最近邻审阅辅助</a><img src="previews/icon-size-contact-sheet.png" alt="48 64 96 pixel icons"/></section>${cards}</main></html>`, 'utf8');

// Confirm the sealed study is unchanged and every displayed local link resolves.
const studyPacketPath = path.join(owner, 'submissions/r01/packet.json');
const studyPacket = read(studyPacketPath);
for (const entry of studyPacket.files) assert.equal(hash(path.join(owner, entry.path)), entry.sha256, 'Study r01 seal changed');
const html = fs.readFileSync(doc('index.html'), 'utf8');
let localLinks = 0;
for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) { assert.ok(fs.existsSync(path.resolve(out, match[1])), `Missing gallery file: ${match[1]}`); localLinks++; }

const targets = [modulePath, ...publicDirs.flatMap(walk), ...walk(out).filter(file => !['packet.json','SHA256SUMS.txt'].includes(path.basename(file)))].sort();
const records = targets.map(fp);
assert.equal(new Set(records.map(file => file.path)).size, records.length);
for (const file of targets) {
  if (/\.(?:js|mjs|md|json|html|svg)$/.test(file)) {
    const bytes = fs.readFileSync(file); assert.ok(!(bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191), 'UTF-8 BOM: ' + file);
    if (file.endsWith('.svg') && relative(file).startsWith('public/')) assert.ok(!/<text|<image|foreignObject/i.test(bytes.toString()), 'External or printed UI content baked into body/icon: ' + file);
  }
}
const sumsPath = doc('SHA256SUMS.txt');
fs.writeFileSync(sumsPath, records.map(file => `${file.sha256}  ${file.path}`).join('\n') + '\n');
records.push(fp(sumsPath));
const inputPaths = [
  'docs/art-implementation-2026-10-02/characters/submissions/r03/rig-data-output-contract.md',
  'docs/art-implementation-2026-10-02/reviews/character-group-contract.md',
  'docs/art-implementation-2026-10-02/integration/submissions/r01/packet.json',
  'docs/art-implementation-2026-10-02/integration/submissions/r01/identity-map.json',
  'docs/art-implementation-2026-10-02/integration/submissions/r01/runtime-boss-variants.json',
  'docs/art-implementation-2026-10-02/boss-b/submissions/r01/packet.json',
  'docs/art-implementation-2026-10-02/boss-b/submissions/r01/sources.json',
  'src/view/art/characters/rig.js', 'src/view/art/characters/rigData.js',
];
const packet = {
  owner: 'boss-b', revision: 'r02', status: 'submitted_resources_pending_primary_review', pathBase: 'repository-root',
  scope: 'All eight assigned Boss identities; exclusive schema-1 data, editable transparent sources/icons/keyposes and standalone fixed-root artwork validation',
  files: records, inputs: inputPaths.map(file => fp(path.join(repo, file))), previousStudyPacket: { path: relative(studyPacketPath), sha256: hash(studyPacketPath), preserved: true },
  coverage: { identitiesProduced: 8, sourceActions: 81, uniqueApprovedBodyCells: 32, runtimeAbilityKeys: 47, phaseSelectors: '0/1/2 with approved neutral body reuse', publicBodyKeyposePNGs: 32, publicNeutralBodyPNGs: 8, publicIconPNGs: 8, publicEditableSVGs: 56, standalonePosePNGs: 72, sourcePoseAndIntermediateRasterChecks: 152, rootSamples: verification.rootSamples, localGalleryLinksChecked: localLinks, productionApproved: 0, gameplayIntegrated: 0 },
  ownership: { module: 'src/view/art/characters/bossRigDataB.js', namedExport: 'BOSS_RIGS_B', publicDirectories: publicDirs.map(relative), docs: relative(out), sharedFilesWritten: [], gitOperations: 0 },
  validation: { status: verification.status, rootMaxError: 0, zeroRasterEdgeClipping: true, rigidDimensionsAndMounts: true, feetAndFaceAttachment: true, finiteMatrices: true, moveSeam: true, namedOrgans: true, rasterConnectivity: true, runtimeAbilityKeysMatchContract: true, immutableActorInputs: true, noBOM: true, sourceHashes: 'All assigned final references exact', actualImageInspection: '5 final body boards + 2 approved scene boards in r01; all eight produced pose and motion sheets, runtime size and icon sheet actually viewed in this chat' },
  dependencies: [
    'Character owner imports BOSS_RIGS_B and merges shared registry/API',
    'Primary reviewer accepts individual editable resources and rendered previews',
    'QA verifies real public rig/API playback and cross-pose transition boundaries',
  ],
  openIssues: [{ id: 'BB-TRANSITION-01', owner: 'characters/shared sampler + QA', issue: 'Current shared windup end and attack start change soft matrix and local angle; group may not edit rig.js. Boundary anchors and progress sheets supplied.', blocking: 'continuous motion acceptance, not standalone source creation' }],
  limitations: ['Standalone sampler evaluation injects group in memory, no registry modification or gameplay/API integration claim', 'No approved Boss UP body projection: same approved right body reused', 'Source collision-reference r0 is authored circle; complete silhouette may extend outside it', 'External effects/entities/HP/shadow/projectiles never baked into frames'],
  summary: '8身份全部独立制作完成并提交待验收；身体/器官/脚根/刚性门嘴与原画映射已核验，跨pose衔接和正式公共API接入由主会话与QA后验。',
};
const packetPath = doc('packet.json');
jsonWrite(packetPath, packet);
// Re-read every checksum before making READY observable.
for (const entry of packet.files) assert.equal(hash(path.join(repo, entry.path)), entry.sha256);
const packetHash = hash(packetPath);
const ready = { owner: 'boss-b', revision: 'r02', status: packet.status, packetPath: 'submissions/r02/packet.json', packetSha256: packetHash, identitiesProduced: 8, productionApproved: 0, gameplayIntegrated: 0, sourceActions: 81, namedExport: 'BOSS_RIGS_B' };
const temp = path.join(owner, 'READY.r02.tmp.json');
jsonWrite(temp, ready);
fs.renameSync(temp, path.join(owner, 'READY.json'));
assert.equal(read(path.join(owner, 'READY.json')).packetSha256, hash(packetPath));
console.log(JSON.stringify({ ready: 'boss-b/READY.json', revision: 'r02', files: records.length, packetSha256: packetHash, galleryLinks: localLinks, publicFiles: publicDirs.flatMap(walk).length, status: packet.status }, null, 2));
