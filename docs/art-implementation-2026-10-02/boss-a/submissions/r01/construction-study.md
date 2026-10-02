# Boss A：八身份来源与轮廓勘察 r01

日期：2026-10-02。范围仅为来源核对及生产准备；未制作或批准正式资源，未改 src/public，未执行 Git。本组：COMMANDER、HUNTER、FORTRESS、PRISM、FROST_JUDGE、RAIL_WARLORD、COLLECTOR、TWINS_SUN。

本次实际通过 view_image 查看18张图：五张最终身体板、八张 anatomy-lock canonical 动作板、三张最终外部效果板、两张 scene-ui master r04 联合图。逐图观察记录和当前文件 SHA 见 source-evidence.json；不是用 JSON 中的 approved 代替看图。

## 生效来源与状态

最终身体以 production-art-2026-10-02/integration/submissions/r02/production-map.json 的 bodySources 为准，外部 reviews/integration-r02.md 和 reviews/bosses-mechanics-r02.md 的 accepted 覆盖封存提交内 pending/submitted。器官数量与连接拓扑以 action-consistency/anatomy-lock.json 为锁；旧 canonical 动作板仅用于对照既有身份与独立实体边界，不覆盖新身体格。scene-ui 外部 desktop-final-acceptance.md、reviews/master-r04.md 确認 master r04 为最终联合原画。

|身份|最终身体板（bosses-mechanics/submissions/r02）|行|ATTACK 复用动作|NEUTRAL 复用动作|运行参考 radius|
|---|---|---|---|---|---|
|COMMANDER|pair-01-commander-hunter.png|1|ADVANCE / SHIELD / DASH|P1 / P2 / P3|28|
|HUNTER|pair-01-commander-hunter.png|2|PROBE / PINCER / AFTERIMAGE|P1 / P2 / P3|24|
|FORTRESS|pair-02-fortress-prism.png|1|SIEGE / ARMOR / QUAKE|P1 / P2 / P3|34|
|PRISM|pair-02-fortress-prism.png|2|BEAM / MIRRORS / TRIPLE|P1 / P2 / P3|27|
|FROST_JUDGE|pair-03-frost-rail.png|1|RING / FREEZE / STORM|P1 / P2 / P3|30|
|RAIL_WARLORD|pair-03-frost-rail.png|2|MARK / SNIPE / OVERLOAD|P1 / P2 / P3|27|
|COLLECTOR|pair-04-collector-astrolabe.png|1|TAX / ESCORT / RANSOM|P1 / P2 / P3|26|
|TWINS_SUN|pair-05-twins.png|1|ECLIPSE|P1 / P2 / P3 / SOLO / ORBIT / SWAP / SOLO_SUN|24（TWIN_SOL）|

每行列1 NEUTRAL、列2 WINDUP、列3 ATTACK、列4 OPEN。共74条参考动作，均已明确身体归属；只有四种身体关键姿态，不宣称74套独立动画。OPEN 是同身份完整身体加独立全身轮廓，不新增器官。日双子板标题写 TWINS_MOON，但行1明确标 TWINS_SUN / TWIN_SOL；按最终 bodySources 的行1取来源，不能因文件名/大标题误用月身。实际运行身份 TWIN_SOL 与 artId boss:TWINS_SUN 的解析由角色主会话/集成负责。

## 逐身份构造

### COMMANDER

最终中性是宽于高的珊瑚身体，中顶瓣最高、两侧顶瓣较低；左右各一只外侧上举、向内屈的粗大臂，内侧拳用连贯圆瓣和短内弧表达，不能变成四只手臂。横向深棕眉眼槽、中央小口和一颗奶油牙构成最强面部读点；两深棕短脚落同一根线。

贝塞尔分件：两脚（固定）→独立三顶瓣宽躯干→左右屈肘臂→两个内拳/指缝→横槽→口与牙。三顶瓣属于躯干轮廓固定部分，不复用 BASIC 五芽。臂根在身体左右肩凹处，拳根在各自臂内侧肘弧；重叠边界仅画必要内弧，不重复粗描边形成断臂。脸部所有节点在同一躯干局部空间。WINDUP 降低体高，ATTACK 回伸臂身，OPEN 保留同一槽/牙，无腹洞。旧 SHIELD 的收拳姿态不覆盖新 ATTACK 映射；护盾由 world 接状态。小图保留三顶瓣、双屈臂、横槽与单牙。

### HUNTER

前倾、右向的珊瑚短楔体；后上方一长椭圆耳向左伸，顶前一短角朝右，前鼻为圆边长楔；后下方一后瓣和两深棕脚形成低平跑姿。一只近侧眼以斜眉和奶油眼白表现，口沿鼻根，不新增远侧眼。

