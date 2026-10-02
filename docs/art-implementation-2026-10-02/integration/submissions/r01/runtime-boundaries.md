# 运行对象与实际技能边界

## 身份解析顺序

先判 player 的调用入口，其次 towers；enemies 内先判 mechanic.kind，再判 isBoss，最后普通 id。不以颜色、shape 或渲染大小猜身份。

|运行输入|美术身份|
|---|---|
|state.player，没有 id/uid|hero:PLAYER；表现 key 使用本局 epoch/player|
|state.towers[].id|tower:<id>，9 种，level 0..3 对应 LV1..LV4|
|enemy.mechanic.kind|mechanic:<大写 kind>，runtime id 为 MECHANIC_*|
|enemy.isBoss && twinRole=sun，id TWIN_SOL|boss:TWINS_SUN|
|enemy.isBoss && twinRole=moon，id TWIN_LUNA|boss:TWINS_MOON|
|其余 Boss id，按现有 getBossBaseId 去 _T[123]|boss:<baseId>；不同阶段和 tier 不创建新身体|
|其余 enemy.id|enemy:<id>，包括独立的 SPLINTER|

uid 只在实体所属域和当前局内唯一；不能混用 tower uid=1 与 enemy uid=1。身份用于选资源，`epoch/domain/uid` 用于连续表现状态；新局与 clearDebugField 要清理表现缓存。无 uid 的 projectile/hazard/drop/particle/impactWave 以对象 WeakMap 标识，禁止给逻辑分配新 uid 或消耗 RNG。

## 机关、召唤物和身体部件

七机关都是 state.enemies 中有 hp/maxHp/radius/uid 的独立实体。角色 worker 画本体，world 画关联地形/连线/消散；不可作为 Boss 贴图中的固定器官。

|机关|当前实际行为|表现约束|
|---|---|---|
|NEST|定时 spawnAround BASIC；初次 timer=3，随后6；有所有权/数量/位置预算|只为真正生成的 BASIC 画出生效果；不凭触发动画画固定3只|
|WEB|plant 后 queueMechanicTerrain；独立 hp；地形 area 半径52，ownerMechanicUid|结点本体与危险盘分层；击破后按逻辑清除对应地形|
|ROOT|地形 area 初始半径44；timer到期创建新 ROOT 并设 parentUid|新根是独立 hp 实体；连线不是身体触手；失败生成不显示新节点|
|WALL|solid=true，独立碰撞半径；14秒 life，重建时旧墙 hp=0|软造型不能隐藏阻挡体；不新增矩形碰撞；画实际圆形阻挡足迹辅助辨识|
|SEAL|锁目标塔 uid；timer到期真实冻结塔后自身 hp=0；可提前击破|连线依有效目标存在；不能把任意消失都播成“冻结成功”|
|RETICLE|timer到期向塔当前位置排 area hazard 后自身 hp=0|锁标本体可击破；触发后的独立预警依 hazard；不画成飞弹|
|COURIER|有 cargo，逃逸向量和8秒life；未escaped时击破直接加money|返还反馈不创建 state.drops，不要求玩家再拾取|

bossMechanicEntities 中 Boss 消失会使其机关 hp=0；settleMechanicDefeat 删除 ownerMechanicUid 匹配的 hazard，Boss 清理另删其 sustained terrain。普通攻击余波并非一律随 Boss 死亡消失。美术只跟随当前数组和所有权，不自行统一清空所有遗留危险区。

独立召唤敌人复用对应 enemy 资源。SCOUT、SHARD、BASIC、PHASE 等不会因归属 Boss 而改变身体身份。SHARD 死亡生成 SPLINTER；BEACON 实际召 BASIC（普通 BEACON 的子单位不因其死亡就被美术隐藏）。效果只能根据实际生成结果，而非请求数量。HIVE spawnHive 优化版生成 NEST；NEST 孵 BASIC；summonSwarm 回落基础实现生成 SHARD。三者不可混成同一种孵化动画。

