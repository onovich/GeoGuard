# UI r02 电脑端生产规格（submitted）

2026-10-02，Asia/Shanghai。原画设计阶段，待主审正式批准。本包三张桌面板；不修改r01、不制作手机、不改游戏代码或接入资源。desktop-usability-review.md的高密度真实战斗由master独立负责，本包不能代替最终联合检查。

## 权威与实际选稿

整体风格继承已批master r02和UI r01。最终背景来源为已批background r02 BG01/BG02，审批reviews/background-r02.md，UI里的地面仅上下文。身体来源由已批friendly r03复用合同与bosses-mechanics canonical板控制，图板缩略图不覆盖身体源；9塔详见tower-icon-sources.json。

|最终文件|选中调用|内容|
|---|---|---|
|dui01-nine-towers-scroll.png|DUI01-edit8|A左端六全卡＋第七露边，B右端到哨戒塔，C完整九塔外部展开源条，D较小电脑窗口五全卡＋下一露边|
|dui02-mouse-states.png|DUI02-edit4|五个完整桌面鼠标快照＋外部语义图例；全五格Boss完整；攻击/恢复与危盘对应；B ghost进入危盘；C实体塔重叠；D低资金；E整栏取消|
|dui03-boss-rewards.png|DUI03-edit1|紧凑单成员/双成员/小窗长对策；实际1/2/3奖励，长蓝图文字重排；无森林/技能条/锁槽，PLAYER恢复canonical|

根目录最终DUI02曾在制作中保留edit2候选，主审异步预览曾读到该旧版。已替换为edit4，generation-record记录最终复制与原生图输出逐文件SHA相同，不能把候选edit1/edit2当最终。预检意见为历史过程，未自标accepted。

## 桌面锚点、密度、溢出

1440×900标准与960×720较小窗口均为逻辑目标，图板框是构成示意，不能量PNG反推比例或像素坐标。较小窗口同属电脑端，不切手机布局、不缩成九个微图标。

HP左上，wave/time顶中，money/pause右上，顶边16px目标。Boss紧随顶中，屏幕锚定，目标最大宽680、内边距8–10、头像32；单成员主体约92px高、双成员约108、小窗长对策约124。顶部含HUD目标底边≤180px；长字超过目标则自动增加高度/换行，不能为守住高度丢字段。小窗Boss宽≤calc(100vw−32px)，成员行允许名字/阶段/动作换行，每个HP仍单独。像素高度尚未测量或实现。

底栏沿现有min(92vw,920px)、bottom24、水平中心；每卡140×约148、gap8、容器padding8目标，主要身份/费用先读，次级等级/类别/间隔后读。标准栏约六完整卡＋第七露边，小窗约五完整卡＋下一露边；结束位置保留前卡露边及末卡完整。图板C为外部九卡审阅展开，不是另一条游戏栏或九卡全塞屏幕的实现要求。底部滚动条独立占可读带约12px，不用装饰遮挡滑块。左右fade仅无事件的提示。

原生水平scrollbar滑块可鼠标拖动，clip/fade/滑块先让人发现还有卡；原生横向scroll输入依设备/浏览器。源码没有onWheel垂直转横向处理；不得宣称竖滚轮、Shift+滚轮或空白拖栏由游戏保证。不新增左右翻页按钮、分页编号或锁定商店。

## 卡片字段与九塔

卡片primary深棕名称≥16、费用≥18，mint菱形；次级Lv/类别/间隔≥12，保留间隔的完整秒数。name动态折行，长名称最多两行的目标高度需预留，不删字/不逐卡缩字。实际九个中文名称都是三字，不虚构第五字长塔名；hover中的真实summary长文本与奖励的真实长title另行验证。level存储0..3，显示Lv.(level+1)/4，level>0外置UP+level。

|ID／名称|Lv|费用|类别／间隔（秒）|
|---|---:|---:|---|
|BASIC 速射塔|2|20|单体／0.28|
|CANNON 榴弹炮|1|40|范围／1.5|
|SNIPER 穿透塔|3|140|穿透／1.73|
|RAPID 链锯塔|1|28|单体／0.12|
|MORTAR 迫击塔|2|95|范围／2.14|
|FROST 霜冻塔|1|55|减速／0.85|
|RAIL 磁轨塔|1|98|穿透／1.65|
|BURST 散射塔|2|87|散射／0.88|
|SENTINEL 哨戒塔|4|120|单体／0.44|

示意money60，不足SNIPER/MORTAR/RAIL/BURST/SENTINEL，文字费用不整体降透明；边框/标签提示不足但卡仍可左键起拖。真实TOWER_ORDER先后不变，available过滤，sortOrder排序，不是九张开局卡。rule-evidence.json直接调用现有纯规则记录数值，未模拟实际整局历程。

## 鼠标快照与层级

BuildBar已有title内容为summary、伤害、间隔、射程。DUI02 A显示BASIC已升级Lv2对应伤害7/间隔0.28/射程194；tooltip位于底栏上沿，鼠标在卡上、无ghost/range。该浮层是已有内容的美术锚点目标，源码当前原生title位置/延时仍由浏览器控制。目标浮层最大宽360、正文≥14、内距10、与栏间8，靠屏幕边缘向内翻转；不把有控制的详情面板塞进玩家战区。没有新的hover能力或点击详情页。

