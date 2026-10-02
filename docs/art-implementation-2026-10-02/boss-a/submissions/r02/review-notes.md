# Boss A r02：八身份独立生产数据

状态：produced_pending_review。独占模块为 src/view/art/characters/bossRigDataA.js，named export BOSS_RIGS_A。仅写本模块、本组八个 public/art/characters/v1/boss/<identity>/ 目录和自有提交文档；未改公共 rig/registry/manifest/index、游戏逻辑或依赖，未执行 Git。

八身份全部有独立贝塞尔部件、真实器官 joints、固定 R/C0/r0、pose/phase/ability 选择器。五张最终身体板与八张器官锁已实际查看；本次沿用 r01 的18张查看记录及 SHA，以外部 accepted 审查为准。来源板没有被裁切成资源。74个原画动作 key、46个实际技能身份归属均保留；技能姿态按批准身体复用，召唤子体、机关、效果不进入本组身体。

已输出每身份 source.svg/body.svg、256×256 body.png、64×64 icon.svg/icon.png、rig.json，以及11种姿态的未裁切 SVG/透明PNG。编辑入口是模块中每个具名 path/joint；SVG同样逐具名部件可编辑。统一 .88 源画布留边同时缩放 C0/r0/描边/挂点，维持原定运行体量。根锚/中心是新源的作者定义数值，碰撞半径是新源内的中性显示校准圆；alpha 包围盒独立解码，未声称它们是设定板测出的逐像素坐标。

接触表行顺序：COMMANDER、HUNTER、FORTRESS、PRISM、FROST_JUDGE、RAIL_WARLORD、COLLECTOR、TWINS_SUN。列顺序：neutral、left、up-body-reuse、squash、stretch、windup-half、windup、attack-quarter、attack、attack-end、open-body。runtime-radius-contact-sheet.png 每格128×128且角色使用实际参考 radius（28/24/34/27/30/27/26/24），无二次放大；poses 表仅用于审阅轮廓。UP 复用既有身体取向，本组没有获批独立向上投影，未制作新器官或全身90度旋转。

本组实际用 view_image 查看三张自产接触表，并再次查看加入 UP 复用后的最终姿态及实战尺寸表：COMMANDER 保留三顶瓣/双屈臂内拳/槽牙；HUNTER 耳角鼻/单眼/后瓣；FORTRESS 一拱壳/双盾/两眼窗且抬壳有连接柱；PRISM 长黑窗/白眼/两紫镜；FROST U项圈/独冠/双拳/胸菱；RAIL 双轨中央一口/双鳍一尾；COLLECTOR 双芽/卷臂/腹币/舌；SUN 六日瓣和双眼嘴。颜色采用奶油、珊瑚与深棕，身份附件用紫/冰蓝/蜂蜜。影子、子弹、HP、OPEN外轮廓和独立子体未烘焙。

离线生产采样使用公共 rig.js 的只读快照，仅替换 RIGS 导入以采样本组对象，不是第二套运行渲染器，也没有导入到公共 registry。通过2,856个状态/方向数值样本、138个实际技能选择样本、1,224个连续帧alpha边缘检查；11姿态PNG全部透明边缘，MOVE周期接缝、面部同空间、固定根锚、碰撞中心、RAIL刚性尺度、输入零变更均通过。最大根锚残差5.69e-14世界单位，刚性尺度/正交残差5.56e-17。详细证据见 validation.json、anchor-audit.json、alpha-audit.json；这是离线采样证据，不是实机性能或玩法验收。

FORTRESS 抬壳采用精确离散 attack 变体，柱与原顶壳仍连接。公共合同只提供旋转，不能为壳提供连续平移/path插值，因此进入 attack 的壳高变化仍离散；已在 manifest/validation 标明，不用假的连续抬升证明替代。其余身体压伸和附肢小角度由实际共享采样器连续产生。姿态边界的睁/闭眼切换是明确的表情状态，眼锚与计数不变。

接入由角色主会话导入 BOSS_RIGS_A、合并紧凑manifest并验证公共API；随后QA实际公共rig播放、暂停/新局/阶段打断、拥挤战场及性能。本包未宣称公共样板、资源或运行验收已通过。准备工作与全部八身份独立制作已提交，等待主审审查及后续派发。
