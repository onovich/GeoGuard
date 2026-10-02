# 完整图册可用性评审 · 三位 subagent 汇总

评审范围：完整图册15张最终板、README、manifest、所有notes，以及配置、最终遭遇模板、战斗判定、渲染、界面组件与输入代码。三位评审分别负责单位辨识、战斗阅读、UI与制作落地；均逐张查看最终图像。本轮只做静态评审，没有改游戏代码、重新生图或运行实战测试。

## 共识结论

**整体方向成立，可用于确定风格和小规模制作试片；尚不能直接整套切图、量产或声称实战可用性通过。** 所有现有单位身份有主设定覆盖，但完整类型覆盖不等于完整动作、状态、交互和生产资源规格。

没有发现需要放弃整体方向的P0问题。P1表示进入可玩原型或量产前必须处理的事项；P2表示需要在原型中验证、优化的事项。三位没有对整体风格形成实质分歧，只是观察重点不同。

## 可以保留的设计

- 奶油留白、暖棕粗软线、鼠尾草友军、珊瑚敌军、薄荷菱形资源的主语法。
- 九塔以短嘴、大桶嘴、长嘴、双短嘴、上杯嘴、横哨嘴、双长轨、花扇嘴、厚肩区分功能。
- SHARD三瓣与SPLINTER滴形、FAST长耳与SCOUT眼睑腿、SHIELD盾瓣与MEDIC十字的功能造型。
- 16组Boss的不同剪影，特别是双子独立日/月身体。
- 虚线预警、连续生效边界、消散断环的视觉语法；可放置与无效状态同时带勾叉。

## P1：已经观察到的问题或规格缺口

| 问题 | 图/代码证据 | 修正建议 |
| --- | --- | --- |
| SNIPER在HUD小图近似双嘴，与RAIL混同 | ui-01-v3；towers-01、03 | 主精灵、卡片、拖拽预览共用同一身份资产；SNIPER单长嘴，RAIL双长轨，并在28px附近验证间隙 |
| 尚无真实尺寸简化版、碰撞中心、武器轴心 | 敌直径10–34px、塔26–36px、Boss48–70px；combatOffenseRuntime.js:64–76从塔中心发弹 | 身体与朝向器官拆层，定义pivot、逻辑radius、视觉bounds；不能整只旋转倒挂或因拉伸改判定 |
| 塔升级与Boss阶段小图不足以作为状态资产 | towers-02 Lv1/Lv2相近；bosses-02部分阶段格是巢、蛋、锁标 | 等级用清楚徽章；每阶段保留完整同身份Boss，节点另做资源 |
| 基础Boss阶段不是全部最终运行时能力 | encounterRuntime.js getBossPhaseOverrides / enrichBossTemplate；DRAGON最终增加扫射、余烬、翼击、俯冲、火环 | manifest必须区分基础配置与最终运行时动作清单；三格阶段图不能当完整动作规格 |
| OPEN说明混同“没有局部核判定”与“没有整体易伤” | bossCombatRuntime.js:19–24；bossMechanics.js Prism 1.2、Astrolabe 1.35 opening倍率 | OPEN表达整体恢复/易伤；不暗示必须射中腹核。可破节点才表现为独立目标；旧notes这处表述需校准 |
| 线危险可见宽度小于实际判定 | combatRules.js:50按distance<=width+target.radius；canvasRenderer.js:1140画width*0.7–1.2 | width是半宽，完整伤害带按2*width绘制；玩家自身半径也需退出边界。这是现有代码差距 |
| 三态预警没有对应的持续ACTIVE字段 | combatFrameRuntime.js:123到点同帧结算并删除或重置pulse | 结算事件触发生效反馈，消散纯视觉；不能为了动画延后伤害；WEB/ROOT读取真实脉冲和增长参数 |
| SEAL/RETICLE实体被画得像塔附着状态 | mechanics-01-v2；bossOptimizedAbilities.js:42、90节点在Boss与塔中点，HP16 | 拆分可破节点与塔位目标标记/冻结覆盖；否则玩家看不到真实反制目标 |
| 十种发射源缺少对应美术身份键 | combatOffenseRuntime.js:5、68仅保留kind/color；运行kind主要basic/cannon/sniper | 加入稳定的发射源美术标识后再分配弹体外观，保持弹道与判定 |
| 敌方幼体/月体与友军色存在歧义 | bosses-02 HIVE奶油蛋；bosses-03蜂蜜月；紫音符/污染与RAIL辅色 | 孵化复用实际珊瑚BASIC；月体保持角色色但加稳定敌方标记；危险辅色同时有珊瑚边界 |
| 塔菜单原画暗示正式收费升级/属性分支 | ui-02；useGeoGuardGame.jsx:715–739与useCanvasGameLoop.js:184–191仅debug调级；TowerContextMenu仅整体升降 | 该菜单标为测试工具；不把图片作为新增玩家玩法授权 |
| 奖励图改了生效对象和流程 | rewardRules.js:190升级只强化后续建造、已有塔不变；WaveRewardOverlay.jsx:69点击卡立即应用 | 从真实choice数据渲染；区分蓝图等级与既有塔等级；不添加确认步骤或免费附加修复 |
| 手机组合HUD与触控规格缺失 | ui-01手机未画Boss信息/试玩按钮/提示组合；GameHud.jsx:59、68；PlaytestExport.jsx:19 | 360/390px与横屏测试双子双血条、阶段、狂暴、护卫、动作、提示与试玩按钮同时存在 |
| 44px只是原画建议，代码未保证 | designSystem.js:25 sm无min-height；塔菜单行与提示关闭更小 | 实测关键触区，加入最小高度；保留180ms拖起、横滑取消等现手势，不把概念固定摇杆当真实控件 |
| 开发工具原画字段不等同实际组件 | BossEditorPanel.jsx:121；GameScreen.jsx:111；OverlayScreen.jsx:14 | 保留实际identity、summary、hpBelow、节点condition等字段，只改样式。音频布局、统计、toast关闭与清场确认属于提案 |

