# optimized覆盖差异与美术影响

逐项核对当前入口 `useGeoGuardGame.jsx:798` → `bossOptimizedAbilities.js:210`。37个handler优先执行，包含35个替代基础分支与2个幸存技能；其他技能fallback。精确分支、文件SHA、行号见boss-source-map.json，helper plant/placeWalls/stealWithCourier一并保存。下列数量只是读到的请求数量，预算与放置会降低实际生成数；效果只绑定成功对象。不是本包提出的玩法变更。

|技能|基础实现来源（不作为当前主映射）|当前optimized来源／美术影响|
|---|---|---|
|spawnHive|BEACON请求2|NEST机关请求2；body归Boss机关组，独立HP/root|
|broodShift|选BEACON迁移，brood line＋波；无BEACON补生1|选NEST迁移；无节点尝试spawnHive；不额外生成那条line/波|
|hivePulse|BEACON或Boss锚area并治疗附近怪|仅当前NEST锚brood area，ownerMechanicUid；不画旧治疗|
|hiveCollapse|BEACON锚brood area＋SHARD请求2/锚|NEST锚brood area；不从本技能画SHARD|
|markTower|直接mark line|独立RETICLE延迟机关；目标线、目标塔area标与机关本体分开|
|mirrorStep|随机迁移＋mirror line＋PHASE请求1＋波|垂直侧迁移＋mirror line；不再生PHASE/波|
|stealMoney|直接扣钱＋Boss浮字|只有COURIER实际生成成功才扣钱，浮字附COURIER；追回即时退款|
|taxBeacon|coin area＋扣钱|coin area，不从本技能新增扣钱或钻拾取|
|repossess|直接伤塔＋coin area＋扣钱|coin area＋尝试COURIER偷8；不额外加旧直接伤塔表现|
|frostRing|即时damageArea|延时frost area；必须独立预警，慢速与冻结按运行值|
|freezeTower|直接塔frozenTimer＋波|独立SEAL，触发后才塔冻结；可击破打断|
|coldSnap|目标area frost|两目标SEAL需求；不画旧area作为本技能|
|webTrap|web area|WEB机关＋queueMechanicTerrain web地形|
|silkVolley|随机silk area请求3|WEB机关请求2＋web地形；不包装为弹体|
|nestBloom|nest area＋SPLINTER请求4＋P3波/追击|WEB机关请求2＋web地形，无旧小怪/终结波|
|webField|大web area＋BURROWER请求2＋P3蜘蛛波|WEB机关需求＋SPLINTER请求3，无旧BURROWER/蜘蛛波|
|seedPods|MEDIC请求2|ROOT机关请求2＋poison地形；子ROOT仍独立|
|gardenWake|治疗附近敌＋SHARD请求6＋garden area|ROOT需求＋SHARD请求3；治疗仅非Boss非机关范围内敌；无旧garden area|
|creepingCanopy|spore area请求5|复用seedPods→ROOT需求，不保留旧spore area|
|raiseWalls|SIEGE请求3＋wall area|placeWalls→独立WALL机关；有solid阻挡，不能画成仅地面纹|
|gateSwap|Boss随机迁移＋gate line|切horizontalGates并重建WALL；不表现Boss瞬移/旧gate line|
|mazeCrush|塔/玩家位置wall area|当前WALL位置wall area，ownerMechanicUid|
|deadEnd|玩家周围wall area|复用mazeCrush→WALL位置area|
|gravityWell|更强pull且半径120|半径100延时area，pull80/maxPullStep14；装饰不可更改拉力|
|singularity|直接拉塔位移＋area＋P3波/lock line|延时area，多次pull/maxPullStep；无直接挪塔/旧终结波/lock线|
|sacrificeMinions|即时删除附近非Boss、治疗/盾、即时area|只标记名单存活对象被consumed；治疗/盾后延时slag area；不把被献祭者画为可拾资源|
|quake|即时damageArea|延时bunker area，预警必须独立|
|wingBuffet|即时area＋直接push＋波|延时breath area，负pull推进；没有旧立即推/旧单独波，结算波按hazard通用生成|
|skyDive|随机换位＋diveTrail line＋dive/inferno area/终结波|实际dash到锁定玩家点＋dive area；不画旧瞬移、line或额外inferno阵|
|conductLines|两条不同来源tempo line|锁定玩家两侧平行线，延迟=beatFor倍数|
|pulseMeasure|随机四个beat area|锁定玩家周围四个有序beat点，分拍延迟|
|tempoShift|附近塔冻结＋FAST请求4|nextBeat状态＋FAST请求2；不画旧冻结效果|
|syncopate|三平行线，固定延迟步进|三平行线，beatFor倍数；数量相同不等于时序可复用固定秒数|
|crescendo|同心递增area请求5|同心递增area请求4，分拍；不产第五圈|
|finale|8条放射tempo line固定delay|8条放射tempo line按两拍delay；同形状参数复用|
|soloSolarVolley|无同名fallback|日幸存技能，flare扇形line请求3；四孔或身体器官无关联|
|soloLunarOrbit|无同名fallback|月幸存技能，moon area请求4；非新增第四阶段|

另核：summonSwarm无optimized覆盖，当前仍SHARD；afterimageBurst是实际PHASE独立敌人召唤，不能把全部“残影”名称都画为纯装饰。双子标准遭遇由encounterRuntime拆两实体；基础TWINS模板的twinOrbit/twinBolt/twinSwap不是当前日/月阶段直接调用，表中只留自定义支持来源。

BURST四孔守恒但实际burstCount内部level0/1/2/3=4/4/4/5，UI Lv1/2/3/4；依据towerRules.upgradeTowerStats/buildTowerAtLevel与combatOffenseRuntime循环。不能从四孔推导最多四弹，不能因此新增第五孔。卡片强化造价随当前catalog变化，HUD样板15/40/80仅初始Lv1来源。

本组已按上述实际来源更正清单，不修改旧权威文件，也不把跨组消息当唯一证据。后续依赖由主审交付，等待明确批准才开展更多效果原画。
