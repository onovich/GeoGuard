# GeoGuard 新电脑接手指南

更新时间：2026-10-06。此文件是跨电脑接手入口，优先于历史验收中“尚未推送/等待试玩”的时间状态；它不覆盖不可变历史证据。

## 本轮最新结论（2026-10-07，优先于下方历史）

单实施者全量美术返修已内部通过，用户最终美术验收待进行。见 [最终验收报告](art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r16/root-final-acceptance/index.md)。169/169测试、架构11/11、build通过；311生产PNG与来源哈希核验，最终真实normal1800活跃帧通过。真实硬件DPR2未测，仅显式2倍backing；不是全部升级等级完整通关。用户已于2026-10-07授权提交与推送全部本轮变更；同步后新电脑执行git pull --ff-only即可接手本轮修复与验收资料。

## 历史结论与进度

- 分支 main；远端 https://github.com/onovich/GeoGuard 。本轮用户明确授权提交全部文档变化并推送，包括之前本地保存的实现提交817f70840502eff5522ef8f9a89b2fbb427e14ac。
- 贴纸小怪美术已经实际接入：9塔、1英雄、14敌人、17Boss身体（16组遭遇）、7机制，共48身份；375动作参考映射和95技能对应关系。数量不等于375独立动画。
- 前轮内部功能/逻辑/资源/QA验收通过；2026-10-03严格电脑端视觉审查不通过，美观还原返修待办已登记；2026-10-06电脑端UI修复8项主审通过，VF-03底栏部分通过，其余美术任务仍待修复。用户最终美术验收没有通过。
- [完整视觉画册](art-direction/sticker-bible-2026-10-01/index.html)汇总45张当前图板；旧探索折叠归档。先看两张r04整体原画，再看场景/UI/角色独立拆解。
- [20项视觉待办](art-fidelity-2026-10-03/backlog.md)：10项P1、9项P2、1项验收补充，附验收标准；[三组审查及证据](art-fidelity-2026-10-03/evidence/summary.md)已正式落盘。
- 已归档9个原画制作/交付会话及截图指定的10个实现/QA会话。源稿、prompt、封包、审批和代码全部保留。主会话仍承担协调；后续任务可以由新会话仅凭此仓库接手。

## 新电脑启动

安装Git、Node.js 24（与CI一致），确认有仓库读取权限。在所选目录执行：

