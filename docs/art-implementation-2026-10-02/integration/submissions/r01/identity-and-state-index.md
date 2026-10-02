# 48 身份与 375 状态复用索引

完整逐条合同见 state-reuse-375.json；原画定位不是裁切矩形。运行 ID 由当前模块实例化导出。

|美术身份|实际运行 ID|条目|动作/状态|
|---|---|---:|---|
|tower:BASIC|BASIC|11|NEUTRAL / SQUASH / STRETCH / ATTACK / DIR_LEFT / DIR_UP / DIR_RIGHT / LV1 / LV2 / LV3 / LV4|
|tower:CANNON|CANNON|11|NEUTRAL / SQUASH / STRETCH / ATTACK / DIR_LEFT / DIR_UP / DIR_RIGHT / LV1 / LV2 / LV3 / LV4|
|tower:SNIPER|SNIPER|11|NEUTRAL / SQUASH / STRETCH / ATTACK / DIR_LEFT / DIR_UP / DIR_RIGHT / LV1 / LV2 / LV3 / LV4|
|tower:RAPID|RAPID|11|NEUTRAL / SQUASH / STRETCH / ATTACK / DIR_LEFT / DIR_UP / DIR_RIGHT / LV1 / LV2 / LV3 / LV4|
|tower:MORTAR|MORTAR|11|NEUTRAL / SQUASH / STRETCH / ATTACK / DIR_LEFT / DIR_UP / DIR_RIGHT / LV1 / LV2 / LV3 / LV4|
|tower:FROST|FROST|11|NEUTRAL / SQUASH / STRETCH / ATTACK / DIR_LEFT / DIR_UP / DIR_RIGHT / LV1 / LV2 / LV3 / LV4|
|tower:RAIL|RAIL|11|NEUTRAL / SQUASH / STRETCH / ATTACK / DIR_LEFT / DIR_UP / DIR_RIGHT / LV1 / LV2 / LV3 / LV4|
|tower:BURST|BURST|11|NEUTRAL / SQUASH / STRETCH / ATTACK / DIR_LEFT / DIR_UP / DIR_RIGHT / LV1 / LV2 / LV3 / LV4|
|tower:SENTINEL|SENTINEL|11|NEUTRAL / SQUASH / STRETCH / ATTACK / DIR_LEFT / DIR_UP / DIR_RIGHT / LV1 / LV2 / LV3 / LV4|
|hero:PLAYER|PLAYER|7|NEUTRAL / SQUASH / STRETCH / DIR_LEFT / DIR_RIGHT / AUTO_ATTACK / ATTACK|
|enemy:BASIC|BASIC|5|NEUTRAL / MOVE / SQUASH / STRETCH / ATTACK|
|enemy:FAST|FAST|6|NEUTRAL / MOVE / SQUASH / STRETCH / RUN / ATTACK|
|enemy:TANK|TANK|6|NEUTRAL / MOVE / SQUASH / STRETCH / HEAVY_MOVE / ATTACK|
|enemy:SHARD|SHARD|5|NEUTRAL / MOVE / SQUASH / STRETCH / SPLIT_3|
|enemy:SPLINTER|SPLINTER|6|NEUTRAL / MOVE / SQUASH / STRETCH / HOP / ATTACK|
|enemy:SHIELD|SHIELD|6|NEUTRAL / MOVE / SQUASH / STRETCH / GUARD / ATTACK|
|enemy:MEDIC|MEDIC|6|NEUTRAL / MOVE / SQUASH / STRETCH / HEAL / ATTACK|
|enemy:BOMBER|BOMBER|6|NEUTRAL / MOVE / SQUASH / STRETCH / INFLATE / ATTACK|
|enemy:JAMMER|JAMMER|6|NEUTRAL / MOVE / SQUASH / STRETCH / JAM / ATTACK|
|enemy:PHASE|PHASE|5|NEUTRAL / MOVE / SQUASH / STRETCH / PHASE_DASH|
|enemy:BURROWER|BURROWER|5|NEUTRAL / MOVE / SQUASH / STRETCH / EMERGE|
|enemy:BEACON|BEACON|5|NEUTRAL / MOVE / SQUASH / STRETCH / SUMMON_3_BASIC|
|enemy:SCOUT|SCOUT|5|NEUTRAL / MOVE / SQUASH / STRETCH / CHASE_PLAYER|
|enemy:SIEGE|SIEGE|5|NEUTRAL / MOVE / SQUASH / STRETCH / STRIKE_TOWER|
|boss:COMMANDER|COMMANDER, COMMANDER_T1, COMMANDER_T2, COMMANDER_T3|9|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / ADVANCE / SHIELD / DASH|
|boss:HUNTER|HUNTER, HUNTER_T1, HUNTER_T2, HUNTER_T3|9|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / PROBE / PINCER / AFTERIMAGE|
|boss:FORTRESS|FORTRESS, FORTRESS_T1, FORTRESS_T2, FORTRESS_T3|9|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / SIEGE / ARMOR / QUAKE|
|boss:PRISM|PRISM, PRISM_T1, PRISM_T2, PRISM_T3|9|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / BEAM / MIRRORS / TRIPLE|
|boss:HIVE|HIVE, HIVE_T1, HIVE_T2, HIVE_T3|9|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / NEST / HATCH / SWARM|
|boss:FROST_JUDGE|FROST_JUDGE, FROST_JUDGE_T1, FROST_JUDGE_T2, FROST_JUDGE_T3|9|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / RING / FREEZE / STORM|
|boss:RAIL_WARLORD|RAIL_WARLORD, RAIL_WARLORD_T1, RAIL_WARLORD_T2, RAIL_WARLORD_T3|9|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / MARK / SNIPE / OVERLOAD|
|boss:COLLECTOR|COLLECTOR, COLLECTOR_T1, COLLECTOR_T2, COLLECTOR_T3|9|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / TAX / ESCORT / RANSOM|
|boss:TWINS_SUN|TWIN_SOL|11|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / SOLO / ORBIT / SWAP / ECLIPSE / SOLO_SUN|
|boss:TWINS_MOON|TWIN_LUNA|11|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / SOLO / ORBIT / SWAP / ECLIPSE / SOLO_MOON|
|boss:DRAGON|DRAGON, DRAGON_T1, DRAGON_T2, DRAGON_T3|14|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / BREATH / TAIL / METEOR / STRAFE / EMBER_WAKE / WING_BUFFET / SKY_DIVE / INFERNO_RING|
|boss:SPIDER_MATRIARCH|SPIDER_MATRIARCH, SPIDER_MATRIARCH_T1, SPIDER_MATRIARCH_T2, SPIDER_MATRIARCH_T3|9|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / WEB / BROOD / FIELD|
|boss:ASTROLABE|ASTROLABE, ASTROLABE_T1, ASTROLABE_T2, ASTROLABE_T3|9|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / WELL / ORBIT / SINGULARITY|
|boss:BLOOD_FORGE|BLOOD_FORGE, BLOOD_FORGE_T1, BLOOD_FORGE_T2, BLOOD_FORGE_T3|9|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / ARMOR / SACRIFICE / OVERHEAT|
|boss:VOID_CONDUCTOR|VOID_CONDUCTOR, VOID_CONDUCTOR_T1, VOID_CONDUCTOR_T2, VOID_CONDUCTOR_T3|11|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / PULSE_MEASURE / SYNCOPATE / CRESCENDO / TWO_BEAT / FINALE|
|boss:LABYRINTH_KEEPER|LABYRINTH_KEEPER, LABYRINTH_KEEPER_T1, LABYRINTH_KEEPER_T2, LABYRINTH_KEEPER_T3|9|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / WALL / GATE / COMPRESS|
|boss:NIGHTMARE_BLOOM|NIGHTMARE_BLOOM, NIGHTMARE_BLOOM_T1, NIGHTMARE_BLOOM_T2, NIGHTMARE_BLOOM_T3|9|NEUTRAL / WINDUP / OPEN / P1 / P2 / P3 / SEED / BLOOM / GARDEN|
|mechanic:NEST|MECHANIC_NEST|4|INTACT / TRIGGER / BROKEN / FADE|
|mechanic:WEB|MECHANIC_WEB|4|INTACT / TRIGGER / BROKEN / FADE|
|mechanic:ROOT|MECHANIC_ROOT|4|INTACT / TRIGGER / BROKEN / FADE|
|mechanic:WALL|MECHANIC_WALL|4|INTACT / TRIGGER / BROKEN / FADE|
|mechanic:SEAL|MECHANIC_SEAL|4|INTACT / TRIGGER / BROKEN / FADE|
|mechanic:RETICLE|MECHANIC_RETICLE|4|INTACT / TRIGGER / BROKEN / FADE|
|mechanic:COURIER|MECHANIC_COURIER|4|INTACT / TRIGGER / BROKEN / FADE|

