# 最终运行期 Boss 动作清单与 OPEN 制作规则

读取当前 getBossEditorBaseTemplate/enrichBossTemplate 的真实结果；不是只复制 gameConfig 基础阶段。自定义 authoredTemplate、编辑器导入模板仍可覆盖，制作时以当前遭遇运行值为准。

## COMMANDER / commander

- P1 列阵：summonFormation, commandLine
- P2 压阵：summonFormation, commandLine, shieldPulse, phalanxAdvance
- P3 破阵：summonFormation, shieldPulse, phalanxAdvance, commandRush

## HUNTER / hunter

- P1 试探：dashAtPlayer, markPrey
- P2 围猎：dashAtPlayer, markPrey, summonScouts, pincerRush
- P3 残猎：dashAtPlayer, markPrey, pincerRush, afterimageBurst, feintStrike

## FORTRESS / fortress

- P1 推城：summonSiege, bastionMortar
- P2 重甲：summonSiege, bastionMortar, fortify, shockRam
- P3 崩垒：summonSiege, fortify, shockRam, quake, bunkerRing

## PRISM / prism

- P1 折光：prismBeam, refractVolley
- P2 镜列：prismBeam, refractVolley, mirrorSummon, prismLattice
- P3 棱镜：prismBeam, mirrorSummon, prismLattice, tripleBeam, mirrorStep

## HIVE / hive

- P1 铺巢：spawnHive, broodShift
- P2 孵潮：spawnHive, broodShift, hivePulse, summonSwarm
- P3 迁巢：spawnHive, hivePulse, summonSwarm, hiveCollapse, broodShift

## FROST_JUDGE / frost

- P1 冰审：frostRing, whiteout
- P2 封判：frostRing, whiteout, freezeTower, glacialPrison
- P3 寒狱：frostRing, freezeTower, glacialPrison, summonFrostGuards, coldSnap

## RAIL_WARLORD / rail

- P1 锁线：railShot, crosshairBarrage
- P2 钉杀：railShot, markTower, crosshairBarrage, suppressiveGrid
- P3 歼灭：railShot, markTower, suppressiveGrid, overload, killLane

## COLLECTOR / collector

- P1 抽税：stealMoney, taxBeacon
- P2 搬运：stealMoney, taxBeacon, summonScouts, paydaySweep
- P3 收账：stealMoney, summonScouts, paydaySweep, ransomBurst, repossess

## TWINS / twins

- P1 同轨：twinOrbit, twinBolt
- P2 换位：twinOrbit, twinBolt, twinSwap
- P3 日蚀合击：twinOrbit, twinBolt, twinSwap, eclipsePulse

twinSun：
- P1 炽近：solarDash
- P2 灼线：solarDash, flareLance, twinCrossfire
- P3 日蚀：solarDash, flareLance, twinCrossfire, eclipsePulse

twinMoon：
- P1 月网：lunarSnare
- P2 锁域：lunarSnare, shadowArc, twinCrossfire
- P3 残月：lunarSnare, shadowArc, twinCrossfire, eclipsePulse

## DRAGON / dragon

- P1 盘旋：dragonStrafe, emberWake
- P2 俯冲：dragonStrafe, emberWake, wingBuffet, meteorRain
- P3 天火：dragonStrafe, wingBuffet, meteorRain, skyDive, infernoRing

## SPIDER_MATRIARCH / spider

- P1 织杀：webTrap, silkVolley
- P2 孵潮：webTrap, silkVolley, spawnSpiderlings, broodAmbush
- P3 巢域：webTrap, spawnSpiderlings, broodAmbush, nestBloom, webField

## ASTROLABE / astrolabe

- P1 引潮：gravityWell, starfall
- P2 轨域：gravityWell, orbitalShots, starfall, orbitalLock
- P3 奇点：gravityWell, orbitalShots, orbitalLock, singularity, eventHorizon

## BLOOD_FORGE / forge

- P1 铸火：forgeArmor, slagDrop
- P2 献炉：forgeArmor, slagDrop, sacrificeMinions, brandLine
- P3 过热：forgeArmor, sacrificeMinions, brandLine, moltenBurst, forgeDetonation

## VOID_CONDUCTOR / conductor

- P1 起拍：conductLines, pulseMeasure
- P2 切分：conductLines, pulseMeasure, tempoShift, syncopate
- P3 终章：conductLines, tempoShift, syncopate, finale, crescendo

## LABYRINTH_KEEPER / labyrinth

- P1 筑墙：raiseWalls, corridorClamp
- P2 换门：raiseWalls, corridorClamp, gateSwap, mazeFold
- P3 迷狱：raiseWalls, gateSwap, mazeFold, mazeCrush, deadEnd

## NIGHTMARE_BLOOM / bloom

- P1 播种：seedPods, blightRoots
- P2 绽瘴：seedPods, blightRoots, poisonBloom, sporeBurst
- P3 花园：seedPods, poisonBloom, sporeBurst, gardenWake, creepingCanopy

## OPEN 整体恢复易伤

恢复 actionMode=recover 时，bossCombatRuntime 将 profile.opening 应用到整个 Boss 的 damageTakenMultiplier；不是独立腹核命中判定。Prism 1.2、Astrolabe 1.35，指挥家1.25亦有整体恢复增伤。Commander两名以上护卫另乘0.7，Fortress非恢复状态0.8，因此不能把所有 OPEN 一概标为固定最终倍率。界面表现读取实际 damageTakenMultiplier>1，原画只给恢复姿态。

可破 SEAL/RETICLE 等节点在独立坐标且有自己的HP，目标塔标记与冻结覆盖是另一层，不将节点画成塔皮肤。孵化幼体复用实际珊瑚 BASIC。TWINS为独立日/月，幸存者替换交火能力为soloSolarVolley/soloLunarOrbit并有狂暴状态，不创造第四阶段。

所有变形仅用于美术，不改 hitbox、真实中心、弹体来源、判定宽度或结算时间。原画姿态不是完整动画帧表，也不是实战性能验证。
