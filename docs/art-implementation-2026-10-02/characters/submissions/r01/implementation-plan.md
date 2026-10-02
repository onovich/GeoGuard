# Characters r01 — 勘察与制作提案

2026-10-02。状态：只读勘察完成，等待主审批准统一契约后制作；本包不是生产美术完成声明。范围为九塔、PLAYER、十四普通/能力敌人、十七Boss身体（双子按两身份）、七机关，共48身份、375动作映射。

## 依据与优先级

采用 production-art integration r02 的最终 bodySources、行格/命名状态和正式 review；anatomy-lock 与 action-matrix 锁定身份和状态；friendly r03 的方向合同覆盖SENTINEL旧图上的LEFT180简写；scene-ui delivery r02 / master r04 控制电脑端联合构成。它们是已批原画与规格，不是生产源或已测连续动画。coverage.json 为48身份及全部375动作逐项保留最终身体来源、原画SHA、外部效果key、runtime hints和拟生产路径。历史 canonicalSheet 仅作身份依据，不作为默认身体资源。

已实际查看 BASIC/BURST 身体板、普通BASIC、PHASE/BURROWER、HIVE、KEEPER/BLOOM、NEST/WEB与两张最终联合图。全部28张最终身体板的存在/指纹由脚本核对，尚未逐张实查的板与逐身份图像复审是正式生产工作，不能以引用存在代替视觉验收。index.html提供全部48身份来源与动作行格，试样独立明确标为未获批。

## 文件所有权

