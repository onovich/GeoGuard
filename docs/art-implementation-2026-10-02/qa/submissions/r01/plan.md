# 独立 QA r01：实施前验收计划

日期：2026-10-02（Asia/Shanghai）。状态：计划提交，等待主审授权 QA 实施。仅本目录可写；本次没有修改 src、tests、scripts、package、基线目录，没有使用 Git、发送跨线程工具消息、启动游戏、运行测试或截图。

## 依据与边界

以 `production-art-2026-10-02/integration/submissions/r02/production-map.json` 和其外部正式审查 `reviews/integration-r02.md` 为身体、动作、效果权威，以 `scene-ui-2026-10-02/delivery/submissions/r02/` 和 `reviews/delivery-r02.md` 为桌面权威。封包自身的 submitted 不覆盖外部主审 accepted。旧 desktop-usability-review 中缺口已由 UI r02、background r02、master r04 原画补证，不能误报成仍未通过原画，也不能把原画通过当作运行时通过。

已读取并解析的集合：48 身份、375 动作条目、95 默认及双子幸存技能、30 桌面需求。拆分为 9 塔/99、玩家/7、14 敌/77、17 Boss 身体/164、7 机关/28。现有模板另枚举180个成员/阶段/技能组合（93默认唯一技能），加两种幸存技能共95；desktop-coverage.json附48项UI细项。`action-coverage.json` 每一原始 key 都单独登记，当前运行与视觉状态均为 not_run。身体复用、方向构造、等级叠层是合规映射，不要求 375 套独立动画；每条仍须实际渲染和人工审图证据。

本次 source-observation.json 只是读到的文件字节哈希，不是发布基线。基线正在发布，共享工作区可能变化；执行前必须读取主审批准的 immutable baseline、验证其中文件与包哈希，并记录 candidate 快照。不得把当前工作树当成旧版本、补造旧运行结果。授权后 QA 仅拥有 tests/art-*.test.js、scripts/art-validation/ 及主审许可的下一版 QA 提交目录；共享入口变化交给集成 owner。

## 现有接口与可复现入口

|用途|已存在接口|局限与执行方式|
|---|---|---|
|真实游戏|`npm run dev -- --host 127.0.0.1`；本机开始页“开发测试入口”|localhost/127.0.0.1 才有调试入口；正常模式另开会话覆盖真实资源消耗。启动需执行授权，端口从真实输出读取。|
|沙盒搭场|useGeoGuardGame 返回 beginDebugEntityDrag、startDebugWave、forceBossPhase、applyDebugLayout、openDebugReward、unlockAllBlueprints；DebugSpawnPanel 有对应按钮|它们不是 window 公共 API。通过 UI 可操作，不能声称可用 `window.game` 或不存在的 URL 参数。沙盒默认无限钱血，证据必须标识；不足资金、死亡与正式奖励另测。|
|隔离引擎场景|createRuntimeState；spawnEnemyRuntimeAt / spawnEnemyGroupRuntime / spawnBossEncounterRuntimeAt；getBossEditorBaseTemplate；buildTowerAtLevel / createPlacedTower|未来 QA 脚本直接导入真实模块，固定随机种子与 dt；保存每次初始化参数及派生状态。SPLINTER 不在 ENEMY_ORDER 调试卡中，需真实 SHARD 死亡生成或隔离场景导入。|
|定帧 Canvas|canvasRenderer.js 的 drawGameScene(ctx, canvas, {state,getTowerById,getDebugDragEntity})|可用未来 scripts/art-validation 独立 HTML/module 页面导入生产绘制器，真实浏览器 canvas 绘制；必须按 DPR 初始化 context，记录 viewport、camera、时间。该证据不是完整游戏 UI/操作证明。|
|技能调度|tickBossCombatRuntime、runBossOptimizedAbility、createAreaHazard、createLineHazard|fixture 可依据 tests/boss-mechanics.test.js 建立真实 callbacks；仅直接 cast 不能证明蓄力、目标锁定或 OPEN 时序，必须再走 scheduler。|
|双子幸存|settleEnemyDefeatRuntime 与 enrageTwinRuntime|分开杀日/杀月，用真正 defeat 流程确认 partnerFallen；直接 enrage 单测作为补充，不能替代事件链。|
|既有模拟|scripts/boss-simulation.mjs 的 simulateBoss；scripts/player-sim/engine.mjs 的 createPlayerSimulation|默认 seeds 20261001/7/314159，30/60Hz；phase-exercise 人为设 HP，不能声称正常通关。boss CLI 和 player report 会向 docs 写报告，本轮禁止执行；后续导入 API 并把输出写 QA evidence。|
|鼠标/暂停|BuildBar onMouseDown；useCanvasGameLoop 的 mousemove/mouseup、Escape、blur/visibilitychange|必须真实鼠标动作；blur 会暂停，截图/性能采样要保持前台。暂停仍 drawScene，但不 update；比较 gameTime/逻辑状态，不能只观察动画表象。|

