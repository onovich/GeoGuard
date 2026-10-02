# 玩家桌面 UI · r01 勘察与制作计划

2026-10-02，Asia/Shanghai。状态：仅方案与独立制作预览，待主审批准统一契约后实施。没有修改游戏源码、public、package 或封存原画；不进行 Git 操作。这里的要求覆盖是“实施路由覆盖”，不代表已完成运行验收。

依据：scene-ui 的 UI r02 三张精细图、master r04 两张联合图和正式主审记录；逐张实际查看。UI r02 requirements-map.json 的 48 项全部保留原 ID；详见 coverage.json。制作优先级依批准原画，不用设定图上的生成字形作为运行文字，也不从联合图裁角色。

## 现状与文件边界

BuildBar 目前是 72px 最小卡宽、几何占位身份，资金不足整体透明；原生水平滚动、溢出 fades、左键拖建已经存在，低资金没有禁用起拖。GameHud 的 Boss 是 340px 深色面板，全部成员字段已经接入，字号小；audio props 已传入但未呈现。WaveRewardOverlay 固定 md:grid-cols-3，使单/双奖励留下空列。StatusBanner 只呈现 title，不能把未显示的 subtitle/chips 冒称现有玩家功能。

暂停面板写在 GameScreen，且该入口由集成组独占；UI 组建议新增 PauseOverlay 供其接入，不能在当前权限内保证暂停完整替换。ui.jsx/designSystem 被 DebugSpawnPanel、BossEditorPanel 等共同使用；方案保留所有现有 ui token 与默认行为，只增加明确命名的 player 表现入口，玩家组件显式消费。PlaytestExport 不包装。

TowerContextMenu 的升级/降级实际仅 debug 可打开和执行（hook 有 mode guard）。因此不新增玩家菜单、不收费、不提供卖塔；该文件当前列为只读保留。若主审坚持改变其外观，需要先澄清“开发者 UI 不包装”边界，但不会因此阻塞其余玩家组件。

所有权及请求见 ownership.json / contract-requests.json。批准前所有产物仅写本 submissions/r01；唯一目录外写入是按文件协议原子发布 ui/READY.json。

## 视觉系统与布局

奶油 #FFF9EF；字/线 #4B281C；sage #B6D4AE；coral #F4ADA0；honey #F8DDAA；mint #A8D8BC；奖励 blue #C7E4F4。深字与线一致、柔和外轮廓、少量平面层次，不保留当前重玻璃/深色 Boss/大投影。深棕在这些实色面上的对比由 verify-preview.mjs 计算；实际透明世界合成仍须接入后验证。

字体用本机可用的 Microsoft YaHei UI / Microsoft YaHei 中文链，标题、塔身份较重，正文清晰；数据用同字号 tabular-nums。显示角色器官与原画一致比额外字体下载更重要，本轮不增加网络字体依赖。正文≥14px、费用≥18px、辅助≥12px；实际字体回退需要桌面截图确认。

上 HUD：screen 锚定，16px 外边距；HP 左、wave/time 中、money/pause 右。暂停作为已有控制，音量控件使用已存在的 audioSettings.enabled/volume 和 setters，紧凑地放右侧；静音是 boolean，range 0..1。UI 不自行保存第二份音量，不改变 AudioContext 或播放规则。开始与结束沿 UI_COPY + time/currentWave，不新增关卡/商城/账号入口。

Boss：最大宽 680，头像32，padding8–10；组名与共同对策一次、每成员独立一行，name、hpRatio、phase、P(min(count,index+1))/count、actionLabel 全保留。仅实际成员数组决定数量，不按假想双子补齐。enraged/guardCount>0/exposed 保留条件渲染；肖像不能从 member.id UID 猜身份，须统一资源契约提供稳定 art key。数据只有 hpRatio，没有 hp/maxHp；不伪造数字HP。单成员约92px、双成员约108、小窗长文约124是目标，文字自然增加高度，不能切字段；与 HUD 合计下沿180目标在实际截图中量测，超高时记录真实占用。

建造栏：bottom24、居中、min(92vw,920px)，每卡 border-box 140px、gap8、panel padding8、独立 scrollbar 带12px。姓名≥16、费用≥18，Lv+1/4、UP+level、类别与完整间隔≥12。不足状态增加深字“资金不足”与coral浅面，卡/回调可起拖；不做 disabled 或整卡 opacity。卡保持全部内容可读，真实长动态 name 预留自然换行、不编第五字新塔。九塔顺序仍由 hook 的 available/filter 与 sortOrder 决定。

