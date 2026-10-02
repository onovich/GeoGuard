# qa-skills independent runtime acceptance

Own writes are confined to this directory. Candidate and all other owners are read-only. No Git operations. Production is frozen.

## Current gate

Preparation only. No server, browser, build, simulation, or full sample may run until root explicitly issues `PERMISSION_TO_RUN_BROWSER`. Root remains the sole dispatcher and reviewer. A saved permission record must cite the root message; this owner must never invent or infer permission from elapsed time or another owner's status.

`prepare.mjs` checks the issued lock, reads static default/member configurations, and produces r01 coverage. Its pure configuration imports are not gameplay execution. `submissions/rNN` is immutable after packet sealing. READY.json is the queue pointer; PREPARATION.json records the gate state. No proactive cross-thread messages.

## Evidence standard

95 unique skills, 180 default member/phase cases, six survivor cases are separately indexed. The four archived character concepts are excluded. Every runtime skill remains not_run until it has actual original-engine evidence. No 882-pose fixture substitution.

Original GUI start/debug spawn/tower placement/phase buttons plus the frozen DEV reset/step/snapshot bridge are permitted. Never call an ability handler, setter, or engine update directly. Never edit default behavior nodes, AI, parameters, HP, or the frozen source. Record seed, global frame, dt, GUI operations and their coordinates/labels, full snapshots and PNG paths. Each launch uses its own ephemeral server port, browser and output directory under qa-skills.

## Observation corrections

The existing final-skill-observer requires attack mode, which is too strict: bossCombatRuntime calls runAbility, resets cooldown, and immediately enters recover when no nonterrain attack, reticle, or dash remains. Thus an actual dispatch is windup departure with cooldown reset at the same UID, phase and castAbility. Save the execution frame even for direct-to-recover. Such a frame proves dispatch, not an effect if prerequisites were absent.

castAbility remains populated during recovery/idle. Never create a new cast merely because castAbility exists. Start records only on a newly entered windup, with a monotonic cast sequence. Reset/phase interventions delimit sessions. Pauses advance zero frames and must leave the semantic state stable, apart from the paused flag. Missing/disappearing boss records are interrupted unless recovery was already captured.

Hazards shared by TWINS encounter ownership may hold both members in attack. Index boss ownership, encounter ownership and mechanic ownership independently; don't assign every visible hazard to the current cast. Record before/after entity sets and exact geometry. Terrain may survive recover; persistent summons may outlive casts. Their absence is not a prerequisite for recovery. Track actual expiry/defeat separately from GUI Clear Enemies and DEV reset cleanup.

## Conditional scenes

Collector courier skills need Infinite Money OFF and positive money; toggling the original GUI after placement preserves 200 money through the original code. Reticle/seal skills need live GUI towers, coldSnap needs two. Sacrifice needs nearby living minions at windup and execute. Hive/maze follow-up skills need their actual preceding default casts and living owned mechanics. Do not reset/clear between a producer cast and its dependent ability.

Twin survivor tests require original Wave flow (GUI Wave 1) because sandbox defeats return before enrage. Bias legal tower placement to kill the desired partner; record HP/projectiles/defeat and partnerFallen. Use GUI tower selling to keep the survivor alive if necessary. Both survivor skills require separate runs. Early Phase jumps do not prove natural phase progression; label them explicitly. Do not force a phase after real partner death and then claim an uninterrupted lifecycle.

## Planned review package

Each skill has full snapshots at windup, execute, attack effect (where present), recover/OPEN, child changes, disappearance and cleanup; actual GUI screenshots include HUD. A compact per-frame geometry/state stream preserves intervening timing. Pause uses the original button and Escape. A per-item PNG index and limited contact sheets are review aids; visualStatus stays not_reviewed until root reviews them. Every error, incomplete attempt, overflow and missing effect remains in the packet. Lock and source fingerprint are verified before/after every run. Report real product defects to the root through the next immutable packet, never by editing production.