项目 package.json 无 Playwright/Puppeteer 依赖，项目模块解析也未找到它们；不因此安装或修改 package。后续优先使用已有浏览器能力；自动化驱动、截图保存及网络故障注入能力要先确认。若只能 UI 自动化，保持缺项为 blocked，不能以空 mock 截图结案。定帧与语义快照所需适配列在 interface-requests.md。

## 执行顺序与验收记录

1. 主审发布并批准基线、接口契约和 QA 实施授权；验证 baseline/candidate 哈希与所有权。固定所有 source-of-truth 输入，出现并发变化终止该批并重录快照。
2. 运行既有 `npm test`、`npm run check:architecture`；保存 stdout/stderr、命令、退出码、耗时。后续 `npm run build` 会写 dist，交由集成 owner 运行并交证据，或取得明确允许后执行。历史报告只能作来源，不能标成此次运行。
3. 实现 QA 自有审计与场景页；先校验 key 集合/资源路径/生命周期映射，再执行引擎回归及 renderer 只读性对照，随后浏览器逐动作、连续帧、桌面全流程。
4. 每一动作记录 `sceneId, identity, action, sourcePointer, candidateHash, seed, dt, frame, viewport, dpr, statePath, screenshotPath, screenshotSha256, runner, actualResult, reviewer`。截图必须真实浏览器输出；示意图、程序画的期望图和设定板不能当执行证据。未实际查看的图状态保留 captured_unreviewed。
5. 人工以原尺寸先审身份/层级，再以放大裁图审器官和挂点，最后看连续序列；裁图须指向完整原截图。任何缺帧、失效资源、读不清危险或逻辑差异单独开 issue（owner、重现步骤、期望/实际、严重级、证据）。只在新 revision 修复复验，不能改已封存文件或把失败改成 skipped。

## 场景矩阵

