# 当前调用链与敌人复用证据

主审2026-10-02纠正已纳入：旧plan/production-notes曾把基础fallback spawnHive→BEACON写成当前行为。本包以真正入口为准，不修改只读旧文件。

正式链：useGeoGuardGame.jsx:797-814 → bossOptimizedAbilities.js:209-213（handler优先、else fallback）→ entitySpawnRuntime/机关工厂。默认phase还由encounterRuntime.js:59-171覆盖，不能只读gameConfig早期phase列表。所有下表ID仍是原有身份，拥有独立uid/hp/行为/根锚；机关MECHANIC_NEST由bosses-mechanics组制作。

## 影响敌人归属的覆盖差异

|能力|基础fallback（被覆盖）|当前优化handler|依据|
|---|---|---|---|
|mirrorStep|PHASE×1 + old/new line wave|Boss逻辑换位+独立line hazard；不生成PHASE|bossOptimizedAbilities.js:44-51|
|spawnHive|BEACON×2|MECHANIC_NEST请求2；NEST后续请求BASIC×3；NEST非enemy BEACON|bossOptimizedAbilities.js:53-55|
|broodShift|寻BEACON迁移；没有BEACON则召BEACON×1|寻NEST迁移；没有NEST调用spawnHive；不生成BEACON|bossOptimizedAbilities.js:56-63|
|hivePulse|BEACON或Boss区域、多次pulse及治疗|每个NEST区域hazard；无本分支治疗|bossOptimizedAbilities.js:64-69|
|hiveCollapse|BEACON区域及SHARD×2/节点|NEST区域hazard；无SHARD召唤|bossOptimizedAbilities.js:70-75|
|nestBloom|独立hazard + SPLINTER×4|MECHANIC_WEB请求2；没有SPLINTER请求|bossOptimizedAbilities.js:102-104|
|webField|独立大范围web hazard + BURROWER×2|WEB请求2 + SPLINTER请求3；不请求BURROWER|bossOptimizedAbilities.js:105-108|
|seedPods|MEDIC×2|MECHANIC_ROOT请求2；不召MEDIC|bossOptimizedAbilities.js:109-111|
|gardenWake|治疗+SHARD请求6+garden危险区|ROOT请求2 + 范围非Boss非机关治疗 + SHARD请求3/maxActive8|bossOptimizedAbilities.js:112-116|
|creepingCanopy|多个spore危险区|同seedPods生成ROOT；不新增MEDIC|bossOptimizedAbilities.js:117-117|
|tempoShift|冻结塔+FAST请求4/maxActive8|更新nextBeat + FAST请求2/maxActive6|bossOptimizedAbilities.js:170-173|
|raiseWalls|SIEGE请求3 + wall区域hazard|WALL独立机关；不请求SIEGE|bossOptimizedAbilities.js:118-119|
|sacrificeMinions|需检查fallback不可直接推导子体|已标记存活近距敌人hp=0/consumed=true；禁止SHARD deathSpawn/资源drop；BossHP/护盾/slag hazard|bossOptimizedAbilities.js:134-144|

summonSwarm无handler，仍fallback SHARD请求5。BEACON自身summonTimer是普通敌人行为，不经Boss能力分派，仍BASIC请求3。NEST触发BASIC请求3且timer重置6秒。请求数必须与成功spawned数分开；预算受boss/encounter/category限制。BEACON现有代码每次定时尝试都产生波，即使没有成功子体；样板仅在子体存在时显示子体。

## 当前全部优化handler输出（检查防遗漏）

