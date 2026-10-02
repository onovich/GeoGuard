# Boss 技能独立效果逐项清单

当前调用优先 optimized；下表按实际 dispatcher 取来源。静态来源提取，配合 inventory.md 人工边界说明；不是实机测试。未标 label 的 line 沿用通用线危险区，不能包装成 projectile。

|身份／运行期 form|阶段|技能|独立资源需求|代码依据|
|---|---|---|---|---|
|COMMANDER / commander|P1,P2,P3|summonFormation|independent enemy BASIC|fallback: `src/logic/engine/bossAbilityRuntime.js:42`|
|COMMANDER / commander|P1,P2|commandLine|hazard.line / formation|fallback: `src/logic/engine/bossAbilityRuntime.js:43`|
|COMMANDER / commander|P2,P3|shieldPulse|impactWave / generic；shield state overlay (actual recipient)|fallback: `src/logic/engine/bossAbilityRuntime.js:55`|
|COMMANDER / commander|P2,P3|phalanxAdvance|hazard.area / wall；independent enemy SHIELD|fallback: `src/logic/engine/bossAbilityRuntime.js:65`|
|COMMANDER / commander|P3|commandRush|hazard.line / charge；impactWave / generic；logical displacement cue; root stays fixed in body art|fallback: `src/logic/engine/bossAbilityRuntime.js:81`|
|HUNTER / hunter|P1,P2,P3|dashAtPlayer|impactWave / generic；logical displacement cue; root stays fixed in body art|fallback: `src/logic/engine/bossAbilityRuntime.js:89`|
|HUNTER / hunter|P1,P2,P3|markPrey|hazard.line / mark；hazard.area / hunt|fallback: `src/logic/engine/bossAbilityRuntime.js:96`|
|HUNTER / hunter|P2|summonScouts|independent enemy SCOUT|fallback: `src/logic/engine/bossAbilityRuntime.js:109`|
|HUNTER / hunter|P2,P3|pincerRush|hazard.line / slash；independent enemy SCOUT|fallback: `src/logic/engine/bossAbilityRuntime.js:110`|
|HUNTER / hunter|P3|afterimageBurst|independent enemy PHASE|fallback: `src/logic/engine/bossAbilityRuntime.js:128`|
|HUNTER / hunter|P3|feintStrike|hazard.line / charge；impactWave / generic；logical displacement cue; root stays fixed in body art|fallback: `src/logic/engine/bossAbilityRuntime.js:121`|
|FORTRESS / fortress|P1,P2,P3|summonSiege|independent enemy SIEGE|fallback: `src/logic/engine/bossAbilityRuntime.js:129`|
|FORTRESS / fortress|P1,P2|bastionMortar|hazard.area / mortar|fallback: `src/logic/engine/bossAbilityRuntime.js:130`|
|FORTRESS / fortress|P2,P3|fortify|impactWave / generic；shield state overlay (actual recipient)|fallback: `src/logic/engine/bossAbilityRuntime.js:143`|
|FORTRESS / fortress|P2,P3|shockRam|hazard.line / ram；impactWave / generic；logical displacement cue; root stays fixed in body art|fallback: `src/logic/engine/bossAbilityRuntime.js:148`|
|FORTRESS / fortress|P3|quake|hazard.area / bunker|optimized: `src/logic/engine/bossOptimizedAbilities.js:145`|
|FORTRESS / fortress|P3|bunkerRing|hazard.area / bunker|fallback: `src/logic/engine/bossAbilityRuntime.js:157`|
|PRISM / prism|P1,P2,P3|prismBeam|hazard.line / unlabelled default|fallback: `src/logic/engine/bossAbilityRuntime.js:172`|
|PRISM / prism|P1,P2|refractVolley|hazard.line / refract|fallback: `src/logic/engine/bossAbilityRuntime.js:173`|
|PRISM / prism|P2,P3|mirrorSummon|independent enemy PHASE|fallback: `src/logic/engine/bossAbilityRuntime.js:183`|
|PRISM / prism|P2,P3|prismLattice|hazard.line / lattice|fallback: `src/logic/engine/bossAbilityRuntime.js:184`|
|PRISM / prism|P3|tripleBeam|hazard.line / unlabelled default|fallback: `src/logic/engine/bossAbilityRuntime.js:199`|
|PRISM / prism|P3|mirrorStep|hazard.line / mirror；logical displacement cue; root stays fixed in body art|optimized: `src/logic/engine/bossOptimizedAbilities.js:44`|
|HIVE / hive|P1,P2,P3|spawnHive|independent MECHANIC_NEST|optimized: `src/logic/engine/bossOptimizedAbilities.js:53`|
|HIVE / hive|P1,P2,P3|broodShift|independent MECHANIC_NEST；logical displacement cue; root stays fixed in body art|optimized: `src/logic/engine/bossOptimizedAbilities.js:56`|
|HIVE / hive|P2,P3|hivePulse|hazard.area / brood|optimized: `src/logic/engine/bossOptimizedAbilities.js:64`|
|HIVE / hive|P2,P3|summonSwarm|independent enemy SHARD|fallback: `src/logic/engine/bossAbilityRuntime.js:251`|
|HIVE / hive|P3|hiveCollapse|hazard.area / brood|optimized: `src/logic/engine/bossOptimizedAbilities.js:70`|
|FROST_JUDGE / frost|P1,P2,P3|frostRing|hazard.area / frost|optimized: `src/logic/engine/bossOptimizedAbilities.js:86`|
|FROST_JUDGE / frost|P1,P2|whiteout|hazard.area / frost|fallback: `src/logic/engine/bossAbilityRuntime.js:278`|
|FROST_JUDGE / frost|P2,P3|freezeTower|independent MECHANIC_SEAL|optimized: `src/logic/engine/bossOptimizedAbilities.js:88`|
|FROST_JUDGE / frost|P2,P3|glacialPrison|hazard.area / prison|fallback: `src/logic/engine/bossAbilityRuntime.js:301`|
|FROST_JUDGE / frost|P3|summonFrostGuards|independent enemy SHIELD|fallback: `src/logic/engine/bossAbilityRuntime.js:316`|
|FROST_JUDGE / frost|P3|coldSnap|independent MECHANIC_SEAL|optimized: `src/logic/engine/bossOptimizedAbilities.js:92`|
|RAIL_WARLORD / rail|P1,P2,P3|railShot|hazard.line / rail|fallback: `src/logic/engine/bossAbilityRuntime.js:332`|
|RAIL_WARLORD / rail|P1,P2|crosshairBarrage|hazard.line / crosshair|fallback: `src/logic/engine/bossAbilityRuntime.js:333`|
|RAIL_WARLORD / rail|P2,P3|markTower|independent MECHANIC_RETICLE|optimized: `src/logic/engine/bossOptimizedAbilities.js:40`|
|RAIL_WARLORD / rail|P2,P3|suppressiveGrid|hazard.line / grid|fallback: `src/logic/engine/bossAbilityRuntime.js:341`|
|RAIL_WARLORD / rail|P3|overload|hazard.line / overload|fallback: `src/logic/engine/bossAbilityRuntime.js:348`|
|RAIL_WARLORD / rail|P3|killLane|hazard.line / crosshair|fallback: `src/logic/engine/bossAbilityRuntime.js:352`|
|COLLECTOR / collector|P1,P2,P3|stealMoney|independent MECHANIC_COURIER；money/text feedback|optimized: `src/logic/engine/bossOptimizedAbilities.js:76`|
|COLLECTOR / collector|P1,P2|taxBeacon|hazard.area / coin|optimized: `src/logic/engine/bossOptimizedAbilities.js:77`|
|COLLECTOR / collector|P2,P3|summonScouts|independent enemy SCOUT|fallback: `src/logic/engine/bossAbilityRuntime.js:109`|
|COLLECTOR / collector|P2,P3|paydaySweep|hazard.line / coinline；independent enemy SCOUT|fallback: `src/logic/engine/bossAbilityRuntime.js:387`|
|COLLECTOR / collector|P3|ransomBurst|independent enemy SCOUT|fallback: `src/logic/engine/bossAbilityRuntime.js:397`|
|COLLECTOR / collector|P3|repossess|hazard.area / coin；independent MECHANIC_COURIER；money/text feedback|optimized: `src/logic/engine/bossOptimizedAbilities.js:81`|
|DRAGON / dragon|P1,P2,P3|dragonStrafe|hazard.line / strafe|fallback: `src/logic/engine/bossAbilityRuntime.js:559`|
|DRAGON / dragon|P1,P2|emberWake|hazard.area / inferno|fallback: `src/logic/engine/bossAbilityRuntime.js:571`|
|DRAGON / dragon|P2,P3|wingBuffet|hazard.area / breath|optimized: `src/logic/engine/bossOptimizedAbilities.js:147`|
|DRAGON / dragon|P2,P3|meteorRain|hazard.area / meteor|fallback: `src/logic/engine/bossAbilityRuntime.js:600`|
|DRAGON / dragon|P3|skyDive|hazard.area / dive；logical displacement cue; root stays fixed in body art|optimized: `src/logic/engine/bossOptimizedAbilities.js:149`|
|DRAGON / dragon|P3|infernoRing|hazard.area / inferno；impactWave / dragonFinisher|fallback: `src/logic/engine/bossAbilityRuntime.js:655`|
|SPIDER_MATRIARCH / spider|P1,P2,P3|webTrap|independent MECHANIC_WEB；terrain.area / web (queueMechanicTerrain)|optimized: `src/logic/engine/bossOptimizedAbilities.js:97`|
|SPIDER_MATRIARCH / spider|P1,P2|silkVolley|independent MECHANIC_WEB；terrain.area / web (queueMechanicTerrain)|optimized: `src/logic/engine/bossOptimizedAbilities.js:98`|
|SPIDER_MATRIARCH / spider|P2,P3|spawnSpiderlings|independent enemy SPLINTER|fallback: `src/logic/engine/bossAbilityRuntime.js:718`|
|SPIDER_MATRIARCH / spider|P2,P3|broodAmbush|independent enemy BURROWER；independent enemy SPLINTER|fallback: `src/logic/engine/bossAbilityRuntime.js:719`|
|SPIDER_MATRIARCH / spider|P3|nestBloom|independent MECHANIC_WEB；terrain.area / web (queueMechanicTerrain)|optimized: `src/logic/engine/bossOptimizedAbilities.js:102`|
|SPIDER_MATRIARCH / spider|P3|webField|independent MECHANIC_WEB；terrain.area / web (queueMechanicTerrain)；independent enemy SPLINTER|optimized: `src/logic/engine/bossOptimizedAbilities.js:105`|
|ASTROLABE / astrolabe|P1,P2,P3|gravityWell|hazard.area / gravity|optimized: `src/logic/engine/bossOptimizedAbilities.js:127`|
|ASTROLABE / astrolabe|P1,P2|starfall|hazard.area / star|fallback: `src/logic/engine/bossAbilityRuntime.js:832`|
|ASTROLABE / astrolabe|P2,P3|orbitalShots|hazard.line / orbit|fallback: `src/logic/engine/bossAbilityRuntime.js:845`|
|ASTROLABE / astrolabe|P2,P3|orbitalLock|hazard.line / lock|fallback: `src/logic/engine/bossAbilityRuntime.js:857`|
|ASTROLABE / astrolabe|P3|singularity|hazard.area / singularity|optimized: `src/logic/engine/bossOptimizedAbilities.js:132`|
|ASTROLABE / astrolabe|P3|eventHorizon|hazard.area / horizon；impactWave / astrolabeFinisher|fallback: `src/logic/engine/bossAbilityRuntime.js:916`|
|BLOOD_FORGE / forge|P1,P2,P3|forgeArmor|independent enemy SHIELD；shield state overlay (actual recipient)|fallback: `src/logic/engine/bossAbilityRuntime.js:951`|
|BLOOD_FORGE / forge|P1,P2|slagDrop|hazard.area / slag|fallback: `src/logic/engine/bossAbilityRuntime.js:956`|
|BLOOD_FORGE / forge|P2,P3|sacrificeMinions|hazard.area / slag；shield state overlay (actual recipient)；heal feedback (cosmetic only)|optimized: `src/logic/engine/bossOptimizedAbilities.js:134`|
|BLOOD_FORGE / forge|P2,P3|brandLine|hazard.line / brand；hazard.area / slag|fallback: `src/logic/engine/bossAbilityRuntime.js:984`|
|BLOOD_FORGE / forge|P3|moltenBurst|hazard.area / slag|fallback: `src/logic/engine/bossAbilityRuntime.js:997`|
|BLOOD_FORGE / forge|P3|forgeDetonation|hazard.area / slag|fallback: `src/logic/engine/bossAbilityRuntime.js:1003`|
|VOID_CONDUCTOR / conductor|P1,P2,P3|conductLines|hazard.line / tempo|optimized: `src/logic/engine/bossOptimizedAbilities.js:157`|
|VOID_CONDUCTOR / conductor|P1,P2|pulseMeasure|hazard.area / beat|optimized: `src/logic/engine/bossOptimizedAbilities.js:163`|
|VOID_CONDUCTOR / conductor|P2,P3|tempoShift|independent enemy FAST|optimized: `src/logic/engine/bossOptimizedAbilities.js:170`|
|VOID_CONDUCTOR / conductor|P2,P3|syncopate|hazard.line / tempo|optimized: `src/logic/engine/bossOptimizedAbilities.js:174`|
|VOID_CONDUCTOR / conductor|P3|finale|hazard.line / tempo|optimized: `src/logic/engine/bossOptimizedAbilities.js:185`|
|VOID_CONDUCTOR / conductor|P3|crescendo|hazard.area / beat|optimized: `src/logic/engine/bossOptimizedAbilities.js:180`|
|LABYRINTH_KEEPER / labyrinth|P1,P2,P3|raiseWalls|independent MECHANIC_WALL|optimized: `src/logic/engine/bossOptimizedAbilities.js:118`|
|LABYRINTH_KEEPER / labyrinth|P1,P2|corridorClamp|hazard.line / gate|fallback: `src/logic/engine/bossAbilityRuntime.js:1072`|
|LABYRINTH_KEEPER / labyrinth|P2,P3|gateSwap|independent MECHANIC_WALL|optimized: `src/logic/engine/bossOptimizedAbilities.js:119`|
|LABYRINTH_KEEPER / labyrinth|P2,P3|mazeFold|hazard.line / maze；hazard.area / wall|fallback: `src/logic/engine/bossAbilityRuntime.js:1083`|
|LABYRINTH_KEEPER / labyrinth|P3|mazeCrush|hazard.area / wall|optimized: `src/logic/engine/bossOptimizedAbilities.js:120`|
|LABYRINTH_KEEPER / labyrinth|P3|deadEnd|hazard.area / wall|optimized: `src/logic/engine/bossOptimizedAbilities.js:126`|
|NIGHTMARE_BLOOM / bloom|P1,P2,P3|seedPods|independent MECHANIC_ROOT；terrain.area / poison (queueMechanicTerrain)|optimized: `src/logic/engine/bossOptimizedAbilities.js:109`|
|NIGHTMARE_BLOOM / bloom|P1,P2|blightRoots|hazard.line / vine|fallback: `src/logic/engine/bossAbilityRuntime.js:1109`|
|NIGHTMARE_BLOOM / bloom|P2,P3|poisonBloom|hazard.area / poison|fallback: `src/logic/engine/bossAbilityRuntime.js:1118`|
|NIGHTMARE_BLOOM / bloom|P2,P3|sporeBurst|hazard.area / spore|fallback: `src/logic/engine/bossAbilityRuntime.js:1119`|
|NIGHTMARE_BLOOM / bloom|P3|gardenWake|independent MECHANIC_ROOT；terrain.area / poison (queueMechanicTerrain)；independent enemy SHARD；heal feedback (cosmetic only)|optimized: `src/logic/engine/bossOptimizedAbilities.js:112`|
|NIGHTMARE_BLOOM / bloom|P3|creepingCanopy|independent MECHANIC_ROOT；terrain.area / poison (queueMechanicTerrain)|optimized: `src/logic/engine/bossOptimizedAbilities.js:117`|
|TWIN_SOL / twinSun|P1,P2,P3|solarDash|hazard.line / solar；impactWave / generic；logical displacement cue; root stays fixed in body art|fallback: `src/logic/engine/bossAbilityRuntime.js:465`|
|TWIN_SOL / twinSun|P2,P3|flareLance|hazard.line / flare|fallback: `src/logic/engine/bossAbilityRuntime.js:473`|
|TWIN_SOL / twinSun|P2,P3|twinCrossfire|hazard.line / crossfire；hazard.area / eclipse；impactWave / twinFinisher|fallback: `src/logic/engine/bossAbilityRuntime.js:508`|
|TWIN_SOL / twinSun|P3|eclipsePulse|hazard.area / eclipse；impactWave / twinFinisher|fallback: `src/logic/engine/bossAbilityRuntime.js:434`|
|TWIN_SOL / twinSun|幸存狂暴|soloSolarVolley|hazard.line / flare|optimized: `src/logic/engine/bossOptimizedAbilities.js:192`|
|TWIN_LUNA / twinMoon|P1,P2,P3|lunarSnare|hazard.area / moon|fallback: `src/logic/engine/bossAbilityRuntime.js:483`|
|TWIN_LUNA / twinMoon|P2,P3|shadowArc|hazard.line / shadow；hazard.area / shade|fallback: `src/logic/engine/bossAbilityRuntime.js:495`|
|TWIN_LUNA / twinMoon|P2,P3|twinCrossfire|hazard.line / crossfire；hazard.area / eclipse；impactWave / twinFinisher|fallback: `src/logic/engine/bossAbilityRuntime.js:508`|
|TWIN_LUNA / twinMoon|P3|eclipsePulse|hazard.area / eclipse；impactWave / twinFinisher|fallback: `src/logic/engine/bossAbilityRuntime.js:434`|
|TWIN_LUNA / twinMoon|幸存狂暴|soloLunarOrbit|hazard.area / moon|optimized: `src/logic/engine/bossOptimizedAbilities.js:199`|

