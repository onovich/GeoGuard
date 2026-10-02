# World r01：只读勘察与制作计划

2026-10-02。状态：submitted_plan，待主审批准基线、统一契约及实施。此包只在本 submissions/r01 写入文档和预览；无 src/public/package、封存原画、Git、角色或玩家 UI 修改。预览是可编辑制作样本，不是运行素材或实机验收。

## 依据与视觉目标

BG r02 的 BG01/BG02 和正式 background-r02 review；production effects-ui r02 的 B01–B04/B07 U10、r01 三类 HIT 行和正式 effects-ui-r02 review；friendly r03 固定 root/方向/P/M 契约；统一 integration r02、delivery r02。图片已实际查看：BG01/BG02、B01、B02、B03、B04、r01 HIT、B07。

世界基底 #FFF9EF；极淡 sage/骨色不对称钝缺口斑与三短草，无深棕地面描边、石块、灌木、铺装、道路或新增物件。1440×900 可见窗口建议 12–16 个淡斑、6–8 组草，世界坐标分布固定。影子为独立柔棕根锚投影，强于地面、弱于身体。B01 的圆籽、胶囊、细尖梭、双色 BURST 和深 sage SENTINEL 如实重绘，绝不用当前几何塔/怪作为生产外观。此次预览不绘身体，不裁切整张设定板。

## 文件所有权与导出提案

