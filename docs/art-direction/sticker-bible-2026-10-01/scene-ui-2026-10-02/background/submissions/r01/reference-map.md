# r01 来源与整体元素映射

路径以仓库根D:/WebProjects/GeoGuard为根；精确SHA在source-fingerprints.json。本组只生成地面背景，不生成角色或效果。

|本组元素|源权威|使用方式|
|---|---|---|
|BG01 cream base、pale sage patches、short grass|scene-ui-2026-10-02/master/submissions/r02/master-desktop-r02.png与style-contract.md|唯一当前整体风格与地面语法；先实际view再作为imagegen输入|
|BG02三样本、分布示意、右侧背景样本|本组BG01＋获批master r02|两图均已实际view；仅复制背景语法，不复制任何身体/UI/危区|
|BG02裁切框、移动箭头、层级文字|master r02合同、constraints及本组preparation|仅规格说明；不可接入world或当玩家界面|
|BG02修正|本组iterations/bg02-first.png|实际view后的精确编辑目标；仅去除浅斑样本的一簇草痕，最终为bg02-ground-layers.png|
|03 ENTITY SHADOWS|master目标层级、旧B02外置影子规格|仅文字接口；不提供影子图像|
|04 HAZARDS|旧effects-ui r02 B03、B04及combatRules|已实际view只读效果板；仅说明真实几何与禁用背景图形，不发送给imagegen、不生成新效果|
|05 BODIES|已批准master reference-map.md及上一轮final-acceptance|整体场上tower:BASIC/CANNON/BURST、hero:PLAYER、enemy:BASIC×3、boss:HIVE、mechanic:NEST；SNIPER仅初始塔卡。全部从本背景排除，无新身体来源格|
|06 SHOTS、07 ENTITY LABELS|master style-contract与旧最终效果规范|仅文字接口，不烘焙弹体、状态、HP、等级|
|08 SCREEN UI|master style-contract与constraints|HUD/Boss/塔卡/提示/modal由UI组负责；本组不输出这些组件|

已读master reference-map包含真正身体板映射，旧02-sticker-v2只作历史风格参考，不能覆盖新body-only结构。背景不改变48身份/375参考条目，也不把草痕登记为新实体。未展示独立角色身体，因此没有新增身体格、挂点、source cell或动画帧。source-fingerprints列出本组实际读取的审批、合同、图片、源码及准备稿，独立生产背景与整体包含元素的归属由本表明确分开。

master合同旧pending/submitted字段保留不动，其已批证据为reviews/master-r02.md。当前背景包status=submitted仍待主审，不能以master批准替代背景逐图批准。
