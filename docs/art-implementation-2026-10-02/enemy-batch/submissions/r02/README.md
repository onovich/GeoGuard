# 12敌人身体独立生产 r02（待主审）

12身份、67状态来源映射全部已制作到本组专属模块`src/view/art/characters/enemyRigData.js`，named export为plain object `ENEMY_RIGS`。只写该模块、本组12个resourceSlug公共资源目录与自有docs；没有更改共享rig/registry/manifest/index/helper、逻辑或依赖，也没有执行Git/跨线程工具消息。

身份：FAST、TANK、SPLINTER、SHIELD、MEDIC、BOMBER、JAMMER、PHASE、BURROWER、BEACON、SCOUT、SIEGE。每种均实际view_image查看最终身体来源，来源SHA在r01核验。轮廓分别为后扫双长耳、三冠双拳、单滴、前盾瓣、四叶医疗体、钩引信鼓腮、双天线四底瓣、双尖连体尾、三指掘爪、钟瓶双触芽、独眼长腿、额板双拳；没有复用同一圆团主体模板。

每身份公共目录提供可编辑source.svg/body.svg、256透明body.png、64icon.svg/icon.png、rig.json以及neutral/squash/stretch/action/left/up/windup/trigger各自独立SVG和透明PNG。所有身体画布256×256且不trim；独立图标按实际neutral alpha bounds另裁viewBox。身体不含投影、血条、弹体、召唤单位、危险区或外部状态圈。器官语义/计数/关节与父级见[organ-audit.json](organ-audit.json)和[manifest.json](manifest.json)。

离线导出读取角色主会话rig.js代码文本，只在内存替换其数据import为本组模块，不注册共享API、不写新运行渲染器。结果不代表已游戏接入或公共播放验证。每次导出记录采样器原始SHA；汇总者须按当前共享rig重新检查。

实际查看最终三张动作接触表、三张进度接触表、实战尺寸表及SPLINTER底边对照；[visual-inspection.json](visual-inspection.json)记录看到的结构及限制。

|材料|用途|
|---|---|
|poses-1/2/3.png|12身份中性/压缩/拉伸/动作/左右镜像|
|attack-progress-1/2/3.png|neutral与attack progress 0/.25/.5/.75/1的真实离线采样|
|runtime-size-contact.png|实际ENEMY_TYPES radius在1×画布与64图标并列，未放大实战栏|
|splinter-contact-proof.png/json|主审预检修正：neutral/action实际alpha底边均y=226，固定source R=[128,232]|
|raster-audit.json|透明像素、PNG尺寸、alpha bounds、画布边缘与单连体检查|
|sampler-checks.json|1620姿态/朝向/进度组合、有限路径矩阵、R/C固定与零输入改写、MOVE接缝|
|transition-limitations.json|静态poseVariants进入/退出尚无几何插值，交共享rig负责人后续验证|

SPLINTER按主审最新预检要求修正：保留下轮廓，只竖向拉伸上部/翘尖表示HOP意向；没有将整滴上移。原HOP悬起概念格仍保留来源，但此实现差异已明示，等待主审审图，不自行继承生产批准。

状态复用遵循批准map。PHASE_DASH是完整neutral身＋独立alpha状态，不新增dash；BURROWER EMERGE复用完整neutral身，出土波纹独立；BEACON SUMMON用windup/trigger/recover body，不含BASIC子体，实际数量仍由逻辑。没有敌人Boss phase或ability键，因此本组不虚构boss选择器。up为最近合法身体投影，未冒称新增上视造型。

限制：当前公共sampler静态选择poseVariants，FAST/SPLINTER/SHIELD/BOMBER/BEACON/SCOUT/SIEGE在变体进出时没有几何插值；对应关键轮廓已完成，但连续过渡须由公共rig负责人合并后验证/实现，本组没有权限改rig.js。此限制在封包openIssues中保留。资源和截图均为produced_pending_review，主审批准数0；未声明默认接入、完整连续动画或实机性能通过。
