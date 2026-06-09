# AI Handoff & Recent Changes

This document serves as a status check and handover reference for subsequent AI agents or developers. It records the latest major UI/UX changes and balance adjustments made to the game.

## 1. UI & Redundancy Clean-up (Localization & Polish)
The user requested a cleaner UI, specifically removing redundant English text and translating missing key words.

*   **GameHud (`src/view/components/GameHud.jsx`)**:
    *   Removed redundant english tooltips, threat tags, and boss summaries.
    *   Removed the visual pill bars for boss phases, keeping only the concise `P1/P2` text.
    *   Moved the operation/controls hints from the main menu into the HUD. It now appears as a bright, dismissable yellow bar at the bottom (`bottom-40`), dynamically rendering for mobile (`Mobi/Android`) or PC (`WASD`) users.
*   **StatusBanner (`src/view/components/StatusBanner.jsx`)**:
    *   Removed the top-level eyebrow text (e.g., "ENCOUNTER" / "B") and subtitle paragraphs to keep the screen uncluttered.
*   **OverlayScreen (`src/view/components/OverlayScreen.jsx`)**:
    *   Removed the bulky static controls instruction block.
    *   Restricted the visibility of the "开发测试入口" (Debug Entry) button to only `localhost` / `127.0.0.1` environments.
*   **Rewards & Upgrades (`src/view/components/WaveRewardOverlay.jsx`, `src/logic/engine/rewardRules.js`, `src/logic/engine/towerRules.js`)**:
    *   Removed the "Choose 1 reward" redundant banner.
    *   Translated CTA buttons and badge labels (e.g., `NEW TOWER` -> `新防御塔`, `UPGRADE` -> `属性提升`).
    *   Translated core terminology in rules (`Cost` -> `造价`, `Damage` -> `伤害`, `Supply Cache` -> `补给空投` etc.).

## 2. Difficulty Curve Flattening (Staged Onboarding)
The user felt the initial curve was too steep (fighting hard bosses immediately from Wave 1).

*   **Wave Table (`src/data/waveTable.js`)**:
    *   Refactored the base 16-wave table into a staged 34-wave progression after the later compression pass.
    *   **Waves 1-6 (Tier 1)**: Uses one-phase bosses, slower spawn intervals, and lighter encounter pacing.
    *   **Waves 7-18 (Tier 2)**: Uses two-phase bosses with a moderate spawn interval bonus.
    *   **Waves 19-34 (Tier 3)**: Uses the full 16-wave boss roster and full boss phase sets.
*   **Game Rules (`src/logic/engine/gameRules.js`)**:
    *   `createWaveDefinition()` reads the staged table, applies tier-based spawn pacing, and keeps later cycles scaling upward.
    *   Tiered boss IDs (`_T1`, `_T2`, `_T3`) control how many boss phases are active, so early waves teach mechanics before full encounters appear.
    *   This creates a smoother onboarding curve while preserving the later full-strength 16-wave roster.

## 3. Boss Difficulty & Wave Rhythm Adjustments (Exponential Scaling & Stage Compression)
The user noted that while early bosses were appropriately difficult, late-game bosses became too easy as the player's tower setup grew. They also wanted a fresh rhythm for boss stages and tweaked enemy spacing.

*   **Game Rules (`src/logic/engine/gameRules.js`)**:
    *   Changed the flat/linear boss strength scaling to an exponential curve to ensure late-game bosses are significantly tougher.
    *   `hpScale` formula: `1.0 + Math.pow(waveNumber, 1.2) * 0.06`
    *   `damageScale` formula: `0.6 + Math.pow(waveNumber, 1.1) * 0.02`
*   **Wave Table (`src/data/waveTable.js`)**:
    *   Compressed the boss stage progression to introduce new boss mechanics faster.
    *   **Tier 1 (Stage 1 Bosses)**: Compressed to **6 waves** (Indices: 0, 3, 6, 9, 12, 15).
    *   **Tier 2 (Stage 2 Bosses)**: Compressed to **12 waves** (Indices: 0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 14, 15).
    *   **Tier 3 (Stage 3 Bosses)**: Kept at all **16 waves**.
    *   Total waves before looping is now `6 + 12 + 16 = 34` waves.
    *   Slightly pulled back the creep line length. Enemy count multiplier was adjusted from `2.0` to `1.5`. 
    *   Adjusted spawn interval bonuses (Tier 1 `+0.2s`, Tier 2 `+0.05s`) for a balanced enemy density.

