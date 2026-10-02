# Actual skill dispatch coverage — preparation only

All 95 remain `not_run`. Pose sheets prove no runtime dispatch.

| # | Ability | Dispatcher | Default member/phase cases | Preconditions |
|---|---|---|---|---|
| 1 | afterimageBurst | fallback | C04-HUNTER-boss-P3-afterimageBurst | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 2 | bastionMortar | fallback | C04-FORTRESS-boss-P1-bastionMortar<br>C04-FORTRESS-boss-P2-bastionMortar | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 3 | blightRoots | fallback | C04-NIGHTMARE_BLOOM-boss-P1-blightRoots<br>C04-NIGHTMARE_BLOOM-boss-P2-blightRoots | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 4 | brandLine | fallback | C04-BLOOD_FORGE-boss-P2-brandLine<br>C04-BLOOD_FORGE-boss-P3-brandLine | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 5 | broodAmbush | fallback | C04-SPIDER_MATRIARCH-boss-P2-broodAmbush<br>C04-SPIDER_MATRIARCH-boss-P3-broodAmbush | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 6 | broodShift | optimized | C04-HIVE-boss-P1-broodShift<br>C04-HIVE-boss-P2-broodShift<br>C04-HIVE-boss-P3-broodShift | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 7 | bunkerRing | fallback | C04-FORTRESS-boss-P3-bunkerRing | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 8 | coldSnap | optimized | C04-FROST_JUDGE-boss-P3-coldSnap | Two live GUI towers; each seal has its own UID and correct targetUid |
| 9 | commandLine | fallback | C04-COMMANDER-boss-P1-commandLine<br>C04-COMMANDER-boss-P2-commandLine | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 10 | commandRush | fallback | C04-COMMANDER-boss-P3-commandRush | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 11 | conductLines | optimized | C04-VOID_CONDUCTOR-boss-P1-conductLines<br>C04-VOID_CONDUCTOR-boss-P2-conductLines<br>C04-VOID_CONDUCTOR-boss-P3-conductLines | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 12 | corridorClamp | fallback | C04-LABYRINTH_KEEPER-boss-P1-corridorClamp<br>C04-LABYRINTH_KEEPER-boss-P2-corridorClamp | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 13 | creepingCanopy | optimized | C04-NIGHTMARE_BLOOM-boss-P3-creepingCanopy | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 14 | crescendo | optimized | C04-VOID_CONDUCTOR-boss-P3-crescendo | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 15 | crosshairBarrage | fallback | C04-RAIL_WARLORD-boss-P1-crosshairBarrage<br>C04-RAIL_WARLORD-boss-P2-crosshairBarrage | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 16 | dashAtPlayer | fallback | C04-HUNTER-boss-P1-dashAtPlayer<br>C04-HUNTER-boss-P2-dashAtPlayer<br>C04-HUNTER-boss-P3-dashAtPlayer | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 17 | deadEnd | optimized | C04-LABYRINTH_KEEPER-boss-P3-deadEnd | Earlier default raiseWalls/gateSwap has produced surviving walls |
| 18 | dragonStrafe | fallback | C04-DRAGON-boss-P1-dragonStrafe<br>C04-DRAGON-boss-P2-dragonStrafe<br>C04-DRAGON-boss-P3-dragonStrafe | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 19 | eclipsePulse | fallback | C04-TWINS-sun-P3-eclipsePulse<br>C04-TWINS-moon-P3-eclipsePulse | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 20 | emberWake | fallback | C04-DRAGON-boss-P1-emberWake<br>C04-DRAGON-boss-P2-emberWake | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 21 | eventHorizon | fallback | C04-ASTROLABE-boss-P3-eventHorizon | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 22 | feintStrike | fallback | C04-HUNTER-boss-P3-feintStrike | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 23 | finale | optimized | C04-VOID_CONDUCTOR-boss-P3-finale | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 24 | flareLance | fallback | C04-TWINS-sun-P2-flareLance<br>C04-TWINS-sun-P3-flareLance | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 25 | forgeArmor | fallback | C04-BLOOD_FORGE-boss-P1-forgeArmor<br>C04-BLOOD_FORGE-boss-P2-forgeArmor<br>C04-BLOOD_FORGE-boss-P3-forgeArmor | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 26 | forgeDetonation | fallback | C04-BLOOD_FORGE-boss-P3-forgeDetonation | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 27 | fortify | fallback | C04-FORTRESS-boss-P2-fortify<br>C04-FORTRESS-boss-P3-fortify | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 28 | freezeTower | optimized | C04-FROST_JUDGE-boss-P2-freezeTower<br>C04-FROST_JUDGE-boss-P3-freezeTower | One live tower placed through GUI; preserve seal targetUid, frozenTimer and disappearance |
| 29 | frostRing | optimized | C04-FROST_JUDGE-boss-P1-frostRing<br>C04-FROST_JUDGE-boss-P2-frostRing<br>C04-FROST_JUDGE-boss-P3-frostRing | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 30 | gardenWake | optimized | C04-NIGHTMARE_BLOOM-boss-P3-gardenWake | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 31 | gateSwap | optimized | C04-LABYRINTH_KEEPER-boss-P2-gateSwap<br>C04-LABYRINTH_KEEPER-boss-P3-gateSwap | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 32 | glacialPrison | fallback | C04-FROST_JUDGE-boss-P2-glacialPrison<br>C04-FROST_JUDGE-boss-P3-glacialPrison | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 33 | gravityWell | optimized | C04-ASTROLABE-boss-P1-gravityWell<br>C04-ASTROLABE-boss-P2-gravityWell<br>C04-ASTROLABE-boss-P3-gravityWell | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 34 | hiveCollapse | optimized | C04-HIVE-boss-P3-hiveCollapse | Earlier default spawnHive has produced a surviving nest |
| 35 | hivePulse | optimized | C04-HIVE-boss-P2-hivePulse<br>C04-HIVE-boss-P3-hivePulse | Earlier default spawnHive has produced a surviving nest |
| 36 | infernoRing | fallback | C04-DRAGON-boss-P3-infernoRing | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 37 | killLane | fallback | C04-RAIL_WARLORD-boss-P3-killLane | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 38 | lunarSnare | fallback | C04-TWINS-moon-P1-lunarSnare<br>C04-TWINS-moon-P2-lunarSnare<br>C04-TWINS-moon-P3-lunarSnare | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 39 | markPrey | fallback | C04-HUNTER-boss-P1-markPrey<br>C04-HUNTER-boss-P2-markPrey<br>C04-HUNTER-boss-P3-markPrey | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 40 | markTower | optimized | C04-RAIL_WARLORD-boss-P2-markTower<br>C04-RAIL_WARLORD-boss-P3-markTower | One live tower placed through GUI; preserve reticle targetUid and firing/disappearance |
| 41 | mazeCrush | optimized | C04-LABYRINTH_KEEPER-boss-P3-mazeCrush | Earlier default raiseWalls has produced surviving walls |
| 42 | mazeFold | fallback | C04-LABYRINTH_KEEPER-boss-P2-mazeFold<br>C04-LABYRINTH_KEEPER-boss-P3-mazeFold | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 43 | meteorRain | fallback | C04-DRAGON-boss-P2-meteorRain<br>C04-DRAGON-boss-P3-meteorRain | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 44 | mirrorStep | optimized | C04-PRISM-boss-P3-mirrorStep | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 45 | mirrorSummon | fallback | C04-PRISM-boss-P2-mirrorSummon<br>C04-PRISM-boss-P3-mirrorSummon | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 46 | moltenBurst | fallback | C04-BLOOD_FORGE-boss-P3-moltenBurst | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 47 | nestBloom | optimized | C04-SPIDER_MATRIARCH-boss-P3-nestBloom | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 48 | orbitalLock | fallback | C04-ASTROLABE-boss-P2-orbitalLock<br>C04-ASTROLABE-boss-P3-orbitalLock | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 49 | orbitalShots | fallback | C04-ASTROLABE-boss-P2-orbitalShots<br>C04-ASTROLABE-boss-P3-orbitalShots | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 50 | overload | fallback | C04-RAIL_WARLORD-boss-P3-overload | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 51 | paydaySweep | fallback | C04-COLLECTOR-boss-P2-paydaySweep<br>C04-COLLECTOR-boss-P3-paydaySweep | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 52 | phalanxAdvance | fallback | C04-COMMANDER-boss-P2-phalanxAdvance<br>C04-COMMANDER-boss-P3-phalanxAdvance | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 53 | pincerRush | fallback | C04-HUNTER-boss-P2-pincerRush<br>C04-HUNTER-boss-P3-pincerRush | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 54 | poisonBloom | fallback | C04-NIGHTMARE_BLOOM-boss-P2-poisonBloom<br>C04-NIGHTMARE_BLOOM-boss-P3-poisonBloom | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 55 | prismBeam | fallback | C04-PRISM-boss-P1-prismBeam<br>C04-PRISM-boss-P2-prismBeam<br>C04-PRISM-boss-P3-prismBeam | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 56 | prismLattice | fallback | C04-PRISM-boss-P2-prismLattice<br>C04-PRISM-boss-P3-prismLattice | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 57 | pulseMeasure | optimized | C04-VOID_CONDUCTOR-boss-P1-pulseMeasure<br>C04-VOID_CONDUCTOR-boss-P2-pulseMeasure | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 58 | quake | optimized | C04-FORTRESS-boss-P3-quake | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 59 | railShot | fallback | C04-RAIL_WARLORD-boss-P1-railShot<br>C04-RAIL_WARLORD-boss-P2-railShot<br>C04-RAIL_WARLORD-boss-P3-railShot | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 60 | raiseWalls | optimized | C04-LABYRINTH_KEEPER-boss-P1-raiseWalls<br>C04-LABYRINTH_KEEPER-boss-P2-raiseWalls<br>C04-LABYRINTH_KEEPER-boss-P3-raiseWalls | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 61 | ransomBurst | fallback | C04-COLLECTOR-boss-P3-ransomBurst | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 62 | refractVolley | fallback | C04-PRISM-boss-P1-refractVolley<br>C04-PRISM-boss-P2-refractVolley | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 63 | repossess | optimized | C04-COLLECTOR-boss-P3-repossess | GUI Infinite Money OFF; money > 0; courier plus damage zone |
| 64 | sacrificeMinions | optimized | C04-BLOOD_FORGE-boss-P2-sacrificeMinions<br>C04-BLOOD_FORGE-boss-P3-sacrificeMinions | GUI spawn BASIC/TANK within 180 world units before windup; capture sacrificeTargets, real deaths, healing/shield and scaled zone |
| 65 | seedPods | optimized | C04-NIGHTMARE_BLOOM-boss-P1-seedPods<br>C04-NIGHTMARE_BLOOM-boss-P2-seedPods<br>C04-NIGHTMARE_BLOOM-boss-P3-seedPods | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 66 | shadowArc | fallback | C04-TWINS-moon-P2-shadowArc<br>C04-TWINS-moon-P3-shadowArc | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 67 | shieldPulse | fallback | C04-COMMANDER-boss-P2-shieldPulse<br>C04-COMMANDER-boss-P3-shieldPulse | Live nearby nonboss enemy; capture changed shield/maxShield/armoredTimer |
| 68 | shockRam | fallback | C04-FORTRESS-boss-P2-shockRam<br>C04-FORTRESS-boss-P3-shockRam | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 69 | silkVolley | optimized | C04-SPIDER_MATRIARCH-boss-P1-silkVolley<br>C04-SPIDER_MATRIARCH-boss-P2-silkVolley | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 70 | singularity | optimized | C04-ASTROLABE-boss-P3-singularity | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 71 | skyDive | optimized | C04-DRAGON-boss-P3-skyDive | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 72 | slagDrop | fallback | C04-BLOOD_FORGE-boss-P1-slagDrop<br>C04-BLOOD_FORGE-boss-P2-slagDrop | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 73 | solarDash | fallback | C04-TWINS-sun-P1-solarDash<br>C04-TWINS-sun-P2-solarDash<br>C04-TWINS-sun-P3-solarDash | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 74 | soloLunarOrbit | optimized | TWINS moon after real partner defeat | GUI Wave 1; real combat kills SUN; MOON partnerFallen=true; no HP setters |
| 75 | soloSolarVolley | optimized | TWINS sun after real partner defeat | GUI Wave 1; real combat kills MOON; SUN partnerFallen=true; no HP setters |
| 76 | spawnHive | optimized | C04-HIVE-boss-P1-spawnHive<br>C04-HIVE-boss-P2-spawnHive<br>C04-HIVE-boss-P3-spawnHive | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 77 | spawnSpiderlings | fallback | C04-SPIDER_MATRIARCH-boss-P2-spawnSpiderlings<br>C04-SPIDER_MATRIARCH-boss-P3-spawnSpiderlings | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 78 | sporeBurst | fallback | C04-NIGHTMARE_BLOOM-boss-P2-sporeBurst<br>C04-NIGHTMARE_BLOOM-boss-P3-sporeBurst | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 79 | starfall | fallback | C04-ASTROLABE-boss-P1-starfall<br>C04-ASTROLABE-boss-P2-starfall | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 80 | stealMoney | optimized | C04-COLLECTOR-boss-P1-stealMoney<br>C04-COLLECTOR-boss-P2-stealMoney<br>C04-COLLECTOR-boss-P3-stealMoney | GUI Infinite Money OFF; money > 0; courier spawn and independent movement/cargo |
| 81 | summonFormation | fallback | C04-COMMANDER-boss-P1-summonFormation<br>C04-COMMANDER-boss-P2-summonFormation<br>C04-COMMANDER-boss-P3-summonFormation | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 82 | summonFrostGuards | fallback | C04-FROST_JUDGE-boss-P3-summonFrostGuards | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 83 | summonScouts | fallback | C04-HUNTER-boss-P2-summonScouts<br>C04-COLLECTOR-boss-P2-summonScouts<br>C04-COLLECTOR-boss-P3-summonScouts | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 84 | summonSiege | fallback | C04-FORTRESS-boss-P1-summonSiege<br>C04-FORTRESS-boss-P2-summonSiege<br>C04-FORTRESS-boss-P3-summonSiege | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 85 | summonSwarm | fallback | C04-HIVE-boss-P2-summonSwarm<br>C04-HIVE-boss-P3-summonSwarm | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 86 | suppressiveGrid | fallback | C04-RAIL_WARLORD-boss-P2-suppressiveGrid<br>C04-RAIL_WARLORD-boss-P3-suppressiveGrid | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 87 | syncopate | optimized | C04-VOID_CONDUCTOR-boss-P2-syncopate<br>C04-VOID_CONDUCTOR-boss-P3-syncopate | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 88 | taxBeacon | optimized | C04-COLLECTOR-boss-P1-taxBeacon<br>C04-COLLECTOR-boss-P2-taxBeacon | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 89 | tempoShift | optimized | C04-VOID_CONDUCTOR-boss-P2-tempoShift<br>C04-VOID_CONDUCTOR-boss-P3-tempoShift | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 90 | tripleBeam | fallback | C04-PRISM-boss-P3-tripleBeam | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 91 | twinCrossfire | fallback | C04-TWINS-sun-P2-twinCrossfire<br>C04-TWINS-moon-P2-twinCrossfire<br>C04-TWINS-sun-P3-twinCrossfire<br>C04-TWINS-moon-P3-twinCrossfire | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 92 | webField | optimized | C04-SPIDER_MATRIARCH-boss-P3-webField | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 93 | webTrap | optimized | C04-SPIDER_MATRIARCH-boss-P1-webTrap<br>C04-SPIDER_MATRIARCH-boss-P2-webTrap<br>C04-SPIDER_MATRIARCH-boss-P3-webTrap | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 94 | whiteout | fallback | C04-FROST_JUDGE-boss-P1-whiteout<br>C04-FROST_JUDGE-boss-P2-whiteout | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
| 95 | wingBuffet | optimized | C04-DRAGON-boss-P2-wingBuffet<br>C04-DRAGON-boss-P3-wingBuffet | Use original default scheduler; retain preceding casts and their entities; inspect effect against source |
