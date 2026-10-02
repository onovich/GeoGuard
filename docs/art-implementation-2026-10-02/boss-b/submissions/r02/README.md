# Boss 后组 r02：8 身份可编辑生产资源，待主审验收

本组按已批准分组合同完成 `BOSS_RIGS_B`，覆盖 TWINS_MOON、DRAGON、SPIDER_MATRIARCH、ASTROLABE、BLOOD_FORGE、VOID_CONDUCTOR、LABYRINTH_KEEPER、NIGHTMARE_BLOOM。只写独占 `src/view/art/characters/bossRigDataB.js`、本组 8 个 public 身份目录及本组新提交；没有改公共 rig、registry、manifest、入口、逻辑或 Git。

[资源审阅入口](index.html)；[完整资源元数据与 81 来源映射](manifest.json)；[器官/锚点与中间姿态审计](anchor-audit.json)；[验证结果](verification.json)；[视觉自检及接入边界](review-notes.md)。r01 中 5 张最终身体板及 2 张正式桌面场景已实际 view_image，来源证据封存在 r01，本轮沿用，不裁原画。

每身份 public 目录有可编辑 `source.svg`、同源 `body.svg`、透明 256 PNG、独立裁框 64 SVG/PNG icon、4 个 body-only clips 的 SVG/PNG 及 `rig.json`。动作导出保持完整 256 画布，原地 NEUTRAL/WINDUP/ATTACK/OPEN 共 32 个关键姿态；81 条原画记录明确复用这些身体格，47 个实际 runtime ability key 和 0/1/2 phase selector 均有合法映射。phase 身体均按原画复用 neutral；OPEN 身体复用 neutral，覆盖线由世界表现层负责。

9 姿态接触表含 neutral/squash/stretch/windup/attack/open/left/move/up-fallback；动作接触表另展示 windup/attack 的 0/.25/.5/.75/1 进度。实战尺寸表采用 runtime 半径 26/32/31/33/35/29/33/32，保持 1 世界单位=1 像素；48/64/96 图标表独立裁框，不改变 body 根锚。

测量基于本次新画的路径、器官坐标与源参考碰撞圆，绝不采用设定板 root 十字像素。`r0` 是作者在源画布定义的碰撞参考圆，用于 `actor.radius/r0`；完整轮廓可以伸出该圆，尤其长臂、尾和门。本包另记录实际透明像素外接范围及完整轮廓外接半径，两个量不混称。

|身份|R 源根锚|C0 源逻辑中心|r0 参考碰撞圆|实际半径|根锚类型|
|---|---|---|---|---|---|
|TWINS_MOON|128,228|128,137|100|26|月牙下方固定投影|
|DRAGON|128,225|128,141|115|32|连续身尾下方固定投影|
|SPIDER_MATRIARCH|128,223|128,152|111|31|两短底足接地点中点|
|ASTROLABE|128,228|128,142|104|33|月壳下方固定投影|
|BLOOD_FORGE|128,233|128,151|110|35|两底脚接地点中点|
|VOID_CONDUCTOR|128,242|128,144|114|29|三裙端下方固定投影|
|LABYRINTH_KEEPER|128,233|128,149|110|33|两底脚接地点中点|
|NIGHTMARE_BLOOM|128,234|128,146|108|32|双底叶下方固定投影|

复现：用 Node 运行本目录 `export-and-validate.mjs`，读取现有公共采样器，在内存注入本组数据后由其 planToSvg 导出，再用 bundled sharp 本地栅格化。脚本只覆盖本组资源/文档，不写公共模块；用 `seal-packet.mjs` 最后封包并原子发布 boss-b/READY.json。公共 sampler 的 SHA 在 verification 中固定记录；公共代码改变后应在新 revision 重验，不改本封存提交。

当前是独立制作已提交，不是资源批准或游戏接入完成。角色主会话负责 import 本组 export、合并公共 manifest 和 API；QA 再用真正公共 registry 播放实测。当前共享 sampler 的 windup 终点与 attack 起点软矩阵不同，跨 pose 混合尚未实现；已经交付边界锚值及中间帧供 owner 修复/验证。没有获批的 Boss UP 身体投影，采用同一批准右身作为安全展示，不声称新增方向已验收。
