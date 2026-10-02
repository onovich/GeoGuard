# 美术生产会话协调与验收

本轮仅美术：生产拆分清单、原画修订、分层／挂点／固定根锚示意和玩家UI设定。禁止改游戏源码、玩法参数、接入资源、提交或部署。主会话仅协调及验收；四工作会话各自制作与修复。

## 目录所有权

- friendly/：九塔＋PLAYER，106动作参考条目。
- enemies/：十四敌人，77动作参考条目。
- bosses-mechanics/：十七Boss身体＋七机关，192动作参考条目。
- effects-ui/：独立弹体、技能效果、地形预警、战场、玩家UI；逐实际运行期对象映射。
- integration/：只读四组提交与主审结果，制作总图册和375条跨组索引；不制作或批准图片，不修改其他目录。
- reviews/、coordination.md、session-registry.json、最终验收：仅主会话写。

每组可以只读项目与旧图册，不覆盖旧文件，不写其他组目录。独立效果需求在本组清单中描述，由主审统一交给effects-ui组；禁止互相改稿或并发改共享清单。

## 通讯采用持久化提交，不依赖消息正文

每组完成一个可审包，先在 submissions/rNN/ 保存不再修改的产物，再写该目录 packet.json，最后更新本组 READY.json。UTF-8无BOM。packet字段：owner、revision、status=submitted、scope、files（相对本组路径＋SHA256）、images（需主审查看）、coveredIds、coveredActions、openIssues、dependencies、summary。READY仅含revision、packetPath。更新READY前必须完成所有文件，READY写临时文件后同目录改名；不覆盖已有revision。

主审逐组扫描READY，不以会话消息到达顺序作审批队列。每个revision只验收一次，先记录审查结果，再发会话返修指令。结果保存在 reviews/<owner>-rNN.md，含accepted／changes_requested、具体问题、证据、下次范围。提交方不替主审标通过。

工作会话提交后停下等明确指令，不主动给其他会话发送消息，不把聊天消息作为唯一交付。主会话可在同一批收到多个完成通知，之后按friendly→enemies→bosses-mechanics→effects-ui扫描所有提交；审查期间新提交下一轮处理。结果未acknowledged前提交保持可见，避免遗漏。

主审使用wait_threads每次最多5个目标，保存afterCursor，等待不超过60秒。每次通知或超时都扫描所有READY，并检查未审revision及依赖。单项退回不阻塞其他组；依赖未满足标awaiting_dependency，不伪装通过。integration排在四制作组之后审查，不能从文件存在推导图片通过。

## 两级门槛

第一包：完整生产拆分清单＋少量样板。主审检查实际代码身份、原地root、器官守恒、独立弹体／召唤物和挂点。通过后明确授权展开剩余身份及效果。后续各包沿用已批准样板规则，每个最终图均须主审实际查看。

最终出口：375条参考动作有生产归属；48形象结构守恒；所有声明最终的图和独立效果通过主审；玩家UI符合真实功能；无缺文件／无孤立未审提交。没有代码接入、动画实机性能或可运行资源承诺。根锚标注是设计规格，连续帧固定锚精度须生产实现另验。

## 美术硬约束

贴纸小怪母版及action-consistency规范为身份权威。角色动作原地，脚部水平中心／无脚投影root固定；后坐／冲刺只作逻辑位移提示。身体图不包含弹体、闪光、弹道、独立召唤物或其他角色。示意板可以有独立分栏，必须明确可拆层。部件与独立机关按代码身份／血量／行为判别。HIVE当前入口优先执行bossOptimizedAbilities：spawnHive=NEST、summonSwarm回落基础实现=SHARD，NEST触发=BASIC。机关具有自身血量与计时行为也属独立实体。生图必须使用imagegen技能，并在生成前实际查看引用图；不能以SVG或代码绘制替代请求的原画修订。
