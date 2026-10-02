# 身体与特效复用规范

29 条复用映射已获根审批。身体来源与独立特效来源分别列出，不将旧探索角色造型重新引入。仅覆盖矩阵已列关键姿态。

## enemy:BASIC / MOVE

身体：[pilot-03-basic-enemy-v2.png](pilot-03-basic-enemy-v2.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:FAST / MOVE

身体：[batch-09-sentinel-fast.png](batch-09-sentinel-fast.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:TANK / MOVE

身体：[batch-05-shield-tank.png](batch-05-shield-tank.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:SHARD / MOVE

身体：[batch-10-shard-medic.png](batch-10-shard-medic.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:SPLINTER / MOVE

身体：[batch-04-player-splinter.png](batch-04-player-splinter.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:SHIELD / MOVE

身体：[batch-05-shield-tank.png](batch-05-shield-tank.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:MEDIC / MOVE

身体：[batch-10-shard-medic.png](batch-10-shard-medic.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:BOMBER / MOVE

身体：[batch-11-bomber-jammer-v2.png](batch-11-bomber-jammer-v2.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:JAMMER / MOVE

身体：[batch-11-bomber-jammer-v2.png](batch-11-bomber-jammer-v2.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:PHASE / MOVE

身体：[batch-12-phase-burrower.png](batch-12-phase-burrower.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:BURROWER / MOVE

身体：[batch-12-phase-burrower.png](batch-12-phase-burrower.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:BEACON / MOVE

身体：[batch-13-beacon-scout-v4.png](batch-13-beacon-scout-v4.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:SCOUT / MOVE

身体：[batch-13-beacon-scout-v4.png](batch-13-beacon-scout-v4.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:SIEGE / MOVE

身体：[batch-14-siege-nest-v4.png](batch-14-siege-nest-v4.png) — named row NEUTRAL → SQUASH → STRETCH; same approved three key poses

特效：translation along actual velocity; no organs added

审批：approved_root_body_reuse；

## enemy:FAST / RUN

身体：[batch-09-sentinel-fast.png](batch-09-sentinel-fast.png) — named row ATTACK

特效：use approved ATTACK forward lean + translation

审批：approved_root_body_reuse；

## enemy:TANK / HEAVY_MOVE

身体：[batch-05-shield-tank.png](batch-05-shield-tank.png) — named row SQUASH

特效：heavy translation, no added part

审批：approved_root_body_reuse；

## enemy:SPLINTER / HOP

身体：[batch-04-player-splinter.png](batch-04-player-splinter.png) — SPLINTER ATTACK airborne cell

特效：vertical offset only

审批：approved_root_body_reuse；

## enemy:SHIELD / GUARD

身体：[batch-05-shield-tank.png](batch-05-shield-tank.png) — named row ATTACK

特效：same soft meat shield anatomy; runtime shield ring independent

审批：approved_root_body_reuse；

## enemy:MEDIC / HEAL

身体：[batch-10-shard-medic.png](batch-10-shard-medic.png) — named row ATTACK

特效：existing drawn heal plus independent pulse

审批：approved_root_body_reuse；

## enemy:BOMBER / INFLATE

身体：[batch-11-bomber-jammer-v2.png](batch-11-bomber-jammer-v2.png) — named row STRETCH

特效：existing puffed body round arms

审批：approved_root_body_reuse；

## enemy:JAMMER / JAM

身体：[batch-11-bomber-jammer-v2.png](batch-11-bomber-jammer-v2.png) — named row ATTACK

特效：existing separate signal arcs

审批：approved_root_body_reuse；

## hero:PLAYER / AUTO_ATTACK

身体：[batch-04-player-splinter.png](batch-04-player-splinter.png) — PLAYER ATTACK

特效：one independent projectile from body anchor; no handheld gun

审批：approved_root_body_reuse；

## boss:DRAGON / STRAFE

身体：[boss-28-dragon-v2.png](boss-28-dragon-v2.png) — P1

特效：reuse approved same anatomical keyframe; independent runtime skill effect requires separate effect evidence, not body redesign

特效图：[../usability-refinement/boss-actions-05-v3.png](../usability-refinement/boss-actions-05-v3.png) — DRAGON left column top-left STRAFE

审批：approved_root_body_reuse；approved_root_effect_reuse

## boss:DRAGON / EMBER_WAKE

身体：[boss-28-dragon-v2.png](boss-28-dragon-v2.png) — P1

特效：reuse approved same anatomical keyframe; independent runtime skill effect requires separate effect evidence, not body redesign

特效图：[../usability-refinement/boss-actions-05-v3.png](../usability-refinement/boss-actions-05-v3.png) — DRAGON left column top-right EMBER WAKE

审批：approved_root_body_reuse；approved_root_effect_reuse

## boss:DRAGON / WING_BUFFET

身体：[boss-28-dragon-v2.png](boss-28-dragon-v2.png) — P2

特效：reuse approved same anatomical keyframe; independent runtime skill effect requires separate effect evidence, not body redesign

特效图：[../usability-refinement/boss-actions-05-v3.png](../usability-refinement/boss-actions-05-v3.png) — DRAGON left column middle-left WING BUFFET

审批：approved_root_body_reuse；approved_root_effect_reuse

## boss:DRAGON / SKY_DIVE

身体：[boss-28-dragon-v2.png](boss-28-dragon-v2.png) — P3

特效：reuse approved same anatomical keyframe; independent runtime skill effect requires separate effect evidence, not body redesign

特效图：[../usability-refinement/boss-actions-05-v3.png](../usability-refinement/boss-actions-05-v3.png) — DRAGON left column middle-right SKY DIVE

审批：approved_root_body_reuse；approved_root_effect_reuse

## boss:DRAGON / INFERNO_RING

身体：[boss-28-dragon-v2.png](boss-28-dragon-v2.png) — P3

特效：reuse approved same anatomical keyframe; independent runtime skill effect requires separate effect evidence, not body redesign

特效图：[../usability-refinement/boss-actions-05-v3.png](../usability-refinement/boss-actions-05-v3.png) — DRAGON left column bottom INFERNO RING

审批：approved_root_body_reuse；approved_root_effect_reuse

## boss:VOID_CONDUCTOR / PULSE_MEASURE

身体：[boss-32-void_conductor-v2.png](boss-32-void_conductor-v2.png) — P1

特效：reuse approved same anatomical keyframe; independent runtime skill effect requires separate effect evidence, not body redesign

特效图：[../usability-refinement/boss-actions-05-v3.png](../usability-refinement/boss-actions-05-v3.png) — VOID_CONDUCTOR center column top PULSE MEASURE

审批：approved_root_body_reuse；approved_root_effect_reuse

## boss:VOID_CONDUCTOR / CRESCENDO

身体：[boss-32-void_conductor-v2.png](boss-32-void_conductor-v2.png) — P3

特效：reuse approved same anatomical keyframe; independent runtime skill effect requires separate effect evidence, not body redesign

特效图：[../usability-refinement/boss-actions-05-v3.png](../usability-refinement/boss-actions-05-v3.png) — VOID_CONDUCTOR center column bottom CRESCENDO

审批：approved_root_body_reuse；approved_root_effect_reuse