左键mousedown即可beginTowerDrag；低资金不会在入口disabled。指针箭头、抓取态、selected卡沿相同ID联动。拖中world ghost半透明、射程细sage虚线和低填充，危盘coral边界＋更明显浅填充；状态需check/X/!及深字，不能只靠颜色。示意章为反馈设计，不是按钮；现行失败文案是在release产生floating text，不能声称代码已有持续状态章。

五格是互斥时序快照，不在一局同时叠五个ghost。A/E没有危盘，HIVE action=恢复·输出窗口；B/C/D有存活NEST hivePulse盘，action=攻击·避开危险区。每格都有Boss名称/HP/孵潮P2/3/action/完整counterplay。B ghost位于危盘填充内，与NEST/HIVE等实体身体分离，射程与危盘交叠；危险区未参与placement资格，不能等同禁建。C ghost与现有塔重叠所以位置无效；D money8低于成本20优先资金不足；E鼠标释放在整栏buildBarRect外扩18px范围内取消，先取消再资格评估，不扣费。

放置release重新评估资金/实体距离，只有place-tower扣费并createPlacedTower，位置无效/资金不足拒绝后清拖。暂停/奖励也清拖。cancel区域是整栏，不是塔卡自身矩形。世界盘的owner/center/radius、ghost射程圆、逻辑与root转换从runtime读取；概念图不作为精确圆半径/碰撞或中心挂点来源。screen HUD/tooltip/bar遮住world圆弧允许，但不可让圆成为椭圆。优先PLAYER/紧迫危边界，再ghost与状态，再hover/一般信息；UI仍需最终密集复合验证。

## 紧凑Boss与真实成员

group.title/counterplay共享一次；每个member独立name/hpRatio/phase/P(min(count,index+1))/count/action。双子曜子灼线P2/3与蚀子锁域P2/3均保留，不合并血条、不做tab或折叠。完整对策“选择先击破日或月；幸存者会使用不同的独奏招式。”两行。单HIVE对策完整“优先拆掉孵化巢，阻止生产并取消巢的爆发攻击。”，不把三类threat新增为菜单。

幸存者另时刻仅显示存活member，保留phase并附ENRAGED；guardCount>0才追加护卫，exposed强调真实动作。DUI03未额外画第三成员或与两存活状态同屏的幸存者，条件规则由本段控制。肖像外置等级/HP/字不随body镜像；moon永久coral边，sun六瓣；PLAYER无脸无四肢单叶。

## 奖励少重复、少项、长文

choices是真实0..3数组；本轮实际纯规则输入证明1/2/3，不补空槽、不虚构四项。wave34全9塔解锁满级且money80，满HP100只fallback物资302；HP50/100时修复50＋物资302。wave32仅FROST未解锁、BASIC Lv1、其余Lv4，money20满HP100：解锁FROST补55、物资360、升级BASIC补5。每波有Boss，晚期例值满足累积奖励数量的基本边界；不宣称整局轨迹/随机权重或实际运行快照已测试。

modal中心屏幕，max-width约768，padding24，grid gap12；1项居中一张、2项并排、3项等宽，卡min约220、同屏关键detail不能省略。较小电脑960×720内仍三列约224宽；标题允许两行、完整detail自然折行、CTA底对齐。更矮窗口modal纵向overflow-y，整体my-auto，不能把末行放屏幕外不可达。

标题Boss已击破、副标题“选择一项强化，下一波即将开始。”仅modal共享一次；每卡显示type徽、title、效果、必要detail、一次CTA，整卡click选定，CTA只同一操作而非二次确认。物资直给金额不重复“物资补给”段落；修复明确玩家生命，不能修塔。unlock保留加入建造栏＋试建补贴和summary/费用/伤害/射程/间隔/减速。upgrade把detail重排为：Lv1→2；“仅强化后续建造，已有塔保持原等级。”一次；补贴5·造价15→20；伤害7·射程194；间隔0.28秒，删除源detail重复造价20但没有删效果。

蓝图update catalog、不改已有state.towers；未来createPlacedTower复制当时目录stats。图上没有全场升阶箭头或收费升级；选择后普通模式下一波，无刷新/跳过/确认/购入收费。body图标用蓝图纸、心、mint菱形等已批UI符号，不能画成新的玩家技能。

## 字色、拆层、验证边界

奶油#FFF9EF、深棕字/线#4B281C、sage#B6D4AE、coral#F4ADA0、honey#F8DDAA、mint资源#A8D8BC深绿边、奖励blue#C7E4F4。色码按本段，不复制生成印字；所有浅面深字。正文≥14、费用≥16、辅助≥12、动作≥14、对比≥4.5是目标，未量逻辑字体或最终半透明合成对比。实际PNG尺寸记录仅raster元数据。

world地面/阴影/实体/危盘/弹体沿旧效果与BG规范；world-linked HP/等级独立；screen顶栏/Boss/提示/建造栏；screen modal奖励。技术root线/影子/徽记不从身体源裁成身体，透明图标、分层源稿、图集/动画/实机/性能均未提供。图板文字必须动态排字，不能裁取生成字形当运行UI。

已实际查看全部15个本轮来源图片与16次成功生成结果。候选是审计历史，最终仅三板，第一次9引用调用被工具参数上限拒绝、没有图片。文件、prompt、复制SHA校验不是自审批；仍需主审逐图批准及后续联合高密度快照。封包原子READY后停止，返修另开revision。
