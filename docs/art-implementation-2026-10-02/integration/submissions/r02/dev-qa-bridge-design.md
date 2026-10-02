# DEV QA 接口：已实现部分与最小后续设计

当前仅 DEV 暴露 `window.__GEOGUARD_ART_INSPECT__()`，每次返回 structuredClone：真实 runtime state、gameState/paused/rewardActive、Actor/retired DTO、事件、资源错误与 fallbackArtIds。无 setter、无实体引用、无按钮，不可通过修改结果改变游戏。浏览器样板全程用鼠标建塔/拖放敌人、Esc 暂停及真实按钮，不依赖控制桥。

针对 QA-I04，建议下一版控制入口为 `window.__GEOGUARD_ART_QA__`，且只有 DEV + 显式测试 URL 参数启用；产品页面继续只有只读入口。待 G1 稳定候选后再落地，避免混入当前多人变动中的样板源。

最小签名：`reset({seed, mode:'normal'|'debug'})`、`step({frames, dt:1/60})`、`snapshot()`、`release()`。不提供 setState/spawn/setHP/setTower/跳过购买等任意写入口；场景搭建仍使用现有 GUI，375姿势采样仍通过角色公共 API。

时钟由 useCanvasGameLoop 的 DEV 分支选择自动 RAF 或手动调度；手动 step 调用同一个 hook update，并保留 PLAYING、pause、reward、visibility 的原资格。RAF 在手动模式仍绘图但不额外推进，切回自动时重置 lastTime，避免补偿跳帧。每步限定 0<dt<=0.05，与产品 clamp 一致；暂停 step 的 gameplay time 必须不变。

固定 seed 需局部 RNG 执行域，仅同步包裹真实 init/update/已授权 GUI 入口；使用同一个 PRNG 状态，try/finally 恢复原 Math.random，禁止跨 await 保持全局替换，禁止绘图消耗 PRNG。这样确定性测试才覆盖真实输入产生的随机，而非仅快照重新绘图。是否足够需独立审查所有会消耗 RNG 的现有事件入口，不能只在 RAF 内替换后宣称全流程已固定。

落地门槛：两次同 seed+鼠标脚本+step 的语义快照一致；不同 seed 的 RNG 序列不同；每次外部 Math.random 引用仍相同；暂停/奖励不推进；release 恢复自动；production bundle 没有控制入口；普通真实鼠标 smoke 原样通过。该文档是具体设计，不把尚未实现的 seed/step/reset 标为交付。
