# GeoGuard 新电脑接手指南

更新时间：2026-10-03。此文件是跨电脑接手入口，优先于历史验收中“尚未推送/等待试玩”的时间状态；它不覆盖不可变历史证据。

## 当前结论与进度

- 分支 main；远端 https://github.com/onovich/GeoGuard 。本轮用户明确授权提交全部文档变化并推送，包括之前本地保存的实现提交817f70840502eff5522ef8f9a89b2fbb427e14ac。
- 贴纸小怪美术已经实际接入：9塔、1英雄、14敌人、17Boss身体（16组遭遇）、7机制，共48身份；375动作参考映射和95技能对应关系。数量不等于375独立动画。
- 前轮内部功能/逻辑/资源/QA验收通过；2026-10-03严格电脑端视觉审查不通过，美观还原返修待办已登记，尚未开始修复。用户最终美术验收没有通过。
- [完整视觉画册](art-direction/sticker-bible-2026-10-01/index.html)汇总45张当前图板；旧探索折叠归档。先看两张r04整体原画，再看场景/UI/角色独立拆解。
- [20项视觉待办](art-fidelity-2026-10-03/backlog.md)：10项P1、9项P2、1项验收补充，附验收标准；[三组审查及证据](art-fidelity-2026-10-03/evidence/summary.md)已正式落盘。
- 已归档9个原画制作/交付会话及截图指定的10个实现/QA会话。源稿、prompt、封包、审批和代码全部保留。主会话仍承担协调；后续任务可以由新会话仅凭此仓库接手。

## 新电脑启动

安装Git、Node.js 24（与CI一致），确认有仓库读取权限。在所选目录执行：

```sh
git clone https://github.com/onovich/GeoGuard.git
cd GeoGuard
git switch main
git pull --ff-only
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

已有checkout先保存自身变化再pull，不覆盖本地工作。打开 http://127.0.0.1:5173/ 。画册用浏览器打开本机clone内docs/art-direction/sticker-bible-2026-10-01/index.html，保留整个目录的相对路径；旧电脑file:///D:/...路径不能直接在新电脑使用。

常规检查：

```sh
npm run check:architecture
npm test
npm run build
```

仓库带大量历史视觉QA图片，完整clone体积较大；需要全部历史基线检查时不要只浅克隆到当前一次提交。不要用npm安装的node_modules替代docs内被特例保留的冻结源码镜像。

## 下一阶段怎么做

先读取待办和原画生效规范，收敛整体r04与canonical平色板的线条/颜色目标；按角色/构图与UI并行修复，再精修背景。此前主要落差：角色小、描边细、Q弹弱、Boss特征被效果压低、战斗反馈噪声、卡栏重、开始/结算通用化、奖励卡层次弱、Boss长名断字、关键动作字过小。

保留Boss AI、数值、经济、伤害和碰撞核心规则。允许相机、表现尺寸、枪口挂点、动画状态与UI改变。固定脚部水平root，美术不追加世界位移；子弹/闪光/命中、独立召唤实体与身体分离。电脑端优先，手机暂缓，开发者/测试界面低优先级。

主会话负责验收，可并行工作使用独立文件所有权、不可变submissions/rNN、packet+SHA及READY持久队列；不要依赖多个会话抢发消息。新修复不得改写历史已批封包。每项关闭需原画定位、原尺寸实机和动作证据；功能检查和资源覆盖不能代替美观验收。

## 当前证据边界

这轮审查全部45板；48身份当前renderer诊断全覆盖；真实试玩9塔、13可直接刷敌人及16Boss组。SPLINTER、完整机制/95技能视觉窗口、DPR2多尺寸、正常奖励链等本轮不足的证据登记VF-20。旧fallback几何摆场已排除；开发条遮挡、示例资金/位置差异不算玩家缺陷。BURST历史不对称未再复现。

前轮[实现验收](art-implementation-2026-10-02/reviews/final-acceptance.md)、[协调/各模块入口](art-implementation-2026-10-02/coordination.md)、[原画验收](art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/final-acceptance.md)保留其历史语境。不要误读“内部通过”为本轮视觉通过。

## 本轮可移植性修正

默认npm test原来递归发现docs封存的旧QA测试副本，造成历史路径ENOENT。本轮仅将package.json测试入口限定为node --test tests/*.test.js，151项正式测试通过；没有改游戏源码、public或封存QA。此工具入口变更意味着历史包含package.json的880文件指纹只用于817f708，不能要求本轮新HEAD仍与其完全相等。

## 机器差异与发布

.codex/project-git-workflow.json、project-ops-workflow.json和Windows.cmd含旧电脑D:/WebProjects/GeoGuard与C:/Users/Administrator路径；新电脑需要按实际路径重建机器配置/安装对应skills，不能直接照用绝对路径。npm命令不依赖这些包装器。本地浏览器QA脚本还依赖旧电脑Codex bundled Playwright和Chromium位置，新电脑需配置自己的运行库/浏览器；浏览器仅为常规试玩不需此依赖。老QA的source绝对路径仅历史记录，不表示资源需要从旧电脑读取。

main push会触发.github/workflows/deploy.yml的GitHub Pages部署。此次是用户授权同步当前候选，视觉返修尚未完成。同步成功后以origin/main为版本来源；部署完成以Actions结果为准，不能把git push成功当页面发布成功。

[9个原画会话归档](art-fidelity-2026-10-03/art-session-archive.md) · [10个实现会话归档](art-fidelity-2026-10-03/implementation-session-archive.md)。归档是可恢复会话状态，不是删除；跨机器未必同步本地Codex会话，本指南和仓库交付足以继续。

可以给新电脑Codex发：

> 先阅读docs/HANDOFF.md及docs/art-fidelity-2026-10-03/backlog.md。当前实现可用，严格视觉还原未通过；本轮只登记未修复。基于45板画册开展电脑端还原返修，保持核心逻辑，按独立所有权与packet/READY协调并逐项验收。不要重新生成旧稿或把历史验收当当前美观通过。
