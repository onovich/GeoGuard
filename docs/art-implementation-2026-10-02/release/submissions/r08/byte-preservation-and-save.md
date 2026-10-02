# r08 冻结字节保存边界修复与本地提交依据

根授权精确.gitattributes -text，保留现有属性、不改global/local core.autocrlf，不改任何冻结源文件字节。新增13条范围仅包含本轮docs、src/public、六个产品根配置、本轮QA脚本与三个art测试。README等其他目录仍按原Git策略。无语义/数值测试重跑。

规定Git wrapper无单独stage/renormalize或stage-before-commit审计接口；按本次明确授权，受控使用git add -- .gitattributes、git add --renormalize -- 获准路径，再git add -- 精确获准范围。最终提交使用project-git-workflow Commit.cmd -SkipValidation，依据根最终授权和r05有效11架构/13定向QA/36语法/build，r06的17qa-skills语法与本次r07新增101MJS语法结果复用，不推送。

实际暂存对象通过单个streaming git cat-file --batch读取3,901个唯一blob。9543个原始SHA256/byte约束全部一致：880冻结产品、六份全部QA/qa-skills封包及其8617项文件、最终QA40个所属代码文件。产品fingerprint原样f353ca072173dfb8e63f4b06506f0e4ad345cecc276fab8bfedf163d18ec3ac6。三套源码镜像143文件全部存在，历史证据路径零遗漏，缓存/profile/.tmp/helper未入index，范围外零变更。

14个旧跟踪文件仅LF→当前批准的CRLF字节保存变化：index.html、package-lock.json、package.json、postcss.config.js、src/App.jsx、src/data/gameConfig.js、src/logic/engine/bossAbilityRuntime.js、src/logic/engine/encounterRuntime.js、src/logic/engine/gameMath.js、src/logic/engine/gameState.js、src/main.jsx、src/styles/index.css、tailwind.config.js、vite.config.js。其规范化内容与基线完全一致。其余14个旧跟踪内容变化为此前批准的13个产品适配文件加.gitignore机械规则；新增.gitattributes与所有美术/QA/审查材料均在获准范围。

首轮stage发现三份旧QA baseline/browser/dist文件因原通用dist/忽略未纳入。实际源SHA正确，属于既有封包固定证据，已为具体3文件添加精确ignore例外，root dist仍忽略，其他新构建仍不开放。旧失败audit留staged-blob-audit-before-evidence-dist-fix.json，修复后零不匹配。143源码镜像白名单未扩大。Vite缓存仅本轮docs/**/vite-cache排除，根.tmp内所有Chrome profiles/cookie/cache及用户临时成果继续保留，不删除。

完整候选清单、原SHA约束和敏感字面量/大文件清点在final-prestage-ledger.json；11119个候选文本文件高置信token/private-key/AWS-key扫描零发现，单文件>=100MiB零、已知临时browser数据路径零。只检查项目候选，没有读取cookie值或声称全机器凭据检查。所有历史封包/失败/返修/复测、qa-skills、final-acceptance.md均保存；没有覆盖已封存r01–r07。

本文件和r08 packet是提交前封存依据，未写入自引用commit SHA；提交后只读核对实际commit树全部9543原SHA、完整候选path/raw blob、冻结880指纹、clean/ahead状态。最终回执与READY只写已经忽略.tmp/final-art-release-2026-10-02，不修改已提交docs。仅本地保存，用户试玩验收前不push和Pages发布。