## 模板／作者库保留但非当前标准遭遇直接技能

TWINS标准遭遇入口createBossEncounterRuntime会拆成TWIN_SOL/TWIN_LUNA，使用上述两套阶段；基础TWINS模板中的twinOrbit/twinBolt/twinSwap仅留来源，不作为当前双体直接运行。hiveHeal/dragonBreath也只留自定义fallback支持。

|技能|资源需求|依据|
|---|---|---|
|dragonBreath|hazard.line / breath|`src/logic/engine/bossAbilityRuntime.js:554`|
|hiveHeal|heal feedback (cosmetic only)|`src/logic/engine/bossAbilityRuntime.js:228`|
|twinBolt|hazard.line / moonbolt,sunbolt|`src/logic/engine/bossAbilityRuntime.js:423`|
|twinOrbit|impactWave / generic；shield state overlay (actual recipient)|`src/logic/engine/bossAbilityRuntime.js:418`|
|twinSwap|impactWave / generic；independent enemy PHASE；logical displacement cue; root stays fixed in body art|`src/logic/engine/bossAbilityRuntime.js:427`|

## 生命周期与复用

- 所有 line／area 使用预警形状、结算瞬间和装饰消散的独立资源；参数来自运行期，不从图片推导。AREA 多次脉冲每次读取当前 radius；LINE 取 x/y/x2/y2/width。
- WEB／ROOT 由 plant 调用 queueMechanicTerrain，另产持续地形 web／poison；terrain 所有权由 ownerMechanicUid 和 ownerBossUid 控制。
- 机关、召唤单位有独立 UID/HP/root。表中列的是来源要求，本组只制作外部环、连线、闪光等，不制作或替代其身体。
- spawnAround 受预算与放置结果限制，召唤闪光只对应实际成功生成；图片不得承诺固定召唤数量。
- 原始 fallback 的额外 source 保存于 boss-source-map.json，避免把被覆盖的效果当主运行来源。
- 上表覆盖 enriched 模板全部技能、TWINS双体和幸存技能；自定义模板可变，本包列现有支持处理器全集。
- 本表属于清单提交，所有效果仍待主审批准后制作，不标为生产就绪。