|handler|当前输出资源分类|
|---|---|
|markTower|RETICLE独立机关，targetUid指向塔|
|mirrorStep|逻辑换位+line hazard|
|spawnHive|NEST独立机关|
|broodShift|迁移至NEST或调用spawnHive|
|hivePulse|NEST-owned area hazards|
|hiveCollapse|NEST-owned area hazards|
|stealMoney|COURIER独立机关+资金直接扣除|
|taxBeacon|coin area hazard；名字不是BEACON单位|
|repossess|coin area hazard+COURIER|
|frostRing|area hazard|
|freezeTower|SEAL独立机关|
|coldSnap|SEAL独立机关，最多两塔目标|
|webTrap|WEB独立机关+地形hazard|
|silkVolley|WEB独立机关+地形hazard|
|nestBloom|WEB独立机关；名字不是NEST|
|webField|WEB + SPLINTER独立单位|
|seedPods|ROOT独立机关|
|gardenWake|ROOT+SHARD单位+治疗|
|creepingCanopy|ROOT独立机关|
|raiseWalls|WALL独立机关|
|gateSwap|切墙方向+WALL独立机关|
|mazeCrush|WALL-owned area hazards|
|deadEnd|调用mazeCrush|
|gravityWell|独立area hazard+拉拽|
|singularity|独立多pulse area hazard+拉拽|
|sacrificeMinions|标记单位consumed+BossHP/shield+独立hazard|
|quake|area hazard|
|wingBuffet|area hazard+推离|
|skyDive|Boss dashTimer世界位移+area hazard|
|conductLines|line hazards|
|pulseMeasure|area hazards|
|tempoShift|FAST独立单位+nextBeat|
|syncopate|line hazards|
|crescendo|area hazards|
|finale|line hazards|
|soloSolarVolley|line hazards|
|soloLunarOrbit|area hazards|

这张表记录实际输出及完整覆盖集合；其他危险区形状/数值交由effects-ui/Boss组自行按同入口复核，本组不宣称其原画通过。

## 14身份被召唤/复用入口

|ID|当前入口与排除旧误映射|
|---|---|
|BASIC|BEACON自身summonTimer→BASIC3；NEST tick→BASIC3（optimized spawnHive创建NEST）；summonFormation无optimized handler→fallback BASIC4|
|FAST|tempoShift optimized→FAST2|
|TANK|普通波次/调试；未发现当前Boss技能直接spawn TANK|
|SHARD|summonSwarm无handler→fallback SHARD5；gardenWake optimized→SHARD3；hiveCollapse optimized无SHARD|
|SPLINTER|SHARD死亡且not consumed→SPLINTER3；spawnSpiderlings无handler→fallback SPLINTER6；broodAmbush无handler→fallback SPLINTER（逐点）；webField optimized→SPLINTER3；nestBloom optimized无SPLINTER|
|SHIELD|phalanxAdvance、summonFrostGuards、forgeArmor无handler→fallback SHIELD|
|MEDIC|普通波次/调试；seedPods optimized只ROOT，不能当当前Boss MEDIC召唤|
|BOMBER|普通波次/调试；未发现当前Boss技能直接spawn BOMBER|
|JAMMER|普通波次/调试；未发现当前Boss技能直接spawn JAMMER|
|PHASE|默认afterimageBurst、mirrorSummon无handler→fallback PHASE；mirrorStep optimized无PHASE；旧/编辑器twinSwap也可fallback PHASE，非默认双子phase|
|BURROWER|broodAmbush无handler→fallback BURROWER；webField optimized无BURROWER|
|BEACON|普通波次/调试；当前spawnHive与broodShift不创建BEACON|
|SCOUT|summonScouts、pincerRush、paydaySweep、ransomBurst无handler→fallback SCOUT|
|SIEGE|summonSiege无handler→fallback SIEGE；raiseWalls optimized为WALL，fallback SIEGE墙卫不可当当前召唤|

普通波次/调试的同ID也复用身体。SPLINTER不在ENEMY_ORDER基础波次列表，但确实在ENEMY_TYPES并由死亡/能力创建。所有普通敌人ATTACK均保留持续接触逻辑；图册RUN/HOP/PHASE_DASH不是新的游戏技能。

SHARD分裂图中REMOVE PARENT与REQUEST 3是关系标签，不代表代码操作次序；实际settleEnemyDefeatRuntime先spawnAround，再splice父体。NEW UNIT IDS意指新uid，类型仍SPLINTER。consumed时不分裂；不能强制演出三子体。
