# 最终复合准备（只读来源阶段，未授权生图）
2026-10-02。master r02已批，继续作为普通桌面母稿；background r01已批，UI仍待主审。这里只整理requirements/source，不创建r03、packet或更新READY，不生图，不改游戏或其它组文件。

## 两幅候选及批准门
|候选|真实状态|目标|
|---|---|---|
|手机HIVE整体|WAVE23 / HIVE_T3 / 孵潮 P2/3 / hivePulse / action=attack|390×844逻辑布局；继承待批准UI01手机精细布局；1 HIVE、1存活NEST、少量巢召BASIC、PLAYER与BASIC/CANNON/BURST；真实圆危区。|
|桌面RAIL压力整体|WAVE25 / RAIL_WARLORD_T3 / 歼灭 P3/3 / suppressiveGrid / action=attack|1440×900逻辑布局；1 RAIL Boss、6–8座已有BASIC/CANNON/BURST塔、PLAYER和独立我方弹体，前两塔中心各一组十字线，共4有限线带；没有普通敌军或额外Boss。|

正式生成还需主审批准UI并明确授权两幅图进入r03。先核获批UI的READY、packet和review并view实际最终图，不把当前未封版文字或candidate图当批准来源。每次imagegen最多5张输入：优先精细UI、BG01、对应Boss/身体权威与已批母稿；任何不能直接装入的已阅参考用明确结构约束及后续校验，而非虚构角色。

## 手机HIVE状态
createWaveDefinition(23)+enrichBossTemplate只读推导：HIVE_T3最大HP1541；可选当前HP925（约60%），符合孵潮阶段0.35<ratio≤0.75。数值是可成立的设计例值，不是捕获实机；图中Boss只画现有hpRatio条，不新增数值HP功能。
文字：WAVE 23；蜂巢建筑师；孵潮 · P2/3；攻击 · 避开危险区；优先拆掉孵化巢，阻止生产并取消巢的爆发攻击。
必须采用attack而非母稿的恢复：bossCombatRuntime在owned非terrain危区仍存活时保持attack；危区生成前windup属于另一时刻。r02作为风格母稿不改写，但新快照严格按时序。
optimized hivePulse对每个存活NEST创建center=node.x/y、radius80、damage8、base delay1的实心圆盘（最终warning duration由createAreaHazard计算）。选一个存活巢，另一个已被拆除是合法状态；如果画两个存活巢，此招应给两者各一圆盘，不能只给一处。普通敌只选NEST实际召的BASIC（spawnAround BASIC×3，maxActive12，个体可已被击破），不画FAST、HIVE身体内孩子或无来源红弹。
BASIC塔双顶芽、后瓣分离；BURST四孔2×2、四枚示例弹；CANNON无额外嘴/腹斑；PLAYER一叶无脸；HIVE三孔五底瓣；NEST三瓣两齿一舌两脚。root/逻辑中心固定转换不改，不量PNG当源挂点。
手机UI：两行顶栏，长counterplay换行，约124逻辑px起塔卡宽并横滚，两完整卡＋第三卡露边；提示可关闭且移动端有真实倒计时；不加常驻摇杆。未按空白地面时不画触点；若后续选择active按下状态，触点只能由真实start/current表达，不能永驻。最终精细布局以UI获批板为准。
中央PLAYER及圆危区边界须在HUD/底栏之间可读；不是把桌面整图压窄。BG01稀疏纹样用纵向世界窗口，四边无围框，无道路，草痕弱于影子。

