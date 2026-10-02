# 玩家 UI 精细设定板：准备审阅

日期：2026-10-02（Asia/Shanghai）。负责人：ui。阶段：只读代码审阅完成，等待主审批准 master 并下发整体原画/风格合同。本文不是正式提交，不创建 packet 或 READY，不自标 accepted。

写入范围仅本 ui/ 目录。本阶段没有生图、修改游戏、修改历史美术、接入资源、提交或部署，也没有给其他会话发消息。

## 已读权威与适用顺序

1. `../coordination.md`：master 获批后才可生成拆解；本组未来暂定三张 UI 板；只包装真实玩家功能；原画须用 imagegen 内置工具。
2. `../../production-art-2026-10-02/final-acceptance.md` 与 `reviews/effects-ui-r02.md`：上一轮 accepted 权威为主审记录，历史包里的 submitted/pending 字段不可改写。
3. `../../production-art-2026-10-02/effects-ui/submissions/r02/ui-color-type-spec.md` 与 integration r02 `effective-specifications.md`：文字覆盖旧 B05 白字浅绿，所有新浅底 UI 使用深棕字 #4B281C；尺寸、字号、触控、对比均为设计规格，不等于设备实测。
4. friendly r03 `reuse-design.md` 与 `production-split.json`：9 塔图标的已批身体与器官守恒来源；LEFT 整个局部 rig 镜像，RIGHT 默认，UP 按已批构造，点徽/文字为外部可读层。
5. 已读取 `C:/Users/Administrator/.codex/skills/.system/imagegen/SKILL.md`。后续用内置 image_gen；每张输入引用先用 view_image 实际查看，保存完整 prompt、引用角色及生成记录，将项目图保存到本组工作区。当前未生成图，也未把下列来源清单当作已完成的图像审阅。

## 代码证据范围

代码均相对项目根 `D:/WebProjects/GeoGuard/`。以下行号为本次读取快照，未来出图前若代码变动需复核。表中“当前”指源代码，未跑设备或游戏测试。

|入口|审阅重点与证据|
|---|---|
|`src/view/screens/GameScreen.jsx`|canvas、HUD、StatusBanner、BuildBar、奖励、开始/结束、暂停的组合；debug 面板与测试导出并存；暂停仅在 PLAYING 且没有活动奖励时显示|
|`src/view/components/GameHud.jsx:20`|操作提示局部 state、手机 30 秒倒计时、关闭按钮；34 行只在 PLAYING 渲染；59 行 Boss HUD；109 行提示|
|`src/view/components/BuildBar.jsx:87`|hover title、鼠标拖、触摸 180ms/上滑判定、资金不足样式、费用/等级/间隔字段、拖动提示|
|`src/view/components/OverlayScreen.jsx`|START/GAMEOVER 标题、结束波次与时长、开始/重开；localhost/127.0.0.1 开发入口|
|`src/view/components/WaveRewardOverlay.jsx`|仅 rewardState.active 显示；四种卡型样式；实际 choices.map；桌面三列/手机一列；整卡点击，没有独立确认或刷新按钮|
|`src/view/components/StatusBanner.jsx`|仅渲染 message.title；tone/accentColor 控制外观；subtitle/threats 不作为当前横幅正文|
|`src/logic/hooks/useGeoGuardGame.jsx:78`|HUD React state、reward state、paused；181 行资金/HP 同步；355 行开始/重开；449 行清拖；529 行起拖；568 行奖励应用；695 行附近 debug-only 升降级|
|`src/logic/hooks/useCanvasGameLoop.js`|WASD/方向键、Esc、临时按下点移动、触摸 id、拖放释放、touchcancel、失焦/隐藏自动暂停、debug-only 实例右键|
|`src/logic/engine/rewardRules.js:36`|修复/补给资格与金额；82 行最多三选择；143 行 materialize 文案；193 行效果应用|
|`src/logic/engine/rewardFlowRuntime.js`、`progressionRules.js`|Boss 结算后的 state.money 用于奖励候选；选择后闭卡并普通模式开始 currentWave+1|
|`src/logic/engine/enemyDefeatRuntime.js`|Boss 赏金即时入账；双子/遗留危区或机关可能先等待余波，再打开奖励；不要假定一个成员死亡立刻开卡|
|`src/logic/engine/towerRules.js`、`debugTowerRuntime.js:30`|升级预览字段；placed tower 建造时复制当前蓝图 stats 与 level，后续奖励不批量更新实例|
|`src/logic/engine/placementRules.js`、`gameRules.js:22`|屏幕转世界坐标、资金优先失败、靠近玩家/塔/敌人失败、回栏取消、真实取消 margin 18px|
|`src/logic/engine/bossHudRuntime.js`|遭遇组/成员动态字段、双子独立成员、阶段/狂暴/护卫/暴露动作|
|`src/view/canvas/canvasRenderer.js:1254`|拖塔射程环与 ghost；28 行等级徽；891 行受伤塔 HP；1329 行只在 joystick.active 显示临时按下点|
|`src/data/gameConfig.js`、`src/logic/engine/gameState.js`|UI_COPY、9 塔顺序/名字、初始 3 塔、初始 money=45 与 HP=100、level0..3；这些初始值不等于每张图固定数值|
|`src/view/components/PlaytestExport.jsx`、`DebugSpawnPanel.jsx`、`TowerContextMenu.jsx`|确认研究/调试边界；试玩数据源代码在非 START 可见，不能误写成它已有 debug guard；本轮依据协调范围排除美术包装|

