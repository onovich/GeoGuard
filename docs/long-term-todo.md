# GeoGuard Long-Term TODO

This file is for later work that is intentionally not part of the current fast-iteration pass.

## Tooling

- Add richer debug presets such as spawn-at-phase, common tower layouts, cooldown inspection, and step simulation.
- Add browser-level or rendering-sensitive integration coverage for the full reward modal lifecycle, visual transitions, and live input flows.

## Architecture

- Continue splitting `src/logic/hooks/useGeoGuardGame.jsx` into narrower runtime modules only when a future feature makes the next boundary obvious.
- Move more authored encounter data into structured config instead of mixed hook logic.
- Keep expanding structured Boss presentation data when new encounters add phase-specific counterplay, callouts, or HUD semantics.

## Content Expansion

- Add more boss variants, elite encounters, and alternate wave compositions once the current roster balance is stable.
- Explore master/minion or multi-node encounters beyond the current dual-boss support.
- Add higher-difficulty remixes for existing bosses instead of only adding new bosses.

### 后期候选：可选迷雾迷宫副本

记录日期：2026-10-01。状态：仅保留策划候选，暂非必做内容；不属于当前执行计划，不据此自动启动开发。是否立项、优先级与具体规则留待后续决定。

用户设想：

- 在特定阶段生成迷宫入口，玩家可选择进入或跳过。
- 进入后冻结地面场景的时间与战斗状态；副本结束后返回地面并恢复。
- 迷宫具有战争迷雾、实体墙壁、敌人和出口；玩家同时应对战斗与探索寻路。
- Boss 位于迷宫生成后确定的特定位置。存在钥匙与门，部分门需要对应钥匙，部分钥匙由怪物携带。
- 房间与钥匙—锁关系必须确保有解，避免钥匙自锁、循环依赖或消耗钥匙导致主线软锁。
- 完成副本获得特定收益，然后返回地面。

后续评估时可参考的建议（尚未定案）：

- 优先考虑 Boss 击败后、下一波开始前开放入口，并预告耗时、危险与奖励方向。
- 先生成可解的房间连接图与钥匙依赖，再生成地形；用包含钥匙/门状态的可达性搜索验证 Boss 与出口可达，失败时重生成或使用保底模板。
- 首版可考虑 8–12 个房间、2 组钥匙门、1 个可选挑战、1 个 Boss，约 4–6 分钟；先采用对应专门门的具名钥匙。
- 已探索地图保留轮廓，墙壁遮挡当前视野；关键钥匙必定可靠获得，不会过期或落入不可达区域。
- 副本拥有独立状态和有限远征配置，限制可带回经济收益及重复进入；通关提供快捷返回，撤离与失败代价另行评估。
- 奖励优先考虑专属改造、蓝图或部署装置；地面通关不应依赖玩家必须完成迷宫。

## Presentation

- Continue lifting non-showcase bosses toward the presentation quality of Twins, Dragon, Spider Matriarch, and Astrolabe.
- Keep new React UI on the shared design system primitives in `src/view/designSystem.js` and `src/view/components/ui.jsx`.
- Revisit some legacy docs and bilingual text that still carry prototype-stage encoding or wording debt.

## Tuning

- Run deeper real-play balancing across waves 1-18 after enough iteration data accumulates.
- Add late-game economy sinks, recovery options, or broader progression systems only after the current core loop is stable.

## 电脑端美术视觉还原待办（2026-10-03）

- [ ] 完成[视觉还原待办 VF-01–VF-20](art-fidelity-2026-10-03/backlog.md)：10项P1、9项P2和1项验收补充；目前仅登记，未启动修复。