## P2：待原型验证的风险

- TANK/BOMBER/SIEGE/COMMANDER的宽云团家族在大图有区别，但爆破引信与装甲差异能否在小尺寸快速读出尚未验证。优先扩大主轮廓差，而不是加纹理。
- MEDIC十字和Bloom大嘴、SENTINEL肩垫和SHIELD盾瓣需保持功能区别；不能给无护盾的SENTINEL套护盾效果。
- 资源吸附速度400，可能与绿色弹体和命中碎片混淆；资源保留菱形无弹尾，限制绿色装饰碎片。
- 当前实体后绘制hazards、particles、浮字，危险填充和装饰可能盖住玩家；建议危险浅填下层、危险边界上层，限粒子与浮字。这是未测试的密度风险。
- 建议色值中棕字对奶油对比很好；鼠尾草、薄荷、珊瑚不能单独承担细文字/细边界。建议色值计算不等于图片像素测量或完整无障碍验证。
- 无透明精灵、atlas或缓存方案，不能直接从带背景/标签的整板裁切后宣称生产就绪。高射速与高敌数场景性能必须测帧时间。

## 下一步的最小验证范围

1. 先修规范：唯一身份来源、最终运行时动作映射、debug菜单/奖励语义、节点与塔状态区别、整体易伤说明、线判定宽度。
2. 制作少量真实尺寸试片：玩家；BASIC/CANNON/SNIPER/RAIL/RAPID/BURST；BASIC/FAST/SCOUT/TANK/BOMBER/SPLINTER/MEDIC/JAMMER；COMMANDER/TWINS/DRAGON，另含SEAL/RETICLE。
3. 在现Canvas中测炮口朝向、压缩拉伸、真实判定圈、线/圆/交叉预警、WEB/ROOT脉冲、TEMPO节拍。高密场景同屏资源、粒子、控场同时开启。
4. 测360/390px竖屏与横屏组合HUD，实际触区、横滑/拖塔/第二指移动。记录辨识误判、遮挡和渲染帧时间P95。
5. 以上通过后再制作全量动画、状态和UI资源。

## 对现图册的更正声明

主造型覆盖仍然完整。现图册/旧notes关于基础阶段、OPEN、升级菜单和奖励流程的部分描述不应视为最终运行时规格；以本评审指出的源码差异为准。此报告收集反馈，不表示已实施修复或已通过实战验证。

## 原画修订落实

修复范围仅原画与docs，未实现游戏原型。通过制作示意见 [修订规范](usability-refinement/notes.md) 与默认图册。原P0/P1所要求的真实像素、高密度战场与手机交互验证仍待资源制作阶段，不将原画验收等同实战解决。身份锚点、独立节点、2×width、结算/fade、奖励/玩家UI、全身OPEN与最终运行动作已有针对性修订；旧功能板归档保留。
