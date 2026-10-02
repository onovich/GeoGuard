# 不可改逻辑、快照及验收方法

## 现阶段事实

本r01只读分析了代码与已批准原画，创建自己的新文档。未运行游戏、未测实机、未宣称原画/性能/动画通过。observed-baseline.json 是当时工作区指纹，发布未完成，不能当正式发布基线。build-contract.mjs 只读import当前data/engine构造模板，输出到本r01；verify-contract.mjs只读核验。禁止READY后重跑builder覆盖本revision。

48/375/95从上游资料与当前模块交叉核对，95有效源码摘录全部匹配，覆盖无缺项。当前技能/实体事实在对应JSON中可追踪。后续发布基线如果变更，主审应保存另一个release-baseline，比较后决定是否重做合同，不直接改本包。

## 文件级保护

阶段放行后冻结 `src/data/**`、`src/logic/engine/**`、配置/依赖与既有tests；逐文件SHA核验。预定engine例外仅combatOffenseRuntime.js的三字段元数据追加，以及combatFrameRuntime.js在原真实命中后发出可选onProjectileHit观察通知。代码审阅逐行确认只有约定字段/入参/通知，没有数值、命中分支和原结算调用顺序改变。任何其余hash差异必须逐项解释，不能以“只是表现”为由跳过。

hooks允许资源effect、只读DTO/sidecar事件捕获、绘制参数与重置，但 update顺序/dt/RNG调用/输入/暂停/战斗函数参数不得变。renderer/UI不得写到state；开发环境用deep-freeze DTO运行所有绘制与暂停/打断用例，捕获意外写入。Canvas上下文允许变更，view缓存独立于模拟。

初始严格核验：`node docs/art-implementation-2026-10-02/integration/submissions/r01/verify-contract.mjs --baseline`。提交后普通核验不把后续获准src变更视作封包篡改；--baseline是专门的当前工作区对照，用于派发前和只读阶段证明。

## 行为差分快照（接入前后QA实施）

固定seed并在模拟测试边界替换随机源，两组同样dt序列和输入事件；渲染侧绝不调用共享Math.random。独立运行旧实现与新实现，比较每帧模拟快照，不只最终截图。Set以稳定目标uid序列序列化，对象引用关系以domain/uid保存；不要排序会影响逻辑的实际数组。快照按原顺序保留 projectiles/enemies/hazards。

比较范围：player位置/速度/HP/半径/冷却/slow；塔位置/HP/等级/冷却/冻结/目录费用；敌uid/id/HP/shield/phase/burrow/fuse/所有权；Boss phases、actionMode/actionTimer/castAbility/锁定点/冷却/partnerFallen；机关uid/parentUid/targetUid/timer/life/cargo/escaped；projectile当前/previous坐标/vx/vy/life/damage/radius/pierce/hitEnemies；hazard全部几何/计时/伤害/脉冲/归属；掉落/货币/奖励choices、wave状态与事件顺序。

仅允许从两侧快照中剔除约定三个新projectile元数据键 `sourceArtId/sourceUid/shotIndex`；sidecar本来不在state。禁止忽略x/y、计时、伤害、随机顺序或整个数组。源字段本身另测所有9塔/PLAYER、不同level与BURST每弹索引的正确性。相同运行环境固定输入的数值比较应完全相同；不要设置大容差吞掉发射位置变化。

onProjectileHit还要测无回调/正常只读回调/内部异常被hook隔离三种情况，实际命中序列与快照完全一致；回调次数跟真实直接命中数一致，pierce连续命中可多次、超时不通知、不替代溅射波。测试回调不能反向写入传入实体。

首轮中心出生方案要求“模拟差异=0”。真实炮口备选若将来批准，不适用零位置差异，而须按coordinates-and-assets中的逐目标命中顺序/时刻专门审查，仍不可顺带修改伤害/速度/life/AI。

## 运行检查矩阵

|集合|必须覆盖|
|---|---|
|友方|九塔LV1..LV4、PLAYER移动/停止/自动射击，RIGHT/LEFT/UP，真实burst升级，多塔同帧发射，子弹本帧出生即命中|
|普通敌|14身份含SPLINTER；SHARD分裂、BEACON生成成功/受预算限制、BOMBER引信、PHASE隐相、BURROWER出土、SHIELD破盾、MEDIC/JAMMER范围|
|Boss|16遭遇/17身体、各现有tier/phase、95默认/幸存技能；idle/windup/attack/recover打断与相位intro；双子分别先杀日/月|
|机关|7种独立HP/击破/到期/父级失效；ROOT子根独立uid；SEAL/RETICLE提前击破与真实触发；COURIER击破返还/逃走不返还|
|危险几何|area半径/target半径关系、line的2*width全宽与端帽、每次pulse半径更新、地形owner清理、Boss死亡仍合法残留攻击|
|操作|开始/移动/建造/取消/资金不足/碰撞拒绝/原有contextmenu/奖励1-2-3/暂停Esc/失焦/声音/结束/重开|
|资源|慢网/缺图/解码失败/版本缓存/组件卸载中断；回退单实体；fallback发生须报告，不能混入最终覆盖通过率|

## 桌面视觉与布局

960×720、1280×720、1440×900，DPR1/2，另作窗口resize与系统缩放的实际记录。主审图册A/B分别普通密集清场和双子战斗是合法互补快照，不能为了截图把不相容技能与角色拼成一局。实际runtime帧记录应附seed/波数/实体计数/塔目录/HP来源与截图，不固定为原画数值。

冻结世界坐标/摄像机播放完整循环，root误差允许仅栅格采样的小于1源像素显示误差，元数据数值必须完全一致。检查炮组刚性、不漂脚、器官数量和遮挡、不镜像文字、没有第五炮孔或PLAYER五官。身体/弹体/召唤/危险区分别开关层，确认没有烘焙混入。

纹样弱于影子，弹体/薄荷菱形掉落/危险边界可辨；危险线实际半宽不丢。检查幽灵位置与鼠标、放置有效性标签、射程不误当伤害区。视口边缘允许自然裁切，但不能声称裁切的范围“完整可见”。三桌面尺寸下HUD、双成员Boss信息和BuildBar不遮必要交互。所有费用/等级/奖励文本从实际props读取，关键字不少于批准规格；测实际合成背景对比目标4.5:1，低资金文字不靠整体低透明度变糊。

## 性能和测试

G2/G5都在同一浏览器/硬件/DPR/seed/场景运行基线和替换，各3次固定60秒，预热与冷加载分开。记录模拟时间、draw p50/p95、总帧p95、长帧数、图集下载/解码时间与估算纹理内存。首轮目标总帧p95不超过基线1.2倍、没有新增持续输入卡顿；这是待测验收目标，不是已保证性能。若基线本身不能达目标设备帧预算，主审决定目标，不能未经测量宣称60fps。性能降级可减少无伤害粒子，不能省略危险边界/实体/血条。

接入后运行现有 `npm test`、`npm run check:architecture`、`npm run build`；保留完整退出码/日志，新增最小差分与资源合同检查由QA独立文件承载。不为每个静态颜色写镜像实现的测试。现有Boss/player模拟覆盖复用，结合实机操作证据；测试通过不替代视觉验收。

最终主审分别给资源、代码接入、玩法不变、桌面视觉、性能/加载五项结果，所有必需项通过后才能标完整可玩替换。当前r01这五项均未执行，等待基线与合同审阅。
