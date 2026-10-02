# r02 全77条具体来源

格位按实际页面：row1上排/row2下排，column1到4从左向右。最后一张SIEGE在上排、SCOUT在下排（与标题顺序不同）。BASIC/BEACON保留r01正式通过的原地板。所有MOVE显式复用同身份N→SQUASH→STRETCH→N，不生成位移帧。

能力body-only可复用完整同身体+独立效果/实体事件。身体里无目标、子弹、召唤物或效果。这里只提交关键姿态与来源规格；不制作连续资源，不接入代码。

|ID / 动作|具体板与格（行/列/可见标签）|复用与独立事件|独立效果需求|
|---|---|---|---|
|BASIC / NEUTRAL|basic-root-lock.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|BASIC / MOVE|basic-root-lock.png · R1C1 NEUTRAL → basic-root-lock.png · R1C2 SQUASH → basic-root-lock.png · R1C3 STRETCH → basic-root-lock.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|BASIC / SQUASH|basic-root-lock.png · R1C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|BASIC / STRETCH|basic-root-lock.png · R1C3 STRETCH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|BASIC / ATTACK|basic-root-lock.png · R1C1 NEUTRAL|复用r01已过NEUTRAL完整身体+独立contact反馈；不会因缺专属新攻击格而回展旧动作板。伤害仍为持续接触。|enemy.status.common, enemy.contact.feedback|
|FAST / NEUTRAL|01-fast-tank.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|FAST / MOVE|01-fast-tank.png · R1C1 NEUTRAL → 01-fast-tank.png · R1C2 SQUASH → 01-fast-tank.png · R1C3 STRETCH → 01-fast-tank.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|FAST / SQUASH|01-fast-tank.png · R1C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|FAST / STRETCH|01-fast-tank.png · R1C3 STRETCH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|FAST / RUN|01-fast-tank.png · R1C4 RUN / CONTACT|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|FAST / ATTACK|01-fast-tank.png · R1C4 RUN / CONTACT|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.contact.feedback|
|TANK / NEUTRAL|01-fast-tank.png · R2C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|TANK / MOVE|01-fast-tank.png · R2C1 NEUTRAL → 01-fast-tank.png · R2C2 SQUASH → 01-fast-tank.png · R2C3 STRETCH → 01-fast-tank.png · R2C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|TANK / SQUASH|01-fast-tank.png · R2C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|TANK / STRETCH|01-fast-tank.png · R2C3 STRETCH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|TANK / HEAVY_MOVE|01-fast-tank.png · R2C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|TANK / ATTACK|01-fast-tank.png · R2C4 CONTACT|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.contact.feedback|
|SHARD / NEUTRAL|02-shard-splinter.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SHARD / MOVE|02-shard-splinter.png · R1C1 NEUTRAL → 02-shard-splinter.png · R1C2 SQUASH → 02-shard-splinter.png · R1C3 STRETCH → 02-shard-splinter.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SHARD / SQUASH|02-shard-splinter.png · R1C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SHARD / STRETCH|02-shard-splinter.png · R1C3 STRETCH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SHARD / SPLIT_3|02-shard-splinter.png · R1C4 PRE-SPLIT BODY|PRE-SPLIT BODY是完整父体示意，不新增存活分裂能力；死亡时按真实成功生成SPLINTER UID播放独立子体，再由原逻辑移除父体。consumed时无子体。；SPLINTER独立复用02-shard-splinter.png R2C1|enemy.status.common, enemy.shard.split, enemy.defeat.feedback|
|SPLINTER / NEUTRAL|02-shard-splinter.png · R2C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SPLINTER / MOVE|02-shard-splinter.png · R2C1 NEUTRAL → 02-shard-splinter.png · R2C2 SQUASH → 02-shard-splinter.png · R2C3 STRETCH → 02-shard-splinter.png · R2C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SPLINTER / SQUASH|02-shard-splinter.png · R2C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SPLINTER / STRETCH|02-shard-splinter.png · R2C3 STRETCH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SPLINTER / HOP|02-shard-splinter.png · R2C4 HOP / CONTACT|BODY局部竖直抬升，基线投影root固定；不新增逻辑跳跃。|enemy.status.common|
|SPLINTER / ATTACK|02-shard-splinter.png · R2C4 HOP / CONTACT|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.contact.feedback|
|SHIELD / NEUTRAL|03-shield-medic.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.shield.overlay|
|SHIELD / MOVE|03-shield-medic.png · R1C1 NEUTRAL → 03-shield-medic.png · R1C2 SQUASH → 03-shield-medic.png · R1C3 STRETCH → 03-shield-medic.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.shield.overlay|
|SHIELD / SQUASH|03-shield-medic.png · R1C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.shield.overlay|
|SHIELD / STRETCH|03-shield-medic.png · R1C3 STRETCH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.shield.overlay|
|SHIELD / GUARD|03-shield-medic.png · R1C4 GUARD / CONTACT|软肉盾器官保持父级；数值护盾环独立；耗尽不删除软肉盾。|enemy.status.common, enemy.shield.overlay|
|SHIELD / ATTACK|03-shield-medic.png · R1C4 GUARD / CONTACT|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.contact.feedback, enemy.shield.overlay|
|MEDIC / NEUTRAL|03-shield-medic.png · R2C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.medic.aura|
|MEDIC / MOVE|03-shield-medic.png · R2C1 NEUTRAL → 03-shield-medic.png · R2C2 SQUASH → 03-shield-medic.png · R2C3 STRETCH → 03-shield-medic.png · R2C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.medic.aura|
|MEDIC / SQUASH|03-shield-medic.png · R2C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.medic.aura|
|MEDIC / STRETCH|03-shield-medic.png · R2C3 STRETCH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.medic.aura|
|MEDIC / HEAL|03-shield-medic.png · R2C4 HEAL / CONTACT|HEAL / CONTACT完整身体+独立持续治疗装饰；无额外伤害帧、五官、漂浮十字。|enemy.status.common, enemy.medic.aura|
|MEDIC / ATTACK|03-shield-medic.png · R2C4 HEAL / CONTACT|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.contact.feedback, enemy.medic.aura|
|BOMBER / NEUTRAL|04-bomber-jammer.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|BOMBER / MOVE|04-bomber-jammer.png · R1C1 NEUTRAL → 04-bomber-jammer.png · R1C2 SQUASH → 04-bomber-jammer.png · R1C3 STRETCH → 04-bomber-jammer.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|BOMBER / SQUASH|04-bomber-jammer.png · R1C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|BOMBER / STRETCH|04-bomber-jammer.png · R1C3 STRETCH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|BOMBER / INFLATE|04-bomber-jammer.png · R1C4 INFLATE / CONTACT|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.bomber.blast|
|BOMBER / ATTACK|04-bomber-jammer.png · R1C4 INFLATE / CONTACT|INFLATE / CONTACT完整身体+独立即时爆炸波；从身体姿态不能推导新爆炸窗口/半径。|enemy.status.common, enemy.contact.feedback, enemy.bomber.blast|
|JAMMER / NEUTRAL|04-bomber-jammer.png · R2C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.jammer.aura|
|JAMMER / MOVE|04-bomber-jammer.png · R2C1 NEUTRAL → 04-bomber-jammer.png · R2C2 SQUASH → 04-bomber-jammer.png · R2C3 STRETCH → 04-bomber-jammer.png · R2C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.jammer.aura|
|JAMMER / SQUASH|04-bomber-jammer.png · R2C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.jammer.aura|
|JAMMER / STRETCH|04-bomber-jammer.png · R2C3 STRETCH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.jammer.aura|
|JAMMER / JAM|04-bomber-jammer.png · R2C4 JAM / CONTACT|JAM / CONTACT完整身体+独立干扰范围/目标反馈；无烘焙波线、无新增弹体。|enemy.status.common, enemy.jammer.aura|
|JAMMER / ATTACK|04-bomber-jammer.png · R2C4 JAM / CONTACT|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.contact.feedback, enemy.jammer.aura|
|PHASE / NEUTRAL|05-phase-burrower.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.phase.opacity|
|PHASE / MOVE|05-phase-burrower.png · R1C1 NEUTRAL → 05-phase-burrower.png · R1C2 SQUASH → 05-phase-burrower.png · R1C3 STRETCH → 05-phase-burrower.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.phase.opacity|
|PHASE / SQUASH|05-phase-burrower.png · R1C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.phase.opacity|
|PHASE / STRETCH|05-phase-burrower.png · R1C3 STRETCH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common, enemy.phase.opacity|
|PHASE / PHASE_DASH|05-phase-burrower.png · R1C4 PHASE BODY|PHASE BODY复用完整常态姿态，phased alpha单独应用；没有图册名所暗示的新dash或烘焙残影。|enemy.status.common, enemy.phase.opacity|
|BURROWER / NEUTRAL|05-phase-burrower.png · R2C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|BURROWER / MOVE|05-phase-burrower.png · R2C1 NEUTRAL → 05-phase-burrower.png · R2C2 SQUASH → 05-phase-burrower.png · R2C3 STRETCH → 05-phase-burrower.png · R2C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|BURROWER / SQUASH|05-phase-burrower.png · R2C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|BURROWER / STRETCH|05-phase-burrower.png · R2C3 STRETCH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|BURROWER / EMERGE|05-phase-burrower.png · R2C4 EMERGE BODY|单一完整EMERGE BODY为出土完成姿态；地下到显现可复用身体/遮罩，固定root；波/土层单独，不重画第二实体。|enemy.status.common, enemy.burrow.emerge|
|BEACON / NEUTRAL|beacon-body-only.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|BEACON / MOVE|beacon-body-only.png · R1C1 NEUTRAL → beacon-body-only.png · R1C2 WINDUP → beacon-body-only.png · R1C3 TRIGGER → beacon-body-only.png · R1C1 NEUTRAL|复用NEUTRAL→WINDUP(压缩)→TRIGGER(拉伸)→NEUTRAL；RECOVER可回常态。|enemy.status.common|
|BEACON / SQUASH|beacon-body-only.png · R1C2 WINDUP|WINDUP是压缩身体子姿态；美术表现不新增逻辑蓄力窗口。|enemy.status.common|
|BEACON / STRETCH|beacon-body-only.png · R1C3 TRIGGER|TRIGGER是拉伸身体子姿态；与召唤尝试事件关联，不控制子体数量。|enemy.status.common|
|BEACON / SUMMON_3_BASIC|beacon-body-only.png · R1C2 WINDUP → beacon-body-only.png · R1C3 TRIGGER → beacon-body-only.png · R1C4 RECOVER|身体前三子姿态与RECOVER；BASIC只在独立框/资源引用，不在body。自身timer与当前HIVE spawnHive分开。；BASIC独立复用basic-root-lock.png R1C1|enemy.status.common, enemy.beacon.summon|
|SCOUT / NEUTRAL|06-scout-siege.png · R2C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SCOUT / MOVE|06-scout-siege.png · R2C1 NEUTRAL → 06-scout-siege.png · R2C2 SQUASH → 06-scout-siege.png · R2C3 STRETCH → 06-scout-siege.png · R2C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SCOUT / SQUASH|06-scout-siege.png · R2C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SCOUT / STRETCH|06-scout-siege.png · R2C3 STRETCH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SCOUT / CHASE_PLAYER|06-scout-siege.png · R2C4 CHASE BODY|CHASE BODY单体固定root；被追PLAYER不进入身体；实际targetMode=player。|enemy.status.common|
|SIEGE / NEUTRAL|06-scout-siege.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SIEGE / MOVE|06-scout-siege.png · R1C1 NEUTRAL → 06-scout-siege.png · R1C2 SQUASH → 06-scout-siege.png · R1C3 STRETCH → 06-scout-siege.png · R1C1 NEUTRAL|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SIEGE / SQUASH|06-scout-siege.png · R1C2 SQUASH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SIEGE / STRETCH|06-scout-siege.png · R1C3 STRETCH|同身份原地关键姿态；器官守恒；世界移动和结算仍由现有逻辑提供。|enemy.status.common|
|SIEGE / STRIKE_TOWER|06-scout-siege.png · R1C4 STRIKE BODY|STRIKE BODY单体固定root，双拳仍完整；被打塔不进入身体；伤害读取持续接触与towerDamageFactor。|enemy.status.common|

SHARD SPLIT_3的完整父体在r02 R1C4，子体各用r02 SPLINTER R2C1。原r01独立关系图只作关系补充，不是身体动画格。BEACON召唤BASIC用r01 BASIC NEUTRAL/MOVE资源；当前HIVE spawnHive则NEST，由机关组制作。

数值root与collisionCenter沿用r01设计建议；图内标线仅可读规格，帧级精度另验。新板未审不继承r01通过。
