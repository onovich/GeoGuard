# Friendly r01 第一包制作说明

本包覆盖九塔99条与PLAYER7条，共106动作参考。仅本目录新增文件，无源码修改、资源接入、Git提交或部署。三张新规范板均使用内置 image_gen，以已实际查看的BASIC pilot v4、BURST pilot v2、PLAYER上排身体为身份来源。

## 样板与使用范围

- basic-fixed-root.png：常态、压缩、拉伸、原地攻击；两芽、后瓣、两脚、一眼、脸颊弧、短管守恒。下栏为刚性管P/M与独立层示意。
- burst-fixed-root.png：同四姿态；腹斑保留，四等径孔2×2共面炮架与P/M1–4示意。上排和下栏前视图说明孔径/拓扑，下排动作保留批准三分之四相机与原炮组身份。
- player-fixed-root.png：四姿态固定底接触投影；单蜂蜜水滴＋单sage叶，零五官、手脚、炮。两方向及AUTO_ATTACK在清单中明确复用。

所有身体格剥离弹体、枪口闪光、轨迹、独立其他角色。影子在塔板下栏单列；主行隐藏影子以使根锚线清楚。分栏小部件仅是绘制拆层说明，整板不可直接裁入游戏。BASIC/BURST初次生成的根十字在脚下，内置工具定向返修至脚接地点中线；最终提交仅返修版。

## 数字与几何诚实边界

JSON中的256×256画布、root(0.5,0.8)、collisionCenter(0.5,0.53)、孔平面归一化M坐标均是proposed绘制目标，不是此设定板已测坐标。炮口M定义为孔出口中心，图中引线有些落在孔边，仅指孔身份，不能当精确挂点。纸面ROOT线与中心作为设计规范，生成板仍有线宽与像素级差异；固定源画布、根锚精度、刚性组不缩放必须在后续源稿与连续帧叠加检查。没有宣称已测锚点、可运行资源或实机性能。

炮架是独立挂在P的身体部件，无独立血量/行为。body软变形只能改变P的位置和方向，炮组不继承缩放。BURST四孔前平面必须等径、规则2×2、共面；生产源稿以同一刚性实例复用，不按图板每格大小裁独立炮架。左右/UP保持同相机，不以换视角作为瞄准。

## 与运行期的映射差异

真实入口useGeoGuardGame.jsx:868/872/873分别驱动移动、玩家进攻与塔进攻。combatOffenseRuntime.js:46/70目前从逻辑中心生成弹体；设计M仅挂独立短效果，不迁移弹体出生点。projectile kind只有basic/cannon/sniper，无法凭kind区分九塔，来源标记为后续适配依赖。

- RAPID上下双管、RAIL平行双管仍每次逻辑发射一枚；不能按管数新增弹体。
- MORTAR当前发直线cannon溅射弹，不增加抛物线或落点预警；RAIL/SNIPER是穿透弹而非持续射线；FROST减速由真实命中决定。
- BURST基础burstCount=4，逻辑level3通过towerRules.js:25变为5；四孔固定，不能第五孔或第五个器官。射击次数、方向均消费实际逻辑值。
- 参考Lv1/2/3/4分别对应逻辑level0/1/2/3；使用同身体＋外置点徽，不发明玩家收费升级。
- SQUASH/STRETCH/DIR_*是原画表现参考，当前不存在这些同名动作状态。新循环方案只有设计含义，不驱动玩法。

主审已撤销plan/coordination内spawnHive=BEACON的旧要求。已核实useGeoGuardGame.jsx:798先调runBossOptimizedAbility，bossOptimizedAbilities.js:209–212有handler优先，否则fallback。当前spawnHive:53生成NEST，NEST触发BASIC；summonSwarm无覆盖，fallback为SHARD。另核实broodShift:56按NEST节点迁移、hivePulse:64及hiveCollapse:70在NEST位置创建危险区；旧fallback按BEACON/其位置处理，不能套用于当前链。本组不做HIVE或机关资源，完整覆盖差异由bosses-mechanics清单负责。

## 待主审与依赖

第一包状态submitted，所有新图awaiting_primary_review，已有concept approval保持独立。effects-ui需独立设计九塔/PLAYER弹体、短枪口/发射反馈、真实命中效果与等级点徽；本组只是需求映射。源稿/连续帧、挂点测量、生产导出及接入都尚未进行。收到主审明确通过与下一轮范围后再展开其余身份，新生图不批量开展。

生成提示词与一次根锚返修均保存在prompts.json。生成方式builtin_image_gen；无API/CLI fallback。

