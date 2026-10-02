# 七身份静态变体：只读拓扑及顶点配对审计

2026-10-02，owner enemy-batch。当前仅写本组新docs；enemyRigData.js/public/r02封存包均未改。主审已确认角色主会话采用同名器官generic插值＋精确Bezier拆分，因此本报告不建议再叠加shapeMorphs，也没有运行新的播放/图片测试。

核对7身份、8组attack/windup/trigger变体；额外列SCOUT crouch/squash，共9对。所有neutral/variant的shape ID集合和绘制顺序完全一致，无新增/删除器官，无path↔ellipse类型切换。21对路径坐标变化、4对ellipse变化；其中SCOUT crouch贡献2条变化路径。全部R/C/r0只存在于base并保留。具体每条命令、每对控制点与28个变化关节见[morph-pair-audit.json](morph-pair-audit.json)和[vertex-pairs.json](vertex-pairs.json)。

## 命令序列差异（是真实数据差异，不等于generic失败）

记法C³为3条C；每条C均6参数，M/L均2参数。

|身份/变体|shape ID|neutral → variant|当前generic的精确处理|
|---|---|---|---|
|FAST/run attack|foot-left|M C² L Z → M C² Z|将neutral L精确转C；target原第2条C在t=.5拆开，达到3段|
|BOMBER/inflate attack|cheek-arm-left、cheek-arm-right|M C³ → M C³ Z|曲线数量相同；差异是stroke闭合。当前closureAlpha分支处理Z笔画，需注意腮根新闭合线是否增厚|
|SCOUT/chase attack；crouch squash|long-leg-left、long-leg-right|M C⁵ Z → M C⁴ Z|当前按最长控制多边形拆target第1条C，达到5段；另有下述脚弧语义配对建议|
|SIEGE/strike attack|fist-right|M C⁴ Z → M C⁶ Z|当前拆neutral原第1、2条C，均t=.5，达到6段；另有下述闭合起点语义配对建议|

FAST其他变化foot-right/body都是同命令序列。SPLINTER仅body变化，M C⁵ Z完全相同，低轮廓相同，eye不变；droplet-tip关节[142,66]→[142,29]。SHIELD仅foot-left和soft-shield-lobe变化，分别M C² Z和M C⁵ Z完全相同；后拳/单眼不变。

BOMBER body M C¹⁰ Z相同，双腮的闭合是唯一额外拓扑边；眉眼槽、嘴/舌和脚未变化。BEACON windup/trigger的body保持完全相同的M/C/L命令顺序，tongue均M C⁴ Z；mouth为ellipse numeric pair而不是path，现generic已经支持。其双脚不变，口/舌/双触芽关节需使用同一sin²权重与形状同步，现variant joints均已具备。

SCOUT chase除双腿外，head-hood/lid命令序列相同；eye-white和eye均为ellipse。SIEGE right-fist-fold为M C，其他拳/脸/额板/脚不变。全部绘制对象仍各一份，不需要双全身alpha混合。

## 腿/拳的语义配对建议（尚未确认可见缺陷，不直接应用）

`generic longest split`保证端点几何精确保留，但不自动保证每段对应同一解剖位置。以下是给公共负责人检查中间形状的更精准配对，不是自行追加数据的授权。

SCOUT双腿，crouch与chase都可将target原第3条C（脚底返回内踝的弧）在t=.5拆开，而不是最长的第1条C（髋→外踝的长腿）。匹配顺序为：完整外腿C1→C1、脚外弧C2→C2、neutral脚内弧C3/C4→target C3两半、neutral内腿C5→target C4。这样不会将整条腿的下半截与neutral脚弧配对。四份等形补段候选只写在[landmark-pair-suggestions.json](landmark-pair-suggestions.json)；所有原关键姿态轮廓不变。

SIEGE fist-right：neutral起点[196,147]在拳上内侧，variant起点[182,154]在臂根，原起点的解剖位置不同。可循环旋转闭合target路径，使起点为原C1末端[203,113]（拳上内侧），顺序改为target C2/C3/C4/C5/C6/C1；neutral原C1和C4各t=.5拆开，与该6段配对。分别对应上拳弧、外拳下弧、外连接和内连接，闭合轮廓与批准关键姿态完全相同。当前generic不做这一步解剖对齐，建议主角色重点看p=.125/.25/.375的臂根连接和拳形是否扭折后再决定是否需要新数据。

## 关节与最小补充结论

- SPLINTER tip、SHIELD盾/足、BEACON口/舌/触芽、SCOUT髋/脚/头/眼睑/眼、SIEGE拳关节已有目标配对；全量28对坐标与delta均在审计JSON。
- SHIELD单足x变化-9、SCOUT双脚x分别±16（crouch±7），接触y与R保持相同；这属于局部站姿变化，不能用来推移世界根。
- FAST和BOMBER变体未单列joints，继承neutral，这是现数据事实，不能仅因缺字段判缺器官；只有汇总验证表明实际挂点与路径不同步时再派发具体目标关节补充。
- 确认当前generic保留时，最低新增数据为0。需要核验的是上述闭合线及解剖段配对；若出现可见中间缺陷，最小补充为对应单条path的等形补段/闭合起点调整，或具体joint目标，不改整个身体、不重复叠shapeMorphs权重。

本报告不关闭E01、不声称连续播放通过，不改变已批准r02身体/资源。公共负责人按当前generic检查后，由主审决定是否需要具体数据返修。
