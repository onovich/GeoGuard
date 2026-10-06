# 场景、背景、根影、装饰与效果来源专项审计

2026-10-06。只读，未改产品文件。结论：**本范围运行时美术装饰主要为程序Canvas路径/CSS/内联SVG绘制，没有发现直接从获批原画切图加载的world美术元素。** worldManifest/referenceSources引用原稿和SHA只证明参考定位，不证明切图制作。按用户当前禁止程序自绘冒用应切图原画元素要求，这些装饰不能自动因历史规范/旧审批而豁免。

## 已确证的资源链

src/view/art/integration/assetRegistry.js:17–24加载world模块；src/view/art/world/index.js:13–18直接compileVectors返回paths/commands，明确没有PNG解码；src/view/art/world/vectors.js:3–12用手写贝塞尔/线段命令定义seed/lance/flash/star/patchA/patchB/chip/leaf/diamond，24–40编译Path2D后填色描边。

world/manifest.js:19明确renderMode compiled-vector、20 sourceFile vectors.js；22–33写原稿source与neutralExport路径。这些是参考标签/导出元数据，运行器未据此加载图片。

public/art/world/v1存在PNG，但 docs/art-implementation-2026-10-02/world/submissions/r02/sample-production.mjs:18–22是Canvas转PNG，34用drawWorldBackground生成background/neutral.png，77明确runtimeTextureBytes:0/runtime uses precompiled local vectors, no PNG decoding。故**即使有PNG，它们也是程序采样导出，不能称原画裁切**。这一结论有生成脚本及实际调用链，不仅靠文件扩展名猜测。

## 分类清单

表内B路径基址：docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/effects-ui/submissions/r02/；BG路径基址：同画册scene-ui-2026-10-02/background/submissions/r02/。

