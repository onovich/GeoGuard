# Boss 后组 r01：最终来源实际勘察

日期：2026-10-02。仅来源核实与轮廓构造准备；8 身份、81 条已批准动作来源、32 个不同身体关键格。本包没有制作生产 rig、透明资产或连续动作，也没有修改 src/public、逻辑、共享注册表或 Git。

## 权威与实际查看

身体来源以 `production-art-2026-10-02/integration/submissions/r02/production-map.json` 的最终 `bodySources` 为准；器官以 `action-consistency/anatomy-lock.json` 对应条目为准。外部 `reviews/bosses-mechanics-r02.md`、`bosses-mechanics-r03.md` 和 `integration-r02.md` 的 accepted 覆盖封存 JSON 内 pending/submitted。旧 `canonicalSheet` 保留身份/动作历史，不替代新身体板。

以下 5 张完整源图均通过 `view_image` 实际查看，逐身份核对 NEUTRAL / WINDUP / ATTACK / OPEN 四格。下表是本会话的可见观察，不是仅从 JSON 抄写的视觉结论。SHA、准确仓库路径、每动作行列、外部审批和原器官锁见 [sources.json](sources.json)。

|最终源图（bosses-mechanics 下）|本组行|实际观察与制作要点|
|---|---|---|
|submissions/r02/pair-05-twins.png|第 2 行 TWINS_MOON|浅蜂蜜月牙向左凹、上尖向左上、外背弧向右凸，下尖接珊瑚弯边；两深眼一黑口始终留在月牙右侧厚腹。珊瑚边是永久身体标识，不是脚或幸存特效。第 1 行太阳不属于本组。|
|submissions/r02/pair-06-dragon-spider.png|第 1 行 DRAGON；第 2 行 SPIDER_MATRIARCH|龙从左卷尾沿下腹反弯到右头形成单连续 S 身；两独立圆指状软翅从背部伸出，圆筒状长嘴有深色孔，零脚。蜘蛛为大圆顶腹，左右各外长腿和内短大腿，加腹底两颗短足；两点眼与小 U 笑在前腹。|
|submissions/r02/pair-04-collector-astrolabe.png|第 2 行 ASTROLABE|珊瑚 C 月壳向右上开口；紫球悬在空腔里，两白眼仅在紫球。壳左下有黑点和斜短线，另一个珊瑚小球在右上，三个主块边界分离；内腔是真空隙，不用奶油底填。上行 COLLECTOR 不属于本组。|
|submissions/r03/pair-07-forge-conductor.png|第 1 行 BLOOD_FORGE；第 2 行 VOID_CONDUCTOR|熔炉为宽拱体、左右带内缺口的厚门板、两深珊瑚脚、黑脸窗两白眼、下拱内蜂蜜核心球；WINDUP 两门内转遮住部分拱区，ATTACK 外转。指挥者为尖顶长袍及细长黑脸窗，双长弯臂末端各三圆指；WINDUP 手臂向内卷，三裙瓣底端不变，OPEN 双臂仍与裙独立。|
|submissions/r03/pair-08-keeper-bloom.png|第 1 行 LABYRINTH_KEEPER；第 2 行 NIGHTMARE_BLOOM|守卫有脸窗双白眼和两门两脚，中央下拱贯通并保持背景可见；没有熔炉核心。花怪上尖瓣与左右厚瓣围住黑口，两片深珊瑚后叶及两片鼠尾草底叶，口上三下三六白牙，零眼；WINDUP 侧瓣内收，ATTACK 稍外展，牙根数未变。|

四列都是身体设计关键姿态，未制作连续帧。OPEN 列与基本身体相同，整身状态轮廓由独立效果层承担。源图的奶油底、题字、分栏线、基线、root 十字和图例均不属于身体资产。

## 已批准电脑场景核对

已读 `scene-ui-2026-10-02/desktop-final-acceptance.md` 与 `final-acceptance.md`；正式桌面版本为 background r02 / ui r02 / master r04 / delivery r02。实际 `view_image` 查看 master r04 的 `master-desktop-twins-r04.png` 和 `master-desktop-density-r04.png`。

双子场景中月牙保持蜂蜜色与珊瑚下边，影子位于身体下方独立地面层，HP/阶段/动作位于 HUD；危险区和弹体在身体外。高密度场景以浅奶油低对比地面承托珊瑚敌人与鼠尾草友军，暖深棕外轮廓承担主要辨识；身体不能靠新增外发光替代轮廓。两图用于整体大小、色彩和图层关系，不覆盖最终 production-map 身体来源。仅月牙在本组有实际联合场景直接参考，其余 7 个身份仍须后续独立生产小图和实战验收。

## 来源状态复用

本组全部 8 身份：NEUTRAL→第 1 列；WINDUP→第 2 列；OPEN→第 4 列；P1/P2/P3→NEUTRAL。其余专名动作按 `sources.json` 保留已批准复用，不把技能名解释为新器官、新召唤或新动画资产。

|身份|复用 NEUTRAL 的专名动作|复用 ATTACK 的专名动作|来源条数|
|---|---|---|---|
|TWINS_MOON|SOLO、ORBIT、SWAP、SOLO_MOON|ECLIPSE|11|
|DRAGON|—|BREATH、TAIL、METEOR、STRAFE、EMBER_WAKE、WING_BUFFET、SKY_DIVE、INFERNO_RING|14|
|SPIDER_MATRIARCH|—|WEB、BROOD、FIELD|9|
|ASTROLABE|—|WELL、ORBIT、SINGULARITY|9|
|BLOOD_FORGE|—|ARMOR、SACRIFICE、OVERHEAT|9|
|VOID_CONDUCTOR|—|PULSE_MEASURE、SYNCOPATE、CRESCENDO、TWO_BEAT、FINALE|11|
|LABYRINTH_KEEPER|—|WALL、GATE、COMPRESS|9|
|NIGHTMARE_BLOOM|—|SEED、BLOOM、GARDEN|9|

源合同的 `runtimeAbilityIds`、独立 summon/effect/projectile 和 muzzle 说明已按动作保存在 sources.json。源合同对这些身体的 muzzle 都明确为施法提示可选，几何危险仍按 runtime source points；不得因龙嘴孔或花怪黑口而增加弹体或改逻辑出生点。

## 样板只读观察与依赖

已只读查看 `src/view/art/characters/rigData.js`、`rig.js`。当前样板支持可编辑 C/Q 路径、椭圆、固定空间部件、局部旋转及刚性部件、pose/ability/phase variants、固定 root 与 collisionCenter 转换、SVG 导出。共享 softPose 参数仍是样板，不能直接宣称满足本组各器官形变。

上游 Boss 源合同的设计画布为 512×512，root=(256,448)、collisionCenter=(256,288)，五类为固定投影，三类为脚中点；数值明确是拟议设计而非已测量资产。当前样板采用 256×256 且各身份 root/center 各自定义。正式分组合同尚未派发，本包不抢定公共接口；后续若统一缩为 256，(128,224)/(128,144) 仅是上游等比设计建议，仍需用实际新路径测量和主审确认。

后续开始生产的依赖：主审批准样板、明确本组独占新文件及 rig 数据合同。准确挂点、方向边界、透明导出、48/64/96 小图和连续动作验证均待正式实施。当前无来源缺失或审批矛盾。
