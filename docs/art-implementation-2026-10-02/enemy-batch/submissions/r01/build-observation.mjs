import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '../../../../..');
const output = import.meta.dirname;
const bible = 'docs/art-direction/sticker-bible-2026-10-01';
const production = `${bible}/production-art-2026-10-02`;
const mapPath = `${production}/integration/submissions/r02/production-map.json`;
const lockPath = `${bible}/action-consistency/anatomy-lock.json`;
const ids = ['FAST', 'TANK', 'SPLINTER', 'SHIELD', 'MEDIC', 'BOMBER', 'JAMMER', 'PHASE', 'BURROWER', 'BEACON', 'SCOUT', 'SIEGE'];
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const fingerprint = p => {
  const bytes = fs.readFileSync(path.join(root, p));
  return { path: p.replaceAll('\\', '/'), bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
};
const write = (name, value) => fs.writeFileSync(path.join(output, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const map = read(mapPath);
const lock = read(lockPath);
const rows = map.actions.filter(r => ids.some(id => r.identity === `enemy:${id}`));
if (rows.length !== 67 || new Set(rows.map(r => r.key)).size !== 67) throw new Error('Expected 67 unique approved state keys');
const rawSources = new Map();
for (const row of rows) for (const source of row.bodySources) {
  const absolute = path.resolve(path.dirname(path.join(root, mapPath)), source.path);
  const relative = path.relative(root, absolute).replaceAll('\\', '/');
  const fp = fingerprint(relative);
  if (fp.sha256 !== source.sha256) throw new Error(`Upstream body hash mismatch ${relative}`);
  if (!rawSources.has(relative)) rawSources.set(relative, { ...fp, role: 'final_body_concept', viewedWith: 'functions.view_image', viewedDate: '2026-10-02', approvalEvidence: `${production}/${source.reviewEvidence.replace('../../../', '')}`, identities: [] });
  const record = rawSources.get(relative);
  if (!record.identities.includes(row.identity)) record.identities.push(row.identity);
}
const observations = {
  '01-fast-tank.png': '实际看到FAST两条向左后扫的长耳、左后侧瓣、双眼短口；TANK三上冠瓣/双拳/横眉槽下单方牙。四状态根十字均在基线。',
  '02-shard-splinter.png': '实际看到第二行SPLINTER为弯尖单滴/单眼，无手脚嘴；第4格body抬升，投影十字仍原地。第一行SHARD仅为同板上下文，不在本组实施。',
  '03-shield-medic.png': '实际看到SHIELD右前长软盾瓣遮一眼区，左后拳、两脚；MEDIC四叶连体、两卷臂、两脚与中央奶油十字，零眼口。',
  '04-bomber-jammer.png': '实际看到BOMBER右弯钩芽/双鼓腮/双斜眼槽/口内奶油舌；JAMMER双下垂长耳、四底瓣、双U眼槽与W嘴。第4格各为专属张鼓姿态。',
  '05-phase-burrower.png': '实际看到PHASE单弯连体尾末双尖凹口、长脸窗双白眼；BURROWER双爪各三圆指、双暗脚、双眼与单圆鼻口。第4格都保持完整身体。',
  '06-scout-siege.png': '实际看到第一行SIEGE倒盾额板/双拳/两眼/单口，第4格右拳带臂上举；第二行SCOUT单眼罩双长腿，第4格前倾追踪身。',
  'beacon-body-only.png': '实际看到上行4格钟瓶身、双球触芽、双脚、纵大口与心舌，零眼；下行三BASIC明确独立，不能烘焙到BEACON身体。',
};
for (const source of rawSources.values()) source.observation = observations[path.basename(source.path)];
const additional = [
  { path: `${production}/enemies/submissions/r01/images/shard-splinter-separate.png`, role: 'independent_entity_relationship_only', approvalEvidence: `${production}/reviews/enemies-r01.md`, observation: '实际看到移除SHARD父体、请求3、三独立uid/root，复用SPLINTER身体，数量服从逻辑；非最终动作身体源。' },
  { path: `${bible}/scene-ui-2026-10-02/master/submissions/r04/master-desktop-density-r04.png`, role: 'approved_scene_style_density_only', approvalEvidence: `${bible}/scene-ui-2026-10-02/reviews/master-r04.md`, observation: '实际看到奶油低对比地面、珊瑚敌群与薄荷我方，TANK显著宽于BASIC，独立影子/弹体/血条；身体细节仍服从canonical源，不以联合图像素作标尺。' },
].map(s => ({ ...fingerprint(s.path), ...s, viewedWith: 'functions.view_image', viewedDate: '2026-10-02' }));
write('sources.json', { schemaVersion: 1, owner: 'enemy-batch', revision: 'r01', authority: 'External accepted reviews supersede historical submitted metadata; this observation is not production approval', finalBodyBoards: [...rawSources.values()], supplementaryViewedSources: additional });
write('actions.json', { schemaVersion: 1, owner: 'enemy-batch', count: rows.length, identityCount: ids.length, locatorAccuracy: 'concept row/column only; never extraction rectangle', upstream: fingerprint(mapPath), items: rows.map(r => ({ key: r.key, identity: r.identity, action: r.action, bodySources: r.bodySources, mappingMode: r.mappingMode, transform: r.transform, constructionReference: r.constructionReference, review: r.review, reviewEvidence: r.reviewEvidence, rootSemantics: r.contract.fixedRoot, parts: r.contract.parts, effects: r.contract.effects, independentSummons: r.contract.independentSummons, logicMovementHint: r.contract.logicMovementHint, runtimeEvent: r.contract.runtimeEvent, productionStatus: 'not_produced' })) });
write('anatomy.json', { schemaVersion: 1, upstream: fingerprint(lockPath), items: ids.map(id => { const item = lock.items.find(i => i.key === `enemy:${id}`); const contract = rows.find(r => r.identity === item.key && r.action === 'NEUTRAL').contract; return { ...item, finalBodyParts: contract.parts, finalRootProposal: contract.fixedRoot, productionAnchorsMeasured: false, muzzleCount: contract.muzzleAnchors.length }; }) });
const dependencies = [mapPath, lockPath, `${production}/reviews/enemies-r01.md`, `${production}/reviews/enemies-r02.md`, `${production}/reviews/integration-r02.md`, `${production}/final-acceptance.md`, `${bible}/scene-ui-2026-10-02/desktop-final-acceptance.md`, `${bible}/scene-ui-2026-10-02/reviews/master-r04.md`, 'docs/art-implementation-2026-10-02/coordination.md', 'docs/art-implementation-2026-10-02/integration/submissions/r01/coordinates-and-assets.md', 'docs/art-implementation-2026-10-02/integration/submissions/r01/ownership-and-rollout.md'];
write('dependencies.json', { schemaVersion: 1, authorityDependencies: dependencies.map(fingerprint), observedCodeNotFrozenContract: ['src/view/art/characters/rigData.js', 'src/view/art/characters/rig.js'].map(fingerprint), note: 'Shared rig code was read only. Its observed SHA is informational because sample/contract author may continue changing it; no batch contract has been inferred as approved.' });
const expectedKeys = lock.items.filter(i => ids.includes(i.id) && i.group === 'enemy').flatMap(i => i.actions.map(a => `${i.key}/${a.action}`));
if (expectedKeys.length !== rows.length || expectedKeys.some(k => !rows.some(r => r.key === k))) throw new Error('Anatomy keys differ');
const sourceCellKeys = new Set(rows.flatMap(r => r.bodySources.map(s => `${s.path}:${s.row}:${s.column}`)));
if (sourceCellKeys.size !== 48 || rawSources.size !== 7) throw new Error('Body source coverage differs');
write('verification.json', { schemaVersion: 1, owner: 'enemy-batch', revision: 'r01', result: 'observation_checks_passed_not_production_acceptance', counts: { identities: 12, actionKeys: rows.length, uniqueBodyConceptCells: sourceCellKeys.size, bodySourceOccurrences: rows.reduce((n, r) => n + r.bodySources.length, 0), finalBodyBoardsViewed: 7, supplementaryBoardsViewed: 2, productionRigs: 0, productionTransparentAssets: 0 }, checks: { exactAnatomyActionKeySet: true, finalBodySourcesHashesMatch: true, all12HaveNeutralAndMove: ids.every(id => rows.some(r => r.key === `enemy:${id}/NEUTRAL`) && rows.some(r => r.key === `enemy:${id}/MOVE`)), finalBodyImagesActuallyViewed: true, submittedMetadataAuthorityResolvedByExternalReviews: true, noMuzzlesAdded: rows.every(r => r.contract.muzzleAnchors.length === 0) }, authorOperations: { writeScope: 'docs/art-implementation-2026-10-02/enemy-batch/** only', srcPublicMutations: 0, gitCommands: 0, crossThreadToolMessages: 0, dependencyInstallations: 0 }, pending: ['Primary sample approval and explicit batch new-file/export contract', 'Production Bézier parts and identity-specific poses', 'Measured source root/C/joints/bounds, transparent exports, small-size/direction/cycle inspection', 'Runtime integration and independent primary acceptance'], limitations: ['Viewed concept boards are not exported frames', 'Old 512/256 coordinate proposals are not measured production anchors', 'Shared rig snapshot is observation only and may evolve under its owner'] });
console.log(JSON.stringify({ output: path.relative(root, output), identities: ids.length, keys: rows.length, cells: sourceCellKeys.size, boards: rawSources.size }));
