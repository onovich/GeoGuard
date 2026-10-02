# 电脑端 r04 整体重组准备 · submitted for planning review
2026-10-02。只读源码、只写 master/preparation。UI r02/BG r02尚未收到正式通过及主审生图授权；本阶段不生图，不创建 submissions/r04，不改READY或既有封包。手机暂缓。最多两幅完整电脑端原画，不做多状态拼贴。

## 结论与真实语义
src没有elite类型、标志或精英刷怪规则。“精英压力”按主审认可的真实特殊敌人语义处理：TANK/攻城SIEGE/SHIELD/BOMBER/BEACON，不新增词条、头冠或精英光圈。普通怪清空后才出Boss；怪群图和双成员Boss图分开。
只读调用 createWaveDefinition、实际奖励offer、upgrade/buildTower、实际单次射击函数、TWINS创建/HUD、lunarSnare和createAreaHazard得到 desktop-r04-source-states.json。未启动游戏；不是完整轨迹、经济可达性或实机验证。推导坐标仅用来验证目标在射程内，最终构图自由重排但仍需维持合理射程，禁止直接把测试圆阵画成固定路径/防线。

## A：标准桌面怪群＋特殊敌人／悬停说明
目标逻辑1440×900，WAVE31普通敌清场阶段，BLOOD_FORGE_T3尚未出现，不画Boss头像或血条。
- 该波真实总队列：BASIC10、TANK8、BOMBER8、SIEGE7、SHIELD5、BEACON4；spawnInterval 0.35秒。
- 可见22敌：BASIC8、TANK3、BOMBER3、SIEGE3、SHIELD3、BEACON2，均不超过波次队列；其余可尚在视口外/已被击破。BEACON可召BASIC，但本计数不需要额外召唤解释。
- 13座现存塔：BASIC2、CANNON1、SNIPER1、RAPID2、MORTAR1、FROST1、RAIL1、BURST3、SENTINEL1。旧BASIC与三BURST为level0，另一个BASIC/RAPID为level2，其余按JSON；升级目录不改写已放旧塔。
- 受伤示例：BASIC uid101 HP27/67、CANNON uid102 HP60/93、SENTINEL uid112 HP81/125。world HP条放根部下方，独立于body；升级标记为真实+2/+1，level0不虚构升级。底栏Lv显示level+1，不能混同世界+level。
- 独立弹体目标23：单次真实射击函数产生塔弹22＋PLAYER1。三座旧BURST各4枚=12，其他10塔各1枚，PLAYER1。source kind为basic19/sniper2/cannon2，视觉沿B01各身份映射；RAIL/RAPID仍每次单发，不按双孔加倍。23是可信同刻发射数量证据，正式图应画短时间已出膛且未命中的独立弹体，不宣称已完整模拟轨迹/存活时长。
- PLAYER HP62/100、单叶无脸；资金18，九塔已解锁。当前目录最便宜BASIC26，故九卡均不足；仍可左键起拖。资源掉落建议4个，菱形独立于弹体。
- 鼠标悬停SNIPER卡，说明只呈现现有summary/伤害/间隔/射程字段；说明位置沿UI r02，避开PLAYER、最迫近BOMBER和受伤塔。只选悬停一个时刻，不同时画拖起/落地/取消。
- 此图state.hazards为空。BOMBER接触后fuse0.8再直接damageArea且自身hp0，不借用Boss虚线圆做爆破预警；选普通接近/接触前身体即可。SHIELD防护环不是伤害盘；友方溅射/命中波也不是敌方危区；普通敌无来源红弹不得添加。

## B：较小窗口双成员Boss／低资金拖建
目标逻辑1280×720，WAVE27 TWINS_T3。普通队列已清空；两成员均存活，无普通敌与召唤物。
- 曜子 TWIN_SOL：493/836约59%，灼线 P2/3，idle；蚀子 TWIN_LUNA：540/982约55%，锁域 P2/3，attack。完整HUD具体文案取JSON buildBossHudRuntime结果；只画比例，不新增数值BossHP功能。独立成员行动不能复制成相同状态。
- 月成员单次lunarSnare，radius92、damage10、slowRatio0.38、slowDuration2.9、base delay0.7。圆心锁定旧PLAYER点(-100,40)，当前PLAYER(25,-45)已在radius+playerRadius外；这仅说明合法空间关系，不是画稿挂点。单个平面实心命中圆盘，警告虚线/浅填充；无第二招的线或圆。
- 同encounter的hasLiveAttack让日成员等待；不得画日方windup、solarDash、flareLance、crossfire或新的月方招式。两者存活时不画partnerFallen、soloSolarVolley/soloLunarOrbit。真正twinCrossfire可同招产生双方线，但不是本次选择。
- 8座塔：BASIC2、CANNON1、SNIPER1、FROST1、BURST2、SENTINEL1；world levels/受伤HP见JSON。射击数量示例14塔弹＋1PLAYER=15，两个BURST各4，其余单发。对应身体不得按升阶新增炮孔。
- 九塔已解锁、资金18、HP62；底栏滚至右段，保证RAIL/BURST/SENTINEL能被发现和到达，展示左侧余卡提示。
- 当前从SENTINEL69卡起拖：鼠标在空地；真实evaluateTowerPlacement因资金不足返回canPlace=false，幽灵塔/射程/不足文字按获批UI规范，同屏有真正月圆危区。不足不等于禁止起拖，当前图不能同时显示有效绿色放置。松手于栏内取消优先于不足判定，文字/说明记录即可，不用在一张图造多个鼠标。
- 双成员面板保留各自姓名/HP/阶段/动作和共同长对策“选择先击破日或月；幸存者会使用不同的独奏招式。”收紧空白，不把成员合并成一个头像/血条。