贝塞尔分件：固定两脚→后长耳→一后瓣→前倾躯干及唯一短角→鼻楔→近侧眼/斜眉→鼻根口线。耳根被躯干后上缘遮住，后瓣与躯干后缘接通，鼻根压在前脸轮廓。耳不是尾、后瓣不是第三脚。WINDUP 轻压低，ATTACK 保持向前楔感；镜像时耳/角/鼻/眼/口整套翻转。PROBE 线、PINCER 小单位、AFTERIMAGE 复制影全独立，不进入身体。小图优先长耳、前鼻、单眼和前倾轮廓。

### FORTRESS

宽低堡体：一顶壳是完整圆拱，左右两侧盾是向外鼓的软垫形，下缘有各自圆端；中央奶油脸窗有两棕眼；两真正短脚位于盾内侧下方，侧盾圆端不算新增脚。最终 ATTACK 明确抬起同一顶壳，中央深棕短连接柱仍连至脸窗所在底座，不能做漂浮独立壳或出现第二壳。

贝塞尔分件：两固定短脚→底座/脸窗承载体→原有中央连接柱→单顶壳→左右侧盾及圆端→奶油脸窗→两眼。壳运动是围绕既有接合结构的抬升/压缩，脸窗位置随底座，不跟随壳脱离。两盾保留左右相接的固定枢根，可做小范围根部旋转。最终 WINDUP 的两眼仍睁开；旧板闭眼仅是旧表情参考，不强制覆盖最终格。SIEGE 墙圈、ARMOR 状态、QUAKE 地波分离。小图保留拱壳、双盾、奶油窗两眼；抬壳时连接柱仍可辨。

### PRISM

纵向软菱袍，上尖下尖均圆角，侧腰收进；中央长黑脸窗呈纵向细叶形，只有两白眼。左右各一紫色椭圆镜侧翼，珊瑚镜框，固定为两个身体部件，无脚。最终板两镜与躯干左右腰位相接；不把镜面误画成眼或召唤分身。

贝塞尔分件：单软菱袍→长黑脸窗→两白眼→左右镜框→各自紫镜面。镜根在腰的两侧固定，角度变化围绕各自根；可以独立局部旋转，不随意分离平移成轨道实体。WINDUP 袍轻压、镜面转向，ATTACK 拉回；OPEN 黑脸窗保持黑，不换奶油洞。BEAM/TRIPLE 光线、MIRRORS 所生 PHASE 单位均由外部层消费真实数据。小图黑窗/白眼与两紫镜的三块对比必须保留。

### FROST_JUDGE

珊瑚圆头被一冰蓝 U 项圈包住，U 两端高于头的左右肩侧；两珊瑚拳接在项圈外下侧；顶部一独立冰冠、胸前一菱形。两闭眼槽和中央口牙位于同一圆头，源图两闭槽相邻成横弧，仍保留两个既有面部锚。项圈不能变成鱼尾或两翼，冠不能变圆球。

贝塞尔分件：源图底部既有两小珊瑚露瓣→完整 U 项圈→圆头→两个闭槽→口与单牙→两拳→独立三尖冰冠→胸菱及项圈简洁冰色面。底部露瓣按源图保留，不据此新增行走器官；root 采用批准合同的投影语义。头与五官同矩阵；冠以父部件固定偏移保留源图小间隙，不能任意漂离；胸菱锚在项圈胸前。两拳根固定于项圈外侧，压伸不改变拳数。FREEZE 目标塔与 SEAL 爪是独立实体；RING/STORM 冰环/雪花均不烘焙。小图优先高 U、冰冠、圆脸牙和双拳，避免贴满小冰晶。

### RAIL_WARLORD

低长珊瑚体，后有一圆尾瓣，顶背两短鳍；一近侧眼/斜眉。前端上下两长轨臂包围一中央圆口，轨臂与口之间有明确的深棕连接及奶油负空间；这不是三个枪管。两脚数量固定；后下方浅色窄区按既有遮挡/亮面处理，不独立生成为第三脚。

贝塞尔分件：两固定脚→一尾瓣→两顶鳍→低长躯干→近侧眼/眉→整套刚性轨炮（上下轨臂、既有支撑、中央圆口外缘/内孔）。轨炮连接点 P 跟随躯干，炮组尺寸、上下间距、孔椭圆不继承躯干非均匀 squash；同一刚性矩阵处理整套。OPEN 近侧眼闭成同锚弧，仍只一眼。圆口的可选显示挂点 M 与轴向必须来自实际新源，不从示意板量数冒充；原技能合同明确走 geometry hazard，不新增 projectile 发射。MARK 的 RETICLE、SNIPE/OVERLOAD 线由 world 保持真实几何。小图保留低长双轨、圆口奶油圈、双顶鳍与一尾；不添加鼻/牙。

