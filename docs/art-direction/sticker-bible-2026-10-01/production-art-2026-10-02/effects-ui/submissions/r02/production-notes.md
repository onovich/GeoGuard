# r02 独立效果与玩家UI设计来源

本轮主审已明确授权完整展开，r01两板accepted并保留。r02七张新板全部submitted／待主审实际查看；“最终来源”指本轮送审选稿，不等于accepted、透明图集、矢量源稿、动画、接入资源或实机截图。图片、数字锚点、触控尺寸与几何都是设计示意，连续帧与真实像素另验。

## 板格与复用

|板|具体格|范围|
|---|---|---|
|B01|P01–P10|PLAYER＋九塔各独立弹体/flash；只有basic/cannon/sniper三运动kind；轻量形状/颜色身份差异|
|B02|S01–S16|盾、慢、冻、干扰、护甲、隐相、出土、受击mask、OPEN、狂暴、独立影子、等级、地面、HP、阶段环、链接|
|B03|H01–H04 × WARNING/RESOLVE/FADE|圆盘、直线、装饰环圆盘、逐线网格；真实width/radius外边界与结算后装饰|
|B04|M01–M12|WEB/ROOT地形、成功召唤/分裂、节点破碎、目标/父根连线、COURIER即时退款、真正state.drops、波/死亡粒子/专题装饰|
|B05|U01/U02|真实开始与结束OverlayScreen|
|B06|U03/U04/U05|三奖励卡、紧急修复替代卡、后续新建蓝图规则；普通玩家无升级/降级菜单|
|B07|U06–U11|暂停、title状态条、桌面/移动操作提示、放置与建造卡状态；不新增声音、出售或能力入口|
|R01保留|HUD及basic/cannon/sniper三个命中行|主审已实际查看通过，不重复生成|

57个可寻址来源格＝42效果格＋11UI格＋4保留格。B04/M12内部四款装饰作为同一家族的variant，B03三时序列共用同一真实几何。index.html可看板、检索95技能和格来源；JSON是精确映射权威，不靠聊天消息交付。

## 三组输入与来源约束

当前只读最终通过的friendly r03、enemies r02、bosses-mechanics r03 production-split；source和书面review SHA记录在upstream-dependencies.json。完整effects/muzzleAnchors、enemy.effectRequirements/action effects、Boss effect/summon/mechanic/logicalMotion请求、最终身体引用与固定root保存于production-split.json。r01运行源码证据和已过HIT/HUD仅作保留来源，不作为当前身体方向权威。所有已批准上游坐标仍标proposed，不能把整板画面十字当测得的本地枪口像素。

所有375参考条目都只增加外部效果归属，身体和器官母版仍由各身体组负责。本组106我方动作、77敌人动作、192Boss/机关动作的映射没有把原画或身体重新标为生产就绪。95技能＝93标准技能＋2幸存技能；基础五个支持技能与无handler的tailSweep保留为非默认来源。

### 挂点与弹体

P是projectile中心，M是flash左后根挂点，+X是本地方向。PLAYER没有炮管，不从M图增器官；其upstream.muzzleAnchors为空，发射表现原点需后续明确实现。RAPID/RAIL双M与BURST四M读取friendly proposed口面坐标；不从孔数创造攻击次数。BURST内部level0/1/2/3的实际弹数4/4/4/5，显示Lv1/2/3/4，结构仍2×2四孔。

当前弹体出生于owner.x/y逻辑中心，flash位置只是衔接演出，不迁移出生点。MORTAR仍现有直线运动的cannon，不从圆籽形状新增抛物线、落点或爆炸阶段。来源外观ID仍需后续接入，现有kind不足以区分全部来源。速度、寿命、半径、伤害、穿透、splash、slow、spread只读实际值。

方向严格服从friendly r03：LEFT先在固定root镜像整个局部rig（身体、五官、脚、部件、刚性launcher和P/M），再在镜像P做残余瞄准；RIGHT沿默认rig；UP按每身份已批投影/孔平面/遮挡来源，BURST仅v4。不能从旧r01“360deg”说明推导完整透视或直接绕右侧P转180；SENTINEL旧图方向简写被r03合同覆盖。PLAYER只身体/单叶镜像，无炮架；等级点徽和文字不镜像。JSON每条我方动作保留当前direction reuse和最终body/root来源。

### 危区生命周期

