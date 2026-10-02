# 主审指定的状态字段增量

这些字段已加入 Actor，所有现有 drawActorOverlay(ctx, actor, anchors, frame, assets, 'status') 调用会传递它们。没有新增 hazard 或由 artId 猜测能力；world 独占 overlay 实现。本轮不计 heal/fuse 的视觉完成，等待 world 新 revision。

- `states.jammed: boolean`：hook 注入实际 `getTowerFireRateFactor` 纯查询函数。对一个仅 frozenTimer=0 的塔副本查询真实 state，因此冻结与干扰可同时表达，范围、倍率和目标资格沿用 engine。无引擎编辑。
- `healAura: null | {active, range, amount, eligibleTargetKeys}`：来自实体的实际 healAura；source 活着、不是机关、已出土才 active。目标资格逐字对应 enemyBehaviorRuntime：排除自身、死亡、Boss、机关，且处于真实 range 内。满血目标仍是 engine 可遍历目标；该字段表示持续作用资格，不声称本帧发生了正值治疗。
- `jamAura: null | {active, range, fireRateFactor}`：来自实体实际 jamAura。塔是否受影响以 states.jammed 为准，不能由角色身份推断。
- `fuse: null | {active, remaining, duration, radius}`：来自 explode/fuseTimer。仅活体、非机关、已出土、计时为有限正数时 active；null/未点燃/已到期不画引信。radius 是实际爆炸配置，但不准伪造为新的 hazard。

所有数据都是展示副本，由已有 ActorOverlay 调用消费；不改 hp、RNG、技能或施法顺序。fuse.remaining 为 null 时仍保留原值，不能用默认倒数伪造即将爆炸。