### COLLECTOR

单胖袋身，左侧下垂、右肩连一高卷尾臂；顶部两短圆芽，底部两短脚；一横眼槽和吐出的粉舌。腹中央一大蜂蜜币盘，内有棕金折边宝石，作为固定腹部标记；不是掉落资源。卷臂内负空间为深棕，末端向内卷但未独立浮走。

贝塞尔分件：固定两脚→袋身/两顶芽→唯一卷臂及内弧→横槽→粉舌→腹币盘/内币面→少量袋身折线。臂根固定右肩凹位，卷曲由连续贝塞尔保持厚度与相同末端，不能增加另一只臂。腹币与舌随身局部矩阵，不能留在世界原位。WINDUP 袋身轻降，ATTACK 微抬卷臂且仍连接；OPEN 同身。TAX/RANSOM 外金币、ESCORT 搬运子体与背包均独立。小图优先大卷臂、腹币、双芽和吐舌，不把腹币换成薄荷掉落钻。

### TWINS_SUN

单珊瑚圆身，六个日瓣固定在12/2/4/6/8/10点；源图瓣根在圆身后面，可见各瓣间负空间；无脚。两黑眼与一黑嘴/粉舌同圆身。不能采用 BASIC 的五芽或将6点日瓣当脚。

贝塞尔分件：六独立日瓣（固定编号及父根）→圆身→双眼→黑嘴/粉舌。保持六根角位，不通过围绕圆周随机生成数量。WINDUP 与 ATTACK 的双眼为同锚 >/< 表情，圆身略压；OPEN 恢复睁眼同身加外轮廓。SOLO/ORBIT/SWAP/SOLO_SUN 复用 NEUTRAL，不复制月身进图；ECLIPSE 复用 ATTACK，两成员重叠属于两真实 Actor。world 的 twin 特别弧与幸存状态分开，实际 orbit/move 只读逻辑 x/y。小图保留六瓣间距、圆身和开心嘴；不会缩成无瓣红球。

## 尺度、合同与后续文件边界

已只读 rigData.js/rig.js 及集成 r01 坐标/API：新源优先采用主会话样板的256坐标系，保持逐身份编辑；但256画布、root/C0/collisionRadius 必须在正式新稿上测量后确定。上游512画布 R=[256,448]、C0=[256,288] 是提案，不能直接宣称已测量。实际显示 scale=actor.radius/collisionRadiusPx；上表数值是基础配置参考，变体仍使用实际 actor.radius。形体的横纵比从本身份源图重建，不以共同画布或 bbox 动态重居中强求同样体积。

本次不提交数值控制点、不假称关节坐标已测量。后续正式稿以本节各 part 名称建立 parent/pivot/joints 与固定 R/C0；脸部节点在同一体空间，脚保持固定根线，悬浮体固定投影根。LEFT 镜像整套身体与P/M；本组无新的获批 UP 独立身体格，UP 表现需主会话子合同明确合法取向/遮挡，不能自行把身体旋转90度。射击角、碰撞中心、位置、RNG与逻辑状态不由本组修改。

样板现有通用 sampleSoftPose 只做整身压伸；FORTRESS 连接柱/抬壳、PRISM 镜根、COLLECTOR 卷臂需要可表达逐部件变换，RAIL 需要独立 rigid launcher；若子合同尚未支持，应由角色主会话明确扩展点。分组数据文件、形状/pose/direction/launcher 字段和 palette 入口以待派发子合同为准。本组此时不新建 src 文件，不改公共 rig/registry/manifest/index。

收到正式文件授权后，由同一可编辑数据生成透明 neutral 源、身份小图、四姿态及连续循环采样；检验真实 radius 比例、器官计数/连接、根锚残差、闭眼槽、炮组刚性、LEFT 与允许的 UP。循环检查暂停/重开/阶段打断，身体隐藏影子/召唤/特效仍完整。这里是待执行的生产校验范围，不是已执行结果。

## 当前核查结果

八身份/74动作最终来源存在；五最终身体图 SHA 与 production-map 一致；外部效果来源仅三张B02/B03/B04，已实际查看。18图逐一记录当前 SHA、尺寸与观察。source-evidence.json 保留74条逐key的 final bodySources、映射模式、外部效果格、器官锁和原图格身份。本次未输出资源、未跑动作采样、未测锚点/性能、未做游戏验收；正式实施等待主审批准样板及派发分组数据合同。
