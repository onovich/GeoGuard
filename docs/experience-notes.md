# GeoGuard Experience Notes

## Lessons

1. Keep high-frequency game state in runtime refs rather than React state.
当前项目的 Canvas 主循环、敌人数组、塔数组、投射物、掉落物和拖拽状态都必须维持在运行时对象中。React state 只适合承担 HUD、弹框和低频同步，否则会立即遇到重渲染与闭包同步问题。

2. Treat mobile tower-bar gestures as a conflict zone.
手机端的塔栏同时承担横向滚动和拖拽建塔两种交互。单纯的 touchstart 立即拖拽会阻断列表滚动；单纯的长按又会让用户“往上拖出塔”的自然手势失效。当前版本采用“横向滑动保留列表滚动，纵向向上拖出立即开始建塔，静止短按也可触发拖拽”的折中方案。

3. New tower unlocks must remain horizontally browsable.
随着 Boss 奖励不断解锁新塔，塔栏必然超过一屏。桌面端依赖横向布局与鼠标拖拽问题不大，手机端必须确保 overflow-x 仍有效，不能让触摸事件完全吞掉滚动行为。

4. Tower upgrades only affect future placements by design.
当前升级奖励只修改“可建造塔模板”，不会回写已落地的塔实例。这是刻意的设计决策，避免在 Boss 奖励结算时批量修改场上塔对象，减少平衡复杂度与同步风险。

5. Wave/Boss progression is now the main pacing system.
项目已经从持续刷怪改成离散波次。每波常规敌人清空后才生成 Boss，Boss 死亡后进入奖励选择，再开启下一波。后续任何数值调整都应优先围绕波次表和 Boss 奖励节奏，而不是回到旧的无尽实时刷怪模型。

6. Visual identity should stay geometric and low-noise.
当前表现语言仍然是低饱和、几何化、轻阴影的扁平风格。新增塔、Boss、特效时优先用圆、圆角矩形、三角形和简单冲击波，不要引入高纹理、高噪点或写实特效。

## Immediate Status

The fast-iteration TODO pass is complete.

- `useGeoGuardGame` is still large, but its highest-risk rule layers are now split into engine helpers for tower progression, rewards, placement, boss flow, combat math, wave state, and wave progression.
- Canvas drawing has moved into `src/view/canvas/canvasRenderer.js`, so the main hook now delegates scene rendering instead of owning the full draw tree.
- Canvas resize, input listeners, joystick updates, context-menu targeting, and the animation-frame loop now live in `src/logic/hooks/useCanvasGameLoop.js`.
- Boss editor draft state, mutation handlers, import/export, and debug authoring overrides now live in `src/logic/hooks/useBossEditorRuntime.js`.
- Boss ability effects now live in `src/logic/engine/bossAbilityRuntime.js`, with focused tests for hazard callbacks and money side effects.
- Projectile hits, drop pickup, transient visual cleanup, and hazard settlement now live in `src/logic/engine/combatFrameRuntime.js`, with focused runtime callback tests.
- Project validation is now available through `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd`, and the git workflow calls it before commits.
- Regression coverage now reaches beyond stat rules into wave tick progression, reward follow-up, drag preview behavior, boss aftermath gating, combat resolution, boss authoring draft rules, and audio cue definitions.
- A debug-only boss authoring lab and a built-in synthesized audio layer are now part of the shipped toolset for fast iteration.
- The remaining work is no longer "missing core workflow" work. It belongs to the long-term backlog in [long-term-todo.md](D:/WebProjects/GeoGuard/docs/long-term-todo.md), where it is tracked as balancing, presentation lift, deeper runtime cleanup, and optional integration hardening.

## Known Risks

1. useGeoGuardGame is still the highest-risk file for future edits.
因为它仍然同时包含波次、建塔、debug 桥接、Boss 阶段调度和战斗更新，后续在该文件做改动时要优先小步验证。

2. Touch behavior is sensitive to small threshold changes.
BuildBar 里的触摸阈值和延时很容易出现“能滚不能拖”或“能拖不能滚”的回归。

3. Reward quality is better, but still not fully deterministic.
Adaptive reward history now reduces repetition and adds situational support, but the system is still not seeded or authored enough for strict balance playback.
