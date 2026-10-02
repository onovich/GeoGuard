# UI r02 桌面送审入口

2026-10-02。状态submitted，正式审批pending_main_review；不自批准。主审已实际查看三张根目录最终图并通过构成预检，要求停止美化、完成封包；此记录不代替reviews/ui-r02.md正式批准。

从[静态图册](index.html)逐张查看：

|板|最终选稿与检查格|
|---|---|
|[DUI01](dui01-nine-towers-scroll.png)|DUI01-edit8。A左端6全卡＋第7露边、B右端到哨戒塔、C九身份展开来源、D小桌面；FROST55已实际修正，成本/不同级别/类别/间隔；原生水平滑块与鼠标，不含翻页按钮|
|[DUI02](dui02-mouse-states.png)|DUI02-edit4。A hover、B有效ghost在coral盘内且射程交叠、C实体阻挡、D不足仍可拖、E整栏18px取消。五格完整HIVE名称/HP/phase/action/全文对策；A/E恢复、B/C/D攻击；正确NEST、无额外箭头按钮|
|[DUI03](dui03-boss-rewards.png)|DUI03-edit1。A小头像HIVE、B双独立成员/长对策、C小桌面、D/E/F实际1/2/3奖励；长蓝图detail去重复但保留未来建造规则；已移除首稿森林、锁槽、技能式按钮并恢复canonical PLAYER|

DUI02制作中根目录曾指向edit2，主审异步预览读到旧版；正式选稿已复制edit4并按实际路径view_image重看，与生成原图SHA一致。请仅用packet.images三板，不用candidates。13候选仅审计历史，不能提升为生产或增加板数。生成记录保存16次成功调用全文prompt、输入路径/SHA和原生输出/复制SHA；第一回9引用因参数上限拒绝，未生成图，已注明，不计成功调用。

48项需求逐格绑定于requirements-map.json；production-notes为正式文字/色码/布局语义目标；rule-evidence直接只读调用现有纯规则，证明9卡数值及1/2/3奖励，不冒充整局/实机/概率验证。9塔精确NEUTRAL源格/器官合同/SHA见tower-icon-sources，生成缩略图不覆盖canonical；没有透明图标导出。43个只读来源SHA包含15张实际查看的源图（旧UI、全塔/PLAYER/HIVE/双子及新旧背景）。

主审特别要求：DUI02 B危区底边靠近底栏，最终master联合复合必须给危险边界留可读空间；此板是鼠标时序示意，不是高密度联合通过。最终地面按已批background r02稀疏缺口斑，DUI01地面只上下文。高密度真实怪群/精英/大量弹体/受伤塔与紧迫威胁同屏由master在依赖批准后完成，非UI组跨目录制作。

尺寸、卡宽、字体、触控/鼠标位置、合成对比都是目标，仅读取实际PNG尺寸；未改src/游戏/资源接入/提交部署。手机暂缓，旧r01功能与手机稿保持封存。没有新增技能/商城/卖塔/收费升阶/右键debug包装/滚轮转换/翻页/确认/刷新/跳过。

封包最后原子更新本组READY，r02不可变。正式提交后停止等待主审；任何正式退回由新revision关闭。