|后续文件（尚未创建）|职责|
|---|---|
|src/view/art/world/index.js|汇总无副作用纯绘制接口|
|src/view/art/world/ground.js|世界稳定底色/缺口斑/草，负坐标、viewport与shake边界|
|src/view/art/world/projectiles.js|10来源外观、3逻辑kind、速度向量朝向、previous→current短轨迹|
|src/view/art/world/shotEffects.js|独立flash与3命中家族；使用显式真实事件|
|src/view/art/world/hazards.js|真实圆盘/有限胶囊/逐线网格、机关地形、装饰裁切|
|src/view/art/world/feedback.js|既有粒子/impactWaves、成功召唤/分裂、退款视觉、专题波|
|src/view/art/world/overlays.js|独立根锚影子、范围、状态与连线绘制原语；调用归属待统一分层|
|public/art/world/**|获批后需要的alpha纹样/图集与manifest；优先可编辑矢量/Canvas路径，不承诺必须位图化|

共享 canvasRenderer.js、逻辑元数据写入、角色状态选择和 UI 由集成/角色/UI owner 独占。world 不写上述共享入口。manifest/资源字段以批准统一契约为准，不另设第二套全局资源管理器。地表以确定性cell-hash选择少量获批路径，邻区扩展按最大图形外伸遍历，归属唯一；不把有限 BG01 PNG 当无缝tile。使用实际已带shake的 cameraX/Y，无新增随机位移、视差或模拟更新。

## 运行盘点与接入依赖

当前 drawGameScene：screen清底→60px网格→塔及badge/HP→drops→links→敌人/状态→PLAYER→impactWaves→hazards→projectiles→placement→particles→浮字→screen joystick。全局shadowBlur同时影响诸多对象，需集成取消通用投影并显式调用独立根锚影子。目标分层由集成批准：奶油地面→投影影子→危险填充/边界→身体→弹体/flash/hit→标签→screen UI。紧迫边界在拥挤场景的遮挡策略待整体联调，不自行把全部危区覆盖身体。

createProjectile 只有 kind/color/运动/伤害字段，无 owner/source 身份，无UID或出生时间。九塔 kind 取 splash→cannon、pierce→sniper、否则basic；PLAYER是basic。color虽现可区分九塔，但不是身份契约，不能以改色/等级/碰撞结果猜来源。需要集成在实际发射处写入只读外观身份，例如 appearanceSource=PLAYER/BASIC/…/SENTINEL（字段名待批）及可追踪ownerUid/shotEventId。数值、出生owner.x/y、循环次数和 createProjectile 行为不变。

flash只能真实成功发射时产生，不能按 lastShoot 周期、孔数或每帧绘制创建；同一逻辑step内出生并命中的弹体不可依数组差集可靠观察。需要统一只读视觉事件入口（shot/hit/defeat/summon-success/split-success/refund），或在既有transient中添加只读来源元数据。metadata不得成为伤害、实体出生、金额或冷却的分支条件。无此批准入口时仅可可靠绘制现存弹体/状态/hazards/transients，不宣称专用flash/命中全部完成。

既有 particles 只有 x/y/vx/vy/life/maxLife/color/size：击中、建造、毁塔、接触、死亡等共用，无法准确分类。life初始化1，maxLife随机0.3–0.6，renderer现用life/maxLife会大于1；美术绘制只clamp到[0,1]，不修正生命周期。impactWaves 有style、radius/maxRadius/growth/life等，可直接绘制已有twin/dragon/spider/astrolabe装饰，不能据技能名字补造被优化handler替代的波。

## 弹体与挂点

完整10来源见 coverage.json 和 projectile-preview.svg。形状/配色来自 B01/P01–P10，命中只复用 r01三行，不新增运动kind。设计显示尺寸是首轮提案，不改 projectile.radius、扫掠判定、速度、寿命、伤害、穿透、splash或slow。CANNON绿色大圆与 BASIC绿色小圆以大小区分；MORTAR珊瑚圆仍直线运动。SNIPER sage梭与RAIL lavender梭保留尖长区别；RAPID mint短胶囊、FROST蓝胶囊、BURST双色胶囊、SENTINEL深sage椭圆、PLAYER蜂蜜籽。

projectile绘制中心=P=(x,y)，朝向atan2(vy,vx)，轨迹严格previous→current，不绘向未来延伸的逻辑轨道。flash局部根=M=(0,0)，前向+X，调用者提供实际测量的世界M、方向和可解释遮挡。LEFT整个rig围绕root镜像后才残余瞄准；UP按friendly既批投影。双口/四口只影响挂点映射，不创造额外shots；BURST内部Lv3=5发不改四器官。PLAYER无炮管，出口提案可用owner中心，最终由集成与角色owner确认。

## 危险几何与生命周期

area外边界严格(center,radius)，实心盘，不因内部环/网/图案产生安全岛；逻辑target.radius另外参与判定。line外边界是有限线段的round-cap胶囊：半宽=hazard.width，全宽=2×width，端帽半径=width。零长线退化圆盘半径width。stroke描述边界时使用内侧细描边/clip，防止装饰把危险视觉范围扩大。H04只逐条真实line描绘，可斜交/平行，绝不做含额外角落的方盒。

当前线描画 lineWidth=width*(0.7+(1-progress)*0.5)，与完整判定胶囊不一致；未来修复限绘制。WARNING=仍在state.hazards且timer>0，timer/maxTimer仅调紧迫度，外范围不呼吸。timer<=0逻辑结算通常同step已移除，不能凭每帧观测假设持久RESOLVE状态。原图RESOLVE只是逻辑瞬间，不另造伤害窗。FADE仅现有impactWaves/particles，line只有终点36半径波0.18s，不补整条残留危险带；area波0.22s，不延长。重复盘每脉冲按新radius/maxTimer/pulsesRemaining重画。

WEB：radius52、delay1.1、10脉冲、interval1；ROOT：radius44、每轮radiusStep2、其余按实际字段。ROOT label实际poison，必须先用 ownerMechanicUid 找到 mechanic.kind=root 后选择M02，不能仅靠label把所有poison画成根网。owner机关击破或Boss死亡导致真实terrain删除时立即撤掉盘与terrain装饰，不保留看似有害的淡出边界。普通非terrain余波依逻辑继续存在，不因owner已死统一清除。RETICLE触发另排radius32/delay0.8圆区，SEAL只是冻结目标，不伪造地盘。

## 反馈、掉落、状态与范围

state.drops是唯一拾取绘制源，M09薄荷菱形，遵循原x/y/radius/value/magnetized与拾取移除。正常Boss即时赏金、COURIER cargo退款不生成drop；M08只实际settleMechanicDefeatRuntime退款>0且未escaped时播放，不能在stealMoney/repossess施法时播正钱。退款金额/浮字由UI与集成消费实际值，不由图案发钱。

M11/M05只真实粒子/破碎反馈，不画尸体或新孩子，身体破碎拓扑由角色owner；M03/M04绑定成功生成的child UID，预算为零不得成功闪；BEACON现有尝试波仍按summonTimer产生，二者分开。parentUid/targetUid/lockedTarget真实关系绘M06/M07/S16，实体失效立即停止链接。专题装饰仅沿已有impactWave.style。

B02外部状态原语可由world提供，选择与身体alpha/遮挡由角色/集成负责：shield>0；slowTimer/slowRatio；tower.frozenTimer；getTowerFireRateFactor的真实jamAura资格；armoredTimer；phased；burrowed/emerge；hitFlash；damageTakenMultiplier>1全身OPEN；bossState.partnerFallen狂暴；phaseIntroTimer；healAura/fuseTimer只资格装饰不创建hazard。等级/HP文字及布局交角色/UI集成，world仅提供底形/绘制原语，不抢写角色状态机。S13地面由已批BG r02覆盖，不能把B02旧规则椭圆样本重新铺入世界。

placement只active && kind=tower，中心dragPlacement.worldX/Y，range来自getTowerById，不设固定半径；green/check与coral/cross是有效/无效辅助，canPlace/invalidReason是权威。身体ghost由角色owner提供；不足资金中文提示由UI owner，不在world画新按钮。范围非危险，用低饱和mint/coral及定位符区分珊瑚敌方危险盘；提示不新增碰撞、射程、建造承诺。

## 实施顺序与验证门

1. 主审批准基线与统一资源/root/layer/event contract，确认上述共享字段和调用文件由集成写入；其余owners消费单一契约。
2. world独占目录制作地面/10弹体/flash/hit/独立投影与drops，保留源路径/alpha/bounds/pivot/来源manifest。每种资产按1×、2×、3×查看；本包先给 editable preview。
3. 危区精确原语与terrain/links/status/feedback，绑定真实对象，不新建logical hazard；基于实际source字段接入事件分类与清理。
4. 集成真正render loop后，由QA验证四向负坐标移动、shake边界、暂停/重开、源移除、5发BURST、MORTAR直线、source10/kind3、所有标准95技能声明覆盖与实际抽样。
5. 实机用获批master r04的WAVE31密集场和WAVE27双子合法组合核验：低饱和弹体/grass/资源区分、PLAYER定位、圆盘/有限线胶囊端帽、ghost与危区区分、UI遮挡。不把此包当实机、连续动画或性能通过。

重点依赖：缺少真实事件及来源字段（高）；角色导出root/M未量测（高）；目标layer顺序需共享renderer重排（中）；全局shadow清理（中）；负坐标cell/hash正确性与边界（中）；1×绿色小弹在背景上的辨识需联合实测（中）。本包通过来源/结构/数学只读核对，不声称性能、玩法轨迹或10外观均实际接入。
