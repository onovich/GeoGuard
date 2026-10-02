# UI r01：玩家界面精细设定规格

2026-10-02，Asia/Shanghai。状态 submitted，审批权为主审；本文件不自标通过。范围仅三张原画及来源/功能/状态/拆层规格，无游戏修改、资源接入、提交或部署。

## 生效依据与风格

整体依据为 master r02 `master-desktop-r02.png`，书面通过为 `scene-ui-2026-10-02/reviews/master-r02.md`。原包 style-contract 中“submitted/待主审”是封存历史，其批准以该主审记录为准。整体图负责构图与风格，旧 effects-ui r02 的几何/生命周期与字色规格负责精确语义，身体来源由 friendly r03 负责。完整输入、source SHA 见 prompts.json、generation-record.json、source-fingerprints.json。

视觉目标：奶油面板 #FFF9EF，深棕字/圆线 #4B281C，sage #B6D4AE、coral #F4ADA0、honey #F8DDAA、mint菱形资源 #A8D8BC、浅蓝奖励 #C7E4F4。目标 HEX 不宣称生成图逐像素一致。暖棕软轮廓、克制浅面与微影，中央开放空间留给战斗；不改成硬科幻、拟物棋盘或封闭路线。

主审UI03构成预检指出：E格sage的生成HEX印字有重复A字形。正式sage色码明确以本规格 **#B6D4AE** 为准，其余HEX也以本段为准；不得复制图板生成印字作为色码。此处按主审要求用文字规格显式覆盖，保留已预检图板。

主审UI01预检明确：布局、长对策换行、两完整卡＋第三露边、塔卡手势/松开消失说明可保留；资金与成本菱形须恢复薄荷绿#A8D8BC/深绿边，蓝色仅用于已有奖励辅色。此意见触发定向资源颜色edit，不改变已预检布局与身体；预检不等同本包最终审批。

最终背景权威为已批 background r01 的 BG01 `bg01-clean-background.png` 与 BG02 `bg02-ground-layers.png`，审批 `reviews/background-r01.md`。本会话已实际查看二图并读取规格；UI01地面仅上下文，较密草痕不能升级为新的背景来源。后续整体复合读取BG01/BG02的稀疏连续世界分布与分层规格，不从UI01裁取/重定义背景。

相对轮廓标尺沿用 master：身体1、危区0.8–1、UI容器0.65–0.85，背景不描边或≤0.25。角色/关键HP/危区边界清楚；装饰低于影子；建造射程、危险判定、独立资源不混用。

## 三板与字段映射

逐格需求以 requirements-map.json 为可机读清单；这里提供阅读入口。字色与动态字段约束优先于位图简写/生成字形。每个图上显示的值都是例值，不能裁成运行文字资源。

