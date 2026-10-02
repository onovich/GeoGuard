# 最终保存准备 r02（只读清点）

快照时间：2026-10-02 21:46:06–21:46:07 +08:00。制作仍进行中，以下数量不是冻结后的最终清单。HEAD 与本地 origin/main 均为 23ce1a33d0a72674286d67ba80c8f7b1260153e2；暂存区为空。本轮未 fetch、测试、stage、commit、push，未修改其他 owner 的文件、源码、ignore 或 Git index/ref。

## 当前精确范围

13 个已跟踪源码修改路径：

- src/logic/engine/combatFrameRuntime.js
- src/logic/engine/combatOffenseRuntime.js
- src/logic/hooks/useCanvasGameLoop.js
- src/logic/hooks/useGeoGuardGame.jsx
- src/view/canvas/canvasRenderer.js
- src/view/components/BuildBar.jsx
- src/view/components/GameHud.jsx
- src/view/components/OverlayScreen.jsx
- src/view/components/StatusBanner.jsx
- src/view/components/WaveRewardOverlay.jsx
- src/view/components/ui.jsx
- src/view/designSystem.js
- src/view/screens/GameScreen.jsx

Git 可见的新增文件 823 个，其中美术资源 783 个：角色/Boss/普通敌人/机制实体/塔的 PNG、SVG、rig JSON 与 source SVG，世界 v1/v2 弹体、危险区、反馈图。新增源码 26 个（src/view/art 25 个，PauseOverlay.jsx 1 个），QA 工具 12 个，测试源码 2 个。所有逐文件路径、字节数、当前 tracked/modified/visible/ignore 状态见 inventory.json；该文件保存了 823 条新增可见路径的完整列表。

本轮 docs 当前 4380 个文件、150216623 字节（不含封包随后新建文件），整体未跟踪并被 .git/info/exclude 第 9 行精确隐藏。包括 owner 的 READY/各 submissions 历史轮次、审查记录、截图、动作样本、对照状态与哈希、源码快照、QA 报告、诊断/测试日志、原始生成与适配证据、协调记录和 release 封包。不能只保存最新 READY 或最终资源而漏掉审查链。