H01圆盘面积全部有判定；H03内部环是装饰，不能暗示安全空心环。H02由真实两端点与width控制，combatRules取中心线距离≤width+target.radius，因此全带约2×width；角色radius另参与判定。H04实际可能平行、斜交或不同方向，每条线按真实端点绘制，图中的十字不强制改成正交或加危险方盒。

timer>0为WARNING；timer<=0由updateHazardRuntime结算；line删掉后终点波淡出，area删掉或按pulseInterval/radiusStep进入下一轮。RESOLVE是逻辑结算瞬间，不是持续伤害动画窗口；FADE只来自实际transient，不能拖延伤害/追加脉冲。area警告时间仍可能根据玩家逃离距离增加。所有格的生活期与每95技能lifecycleByCell明确列出。

### 独立机关与生成

HIVE实际spawnHive=NEST，NEST计时才生BASIC；summonSwarm仍SHARD。旧BEACON基础技能不替代当前NEST来源。WEB/ROOT是独立HP机关，地形M01/M02由ownerMechanicUid维持；ROOT子根仍独立实体。SEAL/RETICLE节点M06与目标塔覆盖分开，击破节点可阻止延迟触发；RETICLE触发后的真实area另行WARNING→RESOLVE→FADE。

BEACON现有M10波在召唤timer尝试时生成，预算为零也可出现；M03额外成功闪只绑定真实子实体UID。这两类语义不能混淆。分裂M04与真正SPLINTER身体分离，consumed时不生成子体或掉落。

M05为独立通用破碎粒子参考，不替代SEAL双爪/RETICLE三弧等精确身体破碎拓扑；身体组仍制作器官守恒与破碎例外。M12所有专题波是纯装饰，spider仅支持来源／renderer复用，不宣称当前optimized webField仍生成旧蜘蛛终结波。

COURIER击破且未逃走时即时money+=cargo（M08），不能生成可拾资源或二次发钱。M09只代表真实state.drops，正常Boss赏金和COURIER退款都不走这个拾取资产。图中+12只是金额示例，取实际cargo。

stealMoney/repossess施法阶段仅真实HUD减钱与既有“击破追回 cargo”提示；不能播M08正数退款。该格映射表示后续COURIER真实击破退款事件，逐技能moneyFeedbackBinding明确区分。WEB/ROOT地形附带真实disk参数、十次pulse和owner停止条件，RETICLE只节点存活到timer时才排radius32的延迟圆区；它不复用已被覆盖的mark线。

### 状态与界面

OPEN只对damageTakenMultiplier>1的全身状态加S09，无腹核独立弱点。护盾、受击mask、冻结、等级和影子均外置，不能替换或增长器官。S15阶段环可提案复用为sage治疗资格环／fuse资格提示，依真实字段持续，不创建hazard，不让光环控制治疗结算。phase alpha mask不创造独立PHASE孩子。

B05文案取UI_COPY；结束8波/1分24秒只是例值。B06解锁霜冻塔55试建资金取当前基础数据；速射塔蓝图1→2仅未来新建，基础示例强化造价15→20、补贴5、伤害7、射程194、间隔0.28秒。真实接入仍消费choice.detail的动态造价/属性/补贴，不把示例固定为实际平衡。U04紧急修复替代某一奖励卡，不是同时第四选项。TowerContextMenu升级/降级只在debug开放，未做普通玩家收费上下文。

B07放置仅沿用canPlace/range和真实错误消息，资金不足卡当前60%opacity并不单凭灰态决定逻辑可放。U07只title/tone；U09是临时按下位置，不新增常驻摇杆。当前玩家声音控件未渲染，明确留待后续提案，未包装为已有入口。开发测试UI保持低优先，不做玩家产品原画。

主审已实际看图并在聊天中通过B01–B05的构成/边界，正式整包仍待验收。B05白字浅绿按钮由ui-color-type-spec.md覆盖：浅底使用深棕#4B281C，CTA至少16px、正文14px、辅助标签12px。B06/B07同遵守；图中的尺寸标注和数值不构成真实布局、对比或设备测试通过。

后续导出需可编辑分层、透明alpha、源画布/root/collisionCenter、真实数值挂点、轴线、frames/timing、atlas offset、owner cleanup、小尺寸预览等；本revision只设计与来源映射，无此类实现承诺。提交后等待主审，按明确返修指令另建revision。
