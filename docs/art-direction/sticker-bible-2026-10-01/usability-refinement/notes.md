# 可用性原画修订说明

范围仅 docs/art-direction；没有修改游戏源码、平衡、碰撞或用户未提交代码。本轮只交付制作设定与功能布局，不是可玩原型。

## 新板与权威关系

- readability-anchors-01-v3.png：9塔共同身体中心、器官根部方向锚点、SNIPER所有例子单喙与RAIL双喙、目标直径与Lv1–4短条语法。FROST此板是锚点示意，横嘴两腹记与原 towers-02-v2.png 主造型共同定义身份；制作原身份以主板为准。
- mechanics-seal-03-v3.png：FROST_JUDGE的独立SEAL节点、冻结塔状态与解除；节点世界坐标和塔状态分别实现。
- mechanics-reticle-03.png：RAIL_WARLORD的独立RETICLE节点和受标CANNON塔，CANNON是既有合法塔；MARK RELEASED的小点/短线仅消散残影，不构成持续目标或持续伤害。
- hive-twins-04.png 是独立HIVE/BASIC与TWINS板；原mechanics-02-v2.png整板废弃，不在图册展示。HIVE幼体为珊瑚BASIC；月体永久珊瑚边与敌方标记。
- hazards-02-v3.png：垂直完整线带厚度2×width，area radius；timer=0结算瞬间、fade仅无伤害视觉尾迹。pulse每次以实际r_n为准，可相同也可改变；图中相同大小仅防止暗示必然扩大。圆角capsule、wall造型为艺术语法，具体端点、矩形、半径与线段距离以实际判定几何为准。
- ui-player-04-v3.png：仅手机战斗与直接点击奖励功能布局。奖励按实际choice即时生效，蓝图强化仅后续新建，已建塔不变；无正常玩家收费升级菜单。双子各成员阶段/动作独立，紧凑HUD须逐成员显示，不共享一个真实phase。上方状态banner置于HUD保留区不遮场中演员；摇杆在触摸起点浮现，图中左下只是一个示例，不限定唯一操作区。44px为最小触区目标，safe area须按设备inset计算，并非所有机型固定44。
- boss-actions-05-v3.png：补Dragon与VoidConductor动作，并明确Prism ×1.2、Astrolabe ×1.35为整个实体recover易伤，不是局部弱点。蜂蜜边表达OPEN状态不是治疗，整体碰撞不变。动作特效示意不能覆盖实际危险几何；conductor recover ×1.25另见运行清单。

## 制作规则

身体碰撞圆心与武器器官根部是两个锚点；朝向改变器官，弹体实际出生中心仍遵循现有代码。本板不擅自把代码中心发射改成嘴端判定。全塔复用主身份到HUD/建造卡；小样数字是游戏单位目标直径而不是整板物理PNG 1×像素证明。概念小图尚未经过裁切缩放或高密度实战验证。

等级用0/1/2/3条作为Lv1/2/3/4，不添加新职业或新塔；压缩拉伸和攻击姿态仅美术变形，hitbox不变。SEAL/RETICLE HP16仅属于实际可破节点，不赋给Prism/Astrolabe装饰镜片。

旧ui-02流程板仅风格参考，旧确认奖励、收费升级不得作为正常功能权威；ui-03开发工具板归档，开发/测试工具不包装成新玩家机制。已有15板覆盖主身份，不意味着所有运行期动作已逐项完成动作帧原画。runtime-actions.md和runtime-boss-actions.json从当前enrichBossTemplate读取最终覆盖，并区分自定义模板可能的覆盖。

## 实际图检

初稿有多喙漂移、HIVE误占其他Boss、幼鸡player、错误横向width、虚构NODE，均保留版本与完整提示作为追踪。已通过局部不重做；新v3修正确认单喙/双喙、垂直厚度、滴形player、真实奖励、整身OPEN。节点板分开避免归属混淆。

没有交付模型、切分sprite、动画、手机点击或帧率实测。进入资源制作后仍需验证26–36px塔、10pxSPLINTER、满屏危险与双子手机HUD；此轮验收只针对原画可用于制作。

SEAL BROKEN格的三块仅表示双爪破碎残片，不能作为三弧RETICLE主身份；STATE RELEASED同一塔炮口与身体保留、蓝冻圈完全消失。

SEAL v3定向删除NODE BROKEN格旁冻结塔和全部蓝色状态；中间仅破碎节点，最右无冻同塔为结果，避免击破后持续冻结的误读。

节点与冻结/目标状态是独立资源，并非永久共存。SEAL/RETICLE节点timer初值1.5秒，触发前击破节点可阻止该次后续触发；SEAL到时给塔frozenTimer至少1.6秒，RETICLE到时在塔当时位置排radius32、damage22、delay0.8区域危险。破坏节点不应画成解除已经触发的冻结/危险；STATE RELEASED是解除状态的资产结果示意，不宣称节点破坏回溯撤销已有效果。