按 min(92vw,920px)/140/8/padding8 的实际 CSS，960 的92vw=883.2，卡片内宽约863.2，六卡合计880而不能全放；能容纳五全卡与第六大部分。1440/1280为920，卡片内宽900，可容纳六卡880与第七部分。预览按真CSS量测，不把PNG比例当运行标尺；实现保留此精确合同。首尾都可通过原生 scrollbar 到达，fades pointer-events:none 且不得遮挡滑块。没有 onWheel 转换、箭头按钮、分页、空白拖栏承诺。

hover 用已有 summary/damage/fireRate/range 重排成≤360px tooltip，锚在栏上方、靠边翻转；这是表现改造，不增加详情数据。可由组件本地 hover 状态实现；滚动、拖起、隐藏栏、blur 时清除，防双层原生title冲突；需要明确用于说明的 accessible label。保持不改变原 onMouseDown/Touch 拖建资格和时序，手机暂缓但不能破坏既有触屏入口。

奖励：choices 原样决定1/2/3，没有补空槽或假第四项。grid 根据实际 length 1/2/3 列，单项居中，同宽且CTA底对齐；960仍三列约224宽，全文自然换行，矮窗口整层 overflow-y:auto、my-auto。choice.title/subtitle/detail 为数据权威，可去掉物资重复解释；upgrade 保留“仅强化后续建造，已有塔保持原等级。”一次；造价转换及补贴、伤害、射程、间隔和减速全部保留。优先以保守的原始detail全文呈现，只有确定性解析才重排，解析失败回退全文，不调用新奖励规则或重复upgradeTower。整卡 button 一次 applyRewardChoice，CTA 为同 button 内标签。

状态：只显示真实 waveMsg.title/tone/accentColor，不生成新的倒计时、技能或 threat 菜单；重排为不会压 Boss 的较短 screen 提示。当前13%位置与双子面板重叠，需要集成提供 presentation inset（详见请求C-03），不能假设固定top就满足所有状态。

## 资源及分层

角色组提供同源 NEUTRAL UI thumbnail + Boss portrait，身份必须来自已批canonical器官锁与元数据，不能让 UI 另画几何替代。静态 UI 图标只需要 approved 心、mint菱形、蓝图等，可用可编辑 SVG；所有文字动态排版。角色生产动画严禁以设定板裁切冒充；本预览只以 SVG viewBox 临时展示只读原图格，包含少量基准线且非透明生产素材，明确等待角色组交付。原图字/root/导线不会进入最终资源。

screen UI、world-linked HP/等级、canvas ghost/range/hazard/弹体分离。ghost可放/位置无效/不足/回栏取消不由组件重新计算；主审/集成/效果组提供真实 placement 表现状态。资金不足优先于实体距离；危险区不参与placement资格；cancelRects整栏外扩18先判取消；仅成功扣费。UI 只维护选中卡、高亮和说明。暂停/奖励原 hook 已清拖，无需修改规则。

## 接入后验证计划

三桌面视口：1440×900、1280×720、960×720。需要真实启动源码的证据：开始/结束/暂停/音量、HUD长值、单/双成员/幸存者Boss、9塔首尾横滚、低资金起拖/有效释放/实体拒绝/回栏取消/暂停奖励中断、长hover、真实奖励1/2/3与未来蓝图语义。只新增能保护交互或数据的必要测试；不写照抄CSS的单测。运行既有 npm test / check:architecture / build；共享入口测试由集成负责合并后完成。

当前 verify-preview.mjs 是独立 HTML 的布局测量与可达性检查，不是游戏实机、鼠标放塔或性能验收。screenshots 仅用于主审判断制作方向；不能关闭高密度游戏合成要求。未来测试不新增 debug 控件到玩家产品中，使用既有测试入口构造合法状态，日志标记为测试实例。

风险：角色资源未产出；Boss无稳定身份字段；暂停及状态布局共享入口；小窗真实字号/占用；本机字形；长文本解析；overlay z-index/focus 与 canvas 鼠标穿透。每项都给出可执行契约请求和验证，不改变核心数值、AI、奖励或攻击规则。
