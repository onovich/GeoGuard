# 角色、UI肖像与弹体特效来源审计

2026-10-06，只读代码/资源/生成链审计，未实施替换。**明确结论：当前角色和关联肖像、子弹、炮口闪光、命中粒子、升级徽主体均为程序自绘或自绘导出资源，不是从已批准PNG原画切出的图。PNG原稿在这条运行链主要作为sourceCatalog/referenceSources追溯参考；引用SHA不等于实际切图加载。**

新要求禁止程序自绘冒用切图：历史“矢量/可编辑/极简”或旧验收已过不能作为豁免。本审计不重新解释新要求，也不把现有生成SVG称作原画切片。

## 优先检查：肖像、粒子、弹体与徽

|对象|分类|实际代码/资源证据|原稿关系|
|---|---|---|---|
|九塔/敌怪/Boss UI肖像|自绘导出资源（运行img加载SVG，不是PNG切图）|src/view/components/ui.jsx:56–62 CharacterIcon通过getCharacterIcon输出img；characters/index.js:29–32读取manifest.icon.src；manifest.js:2全注册icon.svg。示例public/art/characters/v1/tower/basic/icon.svg:1全是path/ellipse，无嵌入原稿image|characters/submissions/r04/build-production.mjs:6导入buildCharacterPlan/planToSvg，:53将rig计划转bodySvg，:59同计划写icon.svg。不是读取原画矩形裁剪。原稿basic-fixed-root.png仅sourceCatalog参考|
|奖励实际塔头像|混合：自绘导出肖像+程序徽/短线|WaveRewardOverlay.jsx:55引用CharacterIcon；:56升级徽为StickerSymbol arrowUp加CSS圆底；:53–54短线CSS|UI-G01/G02改善身份、信息层次，但没有改成原画切图，不能宣称肖像已切片|
|升级箭头/蓝图徽、心/晶|程序自绘SVG/CSS|ui.jsx:74 arrowUp硬编码path，:78 upgradeBlueprint硬编码卷页/箭头path，:79–81 heart/gem/blueprint；WaveRewardOverlay.jsx:56组合升级圆徽|B06/B07作为视觉参考，没有裁剪源PNG图标|
|十源子弹|程序Canvas路径+上色|world/projectiles.js:9–39按sourceArtId选shape，:22 vector绘制，:29三角facet自绘，:32–34椭圆高光及BURST珊瑚tip；world/vectors.js:4–5 seed/lance命令数组|effects-ui r02/b01-friendly-projectiles.png路径在referenceSources.js:12，不参与像素采样或drawImage|
|炮口闪光|程序Canvas路径+椭圆|world/feedback.js:5–12 flashAt调用vector flash/star，:115–118取M挂点位置；vectors.js:6–7 flash/star硬编码贝塞尔|B01对应源/枪口参考，生成图花形没有实际切片|
|普通命中/死亡粒子|程序Canvas路径|feedback.js:25–33 drawParticle选leaf/chip；vectors.js:10–11定义chip/leaf；feedback.js:82–96 drawHit以环/seed组合|B04 M11及vfx-projectile-flash-hit.png为参考，不存在原画粒子图像加载|
|掉落晶体/召唤及命中环|程序Canvas几何|feedback.js:14–22 diamond+facet；:35–80 ring/impactWave；:99后事件层绘制|B04节点/召唤/掉落原图只追溯参考，环/点/叶片现由代码绘制|

上表源码行号按本轮文件读取。SHA/path引用是出处声明，不证明视觉像素来源。

## 身体链：48身份也是程序路径重画

1. `src/view/art/characters/manifest.js:2`为48身份注册，sourceCatalog存批准PNG路径/SHA，同时sourceFile/bodyResource/icon/bodyPng指向public导出物。BASIC声明`authored vector joints, shared sampler; raster alpha audit in r04`，不是原稿裁剪坐标。
2. `friendlyRigData.js:1–22`定义s/e/l/tube等形状工具、palette及FRIENDLY_RIGS；BASIC身体、眼、脚、嘴是手写d路径。`enemyRigData.js`、`bossRigDataA/B.js`、`mechanicRigData.js`同类形状数据，汇入rigData.js。因此友军/14敌/17Boss身体/7机制没有在此链消费批准PNG像素。
3. `characters/index.js:34–41 loadCharacterArt`只primeCharacterPaths及汇总availableIds；没有fetch/decode body.png、source.svg或原稿PNG。`index.js:43–50 drawCharacter`调用buildCharacterPlan→drawPlan。
4. `rig.js:144 buildCharacterPlan`组装变形/镜像/局部刚管；`:241–247`构建Path2D；`:274–300 drawPlan`逐shape ctx.fill/stroke。运行身体是Canvas代码自绘，不是drawImage切帧；动作同样是路径连续变形。
5. `rig.js:332–339 planToSvg`将同一计划输出SVG；正式导出`docs/art-implementation-2026-10-02/characters/submissions/r04/build-production.mjs:53–59`写body/source/icon SVG；r03及r04 render-and-validate.mjs用sharp将这些SVG栅格化成body.png/icon.png。PNG文件存在也只是自绘导出的位图，不是批准原稿像素裁剪；运行身体不加载它们。具体r03 render-and-validate.mjs:89–91为body/icon PNG生成。

示例源原稿：
- tower:BASIC → docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/friendly/submissions/r01/basic-fixed-root.png；运行rig body路径与同名public SVG。
- tower:BURST → friendly/submissions/r01/burst-fixed-root.png；四孔由friendlyRigData刚管几何再画。
- enemy:BASIC → enemies/submissions/r01/images/basic-root-lock.png；enemyRigData五芽路径再画。
- boss:TWINS_SUN/MOON → bosses-mechanics/submissions/r02/pair-05-twins.png；bossRigData身体/表情路径再画。
- hero:PLAYER → friendly/submissions/r01/player-fixed-root.png；friendlyRigData叶片和body路径再画。

## 加载合同和“混合”限定

world/index.js:13–22 loadWorldArt只compileVectors；vectors.js:23–33编译Path2D，:36–42 vector填充描边。assetRegistry.js:13–23 loadArtRegistry调用这两模块，不等于下载原画资产。因此整体加载状态ready只表示程序路径准备好；不能用其证明切图成功。

“混合”只用于奖励卡：它组合img加载的自绘导出SVG和现场自绘SVG/CSS。**没有证据显示该卡包含从批准PNG切出的美术像素。** 身份资源统一源和canonical映射在逻辑上成立，但不满足最新指定的切图方式。没有必要把自绘肖像路径写成未知；生成链已经能确定来源。

## 后续决策建议（本轮不实施）

优先将玩家看到的塔/怪/Boss肖像、心/晶/升级物件、粒子/子弹/枪口闪光建立批准源PNG→去背景/透明切片→导出资源→加载使用的可核对映射；仅把程序SVG转PNG不能满足要求。身体替换涉及分层或关键帧/rig资产，要连同固定root、器官计数、炮管锚点和独立弹体合同设计，而非仅换manifest扩展名。动态文字、可交互布局、真实危险范围应与美术像素资源分层，哪些几何工具保留需主审按用户新要求确认，不能自行假定豁免。

本轮证据是确定来源的代码/资源链，未额外浏览器取证。未改变既有游戏、原稿、逻辑、资源或提交状态。