|场景|真实执行覆盖|通过条件与证据|
|---|---|---|
|C01 全身份/动作|逐条渲染 action-coverage 的 375 key，全部 48 身份；body/effect 独立合成；原尺寸与放大图|无缺 key、无静默 generic fallback；来源正确；动作与器官符合 anatomy-lock。复用条目显示实际 body+effect 配对，不能只查 JSON 存在。|
|C02 连续器官/根锚|48 身份所有实际动画转换在 30/60Hz 采样；至少起点、25/50/75%、终点及循环接缝；动作实际持续不足时按帧捕获|根锚投影与规定偏移恒定；固定器官数/连接、脸锚连续；压缩拉伸不改变独立炮组刚性；破碎/分裂按守恒例外。数值锚比较建议 0.5 CSS px 容差（需主审契约确认）；拓扑错误零容忍。|
|C03 九塔挂点|BASIC/CANNON/SNIPER/RAPID/MORTAR/FROST/RAIL/BURST/SENTINEL；Lv1..4 对应 level0..3；左/上/右及转向过渡、射击/压缩/拉伸|显示 R/P/M 调试叠图与无叠图两份；BURST 四等径共面 2×2 炮口及 M1..4 全可追踪；SENTINEL LEFT 整 rig 镜像后在镜像 P 残余瞄准。左右切换、相机移动与缩放后根不跳。现有逻辑弹体为 owner.x/y；按批准契约区分纯表现与炮口发射适配。用户已允许调整生成位置；不得改核心伤害/发数/AI/数值。|
|C04 Boss 全阶段技能|从真实模板枚举 16 encounter、17 身体，每个 phase 的 ability（包含复用技能逐 phase 验证）；95 技能取交集检查|每次 intro/idle→windup→attack→recover/OPEN→idle 有带时间证据；锁定目标与危区/弹体一一对应；body 不因换技换身份；实际持续攻击结束才 OPEN。死亡/清场后无孤儿特效。|
|C05 双子|共同存活、杀日（月幸存）、杀月（日幸存）；各有效 phase；低 tier 正式波次|永久日/月身份保持；soloLunarOrbit/soloSolarVolley 只增一次，crossfire 被移除；成员 HUD 正确，死者动画/连线退出。95 技能默认及幸存范围外 5 legacy handlers 单列非默认补测；tailSweep 无 handler 不伪造运行支持。|
|C06 14 敌/召唤|BASIC,FAST,TANK,SHARD,SPLINTER,SHIELD,MEDIC,BOMBER,JAMMER,PHASE,BURROWER,BEACON,SCOUT,SIEGE|BASIC 固定五芽两脚；SHARD 死亡生成实际 3 SPLINTER；BEACON 与 Boss 召唤只为真实新 UID 播生成表现，失败/达 cap 不虚画幼体；BURROWER 两出土格为时序。检查 shield、heal、jam、fuse、phase、burrow、death 的逻辑与独立效果。|
|C07 七机关|nest/web/root/wall/seal/reticle/courier 的常态、激活、受击、销毁及各自附加动作|通过真实技能生成→计时→受击/销毁→清理，采样 owner UID 与 hazard UID。ROOT 派生独立 UID/parentUid，器官不冒充派生体；wall 实体边界与缺口一致；seal/reticle 销毁取消效果；courier 追回一次/逃跑无退款；Boss 死后机关与 terrain 清理。|
|C08 合法密度|普通 W31 清场与 W27 双子分别记录；再按真实引擎预算构造压力场景|复合 A 参考 19敌/10塔/26弹/4资源，B 参考双子/8塔+1幽灵/15弹/1月盘；这些是原画计数，不硬凑真实轨迹。保存实际状态与合法来源；TANK 是重型身份，不虚造 elite。普通怪与 Boss 危技不得拼不可能共存场景。|
|C09 桌面布局|必测960×720、1280×720、1440×900，加测1920×1080 CSS px，DPR1 全流程；1440×900 加 DPR2；resize 往返|100% 缩放记录实际 innerWidth/Height/DPR；九塔目录滚首/中/尾、低资金、长真实 summary、不同等级。全栏不强塞九卡；140卡/8gap/min(92vw,920px)/bottom24 按正式目标量测；小桌面不切手机。|
|C10 鼠标建造|各尺寸的 hover、左键起拖、合法释放、重叠/墙阻挡非法释放、不足资金释放、回栏取消、右端九塔到达|鼠标落点截图+事件/状态；不足仍可起拖；合法只扣一次并生成一塔，取消/失败不扣钱不生成。hover、射程、危险区及 HUD 不互相误认；相机/缩放下幽灵中心与最终实体一致。|
|C11 奖励与流程|开始→战斗→奖励→继续→暂停/恢复→死亡结束→重新挑战；奖励真实三选项，1/2/3各位置可选；unlock/upgrade/money/repair 类型|每次仅一选项被应用；修复是替换卡不是第四卡，修玩家不修塔，升级只影响未来建造；动态数字来自 choices/state；实战开启奖励链另证，沙盒 Open Reward 不代表该链。Escape/失焦暂停不误扣款/推进，恢复不卡住。|
|C12 视觉细项|桌面30要求逐行关闭；HUD 两成员/长对策、资源菱形、危区边界、实机字体/对比|文字浅底深棕；费用≥16、正文≥14、辅助≥12（细分优先 UI 生产合同）；合成后对比≥4.5，透明背景另测；字体不是截图里的生图文字。PLAYER/即时威胁在原尺寸密度图可定位；记录审阅结论，不伪造用户反应时间。|
|C13 性能与加载|同机同浏览器 baseline/candidate，cold/warm 首次开始；真实密度至少60s×3，10s预热另计；DPR1/2|记录帧间隔 p50/p95/p99、>50ms帧、long tasks、实际 counts、资源字节/request/解码、可开始时间；有 memory API 才记录内存。建议候选 p95 不超基线20%，主审先批准阈值；>33.3ms p95 或连续>100ms卡顿需分析，不把逻辑30/60Hz模拟等同实机 FPS。|
|C14 故障与恢复|拦截实际资源请求：单资源404、损坏解码、延迟2s/10s、整组失败、恢复后重试；缓存命中；缺字体/背景|开始状态可解释；无未捕获异常、无限等待、空白不可玩角色、重复加载暴涨；fallback 明示并可追溯，不能按美术通过。若程序绘制无外部图，记录实际零图片请求，仅该分项N/A且主审确认；仍测页面/模块失败边界，不能把核心JS未加载要求成可玩。|
|C15 AI/数值对照|baseline/candidate 固定 seed/dt/input trace；renderer 前后状态与 RNG 对照；普通波1..34、boss suite、player profiles 与三seed|保护数据/规则字节哈希对照；表现所需共享文件修改逐 diff 审查。比较实体UID/位置/HP/shield、弹体逻辑位置/角度/伤害/寿命/命中集合、危区时序、AI目标、money、choice、波次、奖励次数。只对明确批准的纯表现字段做排除名单；炮口发射起点例外单列输入条件与期望差异，按C16专项验证。其他逻辑差异必须归因，不能一概容差忽略。|
|C16 批准的炮口发射适配|仅当接入契约批准实际起点改变；九塔/玩家适用者，左右/上及转向过渡，近距离重叠/刚出炮口目标、零距离、目标在root与muzzle之间、窄墙两侧、射程边界、穿透多目标、爆炸中心、寿命最后一帧|记录旧/新起点、位移、方向、速度、hit序列、碰撞/墙遮挡、伤害与寿命。验证不穿墙越障、不跳过近敌、不重复命中、不凭空增加有效射程或寿命；若批准方案本身改变可命中边界，必须量化并由主审确认该例外，不能以严格轨迹相等误判。视觉起点与生产逻辑起点及契约一致；发射数/核心伤害/AI/数值不改。|