当前唯一写区：本 submissions/r01（READY.json最后发布于characters根目录）。正式实现建议所有权为 src/view/art/characters/** 和 public/art/characters/**；待主审明确批准才使用。已有封存原画完全只读。

拟生产模块：index.js（统一公开接口）、registry.js（48身份与来源）、geometry.js（Path2D/贝塞尔数据）、poseSampler.js（纯姿态采样）、drawCharacterBody.js（内部只画身体）、anchors.js（root/face/P/M测量）、friendly.js、enemies.js、bosses.js、mechanics.js。public/art/characters/source/放可编辑SVG及身份manifest；导出透明PNG仅用于静态UI/性能缓存，透明资源不含背景或效果。保留矢量源及几何数据为可编辑权威。已读取集成owner当前 module-api.md 草案：公开入口愿采用其 drawCharacter(ctx, actor, frame, assets)、getCharacterAnchors(actor, frame)、getCharacterIcon、loadCharacterArt、resolveCharacterArtId 与 schemaVersion=1；本包原drawCharacterBody提案作为内部实现，避免两套公开API。最终仍以主审批准版本为准。

共享入口 src/view/canvas/canvasRenderer.js、GameScreen、BuildBar与所有logic/data不归本owner。集成owner将旧tower/enemy/player/Boss身体分支替换为统一接口，并复用同身体生成拖建幽灵、UI小图；角色owner不抢写共享入口。底座/影子、状态、血条、等级点徽、弹体、召唤、危险边界由其他owner/集成owner画。

## 画法与制作批次

使用经原画核对的连体贝塞尔轮廓、深棕轮廓线、sage/coral/honey/cream身份色和轻微面内亮暗。禁止把当前circle/square/triangle重新配色当完成。每个身份单独还原拓扑和器官，而不是同一圆团模板加标签。颜色从正式palette契约读取；试样色仅为可视化草案。

1. 先批准BASIC、BURST、PLAYER、普通BASIC、HIVE、KEEPER/BLOOM、SEAL/RETICLE的生产标准样，验证最容易失真或混层的身份。r01仅附BASIC/BURST可编辑技术试样，不提前创建正式源。
2. 完成九塔和英雄，静态/形变/三向/等级复用；九塔99＋英雄7共106动作映射，不制作106套动画。
3. 十四敌人，MOVE循环、能力状态及BASIC五芽两脚；77动作映射。
4. 十七Boss和七机关，192动作映射。每个Boss的phase/action/ability采用原批准明确复用；不以P1/P2/P3覆盖技能清单。双子分别两实体、两root、两套HP，身体不拼合。机关作为独立entity，附属器官无独立uid/hp。
5. 全48身份导出48/64/96px动作预览和器官计数，再由主审逐身份与联合场景实查；连续循环、方向接缝和遮挡都需要实际播放。

## 状态与锚点方案

建议每身份保留固定sourceCanvas、foot/projection root R、neutral collisionCenter C、face局部锚、软器官根、刚性组P与M列表。上游256/512坐标是提案而非PNG测量；正式源建立后填入实测值，不能用自动逐帧居中。比例s按该身份neutral约定一次确定，worldRoot = logicalCenter + s*(R-C)，任一pose都保持同R/C。逻辑radius、碰撞与发射出生点不随身体缩放。

有脚身份：双脚/多足接触点围绕R固定，允许脚步局部形变但不让整身体平移；无脚身份：固定地面投影R，不能凭空添加脚。面部与身体共局部变形空间，眼槽闭合保留锚点。柔软器官在父局部关节屈曲，不独立世界游离。刚性炮组继承P的位置和挂点旋转，不继承body squash/stretch尺度；双管同组。BURST四孔等径规则2×2共面，升级真实5发也不增加第5孔。

LEFT在R镜像整个rig、所有脸/脚/器官/P/M，再在镜像P残余瞄准；RIGHT默认rig；UP采用每身份已批构造参考修孔平面投影、双管遮挡、前后层。整rig镜像不能替代任意360度正确投影。按目标方向连续采样，实查侧向切换、上向、对角与近身目标；若投影不合理，按原画构造补方向部件而不是转右侧P穿体。

建议纯接口见 contract-proposal.json。绘制返回anchors、bodyBounds用于叠层；不生成弹体、不写游戏实体。元数据与缓存以identity/pose/direction区分，热路径预编译Path2D，避免每帧SVG编码/加载。

## 已核实的运行状态

塔/PLAYER发射使用 lastShoot 清零，当前无可靠持久目标角或独立shot event；仅在render读到lastShoot=0可能漏掉同帧事件。需要集成owner在既有更新后读取变化并维护view-only pose cache，或提供显式表现shot信号；不能为瞄准改变findNearestTarget规则。M仅是表现挂点，实际弹仍从logicalCenter出生。死亡从数组移除，需要view-only短残影保存最后身体快照，结束不延迟结算、产钱或召唤。

enemy的phased、burrowed、fuseTimer、summonTimer、healAura/jamAura/盾读实际状态。MOVE使用实际world位移差，不给静止机关乱加步态。BOMBER引信仅在fuseTimer有效时进入已批姿态；BEACON尝试和成功由集成owner实际事件区分，身体不画3BASIC。SHARD分裂由现有deathSpawn建3SPLINTER，不能把子体做成身体动画。普通能力pose缺事件时保持批准NEUTRAL+实际状态层，不伪造成功。

Boss优先mechanic分支，其次isBoss；twinSun/twinMoon分别解析到TWINS_SUN/TWINS_MOON。其余boss按既有base-id解析，只剥离实际_T[123]，不凭未知form猜替代身份，不能用baseEnemy冒充Boss身份。bossState.actionMode windup/attack/recover分别映射WINDUP/技能身体/已批恢复身体；OPEN状态叠层仅在真实damageTakenMultiplier>1时出现，recover不强制开放。phaseIndex仅取真实现有phase，partnerFallen读现有SOLO；intro效果独立。当前优化入口 runBossOptimizedAbility 优先handler再fallback；spawnHive→NEST，NEST→BASIC，summonSwarm→SHARD，保持真实调用链。

机关INTACT/TRIGGER来自timer/实际触发，BROKEN来自死亡原因，FADE来自view-only残影。SEAL命中冻塔后立即消失、RETICLE触发后生成hazard，二者不能因播放美术而延期伤害。ROOT子根独立三芽；WEB危险圈独立；COURIER背袋/身上薄荷钻属于身体，退款反馈是独立表现，直接读取原cargo结算；不创建可拾取state.drops，也不要求玩家再拾取。

## 验收与风险

生产阶段硬门槛：48身份/375映射完整；48/64/96px静态及运动均可辨身份；所有器官数量和连接不变（合法BROKEN碎裂除外）；face随体；root固定；透明背景无板中文字/基线/整板；循环首尾一致；launcher尺度刚性；BURST四孔；日六瓣、月永久珊瑚下缘、BLOOM六牙无眼、HIVE上1下2巢口。每身份至少neutral/action/soft-deform或对应机关broken的审阅对照。

锚点单位、公共palette、API字段、表现事件与图层归属尚待统一契约；这是开始正式制作的依赖。48身份体量大，统一模板会降低相符度，必须按身份轮廓逐项生产。最小塔logic直径26px与大型身体复杂细节不同，展示大小由联合场景视觉比例验证，不能为凑细节改变radius。建议小尺寸降低纹理而保持轮廓/五官/孔数量；若48px不能看清四孔，用线宽/对比和孔间距微调，保持结构。

高风险方向包括RAIL/SNIPER长颈、BURST斜孔、SENTINEL左向遮挡；高风险Boss包括DRAGON持续尾翅、HIVE三孔、KEEPER空拱、BLOOM闭口六牙、CONDUCTOR各手三指；破碎仅用于合法机关结构。性能需要真实密集波与相同state/DPR比较帧耗时，由QA测量；r01无实机性能、游戏接入或生产视觉通过声明。

正式实施前主审只需确认合同和文件归属；本包没有额外面向用户的许可问题。当前不修改src/public/package、无Git操作，提交后停止等待后续授权。
