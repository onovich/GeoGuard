# 命中来源与状态 DTO 增量审查

决定：批准 integration/submissions/r02/engine-hit-hook-proposal.md 的两处最小第三参数接线，以及 status-api-addendum.md 的真实只读资格字段。

combatFrameRuntime.js 仅将现有 direct 和 splash 两处 damageEnemy 调用追加同一局部 projectile 作为第三参。原目标、伤害表达式、调用次数、循环顺序、命中/溅射/穿透判定、随机数及删除逻辑不变。hook 仍调用原 damageEnemy(enemy, amount)，仅同步复制来源标量到表现 sidecar，绘制模块不可获得可变弹体引用。

JAM 读取实际纯查询资格；治疗光环和引信读取现有实体配置、计时和实际目标资格，不凭身份猜测、不新增hazard。资格不等同本帧成功治疗，提示不能伪造回血结果。

引擎冻结例外现在仅 combatOffenseRuntime 的三个来源字段和 combatFrameRuntime 上述两行第三参。QA需同帧消失、穿透多目标、溅射、多发同点及完整逐帧差分验证；任何其他引擎变化单独审查。此批准不是效果或候选运行通过。
