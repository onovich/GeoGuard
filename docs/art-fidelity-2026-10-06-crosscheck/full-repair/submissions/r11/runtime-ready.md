# S3 r11 运行模块 READY（局部包，整体未完成）

入口：http://127.0.0.1:5173/docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r11/world-status-feedback-runtime.html

覆盖实际生产函数 drawActorOverlay/drawPlacement/drawWorldItem：shield、slow、frozen、armored、open、partnerFallen、phase、burrow、intro；JAM、真实 eligibleTargetKeys 门槛治疗、fuse；合法/非法 placement；drop、chip/leaf、三冲击阶段、四 Boss finisher、hit、defeat、refund、成功召唤/分裂、root/target link。每项1.25及3倍，固定240画布。无源码自绘角色替代；资格和实体触发事实继续上游。

已批准27项源安装：25首批和2治疗补制。补充3直接来源候选请核 feedback-additional-source-candidates.json/contact：单 leaf、split-small、target-ring。中央空白注释排除区域仅移除示意 G/B/辅助线，无程序补画。WEB/ROOT 注释跨纹样则另用正式AI整效果清理，terrain-cleanup-candidates.json/contact/request，保留真实源分类；这2项尚未用于 hazards。图层相对原 B04 仍须主审来源评审。

命中/冲击/死亡/拾取/退款/召唤/链接已改来源 PNG，死亡回馈从7片缩到3片（reduced 2片），仅表现预算。原粒子生命周期、独立实体、伤害/AI/数值/碰撞没有修改。退款 amount>0、召唤与分裂 childKeys 保留。十源真实弹体仍出生于逻辑中心，本包不假称炮口出生通过。

验证：三个修改模块 node --check 全过。实际浏览器由主审集中验收；不拿生成联系图当实机。未覆盖：hazards 装饰及两内圈、完整UI/血条皮肤、尺寸/连帧、95技能、真实十源枪口出生和密度性能。核心逻辑无修改。整体清单保持开放。
