import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, BASELINE, argsMap, walk, writeJSON, fileHash, sourceManifest, compareManifests } from './common.mjs';

const out = path.resolve(argsMap().out);
if (fs.existsSync(path.join(out, 'READY.json'))) throw new Error('Submission is already sealed');
const read = p => JSON.parse(fs.readFileSync(path.join(out, p)));
const freeze = read('logic-freeze.json'), behavior = read('behavior/behavior-comparison.json'), projectiles = read('projectiles/report.json');
if (!freeze.pass || !behavior.pass || !projectiles.pass) throw new Error('Cannot mark failing logic reports ready with a passing conclusion');
const protectedManifest = root => sourceManifest(root).filter(f => freeze.scope.some(s => f.path.startsWith(s + '/')));
const snapshotChanges = Object.fromEntries(Object.entries(freeze.roots).map(([name, root]) => [name, compareManifests(freeze[`${name}Manifest`], protectedManifest(root))]));
if (Object.values(snapshotChanges).some(x => x.length)) throw new Error('Snapshot changed');
const liveScopeChangesSinceCapture = compareManifests(freeze.candidateManifest, protectedManifest(ROOT));
const oldSubmissions = [];
for (const revision of ['r01', 'r02']) {
  const directory = path.join(out, '..', revision), packetPath = path.join(directory, 'packet.json');
  const packet = JSON.parse(fs.readFileSync(packetPath));
  const expected = revision === 'r01' ? '4f01387be47de98044f2dbdf6cc855de940e261c28710448f32581b87caca446' : '5b11a27550f7426eec8512b07bbb6e433ccdddbb5a7e154211eddca9235d34d7';
  if (fileHash(packetPath) !== expected) throw new Error(`${revision} packet changed`);
  const failures = packet.files.filter(f => fileHash(path.join(directory, f.path)) !== f.sha256).map(f => f.path);
  if (failures.length) throw new Error(`${revision} files changed: ${failures}`);
  oldSubmissions.push({ revision, packetSha256: expected, filesVerified: packet.files.length, pass: true });
}
const ownedCode = [...walk(path.join(ROOT, 'scripts/art-validation')), ...walk(path.join(ROOT, 'tests')).filter(f => path.basename(f).startsWith('art-'))].sort().map(file => ({ path: path.relative(ROOT, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: fileHash(file) }));
for (const file of ownedCode) {
  const target = path.join(out, 'qa-toolchain', file.path); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(ROOT, file.path), target);
}
const syntax = ['freeze-logic.mjs', 'projectile-boundaries.mjs', 'seal-logic-r03.mjs'].map(file => {
  const result = spawnSync(process.execPath, ['--check', path.join(ROOT, 'scripts/art-validation', file)], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return { path: `scripts/art-validation/${file}`, exitCode: result.status };
});
const totals = {
  behaviorCases: behavior.cases.length, behaviorFrames: behavior.cases.reduce((n, c) => n + c.frames, 0), behaviorDifferences: behavior.differences.length,
  projectileCases: projectiles.cases.length, projectileFrames: projectiles.cases.reduce((n, c) => n + c.frames, 0), projectileComparedStages: projectiles.cases.reduce((n, c) => n + c.comparedStages, 0),
  sourceInspections: projectiles.cases.reduce((n, c) => n + c.sourceInspections, 0), rejectedScalarDtoMutationAttempts: projectiles.cases.reduce((n, c) => n + c.frozenScalarMutationRejected, 0),
  failedProjectileCases: projectiles.cases.filter(c => !c.pass).length,
};
const scope = 'Independent numeric regression of immutable src/data/** and src/logic/engine/** snapshots only. Not full candidate, hook, DOM, art or performance acceptance.';
const generatedAt = new Date().toISOString();
writeJSON(path.join(out, 'verification.json'), { generatedAt, node: process.version, platform: process.platform, arch: process.arch, sourceChanges: snapshotChanges, liveScopeChangesSinceCapture, oldSubmissions, syntax, observedQAToolingTestRun: { command: 'node --test tests/art-snapshot.test.js tests/art-baseline-contract.test.js', exitCode: 0, tests: 7, passed: 7, failed: 0, note: 'Observed immediately before sealing; no duplicate test run performed.' }, totals });
fs.writeFileSync(path.join(out, 'README.md'), `# QA r03 — 冻结逻辑子集数值回归\n\n${scope}\n\n## 结论\n\n- 受测候选：33 个文件，逻辑子集 SHA-256 \`${freeze.candidateScopeSha256}\`。\n- 固定基线：\`${BASELINE}\`，本轮直接读取 Git 对象并独立快照，无 Git 写入。\n- 96 组、155520 帧 Boss 阶段探针：数值、状态、位置、数组/事件顺序、RNG 状态及调用次数完全一致，0 差异，valid=true。\n- 82 组、19990 帧弹体测试，39980 次阶段快照比较：0 差异。1015 次回调来源检查通过。\n- 源码先仅归一化 CRLF→LF，再精确撤销获批字段/两处第三参；33 文件均与基线完全一致。运行时无数值容差、无重排、无其他字段剥离。\n- 封包时活跃工作区受保护逻辑变化数：${liveScopeChangesSinceCapture.length}；快照始终未变。无关角色/UI 文件变化不影响该封闭依赖子集的结果。\n\n## 样本边界\n\n96 组保持 r02 方法：16 Boss × 3 随机种子 × 30/60Hz × 36 秒（每阶段12秒，强制HP），\`createScene\` 的 offense=false；不把这个探针声称为弹体或真实 hook 全流程。全部弹体验证单独列入下面的82组。\n\n82 组 = 4 类边界 × 2Hz +（玩家 + 九种塔 × 等级0..3）× 2Hz。持续射击每组6秒。边界包括真实玩家弹体同帧出生并删除、CANNON直接/半伤溅射、SNIPER三个目标穿透及跨帧命中集合去重、BURST四弹同出生点且回调shotIndex倒序3/2/1/0。两个频率是30和60Hz。每帧 offense 后与 projectile 更新后分别比较。原主人中心出生坐标也逐弹断言。敌人采用构造高血量目标；不代表正常战局经济、胜负或技能全覆盖。\n\n回调对照基线两参、候选三参，目标/伤害/调用顺序及粒子/飘字/冲击波参数逐项保留。候选第三参必须是仍在数组中的真实原弹体，并映射到已观察的出生记录；溅射/穿透共享正确来源，消失后仍保存标量证据。QA 接收端仅复制并冻结标量，不持有可变弹体引用；1015 次读取前后游戏状态不变，对DTO写入均拒绝。这不证明生产 hook 已正确隔离：引擎第三参本身是可变弹体，生产 hook 的标量复制和绘制隔离需在最终冻结后单独验证。\n\n## 复现\n\n从仓库根执行，结果写入新目录，勿覆盖此封包：\n\n\`node scripts/art-validation/compare-behavior.mjs --baseline docs/art-implementation-2026-10-02/qa/submissions/r03/snapshots/node_modules/baseline --candidate docs/art-implementation-2026-10-02/qa/submissions/r03/snapshots/node_modules/candidate --out <new-directory> --omit-projectile-metadata approved --contract-sha b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba\`\n\n\`node scripts/art-validation/projectile-boundaries.mjs --baseline docs/art-implementation-2026-10-02/qa/submissions/r03/snapshots/node_modules/baseline --candidate docs/art-implementation-2026-10-02/qa/submissions/r03/snapshots/node_modules/candidate --out <new-directory>\`\n\n快照含全部受保护33文件与独立生成的type=module加载器，所有112条双端导入都在冻结范围内。qa-toolchain保留本轮完整QA工具字节。logic-freeze记录源文件SHA、闭包导入与精确例外审计；behavior与projectiles目录保留逐帧摘要，后者还有82个完整出生/回调/结束状态证据文件。verification记录旧封包完整性、语法与已运行7项QA测试。\n\n## 尚未验收\n\n375动作/95技能视觉、全真实技能调度、生产hook及DOM流程、资源失败、锚点/解剖纯绘制、完整游戏性能等仍待最终冻结。未改src/public/package/旧测试，未写Git，未通过工具发跨线程消息；r01/r02文件保持原封包。\n`, 'utf8');
const files = walk(out).filter(f => !['packet.json', 'READY.json'].includes(path.relative(out, f))).sort().map(file => ({ path: path.relative(out, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: fileHash(file) }));
const packet = { schemaVersion: 1, owner: 'qa', revision: 'r03', status: 'ready_for_review', readyAt: generatedAt, scope, baselineCommit: BASELINE, candidateScopeSha256: freeze.candidateScopeSha256, approvals: freeze.approvals, files, ownedCode, results: { ...totals, protectedSourceAuditPass: freeze.pass, frozenBehaviorPass: behavior.pass, frozenProjectilesPass: projectiles.pass, wholeCandidateApproved: false }, limitations: projectiles.exclusions, pending: ['Final frozen production hook source-copy validation', '375 action and 95 skill visual/runtime sampling', 'Real DOM flows and full-game performance'], immutableAfterReady: true };
writeJSON(path.join(out, 'packet.json'), packet);
for (const file of files) if (fileHash(path.join(out, file.path)) !== file.sha256) throw new Error(`Final hash mismatch: ${file.path}`);
const ready = { schemaVersion: 1, owner: 'qa', revision: 'r03', status: 'ready_for_review', packetPath: 'submissions/r03/packet.json', packetSha256: fileHash(path.join(out, 'packet.json')), readyAt: generatedAt, scope };
writeJSON(path.join(out, 'READY.json'), ready);
writeJSON(path.resolve(out, '../../READY.json'), ready);
console.log(JSON.stringify({ ...ready, evidenceFiles: files.length, ownedCode: ownedCode.length, totals, liveScopeChangesSinceCapture }));
