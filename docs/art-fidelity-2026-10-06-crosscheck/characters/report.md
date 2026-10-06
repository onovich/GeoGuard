# 角色与战斗美术只读交叉校对

2026-10-06。本轮没有改代码。当前抽查仍确认世界角色可见度、微型细节及高密度反馈层次不足；不重复登记新ID，归现有VF-01/02/05/06/12/14/20。UI已过的奖励精修不受此结论推翻。

## 本轮实机证据、来源与限制

本agent CUA首次初始化失败 `failed to write kernel assets: 系统找不到指定的路径(os error3)`；reset后及主审建议browserId2重试同失败。因此没有声称自行试玩，没有创建临时tab，也没有使用Playwright/CDP绕行。主审在独立当前游戏中提供本轮真实截图，我逐张view_image审阅：

- [normal-root-capture.jpg](normal-root-capture.jpg)：1280×720 DPR1，正常游戏首波约00:10，英雄/普通BASIC及命中碎片/数字。不是fixture。
- [wave31-root-capture.jpg](wave31-root-capture.jpg)：1280×720 DPR1，现有开发Balanced、Wave31后自然运行，中心Boss/敌群/反馈叠加真实样本。
- [hive-root-capture.jpg](hive-root-capture.jpg)：1280×720 DPR1，Sandbox/ClearEnemies后现有开发拖入HIVE，右边缘身体完整性受裁切，开发栏挡HUD不计玩家UI缺陷。
- [actual-twins-collapsed.png](../ui/actual-twins-collapsed.png)：UI审查组独立当前真实双子游戏2304×1334 DPR1；阅读tool缩小为2048展示，因此不从缩图精确量1px轮廓。太阳/月牙身份可见，太阳外置圈比五官更突出；这是单个状态样本，不是四状态连帧。

不复用10-03截图冒充当前实测。旧报告仅用于待办关系。尚无本轮九塔完整实机、14怪/全部精英逐身份、16Boss四状态连帧、十源弹体、95技能、DPR2证据。固定root无位移、炮口挂点连续性、器官数量跨帧、独立召唤对象AI/HP必须动态/实体证据，静图不能验收。本轮不能宣称完整角色还原已通过。

## 原画定位与生效规则

入口完整45板画册已读索引；本轮直接查看角色关键制作原板：friendly r01 basic-fixed-root、burst-fixed-root、player-fixed-root；friendly r02 cannon-sniper-fixed-root、rail-rapid-fixed-root、mortar-frost-fixed-root、sentinel-fixed-root；enemies r01 basic-root-lock、beacon-body-only；enemies r02 01-fast-tank至06-scout-siege全部六板；bosses-mechanics r02 pair-05-twins、r01 hive-production、r03 pair-07-forge-conductor；effects-ui r02 b01-friendly-projectiles、b03-hazard-lifecycle、b04-mechanic-feedback。

以上均在 `docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/`，各`submissions/rXX`完整路径依画册。另读integration r02/effective-specifications及friendly r03/production-notes。完整索引读完不等于所有45板像素逐板重验，本轮没有声称后者。

根锚点固定；世界位移只属逻辑。炮管刚性、表情随身体局部变形，LEFT整个rig镜像及后续残余瞄准；SENTINEL旧图单炮管旋转说明由r03覆盖。弹体与闪光分离；BURST四孔不等于五发缺一孔。HIVE/NEST召唤BASIC及SHARD是独立单位，不能烘焙进身体。精英层次为现有重装/能力怪，没有新增精英ID。原画渐变与白高光不是强制复制目标，按现行平色canonical；T1/T2/T3及等级允许获批复用，不误报缺成长身体。

## 当前确认差距

|优先级|结论与证据|对照原板|建议／既有待办关系|
|---|---|---|---|
|P1|normal英雄与BASIC都很小，身体五官比底栏肖像弱；双子大屏上仍是小物件，广阔空地中主角视觉权重不足|player-fixed-root、basic-root-lock、pair-05-twins及整体r04|沿VF-01/03收敛电脑相机/表现尺寸，使五官真正被看到，保持逻辑碰撞/危区/出生规则；不能只让UI变小|
|P1|normal敌人五芽轮廓看得出，但愤怒眉、口内白牙等在1×难分；英雄叶片及身体轮廓很细，小尺寸贴纸质感弱于原板|basic-root-lock五芽/两脚、friendly身体粗轮廓|沿VF-02/14定义屏幕外轮廓最小线宽及小尺寸五官版；不改变器官计数。九塔孔径问题本轮未逐塔证实|
|P1|Wave31中心有多层珊瑚碎片、数字8、环和身体形成小噪团，第一眼难找英雄/炉体；HIVE外围碎片和文字比眼部明显|b03,b04、pair-07-forge-conductor、hive-production|沿VF-06/05给命中、死亡、阶段效果密度/位置预算，主体表情优先；实际伤害和独立实体不能改|
|P2|normal英雄与双子根下影子很轻，角色像悬浮小贴图；背景大片斑的视觉面积强于根影|player-fixed-root分离root、HIVE及B04落地椭圆|沿VF-12调整独立root影，强于地面斑弱于身体，禁止用全身位移制造弹跳|
|P2|双子太阳花瓣/月体缺月和珊瑚底缘仍可区分，说明基础身份已经在场；太阳公共外圈对比强于身体，容易由圈而不是神态表达状态|pair-05-twins four poses|沿VF-05先补四状态1×窗口，校准外圈权重；不能静图直接判定凶脸映射缺失|

## 未验证／不能确认的事项

VF-04真实MOVE/ATTACK Q弹力度只能保留待办：本輪静截图不能独立证实动作过弱，更不能因位置不同误报root位移。VF-15放置成功珊瑚碎片语义本轮没有塔放置过程，不作为新确认。BURST历史炮孔不对称没有本轮实机复现，不重开此历史问题。SPLINTER死亡分裂、NEST召唤、机制地形清理、十源弹体造型/炮口及所有95技能均归VF-20补证，不编造遗漏或错误。

## 建议验收顺序

先用1280×720/1440×900 DPR1/2在实际1×建立英雄+BASIC+BURST+太阳的可见度尺度/线宽基准，然后九塔/14敌与精英逐身份；再记录真实MOVE/攻击固定root短连帧，最后16Boss四状态、十源弹体与高密度层次。每项保留当前画面及对应原板路径，缺证不等于缺功能，静态映射覆盖不等于美观还原通过。