|板/格|覆盖|实际字段/入口|
|---|---|---|
|UI01 A 桌面|HP/时间/波次/资金/暂停、HIVE HUD、横幅、PC提示、代表性四卡|GameHud health/maxHealth/currentWave/formattedTime/money/togglePause/bossHud；StatusBanner waveMsg.title；BuildBar towerTypes；UI_COPY.controlsPc|
|UI01 B 手机|两行顶栏、长counterplay换行、可关闭手机提示、可读宽度横滚塔卡、临时按下点|同HUD字段；hintCountdown/showControlsHint；towerTypes/overflow；joystick.active/start/current；不增常驻摇杆|
|UI01 C/D/E|更多已解锁塔的横滚、塔卡长按180ms/上拖、空白触点松开消失|BuildBar横向滚动/触摸起拖判定；useCanvasGameLoop触摸id与release；手势图为说明而非新增按钮|
|UI02 A/B/C|开始、结束、暂停及恢复|START/PLAYING/GAMEOVER、UI_COPY、time/currentWave、initGame、paused；暂停需PLAYING且无reward.active|
|UI02 D/E|同一实际三choice桌面三列/手机单列纵滚|rewardState.active/choices.map；choice.title/subtitle/detail/type/amount/towerId；整卡点击applyRewardChoice|
|UI02 F|修复替换某一卡，仍同组最多三项|support_repair、missingHp>0、choice.amount、player.hp/maxHp；恢复玩家，不是全塔维修|
|UI02 G|已有塔保持原等级，后续建造读升级蓝图，选择后下一波|applyRewardChoiceEffects更新catalog而不更新state.towers；createPlacedTower复制当时蓝图；resolveRewardFollowUp普通currentWave+1|
|UI03 A|普通/蓝图等级提升/低资金卡、hover说明、费用仍可读|tower.level/cost/fireRate/name/summary/damage/range；level0..3显示1..4；money<cost视觉不足，非HTML disabled|
|UI03 B|拖出提示、可放/无效/资金不足/回栏取消/中断|dragPlacement.active/canPlace/worldX/worldY/invalidReason、range、cancelRect+18px；paused/reward清拖；只有成功扣费|
|UI03 C|双子两个成员名称/HP/阶段/动作/长对策；幸存狂暴替代状态；条件护卫字段|bossHud group.title/counterplay，members[].name/hpRatio/phase/phaseIndex/phaseCount/actionLabel/enraged/guardCount/exposed；没有tab、折叠或只剩总血量|
|UI03 D|受伤塔HP/外置等级徽、射程与危险区共存、线段带规范|tower.hp/maxHp/level；hazard真实center/radius或线segment/width；独立root相关UI；几何示意不改变碰撞|
|UI03 E|色/字体/触控/对比目标、波次/Boss/阶段横幅|effects-ui r02字色规格；StatusBanner仅message.title；不新增波次概要/目标菜单|
|UI03 F|9塔NEUTRAL来源复用与生产边界|tower-icon-sources.json准确文件/行/格；未展示的身份仍映射，无新身体或已导出透明图标声明|

## 例值和动态规则

UI01四卡只是初始前三塔加已解锁BURST的示意，不代表四槽上限；开局仅BASIC/CANNON/SNIPER，后续按available过滤、sortOrder排序。9塔目录不是9张开局卡、锁定商城或固定库存。底栏显示name、cost、Lv.(level+1)/4、效果/间隔，level>0有UP+level。特殊标签优先splash→pierce→slowRatio→burstCount→单体。hover title是已有桌面说明；没有新增手机点击详情页。

HIVE例值23波、孵潮P2/3沿用已批母稿与真实完整HIVE来源。Boss HUD根据实际group/member数组生成；单成员可避免重复标题，但name/phase/HP/action/counterplay均保留。双子使用encounterRuntime的曜子/蚀子，示意灼线/锁域P2/3。另一成员死亡后只有幸存者，并显示其phase＋ENRAGED；C格幸存状态是另一个时刻，不与双成员状态共存。guardCount>0时追加“护卫 N”，不伪造双子的护卫数字；exposed仅改变真实动作标签强调，不发明暴露倒计时。

UI02解锁FROST=55、BASIC蓝图1→2/15→20/补贴5/伤害7/射程194/间隔0.28秒为源数据例值。物资120、修复42和结束第8波1分24秒是分别对应可存在字段的例值，不宣称所有状态是同一局同时快照。奖励amount读取实际choice；修复量随missingHp和waveNumber计算，补给随实际条件/候选计划计算。

奖励常规画三项，修复为同一choices数组内替换卡；分类区允许四种type分别说明，同屏奖励不可变四选一。代码只保证≤3，满级/解锁/满血等边界可能少于3，不能为了构图虚构补齐项。选择关闭奖励并普通模式进入下一波，无刷新/跳过/确认步骤。Boss赏金即时结算，指定余波/遭遇结算等待后才可开卡，不把一名双子死亡直接画成BossClear。

蓝图升级只更新catalog，后续建造才复制新stats/level；现有塔不被全场升阶。不添加收费升级、玩家塔实例右键菜单或修理塔按钮。等级点徽与文字独立，不随着body左右镜像。