## 每条复用索引

|key|原画复用方式|身体参照标签|实际触发|
|---|---|---|---|
|tower:BASIC/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|tower:BASIC/SQUASH|direct_concept_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:BASIC/STRETCH|direct_concept_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:BASIC/ATTACK|direct_concept_cell|ATTACK|actual successful shot event; do not infer from cooldown alone|
|tower:BASIC/DIR_LEFT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:BASIC/DIR_UP|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:BASIC/DIR_RIGHT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:BASIC/LV1|body_plus_external_level_badge|NEUTRAL|read level=0; body reused; independent badge; no stat mutation|
|tower:BASIC/LV2|body_plus_external_level_badge|NEUTRAL|read level=1; body reused; independent badge; no stat mutation|
|tower:BASIC/LV3|body_plus_external_level_badge|NEUTRAL|read level=2; body reused; independent badge; no stat mutation|
|tower:BASIC/LV4|body_plus_external_level_badge|NEUTRAL|read level=3; body reused; independent badge; no stat mutation|
|tower:CANNON/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|tower:CANNON/SQUASH|direct_concept_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:CANNON/STRETCH|direct_concept_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:CANNON/ATTACK|direct_concept_cell|ATTACK|actual successful shot event; do not infer from cooldown alone|
|tower:CANNON/DIR_LEFT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:CANNON/DIR_UP|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:CANNON/DIR_RIGHT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:CANNON/LV1|body_plus_external_level_badge|NEUTRAL|read level=0; body reused; independent badge; no stat mutation|
|tower:CANNON/LV2|body_plus_external_level_badge|NEUTRAL|read level=1; body reused; independent badge; no stat mutation|
|tower:CANNON/LV3|body_plus_external_level_badge|NEUTRAL|read level=2; body reused; independent badge; no stat mutation|
|tower:CANNON/LV4|body_plus_external_level_badge|NEUTRAL|read level=3; body reused; independent badge; no stat mutation|
|tower:SNIPER/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|tower:SNIPER/SQUASH|direct_concept_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:SNIPER/STRETCH|direct_concept_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:SNIPER/ATTACK|direct_concept_cell|ATTACK|actual successful shot event; do not infer from cooldown alone|
|tower:SNIPER/DIR_LEFT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:SNIPER/DIR_UP|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:SNIPER/DIR_RIGHT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:SNIPER/LV1|body_plus_external_level_badge|NEUTRAL|read level=0; body reused; independent badge; no stat mutation|
|tower:SNIPER/LV2|body_plus_external_level_badge|NEUTRAL|read level=1; body reused; independent badge; no stat mutation|
|tower:SNIPER/LV3|body_plus_external_level_badge|NEUTRAL|read level=2; body reused; independent badge; no stat mutation|
|tower:SNIPER/LV4|body_plus_external_level_badge|NEUTRAL|read level=3; body reused; independent badge; no stat mutation|
|tower:RAPID/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|tower:RAPID/SQUASH|direct_concept_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:RAPID/STRETCH|direct_concept_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:RAPID/ATTACK|direct_concept_cell|ATTACK|actual successful shot event; do not infer from cooldown alone|
|tower:RAPID/DIR_LEFT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:RAPID/DIR_UP|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:RAPID/DIR_RIGHT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:RAPID/LV1|body_plus_external_level_badge|NEUTRAL|read level=0; body reused; independent badge; no stat mutation|
|tower:RAPID/LV2|body_plus_external_level_badge|NEUTRAL|read level=1; body reused; independent badge; no stat mutation|
|tower:RAPID/LV3|body_plus_external_level_badge|NEUTRAL|read level=2; body reused; independent badge; no stat mutation|
|tower:RAPID/LV4|body_plus_external_level_badge|NEUTRAL|read level=3; body reused; independent badge; no stat mutation|
|tower:MORTAR/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|tower:MORTAR/SQUASH|direct_concept_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:MORTAR/STRETCH|direct_concept_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:MORTAR/ATTACK|direct_concept_cell|ATTACK|actual successful shot event; do not infer from cooldown alone|
|tower:MORTAR/DIR_LEFT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:MORTAR/DIR_UP|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:MORTAR/DIR_RIGHT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:MORTAR/LV1|body_plus_external_level_badge|NEUTRAL|read level=0; body reused; independent badge; no stat mutation|
|tower:MORTAR/LV2|body_plus_external_level_badge|NEUTRAL|read level=1; body reused; independent badge; no stat mutation|
|tower:MORTAR/LV3|body_plus_external_level_badge|NEUTRAL|read level=2; body reused; independent badge; no stat mutation|
|tower:MORTAR/LV4|body_plus_external_level_badge|NEUTRAL|read level=3; body reused; independent badge; no stat mutation|
|tower:FROST/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|tower:FROST/SQUASH|direct_concept_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:FROST/STRETCH|direct_concept_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:FROST/ATTACK|direct_concept_cell|ATTACK|actual successful shot event; do not infer from cooldown alone|
|tower:FROST/DIR_LEFT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:FROST/DIR_UP|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:FROST/DIR_RIGHT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:FROST/LV1|body_plus_external_level_badge|NEUTRAL|read level=0; body reused; independent badge; no stat mutation|
|tower:FROST/LV2|body_plus_external_level_badge|NEUTRAL|read level=1; body reused; independent badge; no stat mutation|
|tower:FROST/LV3|body_plus_external_level_badge|NEUTRAL|read level=2; body reused; independent badge; no stat mutation|
|tower:FROST/LV4|body_plus_external_level_badge|NEUTRAL|read level=3; body reused; independent badge; no stat mutation|
|tower:RAIL/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|tower:RAIL/SQUASH|direct_concept_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:RAIL/STRETCH|direct_concept_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:RAIL/ATTACK|direct_concept_cell|ATTACK|actual successful shot event; do not infer from cooldown alone|
|tower:RAIL/DIR_LEFT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:RAIL/DIR_UP|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:RAIL/DIR_RIGHT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:RAIL/LV1|body_plus_external_level_badge|NEUTRAL|read level=0; body reused; independent badge; no stat mutation|
|tower:RAIL/LV2|body_plus_external_level_badge|NEUTRAL|read level=1; body reused; independent badge; no stat mutation|
|tower:RAIL/LV3|body_plus_external_level_badge|NEUTRAL|read level=2; body reused; independent badge; no stat mutation|
|tower:RAIL/LV4|body_plus_external_level_badge|NEUTRAL|read level=3; body reused; independent badge; no stat mutation|
|tower:BURST/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|tower:BURST/SQUASH|direct_concept_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:BURST/STRETCH|direct_concept_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:BURST/ATTACK|direct_concept_cell|ATTACK|actual successful shot event; do not infer from cooldown alone|
|tower:BURST/DIR_LEFT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:BURST/DIR_UP|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:BURST/DIR_RIGHT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:BURST/LV1|body_plus_external_level_badge|NEUTRAL|read level=0; body reused; independent badge; no stat mutation|
|tower:BURST/LV2|body_plus_external_level_badge|NEUTRAL|read level=1; body reused; independent badge; no stat mutation|
|tower:BURST/LV3|body_plus_external_level_badge|NEUTRAL|read level=2; body reused; independent badge; no stat mutation|
|tower:BURST/LV4|body_plus_external_level_badge|NEUTRAL|read level=3; body reused; independent badge; no stat mutation|
|tower:SENTINEL/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|tower:SENTINEL/SQUASH|direct_concept_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:SENTINEL/STRETCH|direct_concept_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|tower:SENTINEL/ATTACK|direct_concept_cell|ATTACK|actual successful shot event; do not infer from cooldown alone|
|tower:SENTINEL/DIR_LEFT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:SENTINEL/DIR_UP|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:SENTINEL/DIR_RIGHT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|tower:SENTINEL/LV1|body_plus_external_level_badge|NEUTRAL|read level=0; body reused; independent badge; no stat mutation|
|tower:SENTINEL/LV2|body_plus_external_level_badge|NEUTRAL|read level=1; body reused; independent badge; no stat mutation|
|tower:SENTINEL/LV3|body_plus_external_level_badge|NEUTRAL|read level=2; body reused; independent badge; no stat mutation|
|tower:SENTINEL/LV4|body_plus_external_level_badge|NEUTRAL|read level=3; body reused; independent badge; no stat mutation|
|hero:PLAYER/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|hero:PLAYER/SQUASH|direct_concept_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|hero:PLAYER/STRETCH|direct_concept_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|hero:PLAYER/DIR_LEFT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|hero:PLAYER/DIR_RIGHT|direction_construction|NEUTRAL|view aim orientation; derive from real shot angle/retained orientation; no new aiming rule|
|hero:PLAYER/AUTO_ATTACK|explicit_body_pose_reuse|ATTACK|actual successful shot event; do not infer from cooldown alone|
|hero:PLAYER/ATTACK|direct_concept_cell|ATTACK|actual successful shot event; do not infer from cooldown alone|
|enemy:BASIC/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:BASIC/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + SQUASH + STRETCH + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:BASIC/SQUASH|direct_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:BASIC/STRETCH|direct_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:BASIC/ATTACK|same_body_plus_independent_feedback|NEUTRAL|接触时局部身体紧张/前倾；不产生弹体、不用美术帧结算伤害|
|enemy:FAST/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:FAST/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + SQUASH + STRETCH + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:FAST/SQUASH|direct_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:FAST/STRETCH|direct_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:FAST/RUN|direct_cell|RUN / CONTACT|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:FAST/ATTACK|direct_cell|RUN / CONTACT|接触时局部身体紧张/前倾；不产生弹体、不用美术帧结算伤害|
|enemy:TANK/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:TANK/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + SQUASH + STRETCH + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:TANK/SQUASH|direct_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:TANK/STRETCH|direct_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:TANK/HEAVY_MOVE|same_body_pose_reuse|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:TANK/ATTACK|direct_cell|CONTACT|接触时局部身体紧张/前倾；不产生弹体、不用美术帧结算伤害|
|enemy:SHARD/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:SHARD/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + SQUASH + STRETCH + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SHARD/SQUASH|direct_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SHARD/STRETCH|direct_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SHARD/SPLIT_3|direct_cell|PRE-SPLIT BODY|SHARD死亡结算请求独立SPLINTER；不是存活身体分成三个器官|
|enemy:SPLINTER/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:SPLINTER/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + SQUASH + STRETCH + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SPLINTER/SQUASH|direct_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SPLINTER/STRETCH|direct_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SPLINTER/HOP|direct_cell|HOP / CONTACT|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SPLINTER/ATTACK|direct_cell|HOP / CONTACT|接触时局部身体紧张/前倾；不产生弹体、不用美术帧结算伤害|
|enemy:SHIELD/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:SHIELD/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + SQUASH + STRETCH + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SHIELD/SQUASH|direct_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SHIELD/STRETCH|direct_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SHIELD/GUARD|direct_cell|GUARD / CONTACT|SHIELD软肉盾瓣随父级变形；shield数值反馈为独立状态层|
|enemy:SHIELD/ATTACK|direct_cell|GUARD / CONTACT|接触时局部身体紧张/前倾；不产生弹体、不用美术帧结算伤害|
|enemy:MEDIC/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:MEDIC/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + SQUASH + STRETCH + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:MEDIC/SQUASH|direct_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:MEDIC/STRETCH|direct_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:MEDIC/HEAL|direct_cell|HEAL / CONTACT|MEDIC身体脉动复用常态/拉伸；持续范围治疗，不新增蓄力攻击窗口|
|enemy:MEDIC/ATTACK|direct_cell|HEAL / CONTACT|接触时局部身体紧张/前倾；不产生弹体、不用美术帧结算伤害|
|enemy:BOMBER/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:BOMBER/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + SQUASH + STRETCH + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:BOMBER/SQUASH|direct_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:BOMBER/STRETCH|direct_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:BOMBER/INFLATE|direct_cell|INFLATE / CONTACT|BOMBER接触后fuseTimer期间局部充气，复用STRETCH；不改变判定范围|
|enemy:BOMBER/ATTACK|direct_cell|INFLATE / CONTACT|接触时局部身体紧张/前倾；不产生弹体、不用美术帧结算伤害|
|enemy:JAMMER/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:JAMMER/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + SQUASH + STRETCH + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:JAMMER/SQUASH|direct_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:JAMMER/STRETCH|direct_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:JAMMER/JAM|direct_cell|JAM / CONTACT|JAMMER天线局部屈曲；干扰持续影响塔射速，不生成独立实体或射弹|
|enemy:JAMMER/ATTACK|direct_cell|JAM / CONTACT|接触时局部身体紧张/前倾；不产生弹体、不用美术帧结算伤害|
|enemy:PHASE/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:PHASE/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + SQUASH + STRETCH + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:PHASE/SQUASH|direct_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:PHASE/STRETCH|direct_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:PHASE/PHASE_DASH|direct_cell|PHASE BODY|图册名；实际phased定时切换+正常追踪移动，不能新增dash/瞬移|
|enemy:BURROWER/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:BURROWER/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + SQUASH + STRETCH + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:BURROWER/SQUASH|direct_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:BURROWER/STRETCH|direct_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:BURROWER/EMERGE|direct_cell|EMERGE BODY|同一BURROWER从地下显现的前后时序；不复制成两只、不新增水平位移|
|enemy:BEACON/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:BEACON/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + WINDUP + TRIGGER + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:BEACON/SQUASH|direct_cell|WINDUP|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:BEACON/STRETCH|direct_cell|TRIGGER|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:BEACON/SUMMON_3_BASIC|body_subposes_plus_independent_spawn_event|WINDUP + TRIGGER + RECOVER|BEACON自身summonTimer到期；身体蓄力/触发/恢复仅表现；请求3个独立BASIC|
|enemy:SCOUT/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:SCOUT/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + SQUASH + STRETCH + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SCOUT/SQUASH|direct_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SCOUT/STRETCH|direct_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SCOUT/CHASE_PLAYER|direct_cell|CHASE BODY|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SIEGE/NEUTRAL|direct_cell|NEUTRAL|既有实体更新；SQUASH/STRETCH为图册形变检查；MOVE以真实速度作为播放建议，当前无命名动画控制器|
|enemy:SIEGE/MOVE|explicit_in_place_cycle_reuse|NEUTRAL + SQUASH + STRETCH + NEUTRAL|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SIEGE/SQUASH|direct_cell|SQUASH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SIEGE/STRETCH|direct_cell|STRETCH|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|enemy:SIEGE/STRIKE_TOWER|direct_cell|STRIKE BODY|in-place cycle/subpose driven by observed displacement/contact; no art-authored world motion|
|boss:COMMANDER/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:COMMANDER/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in summonFormation, commandLine, shieldPulse, phalanxAdvance, commandRush; pose gated by actionMode|
|boss:COMMANDER/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:COMMANDER/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in summonFormation, commandLine; pose gated by actionMode|
|boss:COMMANDER/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in summonFormation, commandLine, shieldPulse, phalanxAdvance; pose gated by actionMode|
|boss:COMMANDER/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in summonFormation, shieldPulse, phalanxAdvance, commandRush; pose gated by actionMode|
|boss:COMMANDER/ADVANCE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in summonFormation, commandLine, phalanxAdvance; pose gated by actionMode|
|boss:COMMANDER/SHIELD|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in shieldPulse; pose gated by actionMode|
|boss:COMMANDER/DASH|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in commandRush; pose gated by actionMode|
|boss:HUNTER/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:HUNTER/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in dashAtPlayer, markPrey, summonScouts, pincerRush, afterimageBurst, feintStrike; pose gated by actionMode|
|boss:HUNTER/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:HUNTER/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in dashAtPlayer, markPrey; pose gated by actionMode|
|boss:HUNTER/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in dashAtPlayer, markPrey, summonScouts, pincerRush; pose gated by actionMode|
|boss:HUNTER/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in dashAtPlayer, markPrey, pincerRush, afterimageBurst, feintStrike; pose gated by actionMode|
|boss:HUNTER/PROBE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in dashAtPlayer, markPrey; pose gated by actionMode|
|boss:HUNTER/PINCER|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in summonScouts, pincerRush; pose gated by actionMode|
|boss:HUNTER/AFTERIMAGE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in afterimageBurst, feintStrike; pose gated by actionMode|
|boss:FORTRESS/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:FORTRESS/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in summonSiege, bastionMortar, fortify, shockRam, quake, bunkerRing; pose gated by actionMode|
|boss:FORTRESS/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:FORTRESS/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in summonSiege, bastionMortar; pose gated by actionMode|
|boss:FORTRESS/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in summonSiege, bastionMortar, fortify, shockRam; pose gated by actionMode|
|boss:FORTRESS/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in summonSiege, fortify, shockRam, quake, bunkerRing; pose gated by actionMode|
|boss:FORTRESS/SIEGE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in summonSiege, bastionMortar; pose gated by actionMode|
|boss:FORTRESS/ARMOR|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in fortify, shockRam; pose gated by actionMode|
|boss:FORTRESS/QUAKE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in quake, bunkerRing; pose gated by actionMode|
|boss:PRISM/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:PRISM/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in prismBeam, refractVolley, mirrorSummon, prismLattice, tripleBeam, mirrorStep; pose gated by actionMode|
|boss:PRISM/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:PRISM/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in prismBeam, refractVolley; pose gated by actionMode|
|boss:PRISM/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in prismBeam, refractVolley, mirrorSummon, prismLattice; pose gated by actionMode|
|boss:PRISM/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in prismBeam, mirrorSummon, prismLattice, tripleBeam, mirrorStep; pose gated by actionMode|
|boss:PRISM/BEAM|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in prismBeam, refractVolley; pose gated by actionMode|
|boss:PRISM/MIRRORS|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in mirrorSummon, prismLattice, mirrorStep; pose gated by actionMode|
|boss:PRISM/TRIPLE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in tripleBeam; pose gated by actionMode|
|boss:HIVE/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:HIVE/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in spawnHive, broodShift, hivePulse, summonSwarm, hiveCollapse; pose gated by actionMode|
|boss:HIVE/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:HIVE/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in spawnHive, broodShift; pose gated by actionMode|
|boss:HIVE/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in spawnHive, broodShift, hivePulse, summonSwarm; pose gated by actionMode|
|boss:HIVE/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in spawnHive, hivePulse, summonSwarm, hiveCollapse, broodShift; pose gated by actionMode|
|boss:HIVE/NEST|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in spawnHive, broodShift; pose gated by actionMode|
|boss:HIVE/HATCH|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in mechanic:nest:trigger; pose gated by actionMode|
|boss:HIVE/SWARM|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in summonSwarm, hivePulse, hiveCollapse; pose gated by actionMode|
|boss:FROST_JUDGE/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:FROST_JUDGE/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in frostRing, whiteout, freezeTower, glacialPrison, summonFrostGuards, coldSnap; pose gated by actionMode|
|boss:FROST_JUDGE/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:FROST_JUDGE/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in frostRing, whiteout; pose gated by actionMode|
|boss:FROST_JUDGE/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in frostRing, whiteout, freezeTower, glacialPrison; pose gated by actionMode|
|boss:FROST_JUDGE/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in frostRing, freezeTower, glacialPrison, summonFrostGuards, coldSnap; pose gated by actionMode|
|boss:FROST_JUDGE/RING|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in frostRing, whiteout; pose gated by actionMode|
|boss:FROST_JUDGE/FREEZE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in freezeTower, glacialPrison, coldSnap; pose gated by actionMode|
|boss:FROST_JUDGE/STORM|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in summonFrostGuards, whiteout, coldSnap; pose gated by actionMode|
|boss:RAIL_WARLORD/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:RAIL_WARLORD/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in railShot, crosshairBarrage, markTower, suppressiveGrid, overload, killLane; pose gated by actionMode|
|boss:RAIL_WARLORD/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:RAIL_WARLORD/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in railShot, crosshairBarrage; pose gated by actionMode|
|boss:RAIL_WARLORD/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in railShot, markTower, crosshairBarrage, suppressiveGrid; pose gated by actionMode|
|boss:RAIL_WARLORD/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in railShot, markTower, suppressiveGrid, overload, killLane; pose gated by actionMode|
|boss:RAIL_WARLORD/MARK|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in markTower, crosshairBarrage; pose gated by actionMode|
|boss:RAIL_WARLORD/SNIPE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in railShot, suppressiveGrid; pose gated by actionMode|
|boss:RAIL_WARLORD/OVERLOAD|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in overload, killLane; pose gated by actionMode|
|boss:COLLECTOR/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:COLLECTOR/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in stealMoney, taxBeacon, summonScouts, paydaySweep, ransomBurst, repossess; pose gated by actionMode|
|boss:COLLECTOR/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:COLLECTOR/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in stealMoney, taxBeacon; pose gated by actionMode|
|boss:COLLECTOR/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in stealMoney, taxBeacon, summonScouts, paydaySweep; pose gated by actionMode|
|boss:COLLECTOR/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in stealMoney, summonScouts, paydaySweep, ransomBurst, repossess; pose gated by actionMode|
|boss:COLLECTOR/TAX|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in stealMoney, taxBeacon; pose gated by actionMode|
|boss:COLLECTOR/ESCORT|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in summonScouts, paydaySweep; pose gated by actionMode|
|boss:COLLECTOR/RANSOM|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in ransomBurst, repossess; pose gated by actionMode|
|boss:TWINS_SUN/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:TWINS_SUN/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in solarDash, flareLance, twinCrossfire, eclipsePulse; pose gated by actionMode|
|boss:TWINS_SUN/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:TWINS_SUN/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in solarDash; pose gated by actionMode|
|boss:TWINS_SUN/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in solarDash, flareLance, twinCrossfire; pose gated by actionMode|
|boss:TWINS_SUN/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in solarDash, flareLance, twinCrossfire, eclipsePulse; pose gated by actionMode|
|boss:TWINS_SUN/SOLO|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in soloSolarVolley; pose gated by actionMode|
|boss:TWINS_SUN/ORBIT|explicit_body_pose_reuse|NEUTRAL|archive/reference only; do not schedule a new ability|
|boss:TWINS_SUN/SWAP|explicit_body_pose_reuse|NEUTRAL|archive/reference only; do not schedule a new ability|
|boss:TWINS_SUN/ECLIPSE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in eclipsePulse, twinCrossfire; pose gated by actionMode|
|boss:TWINS_SUN/SOLO_SUN|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in soloSolarVolley; pose gated by actionMode|
|boss:TWINS_MOON/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:TWINS_MOON/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in lunarSnare, shadowArc, twinCrossfire, eclipsePulse; pose gated by actionMode|
|boss:TWINS_MOON/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:TWINS_MOON/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in lunarSnare; pose gated by actionMode|
|boss:TWINS_MOON/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in lunarSnare, shadowArc, twinCrossfire; pose gated by actionMode|
|boss:TWINS_MOON/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in lunarSnare, shadowArc, twinCrossfire, eclipsePulse; pose gated by actionMode|
|boss:TWINS_MOON/SOLO|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in soloLunarOrbit; pose gated by actionMode|
|boss:TWINS_MOON/ORBIT|explicit_body_pose_reuse|NEUTRAL|archive/reference only; do not schedule a new ability|
|boss:TWINS_MOON/SWAP|explicit_body_pose_reuse|NEUTRAL|archive/reference only; do not schedule a new ability|
|boss:TWINS_MOON/ECLIPSE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in eclipsePulse, twinCrossfire; pose gated by actionMode|
|boss:TWINS_MOON/SOLO_MOON|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in soloLunarOrbit; pose gated by actionMode|
|boss:DRAGON/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:DRAGON/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in dragonStrafe, emberWake, wingBuffet, meteorRain, skyDive, infernoRing; pose gated by actionMode|
|boss:DRAGON/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:DRAGON/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in dragonStrafe, emberWake; pose gated by actionMode|
|boss:DRAGON/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in dragonStrafe, emberWake, wingBuffet, meteorRain; pose gated by actionMode|
|boss:DRAGON/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in dragonStrafe, wingBuffet, meteorRain, skyDive, infernoRing; pose gated by actionMode|
|boss:DRAGON/BREATH|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in dragonStrafe; pose gated by actionMode|
|boss:DRAGON/TAIL|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in wingBuffet; pose gated by actionMode|
|boss:DRAGON/METEOR|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in meteorRain; pose gated by actionMode|
|boss:DRAGON/STRAFE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in dragonStrafe; pose gated by actionMode|
|boss:DRAGON/EMBER_WAKE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in emberWake; pose gated by actionMode|
|boss:DRAGON/WING_BUFFET|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in wingBuffet; pose gated by actionMode|
|boss:DRAGON/SKY_DIVE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in skyDive; pose gated by actionMode|
|boss:DRAGON/INFERNO_RING|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in infernoRing; pose gated by actionMode|
|boss:SPIDER_MATRIARCH/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:SPIDER_MATRIARCH/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in webTrap, silkVolley, spawnSpiderlings, broodAmbush, nestBloom, webField; pose gated by actionMode|
|boss:SPIDER_MATRIARCH/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:SPIDER_MATRIARCH/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in webTrap, silkVolley; pose gated by actionMode|
|boss:SPIDER_MATRIARCH/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in webTrap, silkVolley, spawnSpiderlings, broodAmbush; pose gated by actionMode|
|boss:SPIDER_MATRIARCH/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in webTrap, spawnSpiderlings, broodAmbush, nestBloom, webField; pose gated by actionMode|
|boss:SPIDER_MATRIARCH/WEB|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in webTrap, silkVolley; pose gated by actionMode|
|boss:SPIDER_MATRIARCH/BROOD|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in spawnSpiderlings, broodAmbush, nestBloom; pose gated by actionMode|
|boss:SPIDER_MATRIARCH/FIELD|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in webField; pose gated by actionMode|
|boss:ASTROLABE/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:ASTROLABE/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in gravityWell, starfall, orbitalShots, orbitalLock, singularity, eventHorizon; pose gated by actionMode|
|boss:ASTROLABE/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:ASTROLABE/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in gravityWell, starfall; pose gated by actionMode|
|boss:ASTROLABE/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in gravityWell, orbitalShots, starfall, orbitalLock; pose gated by actionMode|
|boss:ASTROLABE/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in gravityWell, orbitalShots, orbitalLock, singularity, eventHorizon; pose gated by actionMode|
|boss:ASTROLABE/WELL|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in gravityWell, starfall; pose gated by actionMode|
|boss:ASTROLABE/ORBIT|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in orbitalShots, orbitalLock; pose gated by actionMode|
|boss:ASTROLABE/SINGULARITY|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in singularity, eventHorizon; pose gated by actionMode|
|boss:BLOOD_FORGE/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:BLOOD_FORGE/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in forgeArmor, slagDrop, sacrificeMinions, brandLine, moltenBurst, forgeDetonation; pose gated by actionMode|
|boss:BLOOD_FORGE/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:BLOOD_FORGE/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in forgeArmor, slagDrop; pose gated by actionMode|
|boss:BLOOD_FORGE/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in forgeArmor, slagDrop, sacrificeMinions, brandLine; pose gated by actionMode|
|boss:BLOOD_FORGE/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in forgeArmor, sacrificeMinions, brandLine, moltenBurst, forgeDetonation; pose gated by actionMode|
|boss:BLOOD_FORGE/ARMOR|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in forgeArmor, slagDrop; pose gated by actionMode|
|boss:BLOOD_FORGE/SACRIFICE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in sacrificeMinions, brandLine; pose gated by actionMode|
|boss:BLOOD_FORGE/OVERHEAT|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in moltenBurst, forgeDetonation; pose gated by actionMode|
|boss:VOID_CONDUCTOR/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:VOID_CONDUCTOR/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in conductLines, pulseMeasure, tempoShift, syncopate, finale, crescendo; pose gated by actionMode|
|boss:VOID_CONDUCTOR/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:VOID_CONDUCTOR/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in conductLines, pulseMeasure; pose gated by actionMode|
|boss:VOID_CONDUCTOR/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in conductLines, pulseMeasure, tempoShift, syncopate; pose gated by actionMode|
|boss:VOID_CONDUCTOR/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in conductLines, tempoShift, syncopate, finale, crescendo; pose gated by actionMode|
|boss:VOID_CONDUCTOR/PULSE_MEASURE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in pulseMeasure; pose gated by actionMode|
|boss:VOID_CONDUCTOR/SYNCOPATE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in syncopate; pose gated by actionMode|
|boss:VOID_CONDUCTOR/CRESCENDO|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in crescendo; pose gated by actionMode|
|boss:VOID_CONDUCTOR/TWO_BEAT|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in conductLines, tempoShift; pose gated by actionMode|
|boss:VOID_CONDUCTOR/FINALE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in finale; pose gated by actionMode|
|boss:LABYRINTH_KEEPER/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:LABYRINTH_KEEPER/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in raiseWalls, corridorClamp, gateSwap, mazeFold, mazeCrush, deadEnd; pose gated by actionMode|
|boss:LABYRINTH_KEEPER/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:LABYRINTH_KEEPER/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in raiseWalls, corridorClamp; pose gated by actionMode|
|boss:LABYRINTH_KEEPER/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in raiseWalls, corridorClamp, gateSwap, mazeFold; pose gated by actionMode|
|boss:LABYRINTH_KEEPER/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in raiseWalls, gateSwap, mazeFold, mazeCrush, deadEnd; pose gated by actionMode|
|boss:LABYRINTH_KEEPER/WALL|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in raiseWalls, corridorClamp; pose gated by actionMode|
|boss:LABYRINTH_KEEPER/GATE|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in gateSwap, mazeFold; pose gated by actionMode|
|boss:LABYRINTH_KEEPER/COMPRESS|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in mazeCrush, deadEnd; pose gated by actionMode|
|boss:NIGHTMARE_BLOOM/NEUTRAL|direct_concept_cell|NEUTRAL|read current entity state / upstream contract; no new gameplay state|
|boss:NIGHTMARE_BLOOM/WINDUP|direct_concept_cell|WINDUP|actual bossState.castAbility in seedPods, blightRoots, poisonBloom, sporeBurst, gardenWake, creepingCanopy; pose gated by actionMode|
|boss:NIGHTMARE_BLOOM/OPEN|direct_concept_cell|OPEN|boss actionMode=recover body; whole-body OPEN cue only if damageTakenMultiplier>1|
|boss:NIGHTMARE_BLOOM/P1|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in seedPods, blightRoots; pose gated by actionMode|
|boss:NIGHTMARE_BLOOM/P2|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in seedPods, blightRoots, poisonBloom, sporeBurst; pose gated by actionMode|
|boss:NIGHTMARE_BLOOM/P3|explicit_body_pose_reuse|NEUTRAL|actual bossState.castAbility in seedPods, poisonBloom, sporeBurst, gardenWake, creepingCanopy; pose gated by actionMode|
|boss:NIGHTMARE_BLOOM/SEED|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in seedPods, blightRoots; pose gated by actionMode|
|boss:NIGHTMARE_BLOOM/BLOOM|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in poisonBloom, sporeBurst; pose gated by actionMode|
|boss:NIGHTMARE_BLOOM/GARDEN|explicit_body_pose_reuse|ATTACK|actual bossState.castAbility in gardenWake, creepingCanopy; pose gated by actionMode|
|mechanic:NEST/INTACT|direct_concept_cell|INTACT|actual bossState.castAbility in spawnHive, broodShift; pose gated by actionMode|
|mechanic:NEST/TRIGGER|direct_concept_cell|TRIGGER|actual bossState.castAbility in spawnHive, broodShift; pose gated by actionMode|
|mechanic:NEST/BROKEN|direct_concept_cell|BROKEN|actual bossState.castAbility in spawnHive, broodShift; pose gated by actionMode|
|mechanic:NEST/FADE|direct_concept_cell|FADE|actual bossState.castAbility in spawnHive, broodShift; pose gated by actionMode|
|mechanic:WEB/INTACT|direct_concept_cell|INTACT|actual bossState.castAbility in webTrap, silkVolley, nestBloom, webField; pose gated by actionMode|
|mechanic:WEB/TRIGGER|direct_concept_cell|TRIGGER|actual bossState.castAbility in webTrap, silkVolley, nestBloom, webField; pose gated by actionMode|
|mechanic:WEB/BROKEN|direct_concept_cell|BROKEN|actual bossState.castAbility in webTrap, silkVolley, nestBloom, webField; pose gated by actionMode|
|mechanic:WEB/FADE|direct_concept_cell|FADE|actual bossState.castAbility in webTrap, silkVolley, nestBloom, webField; pose gated by actionMode|
|mechanic:ROOT/INTACT|direct_concept_cell|INTACT|actual bossState.castAbility in seedPods, gardenWake, creepingCanopy; pose gated by actionMode|
|mechanic:ROOT/TRIGGER|direct_concept_cell|TRIGGER|actual bossState.castAbility in seedPods, gardenWake, creepingCanopy; pose gated by actionMode|
|mechanic:ROOT/BROKEN|direct_concept_cell|BROKEN|actual bossState.castAbility in seedPods, gardenWake, creepingCanopy; pose gated by actionMode|
|mechanic:ROOT/FADE|direct_concept_cell|FADE|actual bossState.castAbility in seedPods, gardenWake, creepingCanopy; pose gated by actionMode|
|mechanic:WALL/INTACT|direct_concept_cell|INTACT|actual bossState.castAbility in raiseWalls, gateSwap; pose gated by actionMode|
|mechanic:WALL/TRIGGER|direct_concept_cell|TRIGGER|actual bossState.castAbility in raiseWalls, gateSwap; pose gated by actionMode|
|mechanic:WALL/BROKEN|direct_concept_cell|BROKEN|actual bossState.castAbility in raiseWalls, gateSwap; pose gated by actionMode|
|mechanic:WALL/FADE|direct_concept_cell|FADE|actual bossState.castAbility in raiseWalls, gateSwap; pose gated by actionMode|
|mechanic:SEAL/INTACT|direct_concept_cell|INTACT|actual bossState.castAbility in freezeTower, coldSnap; pose gated by actionMode|
|mechanic:SEAL/TRIGGER|direct_concept_cell|TRIGGER|actual bossState.castAbility in freezeTower, coldSnap; pose gated by actionMode|
|mechanic:SEAL/BROKEN|direct_concept_cell|BROKEN|actual bossState.castAbility in freezeTower, coldSnap; pose gated by actionMode|
|mechanic:SEAL/FADE|direct_concept_cell|FADE|actual bossState.castAbility in freezeTower, coldSnap; pose gated by actionMode|
|mechanic:RETICLE/INTACT|direct_concept_cell|INTACT|actual bossState.castAbility in markTower; pose gated by actionMode|
|mechanic:RETICLE/TRIGGER|direct_concept_cell|TRIGGER|actual bossState.castAbility in markTower; pose gated by actionMode|
|mechanic:RETICLE/BROKEN|direct_concept_cell|BROKEN|actual bossState.castAbility in markTower; pose gated by actionMode|
|mechanic:RETICLE/FADE|direct_concept_cell|FADE|actual bossState.castAbility in markTower; pose gated by actionMode|
|mechanic:COURIER/INTACT|direct_concept_cell|INTACT|actual bossState.castAbility in stealMoney, repossess; pose gated by actionMode|
|mechanic:COURIER/TRIGGER|direct_concept_cell|TRIGGER|actual bossState.castAbility in stealMoney, repossess; pose gated by actionMode|
|mechanic:COURIER/BROKEN|direct_concept_cell|BROKEN|actual bossState.castAbility in stealMoney, repossess; pose gated by actionMode|
|mechanic:COURIER/FADE|direct_concept_cell|FADE|actual bossState.castAbility in stealMoney, repossess; pose gated by actionMode|