## 逐玩家功能与动态字段

|功能|真实触发/显示条件|动态字段与画法约束|
|---|---|---|
|HP|PLAYING HUD|`health/maxHealth` 与比值条；health 同步 floor(player.hp)，下限 0；当前 maxHealth state=100。保留 HP 标签、数字和条，不把伤害数字写死|
|波次/计时|PLAYING HUD|`currentWave`、`formattedTime`；时间为 gameTime 向下取整并格式化 mm:ss；正常显示 WAVE；TEST FIELD 是 debug 标签，不进入玩家板|
|资金|PLAYING HUD|`money`，建造/拾取/赏金/奖励等同步；∞仅 debug。本轮保留实际资源图形与金额，不发明经验、钻石商城或第二种货币|
|暂停|HUD 暂停按钮或 Esc；失焦/隐藏也会暂停|`paused && PLAYING && !rewardState.active` 的遮罩、标题“游戏已暂停”、说明与“继续游戏”；奖励时 togglePause 不生效；无暂停菜单里的设置/退出/购买|
|Boss HUD|`bossHud.length > 0`|group.title、counterplay；member.name、hpRatio、phase、enraged、phaseIndex/phaseCount、actionLabel、guardCount；P{min(count,index+1)}/{count}，ENRAGED 条件后缀。exposed 只影响动作标签样式；不可新增护盾数值条或未渲染的 summary/threats/phaseHint 面板|
|状态横幅|`waveMsg` 非空、计时自动清除|message.title、tone、accentColor；覆盖波次来袭/Boss 出现/阶段消息实际 title，不画额外 next-wave 倒计时或任务面板|
|操作提示|showControlsHint 局部状态|PC: “电脑：WASD/方向键移动，拖拽塔卡建造”＋“我知道了”；手机: “手机：长按空白处移动角色，拖拽塔卡建造”＋“知道了 ({hintCountdown}s)”。倒计时只属于手机提示，不是波次时间|
|开始|gameState=START|“几何防线”、UI_COPY.startDescription、“开始游戏”；背景只能使用整体 master 的非玩法装饰，不能新增角色选择/商店/声音入口|
|结束|gameState=GAMEOVER|“防线崩溃”、`到达第 {currentWave} 波 · 战斗 {floor(time/60)}分{time%60}秒`、“重新挑战”；无击杀数/得分/排名/胜利页，因为当前没有这些玩家字段|
|建造栏|PLAYING；数据为 available 塔排序|`tower.name/cost/level/fireRate`；Lv.{level+1}/4，level>0 才有 UP +{level}；类型优先 splash→pierce→slowRatio→burstCount→单体。hover title 的 summary/damage/fireRate/range 是桌面已有说明，手机没有新弹出详情入口|
|蓝图解锁|奖励 choice.type=unlock|choice.title/subtitle/detail，解锁加入栏并给 tower.cost 试建资金；不是解锁立即放塔|
|蓝图升级|奖励 choice.type=upgrade|当前级→预览级、当前造价→预览造价、真实补贴 amount、伤害/射程/间隔/相关特殊参数由 choice.detail；只作用后续建造；无收费升级按钮/长按升级/已放塔菜单|
|补给/修复|choices 中实际支持卡|choice.amount/title/subtitle/detail；选择一种即时应用，并普通模式进下一波。修复恢复玩家 HP，不能画成修理选定防御塔或全塔加血|
|移动按下点|canvas 按下至释放且允许输入|`joystick.active/startX/startY/currentX/currentY` 为临时反馈；不画常驻屏幕左下摇杆。当前鼠标空白按住也进入临时移动，PC 文案仍用已有 WASD/方向键|

