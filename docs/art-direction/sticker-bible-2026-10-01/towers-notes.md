# 全九塔与唯一玩家：贴纸设定板

实际使用内置 image_gen，以 round5/02-sticker-v2.png 为 referenced_image_paths 母版。已读取 src/data/gameConfig.js 与 src/logic/engine/gameState.js，三张图均已 view_image 逐张审查。未改源码。

## 覆盖
- towers-01.png：BASIC 速射塔、CANNON 榴弹炮、SNIPER 穿透塔、唯一 PLAYER。
- towers-02.png：RAPID 链锯塔、MORTAR 迫击塔、FROST 霜冻塔、通用 Lv1–4 视觉升级条。
- towers-03.png：RAIL 磁轨塔、BURST 散射塔、SENTINEL 哨戒塔。
- 三个同名 -prompt.txt 为完整实际提示词，UTF-8 无 BOM。

## 真实玩法映射
| ID | 造型关键 | 真实功能 | 基础价格/射程/伤害/间隔 |
| --- | --- | --- | --- |
| BASIC | 圆小体单短嘴 | 稳定对单 | 15 / 180 / 6 / 0.3s |
| CANNON | 宽腹大桶嘴 | splash60 | 40 / 140 / 15 / 1.5s |
| SNIPER | 长颈单细嘴 | pierce3 | 80 / 350 / 35 / 2s |
| RAPID | 扁圆双短唇 | 极高射速弹体，无近战锯伤 | 28 / 155 / 3 / 0.12s |
| MORTAR | 胖腹朝上杯嘴 | splash92，慢装填 | 72 / 260 / 24 / 2.3s |
| FROST | 横哨嘴、两道停顿记号 | slowRatio0.55/1.4s | 55 / 190 / 7 / 0.85s |
| RAIL | 长颈双软轨嘴 | pierce5，最远射程 | 98 / 430 / 26 / 1.65s |
| BURST | 花瓣扇嘴 | burstCount4，spread0.18 | 66 / 165 / 8 / 0.95s |
| SENTINEL | 厚圆肩垫、单强嘴 | hp108，耐久对单，无护盾技能 | 52 / 175 / 11 / 0.55s |

玩家 HP100、speed180、radius12、shootCd0.5、damage8、range200。只存在一个玩家实体，没有职业分支；蜂蜜水滴核不强加手持枪。面向提案通过芽尖/轮廓缺口表达。

## 审查结果
九 ID 与上述主要数字均可读且准确，BASIC/RAPID、CANNON/MORTAR、SNIPER/RAIL通过单/双嘴、前/上开口、单/双长轨区分。BURST 四发扇形与 SENTINEL 单弹清楚。每塔具主设定、小图和明显压缩拉伸，色板、棕色曲线和留白统一母版。大部分为平面色块，少量单色腹部色斑/平面底影与母版兼容。

## 通用 Lv1–4 视觉规则（提案，不改变数值）
源码 catalog level 为 0–3，BuildBar 显示 level+1/4。全塔沿同一规则：Lv1 无领口刻度；Lv2 一道粗棕刻度；Lv3 两道；Lv4 三道加枪口外唇略加厚。主体轮廓、阵营颜色、炮嘴数量、碰撞尺寸和功能不因视觉级别改变，不加新枪、新王冠或新塔。

02 生图升级条中 Lv1/Lv2 差别太弱、Lv3/Lv4只呈额外棕划，未完全达到上述清楚层级。实装应按规则单独绘制，不直接从生成图裁出升级帧。

## 偏差与使用边界
主设定多为朝右侧向的角色展示，尚需按现有俯视战场绘制旋转/方向适配，不是完成的游戏 atlas。小图并非精确 28–36 px 导出，需真实缩放验证，所有细脸/脚不要影响功能剪影。MORTAR 攻击弧线仅图示装填重感，真实现有弹道不得据图改成抛物线。SENTINEL 侧肩像盾，应作为耐久形态而非新增护盾技能。BURST 各发 target 示例不代表自动锁不同目标；扇形 spread保留原规则。图中 SNIPER/RAIL 穿透数字仅最大 pierce示意，不是必须存在目标数。压缩拉伸需限定局部器官，不改真实射向与判定位置。

交付为统一静态设定集，不是矢量源文件、sprite atlas、动画或实机帧率/手机测试。
## 02 V2：迫击直线机制修正

towers-02-v2.png 已内置 image_gen 定向编辑并再次 view_image。迫击攻击图的弧线已改为直线，圆弹沿直线飞向原有 wide splash 图示；所有主体、数值、其他塔和升级条保持。推荐引用 V2，初稿 towers-02.png 保留。完整实际编辑 prompt 为 towers-02-refinement-prompt.txt。

所有 SQUASH/STRETCH 仅改变美术局部或视觉轮廓，不改变代码 radius、hitbox、真实位置、炮口攻击来源、子弹速度/方向/伤害/命中判定。局部弹性不得引入新的游戏机制。Lv1–4 规则同上，仅视觉提示。