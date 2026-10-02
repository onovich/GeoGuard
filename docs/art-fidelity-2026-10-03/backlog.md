# 电脑端美术视觉还原待办

登记日期：2026-10-03。状态：全部待办，尚未启动修复。10项P1、9项P2、1项验收补充。依据三组只读审查，功能可用不等于美观还原通过。

保留Boss AI、数值、经济、伤害和碰撞核心规则；允许必要的相机、表现尺寸、动作和UI调整。开发/测试界面与手机端不属于这一轮优先范围。

| ID | 优先级 | 待办 | 问题与改善方向 | 验收标准 | 证据 |
|---|---|---|---|---|---|
| VF-01 | P1 | ☐ 角色屏幕尺寸与世界存在感 | 场上角色过小，表情和器官压成符号；校准相机及表现尺寸，保留碰撞中心和危区几何 | 1280×720与1440×900原尺寸可辨BASIC嘴、BURST四孔及双子表情 | [scene](evidence/scene/report.md) · [characters](evidence/characters/review.md) |
| VF-02 | P1 | ☐ 屏幕描边与微型五官 | 源描边随身体缩小至约1px以下，贴纸感消失；定义屏幕最小线宽与小尺寸五官/炮孔表达 | DPR1/2下外轮廓、内线和炮孔不吞并 | [characters](evidence/characters/review.md) |
| VF-03 | P1 | ☐ 世界与建造栏视觉权重 | 底栏偏重，开局三卡右侧空框大；联动主体比例，精简纵向空隙并优化初期容器 | 主体先被看见，140px卡与横滚/真实解锁规则保持可用 | [scene](evidence/scene/report.md) |
| VF-04 | P1 | ☐ 常态动作Q弹力度 | MOVE/ATTACK表现弱于关键姿态；按身份调整节奏、非线性压缩拉伸和软器官跟随 | 真实运行连帧可见Q弹；水平root固定，美术不追加世界位移 | [characters](evidence/characters/review.md) |
| VF-05 | P1 | ☐ Boss特征与四状态表现 | 独特表情/部件在小尺寸和公共光环中被压低；逐Boss调整特征姿态与身体/外部效果轻重 | 16组Boss正常/准备/释放/恢复的原尺寸连帧，包含双子成员 | [characters](evidence/characters/review.md) |
| VF-06 | P1 | ☐ 高密度反馈噪声 | 伤害数字、碎片、血条叠成噪团；表现反馈密度预算、同目标数字合并、效果轻重分级 | 高密度群战能先找到英雄、身体和危区；实际伤害结算不变 | [scene](evidence/scene/report.md) · [characters](evidence/characters/review.md) |
| VF-07 | P1 | ☐ 开始/暂停/结算品牌与状态 | 通用弹窗、标志和按钮语义色弱；叶片标志、破碎结算符号、sage开始/继续与coral重试 | B05/B07对照实机三状态，遵守浅底深棕字规范 | [ui](evidence/ui/report.md) |
| VF-08 | P1 | ☐ 奖励卡视觉层次 | 整卡绿色，徽章弱、参数长段落、CTA弱；奶油底、类型徽、清楚图标、参数分组和语义色CTA | 同类型三奖及1/2项/mixed合法状态，字段完整且CTA底对齐 | [ui](evidence/ui/report.md) |
| VF-09 | P1 | ☐ 单/双Boss姓名排版 | 方阵司令被50px列断成方阵司/令；区分单/双成员布局并扩展姓名空间 | 最长中文名与长对策不出现孤字，独立血条与阶段动作完整 | [ui](evidence/ui/report.md) |
| VF-10 | P1 | ☐ 关键动作文字层级 | 暂停、拖建、不足仍有12px字；按正式电脑规范采用14–16px关键动作层级 | 暂停先达16px，辅助字不盲目放大，按钮布局不挤压 | [ui](evidence/ui/report.md) |
| VF-11 | P2 | ☐ 背景纹样分布节奏 | 当前世界中心样本草/浅斑过疏；多世界窗口统计后调整稀疏均匀度 | 保留低对比、开放地面与无碰撞装饰；不伪装影子/弹体 | [scene](evidence/scene/report.md) |
| VF-12 | P2 | ☐ 角色落地影子 | 根部影子过弱，身体像悬浮图标；独立根影尺寸/透明度分级 | 强于地面斑、弱于身体，严格跟随固定root | [scene](evidence/scene/report.md) |
| VF-13 | P2 | ☐ 跨稿色彩与线条权威收敛 | 整体r04与后续canonical板存在视觉取舍；明确生效颜色/线宽并用整体合成复核 | 保留mint资源与深棕文字，不照抄生成图cyan/浅底白字 | [scene](evidence/scene/report.md) |
| VF-14 | P2 | ☐ BASIC嘴与微型器官读感 | 嘴偏小折钩，部分五官/炮孔缩小后消失；圆润嘴形与小尺寸内线/孔距表达 | 实际1×可辨，器官数量和连接不变；BURST不对称不重复误报 | [characters](evidence/characters/review.md) |
| VF-15 | P2 | ☐ 建造与命中反馈语义 | 绿色塔上的珊瑚碎片像受伤斑；区分放置成功、命中和死亡的色彩位置生命周期 | 独立反馈不盖脸/炮孔，十发射源原尺寸面板验证 | [characters](evidence/characters/review.md) |
| VF-16 | P2 | ☐ 塔卡构图及状态 | 视觉偏表格，中性与不足区别弱；微调标题/肖像/费用与不足符号/局部强调 | 九塔首末及资金状态清晰，保留140/8/920合同 | [ui](evidence/ui/report.md) |
| VF-17 | P2 | ☐ 说明浮层所属连接 | 浮层缺少指向卡片的关系；增加轻量尾或连接标记并随当前卡定位 | 首末卡hover/focus清楚且不拦截指针 | [ui](evidence/ui/report.md) |
| VF-18 | P2 | ☐ 教学键帽与状态Banner | 宽奶油框重复，键帽/阶段符号不足；恢复简单键帽与状态tone图形语法 | 一次关闭有效，不遮主体，不引入新操作或手机控件 | [ui](evidence/ui/report.md) |
| VF-19 | P2 | ☐ HUD血条与图标重量 | 血条像下划线、一级信息不突出；调整心/资源/时间、条厚及数字层级 | 生命资金一级、时间二级；信息细线与角色粗线有差别 | [ui](evidence/ui/report.md) |
| VF-20 | 验收补充 | ☐ 尚未覆盖的还原度证据 | 部分真实动作/技能和尺寸未逐项审查；补SPLINTER、机制运行、十源弹体、95技能关键窗口、双子危区、正常奖励链及多尺寸DPR | 用当前art-enabled实机，标注摆场，旧fallback排除；补证不等于已确认缺陷 | [汇总](evidence/summary.md) |

## 执行与关闭条件

建议顺序：先收敛VF-13生效标准，再并行处理角色/构图（01–06、14–15）与UI（07–10、16–19），最后完善背景（11–12）。各项需保存原画定位、当前1×实机、动作连帧或短视频及复核结论，再标为完成，不能凭资源存在/映射覆盖关闭。

同宽原画/实机对照用于观感，不把概念PNG比例当像素合同。示例资金、怪数、位置不同不算缺陷；历史BURST四孔不对称未复现，不登记为当前问题。

## 完整审查记录

[主审汇总](evidence/summary.md) · [场景](evidence/scene/report.md) · [角色](evidence/characters/review.md) · [UI](evidence/ui/report.md)。截图与阅读清单已从临时目录保存在evidence，SHA见[evidence-manifest.json](evidence-manifest.json)。
