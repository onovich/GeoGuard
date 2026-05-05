# GeoGuard

GeoGuard is a browser survival-defense prototype rebuilt from a Gemini-style single-file JSX source into a verified Vite + React project baseline.<br/>**GeoGuard 是一个浏览器生存塔防原型，已从 Gemini 风格的单文件 JSX 源码重建为经过验证的 Vite + React 工程基线。**

## Overview

- Fight off geometric enemies, auto-fire at nearby threats, collect gems, and place towers while surviving as long as possible.<br/>**对抗几何敌人、自动射击附近威胁、收集水晶并布置防御塔，在持续生存中建立防线。**
- The current repository keeps the original prototype under origin/ and adds a maintainable runtime structure under src/.<br/>**当前仓库保留了 origin/ 下的原始原型，并在 src/ 下补齐了可维护的运行时结构。**
- The refactor establishes migration-ready boundaries for future Unity work, but it is still a prepared architecture rather than a fully completed cross-platform port.<br/>**本次重构已经建立了面向未来 Unity 迁移的边界，但当前仍属于迁移准备型架构，而不是完整的跨平台移植成品。**

## Stack

- React 18 with Vite 5 for the application shell and production build pipeline.<br/>**使用 React 18 与 Vite 5 作为应用壳层和生产构建流水线。**
- HTML5 Canvas for the real-time game scene and Tailwind CSS 3 for HUD and menu layout.<br/>**使用 HTML5 Canvas 渲染实时游戏场景，并用 Tailwind CSS 3 构建 HUD 与菜单布局。**
- A ref-based runtime loop keeps high-frequency state outside React rendering to preserve performance.<br/>**基于 ref 的运行时循环将高频状态放在 React 渲染之外，以保持性能稳定。**

## Architecture

- src/data stores colors, tower definitions, enemy archetypes, and UI copy so balance values are not buried inside JSX.<br/>**src/data 用于存放颜色、塔配置、敌人原型和界面文案，避免数值散落在 JSX 内部。**
- src/logic/engine contains reusable math, spawn rules, placement checks, and runtime state factories that can later map to Unity-side systems.<br/>**src/logic/engine 包含可复用的数学工具、刷怪规则、建造校验和运行时状态工厂，后续可以映射到 Unity 侧系统。**
- src/logic/hooks owns the browser input bridge, animation loop, and state synchronization between the engine runtime and React HUD.<br/>**src/logic/hooks 负责浏览器输入桥接、动画循环，以及引擎运行时与 React HUD 之间的状态同步。**
- src/view splits the screen, HUD, build bar, and overlay into presentational components.<br/>**src/view 将主屏幕、HUD、建造栏和覆盖层拆成展示组件。**

## Commands

- npm install<br/>**安装依赖。**
- npm run dev<br/>**启动本地开发服务器。**
- npm run build<br/>**构建生产版本。**
- npm run preview<br/>**预览生产构建结果。**

## Deployment

- GitHub Pages deployment is configured through .github/workflows/deploy.yml and Vite base is set to /GeoGuard/.<br/>**GitHub Pages 部署已通过 .github/workflows/deploy.yml 配置完成，且 Vite 的 base 已设置为 /GeoGuard/。**
- After pushing to GitHub, set Settings -> Pages -> Source to GitHub Actions if the repository has not been configured yet.<br/>**推送到 GitHub 后，如果仓库尚未配置 Pages，需要在 Settings -> Pages -> Source 中切换为 GitHub Actions。**

## Origin

- The original prototype source and design handover document are preserved in origin/App.jsx and origin/design.md for traceability and future iteration planning.<br/>**原始原型源码与设计交接文档保留在 origin/App.jsx 和 origin/design.md 中，便于追溯和后续迭代规划。**