游戏项目 AI 交接文档 (AI Handover Documentation)

致接手本项目的 AI Agent：
你好！本片文档包含了接手并继续迭代当前游戏项目所需的所有上下文信息。请在执行后续修改（如添加新内容、重构或调试）前仔细阅读。

一、 项目启动文档 (Project Initiation)

游戏英文名: GeoGuard

游戏中文名: 几何防线

项目类型: Web 单页面 HTML5 Canvas 游戏 (融合“吸血鬼幸存者”弹幕割草与塔防机制)

技术栈:

框架: React 18+ (使用 Hooks)

渲染: HTML5 Canvas 2D API

样式: Tailwind CSS (用于外层 HUD 与 UI 布局)

架构范式 (极度重要):

UI 与 逻辑分离: React 的 useState 仅用于渲染低频更新的 UI 层（如血条、金币数、主菜单）。高频更新的 60FPS 游戏核心逻辑与实体状态必须存储在 useRef(game) 中，绝对禁止将怪物位置等数据放入 React State，以防止重渲染导致的性能崩溃。

单文件结构: 目前所有代码集成在 App.jsx 中。

二、 游戏设计文档 (GDD - Game Design Document)

1. 核心循环 (Core Loop)

移动躲避 -> 自动攻击 -> 击杀敌人 -> 收集掉落物（资金） -> 消耗资金建造防御塔 -> 存活更长时间。

2. 操作方式 (Controls)

PC端: WASD / 方向键控制移动。鼠标点击底部UI选中塔，点击屏幕合法空地进行建造。

移动端: 左半屏任意位置拖拽唤出虚拟摇杆控制移动。右半屏点击进行建造。

3. 核心实体 (Entities)

Player (玩家): 始终处于屏幕相对中心，相机跟随。自动寻找范围内最近敌人射击。

Enemies (敌人): 从屏幕外围环形随机生成，以最短直线距离追踪最近的有效目标（玩家或防御塔）。造成接触伤害。

Towers (防御塔): 玩家消耗水晶建造，静态实体。自动攻击进入范围的敌人，有独立血量，可被敌人摧毁。

Drops (掉落物/水晶): 敌人死亡后掉落，当玩家靠近时会触发“磁吸”效果飞向玩家。

三、 开发文档 (Technical Documentation)

1. 坐标系统

屏幕坐标 (Screen Coordinates): 鼠标/触摸事件获取的坐标。

世界坐标 (World Coordinates): 游戏实体在逻辑地图中的真实坐标。

转换公式: worldX = screenX + camera.x - windowWidth / 2。渲染时使用 ctx.translate 进行整体世界偏移。

2. 核心状态树 (game.current)

player: 包含坐标、速度、血量、射击CD等。

camera: 当前视口中心坐标。

joystick: 虚拟摇杆状态（激活状态、起点、当前点、归一化方向向量）。

enemies / towers / projectiles / drops / particles / floatingTexts: 各类实体的对象数组。

difficultyMultiplier / spawnInterval: 动态难度参数。

3. 碰撞与命中判定

统一采用圆形碰撞检测（计算两点距离 Math.hypot 是否小于半径之和）。防御塔的方形/三角形仅为视觉表现。

四、 美术风格约束 (Art Style Constraints)

接手 AI 在生成新素材、添加新绘制逻辑时，必须严格遵守以下 Prompt 原则：

视觉核心: Minimalist vector illustration, flat design (极简矢量，扁平化设计)。

色彩板 (Color Palette): 低饱和度、高明度的舒适色调 (Pastel colors)。请严格复用 COLORS 常量对象中的十六进制颜色。禁止使用高对比度的赛博朋克色或暗黑破坏神色系。

图形构成: 纯几何图形拼接（圆、圆角矩形、等腰三角形）。使用 drawRoundRect 等函数。

光影与材质:

允许: 柔和的坠落阴影 (shadowColor='rgba(0,0,0,0.15)', shadowBlur=8)。

绝对禁止: 任何外部图片纹理 (Textures)、像素画 (Pixel art)、描边黑线 (除了特定的玩家光环)、复杂的噪点 (Noise)。

五、 数值设计思路 (Numerical Design Logic)

当前数值采用“线性膨胀+时间阈值”双规制驱动：

1. 难度标量随时间演进

敌人血量膨胀: difficultyMultiplier = 1 + (gameTime / 60) * 0.5

说明: 每存活 1 分钟，生成的敌人基础血量增加 50%。

生成频率加快: spawnInterval = Math.max(0.2, 1.5 - (gameTime / 120))

说明: 初始 1.5 秒刷一个怪，每秒减少，直到达到 0.2 秒/只的极限同屏压力。

2. 敌人数值梯度

Basic (基础/红色): HP 20, 速度 100, 伤害 5, 价值 1 (基准怪)。

Fast (敏捷/橙色): HP 15, 速度 180 (与玩家同速，逼迫走位), 伤害 3, 价值 2。(30秒后概率生成)

Tank (重装/紫色): HP 80, 速度 60 (极其缓慢，用于吸收防御塔火力), 伤害 15, 价值 5。(60秒后概率生成)

3. 防御塔平衡性模型

速射塔 (15费): 低成本，单体高频DPS。用于前期过渡和清理杂兵。DPS = 20/s。

榴弹炮 (40费): 中等成本，AOE群体伤害。克制高频刷新的敌群。DPS = 10/s (对单)，但 splash=60 范围内皆受损。

穿透塔 (80费): 高成本，长手、单发高伤带穿透 (pierce=3)。专门用于狙杀藏在怪群后方的 Tank。DPS = 17.5/s，最高造成 4 倍穿透收益。

4. 交接后建议调优方向 (TODO)

当前版本玩家缺乏主动回复手段，建议后续加入掉落血瓶的逻辑或基建回血塔。

大后期（>5分钟）金币冗余溢出，建议增加玩家数值升级系统（如消耗金币永久提升移速、子弹穿透力等）。