身体部件有父级挂点、无独立 uid/hp/行为生命周期，例如 FROST_JUDGE 冠、HIVE 固定器官、DRAGON 翅尾；可拆层但不能增加可攻击目标。日月各自独立 hp、actionMode、阶段、根锚，遭遇 HUD 可以汇总但不合并身体或血量来源。

## 技能、动作与效果

`useGeoGuardGame.runBossAbility → runBossOptimizedAbility` 有 handler 直接执行，否则 `runBossAbilityEffect`。完整95表见 JSON，不从技能英文名字推断几何。例如 orbitalShots/refractVolley/railShot 使用危险线，meteorRain 用落点 area；它们不是 state.projectiles 里的敌弹。只有实际 projectile 对象才用飞行弹体渲染。

当前 Boss 时钟由 tickBossCombatRuntime 管理：intro → idle → windup → execute → attack（仍有攻击 hazard/dash/reticle）→ recover；无 live attack 可直接进入 recover。attack 时长可能由存活 hazard 决定，不能用固定动画时长结束。phaseIntroTimer/currentPhaseIndex/actionTimer/windupDuration/castAbility/partnerFallen 都只读。OPEN 全身提示读取 `damageTakenMultiplier>1`；recover 姿态不等于强制显示弱点。

图册 DRAGON/TAIL 对应 wingBuffet 的身体参考，不创建 tailSweep；TWINS/SWAP、ORBIT 等历史参考若无默认技能映射，保留复用记录，不安排新行为。PHASE_DASH 是相位状态/移动表现，不额外写 dashVx。SQUASH/STRETCH 是本地动画子姿态，不是逻辑位置指令。

## 事件获得方式（集成独占）

- 发射：在两个 offense 调用之后、updateProjectileRuntime 之前捕获新追加弹体；读取来源字段，用实际对象建 WeakMap 与 shot feedback。即使弹体本帧命中即删除，已确认的发射仍可留下短暂无伤害闪光。
- 生成：包裹当前 hook 的 spawnAround/spawnEnemyAt/runBossAbility 调用，比较新实体引用与返回成功数；只读新实体。机关可能在优化模块直接 push，runBossAbility 前后集合差分捕获。普通 NEST/ROOT tick 则在 enemy 更新前后差分捕获。
- 受击：读取 hitFlash/hp/shield 的真实变化。投射物命中由现有 damageEnemy/spawnParticle/spawnImpactWave 回调上下文记录；不得仅靠某弹体消失推断命中（可能超时）。
- 死亡/消散：在当前 defeat/remove 路径前冻结最后一次表现 DTO；原因未知时只播中性消散，不伪造触发成功/掉落。
- SEAL/RETICLE 触发：必须能观察到该次 tick 的目标冻结或新 hazard；hp=0 本身不够。同时发生多个来源无法精确归因时省略成功特效，保留真实结果提示。
- 暂停、奖励遮罩、失焦时逻辑 gameTime 不前进，表现动画冻结。加载完成不补播历史攻击，不运行额外 update。

事件属于 view/art/integration sidecar；不放入 gameplay collections，不让 worker 注册可能写 state 的函数。effect 生命周期允许无伤害淡出，但危险边缘在对应 hazard 消失时立即消失。无事件数据可以回退常态；不能猜测不存在的攻击。

## 绘制层

屏幕底色 → 世界地面纹样 → 地形/危险区浅填充 → 固定根锚影子 → 掉落 → 身体/机关（同层按root.y稳定排序，只排序临时数组）→ 独立弹体与短促效果 → 危险区边界重描 → 状态/所有权连线/血条/等级 → 放置幽灵及独立射程/有效性 → 屏幕 HUD/面板。

world 负责边界重描接口，集成保证只画一次填充与一次边界；不把 hazard 填充误画为始终有伤害的地形，不让纹样/影子/装饰遮住危险边界。镜像只影响角色，文字/徽记/血条不镜像。所有 draw 保存恢复 ctx（含 dash、alpha、shadow、transform）；逻辑数组顺序完全不动。
