# Integration r02 — 桌面真实可玩样板

状态：供主审审核的 G2 接线样板。不是 48 身份 / 375 状态 / 95 技能的全量视觉验收，不代替角色、world、UI 或独立 QA 的审批。

发布基线：`23ce1a33d0a72674286d67ba80c8f7b1260153e2`。契约沿用 integration r01，packet SHA `b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba`。精确命中来源和状态字段另获 `reviews/hit-source-and-status-addendum.md` 批准。本轮未执行 Git 操作。

## 已接入

- Canvas 通过 characters/world 公共 API 绘制。世界坐标、真实碰撞中心、固定 root 阴影、临时排序、身体、弹体/反馈、危险区边界、状态、关系线、HP/等级、合法放置 ghost 分层；排序不改 gameplay 数组。
- view sidecar 按 gameTime 推进。真实新弹体在同帧可能消失之前记录；攻击进度随时间推进。BURST 身体使用真实发射束中心线，四孔位置来自同一变形 rig，每个 flash 使用该发真实速度的角度。逻辑弹体仍从原中心出生。
- 成功 birth 去重；NEST 真正产出幼体才触发，SHARD 真实死亡产出才分裂。SEAL/RETICLE 成功结算、确认被命中击破、自然到期/失主/失目标分别呈现 trigger、broken、neutral 淡出，不复活进玩法集合。机关持续地形和 root 扩张也观察真实结果。
- direct/splash 命中回调复制来源标量；精确保留 kind/sourceArtId/sourceKey/shotIndex/projectileKey，不把原 projectile 交给绘图，不按颜色/距离/伤害猜测来源。
- GameScreen 接入 UI owner 的 PauseOverlay；HUD member.artId、onLayout→StatusBanner topInset 接线。DEV 只读 snapshot 可供 QA。资源缺失有明确错误和旧画法回退，回退身份不计完成。
- JAM、healAura、fuse 只读字段已传到既有 ActorOverlay，见 `status-api-addendum.md`。world 对 heal/fuse 的具体视觉实现仍待其新包；不将字段存在计作效果完成。

唯一生产文件修改范围见 `scope.json`。引擎只含获批的 offense 三个来源字段及 combatFrame 两行第三参。其余 data/engine 经移除这两项精确增量后，与 r01 observed release bytes 相同。QA-B001 在当前 Canvas 仅补 `dist` import；旧封存基线保持原样。

## 验证事实

`validation.json`：构建通过；106 条现有逻辑/架构/UI 检查全部通过；`integration-checks.json` 核验冻结边界、10 发射来源、同帧消失、攻击进度与 root、真实机关分类、干扰/光环/引信资格、basic/cannon/sniper 命中来源、穿透/溅射/四发同点顺序，以及四孔位置和四发角度。

`browser-stable-nohmr/report.json`：固定源码快照，Edge 154，1440×1000/DPR1/headless，10 项真实 GUI smoke 通过，0 页面错误，0 运行期源变更。覆盖鼠标建塔、真实 BASIC 射击/命中、HIVE→NEST→BASIC、SHARD 死亡分裂、SEAL、四发 BURST、暂停/继续、阻断 world 模块后仍可玩，以及双子旧渲染连线。`browser-detail/` 另存真实键盘移动、放置 ghost 和活体 SEAL 截图。全程不注入游戏状态。

源码复制 `source-snapshot/` 共用本包 `captured-source.json` 的指纹；复制时无源变更。它是可重跑的固定样板，不随角色并行扩展静默变化。运行 Vite 时禁用 HMR/watch，避免工作区中其他 worker 的热更新打断。可复现命令：

```powershell
node docs/art-implementation-2026-10-02/integration/submissions/r02/browser-smoke.mjs browser-rerun docs/art-implementation-2026-10-02/integration/submissions/r02/source-snapshot
```

封存后不可把输出写入本 r02；重跑请将 script 第二参改为 r02 之外的绝对输出目录。浏览器脚本第三参是固定源码目录。`run-validation.mjs`/`verify-integration.mjs` 的历史输出已保存，后续重跑会写结果文件，也必须复制到新 revision 执行。

## 截图实看与限制

已实看 BASIC 放置、HIVE/NEST/幼体、暂停、BURST、SEAL 场景和双子 fallback 全图。身体/影子落地、背景、UI 与暂停模态确实来自生产 API；双子和霜 Boss 的几何外形是明确的资源回退。样板的 Debug 面板沿用原调试布局，会遮挡部分 HUD，这不是正常玩家 UI 的最终验收截图。`05-seal.png` 拍于击破后，只证明当时战场；活体 SEAL 用 detail 包截图和实际 Actor/retired 日志验证。

样板 manifest 仅八身份为 `produced_pending_review`：PLAYER、BASIC/BURST 塔、BASIC/SHARD 敌、HIVE、NEST、SEAL。未知/未生产身体用 retained legacy body；其他图标目前可能显示文字。375 registry、95 技能表及候选数据文件不等于本轮运行覆盖。

保留所有失败尝试：初轮 SEAL 无活塔目标、一次随机战斗未观察到 BASIC 攻击、两次热更新/导航打断；这些目录不计通过。最终稳定快照/no-HMR 运行通过，不改写旧失败结果。

尚待：角色 G1 修复外部批准；world heal/fuse 新效果包；三种命中家族完整实机视觉；960/1280/1440 全玩家流程、奖励与全角色状态；独立 QA 逐帧差分和性能；48/375/95 全覆盖与发布审批。DEV seed/step/reset 尚未实现，具体设计见 `dev-qa-bridge-design.md`，不能据此宣称可重复模拟完成。

构建警告保留于 stderr：Browserslist 数据陈旧、主包超过 500KB、角色 API 被 UI 静态导入所以不能独立分块。已有资源失败回退不保证损坏整个启动 JS 模块时页面仍能启动；未作此泛化承诺。构建产物/浏览器缓存不在审查 packet 中，源码、截图、日志和 hash 都在。
