# QA r02：固定基线与执行工具准备

日期：2026-10-02（Asia/Shanghai）。提交范围是独立工具、固定旧基线和实际执行证据，不是候选美术最终验收。

基线 `23ce1a33d0a72674286d67ba80c8f7b1260153e2` 通过只读 Git 对象读取导出，74个原始文件逐字节保留。统一契约采用主审批准的 integration r01，packet SHA `b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba`。没有 Git 写操作，没有修改 src/public/package/既有测试，没有安装依赖，也没有跨线程工具消息。

## 已执行结果

|检查|实际结果|证据|
|---|---|---|
|QA工具测试|7通过|qa-tool-tests.log、test-execution.json|
|固定基线原有测试|138通过|baseline-existing-tests-02.log；首次传目录的错误命令原样保存在 baseline-existing-tests.log|
|固定基线构建|通过，82模块|baseline-build.log；产物仅在本r02 baseline/browser/dist|
|固定基线逐帧行为参考|96组，155,520帧；基线文件运行前后稳定|behavior-frame-hashes.jsonl、behavior-comparison.json|
|首次候选差分尝试|观测到0数值差异，但候选文件并发变化，valid=false；不计候选通过|behavior-comparison.json 的 changedDuringRun、fingerprints、limitations|
|源码保护审计|分别记录raw/CRLF→LF内容SHA；观察时13项仅换行，受保护逻辑实质差异为combatOffenseRuntime|protected-file-audit.json；该文件仍需按合同逐行确认，并未整体豁免|
|真实Canvas定帧|三尺寸catalog/density共6例，30次只读绘制/共享RNG检查/transform恢复通过；双子3例失败|browser-baseline-fixed-02/report.json与每例purity/state/PNG|
|真实源UI鼠标与键盘|960×720、1280×720、1440×900：建造/取消/重叠拒绝/不足拒绝/暂停/恢复移动通过，另沙盒九塔与奖励选择通过|browser-baseline-ui-03/report.json、ui-flow.json及逐次游戏自身telemetry导出|
|性能基线|真实Canvas固定场景3×60s，各10s预热；p95帧间隔约16.7ms，3轮>50ms均0|performance-baseline/report.json、performance-1/2/3.json|
|375采集工具待产行为|375条均pending，0张候选截图，0视觉通过；没有拿schema计作渲染|action-samples.json、action-tool-readiness/report.json|
|资源合同工具|批准封包和文件SHA一致；旧基线角色/world模块不存在，正确报告pending|baseline-resource-status.json|

## 独立发现与限制

**QA-B001：固定基线双子绘制异常。** `canvasRenderer.js` 的 drawBossEncounterLinks 调用 `dist(a,b)`，其模块未导入/声明 dist。浏览器报 `ReferenceError: dist is not defined`，三个尺寸均可重现；固定基线原有138测试仍通过，说明此用例未被已有Node测试覆盖。详见 issues.json。该问题属于旧基线，不冒称新美术引入；主审可交集成 owner 处理，QA不会改实现。

行为参考是实际生产引擎导出的构造phase probe，强制Boss HP推进阶段、使用探测血量，没有覆盖完整hook/economy/reward流程。每帧对完整状态、事件和RNG序列计算摘要；只有批准的三个projectile元数据字段被显式按对象域剔除。不是只比较最终数值，也没有用换行差异放宽运行数值检查。

性能参考是固定真实实体/弹体的**绘制压力**，不是完整游戏 update/输入/AI 的实战FPS。本次固定场景实际24敌、9塔、6弹、0危区；不代表95技能高密度联合负载。浏览器为已安装 Chromium 153.0.8010.12，headless，1440×900，DPR1；共享主机其他进程负载未受控。候选固定后必须同环境补全同场景与完整游戏性能比较。不能据此提前宣布性能验收。

初次浏览器运行库默认 chromium_headless_shell-1234 路径不存在，改为机器已有headless Chromium1243目录（实际版本153），没有安装。初次测试包含JSX资源的基线放在node_modules下导致React转换不适用，因此建立byte-identical的无tests浏览器副本。第二次UI JS/真实交互已成功，但Tailwind原content相对cwd有读候选class的风险；该轮只保留为工具修正历史，不能当隔离基线视觉。正式UI轮 ui-03使用固定基线绝对content路径重新采集。没有改基线源文件掩盖这些工具问题。

所有已采集图默认 captured_unreviewed。独立实际查看过的图只按 visual-review.json/initial-visual-review.json逐张记录；当前没有任何候选角色375动作、连续动画、机关技能、资源失败或完整美术替换被批准。

## 工具与后续

可运行入口见仓库 `scripts/art-validation/README.md`。源代码工具清单及SHA在packet的ownedCode中，r02证据文件在files中；基线导出和实际构建输出也封存。Vite cache属于可再生缓存，不列为验收证据。

375具体Actor/Frame映射、事件观测与完整候选快照需求见 interface-requests.md。等主审派发已固定owner/集成候选后，才验证真实生产资源、完整375实际截图与逐图审阅、全部95技能与双子幸存、真实UI全流程、加载失败和基线/候选性能。已通过基线/工具保留，不反复跑高成本滚动候选。

本轮完成后按授权同时发布 qa根READY.json 和 r02/READY.json，保持r01原封不动。最终美术验收仍由主审与用户决定。
