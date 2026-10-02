# 背景组准备稿

日期：2026-10-02（Asia/Shanghai）。状态：准备完成，等待主审转交已批准 master 文件、书面审批与风格合同。本稿不是送审包，不发布 READY，不代表背景方案已获批准。本阶段没有生图。

## 范围与依赖

本会话只写 scene-ui-2026-10-02/background/。已先读 ../coordination.md 和 ../../production-art-2026-10-02/final-acceptance.md。上一轮角色、机关、效果与图册全部只读；48身份、375来源的身份与归属保持原合同。原画板中的历史简写遇到冲突，以最终审批和生效文字规格为准。

下一阶段由主审明确转交 master 的不可变版本、图片路径、批准记录和风格合同后开始。需明确其地面色、装饰形状/密度、世界与屏幕空间划分、桌面/手机构图留白。不得自行把旧风格探索图、master 草案或本准备稿当作新 master 批准。

## 实际相机与世界证据

|只读源码|事实|背景要求|
|---|---|---|
|src/view/canvas/canvasRenderer.js:843–871|画布尺寸除以 devicePixelRatio 得逻辑尺寸；先填背景，再 translate(width/2-cameraX, height/2-cameraY)；本函数没有世界缩放或透视|角色与背景处于同一平面，不能画带地平线或强透视的固定风景。1440×900、390×844只作为原画逻辑构图目标|
|src/view/canvas/canvasRenderer.js:847–851|cameraX/Y叠加随计时衰减的震动|延展须涵盖平移与震动露出的区域；画稿裁切边不能成为世界边缘|
|src/view/canvas/canvasRenderer.js:858–871|网格60世界单位；起点由相机视窗左上向下取整，能继续到正负世界坐标|连续地面应在世界坐标稳定，不能跟屏幕滑动；60是现有网格步长，不是强制新增的建造格或碰撞格|
|src/logic/hooks/useGeoGuardGame.jsx:864–870|玩家先执行世界移动，相机每帧按(player-camera)×5×dt跟随|中央留白是每个局部视窗的稀疏密度要求，不能是只有世界原点存在的一块永久圆形空地|
|src/logic/engine/battlefieldRules.js:26–37|玩家移动仅检查活着且mechanic.solid的实体；此函数没有地图矩形边界|开放战场，不新增围墙、河沟、岩块障碍、道路限定或不可行走区域。既有实体障碍由实体组负责|
|src/logic/engine/gameRules.js:5–13|敌人在相机周围随机角度、max(viewportWidth,viewportHeight)/2+100半径出生|任意方向可进入；不可画成固定入口、路线塔防或封闭竞技场|
|src/view/canvas/canvasRenderer.js:1330之后|world restore之后才绘制active临时触控位置|屏幕边框/HUD/临时触控提示独立于世界地面；背景不烘焙UI，不新增常驻摇杆|

上述来自源码阅读，未运行设备或游戏验收。连续性不能靠一张有限壁纸的留白边缘保证；最终原画须给出可持续拼接/延展的设计依据，真正无缝纹理、图集与实现验收留后续生产。

## 配色与视觉层级

gameConfig.js 当前运行色：bg #F0F4F8、grid #E2E8F0、gem/success #2ECC71、danger #E74C3C、projectile #F1C40F、player #4A90E2、text #2C3E50。这些是现状证据，不等同本轮已批贴纸配色，也不在此阶段改代码。

旧图册 README 的风格建议：奶油底 #FFF8EA、暖深棕 #49362C、鼠尾草友军 #A7BD88、珊瑚敌军 #E67668、蜂蜜玩家 #F1C97B、薄荷资源 #77C79E；最终背景色等待已批 master。浅底正式UI字色沿用上轮生效规格 #4B281C，背景不制作文字资源。

要求地面基底最弱，地面纹样和装饰弱于角色、掉落与判定提示。背景无需模仿角色的粗深棕闭合描边；采用更弱的平色与软形，避免颗粒噪声、强材质、写实光照、高细节风景或桌游边框。阴影是独立视觉层，不能烘焙未知角色的影子到地面。

所有方向都保持可穿行的视觉读法。装饰仅用合同批准的低对比平面形状；不新增敌人、动物、脸、塔基、箱子、宝石、钱币、治疗物、可攻击植物或HP对象。禁止用明亮菱形、孤立饱和小点、尖头短线、规则瞄准环、长虚线和交叉网格伪装掉落/弹体/危区。背景植物也不可复用 PLAYER 单叶、友军炮口、ROOT 根网或 NEST 身份轮廓。

## 危区与资源共存