## 4. Bilibili TOY Publishing & Fallback Workflow
The user requested deploying the project to Bilibili TOY using the local `bili-toy-publisher` script.

*   **Script & Environment Fixes**:
    *   Fixed cross-platform Python zip path generation issues in `publish.sh` for Windows Git Bash by using local `.tmp/project.zip` and moving it.
    *   Replaced `python3` with `python` in bash to prevent interactive terminal hangs on Windows.
    *   Moved `toy.yaml` to the project root directory as dictated by the Vite framework project rules. Updated it with project ID `477`.
*   **API Network Restrictions (Manual Fallback)**:
    *   The internal `sunflower.bilibili.co` API was actively blocking requests with an SSL Handshake/EOF error (possibly due to WAF restrictions or VPN requirements).
    *   Per the `SKILL.md` guidelines, we fell back to the **Browser UI Fallback**.
    *   The latest static build was packaged to `D:\WebProjects\GeoGuard\.tmp\project.zip`, and the user was instructed to manually upload this package using the official Bilibili TOY web portal update process.

## 5. Runtime Refactor Passes
The planned refactor passes moved rendering, browser loop/input wiring, Boss editor draft state, Boss template/entity/encounter construction, Boss HUD view-model construction, Boss phase presentation scheduling and visual effect planning, entity spawn insertion, wave start/tick helpers, reward flow helpers, debug field/action/panel helpers, debug tower helpers, debug Boss phase forcing, Boss ability effects, combat-frame settlement, player/tower offense, enemy behavior, and enemy defeat settlement out of the main gameplay hook without changing UI behavior.

*   **Canvas Renderer (`src/view/canvas/canvasRenderer.js`)**:
    *   Moved tower, boss, hazard, projectile, particle, drag-preview, joystick, and Boss presentation drawing helpers into a dedicated view-layer renderer.
    *   Exports `drawGameScene()` plus Boss phase presentation helpers used by the HUD and wave messages.
*   **Gameplay Hook (`src/logic/hooks/useGeoGuardGame.jsx`)**:
    *   Now delegates scene drawing to `drawGameScene()` and keeps runtime orchestration, wave spawn presentation side effects, reward UI presentation handoff, remaining debug wave/UI orchestration callbacks, Boss effect plan execution, and Boss behavior scheduling.
*   **Canvas Loop Hook (`src/logic/hooks/useCanvasGameLoop.js`)**:
    *   Owns canvas resize, keyboard and pointer/touch event listeners, joystick updates, context-menu tower targeting, and the requestAnimationFrame bridge.
*   **Boss Editor Runtime (`src/logic/hooks/useBossEditorRuntime.js`)**:
    *   Owns debug Boss editor draft state, ability options, authoring overrides, import/export, and panel mutation handlers.
*   **Boss Ability Runtime (`src/logic/engine/bossAbilityRuntime.js`)**:
    *   Owns the Boss ability effect table and receives runtime callbacks for hazards, summons, damage, HUD sync, and presentation effects.
    *   Added focused node:test coverage for command-line hazard output and Collector money-steal side effects.
*   **Combat Frame Runtime (`src/logic/engine/combatFrameRuntime.js`)**:
    *   Owns projectile hit settlement, drop pickup, transient visual cleanup, and area/line hazard settlement.
    *   Added focused node:test coverage for projectile removal, hazard damage/freeze behavior, drop pickup, and transient cleanup.
*   **Combat Offense Runtime (`src/logic/engine/combatOffenseRuntime.js`)**:
    *   Owns player auto-fire, tower firing cadence, projectile creation, burst spread, and frozen/jam fire-rate factors.
    *   Added focused node:test coverage for player projectile creation, tower burst firing/dead tower removal, and fire-rate modifiers.
*   **Enemy Behavior Runtime (`src/logic/engine/enemyBehaviorRuntime.js`)**:
    *   Owns per-enemy status timers, burrow/phase/aura/summon behavior, movement and target selection, contact damage, and explode fuse settlement.
    *   Added focused node:test coverage for burrow pauses, movement/contact damage, aura healing, summons, and fuse explosions.
*   **Enemy Defeat Runtime (`src/logic/engine/enemyDefeatRuntime.js`)**:
    *   Owns enemy death settlement, gem drops, death-spawn callbacks, boss-defeat money sync, boss reward resolution, and pending aftermath reward checks.
    *   Added focused node:test coverage for normal enemy drops, immediate boss reward opening, and delayed boss aftermath rewards.
