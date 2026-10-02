# GeoGuard

[English](README.md)

[在线试玩](https://game.onovich.com/GeoGuard/)

GeoGuard 是一个浏览器生存塔防游戏。玩家需要在几何战场中移动、收集资源，并在敌潮逼近时建立防御塔网络。

![GeoGuard 封面](docs/cover.png)

## 玩法

- 使用 `WASD` 或方向键移动，角色会自动攻击附近敌人。
- 移动端可以长按场地空白处移动角色。
- 收集敌人掉落的水晶。
- 把建造栏中的防御塔卡片拖到战场上进行放置。
- 挺过每一波敌人、选择奖励，并准备应对 Boss。

## 主要特点

- 实时生存移动与自动攻击。
- 多种防御塔蓝图、放置规则、升级和右键操作。
- 数据驱动的敌潮、奖励、成长、遭遇与 Boss 阶段。
- Canvas 战场，以及 React HUD 与建造界面。
- 桌面与触摸操作、音频设置和响应式布局。
- 玩法规则、架构和 UI 设计系统自动化测试。

## 开发

安装依赖并启动 Vite：

```bash
npm install
npm run dev
```

运行测试与生产构建：

```bash
npm test
npm run build
```

运行专门的架构与 UI 规范检查：

```bash
npm run check:architecture
```

Windows 上可以运行 `StartGeoGuard.cmd` 启动本地项目。

## 项目结构

- `src/data/` 保存防御塔、敌人、波次、奖励和表现数据。
- `src/logic/engine/` 保存可复用玩法规则与运行时系统。
- `src/logic/hooks/` 连接引擎循环、浏览器输入、音频和 React 状态。
- `src/view/` 保存 Canvas 渲染、HUD、建造栏和覆盖界面。
- `origin/` 保留原始原型和设计说明。

## 当前状态

当前 Web 版本已经包含可玩的生存、建塔、奖励、波次和 Boss 循环。GeoGuard 仍是原型：数值平衡、内容量、长时间运行表现和目标设备上的生产部署仍需继续验证。

## 许可证

当前仓库尚未包含开源许可证。