- AREA：combatRules.js:32 的距离判定为 radius+target.radius；外边界必须对准真实圆盘 radius。内部环只是装饰，不能画成安全空心环。图像与逻辑中心/root转换仍按上轮合同。
- LINE：combatRules.js:50–62 对真实有限线段求最近点，距离阈值为 width+target.radius；不含目标半径时，足迹为两端圆帽、总宽2×width的带。现有 renderer 的线宽 width×(0.7+(1-progress)×0.5)是视觉表现，不能被当作真实危险带宽。不能把任意角交叉线改成固定正交十字或加危险方盒。
- 预警timer>0、timer归零结算、真实transient消散；背景不提供预警/生效/残留状态，不延长伤害，不增脉冲。多脉冲按实际radiusStep等参数改变足迹。
- WEB/ROOT地形是独立机关拥有的效果，真实停止条件受owner控制；不能把这种带边界的网根纹样当作永久背景。
- 当前state.drops在renderer:899–907绘成菱形，enemyDefeatRuntime.js:25创建真实drop。B04/M09是拾取资产；COURIER退款B04/M08直接加money，不是地上拾取物。背景不得加入两者的轮廓或光晕。
- 密集场景要同时看清珊瑚警告边界、冰蓝/灰紫功能辅色、薄荷拾取物和鼠尾草友军；用形状、边界与留白区分，不能只用色相。

## 待批准后两张精细板

|板|交付范围|拆分边界|
|---|---|---|
|BG01 干净完整战场背景|遵循master的平面开放场景；中央自由战斗空间；上下左右可延展；无角色、UI、弹体、拾取、危区|整幅是背景单独干净稿，不能把角色或HUD抹淡后留在背景中；版面标题/说明若有，须在画稿框外|
|BG02 地面/装饰/层级细化|地面基底、弱纹样、稀疏非碰撞装饰、各层合成顺序与四向连续规则；给出桌面/手机裁切与移动窗口示意|世界地面和装饰与屏幕框分开；角色/影子/效果/资源/UI仅标接口，不烘焙入素材；层级标示是生产指导，非透明切件或已接入资源|

BG02 的可读性对照可在独立示意区使用主审批准的已有实体/危区作尺度参照，必须明确来源且与背景层分开；不制作第三张板或新角色。额外背景板仅由主审增补范围。现有renderer把危区绘在角色之后，示意层级不能声称已改运行排序；装饰始终在实体之前。

可用性审阅目标：桌面1440×900、手机390×844设计视窗均保留可移动空间；裁切不露封闭边框；偏移视窗、负世界坐标和震动边缘不会看到纸张硬边；所有可见装饰可自由穿过；危区与资源不受纹样干扰。生成图不能证明设备测试、拼接像素或性能通过。

## 已实际查看的图像

以下均已用 view_image 查看；这里只作准备阶段的只读依据。未来imagegen调用前还须查看届时全部引用及获批master，逐一标明风格/结构/效果角色。

- docs/art-direction/2026-10-01-round5/02-sticker-v2.png：旧整体风格母版，奶油留白、暖棕轮廓、节制颜色；不作为新master批准或真实UI功能权威。
- production-art-2026-10-02/friendly/submissions/r01/player-fixed-root.png：r03复用的玩家身体，单叶与固定水平root；角色不属于背景层。
- production-art-2026-10-02/enemies/submissions/r02/images/01-fast-tank.png：敌方软轮廓、珊瑚身体与深棕表情；背景弱于此层。
- production-art-2026-10-02/effects-ui/submissions/r02/b03-hazard-lifecycle.png：真实圆盘、胶囊线带、装饰内环与逐线交叉；背景禁止复用其语法作纹样。
- production-art-2026-10-02/effects-ui/submissions/r02/b04-mechanic-feedback.png：WEB/ROOT、召唤、链接、即时退款和真正掉落的独立语义；背景排除这些资产。

相对图像路径以上层sticker-bible-2026-10-01为根；round5路径从仓库根计。另读旧index.html、README.md及最终integration/submissions/r02/effective-specifications.md、friendly r03/effects-ui r02 production-notes.md。历史文档的pending/submitted不改写，上一轮通过权威为final-acceptance及reviews记录。

## 后续制作与提交规则

本轮最终原画使用imagegen技能的内置image_gen，先view全部引用，不用代码/SVG/HTML/Canvas绘画，不切换API/CLI。完整prompt、生成工具记录与选稿保存本组目录；生成图复制进工作区，源稿和真实透明资产不冒充已完成。

正式送审仅在本组submissions/rNN/建立新不可变版本；packet.json含owner=background、revision、status=submitted、files相对组路径与SHA256、images、coveredRequirements、openIssues、dependencies、summary。依赖记录获批master文件与审批来源，并核验SHA。文件齐全且核验后，最后原子更新本组READY.json的revision/packetPath。已封包不可覆盖；返修新revision。提交后停止等待主审，不跨会话发消息，无权自行通过。

本阶段唯一产物是本preparation.md；没有正式packet、READY、资源接入、src/package/tests改动、旧美术修改、提交或部署。准备完成即停止，待主审下一阶段指令。
