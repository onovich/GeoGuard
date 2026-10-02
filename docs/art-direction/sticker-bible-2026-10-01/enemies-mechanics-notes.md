# 贴纸小怪：普通敌人与Boss机制实体统一设定
母版：../2026-10-01-round5/02-sticker-v2.png。三张设定板内置image_gen实际生成并view检查，机制板另做一次去斑点/去软影定向编辑，以mechanics-01-v2.png作为优先稿。完整实际prompt均保存，同名-prompt.txt与mechanics-01-refinement-prompt.txt，UTF8无BOM。未改源码。

## 覆盖清单与功能依据
enemies-01.png：
BASIC 方阵兵：短臂蓬团，普通追击。
FAST 疾袭兵：前倾软长耳，快速冲跑。
TANK 重装兵：宽矮云块与重抱臂，80HP/大体量。
SHARD 裂片兵：三瓣连体，倒下分裂出SPLINTER；图中分裂动作示意。
SPLINTER 碎片：单眼小滴，radius5，比普通怪小。
SHIELD 护盾兵：大软盾瓣抱脸，护盾功能。
MEDIC 医疗棱镜：四瓣红垫+奶油十字，敌军治疗，不以绿色友军色误导。

enemies-02.png：
BOMBER 爆破球：鼓腮圆团+软引信芽，爆炸前膨胀。
JAMMER 干扰体：垂耳天线+折嘴，干扰塔射速。
PHASE 相位兵：弯曲幽灵软尾+长负形脸，虚线旁样示意短时相位。
BURROWER 掘地者：低宽鼻与两大掘爪，出土动作。
BEACON 信标兵：长铃口瓶身+两芽，召唤BASIC。
SCOUT 斥候：大眼睑+两细软腿，追玩家；区别FAST耳形。
SIEGE 攻城块：低宽额板+大前臂，攻击塔。

mechanics-01-v2.png：
nest / MECHANIC_NEST：三瓣口巢，定期产BASIC。
web / MECHANIC_WEB：低平三股软结，伤害与减速地形；红点圈功能动作。
root / MECHANIC_ROOT：三指芽根，传播子根和伤害/减速地形。
wall / MECHANIC_WALL：宽软墙垫，solid阻挡，不画石砖。
seal / MECHANIC_SEAL：双软爪扣住sage塔，短暂冻结。
reticle / MECHANIC_RETICLE：三段圆角锁定标记，塔位延迟伤害，不赋拟人脸。
courier / MECHANIC_COURIER：双腿红袋怪+薄荷货钻，逃离搬货，击败返还cargo。

## 精英层级
项目ENEMY_TYPES没有独立elite字段或独立ELITE ID。重装TANK/SIEGE靠较宽轮廓、大臂/额板与体量表达；SHIELD/MEDIC/JAMMER/PHASE/BEACON等能力怪靠单一大器官表达能力层次。不发明新怪ID、金冠、花纹升级。图板大样不是游戏大小比，落地应按各radius恢复，SPLINTER尤其不能等大。

## 实看审查
三板均7个主模型，标签完整，没有遗漏14敌与7机制。角色世界与母版柔软粗线和有限珊瑚色一致，无3D金属硬角。每格有主形、小动作与深棕轮廓识别样。FAST与SCOUT、TANK与SIEGE、SHARD与SPLINTER区别清楚；能力怪仍珊瑚敌方色避免误读。
第一敌板MEDIC更像花而非原名棱镜，是造型重诠释，功能仍治疗；它与Boss BLOOM需要通过十字/嘴和尺度区分。
BEACON动作生成4个幼体而非代码count3，图用于表达召唤功能，不能用图数量作为规则；SHARD三幼体数量正确。PHASE虚线样表达概念，不指定真实透明材质。
敌板保留少量软底影与内填微明暗，不是完全纯flat，后续制作应简化；机制V2删除明显表面斑点和影子，仍有微明暗，未宣称完美单色。
图中sage小塔仅为功能目标示意，与母版塔具体造型并不完全一致；不可当独立新塔。

## 小尺寸与动作边界
16–34px普通单位优先主轮廓+大功能器官，小齿/小爪/双眼可删。SPLINTER10px只保留滴形与一点。WEB环结、ROOT芽指、SEAL双爪、RETICLE三弧有不同负形，缩到当前约26px机制直径仍需线宽/空隙规范。COURIER货钻至少占袋半宽，避免当资源点误读。
小样是概念识别示意，没有按真实像素逐一测量。动作是关键帧方向，没有制作动画、sprite atlas、真实游戏验证、手机/性能/碰撞测试。

## ENEMIES 02 V2 数量修正
内置image_gen局部定向编辑，保存enemies-02-v2.png。已view确认BEACON小召唤动作现在恰好三个BASIC幼体，与gameConfig.js summon.count=3一致；其它七种主形、标签、布局、功能伙伴保持。优先使用enemies-02-v2.png替代初稿。完整实际编辑prompt存enemies-02-refinement-prompt.txt，UTF8无BOM。