未渲染字段不可冒充玩家功能：HUD 接收 waveOverview/audioSettings/setAudioEnabled/setAudioVolume，却不显示波次概要卡、音量或静音控件；Boss 数据 summary/threats/phaseHint/phaseTone 不是额外菜单。此次仅画当前展示字段与真实状态的美术包装。

## 建造与状态闭环

|状态|代码行为|后续板需表达的内容|
|---|---|---|
|初始可用|normal initGame 仅 BASIC/CANNON/SNIPER available|开始局通常 3 卡；9 塔全目录用于来源板，不把 6 个未解锁塔硬塞成玩家栏里的锁卡|
|解锁后|available filter＋sortOrder|显示真实已解锁集合；顺序 BASIC/CANNON/SNIPER/RAPID/MORTAR/FROST/RAIL/BURST/SENTINEL|
|普通/hover|鼠标左键开始拖；hover title 已存在|正常卡、hover 读数，卡图标采用已批角色，不是现行圆/方/三角占位的器官重设计|
|低资金|money<number cost 仅 opacity 样式，仍可起拖|“disabled/不足”是状态样式规格，不宣称 HTML disabled；保留可读费用，体现失败反馈，不画点击购币/付费升级|
|拖中|dragTowerId 高亮＋buildHint|选中卡、拖到场地提示、世界 ghost 与真实 range 圆；触摸 180ms 或主要向上拖越过阈值起拖，横向移动优先滚栏|
|可放|canPlace=true|ghost/射程圈与清晰边界，可加入同状态形状区分作为美术编码，不能新增确认按钮或更改范围|
|不可放|先 money，再玩家/塔/敌人间距检测|资金不足或位置无效；release 后真实 invalidReason 浮字，ghost 清空；范围危区不自动等于不可建造区|
|回栏取消|释放位于建造栏 rect 扩展18px|结束拖动，不扣钱，不新增垃圾桶/回收塔/卖塔按钮|
|成功建造|release 合法时扣 tower.cost 并 createPlacedTower|世界新增塔、资源更新、放置粒子；卡片仍是蓝图，不被消费为单次库存|
|中断|paused 或 rewardState.active 清拖与上下文|暂停/奖励中不可继续拖；touchcancel/blur 也清输入。不要显示弹窗背后仍有活动放置指引|
|已有塔状态|canvas 根据实例 level/hp/frozenTimer|等级外部徽、受伤 HP 条、冻结独立圈；不与建造栏蓝图等级混为一谈，不加实例升级入口|

危区/放置圈/角色/世界血条同场时，危区边界须清楚且形状符合已有圆盘/线段判定，建造射程只是范围提示；背景最弱。放置资格没有读取 hazards，不能把预警红区画成“禁建”。世界中心/root/碰撞转换保持原合同；UI徽、数字不随身体镜像。

## 奖励、蓝图与修复流程

普通流程：START → 开始 → PLAYING/波次横幅 → 清普通敌人 → Boss 出现/动态 HUD → Boss 或整个遭遇击破、赏金即时入账 → 如有指定余波先等待 → rewardState.active、战斗更新停止 → 点击当前一个 choice → 关闭奖励、更新 catalog/money/HP → currentWave+1。

三选一常规示意必须以真实 `rewardState.choices` 为准：展示“解锁/升级/补给”的一组，再用独立流程替换示意展示修复占用其中一个卡位。四种卡型可以在组件分类区分别列出，但同一奖励弹窗不得出现第四卡、修复附送卡、刷新/跳过/二次确认按钮。

修复候选只在 missingHp>0 时生成，amount=round(min(missingHp,18+waveNumber*3))；补给常规候选需非无限资金且 money≤70，amount=40+waveNumber*10，fallback 可用 30+waveNumber*8。候选按历史/解锁/等级/使用情况/支援优先级构成，不承诺每次固定三种内容。图中的数值须注明示例及 choice 动态绑定，运行 UI 文案不靠裁图文字。

