# effects-ui 第一包完整资源清单

日期：2026-10-02。owner=effects-ui，revision=r01，提交状态 submitted；只有清单与两张设计样板，不宣称通过、导入、透明单资源、动画或实机截图。禁止从设定板裁切当生产图集。范围以当前本地源文件为准，代码指纹见 source-fingerprints.json。

## 归属与锚点

本组只负责外部效果、战场和玩家UI。身体／炮管属于 friendly；普通敌人身体属于 enemies；Boss与机关身体属于 bosses-mechanics。原画状态 approval 不是生产 ready。所有角色、独立机关、召唤单位的 root 在自己的固定源画布内不动，世界运动从逻辑读取。

本包设计层号不是已实现的渲染顺序：L0=低对比地面；L1=危险区边界与地形；L2=独立影子＋身体引用；L3=弹体与弹道；L4=枪口、命中、装饰波；L5=状态／血条／徽记／交互；L6=屏幕HUD。危险边界必须在拥挤时可辨，必要时由渲染重绘保护边缘，不能被装饰盖住。

锚点：P=弹体当前世界中心，默认本地+X朝向；M=发射器局部枪口挂点，经身体/炮管变换得世界点；H=实际命中世界点；G=危险区中心或线起点；R=固定地面投影root；A/B=连线两端实体世界挂点。flash pivot 位于后缘M，impact pivot=H，shadow pivot=R。层、文字、十字、箭头是示意注释，未来不导出进贴图。

## 三个 projectile kind 与十个外观来源

真实依据：`src/logic/engine/combatOffenseRuntime.js:5/33/51`；塔数据 `src/data/gameConfig.js:49`；绘制 `src/view/canvas/canvasRenderer.js:1214`；命中 `src/logic/engine/combatFrameRuntime.js:6`。

|资源ID|运行期kind|生产设计|pivot／朝向|运动与结算边界|
|---|---|---|---|---|
|projectile.basic|basic|短软种子／小圆胶囊|P中心，+X|vx/vy/life/radius取逻辑；样板是外观尺寸放大|
|projectile.cannon|cannon|圆软籽；同逻辑直线运动|P中心，+X|splash触发范围命中；MORTAR不是新抛物线弹道|
|projectile.sniper|sniper|细籽梭|P中心，+X|保持pierce与hitEnemies；不能画成无限持续激光|
|trail.sniper|sniper的独立尾迹|previousX/Y→当前x/y的克制细线|两个世界端点|装饰尾迹不能改变扫掠命中长度／宽度|

现有 projectile 只存 kind/color 等，不存 towerId/playerSource。下表是未来外观选择契约的需求清单，未接入；不能仅kind推导具体塔。等级强化保留同一外观身份，不增长器官。

|外观来源ID|实际kind来源|颜色字段（当前代码）|形态提案／复用|枪口与身体依赖|
|---|---|---|---|---|
|PLAYER|basic，玩家显式指定|COLORS.projectile；不是COLORS.player|蜂蜜小种子，与塔薄荷区分|PLAYER 0炮管0五官，friendly提供发射表现挂点，不能新增炮或嘴|
|tower:BASIC|basic|tower.color→towerBasic|薄荷短种子；样板basic|单短管局部M/axis|
|tower:CANNON|cannon，splash|towerCannon|蜂蜜薄荷大圆籽；样板cannon|大桶嘴M/axis|
|tower:SNIPER|sniper，pierce|towerSniper|细sage梭；样板sniper＋独立trail|单喙M/axis|
|tower:RAPID|basic|towerRapid|basic小型复用，数量／间隔按逻辑|上下双管挂点；不推导新增双发|
|tower:MORTAR|cannon，splash|towerMortar|cannon复用色标，范围由splash|刚性杯口M；无抛物线／落点新增|
|tower:FROST|basic，slowRatio|towerFrost|basic＋克制冰蓝色标；命中另附slow|横哨嘴M，不烘焙冻环|
|tower:RAIL|sniper，pierce|towerRail|sniper＋色标；trail复用|两平行长喙M；不新增两条伤害射线|
|tower:BURST|basic，初始burstCount=4，内部level=3时5发|towerBurst|basic共享；扇形offset取逻辑|2×2四等径孔四M守恒；读取实际burstCount，不能拿四孔限制4发或增第五孔；future美术来源标识另列|
|tower:SENTINEL|basic|towerSentinel|basic共享＋sage色标|单短管M|

