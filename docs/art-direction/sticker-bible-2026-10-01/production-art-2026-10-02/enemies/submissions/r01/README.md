# enemies 第一包 r01

提交14敌77动作清单、实际入口/优化版/fallback映射与3张样板。采用内置image_gen；引用图均先实际查看；完整prompt见prompts/。

- images/basic-root-lock.png：五芽两脚常态/压缩/拉伸/原地循环；annotation独立。
- images/beacon-body-only.png：BEACON自身召唤body-only，BASIC子体独立分栏。非当前HIVE spawnHive。
- images/shard-splinter-separate.png：活体SHARD与死亡生成SPLINTER的独立关系。
- production-split.json/md：77条全字段清单。
- runtime-mapping.json/md：当前正式调用链、37个优化handler输出与敌人相关覆盖差异。
- sample-spec.json：层次、root建议坐标、样板范围与未认证边界。
- source-evidence.json：只读工作树证据SHA256。

样板覆盖9条参考动作的设计示意，不是77条已绘制，也不是可导入动画。无透明精灵/图集/矢量源稿/连续帧精度/实战性能承诺。所有生产状态待主审明确审查。本包提交后停止，不展开其他身份新生图。
