# r04 收尾增量清点与待执行检查

快照 2026-10-02T15:27:51.260Z。与r03相比新增6072个路径、5个字节数变化，零旧路径消失；所有既有失败历史和审查证据路径仍在。当前859个Git可见新增文件、13个tracked源码修改。全路径增量在 incremental-inventory.json。QA与qa-skills仍封包，实际最终清单以后续owner READY和根审为准。

qa-skills 新增目录已完整纳入：2523文件，258249852字节，包括权限/准备记录、静态95技能与条件/幸存者映射、r01封包、所有实际运行快照/截图/帧记录、审计脚本与报告。不得只保存最新packet，也不能删除不完整/被退回运行。

本次保留所有历史submissions与失败证据；主审performance-preflight-r04明确performance-02、performance-crossfire-02和旧无塔/无弹体尝试要保留，performance-03通过不能替换它们。integration/r05/scenes-final的点击超时与scenes-02重验均保留。reviews新增performance-preflight-r04与final-visual-preflight-r04需保存，并最终补齐QA与qa-skills通过记录。

精确node_modules源码镜像仍三套143文件：

- docs/art-implementation-2026-10-02/qa/submissions/r02/baseline/node_modules/geoguard-baseline (75文件)
- docs/art-implementation-2026-10-02/qa/submissions/r03/snapshots/node_modules/baseline (34文件)
- docs/art-implementation-2026-10-02/qa/submissions/r03/snapshots/node_modules/candidate (34文件)

普通source快照与QA candidate的所有目录/文件列表在增量包。r03镜像白名单规则不需扩大。当前77个vite-cache目录、1220文件、217564983字节；只有 /docs/art-implementation-2026-10-02/**/vite-cache/ 继续排除它们，涵盖qa-skills新runs。当前规则未修改。本次没有.tmp以外的browser profile命名发现，没有达到100MiB的交付文件。逐值凭据检查等最终新增日志封存后再做，当前不扩大先前扫描结论。

## 验证范围与命令（尚未执行）

最终root QA工具36文件（33个.mjs）、qa-skills顶层5个.mjs、art测试3文件均列在qa-tools-and-tests.json，并仅对这批小文件建立SHA，未重复880产品/核心数值全量哈希。相对r03新增root QA工具10个，主要是最终函数矩阵、命中/普通奖励/资源恢复/技能/性能/UI补充及contact/session脚本；没有新增root art测试文件。

待根派发、所有封包通过并停止owner写入后，建议一次执行：

1. C:/Users/Administrator/.codex/skills/project-ops-workflow/scripts/ops/StructureCheck.cmd（npm run check:architecture）。
2. node --test tests/art-baseline-contract.test.js tests/art-final-preparation.test.js tests/art-snapshot.test.js，仅新增QA/美术工具契约测试，不重跑核心玩法数值测试。
3. node --check 逐项检查validation-requirements.json的38个syntaxPaths；不执行模块、import、能力、浏览器或模拟。
4. C:/Users/Administrator/.codex/skills/project-ops-workflow/scripts/ops/Build.cmd（npm run build），一次冻结产品构建。

当前项目Validate.cmd的默认链包含npm test = node --test，会重跑核心数值/模拟回归。当前明确要求不重复核心，故不能静默调用全量Validate/Test/默认Commit验证；应在根最终派发中采用既有核心证据复用+上述定向最终检查，记录准确命令/文件SHA/结果，然后本地Commit.cmd -SkipValidation，避免重复全量npm test。这里是待派发建议，不是已执行检查或保存授权。若根另行明确要求完整npm test，再按新派发执行。

三个art测试覆盖序列化与RNG/集合隔离、已审批integration r01哈希/375键、最终输入适配、RAF有效性/负载可比性、DEV观测隔离与skill observer边界。它们不测试qa-skills的run-skills.mjs整体运行语义；node --check仅排除语法错误，95实际技能与幸存者/条件作用必须由独立qa-skills封包和根审提供，不能把工具单元测试替代真实性验收。npm build也不编译docs QA脚本。

最终保存沿用r03步骤：根审完整通过后，精确删除.git/info/exclude中本轮docs规则/其专属注释，保留其他rules；用Ignore.cmd添加scoped Vite缓存规则与三套精确镜像例外；保存完整审查链与所有失败历史，再本地commit并clear。未派发不得stage/commit/ignore修改，未单独派push不得推送或触发Pages发布。

本轮没有测试、构建、浏览器、性能作业、stage/commit/push/fetch；源码、public、owner文件和ignore保持原样。此准备完成后保持空闲，不轮询清点。
