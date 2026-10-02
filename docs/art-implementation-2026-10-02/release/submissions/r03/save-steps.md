# r03 本地最终保存准备（未执行）

只读快照：2026-10-02T14:39:55.749Z 至 2026-10-02T14:39:56.321Z。13 个 tracked 源码修改，849 个可见新增文件；本轮 docs 14337 个文件、408895767 字节（不含随后新建 r03 封包/QA 持续输出）。完整逐文件路径在 inventory.json。根 HEAD 和本地 origin/main 仍是 23ce1a33d0a72674286d67ba80c8f7b1260153e2，暂存区为空。

## 冻结与审批

当前根 src/public/配置共880文件，SHA256清单指纹为 f353ca072173dfb8e63f4b06506f0e4ad345cecc276fab8bfedf163d18ec3ac6，与根审指定 f353… 一致；QA r04 candidate 镜像与锁 b2ff7e280d52aa49cad9d3fd582cf6bec70adf7f998d0c6d54fcd4d676514a88 验证一致。仅做 SHA 读取，没有执行玩法/性能测试。角色r04、worldr03、UIr03、integrationr05模块已据根审消息通过；integration-r05.md明确模块通过不等于完整项目通过。QA r04 最终资源/技能/操作/真实性能正在进行，本封包既不宣称QA完成，也不授权保存或push。

保持全部审批链：mirror-whitelist.json 列出40个 reviews 文件，其中包括独立行为对照JSONL、根审可玩记录、r01契约、r02/r03返修与模块通过记录；各 owner READY、全部历史 submissions、packet/SHA、失败与重验报告必须一并保存。integration/r05/scenes-final 的点击超时证据不能因 scenes-02 已通过而删掉。r04/comparison各版、QA r01–r04与未完成/失败记录全部保留。不得只保存当前最终图或仅最新packet。

## 精确源码镜像白名单

- docs/art-implementation-2026-10-02/qa/submissions/r02/baseline/node_modules/geoguard-baseline: 75文件 / 689673字节
- docs/art-implementation-2026-10-02/qa/submissions/r03/snapshots/node_modules/baseline: 34文件 / 218219字节
- docs/art-implementation-2026-10-02/qa/submissions/r03/snapshots/node_modules/candidate: 34文件 / 220290字节

共143文件，1128182字节；逐文件名单见 mirror-whitelist.json。这些是审查源码/固定行为镜像，不是第三方依赖。解除 docs 临时规则后仍会被通用 node_modules/ 隐藏，未来以精确例外保存；保持当前位置，不改快照或封包哈希。普通 source-snapshot/source-candidate/source-final/qa r04 candidate 全部正常保存，精确目录及文件数量同见白名单文件。不要把这些只读镜像当作重复垃圾删除。

已发现22个vite-cache目录、340文件 / 62154402字节，未来仅增加 /docs/art-implementation-2026-10-02/**/vite-cache/ 来继续忽略纯再生成缓存。所有截图、日志、对照JSON/JSONL和资源故障恢复记录正常保存，不能忽略整个QA目录或 *.log。通用dist/继续忽略生成构建；QA baseline/browser/dist属于可再生成构建，源码/日志/锁/manifest保留。八套旧 Chrome profiles仍全部在已忽略.tmp内；本次命名清点未发现.tmp外的browser profile或Cookies/History/Login Data/Local State/Web Data文件。没有逐值扫描浏览器数据。没有扩大先前凭据扫描结论；最终新增QA日志/回执须在结束后复核。当前清点未发现达到100MiB的交付文件；最大文件逐项在inventory。

## 根审最终通过并派发本地保存后的执行顺序

1. 等QA r04最终审查和根审完整通过，停止所有owner写入。重新清点QA收尾的新文件/大型图组，核对指纹、最终锁、各READY/审批SHA，以及scripts/tests/QA工具自身的最终验证覆盖；880候选指纹不包含新增测试工具，因此不能单靠它判断全部验证可复用。
2. 准备自己的下一轮提交前封包，记录完整最终候选清单、审批/测试证据和SHA。将.git/info/exclude备份到已忽略.tmp/final-art-release-2026-10-02/。UTF-8无BOM原子改写原exclude，仅移除完全匹配的 /docs/art-implementation-2026-10-02/ 和其专属注释 # Active art replacement coordination; excluded from the pre-art baseline only. 保留其他全部行。不能把整段docs规则搬入.gitignore。
3. 用规定 Ignore.cmd 依次添加mirror-whitelist.json的futureIgnorePatternsInRequiredOrder。这里只有未来命令清单，本轮未执行。通过check-ignore与逐项visible清点确认三套143个镜像、所有正常doc和审批链可暂存；root node_modules、.tmp、两个根Python helper、各vite-cache继续忽略。若QA未来新增另一镜像，先逐项核查再精确补白名单，不能扩大到所有node_modules。
4. 用 Status.cmd 清点所有正常项目成果。验证覆盖必须由根审最终有效证据决定，未覆盖的项目要求通过 Validate.cmd 运行架构/测试/构建；已验证且完整最终范围SHA一致时可在Commit.cmd使用-SkipValidation，避免重复全量测试。任何失败如实记录，不修改冻结产品来满足保存要求；需要源码修复时退回owner和根审重新冻结。
5. 仅本地提交：Commit.cmd -Message 'feat: implement desktop sticker art and preserve review evidence' -Paths '.gitignore,src,public/art,scripts/art-validation,tests,docs/art-implementation-2026-10-02'。此为当前精确范围；最终清点发现其他获准正常成果时追加其路径。默认Commit.cmd包含规定验证；使用-SkipValidation必须有上一步对完全相同范围的有效证据。不能用CommitAndPush.cmd。
6. 比较提交树与最终清单：产品源码/资源、QA工具/测试、全部审查材料、三套143文件镜像均完整；缓存/profile不在树中。执行Status.cmd，所有正常变更清空；本地main领先origin/main属预期。根审仅派本地保存时不执行Push.cmd，不用commit-and-push，避免自动Pages线上发布早于用户最终验收。
7. 只读提取本地commit，post-commit回执与原子READY写入已忽略.tmp/final-art-release-2026-10-02/，最终回复包含实际commit与清空确认。不回写已提交packet造成新变更；r01/r02/r03封包不修改。正式docs审查材料已全部纳入提交，不再整段隐藏。
8. 待用户最终验收且根审单独明确派发push后，另用Push.cmd正常推送。届时可通过已验证的process-scoped HTTPS url.insteadOf+现有credential helper，保留remote、不输出token、不force，fresh ls-remote确认。如远端变化，先读取差分并保留双方成果再验证；不得自行发布。

## 所需wrapper精确路径

- Status: C:/Users/Administrator/.codex/skills/project-git-workflow/scripts/git/Status.cmd
- Validate: C:/Users/Administrator/.codex/skills/project-git-workflow/scripts/git/Validate.cmd
- Ignore: C:/Users/Administrator/.codex/skills/project-git-workflow/scripts/git/Ignore.cmd
- Commit: C:/Users/Administrator/.codex/skills/project-git-workflow/scripts/git/Commit.cmd
- Push: C:/Users/Administrator/.codex/skills/project-git-workflow/scripts/git/Push.cmd

机器配置 .codex/project-git-workflow.json；人读策略 docs/codex-git-workflow.md；Validate.cmd转调用 C:/Users/Administrator/.codex/skills/project-ops-workflow/scripts/ops/Validate.cmd。下一封包应重新读取现行配置，当前未更改任何ignore/index/ref或其他owner文件。