|元素|获批参考原稿/格|当前代码定位|实际运行资源/方法|结论与边界|
|---|---|---|---|---|
|奶油基底|BG/bg01-clean-background.png、bg02-ground-layers.png|ground.js:16；integration/stickerScene.js:80|Canvas fillRect颜色P.cream|程序平色；基础清屏颜色不是切图物件，仍应明确记录|
|不对称浅斑|BG01/BG02|ground.js:20–24、vectors.js:8–9|手写patchA/patchB路径，hash分布|程序自绘；未加载原画斑块切片，优先纠正来源|
|三短草|BG01/BG02|ground.js:27–31|三次segment线段|程序自绘；形似短草不等于原稿切图|
|独立root影|B02/S11|overlays.js:16–24|Canvas径向渐变+ellipse|程序自绘；public/art/world/v1/effects/shadow.png为导出而非运行原画切图|
|死亡/普通碎片|B04/M11|feedback.js:25–31、120–125；vectors.js:10–11|chip/leaf手写路径，coral/mint平色|程序自绘粒子；public effects/defeat.png不被运行器加载|
|枪口flash/星闪|B01/P01–10|feedback.js:5–9、114–118；vectors.js:6–7|flash/star路径+额外ellipse|程序自绘；独立生命周期/挂点可由代码控制，但造型没有原稿切片|
|命中装饰|r01/vfx-projectile-flash-hit.png HIT行|feedback.js:84–95|环、虚线环、seed路径|程序自绘；逻辑命中事件与装饰造型应分开|
|召唤/分裂成功/退款|B04/M03/M04/M08|feedback.js:127–136|ring、segment、leaf路径|程序自绘；成功事件由真实childKeys/amount约束，约束正确不证明美术切图|
|阶段/专题装饰波|B04/M10/M12|feedback.js:40–80|椭圆、正弦曲线、节点/短线|程序自绘；部分样式分支需特定事件才出现，不能全部声称当前实机复现|
|盾/慢/冻/甲/OPEN/狂暴/隐相/出土/intro|B02/S01–10、S15|overlays.js:26–70|弧、ellipse、短线、土点|程序自绘装饰；OPEN测量身体包络仅是挂点几何，造型仍非原图|
|干扰/治疗/引爆资格|B02/S04/S15复用|qualifications.js:9–20、23–36、39–52|正弦干扰线、6弧、进度弧、十字|程序自绘；range/progress读真实字段，但非危险伤害几何，不可用“功能”整体豁免造型|
|真实危险圆/胶囊边界及填充|B03/H01–04|hazards.js:5–18、62–83|真实radius/width/endpoints生成footprint|程序功能几何；必须保持真实判定，不能直接把概念图整圆当判定形。几何与美术皮肤分层登记，不宣称切图|
|危盘内WEB/ROOT纹样/毒点/内环|B04/M01/M02、B03/H03|hazards.js:21–57、72–75|手写网/根曲线/点/弧，clip到真实盘|程序美术装饰；真实clip不等于装饰来自原稿，应与上一行区分|
|目标/父子root连接|B04/M06/M07、B02/S16|feedback.js:142–161|双正弦/虚线segment+末端圆|程序自绘；端点必须动态但线条皮肤无切图|
|放置范围与结果章|B07/U10|overlays.js:76–87|真实range circle+程序check/X|范围是功能几何；结果符号是装饰自绘，可分别替换，不能一起归为已切图|
|十源弹体造型/资源菱形|B01/P01–10、B04/M09|projectiles.js:22–37；feedback.js:14–21|seed/lance/diamond路径+程序色面高光|程序自绘外观；弹体轨迹来自实体、资源位置来自真实drop，不等于造型切图|
|世界HP/等级/拖建标签框|B02/S12/S14、整体r04|integration/stickerScene.js:14–33、126–130|roundRect/fillRect与动态文字|程序面板框；数据与文本动态正确，框/徽背景未裁原图|
|玩家screen面板外框与底|B05/B06/B07/DUI01–03|designSystem.js:29–30、ui.jsx:21–26、BuildBar.jsx:95、GameHud.jsx:51/60/67/107|CSS rounded/border/background，Panel组件|程序CSS造型；不读取获批边框纹样。功能布局可保留，装饰外框按当前要求重新核定|
|奖励短线、扁地斑、标题星点|B06/DUI03|WaveRewardOverlay.jsx:38、52–54|CSS圆角span/背景色和文本✦|程序绘制/字体符号；非原稿装饰切片|
|封面分隔线及叶片/破碎符号|B05|OverlayScreen.jsx:18；ui.jsx:67–68、88|CSS h-px、inline SVG path|程序自绘；本人此前实现也属此类，不以“看过原图”冒称切图|

代码简称上表world/*均为 src/view/art/world/，其余组件为 src/view/components/；integration/*为 src/view/art/integration/。行号对应本次读取源码。

## 混合与未知的准确界限

- 整个最终画面是角色图片等与以上程序装饰的混合；本报告不替角色组判断CharacterIcon PNG是否原图裁切。ui.jsx:62确有img加载，但PNG血统需对应独立生成/裁切链，不能因为使用img就认定真切图。
- world装饰链已足够确证程序绘制，不属于未知。特定专题效果是否实际被当前技能触发属于运行覆盖未知，不影响它们代码路径是自绘的判断。
- 本轮已有实机normal/Wave31/HIVE/Twins截图用于理解表现，本专项主要审计静态资源调用与来源。未重新触发所有效果、不声称全部95技能实机造型已观察。

## 建议补救边界

将背景浅斑/短草、根影、粒子碎片、枪口/命中物件、状态装饰、面板美术皮肤列为原稿切片任务；保存原图SHA、crop矩形、透明处理方式、源图到切片可视对照、实际运行URL/atlas区域。基础形状简单也不能无证据声称切图。动态位移/旋转/缩放/生命周期允许代码驱动已有切片，但不是自创新造型。

危区/射程/真实弹道/动态HP长度保留准确逻辑几何，与美术皮肤拆层；如需程序几何或九宫格边框，应清楚标为功能/伸缩实现，不自动扩展到草、叶、碎片和状态装饰。当前旧source清单、SHA记录、程序导出PNG都不能代替上述原图切片证据。