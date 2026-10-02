# References / r04
- UI: scene-ui-2026-10-02/ui/submissions/r02/packet.json，dui01-nine-towers-scroll.png、dui02-mouse-states.png、dui03-boss-rewards.png。采用批准结构，不采用其示例数值。
- BG: background/submissions/r02/packet.json，bg01-clean-background.png、bg02-ground-layers.png。
- Approval: scene-ui-2026-10-02/reviews/ui-r02.md、background-r02.md。
- 身体: preparation/desktop-r04-canonical-sources.json列出18身份/14唯一原图，本轮均实际view；最终缩减场内种类，全9目录仍覆盖。
- VFX: effects-ui/submissions/r02/b01-friendly-projectiles.png、b02-status-world.png、b03-hazard-lifecycle.png，本轮实际view。
- 源码: src/data/gameConfig.js:42 BASIC塔50HP；:78 BEACON summon interval5.5/count3/typeBASIC。
- enemyBehaviorRuntime.js:59–65 执行spawnAround；entitySpawnRuntime.js:6–21产生普通召唤；battlefieldRules.js:40–50非Boss owner为null；enemyDefeatRuntime.js:29只splice死者，非Boss不做Boss清场。
- towerRules.js:13–45真实逐级HP/费用/伤害计算；debugTowerRuntime.js:28–38放置maxHp。
- combatOffenseRuntime.js:59–87逐塔burstCount发射/默认2秒寿命；combatFrameRuntime.js:13–75弹体移动/命中/过期移除。
- preparation中的初始计划/状态保持历史原样；本封包source-derived-states.json覆盖最终实际成员合同。verify-source-contract.mjs是可重复只读源码校验，并只写本r04数据文件。
- 所有源文件SHA见source-fingerprints.json；本r04不修改来源。

