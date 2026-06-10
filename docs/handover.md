# GeoGuard Handover

## Project Summary

GeoGuard is a browser-based survival defense game rebuilt from a single-file prototype into a Vite + React + Canvas project. The game now supports wave-based enemy progression, end-of-wave bosses, boss reward choices, unlockable towers, upgradeable future tower templates, and drag-to-place construction on both desktop and mobile.

## Current Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- HTML5 Canvas 2D rendering
- Runtime-first game state management via refs

## Important Files

- src/data/gameConfig.js
Contains color palette, enemy definitions, full tower library, initial unlocked tower set, and UI copy.

- src/data/bossPresentation.js
Contains boss summary/threat/counterplay metadata plus structured per-form phase presentation data for HUD intent, phase tone, and phase-shift callouts.

- src/logic/engine/gameRules.js
Contains placement validation, wave generation rules, nearest-target logic, and boss composition.

- src/logic/engine/gameState.js
Defines the runtime state tree, including drag placement state, wave state, and tower catalog snapshots.

- src/logic/engine/bossFlowRules.js
Holds pure boss-flow helpers for summon caps, aftermath cleanup checks, spawn positioning, and reward-resolution branching.

- src/logic/engine/bossAuthoringRules.js
Holds the boss editor authoring schema, ability catalog, default cooldowns, and import or export helpers for debug overrides.

- src/logic/engine/bossAbilityRuntime.js
Owns the Boss ability effect table and applies ability side effects through runtime context callbacks for hazards, summons, damage, HUD sync, and presentation effects.

- src/logic/engine/combatRules.js
Holds reusable combat math for target damage, enemy shield and phase damage resolution, area hits, pull offsets, and line-hazard hit tests.

- src/logic/engine/combatFrameRuntime.js
Owns per-frame projectile hits, drop pickup, transient visual cleanup, and hazard settlement through runtime callbacks.

- src/logic/engine/combatOffenseRuntime.js
Owns player auto-fire, tower firing cadence, projectile creation, burst spread, and frozen/jam fire-rate factors.

- src/logic/engine/enemyBehaviorRuntime.js
Owns per-enemy status timers, burrow and phase toggles, heal auras, summons, target selection, movement, contact damage, and explode fuse settlement through runtime callbacks.

- src/logic/engine/enemyDefeatRuntime.js
Owns enemy death settlement, gem drops, death-spawn callbacks, boss-defeat money sync, boss reward resolution, and pending aftermath reward checks.

- src/logic/engine/encounterRuntime.js
Owns Boss template phase enrichment, Boss editor base templates, normal enemy runtime entity creation, Boss runtime entity creation, Boss ownership metadata, and single or twin Boss encounter construction.

- src/logic/engine/bossHudRuntime.js
Owns active Boss filtering, encounter grouping, Boss HUD view-model construction, phase hint/tone injection, member ordering, and stable snapshot comparison.

- src/logic/engine/bossPhasePresentationRuntime.js
Owns Boss phase intro timer writes, phase announcement gating, phase announcement message plans, camera-shake plans, final-phase accent gating, and final-phase accent cooldowns.

- src/logic/engine/debugTowerRuntime.js
Owns debug tower preset layouts, direct placed-tower entity creation, layout application into runtime state, unlock-all blueprint transforms, blueprint level changes, and placed tower level changes.

- src/logic/engine/debugBossRuntime.js
Owns debug Boss phase forcing helpers, including phase clamping, target HP derivation, cooldown reset, and phase-shift callback routing.

- src/logic/engine/debugFieldRuntime.js
Owns debug combat-field clearing, sandbox wave reset, sandbox overview metadata, debug action presentation helpers, debug panel UI reset plans, debug wave panel start flow, debug reward panel state, and debug option side effects for infinite money or health.

- src/logic/engine/progressionRules.js
Holds wave-flow decisions such as reward follow-up behavior, auto-run gating, and per-tick queue or boss progression.

- src/logic/engine/waveFlowRuntime.js
Owns wave-start and wave-tick runtime helpers for creating authored wave state, applying debug Boss authoring to wave bosses, building wave overview/message presentation state, advancing wave timers, returning enemy or Boss spawn plans, and materializing spawn positions.

- src/logic/engine/entitySpawnRuntime.js
Owns runtime insertion of enemy entities, Boss encounter entities, burrow spawn relocation, UID allocation, and applying wave spawn plans into state.

- src/logic/engine/placementRules.js
Holds pure placement-evaluation helpers for tower drag previews, drag start/reset state, drag commit plans, and non-tower drag state updates.

- src/logic/engine/rewardRules.js
Owns reward offer scoring plus pure reward card materialization and reward application effects.

- src/logic/engine/rewardFlowRuntime.js
Owns runtime reward flow helpers for building reward choices from current state, opening Boss reward UI state, recording offer or pick history, and resolving post-choice wave follow-up.

