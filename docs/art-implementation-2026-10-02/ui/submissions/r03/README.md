# UI r03 · 完整资源桌面候选

保留已批准的 r02 UI 源码，本轮只准备 UI 自有审阅脚本与证据。九塔、单 Boss、双子与幸存者头像通过公开 `getCharacterIcon` 接入角色 r04，未另画或替换角色图。

最终采样为 1440×900、1280×720、960×720，DPR 1。`runtime-verification.json` 中的 `provisionalUnsealedCamera` 必须为 false、源码采样期间零变化，方可运行封包脚本。正式依赖及 SHA 以报告与 packet 为准。

- 真实 GameScreen：普通开始与原鼠标建造、1.25 倍镜头下的世界坐标落点、暂停与 Escape 恢复、九塔及原生鼠标滚动条末页、HIVE、TWINS 和通过原攻击击杀产生的单行 ENRAGED 幸存者；每个桌面尺寸均采样。
- 原重置后拖回建造栏：原鼠标先拖出再拖回，钱 45、塔数 0；三个尺寸均验证。
- 真实组件数据夹具：单 Boss、双子、幸存者、配置中最长组合的 Boss 标题/对策、状态条和奖励 1/2/3；每个尺寸均采样。奖励由原 rewardRules 构造，卡片全部位于视口内，每次选择只调用一次。
- 全部实际 `<img data-art-id>` 必须完成解码，src 与公开 API 一致；UI 缺失标签为 0；角色 HTTP 请求无失败；实际运行 Canvas 回退、绘制错误和表现错误均须为 0。

测试场画面通过原开发 GUI 解锁/拖放/阶段跳转。双子幸存者使用原 Wave 1 检查点开启 debugWaveFlow，再原 GUI 拖入双子、Boss Duel 与 Phase 3，由原 combat/defeat 实际产生；没有任意状态 setter。HUD 保留 TEST FIELD 与无限资金信息，仅用浏览器临时 CSS 隐藏开发面板以免遮挡玩家 UI；不将这些画面称作正常第九波。采样使用既有 DEV reset/step/snapshot 时钟桥接，没有改产品源码。1/2/3 奖励夹具不证明完整游戏中的经济可达性。

r02 已通过的 145 项测试、11 项架构检查、构建、字体实际命中和操作检查保持有效。8 个 UI 文件的 SHA 必须与 r02 完全一致，不重复整套未改测试；本轮覆盖资源和镜头相关边界。95 技能调度、玩法差分、DPR2 与性能由独立 QA 负责。本提交不自行宣布完整项目验收。

`preflight/` 保存未封包镜头预采样：当时双子拖放幽灵错误使用 `boss:TWINS`，导致 Canvas 回退，已交主审协调接入方。这些文件是排错过程，不能代替根目录的最终采样。

运行：本地 Vite 127.0.0.1:5174 启动后 `node verify-final.mjs`，依赖封包检查通过后重拍；确认图片后 `node seal-final.mjs`。`--fixtures-only` 仅组件夹具，`--develop-camera` 是尚未封包镜头的预检查，不能用于正式封包。封存后需新建 revision，不得覆盖。