## 关键补充断言

- renderer 以深克隆的真实 state 执行多帧，前后深比较逻辑投影；不能仅浅冻结。分别启用/跳过 draw 后继续同 seed 模拟，验证随机数调用序列未被美术消耗。表现若需要随机必须拥有独立源。
- 全部31/27密度图保存 provenance：初始化来源/输入轨迹、实际 count、frame、单位存活关系。可组合合法 fixture 表明“构造场景”，不能冒称正常游戏可达经济或完整通关。
- 怪物目录只有13个调试按钮，SPLINTER 是第14个敌方身份。Boss 目录16个，TWINS 展开为17个身体。不能按按钮数量把身份覆盖写成全量。
- 默认技能95，与 supportedHandlers100/allCatalog101 不同；`skill-coverage.json` 保留区别。每项运行需产生完整时间序列，只有直接 cast 的条目标记 partial。
- 原画 R/P/M 坐标与 256画布多为 proposed_not_measured；不能把原稿百分比当已测真实挂点。生产资源必须给实际坐标空间、变换顺序、裁边偏移及材质/帧来源，QA 独立测量。

## 建议后续自有实现（尚未创建）

- tests/art-contract.test.js：375/48/95 精确集合、实际资源/映射/生命周期、正式来源与 fallback 检查。
- tests/art-render-purity.test.js：真实生产 renderer 的逻辑只读与 RNG 消耗对照；需要真实 canvas 浏览器部分配合，mock 不能作为视觉证据。
- tests/art-rig.test.js：生产锚变换、九塔方向/等级/姿态根锚和挂点、相机投影反算；只基于已批准测量契约，不复制实现公式作唯一 oracle。
- scripts/art-validation/：场景生成、浏览器定帧页、实际游戏 UI 操作、证据索引、差异报告。所有命令必须在后续封包记录真实入口、参数与退出结果。

## 完成门槛与当前结果

P0：逻辑/AI/数值改变、崩溃/无法开始或完成主要流程。P1：缺身份/技能/危险提示、器官或根锚错误、鼠标或桌面溢出导致关键控件不可用。P2：非阻断细节、性能待归因等，是否接受必须主审明确豁免。所有375动作和95技能证据关联完整，所有桌面要求有运行结果，未运行/未审阅不算通过；最终验收权在主审及用户。

本轮完成的是只读勘察、来源计数、接口定位、文件哈希观察与计划封包完整性检查。游戏测试、构建、浏览器、截图、性能、故障注入、AI前后模拟一律 not_run。下一步等待主审发布基线、批准契约并授权 QA 实施。

严格依本轮“仅写 r01”约束，READY 放在本目录，不写 qa/READY.json。协调规范的 owner/READY 发布可由主审转发或后续明确扩大写入范围后执行；该差异不会被静默越权解决。
