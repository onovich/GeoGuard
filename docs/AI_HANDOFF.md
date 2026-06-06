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

## 2. Difficulty Curve Flattening (Wave x2)
The user felt the initial curve was too steep (fighting hard bosses immediately from Wave 1).

*   **Wave Table (`src/data/waveTable.js`)**:
    *   Refactored the base 16-wave table to generate a 32-wave progression.
    *   **Waves 1-16 (Weakened/Buffer Phase)**: Flaged with `isWeakened: true`. The enemy spawn interval is slower (`+0.35s`), and the base mob count is reduced to 60%.
    *   **Waves 17-32 (Original Difficulty)**: Uses the original pacing and `isWeakened: false`.
*   **Game Rules (`src/logic/engine/gameRules.js`)**:
    *   Updated `createWaveDefinition()` to respect the `isWeakened` flag.
    *   For waves 1-16, Boss HP is scaled down (starts at ~0.43x) and Damage is scaled down (starts at ~0.61x).
    *   This creates a smooth difficulty ramp over the first 16 waves, effectively doubling the game's length and providing a gentler onboarding curve.

---
**Last Updated**: `2026-06-06`