升级预览来自 upgradeTower：level0..3 对应显示 Lv1..4，cost/damage/range/hp/fireRate/特殊参数随真实预览变化；升级补贴是新旧造价差。既有实例保留建造时复制的 level/stats，蓝图与实例可同时呈现不同等级，不画全场自动升阶。

边界发现（静态推断，非测试结果）：buildRewardOfferPlan 只保证最多3项，不保证永远正好3项。所有蓝图解锁且满级、满血时可能只有一张 fallback 补给；受伤时可能两项。本轮常规板按主审要求三项，但规格需维持 choices.map，不用虚构卡补齐。是否额外示意退化数量由主审整体范围决定。

## 桌面与手机布局准备约束（等待 master 定案）

以下是下一阶段必须体现的布局区别，不是预先批准的精确构图或实机结论。

|区域|1440×900 桌面逻辑视口|390×844 手机逻辑视口|
|---|---|---|
|顶部 HUD|HP 左、波次/时间中、资源/暂停右；留宽横向间隔|三块信息紧凑分配；暂停触控≥44×44，费用/HP/时间不可缩成难读微字|
|Boss|保留遭遇 title/counterplay 和全部成员；双子逐条可读|更窄且允许文字换行；必须展示双成员/阶段/动作/护卫；与横幅分配层次避免盖住中央角色|
|建造栏|已解锁卡可横向展开，最多9塔集合；不是固定9卡开局|单行横向滚动，边缘露出下一卡/已有渐隐反馈；不能挤9塔成微图标或改成未存在分页菜单|
|提示|靠近建造栏但不覆盖费用与拖出区域|更短行长与多行排版，关闭目标充足；提示有手机倒计时，不画 PC 倒计时|
|奖励|同一个弹窗内三列卡|一列纵向排列，保留既有 overflow-y-auto；三项都可到达，禁止缩成不可读的三列|
|开始/结束/暂停|居中单面板，留中央视觉标尺|390宽扣边距后完整排版，结束统计可换行，CTA≥44px高；不添加退出/设置|
|移动反馈|键盘操作为主，空白按下点有条件反馈|触点临时出现、移动/建造触点需区分；无常驻摇杆|
|密集战斗|布局示意需保留开放中央战斗空间|重点复核顶部 Boss/横幅、底栏/提示/临时触点共同出现时的遮挡；是原画审阅，设备验证留后续|

字色合同：奶油 #FFF9EF、浅绿 #B6D4AE、浅蓝 #C7E4F4、珊瑚 #F4ADA0、蜂蜜 #F8DDAA 均以 #4B281C 作为正文/按钮/关键标签文字。正文≥14逻辑px、行高≥1.45，CTA≥16，辅助标签≥12，关键成本/状态≥14，触控目标≥44×44。设计目标普通文字对比≥4.5；主审上一轮计算的实色对比不等于本轮合成或设备测试。背景/遮罩变化后须重新验实际合成色；不足态不能只靠整体降透明度。

## 9 塔图标来源清单

下表源板路径相对 `../../production-art-2026-10-02/friendly/`，来自 r03 production-split NEUTRAL，全部第1格。当前只是读取映射，后续每张参与生成的原图必须先 view_image。图标继承身体，等级/费用作为外部 UI；不得为迎合卡框重新设计眼、脚、芽、炮管。

主审补充（2026-10-02）：9塔 UI 小图标允许直接复用已批 NEUTRAL 身体，按上表逐身份记录真实源板/行/第1格。后续生产规格为从指定身体格提取主体，去除技术导线、格名/标签与源板上的独立徽记；费用、等级、状态徽由独立 UI 层叠加，不烘焙进图标。精细 UI 原画用代表性卡片完整展示形制与状态，未展示的塔仍逐源映射，不要求重新生成9只角色。以上是复用/生产规格，尚未提取或导出透明图标，不把原画板或来源格当成已交付透明资源。