所有弹体当前从塔／玩家几何中心出生。flash只挂M独立演出，不能把出生点偷偷移到M。迁移出生点、整角色后坐偏移、稳定外观来源ID都属于后续明确逻辑适配，当前不执行。九塔／PLAYER持有同一三分之四视角，轴线跟随真实瞄准角；本包不替其他组决定旋转上限。

BURST等级核验：`src/logic/engine/towerRules.js:25` 在升到内部level=3时burstCount+1；buildTowerAtLevel从基础数据循环强化，内部0/1/2/3分别4/4/4/5发，UI显示Lv.1/2/3/4。固定四孔只是身体锁，不等于最多四弹；本包不提出新的五孔、逐孔发弹调度或额外弹数。

## 通用效果与战场全集

|资源ID／家族|真实来源与触发|独立生产内容／复用|锚点／生命周期|
|---|---|---|---|
|flash.basic/cannon/sniper|combatOffenseRuntime发射；当前无flash专用实体或事件|三共享模板，十来源色标；r01设计样板|M，需未来显式成功发射事件；不按攻击帧自动结算|
|hit.spark|combatFrameRuntime命中spawnParticle|一小火花模板色标复用，onset/peak/fade|H，仅装饰particle.life|
|hit.splash|projectile.splash，impactWaves＋particles|径向软波；不得改变伤害半径|H，maxRadius=splash；装饰life不延长伤害|
|hit.pierce|projectile.pierce>0＋sniper粒子|短细闪与小环|H，impactWave已有0.12等逻辑life，消散不阻止下一命中|
|hit.damageText|spawnFloatingText实伤显示|数字＋必要描边，字体由UI方案|H上方，floatingTexts.life；显示值沿用代码|
|death.fragment|enemyDefeatRuntime／塔hp<=0|普通与Boss共用低密碎屑；不把独立子体当碎屑|世界点，particles.life；身体破碎拓扑依身体组|
|summon.success|entitySpawnRuntime，BEACON召唤，机关NEST|独立轻亮环／开口烟；已有BEACON波可复用|实际成功子实体root点；预算失败不出现实体幻影|
|split.success|SHARD deathSpawn=SPLINTER|独立生成闪／软裂缝|实际三个子实体；三片SPLINTER仍有各自HP|
|wave.generic|state.impactWaves所有通用调用|一个径向波模板，颜色/dash/spokes等参数化|世界中心，radius增长+life淡出；纯装饰|
|wave.twinFinisher/dragonFinisher/astrolabeFinisher|canvasRenderer drawImpactWaveAccent与对应未覆盖技能|三专题轮廓模板，复用generic底环|读impactWave中心/rotation/nodeCount/anchorA/B；不换身体|
|wave.spiderFinisher|renderer仍支持；基础fallback webField/nestBloom里有，当前被optimized覆盖|列支持性需求，低于主运行效果；不误报当前webField生成|纯装饰，只有实际style出现才绘制|
|boss.windupLink/targetRing/castProgress|canvasRenderer:921，lockedTarget/actionTimer/windupDuration|蓄力虚线、目标环、进度弧；献祭额外victim连线|boss→lockedTarget/victim，windup退出结束|
|boss.phaseIntro/showcase|drawBossPhaseAura/showcaseAccent，bossPresentation|薄低对比阶段环／身份几何accent；允许参数复用|Boss世界中心，phaseIntroTimer；身份器官不由外环增加|
|boss.encounterLink|drawBossEncounterLinks|双子柔线／中点记号|两个独立Boss端点；死亡／失去关系结束|
|mechanic.rootLink|canvasRenderer:913|父根与子根独立连线|parentUid端点；父消失停止；子根仍独立实体|
|mechanic.targetLink/targetMark|SEAL/RETICLE targetUid，canvasRenderer:970|节点到目标塔线／目标塔外标|节点和塔两个端点；节点破坏可阻止后续触发，不烘焙成塔器官|
|mechanic.countdown/cargoLabel|mechanic.timer/life与renderer文字|SEAL/RETICLE计时需求、COURIER追回金额标|附节点root，文字取运行值；fade不新增伤害|
|status.shield|enemy.shield/maxShield、shieldPulse/forgeArmor/fortify|独立部分护盾环，盾破裂模板|实体投影R，比例取shield；SHIELD肉盾身体归enemies|
|status.slow|enemy.slowRatio<1/slowTimer、applyPlayerSlow|冰蓝环／简短标识；PLAYER慢速需求只读真实timer|R，slowTimer结束；不冻住器官|
|status.frozenTower|tower.frozenTimer，SEAL触发／area slow|独立冰框及小暂停符，可见真实塔轮廓|塔R，timer结束；不是新生命对象|
|status.jam/armor|jamAura影响getTowerFireRateFactor；armoredTimer|克制干扰外纹／护甲状态需求；当前jam/armor无完整专用renderer|R，实际在范围/状态内显示；纯美术新增表现需接入，不承诺已存在|
|status.phased/burrowed|enemyBehaviorRuntime和renderer|身体alpha遮罩／低地面影、出土碎土、emerge环|实体R；PHASE尾/脸不新增，BURROWER本体在enemies|
|status.hitFlash|enemy.hitFlash、受击粒子|保持器官数的统一染色遮罩|原身体画布，共用变换，无独立伤害|
|status.OPEN|bossCombatRuntime:19及bossHudRuntime|全身外框／暖蜂蜜提示＋UI exposed文字|读取实际damageTakenMultiplier>1，不做腹核命中点；恢复不一律固定倍率|
|status.enraged/survivor|enrageTwinRuntime，Boss HUD成员enraged|双体中的幸存者外色标／动作文字|附存活实体；非第四阶段、非合体|
|world.healthBars|canvasRenderer塔／敌hp<maxHp＋Boss HUD|清晰HP小条底板/填充，机关独立HP|实体root偏移；生命比例原值|
|world.levelBadge|drawTowerUpgradeBadge，BuildBar level/maxLevel|同体外置1/2/3/4点等级徽；Lv文字|塔R外置UI；code.level 0–3对应Lv1–4，不加器官/收费升级|
|world.ground|COLORS.bg/grid，canvasRenderer:858|低对比奶油地面与极浅点／格纹|世界坐标网格；不得伪造阻挡地形|
|world.shadow|当前Canvas shadow属性；替换计划要求独立影子|柔椭圆模板；浮空也固定投影|R，脚/投影根锚固定，跳跃仅压缩alpha/宽度|
|world.placement.valid/invalid/range|state.dragPlacement.canPlace、dragTower.range|绿/珊瑚边环＋允许/禁止符，避免只靠色；塔ghost另层|worldX/Y，拖拽周期；不新增选塔/出售功能|
|world.selection|计划要求选择范围；当前普通玩家无持久selectedTower状态|保留需求但标待接入；不可在样板包装成已实现玩家菜单|由未来真实选择状态驱动|
|world.drop.gem/pickup|enemyDefeatRuntime state.drops、updateDropRuntime|真正掉落薄荷钻＋磁吸/拾取反馈|drop世界点；现有80范围磁吸、接触结算不改|
|world.moneyFeedback|boss正常赏金即时、COURIER退款即时|HUD数字反馈/可选短浮字；与drop严格分开|代码即时结算；装饰钻不得新增可拾实体或再次付款|
|world.touchOrigin|state.joystick.active/start/current，renderer:1329|临时触点圈、方向点；不是固定按钮|屏幕startX/Y与currentX/Y，触控期间可见|

