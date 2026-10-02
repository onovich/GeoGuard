# 文件所有权、并行依赖与接入计划

所有权从主审派发后生效。本轮仅集成新文档目录可写。任何人都不越过基线发布＋合同批准门槛；worker 自己不得批准自己的资源。

|owner|独占可写（放行后）|必须交付|
|---|---|---|
|characters|src/view/art/characters/**；public/art/characters/**；自己的docs提交目录|48身份身体/rig/机关/icon、完整375映射、anchors、API、测量预览|
|world|src/view/art/world/**；public/art/world/**；自己的docs提交目录|背景、影子、10来源弹体、危险区/效果/关系线/放置标志、API、95技能效果对应|
|ui|GameHud.jsx、BuildBar.jsx、OverlayScreen.jsx、StatusBanner.jsx、TowerContextMenu.jsx、WaveRewardOverlay.jsx、ui.jsx、新增PauseOverlay.jsx；src/view/designSystem.js；public/art/ui/**；自己的docs目录|桌面玩家UI、实际1/2/3奖励、九塔滚动与鼠标、共享组件兼容|
|integration|src/view/canvas/canvasRenderer.js；src/view/screens/GameScreen.jsx；src/view/art/contracts.js；src/view/art/integration/**；useGeoGuardGame.jsx、useCanvasGameLoop.js必要接入|资源加载、DTO/事件sidecar、draw层次、回退、暂停接线、无逻辑变更差分|
|integration 特批最小补充|combatOffenseRuntime.js的3个来源字段；combatFrameRuntime.js可选onProjectileHit观察通知|严格按module-api，无数值/发射/命中算法修改|
|QA/主审|自己的docs证据目录；如需新测试，先由主审分配独立新文件名|冻结指纹、行为差分、实机截图/性能/问题与验收决定|

src/styles/index.css 默认不分给UI以避免全局污染；UI先用designSystem新tokens及局部class完成。若需要滚动条/字体的全局样式，由UI提交独立样式建议，主审转交集成单独接入。package.json、lockfile、vite/tailwind配置、src/data/**、其余src/logic/engine/**、音频、main/App默认冻结。DebugSpawnPanel/BossEditorPanel/PlaytestExport不做美术包装，不由UI顺手重构；共享ui.jsx现有exports/variant保持可用。

PauseOverlay 由UI创建并提交，GameScreen由集成导入和决定visible/onResume。UI不可为了预览接线去改GameScreen。角色icon提供同步getCharacterIcon，UI只依赖公开导出；资源未到时保留文字/占位。world需要muzzles而不import角色内部：集成传getCharacterAnchors输出。world不改combatOffense、UI不修改hooks、角色不改renderer。任何API增量由主审汇总成新版合同后派发，不靠私下跨线程消息。

补充：TowerContextMenu已核实只服务debug，本轮UI对该文件仅保兼容，默认不改；HUD artId与onLayout/topInset增量、真实hit通知按module-api。QA自有测试目录须主审另行派发，不占其他owner路径。

## 阶段

|阶段|依赖与操作|出口|
|---|---|---|
|G0 契约审阅|本包＋发布基线证据|主审明确批准版本/基线指纹；未到前只写各自docs|
|G1 独立生产样板|characters与world先实现公开API；UI用静态icon接口独立预览|PLAYER、BASIC塔、BURST塔、BASIC敌、HIVE、SEAL（以及样板HIVE所需NEST/SHARD）真资源；弹体/危盘/最小HUD|
|G2 集成样板|主审验收各worker封包后，集成接入renderer/hook/GameScreen|实际可玩移动、放塔、射击、四孔、五芽、HIVE召唤、SEAL可击破、暂停、资源失败回退；QA差分|
|G3 全覆盖生产|样板坐标/尺寸/层次通过再扩展，worker按各自目录并行|48身体/375状态复用齐全，余下14敌/7机关/全部Boss及95技能表现对应（总数按完整清单核对，不重复计样板）|
|G4 全桌面接入|接受的manifest固定版本，全部玩家UI替换|960/1280/1440桌面真实流程、三种奖励数量、双子单/双体HUD、九塔全解锁滚动|
|G5 验收切换|逻辑快照/差分、视觉/性能/加载/失败均通过|主审批准默认贴纸模式，保留旧几何资源失败回退；仍不自行部署/发版|

G1必须用正式资源验证完整通路，不能交仅单张“好看截图”后直接批量生产。个体资源按批次加载/验证，已通过资源不反复重画；失败项在新revision修复。每轮提交固定 packet、清晰version，不让“latest”静默漂移。

## UI接入必须保留的功能

BuildBar宽min(92vw,920px)、目标卡宽140/间距8，原生横向scrollbar，第一屏与末屏露边；不假定竖滚轮自动转横滚。不足资金仍允许左键起拖，松手走既有判定；回栏/取消不扣费，只有成功放置扣款。ghost位置/射程/状态章各自独立，危险区不是新增禁建规则。变更卡宽后setBuildBarRect必须及时采集实际DOM矩形；集成维持其同一坐标空间。

Boss HUD取真实成员hp/maxHp、阶段总数、actionMode及现有counterplay；图册示例不硬编码数值。奖励按choices实际长度居中1/并排2/3列3，文字换行、真实标题/费用/补贴/修复量；蓝图升级不悄悄更新场上旧塔。开始/结束/暂停/声音/状态提示都进入玩家验收。

## 封包协议

每个owner使用 `docs/art-implementation-2026-10-02/<owner>/submissions/rNN/`。写入与核验全部文件后先原子 rename `packet.json.tmp → packet.json`，内容含owner/revision/status=ready_for_review/schemaVersion=1、依赖合同路径和SHA、文件路径/bytes/sha256、覆盖身份/状态/技能、API导出、测试事实与未通过项。最后同目录原子 rename `READY.tmp → READY`，READY是JSON，记录相对packetPath及packetSha256和readyAt。

主审可轮询owner根目录READY指针，本集成根指针另最后写入；读者必须按 READY 中 packet hash 检查，不能读半成品。packet不包含自己或READY的hash，避免递归；READY发布后该revision不可修改。SHA失败、缺资源、合成截图代替实际资源、未通过项被标通过时主审退回，新建rNN+1。审批由主审外部review记录表达，不改已封存包。所有worker结束后只一次回报并等待，无跨线程主动发送消息。
