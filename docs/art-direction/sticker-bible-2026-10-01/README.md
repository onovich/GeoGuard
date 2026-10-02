# GeoGuard · 贴纸小怪美术设定集

以 round5 的 `02-sticker-v2.png` 为风格母版。本目录是统一原画与制作规范，不是已切好的游戏资源；没有修改游戏代码。

## 风格约束

- 奶油底 `#FFF8EA`、暖深棕描边 `#49362C`、鼠尾草友军 `#A7BD88`、珊瑚敌军 `#E67668`、蜂蜜玩家 `#F1C97B`、薄荷资源 `#77C79E`。冰蓝和灰紫只做功能辅色。HEX 为制作建议，原画像素可有偏差。
- 纯二维平色、软而不规则的粗轮廓；每个角色只保留一至两个功能器官。不要材质颗粒、投影、渐变或金属细节。
- 大轮廓先区分功能，表情再区分性格。敌方医疗、召唤、污染单位仍保留珊瑚敌方标识，避免与友军混淆。
- 塔的身体可以静止，攻击器官应独立转向；炮口、喙尖和弹体方向一致。受击/攻击的压缩拉伸只改变视觉，不移动真实碰撞中心、不扩大伤害范围。
- 9种塔共用 Lv1–4 成长语法：主轮廓保留，体量轻微增长，增加一至三个清晰等级标记。等级标记在实际像素尺寸下需简化，不能以堆装饰替代辨识。

## 覆盖范围与实现边界

详见 `asset-manifest.json`，按实际源码清点：9塔、1玩家、14敌人（包括死亡分裂的 SPLINTER）、16组 Boss、7机制实体、10种友方发射源、55种危险标签，以及玩家界面与开发工具界面。

项目没有独立精英怪 ID 或精英状态。TANK、SHIELD、MEDIC、JAMMER、PHASE、BEACON、SIEGE 等既有重装/能力怪采用更显著的视觉层级；不将概念分组当成新游戏机制。

Boss 基础 ID 与 `_T1` / `_T2` / `_T3` 共64个配置入口，继承同一16组形象。后缀控制阶段数量，不需要64个新角色。TWINS 必须保留 twinSun、twinMoon 两个实体、双血条、独立朝向及幸存者狂暴提示。

美术尺寸须以配置 radius 为准：玩家半径12、塔13–18、普通敌5–17、Boss24–35。原画的大图用于看造型，不能直接按版面比例搬进游戏。小尺寸示意需在真实画布上再次验证描边、五官和弹体密度。

当前友方 projectile 运行时主要归入 basic / cannon / sniper；本稿按发射源细分美术外观，保持原有直线飞行、穿透、减速和范围伤害。RAPID 不是近战锯伤；MORTAR 不新增抛物线机制；BURST 是四弹窄扇面。敌方大量攻击是 LINE/AREA hazards，不是自由飞行子弹。

## 危险标签映射

以下为共享视觉语法。**实际 shape / radius / width / length 优先于名字**：同一个 label 可能有线状和区域状版本；只替换皮肤，不把区域形状互相转换。

| 原画语法 | 代码标签 |
| --- | --- |
| LINE / CHARGE / CROSS GRID | formation, charge, mark, hunt, slash, ram, refract, lattice, mirror, rail, crosshair, grid, overload, coinline, crossfire, breath, strafe, diveTrail |
| BLAST | mortar, bunker, brood, coin, inferno, meteor, dive, nest |
| FROST | frost, prison |
| WEB | web, silk |
| GRAVITY | gravity, star, orbit, lock, singularity, horizon |
| SOLAR / MOON | moonbolt, sunbolt, eclipse, solar, flare, moon, shadow, shade |
| SLAG | slag, brand |
| TEMPO | tempo, beat |
| WALL / GATE | wall, gate, maze |
| POISON | vine, poison, spore, garden |

预警使用虚线边界与浅色平填；生效时切为连续危险边界，保留中心活动空间；消散用断环。功能辅色必须同时带珊瑚危险标识。友方射程、选中轮廓、可建造预览用鼠尾草色与勾；无效位置用珊瑚与叉，不能只靠色相判断。

## UI 制作规范

`ui-01` 展示桌面/移动 HUD、建造栏、双子 Boss 血条和卡片状态；`ui-02` 展示开始/暂停/结束、奖励、升级/降级和反馈；`ui-03` 展示开发刷怪、Boss 编辑器、测试导出和通用组件。

图中字号、局部文案、示例数字和布局是概念提案，正式文本与功能以现有组件为准。塔菜单只有升级/降级；不添加售卖。建造卡支持横向滚动与拖放，状态包括普通、拖动、资金不足、升级。手机控制示意不要求增加新的实体摇杆。音频开关与滑块的位置是布局提案。游戏结束统计及开发工具字段若图示与代码不同，以代码为准。

按钮与可触区域建议至少44px；正文清晰无装饰；信息面板细线，角色粗线；Boss HUD 容纳阶段、动作、护卫数、弱点状态与双子双血条。提示不长时间遮住中央移动区，禁止用大范围装饰闪光覆盖伤害预警。

## 后续制作

先把9塔、玩家和14敌人制作为独立矢量/透明精灵，分离可转向器官与表情；再制作Boss阶段动作、弹体和预警。最后用真实单位半径与高密度怪群验证轮廓、敌我区别、预警边界和UI遮挡。原画中的英文ID是定位标签，最终中文名从配置取得。所有生成提示保存在本目录，便于局部重绘。

## 可用性原画修订（仅设定阶段）
新增 usability-refinement 补板用于制作规范校准，没有修改游戏源码或宣称实战已验证。尺寸数字是准确制作目标，整板中的图例为概念比例，不是1×像素测量证据。等级体量变化不得改变hitbox；优先独立粗等级标记。线hazard的width为半宽，艺术边界总宽2×width；结算在timer到零时发生，FADE纯视觉无伤害，不引入持续ACTIVE。最终运行Boss动作和整体OPEN规则见 usability-refinement/runtime-actions.md。玩家奖励直接点真实choice生效，蓝图升级只影响后续建造；调级菜单是debug工具不变为正常玩家收费玩法。