### 危险区与持续地形全集

详细技能到资源映射见 boss-effects.md；完整源码片段见 boss-source-map.json。危险区仍是hazards，不包装成子弹、可拾物或可击破单位。只有机关对应enemies独立HP。

|资源家族|当前主运行 label|制作语言|几何与pivot|
|---|---|---|---|
|hazard.line.generic|无label（prismBeam/tripleBeam）|通用虚线预警、实线瞬间、淡线消散|G=line.x/y，终点=x2/y2；真实width边缘|
|hazard.line.formation|formation|阵线软矩形纹|同上，无新增墙体碰撞|
|hazard.line.charge|charge/ram/slash/solar|方向纹＋双侧危险边界|逻辑dash与line分开，不从箭头推动body|
|hazard.line.mark|mark|锁定短标线|目标位置与真实线长由逻辑锁定|
|hazard.line.optical|refract/lattice/mirror/flare/shadow/crossfire/sunbolt/moonbolt|双细线、折光／日月小纹|危区线是直线；shadow不画成曲线伤害判定|
|hazard.line.rail|rail/crosshair/grid/overload|并行短刻线|轴线＋width守恒；grid多条实际线逐条绘制|
|hazard.line.coin|coinline|稀疏币刻纹|装饰币不可拾|
|hazard.line.tempo|tempo|节拍节点线|节拍延迟由beatFor/runtime，不按动画控制|
|hazard.line.orbit|orbit/lock|轨锁小圈＋细线|仍实际直线端点，不转成曲线弹道|
|hazard.line.maze|gate/maze|门格短纹|line危区不变独立MECHANIC_WALL|
|hazard.line.vine|vine|低密根纹|独立线层，不能增加Boss根肢|
|hazard.area.hunt|hunt|小锁环|G中心，半径取radius|
|hazard.area.blast|mortar/bunker/meteor/inferno/dive/slag|珊瑚危险边＋低饱和蜂蜜内纹|G中心；半径/脉冲变化按当前值|
|hazard.area.frost|frost/prison/moon|危险边＋低密冰／月纹|不是额外冰牢机关，慢速/冻结照逻辑|
|hazard.area.brood|brood|巢纹＋危险边|NEST机关本体独立，ownerMechanicUid读取|
|hazard.area.coin|coin|钱币软纹＋危险边|COURIER独立；币纹不可拾|
|hazard.area.eclipse|eclipse|日月双纹＋危险边|双子本体各自root/HP|
|hazard.area.shade|shade|柔紫淡纹|不从美术新增隐身区域|
|hazard.area.gravity|gravity/singularity/horizon/star|拉力环／星点纹，真范围边保留|pull/maxPullStep逻辑驱动；装饰旋转不推实体|
|hazard.area.wall|wall|圆范围内门格淡纹|实际area仍圆，不能绘成方形判定|
|hazard.area.beat|beat|节拍点环|即时结算、再脉冲每轮重新预警|
|hazard.area.garden|poison/spore|低密紫软纹|poisonBloom/sporeBurst现有area，不新增资源类型|
|hazard.area.breath|breath（optimized wingBuffet）|径向推力纹＋真实圆边|保持area圆形、pull负值驱动真实推力|
|terrain.web/poison|WEB/ROOT机关持续地形|持续低饱和纹＋每次脉冲危险边|ownerMechanicUid，机关销毁撤hazard；Boss死亡terrain清理|