低资金仍能起拖，release重新检测后返回资金不足。资金优先失败；靠近玩家/塔/敌人产生位置无效。ghost和range圆只表达当前拖放状态，成功才扣费；回到栏的扩展rect取消、不扣费；暂停/奖励清拖。现行放置资格没有读取hazards，危区不等于禁建地形。

## 桌面/手机逻辑布局规格

1440×900与390×844为目标逻辑视口，不等于图板像素、设备截图、DPR测量、触控或性能验收。

桌面：顶栏HP左、wave/time中、money/pause右；Boss与横幅分层留出不交叠空间。卡片可横向展开，内容密度和字级稳定，更多塔横滚。手机：第一行HP/money/pause，第二行wave/time；counterplay换行、成员逐行；底卡保持约124逻辑px或更宽的设计目标并横滚，可露下一卡而不是缩成9微图标。UI01以可见两完整卡/下一卡露边示范；手机模态单列，纵向可滚至所有实际选项。底部安全区是建议留白，不声明读取设备safe-area值。

目标正文≥14逻辑px/行高≥1.45，CTA≥16，费用≥16，关键状态≥14，辅助≥12，触控≥44×44。实色组合设计对比≥4.5；半透明最终合成底色需接入阶段重算。不足卡不降低全部文字透明度。位图缩放后的肉眼可读不能等同实机字体字号/对比通过。

操作提示：PC可关闭不倒计时；手机有hintCountdown，30s是初始示例；关闭为showControlsHint。源码倒计时只检查PLAYING，未检查paused/reward.active，不能声明弹窗期间冻结或每局重开必重置。手机移动按下点只在joystick.active出现、释放消失；塔卡180ms/上拖建造与水平滚栏区分。图中手指/箭头是教学示意，不是新增手势按钮或常驻控制面板。

## 图标与拆层生产约定

9塔精确NEUTRAL来源见tower-icon-sources.json；本轮仅代表卡展示形制，其余身份明确来源，不重新生图设计器官。生产时在指定第1格提取body，移除技术导线/root文字/格标签及外置徽记；保持器官数量、刚性炮组、脸部与固定root关系。母稿body不能覆盖新body-only权威；SENTINEL LEFT180印字由friendly r03整个局部rig镜像合同覆盖。

本包没有透明图标、PSD分层源稿、连续帧、图集或精确挂点。角色卡缩略图是生成稿中的示意，不作为新身体源或允许器官变化的权威。图标最终生产复用源格，而非从UI板裁小图；文字必须动态排字。所有引用在本会话先view_image实际查看，原SHA封存于source-fingerprints。

层级：world背景/淡影/身体/危区/弹体依原效果合同；world-linked HP、等级、状态各独立；screen HUD/建造栏/提示随视口固定；screen modal开始结束暂停奖励。root与逻辑center的固定转换不改，设计挂点不冒充实测。UI03线段带仅独立几何说明，没有把无来源线危区塞进HIVE场景；master手绘圆不是精确碰撞资源，生产使用runtime center/radius画真正平面圆盘，线危区全带宽约2×width。

## 明确边界与后续

玩家美术不包括debug升级/降级、开发入口、Boss编辑器、无限HP/money或试玩数据导出。源代码非START时会显示试玩数据入口，此次按协调授权排除包装，并不声称它已有debug guard。HUD的audio props没有渲染声音控件，waveOverview/summary/threats/phaseHint也不能凭字段名生造菜单。

不新增技能、商城、付费升级、退出/设置/售塔、排名、胜利页、第四奖励或下一波倒计时。图中状态说明/色标/尺寸/来源账本为原画外部注释，不能加入产品界面。

本组完成图像实际查看及文档/来源/封包校验后仅提交主审。逐图审批、最终桌面/手机/复杂战斗复合属于后续依赖；本包submitted不表示这些已经验收。资源制作/接入、实际合成对比、触摸事件、长文溢出、DPR、安全区与设备性能留接入阶段验证。