- src/logic/audio/audioCueLibrary.js
Defines the built-in synthesized sound cues for towers, rewards, boss entrances, phase shifts, and boss defeats.

- src/logic/hooks/useGeoGuardGame.jsx
This is the current gameplay orchestrator. It owns wave spawn presentation side effects, reward UI presentation handoff, drag placement side-effect execution, debug layout particle emission, and Boss effect plan execution, while delegating canvas drawing, browser input, frame-loop wiring, Boss editor draft state, Boss editor spawn planning, Boss template/entity/encounter construction, Boss HUD view-model construction, Boss phase presentation scheduling and visual effect planning, entity spawn insertion, wave start/tick/spawn-plan helpers, reward flow helpers, placement evaluation and drag state/commit helpers, debug field/action/panel helpers, debug tower layout application, debug tower helpers, debug Boss phase forcing, Boss ability effects, player/tower offense, enemy behavior updates, enemy defeat settlement, and combat-frame settlement to narrower modules.

- src/logic/hooks/useCanvasGameLoop.js
Owns canvas resize, keyboard and pointer/touch event listeners, joystick updates, right-click tower targeting, and the requestAnimationFrame loop bridge.

- src/logic/hooks/useBossEditorRuntime.js
Owns the debug Boss editor draft state, ability option list, authoring overrides, import/export helpers, and panel mutation handlers.

- src/view/canvas/canvasRenderer.js
Owns canvas drawing helpers for towers, bosses, hazards, projectiles, particles, drag previews, and joystick visuals. Boss presentation text and tones now live in src/data/bossPresentation.js.

- src/view/designSystem.js
Defines shared UI class tokens and helper builders for surfaces, buttons, badges, forms, segmented controls, and cards.

- src/view/components/ui.jsx
Defines reusable React UI primitives used by HUDs, overlays, menus, debug panels, and editor forms.

- src/logic/hooks/useGameAudio.js
Owns the Web Audio runtime, cue playback, persistence for sound settings, and user-gesture audio resume handling.

- src/view/components/BuildBar.jsx
Owns the tower bar UI and the mobile gesture bridge for horizontal scrolling versus drag placement.

- src/view/components/BossEditorPanel.jsx
Renders the debug-only boss authoring lab with phase-tree editing, import or export JSON, and live spawn actions.

- src/view/components/WaveRewardOverlay.jsx
Renders the boss reward modal for upgrades and unlocks.

- src/view/components/GameHud.jsx
Renders HP, money, timer, and the current wave label.

- origin/App.jsx
Preserved original prototype implementation for historical reference.

- origin/design.md
Original design and handover notes from the prototype stage. Useful context, but partially outdated relative to the current implementation.

## Current Gameplay State

1. Waves
Each wave spawns authored-by-rule enemy queues. Once the queue is cleared, a boss is spawned. Defeating the boss opens the reward modal and starts the next wave after a choice is made.

2. Towers
The project starts with three base towers and now includes six additional unlockable towers. Unlocks come from boss reward choices.

3. Upgrades
Tower upgrades modify the buildable template only. Existing placed towers remain unchanged. Each tower currently supports up to three upgrades.

4. Placement
Tower placement is drag-based on both desktop and mobile. Placement preview includes range and validity color. Placement is blocked by the player, existing towers, and enemies.

5. Mobile input
The left half of the screen is still reserved for joystick movement. The bottom tower bar supports horizontal scrolling when the roster exceeds the viewport. On mobile, upward drag from a card should start placement, while horizontal swipe should keep browsing the bar.

## Architecture Notes

1. The project is partially split but not fully modular.
Data is separated into src/data, shared rules live in src/logic/engine, canvas drawing lives in src/view/canvas, and UI components live in src/view/components. However, useGeoGuardGame remains the dominant runtime integration point and is still large.

2. Canvas rendering is now separated from runtime updates.
The renderer still consumes the runtime state shape directly, but drawing code no longer lives inside useGeoGuardGame. Browser input, the frame loop, Boss editor draft state, Boss editor spawn planning, Boss template/entity/encounter construction, Boss HUD view-model construction, Boss phase presentation scheduling and visual effect planning, entity spawn insertion, wave start/tick/spawn-plan helpers, reward flow helpers, placement evaluation and drag state/commit helpers, debug field/action/panel helpers, debug tower helpers, debug Boss phase forcing, Boss ability effects, player/tower offense, enemy behavior, enemy defeat settlement, and combat-frame settlement also live in narrower modules. Future refactors should be feature-driven.

3. Boss presentation tuning is now data-driven.
Boss-level summary, threat, and counterplay copy plus phase-level intent, tone, and callout data live in src/data/bossPresentation.js. Runtime modules consume helpers from that file instead of reading presentation tables from canvas drawing code.

