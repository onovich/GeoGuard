# Master r04 · submitted
2026-10-02。两张纯桌面完整复合，手机暂缓。正式批准由主审review给出，本文件不是自行批准。

## 最终采用
- A：master-desktop-density-r04.png，WAVE31普通清场阶段。实际19敌（BASIC12/TANK7），10塔（BASIC6/BURST4），PLAYER1，资源4，分离弹体26（sage基本球9、BURST双色椭圆16、PLAYER蜂蜜1）。没有Boss/敌方危盘。悬停穿透塔，首段6完整卡+磁轨塔露边。
- B：master-desktop-twins-r04.png，WAVE27双子。8座实塔（BASIC5/BURST2/SENTINEL1），另有1个SENTINEL拖建幽灵，不计入实塔。无普通怪、无资源掉落；可辨弹体15（BURST9、BASIC4、SENTINEL1、PLAYER1）。曜子准备，蚀子攻击，仅1个lunarSnare平面圆盘。末段6完整卡+前卡露边，资金18不足以建造69元哨戒塔。

## 合法来源与变化
主审明确允许收敛场内身份，不要求九塔/六怪都在世界内，也允许按真实画面更新原22敌/13塔/23弹计划。九塔目录顺序及动态费用等级保持准备合同。
源函数实调验证BEACON：5.5秒触发3个BASIC，ownerBossUid为null；settleEnemyDefeatRuntime移除BEACON后3个BASIC仍在；再结算其中1个死亡，剩2个。故A=波31队列10个BASIC+历史召唤幸存2个；TANK7≤队列8。其余特殊怪可已死亡/视口外，不凭空增加elite词条或Boss同屏。
A十塔和B八塔逐个以PNG锚点登记在source-derived-states.json。buildTowerAtLevel/createPlacedTower实算BASIC level0/1/2的maxHp为50/58/67。A受伤示例27/67、38/58、38/58；B受伤为37/67、32/58、SENTINEL69/125。被替换的CANNON51/93及SNIPER/FROST旧HP不能再套用。
单次BURST level0仍是4发；飞行中的可见弹数不是整齐同步首轮射击。A多出的基本球可来自前一轮仍存活的弹；B左BURST的5个弹含先前轮次幸存弹，另一个BASIC没有可见弹。只确认来源与寿命规则允许，不声称完整飞行轨迹模拟。

## UI/BG采用
UI r02的三板与BG r02的两板均已逐张实际查看，正式review已通过。UI30项/BG10项SHA核验通过。采用140px卡、8px间距、min(92vw,920px)栏宽目标，原176px准备提案废止。原生水平滑块首/末位置与露边可见；PNG只作概念示意，不把绘图比例冒称运行时量测。
HP62/100、资金18、九塔目录费用/等级/间隔来自源合同；时间18:42/16:20为画面示意。所有卡不足仍可起拖。hover与持续不足标签沿批准UI设计表达现有信息，不声称当前代码已有这些控件。
BG是低对比不规则浅斑和稀疏草，已移除早期错误石块、灌木、碎石道路。资源像素偏cyan；正式色以UI mint #A8D8BC及深绿边合同为准，按主审指示不为配色继续重绘。

## 逐图查看与预检
每次生成均调用view_image实际查看，生成记录含所有原路径/提示词/采用关系。主审已对A exec-0e6daa81和B exec-2dccf2db作整体预检通过，并只要求清B右中单管塔腹斑。最终B exec-e7aece1c定向清除此斑，复看确认两个世界BURST及底栏BURST腹斑保留。
A有四孔BURST、四枚分离扇弹、单叶无脸PLAYER、受伤条/等级、hover。B有独立成员信息、共同组名与对策、六瓣太阳/月永久珊瑚弧、完整月盘边界、安全PLAYER和独立资金不足幽灵。
敌方月盘边界完整，未被建造栏/提示覆盖。SENTINEL幽灵射程右边被视口裁剪；不宣称全部射程边界完整通过。

## 限制
这是原画PNG，不是游戏接入或像素级组件实现。身体微小细节、颜色、HP填充与140/8/920精确几何以canonical与数据合同作为生产约束。未运行游戏、未验证实机鼠标/性能/可达经济或完整战斗轨迹。没有修改src、其他组、旧r01/r02/r03、Git或部署。除数据/尺寸限制外没有主动扩展的修改项；待主审正式验收。

