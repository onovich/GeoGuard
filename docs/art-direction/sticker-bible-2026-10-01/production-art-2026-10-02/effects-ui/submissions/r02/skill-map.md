# 95技能具体效果板格与生命周期

状态submitted；每个格的说明与生命期详见cell-catalog.json。全部新图待审，R01命中/HUD来源已通过并保留。默认技能含两幸存技能95项；旧模板五项与tailSweep单列，不冒充默认遭遇。

|技能|归属／调用|效果板格|生命周期／归属|
|---|---|---|---|
|summonFormation|fallback / COMMANDER|B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|commandLine|fallback / COMMANDER|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|shieldPulse|fallback / COMMANDER|B02/S01, B04/M10, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|phalanxAdvance|fallback / COMMANDER|B03/H01, B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|commandRush|fallback / COMMANDER|B03/H02, B04/M10, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|dashAtPlayer|fallback / HUNTER|B04/M10, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|markPrey|fallback / HUNTER|B03/H01, B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|summonScouts|fallback / HUNTER,COLLECTOR|B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|pincerRush|fallback / HUNTER|B03/H02, B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|afterimageBurst|fallback / HUNTER|B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|feintStrike|fallback / HUNTER|B03/H02, B04/M10, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|summonSiege|fallback / FORTRESS|B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|bastionMortar|fallback / FORTRESS|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|fortify|fallback / FORTRESS|B02/S01, B04/M10, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|shockRam|fallback / FORTRESS|B03/H02, B04/M10, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|quake|optimized / FORTRESS|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|bunkerRing|fallback / FORTRESS|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|prismBeam|fallback / PRISM|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|refractVolley|fallback / PRISM|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|mirrorSummon|fallback / PRISM|B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|prismLattice|fallback / PRISM|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|tripleBeam|fallback / PRISM|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|mirrorStep|optimized / PRISM|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|spawnHive|optimized / HIVE|B02/S14, B04/M03, B04/M05, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|broodShift|optimized / HIVE|B02/S14, B04/M03, B04/M05, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|hivePulse|optimized / HIVE|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|summonSwarm|fallback / HIVE|B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|hiveCollapse|optimized / HIVE|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|frostRing|optimized / FROST_JUDGE|B03/H03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|whiteout|fallback / FROST_JUDGE|B03/H03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|freezeTower|optimized / FROST_JUDGE|B02/S03, B02/S14, B04/M03, B04/M05, B04/M06, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|glacialPrison|fallback / FROST_JUDGE|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|summonFrostGuards|fallback / FROST_JUDGE|B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|coldSnap|optimized / FROST_JUDGE|B02/S03, B02/S14, B04/M03, B04/M05, B04/M06, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|railShot|fallback / RAIL_WARLORD|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|crosshairBarrage|fallback / RAIL_WARLORD|B03/H04, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|markTower|optimized / RAIL_WARLORD|B02/S14, B03/H01, B04/M03, B04/M05, B04/M06, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|suppressiveGrid|fallback / RAIL_WARLORD|B03/H04, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|overload|fallback / RAIL_WARLORD|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|killLane|fallback / RAIL_WARLORD|B03/H04, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|stealMoney|optimized / COLLECTOR|B02/S14, B04/M03, B04/M05, B04/M08, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|taxBeacon|optimized / COLLECTOR|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|paydaySweep|fallback / COLLECTOR|B03/H02, B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|ransomBurst|fallback / COLLECTOR|B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|repossess|optimized / COLLECTOR|B02/S14, B03/H01, B04/M03, B04/M05, B04/M08, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|solarDash|fallback / TWINS_SUN|B03/H02, B04/M10, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|flareLance|fallback / TWINS_SUN|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|twinCrossfire|fallback / TWINS_SUN,TWINS_MOON|B03/H03, B03/H04, B04/M10, B04/M12, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|eclipsePulse|fallback / TWINS_SUN,TWINS_MOON|B03/H03, B04/M10, B04/M12, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|lunarSnare|fallback / TWINS_MOON|B03/H03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|shadowArc|fallback / TWINS_MOON|B03/H01, B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|dragonStrafe|fallback / DRAGON|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|emberWake|fallback / DRAGON|B03/H03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|wingBuffet|optimized / DRAGON|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|meteorRain|fallback / DRAGON|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|skyDive|optimized / DRAGON|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|infernoRing|fallback / DRAGON|B03/H03, B04/M10, B04/M12, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|webTrap|optimized / SPIDER_MATRIARCH|B02/S14, B04/M01, B04/M03, B04/M05, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|silkVolley|optimized / SPIDER_MATRIARCH|B02/S14, B04/M01, B04/M03, B04/M05, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|spawnSpiderlings|fallback / SPIDER_MATRIARCH|B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|broodAmbush|fallback / SPIDER_MATRIARCH|B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|nestBloom|optimized / SPIDER_MATRIARCH|B02/S14, B04/M01, B04/M03, B04/M05, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|webField|optimized / SPIDER_MATRIARCH|B02/S14, B04/M01, B04/M03, B04/M05, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|gravityWell|optimized / ASTROLABE|B03/H03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|starfall|fallback / ASTROLABE|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|orbitalShots|fallback / ASTROLABE|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|orbitalLock|fallback / ASTROLABE|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|singularity|optimized / ASTROLABE|B03/H03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|eventHorizon|fallback / ASTROLABE|B03/H03, B04/M10, B04/M12, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|forgeArmor|fallback / BLOOD_FORGE|B02/S01, B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|slagDrop|fallback / BLOOD_FORGE|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|sacrificeMinions|optimized / BLOOD_FORGE|B02/S01, B02/S15, B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|brandLine|fallback / BLOOD_FORGE|B03/H01, B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|moltenBurst|fallback / BLOOD_FORGE|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|forgeDetonation|fallback / BLOOD_FORGE|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|conductLines|optimized / VOID_CONDUCTOR|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|pulseMeasure|optimized / VOID_CONDUCTOR|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|tempoShift|optimized / VOID_CONDUCTOR|B04/M03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|syncopate|optimized / VOID_CONDUCTOR|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|finale|optimized / VOID_CONDUCTOR|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|crescendo|optimized / VOID_CONDUCTOR|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|raiseWalls|optimized / LABYRINTH_KEEPER|B02/S14, B04/M03, B04/M05, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|corridorClamp|fallback / LABYRINTH_KEEPER|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|gateSwap|optimized / LABYRINTH_KEEPER|B02/S14, B04/M03, B04/M05, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|mazeFold|fallback / LABYRINTH_KEEPER|B03/H01, B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|mazeCrush|optimized / LABYRINTH_KEEPER|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|deadEnd|optimized / LABYRINTH_KEEPER|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|seedPods|optimized / NIGHTMARE_BLOOM|B02/S14, B04/M02, B04/M03, B04/M05, B04/M07, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|blightRoots|fallback / NIGHTMARE_BLOOM|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|poisonBloom|fallback / NIGHTMARE_BLOOM|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|sporeBurst|fallback / NIGHTMARE_BLOOM|B03/H01, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|gardenWake|optimized / NIGHTMARE_BLOOM|B02/S14, B02/S15, B04/M02, B04/M03, B04/M05, B04/M07, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|creepingCanopy|optimized / NIGHTMARE_BLOOM|B02/S14, B04/M02, B04/M03, B04/M05, B04/M07, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|soloSolarVolley|optimized / TWINS_SUN|B03/H02, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|
|soloLunarOrbit|optimized / TWINS_MOON|B03/H03, B02/S16, B02/S09|蓄力S16；有危区时WARNING→瞬间RESOLVE→实际波/粒子fade；无危区不新增危区。各格lifecycleByCell读取独立UID/timer；OPEN仅实际倍率>1|

完整primitive、label、实际来源、召唤/机关身体所属与逻辑位移保存在production-split.json。H04交叉仅模板构图，实际若平行/倾斜则每条线按真实端点绘制。H03环仅disk的内装饰，不产生环形安全中心。S15治疗光环为复用外环的明确美术提案，无新hazard。

BEACON现有impactWave在timer尝试时产生，即使预算为0；该波用B04/M10。B04/M03独立成功闪只在实际spawn UID时使用，不能在无小怪时画孩子。