4. React UI now has a small design-system layer.
Shared primitives live in src/view/components/ui.jsx and class tokens live in src/view/designSystem.js. New UI should reuse those primitives before adding one-off Tailwind strings.

5. The tower catalog is treated as progression state.
Available towers and upgrade levels live as runtime/template state rather than as placed entities. This keeps reward resolution simple and avoids rewriting every placed tower after upgrades.

## Validation Status

- `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd` runs `npm test` followed by `npm run build`.
- npm run build passes locally.
- npm test passes locally with coverage for wave data, wave-state helpers, wave-start helpers, wave tick runtime helpers, wave spawn-plan helpers, entity spawn insertion, Boss HUD view-model construction, structured Boss phase presentation data, UI design-system conformance, Boss phase presentation scheduling and visual effect command planning, wave tick progression, reward follow-up rules, reward flow runtime helpers, boss authoring rules, encounter runtime construction, debug field runtime helpers, debug Boss editor spawn plans, debug action presentation helpers, debug panel action state plans, debug wave panel start flow, debug tower runtime helpers, debug tower layout application, debug Boss phase forcing, boss ability runtime callbacks, combat-frame runtime callbacks, combat offense runtime callbacks, enemy behavior runtime callbacks, enemy defeat runtime callbacks, audio cue definitions, placement rules, drag start/reset state helpers, drag commit plans, drag preview updates, reward adaptation/application, combat resolution, tower progression helpers, and boss flow rules.
- GitHub Pages workflow is configured and deployed through GitHub Actions.
- Current published site uses the repository Pages path under the configured domain.
- Browser smoke guidance for visual checks lives in [browser-smoke-checklist.md](D:/WebProjects/GeoGuard/docs/browser-smoke-checklist.md).

## Recommended Next Steps

The immediate TODO pass is complete, including the follow-up boss editor and audio pass.

Remaining work is now best treated as long-term backlog rather than missing implementation:

1. Continue deeper hook decomposition only when a future feature needs it.

2. Keep new React UI aligned with [ui-design-system.md](D:/WebProjects/GeoGuard/docs/ui-design-system.md).

3. Add browser-level or rendering-sensitive integration checks if the project later needs stricter release automation.

4. Keep balancing and presentation work in the long-term backlog, especially non-showcase bosses and wave 1-18 pacing.

5. Revisit mobile UX opportunistically whenever the build bar, tower count, drag interaction, or boss editor workflow changes again.

## Practical Editing Guidance

1. If you change tower placement on mobile, validate both horizontal scrolling and upward drag placement in the tower bar.

2. If you change reward behavior, confirm that unlocked towers appear in the bar and upgraded towers show their level markers both in the bar and on future placed towers.

3. If you change wave flow, verify the full sequence: wave spawn, boss spawn, boss death, reward modal, reward application, next wave start.

4. If you touch useGeoGuardGame, prefer one small change and one immediate build or runtime validation rather than batching multiple unrelated edits.

5. If you add or edit React UI, start from `src/view/components/ui.jsx` and `src/view/designSystem.js`; update [ui-design-system.md](D:/WebProjects/GeoGuard/docs/ui-design-system.md) if a reusable pattern changes.

6. If you touch the Boss editor, validate both draft import/export and debug spawn behavior because authored overrides now flow through useBossEditorRuntime before reaching combat.

7. If you touch Boss abilities, use the focused boss ability runtime tests plus the ops Validate wrapper before doing a browser smoke.

8. If you touch projectile, hazard, drop, particle, impact-wave, or floating-text behavior, use the combat-frame runtime tests plus the ops Validate wrapper before doing a browser smoke.

9. If you touch player or tower firing, use the combat offense runtime tests plus the ops Validate wrapper before doing a browser smoke.

10. If you touch enemy status timers, movement, targeting, contact damage, summons, or explode behavior, use the enemy behavior runtime tests plus the ops Validate wrapper before doing a browser smoke.

11. If you touch enemy death, drops, death-spawns, boss defeat money, boss reward opening, or pending boss aftermath checks, use the enemy defeat runtime tests plus the ops Validate wrapper before doing a browser smoke.

12. If you touch Boss template enrichment, runtime entity defaults, Boss ownership metadata, or twin encounter construction, use the encounter runtime tests plus the ops Validate wrapper before doing a browser smoke.

13. If you touch debug tower presets, unlock-all behavior, direct tower creation, or tower level adjustment from context menus, use the debug tower runtime tests plus the ops Validate wrapper before doing a browser smoke.

14. If you touch debug Boss phase forcing, phase HP derivation, or phase-shift callback routing, use the debug Boss runtime tests plus the ops Validate wrapper before doing a browser smoke.

15. If you touch debug field clearing, sandbox reset, sandbox overview, or infinite money/health side effects, use the debug field runtime tests plus the ops Validate wrapper before doing a browser smoke.
