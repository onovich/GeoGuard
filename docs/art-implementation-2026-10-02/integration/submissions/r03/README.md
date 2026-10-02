# Integration r03 — DEV 确定性时钟桥与真实效果接线

状态：供主审/QA 采用的独立修订。r02 已不可变并获 `reviews/integration-r02.md` 主审通过；本包不宣称全角色、375动作、95技能或整游戏验收完成。

本轮新增生产文件仅 `src/view/art/integration/devQaBridge.js`，修改 `useGeoGuardGame.jsx` 与 `useCanvasGameLoop.js` 的必要接线。data/engine 与 r02 完全相同，只有此前获批的 offense 三字段和 combatFrame 两行第三参；已执行精确归一化冻结检查。未执行 Git；未修改其他 owner 的生产文件。

## QA 用法

仅 Vite DEV 页面且 URL 带 `?artqa=1` 时存在 `window.__GEOGUARD_ART_QA__`。不带参数仍可正常鼠标游戏，但没有控制桥。生产构建扫描确认控制桥、只读 inspector 和 PRNG 错误字符串全部不存在。

```js
const qa = window.__GEOGUARD_ART_QA__;
qa.reset({ seed: 1729, mode: 'debug' }); // mode 只允许 normal/debug，调用原 initGame
// 通过现有真实 GUI 鼠标拖塔/敌人、选择奖励，或键盘移动。
qa.step({ frames: 60, dt: 1 / 60 });
const evidence = qa.snapshot();
qa.release(); // 恢复 RAF；不会解除已有暂停/奖励/结束限制
```

公开 API 只有 reset/step/snapshot/release；没有 setter、spawn、修改HP/数值/奖励或跳过购买接口。seed 为 uint32；frames 限1..3600；0<dt<=0.05。reset 使用原 initGame，所以调试面板开合、横向滚动、音频与 Boss 编辑草稿等既有 UI 状态不会被偷偷重写；重复测试须用真实 GUI 明确这些输入条件。

step 调用同一个 hook update，逐帧 flushSync 提交 React 状态，因此批量 step 也会看见新出现的奖励或结束状态。资格与产品 RAF 相同：PLAYING、未暂停、无奖励、页面可见。手动模式 RAF 继续绘图而不额外推进。release 重置 lastTime，避免恢复时补偿跳帧。

## 随机数、延时与观察

每个同步逻辑入口使用局部 seeded PRNG，try/finally 恢复原 Math.random 引用，不跨 await。覆盖 update、原 initGame、鼠标提交建塔/调试实体、布局、波次、奖励、Boss 编辑器生成和强制阶段等实际入口；没有给绘图提供 PRNG。音频首次噪声缓冲区在 seeded 逻辑域之外初始化，避免第一次 reset 特有的音频随机消耗改变玩法序列。

唯一会回写 runtime 的50ms拾取半径延时，在显式手动测试模式按 gameTime 排队；reset 清除该运行的队列，release 将剩余延时交回原生定时器。普通页面仍使用原50ms原生定时器。波次文案的 UI 消失计时继续用原定时器，不作为确定性玩法语义。

snapshot 返回 structuredClone 的三部分：

- `semantic`：真实 state/奖励状态及事件内容，用于同输入对比。只排除壁钟 lastTime 和 DOM 矩形；joystick 缺省 touchId 规范为 null；Set保留为数组结构。运行 epoch 规范为相对编号；事件 eventId/projectileKey 属于表现分配标识，完整值保留在 eventLog，不放入语义对比。
- `presentation`、`eventLog`、`art`：真实 Actor/retired、来源标量、资源错误和回退。eventLog最多4096条，`control.droppedEvents` 明示溢出；不伪造历史事件。绘制对象不拿可变弹体引用。
- `control` 与 `geometry`：手动状态、seed/PRNG状态/消耗数/待定时器及真实DOM矩形。手动推进的CPU耗时不等同真实RAF帧率；性能QA需明确模式。

## 已验证

`validation.json`：106个现有逻辑/架构/UI检查通过；bridge单元检查通过；集成来源/冻结检查通过；固定源码构建通过；`productionControlEntryAbsent=true`。

`browser-bridge-stable/`：固定源码上的真实鼠标建塔、拖入敌人、键盘移动，两次 seed1729 的 semantic 完全一致，400次PRNG调用、27个事件；seed1730不同。语义SHA `ad4524c83a06c927553bd49bee8e581eb9b6286c53ded3b1a15c4d49a8a13d56`。实际暂停、GUI奖励都阻止step；改snapshot结果不改游戏；检查段绘图不消耗native随机；Math.random引用恢复；release后真实时间继续推进。

`browser-qualifications-stable/`：利用真实GUI和上述时钟推进，world r03 的受干扰塔、带有效目标的医疗光环、实际点燃引信可见；没有为它们增加hazard。暂停冻结真实资格/引信，恢复后真实爆炸/移除。CANNON、SNIPER从GUI建造到真实发射/命中，各自携带正确family并在画面出现；BASIC已有r02与r03回放事件证据。已实看三张资格/命中截图。治疗光环表示目标资格，不声称满血目标得到了正值治疗。

世界依赖为已通过主审的 world r03，packet SHA `262e4c66738cd66168c37f3423d3bb2835fb9206e12419249fc2c211b3319018`。角色源仍处于并行合并阶段，截图中已出现新角色也不构成其外部通过；以主角色最终 READY/主审为准。

`source-snapshot/` 与 `captured-source.json` 固定此次869文件来源，复制时零变更。稳定浏览器结果只指这份快照；Vite禁用HMR/watch。`browser-qualifications/` 第一轮引信检查失败源于调试拖动终点处于面板区域，之后使用有效战场位置、等待真实接触点火并重跑通过，旧失败保留。缓存/编译产物不计入packet，验证日志保留。

封包后不要在r03内重跑写输出。脚本第二参可指定r03外的绝对输出目录，第三参指定固定source-snapshot；单元与构建脚本请复制到新revision后再运行。

## 后续边界

此桥立即供独立QA固定真实输入使用；未替代保护逻辑子集的96组逐帧差分。完整角色/375动作/95技能、全玩家三尺寸/奖励/密集性能仍待联合验收。相机保持1CSSpx/世界单位；完整角色到齐后再提供1440×900无Debug面板的密集画面及1.0对1.2–1.3视觉比较。采用zoom前必须统一逆变换、ghost/射程/危险区，行为对比用相同世界输入，未在本轮默认加zoom。