备用来源单列：dragonBreath 的line breath；基础fallback的brood line、diveTrail line、ember/nest/web/silk/garden area与spiderFinisher style等当前被覆盖，不混进主运行效果。renderer支持但当前主调用未产生的label属于可复用库／备用，不需第一包批量生图。作者库的tailSweep有编辑能力名但未找到同名处理分支，列待核实，不能凭名字发明攻击。

生命周期契约：hazard.timer>0期间预警；timer到0由updateHazardRuntime结算，line随后删掉并生成终点impactWave，area则删掉或设置下一pulseInterval，并改变radius/damage。没有持续“active伤害动画窗口”；ACTIVE只表示结算瞬间的视觉峰值。fade属于particles/impactWaves装饰，不能延长或追加伤害。area警告时长可能由getAreaWarningDuration根据玩家逃离距离增加，不能从原画固定成0.9秒。边界取combatRules判定，不用renderer可变线宽当新hitbox。

判定细节：combatRules.isLineHazardHit以距离≤hazard.width+target.radius判中，width是中心线两侧的距离阈值，危险带应显示约2×width完整宽度（角色半径另参与碰撞）。area也是radius+target.radius参与命中。预警不能照搬当前renderer可变strokeWidth当真实安全边。本包未接入该边界纠正。

## COURIER与HIVE校正

- 当前入口：`src/logic/hooks/useGeoGuardGame.jsx:798` → `runBossOptimizedAbility`。37项 optimized handler 优先；无handler才调用基础 `runBossAbilityEffect`。
- HIVE spawnHive→两个NEST需求；broodShift迁移到NEST，缺NEST时尝试spawnHive；NEST独立计时触发BASIC；summonSwarm fallback→SHARD。BEACON仅基础spawnHive旧来源／普通敌人独立身份，不能作为当前spawnHive图示。主审2026-10-02明确撤销旧BEACON要求。
- COURIER由stealWithCourier产生，value=0；击破时settleMechanicDefeatRuntime直接state.money += cargo，syncHudMoney。逃走不退款。本体的背袋／钻是身体形象锁；掉货示意如保留只是即时退款表现，没有新增state.drops。旧production-notes可拾描述与当前实际结算冲突，优先主审修正后的运行期链。
- 普通敌人value>0可真正产生state.drops；正常波次Boss賞金即时，不再掉钻。不要用一个奖励动画替代三种来源语义。

## 玩家UI全集（真实GameScreen组件）