| 范围 | 文件数 | 字节数 | 已跟踪修改 | 可见未跟踪 | 被忽略 |
| --- | ---: | ---: | ---: | ---: | ---: |
| docs/art-implementation-2026-10-02/boss-a | 71 | 3107104 | 0 | 0 | 71 |
| docs/art-implementation-2026-10-02/boss-b | 152 | 5459887 | 0 | 0 | 152 |
| docs/art-implementation-2026-10-02/characters | 327 | 17372609 | 0 | 0 | 327 |
| docs/art-implementation-2026-10-02/coordination.md | 1 | 2555 | 0 | 0 | 1 |
| docs/art-implementation-2026-10-02/enemy-batch | 51 | 2439254 | 0 | 0 | 51 |
| docs/art-implementation-2026-10-02/integration | 3106 | 53930592 | 0 | 0 | 3106 |
| docs/art-implementation-2026-10-02/qa | 414 | 62792823 | 0 | 0 | 414 |
| docs/art-implementation-2026-10-02/release | 7 | 38943 | 0 | 0 | 7 |
| docs/art-implementation-2026-10-02/reviews | 25 | 54114 | 0 | 0 | 25 |
| docs/art-implementation-2026-10-02/ui | 153 | 3144758 | 0 | 0 | 153 |
| docs/art-implementation-2026-10-02/world | 73 | 1873984 | 0 | 0 | 73 |
| public/art/characters/v1/boss | 378 | 2715378 | 0 | 378 | 0 |
| public/art/characters/v1/enemy | 276 | 1576671 | 0 | 276 | 0 |
| public/art/characters/v1/hero | 6 | 21880 | 0 | 6 | 0 |
| public/art/characters/v1/mechanic | 32 | 111022 | 0 | 32 | 0 |
| public/art/characters/v1/tower | 54 | 315392 | 0 | 54 | 0 |
| public/art/world/v1 | 34 | 60907 | 0 | 34 | 0 |
| public/art/world/v2 | 3 | 8543 | 0 | 3 | 0 |
| scripts/art-validation | 12 | 48225 | 0 | 12 | 0 |
| src/logic/engine/combatFrameRuntime.js | 1 | 7402 | 1 | 0 | 0 |
| src/logic/engine/combatOffenseRuntime.js | 1 | 3416 | 1 | 0 | 0 |
| src/logic/hooks/useCanvasGameLoop.js | 1 | 9542 | 1 | 0 | 0 |
| src/logic/hooks/useGeoGuardGame.jsx | 1 | 43444 | 1 | 0 | 0 |
| src/view/art/characters | 9 | 389456 | 0 | 9 | 0 |
| src/view/art/contracts.js | 1 | 1812 | 0 | 1 | 0 |
| src/view/art/integration | 4 | 33243 | 0 | 4 | 0 |
| src/view/art/world | 11 | 35761 | 0 | 11 | 0 |
| src/view/canvas/canvasRenderer.js | 1 | 53509 | 1 | 0 | 0 |
| src/view/components/BuildBar.jsx | 1 | 7759 | 1 | 0 | 0 |
| src/view/components/GameHud.jsx | 1 | 7335 | 1 | 0 | 0 |
| src/view/components/OverlayScreen.jsx | 1 | 1664 | 1 | 0 | 0 |
| src/view/components/PauseOverlay.jsx | 1 | 1047 | 0 | 1 | 0 |
| src/view/components/StatusBanner.jsx | 1 | 797 | 1 | 0 | 0 |
| src/view/components/ui.jsx | 1 | 4635 | 1 | 0 | 0 |
| src/view/components/WaveRewardOverlay.jsx | 1 | 3604 | 1 | 0 | 0 |
| src/view/designSystem.js | 1 | 5315 | 1 | 0 | 0 |
| src/view/screens/GameScreen.jsx | 1 | 4308 | 1 | 0 | 0 |
| tests | 2 | 4652 | 0 | 2 | 0 |

## 本地数据与潜在遗漏

- .tmp 现有 293787150 字节，八套 Chrome profile 及其 Cookies/History/Cache 等均受 /.tmp/ 规则保护；另有 smoke 截图、日志、player-playtest 和 project.zip，全部留本地，不删除。get_chrome_cookies.py、preview_upload.py 的根目录精确排除仍有效。
- root node_modules、dist 仍由原有规则排除；既有已跟踪 dist.zip 是此前发布成果，不应删除或把它误当作本轮待发布构建。
- 本轮 docs 内已发现 15 个 vite-cache 目录、228 个文件、42375309 字节。解除 docs 临时隐藏后，这些缓存默认会变为 Git 可见！仅对 /docs/art-implementation-2026-10-02/**/vite-cache/ 添加 ignore，保留本地；不要加 *.log 或整段 qa/integration 忽略，因为日志和截图是审查证据。精确缓存路径见 inventory.json 的 cacheRoots。
- QA 基线导出在 docs/art-implementation-2026-10-02/qa/submissions/r02/baseline/node_modules/geoguard-baseline 下：75 个文件、689673 字节，包括 source、10 个测试文件和 baseline-manifest.json。它是固定 23ce1a33d0a72674286d67ba80c8f7b1260153e2 的审查源码镜像，不是下载依赖。解除 docs 隐藏后，通用 node_modules/ 规则仍会造成遗漏。应以精确 .gitignore 例外只保存这套镜像，保持它在 node_modules 内以避免 node --test 重复发现基线测试；不要搬动 owner 快照或改变引用/封存哈希。
- 在已扫描项目交付路径中，未发现 .tmp 之外的浏览器 profile 或 Cookies/History/Login Data/Local State/Web Data 等凭据命名文件；文本高置信扫描未发现 GitHub token、AWS access key 或 private key 字面量。未读取 cookies 值。该结果仅覆盖本次快照，最终冻结后需重新检查新增/变更候选，不构成整个机器的凭据审计。
- 最大当前审查证据是 qa/submissions/r02/behavior-frame-hashes.jsonl，33291360 字节（约31.75 MiB），应保留；本次交付清点未发现单文件达到100 MiB。不要因它体积较大删掉行为证据。当前 active worker 仍可能新增大文件。

