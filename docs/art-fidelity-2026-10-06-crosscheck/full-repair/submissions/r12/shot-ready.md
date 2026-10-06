# r12 真出生适配 · 可独立实机诊断入口

入口 `/docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r12/shot-runtime.html`。此为下一包可先审核的运行诊断，尚未声明十源全通过，也没有关闭总清单。

## 实现与规则边界
- 已撤掉所有纯表现距离衰减偏移；所以该弃用策略的横向偏移、衰减最陡切线角等不再运行。真实实体 `x/y/previousX/previousY` 同取当前原像素炮口M；后续图像中心就是实体中心，直线切线与atan2(vy,vx)一致。
- 新引擎可选边界 `projectileBirth.js` 接受视图提供的纯坐标。无回调的旧调用保持中心出生。正常游戏真实offense调用已接视图原像素anchor；不再宣称src/logic diff为空。
- PLAYER原稿无解剖炮口，明确名义中心独立发射，不编造嘴/器官。近期射击期间其显示朝向优先射击方向，避免右移覆盖左/上射击。
- 真实炮口出生会改变远处命中时间（沿速度方向投影/速度），并可能改变平行轨迹侧偏；这些是明确允许的出生适配影响，不伪称逻辑逐帧相同。攻击目标选择、伤害、数量、速度标量、弹体半径、伤害碰撞规则、射程、经济、AI保留。
- 大源炮管可能跨过近敌：从旧中心到M按真实活敌hurtbox半径(enemy.radius+projectile.radius+4)做线段截断，留0.5世界px。中心已在hurtbox内则保持中心；死亡/潜地实体不阻挡。该夹取点是**真实出生点**，源闪光也固定该点，避免在敌身后闪光。身体M仍可与accepted不同，测试页绿十字/红点明确展示，不能称所有近敌都解剖M重合。
- 子弹自身独立AI之外的实体生命周期/HP及Boss规则没有变更；本包不涉及Boss出射适配。

## 入口范围
十源PLAYER+9塔、四正方向与四斜方向、距离110/60/30/10，出生/单帧/持续播放/0、1、3、6帧采样，实际offense、实际projectile swept collision、实际presentation和drawStickerScene。输出真实birth metadata、命中帧/位置/距离及演员aim/facing；PLAYER右移可对左/上目标射击。绿十字与红点仅QA功能标记，不进入玩家。

此摆场冻结敌AI，目标HP12，粒子/飘字/冲击callback为空以隔离首弹，因此不是正常关卡或完整反馈认证。炮口轴与自由aim的形体一致性尚未过审，尤其三圆塔下向斜管和方向整帧的中间aim，不能仅M落孔位算通过。需要主审实际CUA截图/判断后继续修。

## 已执行验证
`node scripts/art-validation/projectile-source-birth.test.mjs`：7近场边界+50真实十源offense比较；数量及速度标量、damage/life/kind/radius/pierce/splash/slow、shotIndex相同，真实previousXY=出生XY。该测试用确定坐标回调，不冒称验证原图实际M。
`npm test`151/151；`npm run build`通过117模块。QA脚本node语法通过。本人CUA未有效实测，等主审集中浏览器审；无真实截图主张。

## 继续范围
本包尚无十源全覆盖截图/最大方向误差自动表，实际近敌首弹时间及可见距离由入口提供；下一步收敛该数据与原图轴，随后95技能、动作/密度、来源失效、桌面交互、DPR2模拟及性能。此前48静态通过不等于整体完成。

## r02 实机空射返修（尚未整体通过）
主审确认MORTAR下向110出现实体30帧x43.28、y184.49且hits=[]，拒绝该首稿。现在真实offense从accepted出生点重新瞄准**原先已选目标**，BURST每孔出生以统一身体baseAim取源M，再以真实出生→同目标角加原散射offset。保留速度标量，不再承诺vx/vy分量相同。sourceAimAngle独立记录身体原瞄准，避免按新弹体方向反向改变取样炮口；闪光沿新弹体angle，在真实accepted点。侧移目标测试43,-25→0,110已增加，原测试50组及7边界通过。实际炮管轴形体与该新轨迹仍要收敛，本包未批准。

## r03 刚管轴试审 / 诚实边界
圆体7塔（含BASIC/BURST，排除wholeframe SNIPER/RAIL）真实射击开始采用原PNG刚性绕既有连接点自由旋转，M同矩阵，原投影静态QA不改。身体记录sourceAimExact/sourceFacing/sourceAimAngle；视图从同一目标迭代求源M与出射轴，BURST用四孔平均M求共享主体瞄准、各孔保留真实出生及相对散射。MORTAR源杯本来斜向约-0.8rad，sourceBoreAxisAngle区分真实斜杯轴与图片横坐标轴；此前imageXAxis不是炮杯真实轴，仍保留原值不偷偷改名当一致。
`source-aim-math.json`从真实source变换和offense产生，未decode图片，因此仅数学证据。110远距圆塔除合法BURST散射外的源轴/实际轨迹误差约0.02度以内。**近距30仍存在迭代无法收敛/枪管穿过目标的反向问题，wholeframe两长颈塔斜向也仍不一致，不宣称本包通过。**需继续改善近场策略与真实视觉连接/遮脸检查；当前仅请主审可先复看MORTAR下110改过的实际rigid PNG轴。
