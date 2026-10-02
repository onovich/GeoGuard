# 第一包自检与审阅说明

本包使用内置 image_gen 生成与修订。所有本地引用图均先实际 view_image 查看。生成结果复制到本组目录；未改游戏源码、玩法参数、资源接入、其他组文件或Git状态。

## 候选样板

- `hive-production.png`：四格常态／蓄力／攻击／OPEN仅有HIVE身体。逐格可数三独立洞、两耳、两闭眼槽、五裙瓣；根锚在共同投影基线。下栏NEST、BASIC、SHARD各自独立，当前映射已按主审纠正。裙瓣数字、根锚十字、阴影都是导引／效果，不进入身体导出。
- `seal-production.png`：两钳无头无脸无脚，圆头指钳尖为圆润形状。INTACT/TRIGGER两钳，BROKEN/FADE各钳分为两近邻片，共四片。四格中心导线与地面基线保持设计对齐；冻结效果在独立下栏，空心中心没有塔或Boss。中心十字为collisionCenter；root位于竖导线与下方水平地面线交点，详见sample-contracts.json。

这两张均为待主审候选原画规范，不是透明帧或最终可运行图集。数值挂点为512×512源稿设计目标，不从PNG板伪造实测值。需要后续原生分层源稿、透明帧、固定画布与叠帧检验；本包不声明已完成这些工序。

OPEN明确为同一完整身体加独立覆盖全身轮廓的易伤提示，不得只标核心。主审已在提交封包前实际查看两候选并反馈视觉结构预审通过；本记录仅转述该反馈，正式审批仍以主审reviews文件为准，192映射未由本组自行标通过。

## 全清单与运行依据

`production-split.json`与同名MD保留17个Boss身体164条、7机关28条，共192原始动作key。每条有root、body、attachment、summon、effect、logicalMotion、runtimeEvidence。独立的abilityCatalog覆盖93个默认技能、2个幸存新增技能，并另列6个旧模板/编辑器键，不把P1–P3当作全部技能。

已只读核实入口、37个optimized handler、fallback实现和机关生命周期。`optimized-overrides.md`逐项列差异。入口为useGeoGuardGame.jsx:798；优先覆盖而非叠加基础实现。主审更正后，spawnHive=NEST，NEST timer=BASIC，summonSwarm=SHARD。mirrorStep不再生PHASE；hiveCollapse不再生SHARD；seedPods=ROOT；nestBloom=WEB；webField=WEB+SPLINTER；tempoShift与gardenWake数量依当前覆盖。COURIER击破直接返款，不新增玩家拾取条件。

TWINS_SUN/TWINS_MOON分别映射TWIN_SOL/TWIN_LUNA，独立血量、位置、状态。旧ORBIT/SWAP动作作为归档／身体复用，不声称当前默认遭遇仍调用twinOrbit/twinSwap。DRAGON旧BREATH/TAIL保留key并注明姿态候选对应当前dragonStrafe/wingBuffet，不声称tailSweep具有可执行handler。

## 归档与提示词

`hive-draft.png`是已撤销BEACON映射稿，`hive-mapping-draft.png`为五瓣未合格稿；两者只留修订证据，不得采用。唯一HIVE候选是`hive-production.png`。所有生成/修订提示词以*-prompt.txt持久化，SEAL只有一稿；`build-manifest.mjs`仅为本包清单构建脚本，不属于游戏代码。

SEAL图中文字“target freeze: 1.6s”表示本节点施加的计时值；代码使用max，不会缩短已有更久冻结。“break before trigger: cancel”仅取消该节点尚未发生的冻结，不撤销其他来源状态。BROKEN/FADE是美术结尾，不额外创造伤害结算。

## 停止条件

本包提交后停止。等待主审明确通过或返修指令，不批量制作其余Boss，也不向其他工作会话发送消息。依赖由主审统一转交，JSON内列出enemies与effects-ui需求。
