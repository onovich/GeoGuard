# 实际 Boss 技能表

入口 useGeoGuardGame → runBossOptimizedAbility；优化 handler 优先，否则 runBossAbilityEffect。每行完整几何、所有权、生命周期和当前源码摘录见 boss-skills-95.json。

|技能|实际身份|分派|独立召唤|机关|危险几何/效果|
|---|---|---|---|---|---|
|summonFormation|boss:COMMANDER|fallback|BASIC|—|B04/M03|
|commandLine|boss:COMMANDER|fallback|—|—|B03/H02|
|shieldPulse|boss:COMMANDER|fallback|—|—|B02/S01, B04/M10|
|phalanxAdvance|boss:COMMANDER|fallback|SHIELD|—|B03/H01, B04/M03|
|commandRush|boss:COMMANDER|fallback|—|—|B03/H02, B04/M10|
|dashAtPlayer|boss:HUNTER|fallback|—|—|B04/M10|
|markPrey|boss:HUNTER|fallback|—|—|B03/H01, B03/H02|
|summonScouts|boss:HUNTER, boss:COLLECTOR|fallback|SCOUT|—|B04/M03|
|pincerRush|boss:HUNTER|fallback|SCOUT|—|B03/H02, B04/M03|
|afterimageBurst|boss:HUNTER|fallback|PHASE|—|B04/M03|
|feintStrike|boss:HUNTER|fallback|—|—|B03/H02, B04/M10|
|summonSiege|boss:FORTRESS|fallback|SIEGE|—|B04/M03|
|bastionMortar|boss:FORTRESS|fallback|—|—|B03/H01|
|fortify|boss:FORTRESS|fallback|—|—|B02/S01, B04/M10|
|shockRam|boss:FORTRESS|fallback|—|—|B03/H02, B04/M10|
|quake|boss:FORTRESS|optimized|—|—|B03/H01|
|bunkerRing|boss:FORTRESS|fallback|—|—|B03/H01|
|prismBeam|boss:PRISM|fallback|—|—|B03/H02|
|refractVolley|boss:PRISM|fallback|—|—|B03/H02|
|mirrorSummon|boss:PRISM|fallback|PHASE|—|B04/M03|
|prismLattice|boss:PRISM|fallback|—|—|B03/H02|
|tripleBeam|boss:PRISM|fallback|—|—|B03/H02|
|mirrorStep|boss:PRISM|optimized|—|—|B03/H02|
|spawnHive|boss:HIVE|optimized|—|NEST|B02/S14, B04/M03, B04/M05|
|broodShift|boss:HIVE|optimized|—|NEST (only when none)|B02/S14, B04/M03, B04/M05|
|hivePulse|boss:HIVE|optimized|—|—|B03/H01|
|summonSwarm|boss:HIVE|fallback|SHARD|—|B04/M03|
|hiveCollapse|boss:HIVE|optimized|—|—|B03/H01|
|frostRing|boss:FROST_JUDGE|optimized|—|—|B03/H03|
|whiteout|boss:FROST_JUDGE|fallback|—|—|B03/H03|
|freezeTower|boss:FROST_JUDGE|optimized|—|SEAL|B02/S03, B02/S14, B04/M03, B04/M05, B04/M06|
|glacialPrison|boss:FROST_JUDGE|fallback|—|—|B03/H01|
|summonFrostGuards|boss:FROST_JUDGE|fallback|SHIELD|—|B04/M03|
|coldSnap|boss:FROST_JUDGE|optimized|—|SEAL|B02/S03, B02/S14, B04/M03, B04/M05, B04/M06|
|railShot|boss:RAIL_WARLORD|fallback|—|—|B03/H02|
|crosshairBarrage|boss:RAIL_WARLORD|fallback|—|—|B03/H04|
|markTower|boss:RAIL_WARLORD|optimized|—|RETICLE|B02/S14, B03/H01, B04/M03, B04/M05, B04/M06|
|suppressiveGrid|boss:RAIL_WARLORD|fallback|—|—|B03/H04|
|overload|boss:RAIL_WARLORD|fallback|—|—|B03/H02|
|killLane|boss:RAIL_WARLORD|fallback|—|—|B03/H04|
|stealMoney|boss:COLLECTOR|optimized|—|COURIER|B02/S14, B04/M03, B04/M05, B04/M08|
|taxBeacon|boss:COLLECTOR|optimized|—|—|B03/H01|
|paydaySweep|boss:COLLECTOR|fallback|SCOUT|—|B03/H02, B04/M03|
|ransomBurst|boss:COLLECTOR|fallback|SCOUT|—|B04/M03|
|repossess|boss:COLLECTOR|optimized|—|COURIER|B02/S14, B03/H01, B04/M03, B04/M05, B04/M08|
|solarDash|boss:TWINS_SUN|fallback|—|—|B03/H02, B04/M10|
|flareLance|boss:TWINS_SUN|fallback|—|—|B03/H02|
|twinCrossfire|boss:TWINS_SUN, boss:TWINS_MOON|fallback|—|—|B03/H03, B03/H04, B04/M10, B04/M12|
|eclipsePulse|boss:TWINS_SUN, boss:TWINS_MOON|fallback|—|—|B03/H03, B04/M10, B04/M12|
|lunarSnare|boss:TWINS_MOON|fallback|—|—|B03/H03|
|shadowArc|boss:TWINS_MOON|fallback|—|—|B03/H01, B03/H02|
|dragonStrafe|boss:DRAGON|fallback|—|—|B03/H02|
|emberWake|boss:DRAGON|fallback|—|—|B03/H03|
|wingBuffet|boss:DRAGON|optimized|—|—|B03/H01|
|meteorRain|boss:DRAGON|fallback|—|—|B03/H01|
|skyDive|boss:DRAGON|optimized|—|—|B03/H01|
|infernoRing|boss:DRAGON|fallback|—|—|B03/H03, B04/M10, B04/M12|
|webTrap|boss:SPIDER_MATRIARCH|optimized|—|WEB|B02/S14, B04/M01, B04/M03, B04/M05|
|silkVolley|boss:SPIDER_MATRIARCH|optimized|—|WEB|B02/S14, B04/M01, B04/M03, B04/M05|
|spawnSpiderlings|boss:SPIDER_MATRIARCH|fallback|SPLINTER|—|B04/M03|
|broodAmbush|boss:SPIDER_MATRIARCH|fallback|BURROWER, SPLINTER|—|B04/M03|
|nestBloom|boss:SPIDER_MATRIARCH|optimized|—|WEB|B02/S14, B04/M01, B04/M03, B04/M05|
|webField|boss:SPIDER_MATRIARCH|optimized|SPLINTER|WEB|B02/S14, B04/M01, B04/M03, B04/M05|
|gravityWell|boss:ASTROLABE|optimized|—|—|B03/H03|
|starfall|boss:ASTROLABE|fallback|—|—|B03/H01|
|orbitalShots|boss:ASTROLABE|fallback|—|—|B03/H02|
|orbitalLock|boss:ASTROLABE|fallback|—|—|B03/H02|
|singularity|boss:ASTROLABE|optimized|—|—|B03/H03|
|eventHorizon|boss:ASTROLABE|fallback|—|—|B03/H03, B04/M10, B04/M12|
|forgeArmor|boss:BLOOD_FORGE|fallback|SHIELD|—|B02/S01, B04/M03|
|slagDrop|boss:BLOOD_FORGE|fallback|—|—|B03/H01|
|sacrificeMinions|boss:BLOOD_FORGE|optimized|—|—|B02/S01, B02/S15, B03/H01|
|brandLine|boss:BLOOD_FORGE|fallback|—|—|B03/H01, B03/H02|
|moltenBurst|boss:BLOOD_FORGE|fallback|—|—|B03/H01|
|forgeDetonation|boss:BLOOD_FORGE|fallback|—|—|B03/H01|
|conductLines|boss:VOID_CONDUCTOR|optimized|—|—|B03/H02|
|pulseMeasure|boss:VOID_CONDUCTOR|optimized|—|—|B03/H01|
|tempoShift|boss:VOID_CONDUCTOR|optimized|FAST|—|B04/M03|
|syncopate|boss:VOID_CONDUCTOR|optimized|—|—|B03/H02|
|finale|boss:VOID_CONDUCTOR|optimized|—|—|B03/H02|
|crescendo|boss:VOID_CONDUCTOR|optimized|—|—|B03/H01|
|raiseWalls|boss:LABYRINTH_KEEPER|optimized|—|WALL|B02/S14, B04/M03, B04/M05|
|corridorClamp|boss:LABYRINTH_KEEPER|fallback|—|—|B03/H02|
|gateSwap|boss:LABYRINTH_KEEPER|optimized|—|WALL|B02/S14, B04/M03, B04/M05|
|mazeFold|boss:LABYRINTH_KEEPER|fallback|—|—|B03/H01, B03/H02|
|mazeCrush|boss:LABYRINTH_KEEPER|optimized|—|—|B03/H01|
|deadEnd|boss:LABYRINTH_KEEPER|optimized|—|—|B03/H01|
|seedPods|boss:NIGHTMARE_BLOOM|optimized|—|ROOT|B02/S14, B04/M02, B04/M03, B04/M05, B04/M07|
|blightRoots|boss:NIGHTMARE_BLOOM|fallback|—|—|B03/H02|
|poisonBloom|boss:NIGHTMARE_BLOOM|fallback|—|—|B03/H01|
|sporeBurst|boss:NIGHTMARE_BLOOM|fallback|—|—|B03/H01|
|gardenWake|boss:NIGHTMARE_BLOOM|optimized|SHARD|ROOT|B02/S14, B02/S15, B04/M02, B04/M03, B04/M05, B04/M07|
|creepingCanopy|boss:NIGHTMARE_BLOOM|optimized|—|ROOT|B02/S14, B04/M02, B04/M03, B04/M05, B04/M07|
|soloSolarVolley|boss:TWINS_SUN|optimized|—|—|B03/H02|
|soloLunarOrbit|boss:TWINS_MOON|optimized|—|—|B03/H03|