|身份/玩家名|已批身体板、行|关键器官守恒|
|---|---|---|
|BASIC 速射塔|`submissions/r01/basic-fixed-root.png` 唯一主身体行|圆身、2顶芽、1后瓣、2脚、1近眼/脸颊弧、1短单管|
|CANNON 榴弹炮|`submissions/r02/cannon-sniper-fixed-root.png` 上排 CANNON|宽圆身、2后上芽、2脚、1近眼、1大桶嘴|
|SNIPER 穿透塔|同板下排 SNIPER|连续长颈梨身、2脚、2颈顶眼、1腹垫、1细长单喙|
|RAPID 链锯塔|`submissions/r02/rail-rapid-fixed-root.png` 下排 RAPID|圆身、2芽、1后瓣、2脚、1近眼/弯嘴线、2上下短管同刚性组|
|MORTAR 迫击塔|`submissions/r02/mortar-frost-fixed-root.png` 上排 MORTAR|宽圆身、1后三角芽、2脚、1眼/颊点/笑线、1上斜杯嘴|
|FROST 霜冻塔|同板下排 FROST|横椭圆身、2芽、2侧鳍、2脚、1近眼、1横哨嘴、2腹条|
|RAIL 磁轨塔|`submissions/r02/rail-rapid-fixed-root.png` 上排 RAIL|长颈梨身、2脚、2颈顶眼、1腹垫、2平行长喙同组|
|BURST 散射塔|`submissions/r01/burst-fixed-root.png` 主身体行|圆身、2芽、1后瓣、2脚、1眼/笑线/腹斑、共面4等径孔规则2×2；不按5发逻辑画5孔|
|SENTINEL 哨戒塔|`submissions/r02/sentinel-fixed-root.png` 唯一主身体行|圆身、2芽、2脚、2圆肩垫、宽眼槽1亮点、1短管；LEFT遵守r03覆盖|

如需要在流程/布局里显示 PLAYER，来源 `submissions/r01/player-fixed-root.png` 上排第1格；蜂蜜连续水滴＋1sage叶，0眼0嘴0手0脚0炮。不可把玩家画成与9塔一样有五官的卡通小怪。

## 待主审合同与后续三板覆盖

依赖：master 获批的具体 revision/主审记录、整体桌面/手机原画、风格合同、UI可用边缘空间与遮挡优先级、参考图清单。没有收到这些之前不生成后续拆解，不提交正式包。

1. UI01：桌面/手机 HUD＋真实 available 建造栏＋操作提示；包括单Boss/双子 HUD、横幅并存、临时触点、放置预览，保持两视口明确区别。
2. UI02：开始/结束/暂停＋同屏三奖励与修复替换流程；动态字段来源、下一波、蓝图仅后续建造与已有实例不变须清晰。
3. UI03：用代表性卡片展示完整组件形制、费用/等级/不足态/hover/拖放失败和取消；危区/范围圈/身体/血条的共存；9塔逐源映射与 NEUTRAL 复用/去导线/独立徽记规格，注明透明图标未导出；按主审空间合同调整密度，不能靠微字堆满。

当前需要主审注意的事实（不构成主动问询，也不改代码）：

- 当前顶部 Boss HUD top=96px 与 StatusBanner top=13% 可能相交，手机 counterplay/双子占高；需整体合同给出原画层次/留白，不能以隐藏真实成员换取干净图。
- 当前提示的手机判断是 UA，canvas/mobile 是视口<768，BuildBar触摸模式是 pointer coarse；后续布局以两种指定逻辑视口设计，不声称现有检测已统一。
- 手机提示的倒计时 effect 只检查 PLAYING，没有检查 paused/reward.active；因此现码可能在弹窗期间继续倒计时。提示关闭状态由局部组件保存，重开没有显式 reset；图不承诺每局必重放提示或暂停冻结倒计时。
- `isOverflowing/isTouchDevice` state 本身没有渲染新文案；只看到 showLeftFade/showRightFade。不得据变量名新增手势菜单。
- 当前试玩数据入口并非 debug-only，但本轮协调明确“编辑器/测试导出不做本轮美术”。这是授权范围排除，不能把图说成当前代码截图或完整逐像素复刻。
- 源码没有常驻摇杆、音频控件、付费升级、售塔、塔实例玩家右键菜单、第四奖励、下一波倒计时或胜利统计；所有后续板保留这条功能边界。

生成后每图先实际查看与记录问题；本组只能标 submitted，不自审通过。未来按 `submissions/rNN/` 不可变封包，packet.json 保存 files/SHA256/images/coveredRequirements/openIssues/dependencies/summary，最后原子更新本组 READY.json。已封版本不覆盖；主审拥有审批权。此刻仅 preparation.md，停止等待主审下一阶段指令。