## 桌面RAIL状态与密度
createWaveDefinition(25)+enrichBossTemplate推导：RAIL_WARLORD_T3最大HP1581；可选HP553（约35%），符合歼灭ratio≤0.4。HUD条约35%；不新增Boss数字HP功能。
文字：WAVE 25；磁轨督军；歼灭 · P3/3；攻击 · 避开危险区；靠近诱导锁线再侧移；击破磁轨锁标可阻止对塔狙击。
现行RAIL没有召唤普通怪的技能。progressionRules要求enemyCount===0才出Boss；wave25列出的BASIC/TANK/SHARD/SIEGE/JAMMER是前置清场队列，不能与Boss混作此快照。密度由6–8座我方塔、稀疏资源掉落、独立弹体和4线带建立，不用敌潮或HIVE/NEST凑数。
RAIL身体仅已批pair-03第二行：2 rails、1中央孔、2背鳍、2脚、1尾、单眼；采用右向原rig置左半部对场内发射，可避免临时发明镜像结构。尖长外形依原板不改成机器枪或三炮口。使用ATTACK格时仍没有烘焙光束。
推荐快照是suppressiveGrid创建后、最早一条到期前的attack时刻：state.towers前两座活塔分别为anchor，每个anchor生成水平/垂直两条360长有限线带，width9即全宽18；warning delay依次0.68、0.76、0.76、0.84。同一招的4条可同时存在。可让玩家已侧移到安全空隙，保留可走区域。四条线是真正独立十字交叠，不能填成整矩形或画道路。图形颜色沿已批效果角色语义，虚/实边加浅填，不只凭颜色。
已有塔可显示受伤HP和外置等级徽，但数量/显示必须对应实际tower状态；建造栏按可用catalog，不给每个已放塔额外卡。造型密度上升时仍保持所有孔、芽、脚及PLAYER完整辨认。画面不做满屏爆炸或整片暗遮罩。

## RAIL完整几何清单（只选一个合法时刻，不拼技能）
|能力/入口|现行生效几何|快照限制|
|---|---|---|
|railShot → fallback|Boss向lockedTarget方向，默认length620，width14，全宽28，delay0.65|target不是必定终点，createLineHazard按length算x2/y2。|
|crosshairBarrage → fallback|锁定玩家点水平520长、垂直440长，width10，全宽20，delay0.7/0.82|P1/P2可用；P3列表不含该招。|
|suppressiveGrid → fallback|前两座塔各2条360长，width9，全宽18|P2/P3可用，本次推荐。|
|overload → fallback|Boss到锁定玩家方向默认620长，width20，全宽40，delay0.45；自身扣血至至少1|P3；不把自扣血画成新部位。|
|killLane → fallback|Boss侧偏起点±32.4，向锁定玩家各720长，width14，全宽28，delay0.75|P3；两线同招可共存，不加grid。|
|markTower → optimized|先在Boss与最近存活塔的中点生成独立RETICLE（HP16/limit2）|旧fallback直连mark线不生效，不能画作该招。|
|RETICLE timer到期 → mechanic runtime|目标塔中心circle radius32、damage22、base delay0.8；RETICLE.hp=0|圆盘出现时锁标身体已死亡，不画完好锁标＋已触发圆盘共存。|

bossCombatRuntime.hasLiveAttack同时检测owner非terrain危区与RETICLE；未结束前不选下一招。因此单RAIL场景不能任意叠加grid线＋mark圆。推荐压力板只用同招4线；圆几何在手机HIVE已覆盖。如果主审希望RAIL也展示area，应改选单独mark圆时刻或明确另一个时刻的分栏，不能伪装同一真实快照。本轮仅两幅完整图，不自行增加第三图/分栏。
isLineHazardHit将目标投影clamp至两端有限segment，width为半宽，另加target.radius；边缘圆帽。area是disk，不画空心安全中心。生成尺寸只传达视觉，不宣称像素判定正确。

## 背景与UI引用边界
BG01是干净地面；BG02是分层/世界延展规范，其中框、箭头、编号、文字不能进入最终背景。同局部稀疏密度在世界四向连续，不用“屏幕四周草圈”装饰。图片不是可重复无缝tile。
world层基底/地面标记/影子/危区/身体/独立弹体/实体标签与screen层HUD/提示/建造栏分开。当前runtime绘制顺序差异仍存在，原画不宣称已解决遮挡。
真实UI字色#4B281C、动态例值和手机安全区原则沿已批合同；具体获批UI来源尚缺，pending-ui.json式候选不可发布。当前未读取任何未完成UI候选图片。
生成后仍逐图view与主审；最终packet只在r03授权并生成后建立，不改r01/r02或当前READY。

