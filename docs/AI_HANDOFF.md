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

---
**Last Updated**: `2026-06-07`