|资源ID|实际组件／来源|功能与制作内容|优先级／边界|
|---|---|---|---|
|ui.hud.hp|GameHud|HP health/maxHealth与比例条，底板、心形可选标识|P0；PLAYING可见|
|ui.hud.waveTime|GameHud|WAVE currentWave＋formattedTime|P0；waveOverview prop当前未绘，不发明倒计时/敌人计数|
|ui.hud.money|GameHud|money＋薄荷钻标|P0；唯一建造货币，不添加宝石/金币两套|
|ui.hud.pause|GameHud + GameScreen|暂停按钮；暂停遮罩“游戏已暂停”、继续游戏/Esc说明|P0；reward.active时不叠加暂停对话框|
|ui.hud.boss|GameHud bossHud|group.title/counterplay，每member name/HP/phase/enraged/Pn/count/actionLabel/guardCount|P0；双子两个成员HP，OPEN以exposed真实值；不是独立弱点bar|
|ui.hud.controls|GameHud + UI_COPY|桌面WASD/方向键、拖卡；手机长按空白移动、拖卡；可关闭提示，手机倒计时30s|P0；临时触点反馈由canvas，非虚构常驻虚拟按键|
|ui.build.card|BuildBar towerTypes|可用蓝图的icon/name/cost/Lv1–4/类型与fireRate；hover真实damage/range说明|P0；初始仅BASIC/CANNON/SNIPER，后续解锁显示，不把9塔同时当初始|
|ui.build.states|BuildBar|普通、拖拽、资金不足60%opacity、hover，拖到场地提示|P0；opacity不等于禁止逻辑；具体能否放按canPlace|
|ui.build.scroll|BuildBar|横向滚动与左右边缘fade；移动180ms长按拖拽或上拖，横滑浏览|P0；样板只有3卡，九塔时overflow行为沿用|
|ui.reward|WaveRewardOverlay + rewardFlowRuntime|Boss击破、choices三卡、unlock/upgrade/support_money/support_repair四样式、choice文本及CTA|P1；选择即生效；蓝图强化仅影响后续新建塔，不给已建塔收费升级|
|ui.start/end|OverlayScreen|GeoGuard开始描述/开始游戏；结束波次/时间/重新挑战|P1；localhost开发测试入口维持，不包装玩家入口|
|ui.statusBanner|StatusBanner|waveMsg.title与boss/phase/wave/system tone，accent条|P1；当前只渲染title，不自行增加subtitle/chips|
|ui.audio|useGameAudio + GameScreen传props|音频enabled/volume数据存在，但GameHud当前没有渲染声音按钮或音量滑杆|P2未接入预留，HUD样板不画可点音量入口；需后续独立UI批准|
|ui.towerContext|TowerContextMenu + useGeoGuardGame:714–741|升级/降级仅debug守卫允许|低优先dev/test；不包装成普通玩家收费升级、出售或转移|
|ui.debug/spawn/editor|DebugSpawnPanel/BossEditorPanel|开发场生成／编辑保持可用|低优先；本轮不做完整原画|
|ui.playtestExport|PlaytestExport|测试导出功能维持|低优先；不把测试入口画成普通玩家成就/分享|
|ui.primitives|ui.jsx/designSystem|Panel/button/badge各状态、描边、文字层、遮罩、禁用态共享样式|设计需求；不是src修改|

HUD样板展示桌面与390×844移动构图建议，版面刻度与44px触控目标不是已实现尺寸验收。移动safe-area、状态Banner避让Boss HUD属于后续布局验证；本包不宣称已解决真实叠层碰撞。卡图要使用friendly通过的neutral身份资产；生成图中小图标只是参考，不能作为生产身份母版替代anatomy-lock。

## 后续来源依赖与交付门槛

friendly提供PLAYER+九塔M/axis与icon身份；enemies提供分裂／召唤/PHASE/BURROWER等独立效果请求；bosses-mechanics提供逐技能effect、挂点、外置机关连接需求。主审统一交给本组后，再合并独立效果设定。不会自行读取其他组未审批新稿并开始批量。

后续资源元数据至少：assetId、runtime source、owner UID类别、source canvas、pivot/root、collisionCenter固定偏移（如引用）、axis、layer、visible bounds、frames/time、loop、trigger、stop/owner cleanup、variant/atlas offset、透明alpha、reference审批版本。当前只定设计语义，数值锚点与连续帧精度留生产实现验收。

第一包主审查看两张原画，并验清单来源、覆盖差异和归属。通过后须明确授权扩展；在该指令到达前停工，不批量生成剩余效果。
