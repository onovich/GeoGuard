# QA r03 — 冻结逻辑子集数值回归

Independent numeric regression of immutable src/data/** and src/logic/engine/** snapshots only. Not full candidate, hook, DOM, art or performance acceptance.

## 结论

- 受测候选：33 个文件，逻辑子集 SHA-256 `c06bf67cabe651837f5d9cfdfbde573226484b14d53a5ef7586771692f227a3d`。
- 固定基线：`23ce1a33d0a72674286d67ba80c8f7b1260153e2`，本轮直接读取 Git 对象并独立快照，无 Git 写入。
- 96 组、155520 帧 Boss 阶段探针：数值、状态、位置、数组/事件顺序、RNG 状态及调用次数完全一致，0 差异，valid=true。
- 82 组、19990 帧弹体测试，39980 次阶段快照比较：0 差异。1015 次回调来源检查通过。
- 源码先仅归一化 CRLF→LF，再精确撤销获批字段/两处第三参；33 文件均与基线完全一致。运行时无数值容差、无重排、无其他字段剥离。
- 封包时活跃工作区受保护逻辑变化数：0；快照始终未变。无关角色/UI 文件变化不影响该封闭依赖子集的结果。

## 样本边界

96 组保持 r02 方法：16 Boss × 3 随机种子 × 30/60Hz × 36 秒（每阶段12秒，强制HP），`createScene` 的 offense=false；不把这个探针声称为弹体或真实 hook 全流程。全部弹体验证单独列入下面的82组。

82 组 = 4 类边界 × 2Hz +（玩家 + 九种塔 × 等级0..3）× 2Hz。持续射击每组6秒。边界包括真实玩家弹体同帧出生并删除、CANNON直接/半伤溅射、SNIPER三个目标穿透及跨帧命中集合去重、BURST四弹同出生点且回调shotIndex倒序3/2/1/0。两个频率是30和60Hz。每帧 offense 后与 projectile 更新后分别比较。原主人中心出生坐标也逐弹断言。敌人采用构造高血量目标；不代表正常战局经济、胜负或技能全覆盖。

回调对照基线两参、候选三参，目标/伤害/调用顺序及粒子/飘字/冲击波参数逐项保留。候选第三参必须是仍在数组中的真实原弹体，并映射到已观察的出生记录；溅射/穿透共享正确来源，消失后仍保存标量证据。QA 接收端仅复制并冻结标量，不持有可变弹体引用；1015 次读取前后游戏状态不变，对DTO写入均拒绝。这不证明生产 hook 已正确隔离：引擎第三参本身是可变弹体，生产 hook 的标量复制和绘制隔离需在最终冻结后单独验证。

## 复现

从仓库根执行，结果写入新目录，勿覆盖此封包：

`node scripts/art-validation/compare-behavior.mjs --baseline docs/art-implementation-2026-10-02/qa/submissions/r03/snapshots/node_modules/baseline --candidate docs/art-implementation-2026-10-02/qa/submissions/r03/snapshots/node_modules/candidate --out <new-directory> --omit-projectile-metadata approved --contract-sha b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba`

`node scripts/art-validation/projectile-boundaries.mjs --baseline docs/art-implementation-2026-10-02/qa/submissions/r03/snapshots/node_modules/baseline --candidate docs/art-implementation-2026-10-02/qa/submissions/r03/snapshots/node_modules/candidate --out <new-directory>`

快照含全部受保护33文件与独立生成的type=module加载器，所有112条双端导入都在冻结范围内。qa-toolchain保留本轮完整QA工具字节。logic-freeze记录源文件SHA、闭包导入与精确例外审计；behavior与projectiles目录保留逐帧摘要，后者还有82个完整出生/回调/结束状态证据文件。verification记录旧封包完整性、语法与已运行7项QA测试。

## 尚未验收

375动作/95技能视觉、全真实技能调度、生产hook及DOM流程、资源失败、锚点/解剖纯绘制、完整游戏性能等仍待最终冻结。未改src/public/package/旧测试，未写Git，未通过工具发跨线程消息；r01/r02文件保持原封包。