## 全解锁与等级例值证据
JSON记录第1–30次真实offer中的可选取序列，第26次已全九塔available，第30次同样。奖励时HP50/money10是示例输入，用于证明选项合法，不证明完整经济流程。两图是独立时刻，B为较早波次，不是A之后继续27。
目录顺序严格BASIC/CANNON/SNIPER/RAPID/MORTAR/FROST/RAIL/BURST/SENTINEL。对应显示等级、费用、间隔：
|身份|显示等级|费用|间隔秒|
|---|---:|---:|---:|
|速射塔|3/4|26|0.26|
|榴弹炮|2/4|53|1.4|
|穿透塔|2/4|106|1.86|
|链锯塔|3/4|49|0.1|
|迫击塔|1/4|72|2.3|
|霜冻塔|2/4|73|0.79|
|磁轨塔|1/4|98|1.65|
|散射塔|2/4|87|0.88|
|哨戒塔|2/4|69|0.51|
当前真实塔名皆3字，不为“长名”测试发明新塔名；英文/长文压力由UI组件板与现有说明承接，最终采用获批长文排版。

## 布局验收要求与依赖
1. PLAYER在1秒视觉扫视中可定位（人工审图目标），周围至少留约1–1.5个身体宽的可读空隙；不改真实碰撞radius。最近威胁、危区边界、受伤塔优先于草/影子。
2. A用至少3个松散敌群与塔簇，避免13塔/22敌排成图鉴、等距圆环或堵死所有逃生方向。重复角色可用已批N/SQUASH/STRETCH，器官数量不变。小尺寸BOMBER引信、SHIELD肉盾、TANK拳臂、SIEGE额板、BEACON无眼身份清楚。
3. 23/15个独立弹体以稳定轮廓与形状区分资源、我方身体和地面；保持短尾，不把全部轮廓加粗。不新增自带光束/环来“制造压力”。
4. 九卡是完整可滚动目录，不要求全部挤在同屏。暂拟卡宽≥176逻辑px；1440可6整卡+下一卡，1280可5整卡+下一卡；具体宽、间距、可视数、滚动提示与鼠标可操作途径以UI r02批准为准，冲突时更新准备文档，不能自行硬塞9卡。两图展示滚动首段与末段，正文≥14/费用≥16/辅助≥12为规范目标，非PNG实测。
5. B双成员Boss面板沿UI r02的紧凑水平信息安排；标准/小窗口锚点、断行、overflow不能整图等比缩小处理。鼠标tooltip或不足提示不覆盖PLAYER、危区最近边和塔HP。
6. 幽灵塔、射程、敌方危区必须由虚实/边界/标签/透明度共同区分，不只颜色。A无敌危区不是遗漏；B危区数量严格1。
7. BG r02的非交互纹样低于根部影子，避免规则椭圆、道路、围场和角色式图案。不得从背景图复制注释。
8. 生成前实际view所有选用canonical板、UI r02/BG r02最终图，逐项核sha与review。新板当前仅做来源清单，未声称已在本准备轮全部目检。生成最多5refs时，按图选择关键UI/BG/body板，其余以已查看的器官合同约束并实查。
9. 两图生成后逐张实查身份/孔芽足/方向/HP等级/鼠标层级/完整危险边界；完整提示词、生成尝试与SHA纳入新revision。通过前只标submitted。不得改旧封包、手机稿、src、接入资源或部署。

## 后续门
主审转交获批UI r02/BG r02 → 读取批准与packet并实际看图 → 对齐本两图状态及目录例值 → 主审显式授权后才生成master r04。当前只提交preparation，READY仍r03。

