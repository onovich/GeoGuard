# enemies r02 最终概念候选包

入口：[index.html](index.html)。14现有身份、77条具体板/格来源；保留r01已通过BASIC/BEACON，新增6张2身份body-only板。

所有新原画使用内置image_gen，引用图先view；完整生成与局部修订prompt在prompts/，记录在generation-record.json。最终图在images/。

- 01-fast-tank.png：FAST上排、TANK下排。
- 02-shard-splinter.png：SHARD上排、SPLINTER下排。
- 03-shield-medic.png：SHIELD上排、MEDIC下排。
- 04-bomber-jammer.png：BOMBER上排、JAMMER下排。
- 05-phase-burrower.png：PHASE上排、BURROWER下排。
- 06-scout-siege.png：SIEGE上排、SCOUT下排，以实际行标签为准。

全部动作来源：action-sources.json/md；完整拆分production-split.json含root/部件/独立对象/effects/位移/运行期依据/复用。最终候选图片未自动继承r01批准，等待主审实际查看。仅概念关键姿态，不制作连续资源、不改代码、不提交或部署。
