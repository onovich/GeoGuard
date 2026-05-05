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

## Current TODO

1. Replace the provisional wave table with authored wave data.
现在的波次由规则函数生成，适合验证循环，但还不是手工调优后的正式关卡表。后续应把每波敌人组合、Boss 类型、奖励节奏外提成显式数据配置。

2. Split useGeoGuardGame into smaller runtime modules.
当前主 hook 已承担波次推进、奖励选择、触摸拖拽、投射物和敌人更新，体量仍偏大。下一步应把 wave progression、tower placement、combat resolution 分拆到 engine 或更细的 hooks 中。

3. Add explicit boss UI.
Boss 目前有提示文本和较粗的血条表现，但缺少单独的 Boss 名称区、常驻顶部血条或更强的阶段感表现。

4. Revisit mobile input layering.
手机端摇杆、塔栏横向滚动和拖拽建塔已能共存，但边界仍然较紧。后续可以考虑给塔栏加显式“拖出建造”手柄或在移动端显示可滚动提示。

5. Add automated regression coverage for placement rules.
当前拖拽建塔、敌人占位检测、Boss 奖励升级都依赖手工验收。后续至少应为 wave generation、tower unlock/upgrade 和 placement validation 增加基础测试。

6. Balance the expanded tower roster.
新解锁的 6 种塔已经可用，但主要是功能与节奏打通，尚未完成正式数值平衡。应重点观察 Frost、Burst、Rail 三类塔是否过强或与基础塔重叠。

7. Add mid-run recovery and late-game sinks.
原始设计文档里提到的回血、长期资源消耗和更深成长仍未补全。后续可以在 Boss 奖励之外增加玩家被动升级、医疗掉落或功能型塔。

## Known Risks

1. useGeoGuardGame is still the highest-risk file for future edits.
因为它同时包含输入、渲染、波次、建塔和战斗，后续在该文件做改动时要优先小步验证。

2. Touch behavior is sensitive to small threshold changes.
BuildBar 里的触摸阈值和延时很容易出现“能滚不能拖”或“能拖不能滚”的回归。

3. Reward choices are random but not yet seeded or weighted.
当前 Boss 奖励是随机抽取升级/解锁选项，适合原型阶段，但不适合可重复平衡验证。