```sh
git clone https://github.com/onovich/GeoGuard.git
cd GeoGuard
git switch main
git pull --ff-only
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

已有checkout先保存自身变化再pull，不覆盖本地工作。打开 http://127.0.0.1:5173/ 。画册用浏览器打开本机clone内docs/art-direction/sticker-bible-2026-10-01/index.html，保留整个目录的相对路径；旧电脑file:///D:/...路径不能直接在新电脑使用。

常规检查：

```sh
npm run check:architecture
npm test
npm run build
```

仓库带大量历史视觉QA图片，完整clone体积较大；需要全部历史基线检查时不要只浅克隆到当前一次提交。不要用npm安装的node_modules替代docs内被特例保留的冻结源码镜像。

## 下一阶段怎么做

先读取待办和原画生效规范，收敛整体r04与canonical平色板的线条/颜色目标；按角色/构图与UI并行修复，再精修背景。此前主要落差：角色小、描边细、Q弹弱、Boss特征被效果压低、战斗反馈噪声、卡栏重、开始/结算通用化、奖励卡层次弱、Boss长名断字、关键动作字过小。

保留Boss AI、数值、经济、伤害和碰撞核心规则。允许相机、表现尺寸、枪口挂点、动画状态与UI改变。固定脚部水平root，美术不追加世界位移；子弹/闪光/命中、独立召唤实体与身体分离。电脑端优先，手机暂缓，开发者/测试界面低优先级。

主会话负责验收，可并行工作使用独立文件所有权、不可变submissions/rNN、packet+SHA及READY持久队列；不要依赖多个会话抢发消息。新修复不得改写历史已批封包。每项关闭需原画定位、原尺寸实机和动作证据；功能检查和资源覆盖不能代替美观验收。

## 当前证据边界

这轮审查全部45板；48身份当前renderer诊断全覆盖；真实试玩9塔、13可直接刷敌人及16Boss组。SPLINTER、完整机制/95技能视觉窗口、DPR2多尺寸、正常奖励链等本轮不足的证据登记VF-20。旧fallback几何摆场已排除；开发条遮挡、示例资金/位置差异不算玩家缺陷。BURST历史不对称未再复现。

前轮[实现验收](art-implementation-2026-10-02/reviews/final-acceptance.md)、[协调/各模块入口](art-implementation-2026-10-02/coordination.md)、[原画验收](art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/final-acceptance.md)保留其历史语境。不要误读“内部通过”为本轮视觉通过。

## 本轮可移植性修正

默认npm test原来递归发现docs封存的旧QA测试副本，造成历史路径ENOENT。本轮仅将package.json测试入口限定为node --test tests/*.test.js，151项正式测试通过；没有改游戏源码、public或封存QA。此工具入口变更意味着历史包含package.json的880文件指纹只用于817f708，不能要求本轮新HEAD仍与其完全相等。

## 机器差异与发布

.codex/project-git-workflow.json、project-ops-workflow.json和Windows.cmd含旧电脑D:/WebProjects/GeoGuard与C:/Users/Administrator路径；新电脑需要按实际路径重建机器配置/安装对应skills，不能直接照用绝对路径。npm命令不依赖这些包装器。本地浏览器QA脚本还依赖旧电脑Codex bundled Playwright和Chromium位置，新电脑需配置自己的运行库/浏览器；浏览器仅为常规试玩不需此依赖。老QA的source绝对路径仅历史记录，不表示资源需要从旧电脑读取。

main push会触发.github/workflows/deploy.yml的GitHub Pages部署。此次是用户授权同步当前候选，视觉返修尚未完成。同步成功后以origin/main为版本来源；部署完成以Actions结果为准，不能把git push成功当页面发布成功。

[9个原画会话归档](art-fidelity-2026-10-03/art-session-archive.md) · [10个实现会话归档](art-fidelity-2026-10-03/implementation-session-archive.md)。归档是可恢复会话状态，不是删除；跨机器未必同步本地Codex会话，本指南和仓库交付足以继续。

可以给新电脑Codex发：

> 先阅读docs/HANDOFF.md及docs/art-fidelity-2026-10-03/backlog.md。当前实现可用，严格视觉还原未通过；本轮只登记未修复。基于45板画册开展电脑端还原返修，保持核心逻辑，按独立所有权与packet/READY协调并逐项验收。不要重新生成旧稿或把历史验收当当前美观通过。

## 2026-10-06 当前本地UI返修结果

[本轮UI验收](ui-fidelity-repair-2026-10-06/review.md)保留退回、复验、真实游戏截图和明确标注的组件fixture。三组subagent只改表现层，151测试、11架构检查和构建通过。用户尚待最终体验验收。本轮工作区修改尚未提交/推送，旧远端状态不能代表这些修复。跨电脑继续前需提交并推送本轮变化；历史推送授权不自动视为本轮已发布。

### 同日追加诊断修正

[当前UI追加诊断](ui-fidelity-repair-2026-10-06/followup-diagnosis/report.md)确认漏测的离屏说明定位问题，VF-17已重开；另登记5项更细的视觉还原待办。因此前述8项通过是历史阶段结果，不代表当前全部UI通过。当前仍只登记诊断，追加问题尚未修复。

### 追加6项修复主审通过

[最终追加验收](ui-fidelity-repair-2026-10-06/followup-repair/review.md)：离屏说明、奖励身份/密度/装饰、容器层次、波次旗帜通过；奖励r01曾因高度不足退回r02，最终768×511.5。VF-17再次关闭。151测试、11架构与构建通过，核心逻辑无变化。全部本轮代码/验收材料仍未提交推送，最终用户验收待进行，世界角色其它美术待办未关闭。

### 当前UI再次诊断

[第二次追加诊断](ui-fidelity-repair-2026-10-06/followup-diagnosis-02/report.md)：前次6项通过保留，抽查没有新阻塞缺陷；UI-G01升级收益优先级与UI-G02重复文案/箭头排版登记为待精修。保存实际暂停、普通组件和混合奖励证据，未改产品代码。完整世界还原与用户最终验收仍未完成。

### 奖励精修通过

[本批验收](ui-fidelity-repair-2026-10-06/reward-polish/review.md)：G01/G02通过，保留一次退回及末级链锯复验；27升级对比准确，151测试/11架构/build通过。奖励三奖535.5高，14px正文，960桌面无横向溢出。核心逻辑未改，全部本轮工作仍未提交推送，用户最终体验待验收。

### 三组当前原画/实机校对反馈

[本轮汇总](art-fidelity-2026-10-06-crosscheck/summary.md)：三组只读报告已收齐。UI近期修复保持通过；下一重点是世界尺寸/屏幕线宽、反馈遮挡与根影/背景节奏，关联原有VF待办不重复建项。UI组独立Chrome试玩，另两组CUA故障依主审与UI组本轮截图评审；动态全身份/技能及DPR2未完整覆盖。未修改产品代码、未提交推送。

### 美术还原修复方案三方同意

[修复方案r02](art-fidelity-2026-10-06-crosscheck/repair-plan.md)：场景/UI/角色三组条件已合并并再次明确同意，无阻塞。先A代表身份尺寸/描边与输入竖切片选稿，后B反馈、C根影背景，D全身份动作/技能补证。960小桌面及当前绝对zoom1.25基线明确，候选值非最终合同；核心规则保留，炮口必要适配需独立边界验证。本轮仅方案和审议，未实施产品修改。

### 用户禁止自绘替代原画切图：审计确认

[来源审计汇总](art-fidelity-2026-10-06-crosscheck/provenance/summary.md)：三组一致确认SVG/CSS/Canvas自绘广泛存在，包括图标/按钮/面板/装饰/粒子与48身体/肖像，现存导出PNG非原画切片。此前功能/布局验收保留但不能称美术来源合规通过；方案增加原画资产链前置纠正，尚未实施替换。不得以历史矢量规范豁免用户要求。

### 全部修复单人执行已授权

用户要求全部还原反馈与来源问题纳入并修复，唯一实施subagent为ui_overlays_fix，其他两组冻结，主审验收/退回。
[完整执行清单](art-fidelity-2026-10-06-crosscheck/full-repair-checklist.md)含AR01–06真实原画资产链、VF还原及UI建议、D01–05全覆盖回归；先纠正资产来源再调表现，不以SVG转PNG替切图，不静默fallback。不改核心规则，无提交推送。进行中，未完成，关闭项必须有主审证据。
### 全量修复当前阶段进度（非最终通过）

详见[验收台账](art-fidelity-2026-10-06-crosscheck/full-repair/acceptance-ledger.md)。当前36/48形象接原像素（4塔/英雄/14敌/17Boss），剩余5塔/7机制对象及完整UI/world/FX未完成。全部Boss静态四状态、源像素与根点经主审复核；SNIPER断颈经多次退回后改正式12方向帧通过结构预检，但基线尺寸太小仍开放。AI补制/编辑均明确分类并入正式补充画册，不能称为原始切图。BASIC/BURST/CANNON/SNIPER源炮孔M已记录，真实弹体出生/轨迹尚待。151测试仅阶段通过，最终全回归、95技能、桌面DPR/输入/性能待验；不以该进度宣称用户最终验收通过。

## 当前美术全修复续接（2026-10-06，48静态结构阶段）

当前用户授权一个subagent统一实施全部三组原画还原反馈和程序绘制冒充切图问题；实施者ui_overlays_fix，主审只诊断/验收，退回直到全清单通过，未授权提交/推送。完整状态以 docs/art-fidelity-2026-10-06-crosscheck/full-repair-checklist.md 和 full-repair/acceptance-ledger.md 为准，所有大项仍开放。

48/48身份已接来源像素管线并完成静态结构预检（非实战全验收）。最后四塔r03同高与四向结构通过，28文件SHA及runtime参数一致。RAIL四向静态通过，但down源记录裸路径与缺SHA正在返修。七机制28生命周期帧来源/静态通过，17 Boss身体静态通过，95技能及独立实体实际覆盖待验。十源弹体/flash20图来源60SHA及四向模块通过，真实出生仍owner中心，炮口连接/首轨迹/近敌回归待修验。

BG02两地斑/两草/空底64tile来源10SHA与五世界窗口模块通过；草节奏退回（原点1簇、负坐标0簇），根影层次QA待补真实shadow。世界主体尺寸仍偏小（英雄约19×37px、普通敌约30px）；SNIPER约26px，未通过。全部UI残留皮肤、状态/粒子/特殊效果/资源和装饰来源替换、去静默fallback、密度/色彩/相机/动作连帧、桌面DPR/交互/全部规则与性能回归仍未完成。不得以48接入或build通过声明全通过。

主审证据集中full-repair/submissions/r10，轨道塔rail-runtime-root.jpg、四塔*-runtime-root-r03.jpg、十源friendly-fx-runtime-root-r02.jpg、五背景ground-*-runtime-root.jpg。正常关卡阶段诊断normal-mid-stage-root.jpg。r07-r09保留旧来源与退回证据，不删除。最新完整规则/来源排除见r10/root-review.md与source-annotation-exclusions.md。上一次主审npm test151通过为阶段结果，最终仍需再测。
### 48 静态阶段后续更新

RAIL 来源登记返修已通过：84 项链上 SHA 和实际 runtime registration 一致。BG02 r02 草分布与真实根影静态层次五窗通过，证据为 r10/ground-*-runtime-root-r02.jpg；最终根影随世界尺度/悬浮/潜地/死亡/密集实战仍待验。r11 首25项 B02/B04 状态、反馈与 Boss 装饰候选来源预检通过（50 SHA），允许唯一实施者接入；不代表运行或完整 S3 通过。以上覆盖前段仍写“正在返修/草退回”的旧阶段状态。全部总清单仍开放，继续修复与验收，不提交/推送。
### r11 世界效果阶段（进行中，仍非全量完成）

唯一实施者ui_overlays_fix继续运行。r11首25原板状态/反馈/四Boss装饰和2正式治疗补制、3反馈补crop、2WEB/ROOT正式AI去G清理、退款6短线/H03双内圈、HP/4级点来源预检均通过；来源分类/处理/SHA有台账。实际world-status-feedback-runtime-root.jpg与-r02.jpg复验状态/资格/placement/反馈；intro两轮退回（穿脸、巨环）后r03正式分离源外圈，四身份四向实际模块通过，证据intro-runtime-root-r03.jpg。退款恢复实际+amount静态通过。世界compileVectors消费者与角色静默fallback已移除，整场异常路径仍最终审计。

正常真实关卡r11/normal-game-stage-root.jpg发现HP角片因inset21→height5时dx15/dy2.5被横向拉扁、呈尖双线，已退回修；主体英雄约20px/敌约30px仍太小。死亡25秒后重试HP100/Wave1/00:00/45采样通过。r11后主审npm test151通过、build116模块通过，仅阶段回归。下一仍全UI皮肤、HP实际修复、尺度/Q弹/十源真实炮口出生、95技能和生命周期/独立AIHP召唤、桌面DPR/交互/密度性能/最终规则回归。全部总项仍开放。不要结束于部分通过，不提交/推送。
## Active art repair follow-up (2026-10-06)
Only implementer /root/ui_overlays_fix continues; root audits and returns failures. User requests ALL prior fidelity and source-substitution issues repaired. Current work is unfinished: broad full-repair-checklist remains open. Latest detailed status/evidence: docs/art-fidelity-2026-10-06-crosscheck/full-repair/acceptance-ledger.md, r12/root-skill-page-audit/coverage-root-summary.json plus380 valid real stage images/8contact sheets. All95 real-AI pagination executes without drawErrors, but source attribution/qualified fixtures, full action continuity, dense normal view, desktop interactions and final regression/performance still require approval. R13 diagonal AI sources are candidate-only: rigid tube length drift rejected, shared true source neutral tube plus formal body source in progress. World single-key failure display (shield/WEB/keycap/bullet) and qualified shield cast partial checks pass. Root npm test151/151 and birth7boundary+50offense pass at this stage, not final release. No commit/push authorized this turn. Never reset current changes or claim everything passed.
### 当前主审进度补充（R14，仍未整体通过）
唯一实施者 /root/ui_overlays_fix；主审仅诊断验收。详细状态以 docs/art-fidelity-2026-10-06-crosscheck/full-repair/acceptance-ledger.md 为准。禁止把本段当最终批准。

主审独立 npm test154/154；生产4294预览318张注册PNG逐HTTP获取并完整解码成功（无public/运行前缀）。正常死亡→重新挑战确实复位HP100/WAVE1/time00:00/money45；此前HMR中断文件不算证据。真实三卡奖励960宽可读、键盘RAPID升级生效；17px小拖动不误建造；暂停期间拖拽→恢复无塔/ghost。TWINS双血条/阶段/策略与暂停面板在960/1280/1440/2304局部通过；开发条遮挡标题，不作为标题验收。

四种真实UI消费者缺源均有全屏纯文字诊断、fatal=true/registry非ready、无程序图形兜底。空测试页根因是QA误引用/src/index.css，现已修/src/styles/index.css，不是图片加载性能结论。真实奖励组件1/2/mixed/long/maxRapid布局fixture局部通过，不等于正常奖励经济流程。

95真实技能24页再次复验，适用-source缺失标记已闭合：S14补actor-label收据归属；H03实际area多pulse条件；M10/M12真实style区分；webField原来缺源纹样补真实PNG，随后重叠危区位置匹配误判改stable hazard.key。未满足条件场景、持续时间/清理、所有动作连贯和高密度脸部辨识仍未通过。部分root结构化JSON有嵌套深度截断，只能作为flat source-status摘要，完整蛛网原始DOM收据另存r14/webField-full-dom-root.json。

主要剩余：r13 SNIPER/RAIL刚性管与腹部像素变形候选（未生产、未批准），连续自由瞄准/近场真实出生与孔轴一致；48身份连续动作/root/Boss四状态；条件性退款/冻结/治疗效果与生命周期；同实际密度性能/解码内存；最终source/SHA审计与最终回归。root4294稳定快照不要未经协调build覆盖。dev5173任何workspace写入都可能HMR，集中验收需短全工作区冻结或稳定生产快照。没有当前提交/推送授权。
### 2026-10-06 当前唯一实施者返修进度（R15）

本轮仍未整体完成/未提交推送，ui_overlays_fix唯一实施，root独立验收。完整清单与批准/退回以 docs/art-fidelity-2026-10-06-crosscheck/full-repair/acceptance-ledger.md 为准，禁止凭局部通过关闭总清单。R15A实际renderer声明phase联系页48身份×10时刻，根点零漂移、右向器官/五官/刚管一致性局部通过，完整收据在submissions/r15/root-actions；不等于真实AI全动作完成。R15B自由瞄准纹理映射实际162样本退回：非精确源轴有棋盘片接缝、相邻8向边界有明显头/腹斑/身体跳变。证据在submissions/r15/root-freeaim-rejected，实施者已确认返修。既有318PNG HTTP像素解码、95适用source检查与UI四consumer错误显示等子项仍有效。最终自由瞄准/条件技能/真实密度/正常奖励链/失败后实际逻辑冻结/最终来源清单与性能/回归仍开放。不得将旧dist4294快照当最终修改版本。
### 当前美术修复验收补充（R15D–G r02，2026-10-06）
仅 ui_overlays_fix 实施，root复验；仍不提交/推送。冻结已释放，dist4294仍旧候选。R15D冻结/寒潮/真实Courier退款、R15E实际治疗与护甲时序、R15F真实normal seeded update首Boss奖励→蓝图选择→实际付费新塔链均局部通过，完整收据和原尺寸图在 full-repair/submissions/r15/root-qualified、root-heal-armor、root-normal-reward。R15G首密集状态视觉与短清场性能退回；r02盾后层+紧凑顶部护甲解决脸部遮挡，actualnormalprofile轻负荷1800帧draw p95.9ms局部通过。持续密度720RAF draw p9521.3/max54.7ms、治疗环穿Boss脸与资源堆杂仍退回，worker正优化相同源像素网格渲染/层级，不改变实体经济。源方向边界明显跳变、四向/真实动作全覆盖、DPR2最终矩阵、完整来源总审计与同候选最终回归仍OPEN。权威状态见 acceptance-ledger，不按READY或局部通过推断整包完成。

### 当前美术修复验收补充（R15H–M，2026-10-06）
仍唯一实施ui_overlays_fix，主审root；冻结已释放，不提交/推送，dist4294仍旧快照。R15H原图GPU纹理AA局部通过；R15I真实持续构造密度720RAF绘制平均3.634/p955.1ms，真实五窗口源地面无接缝局部通过；R15J真实拖中暂停及真实normal首Boss奖励清拖通过；R15K治疗环后层与缩小独立晶石可读性通过。R15L真实相位1.4/2.05s、钻地1.1s、子弹击败→退场固定root→2.2s真实粒子归零通过；R15M修复中心重叠出生导致炮筒倒向，真实源轴/弹道一致，独立2/2边界测试通过。完整限定范围证据在full-repair/acceptance-ledger.md及submissions/r15/root-*，不按局部通过推断全部完成。
剩余重点：非零近场夹取与七圆塔全角实际炮孔/首发轨迹、SNIPER/RAIL八方向边界头腹造型跳变、四方向动作/真实Boss阶段/浮空/独立召唤清理、最终高密度效果层级、电脑DPR2矩阵、最终全部使用资产SHA/source/crop/AI/consumer/no-fallback及同一候选全tests/build/规则边界/CRLF无BOM。开发测试界面低优先级；核心AI/经济/HP/伤害/碰撞不改变。
### 当前关键退回与局部通过（R15N/O，2026-10-06）
R15N真实16基础Boss encounters/17身体来源阶段、真实weakness recover选择OPEN及水平root局部通过，HIVE/SPIDER未发生attack诚实未覆盖；T3/独立召唤完整清理仍开放。R15O眼心登记的SNIPER/RAIL两身份8边界两侧32实际帧仍明显全身/腹斑/下向炮筒透视跳变，明确退回。唯一实施者正用imagegen正式补制单一连续软身体/固定腹斑+刚头炮原图分层，先在工作区外出候选，禁止原图来源伪造/跨帧混合掩盖。
R15O七圆塔7×11dir×d30/60/110=231真实offense首发样本已局部通过，扣除BURST原散射offset后孔轴/首速度最大差.00005693°；7身份自由-161.57°d60真实28帧画面通过。未声明SNIPER/RAIL或所有角度视觉已通过。最初超时未保存的大批数据剔除，完整逐身份33case记录已落submissions/r15/root-aim-r15o。所有全workspace冻结已释放，root临时浏览器23位于r12/shot-runtime，CUA会话超时重置过，需重新绑定接口变量。最终来源/同候选回归尚未开始，不提交推送，不把旧dist4294当最终。
### R16组合候选最新
正式新AI分层静态允许试装；r01/r02实际头炮消失均退回，r03修Canvas残留混合模式和双translate后实际64组合帧/逐stage/sweep局部通过。原尺寸头颈连续，无条纹/明显接缝，脚root0，attack诚实neutral派生；尚未production启用。worker正在接同候选真实shot/downward/nearfield与最终完整source登记，所有全workspace冻结已释放。权威完整证据在acceptance-ledger和submissions/r16/root-combination-r03。

### R16 r04 actual offense arithmetic local pass, downward visual returned
Root operated 88 actual offense cases: two identities x11 directions x4 distances (centre10/30/60/110), each actual0/1/3/6frames. Births nonempty/errors0; maximum bore-first-velocity difference SNIPER .00003391894deg/RAIL .00005261882deg, no acceptedAimResidual>.01. Arithmetic locally passes. Root reviewed40 native frames: down90 at30/60/110, diagonal45 and64.17 at60. Down SNIPER muzzle flash lies on own belly and long projectile crosses own body/feet; RAIL long texture covers own neck/belly. Returned source-aperture exposure and independent projectile image registration, preserving collision-safe birth and core offense. Diagonal45 locally usable. Numeric direction alone does not establish visual acceptance. Production candidate remains disabled; whole-workspace freeze released. Evidence submissions/r16/root-continuous-shot-r04-returned/.

### R16 r05 downward exposure improved; left-down SNIPER returned
Root saved actual10 targeted0/1/3/6frame shots (two towers, down30/60/110/centre10 and64.17deg60), full raw receipts/errors0; real source rigid axis matches actual first velocities. Native down/64.17 screenshots improved: exposed aperture and forward-only long independent projectile registration remove reverse facial coverage. Root then reviewed64 actual8angle x4pose composites and actual left-down45deg/d60 fourframes per tower. SNIPER135deg long mouth crosses its own neck, actual flash falls on left-upper belly border and first projectile overlaps own silhouette. Returned full downward-sector exposure/continuous head orbit rather than accepting isolated90deg correction. RAIL leftdown less affected; needs shared fullsector check. Production remains disabled; wholeworkspace freeze released. Evidence submissions/r16/root-exposure-r05-returned/.

### R16 r06 lower-sector composition local pass; nonlinear accepted-axis case returned
Root operated88actual lower-sector pose frames (two identities x11angles x4poses), complete source records; fixed root and same source layers retained. Reviewed native32shot frames down60/leftdown60/64.17deg60/free19.82deg30. Left-down aperture and long projectile no longer cut across own torso. Narrow95–110deg forward neck bend is explicitly allowed as a continuous candidate pose; do not impose constant neck height for every heading. Eyes/patch/feet remain identifiable; no prior low-joint inverted face at feet. Source combination locally passes these samples, not production or all mechanics.
Root operated88actual11direction x4distance offense cases. Errors0, but RAILfree19.82deg/d30 source bore vs actual first velocity diverges6.88852998deg, acceptedAimResidual>.01: returned nonlinear joint/accepted solve. Source sweep realRAF SNIPER4s/turn andRAIL16s/turn receipts/PNG/root0 saved; not observation of every video frame. Require added transition target directions95/100/108/112.5/115/125/157.5 and all actual distances in next revision. Wholeworkspace freeze released. Evidence submissions/r16/root-exposure-r06/.

### R16 r07 actual288 shots local pass; explicit extra birth boundaries pending
Root operated two towers x18directions x4distances xplain/extra real off/collision0/1/3/6frame tests (288). Errors0, max source-axis/first velocity<.00006deg; only RAILfree19.82deg/d30/plain uses source-ray-safe-retreat, resolving prior no-root failure. Other cases retain owner-segment-joint; actual288 contain no no-safe strategy. Root reviewed32native shot frames near/100deg transition/leftdown/extra. Source forward-tail independent long projectiles and source aperture usable in these cases; declared safety-clamp offsets allowed, no new self-crossing observed. Actual sameframe91/92 RAIL hits reflect original piercing, not birth skipping. Freeze released.
Root independently executed actual projectile-source-birth script7nearfield+50offense comparisons (counts, damage, life, kind, radius, pierce, splash, slow, shot index, true speed norms and collinear direction), lateral chosen-target case; all pass. Three centre/unblocked/partial-clamp tests pass. Target inside M/behind M, no-safe-axis and forward blocker recovery boundaries remain explicit actual evidence requirements; final source registration/production integration/broader gates still OPEN. Evidence submissions/r16/root-exposure-r07/.

### R16 r08 actual exceptional safety/source chain local pass; centre visual returned (2026-10-07)
Root clicked RAILfree19.82deg/d30 with actual additionalBASIC92(35,-22,r10). Naturalno-safe-source-ray-centre, birth0,0 outside both expanded circles; actual first collisionUID91 HP12→-14,92HP12 unchanged, speed700/damage26/sourceaxis preserved/errors0. Safety locally passes. Nativefourframes show muzzle star at ownbelly/feet and independent long projectile emerging fromfeet while source pipes remain overhead: display returned, not accepted as ordinary muzzle coincidence.
Root further actual SNIPERdown30 M-inside, SNIPERup60 M-inside+source-axis-behind, RAILdown10centreOverlap, raw+12nativeframes saved. Noncentre safe birth/axis samples locally pass; centreOverlap has same belly/foot flash defect, requiring shared centre-safety presentation handling without changing real entities/collision. Centre exceptional feedback may omit misleading flash/inside-body first display while preserving attack/hit feedback; normal noncentre approved cases retained. Freeze released.
Root independently ran exact original Python preprocessing only in isolatedTemp;16/16 actual runtimePNG SHA identical, actual source/reference/request/processing hashes verified; two current runtimeRegistration objects deeply equal code data. Formal reconstructed-AI classification, source-only resampling/alpha masks and neutral-derived attack honest; supplement page/complete bible link reviewed. Source production activation/preload/deploy/failure/no-old8fallback still pending. Actual576geometry search root-only sample567ownerjoint/9retreat/0nosafe retained limitedscope (does not negate subsequent actual no-safe case). Evidence submissions/r16/root-exposure-r08/.

2026-10-07: R16 r09 centre-safety presentation locally accepted on 4 actual scenarios / 16 native frames and 8 tests. No overall approval; see full-repair acceptance ledger and final-acceptance-queue. Single product writer ui_overlays_fix continues remaining gates. No commit/push performed.