## 仅在根审最终批准并明确派发保存后执行

1. 确认根审通过记录与用户验收顺序、冻结各 owner 写入。重新只读清点实际最终状态与封包 SHA，复核所有候选文件/日志的敏感信息、单文件和整次传输大小。r02 是准备单，不能把它作为源码已通过或推送授权。
2. 先备份 .git/info/exclude 到本 release 的下一封包。用 UTF-8 无 BOM 原子改写，仅删除完全匹配的两行（不动任何其他 rule）：

   /docs/art-implementation-2026-10-02/
   # Active art replacement coordination; excluded from the pre-art baseline only.

   不能覆盖整个 exclude，不能把这条目录规则搬入 .gitignore。当前不执行。
3. 经项目 Ignore.cmd 为已确认纯再生成缓存添加本轮 scoped 规则：

   /docs/art-implementation-2026-10-02/**/vite-cache/

   然后依次用 Ignore.cmd 添加以下四条精确例外，保存 baseline 源码快照但不开放其他依赖目录：

   !/docs/art-implementation-2026-10-02/qa/submissions/r02/baseline/node_modules/
   /docs/art-implementation-2026-10-02/qa/submissions/r02/baseline/node_modules/*
   !/docs/art-implementation-2026-10-02/qa/submissions/r02/baseline/node_modules/geoguard-baseline/
   !/docs/art-implementation-2026-10-02/qa/submissions/r02/baseline/node_modules/geoguard-baseline/**

   用 git check-ignore -v 和 git ls-files --others --exclude-standard 确认：正常 docs/审查材料、这75个镜像文件可见；根 node_modules、.tmp、helper脚本和 Vite缓存仍忽略。例外仅适用于这一份已核查审查镜像；未来修订另行清点，不能盲目扩大。
4. 在交付下一封包里保存根审批准的最终范围、证据清单和全部 owner 历史封包。对所有正常新增/修改成果使用项目 Commit.cmd 显式 -Paths，包含 src、public/art、scripts/art-validation、tests、docs/art-implementation-2026-10-02、.gitignore 和当时清点新增的其他获准成果；不要凭 r02 的静态路径数推断最后提交范围。
5. 按项目要求运行最终必要验证一次：优先根审已批准且源指纹完全相同的有效验证证据；否则由 Commit.cmd 的规定验证链 npm run check:architecture、npm test、npm run build 检查最终冻结版本。不在制作者尚写文件时运行或发布。失败如实记录，只修复明确发布问题并重新验收。
6. Commit.cmd 成功后比较已提交树与最终候选清单，确认 docs 审查链和75个镜像完整、纯临时数据排除。若当前已有完全相同冻结验证结果，可将验证 wrapper 先运行并记录，再 Commit.cmd -SkipValidation，避免无理由重复。
7. 只有根审根据用户验收顺序明确派发 push 时才用 Push.cmd 正常推送；没有这条派发，仅保留获准提交即可。上传可以复用已成功的 process-scoped url.insteadOf 转 HTTPS 和现有 credential helper，不更改保存 remote、不输出 token、不 force。如远端前进，先读取变化，合并保留双方成果并重新验证。
8. fresh ls-remote 核对远端指定 commit，Status.cmd 确认最终应保存成果已清空。最终提交前封存全部现有审查材料及 pre-commit/validation packet；提交后只读核查。为避免回写提交SHA造成新的变更，将 post-push 回执和其原子 READY 写到已忽略的 .tmp/final-art-release-2026-10-02/，在完成回复中提供实际 commit、remote 和该回执路径；正常 docs 不再保留任何整段临时隐藏。若根审指定另一回执位置或要求把提交后新记录也纳入源码库，应遵循派发范围另做正常记录提交/推送并再次核查。不要修改 r01/r02 已封存 packet；最终保存使用自己的下一轮新封包。

以上为未来步骤说明，本轮没有实施任何 ignore、stage、commit 或 push。文件逐项状态在活跃制作期间会变化，最终冻结清点才是保存依据。
