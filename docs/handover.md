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

- src/logic/engine/gameRules.js
Contains placement validation, wave generation rules, nearest-target logic, and boss composition.

- src/logic/engine/gameState.js
Defines the runtime state tree, including drag placement state, wave state, and tower catalog snapshots.

- src/logic/hooks/useGeoGuardGame.jsx
This is the current gameplay orchestrator. It owns wave flow, boss reward flow, combat updates, touch/mouse input, drag placement, and canvas rendering.

- src/view/components/BuildBar.jsx
Owns the tower bar UI and the mobile gesture bridge for horizontal scrolling versus drag placement.

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
Data is separated into src/data, shared rules live in src/logic/engine, and UI is split into src/view. However, useGeoGuardGame remains the dominant integration point and is still large.

2. Canvas rendering is tightly coupled to runtime state.
Most gameplay objects are updated and rendered in the same hook. This is acceptable for the current prototype stage, but future work should continue moving isolated logic into engine functions.

3. The tower catalog is treated as progression state.
Available towers and upgrade levels live as runtime/template state rather than as placed entities. This keeps reward resolution simple and avoids rewriting every placed tower after upgrades.

## Validation Status

- npm run build passes locally.
- GitHub Pages workflow is configured and deployed through GitHub Actions.
- Current published site uses the repository Pages path under the configured domain.

## Recommended Next Steps

1. Externalize wave definitions into explicit data.
The current rule-generated waves are workable, but they are not yet a curated content table.

2. Split useGeoGuardGame.
Recommended first cuts are wave progression, placement controller, combat resolver, and canvas renderer helpers.

3. Add regression tests for progression and placement.
At minimum, cover reward application, wave generation, unlock logic, and placement blocking.

4. Add a stronger Boss UI layer.
Consider a persistent top-of-screen boss bar and more readable reward timing transitions.

5. Review mobile UX after additional towers are unlocked.
This remains the area most likely to regress when touch thresholds or layout change.

## Practical Editing Guidance

1. If you change tower placement on mobile, validate both horizontal scrolling and upward drag placement in the tower bar.

2. If you change reward behavior, confirm that unlocked towers appear in the bar and upgraded towers show their level markers both in the bar and on future placed towers.

3. If you change wave flow, verify the full sequence: wave spawn, boss spawn, boss death, reward modal, reward application, next wave start.

4. If you touch useGeoGuardGame, prefer one small change and one immediate build or runtime validation rather than batching multiple unrelated edits.