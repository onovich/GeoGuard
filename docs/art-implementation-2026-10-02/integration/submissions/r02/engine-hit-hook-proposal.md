# 已获主审批准并实施：精确命中来源的最小接线

提案时 combatFrameRuntime.js 保持发布基线原字节，真实命中仅传入 enemy、amount。主审现已在 reviews/hit-source-and-status-addendum.md 批准如下两行，已实施并同步更新冻结归一化核验；三种命中实机视觉仍不以单元测试代替验收。

projectile 是该函数内部倒序循环的局部变量，命中回调时可能与多发弹体位置重合，也可能是 splash 的次级目标。外层按位置、最近弹体、数组末项或伤害值反查均不可靠。

建议仅为现有 damageEnemy 回调加第三个只读来源参数；不新增回调次数，不改循环、命中判断、调用顺序、伤害、RNG、弹体出生点或删除条件：

```diff
--- src/logic/engine/combatFrameRuntime.js
+++ src/logic/engine/combatFrameRuntime.js
@@ direct confirmed hit
-        damageEnemy(enemy, projectile.damage);
+        damageEnemy(enemy, projectile.damage, projectile);
@@ confirmed splash damage
-              damageEnemy(otherEnemy, projectile.damage * 0.5);
+              damageEnemy(otherEnemy, projectile.damage * 0.5, projectile);
```

hook 回调接收第三参，原 damageEnemy(enemy, amount) 照常调用；sidecar 同步复制 sourceArtId/sourceUid/shotIndex/kind 等标量，绝不把可变 projectile 交给绘图模块。未使用第三参的模拟器/测试调用者行为保持不变。已补同帧消失、穿透多目标、溅射与多发同点的真实来源验证，并重跑冻结差分。