*   **Encounter Runtime (`src/logic/engine/encounterRuntime.js`)**:
    *   Owns Boss phase enrichment, Boss editor base template lookup, normal enemy runtime defaults, Boss runtime defaults, Boss ownership metadata, and single/twin Boss encounter construction.
    *   Added focused node:test coverage for phase overrides, enemy runtime initialization, single Boss spawning data, and twin encounter ownership/offset/value splits.
*   **Boss HUD Runtime (`src/logic/engine/bossHudRuntime.js`)**:
    *   Owns active Boss filtering, encounter grouping, HUD member sorting, presentation metadata lookup, and stable Boss HUD snapshot comparison.
    *   Added focused node:test coverage for twin encounter HUD grouping, member ordering, phase hint/tone injection, enrage flags, and snapshot reuse.
*   **Boss Phase Presentation Runtime (`src/logic/engine/bossPhasePresentationRuntime.js`)**:
    *   Owns Boss phase intro timers, phase announcement gating, phase announcement message plans, camera-shake plans, phase-shift visual effect command plans, final-phase accent gating, final-phase accent visual effect command plans, and final-phase accent cooldowns.
    *   Added focused node:test coverage for intro timer writes, single Boss announcements, twin encounter announcement ownership, camera-shake plans, phase-shift effect commands, climax effect commands, and final-phase cooldowns.
*   **Reward Flow Runtime (`src/logic/engine/rewardFlowRuntime.js`)**:
    *   Owns runtime reward choice building, Boss reward UI-state opening, offer or pick history recording, reward application flow, and post-choice wave follow-up resolution.
    *   Added focused node:test coverage for opening Boss rewards and applying choices in debug flow.
*   **Wave Flow Runtime (`src/logic/engine/waveFlowRuntime.js`)**:
    *   Owns wave-start state creation, debug Boss authoring application for wave bosses, wave overview/message construction, wave tick advancement, enemy or Boss spawn-plan output, and spawn-position materialization.
    *   Added focused node:test coverage for normal wave start state, debug-authored wave Boss start state, normal wave tick spawn plans, Boss spawn plans, deterministic spawn positions, and sandbox idle ticks.
*   **Entity Spawn Runtime (`src/logic/engine/entitySpawnRuntime.js`)**:
    *   Owns runtime insertion of enemies and Boss encounters, UID allocation, burrow spawn relocation, and wave spawn-plan application.
    *   Added focused node:test coverage for enemy insertion, burrow relocation, Boss encounter insertion, and applying wave spawn plans.
*   **Debug Tower Runtime (`src/logic/engine/debugTowerRuntime.js`)**:
    *   Owns debug tower preset layouts, direct placed-tower entity creation, layout application into runtime state, unlock-all blueprint transforms, blueprint level changes, and placed tower level changes.
    *   Added focused node:test coverage for unlock-all, preset tower placement around the player, layout application state writes, and safe blueprint/placed tower level updates.
*   **Debug Boss Runtime (`src/logic/engine/debugBossRuntime.js`)**:
    *   Owns debug Boss phase forcing, including phase target clamping, target HP derivation, cooldown reset, and phase-shift callback routing.
    *   Added focused node:test coverage for clamped phase targets, derived HP, cooldown reset, callback payloads, and no-active-boss behavior.
*   **Debug Field Runtime (`src/logic/engine/debugFieldRuntime.js`)**:
    *   Owns debug combat-field clearing, sandbox wave reset, sandbox overview metadata, action presentation helpers, debug panel UI reset plans, debug wave panel start flow, debug reward state creation, editor Boss spawn positioning, and debug option side effects for infinite money or health.
    *   Added focused node:test coverage for clearing combat collections, preserving or clearing towers, sandbox reset, action helper outputs, panel action state plans, debug wave panel start flow, and infinite money/health option side effects.
*   **Ops Workflow (`.codex/project-ops-workflow.json`, `docs/codex-ops-workflow.md`)**:
    *   `Validate.cmd` now runs `npm test` and `npm run build`, and the project git workflow invokes it before commits.
    *   The gameplay hook is still the next major refactor target, especially for remaining small editor or drag bridge callbacks.

---
**Last Updated**: `2026-06-10`
