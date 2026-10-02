# 全项目贴纸小怪技术集成契约 r01

2026-10-02 · 提交主审，未自行批准。只提交文档、机器可读合同和只读核验脚本。本轮未修改 src/public/package、未执行 Git、未接入资源。

**启动条件是两个独立门槛：基线发布完成，且主审批准此契约。** 当前 observed-baseline.json 只是勘察时工作区文件指纹，不是已发布版本证明。主审派发前固定发布基线指纹并对照本包；如果玩法源码不同，重新核对映射，不覆盖当前证据。

## 实施入口

|文件|用途|
|---|---|
|[identity-and-state-index.md](identity-and-state-index.md)|48 身份、全部 375 状态的可读索引|
|[identity-map.json](identity-map.json)|运行 ID、变体、半径来源、解剖锁、分工|
|[state-reuse-375.json](state-reuse-375.json)|逐条身体参照、复用、固定锚、器官、独立实体和效果合同；保留上游定位|
|[boss-skills-index.md](boss-skills-index.md)|实际 95 技能速查|
|[boss-skills-95.json](boss-skills-95.json)|真实分派、召唤/机关/几何、逻辑位移、生命周期及对应源码摘录|
|[runtime-boss-variants.json](runtime-boss-variants.json)|从实际模块构造出的全模板/阶段/双子幸存技能|
|[runtime-boundaries.md](runtime-boundaries.md)|对象边界、事件、层次及必须防止的错误映射|
|[module-api.md](module-api.md)|worker 应实现的明确导出/API 和 DTO|
|[coordinates-and-assets.md](coordinates-and-assets.md)|根锚、炮口、碰撞、镜像、拆层及资源交付规则|
|[ownership-and-rollout.md](ownership-and-rollout.md)|唯一文件所有权、派发依赖和阶段验收出口|
|[validation-and-freeze.md](validation-and-freeze.md)|逻辑指纹、差分与桌面实测验收|
|[sources.json](sources.json)|已核对的输入文件与七张最终桌面图 SHA|
|[observed-baseline.json](observed-baseline.json)|本次只读勘察的 src/public/tests/scripts/配置文件指纹|
|[coverage.json](coverage.json)|自动提取覆盖及分派核验|

本包确认 9 塔、1 玩家、14 普通敌人、17 Boss 身体（16 遭遇）、7 机关，总计 48；375 条是动作/状态/方向/等级参考，不是 375 套独立动画。普通敌人 SPLINTER 虽不在 ENEMY_ORDER 调试列表，仍必须有资源。Boss T1/T2/T3 复用同身份。

实际默认/幸存技能 95，优化处理器 37，含历史支持的有效处理器共 100。历史支持的 hiveHeal/twinOrbit/twinBolt/twinSwap/dragonBreath 不加入默认战斗；tailSweep 没有处理器，不发明新攻击。95 条上游摘录与当前有效实现逐条空白归一后匹配，覆盖无缺项。这不是动态战斗回归通过声明。

生产优先级以 art-replacement-plan、production integration r02 生效文字规范、desktop-final-acceptance 及 delivery r02 为依据。已实际查看七张最终桌面图。delivery 的历史 submitted 状态由外部验收覆盖；不把原画验收当运行资源验收。新 UI r02 的实际 1/2/3 张奖励布局覆盖旧文档“固定三张”的例子，最终以 rewardState.choices.length 为准。

只完成电脑端：960×720、1280×720、1440×900 和高 DPR。手机不开发、不作阻塞验收；保留现有输入可用性，开发者工具仅防回归。图册像素不是世界坐标，生成设定板、整图或标注格禁止裁为正式游戏资源。

## 本轮明确决策

- 角色模块生产全部身体与机关；world 模块生产背景、影子、弹体、危险区、状态和事件效果；UI 独占玩家组件及玩家 designSystem 扩展；集成独占 renderer/GameScreen/必要 hooks 接入。
- UI 新建 PauseOverlay.jsx，集成替换 GameScreen 中的暂停 JSX。共享 designSystem 以新增玩家 tokens/variant 为主，保留开发者已有接口。
- 首轮逻辑弹体仍出生在 owner.x/y。集成单独添加 sourceArtId/sourceUid/shotIndex 三个只读表现字段，world 不碰发射逻辑。用户允许真正调整出生点；如选该方案，需新合同增量和近距离轨迹差分，本 r01 不实施该分支。
- 不增加 AI、伤害、数值、奖励、拾取、机关目标或技能，不由动画发射或结算。坐标改动只在表现空间内发生。
- 提交 packet.json 后最后原子写 READY；后续不得原地改 r01，退回用 r02。主审统一轮询、审批和派发，无跨线程主动消息。

提交后停等主审；本包未授权 worker 越过基线门槛写入 src/public。
