# UI-F01 / UI-F05 HUD提交 r01
2026-10-06，仅授权BuildBar、GameHud、StatusBanner，未改逻辑/data/renderer、未推送。

UI-F01：共用getDescriptionPosition从实际card和bar viewport交集计算。完全离屏返回null关闭，不借其它塔代替；部分可见取真实交集中心作为锚点。正常位置保留小菱形尾；极窄边缘片段用1px垂直短连接，防止菱形斜角出界，不把锚点假夹到别卡。onScroll仍优先真实activeElement，只在focus塔卡可见时重算，末卡native自动滚动保留。ResizeObserver与window resize复用同一重算：有可见焦点卡更新，否则关闭旧hover。滚回focus旧卡重新出现属于正确仍焦点状态；blur/drag/无focus滚动清空。教学原一次关闭及tooltip互斥不改。

UI-F05：对照DUI01的身体/费用一级、等级/类别二级与master整体中的低权重容器。底栏外框改31%棕，卡中性40%、不足80%珊瑚，保留交互hover焦点/拖中深棕，不淡化所有文字。肖像64→68px，费用18保持一级，等级降medium且用仍高对比#70554A，间隔同次级色；卡140/gap8/max920与148最小高不变（正文实际可能轻微增加）。顶层生命/资金框50%棕，时间/音频/教学31%，Boss威胁框维持100%，Banner44%；这使边线角色/威胁>生命资金>时间辅助分层，不是统一变淡。符号轮廓和语义底色未改。需主审整体游戏判断，不凭组件判断最终画面通过。

架构11/11及build通过，warnings均既有。测试前没有自行浏览器操作。等待主审左右离屏/局部可见/末卡focus/resize/失焦/drag/教学关闭+首末三九卡与整体战斗视觉验收。