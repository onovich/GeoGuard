# 玩家 UI 原画来源审计

2026-10-06；只读审计，无产品修改。结论：当前玩家 UI 的主要美术图形不是获批 PNG 的切图。`StickerSymbol` 是 JSX 手写 SVG，面板、按钮、键帽与奖励装饰是 CSS 绘制；角色肖像虽以 `<img>` 引用资源，资源实际也是重新构造的 SVG 路径。按用户本轮明确要求，这些不能凭旧规范允许矢量就认定合格。此前的交互/字号/布局验收不构成切图来源验收。

## 对照原稿

以下路径均相对 `docs/art-direction/sticker-bible-2026-10-01/`，是此前实际审阅过的当前原稿，未以历史弃稿替代：

|编号|完整相对路径|适用部分|
|---|---|---|
|D1|scene-ui-2026-10-02/ui/submissions/r02/dui01-nine-towers-scroll.png|HUD、资源图标、九塔卡、肖像与费用|
|D2|scene-ui-2026-10-02/ui/submissions/r02/dui02-mouse-states.png|tooltip、拖建有效/无效/不足提示|
|D3|scene-ui-2026-10-02/ui/submissions/r02/dui03-boss-rewards.png|Boss HUD、单/双 Boss、奖励卡|
|B5|production-art-2026-10-02/effects-ui/submissions/r02/b05-start-end.png|开始/结束主视觉、叶片、破碎图形、CTA|
|B6|production-art-2026-10-02/effects-ui/submissions/r02/b06-rewards-blueprints.png|奖励图形、心/钻、升级图标、卡片与装饰|
|B7|production-art-2026-10-02/effects-ui/submissions/r02/b07-controls-placement.png|暂停、键帽、状态提示、放置反馈|
|M1|scene-ui-2026-10-02/master/submissions/r04/master-desktop-density-r04.png|电脑端整体 UI/场景/角色比重|
|M2|scene-ui-2026-10-02/master/submissions/r04/master-desktop-twins-r04.png|双子整体布局|

## 逐项追踪

代码路径均相对仓库根；行号对应审计时当前工作树。

|玩家元素|运行链/实际代码证据|原稿|来源结论|用户要求下的处理|
|---|---|---|---|---|
|开始/暂停叶片标识|OverlayScreen.jsx:16、PauseOverlay.jsx:12 → ui.jsx:67 `leafLogo` 路径/填色/短线|B5/B7|确认程序绘制，无切图|P1：切出获批叶片与美术短线；不要手绘路径代替|
|死亡破碎图形|OverlayScreen.jsx:16 → ui.jsx:68 `shattered` 多个手写路径|B5|确认程序绘制|P1：使用原图透明图形|
|心形、钻石|GameHud.jsx:52/67、BuildBar.jsx:119、WaveRewardOverlay.jsx:55 → ui.jsx:79/80|D1/B6|确认程序绘制；包含钻石内部线条|P1：切出原画心/钻，数字继续动态排字|
|波次旗帜、时钟|GameHud.jsx:61/64 → ui.jsx:69/82|D1/B7|确认程序绘制|P1：使用原画图标，不因是简单几何就豁免|
|Boss/phase/波次/系统标识|StatusBanner.jsx:4/13 → ui.jsx:70/71/69/67；图标背圆为 CSS|B7|确认程序绘制|P1：图标与装饰底板切图；文字继续动态|
|资金不足警告|BuildBar.jsx:125 → ui.jsx:73 圆与感叹号|D2/B7|确认程序绘制|P1：切图；不足资格判断不动|
|升级箭头、蓝图页|WaveRewardOverlay.jsx:55/56 → ui.jsx:74/78/81|B6|确认程序绘制；**当前有 towerId 的解锁/升级用肖像，升级另叠箭头，未误报为全部仍使用旧纸页**|P1：升级美术箭头/纸页回归原图或补齐获批切图；当前角色优先版也必须合规资产|
|上下左右箭头/check/close/pause|ui.jsx:72/74–77/83/86|B7/D2（对应符号）；部分定义未必当前被玩家组件调用|确认路径为程序绘制；未调用不等于实机缺陷|实际启用的美术符号须切图；未用定义列库存，不能写成全都在画面出现|
|音量/静音|GameHud.jsx:72 → ui.jsx:84/85|D1整体含工具区域，精确单图对应未确认|确认程序绘制；精确原稿形态不确定|P2：补资产来源与获批图，不能称已有原图切片|
|玩家 Panel（HUD/Boss/开始/暂停/奖励/tooltip/banner）|ui.jsx:17–23 → designSystem.js:25/39–42；CSS rounded/border/bg/shadow|D1/D2/D3/B5/B6/B7|确认程序绘制，无背景图/九宫格引用|P1：原画美术框皮肤切片或九宫格；保留可伸缩内容盒与动态布局|
|CTA 按钮|ui.jsx:5–10 → designSystem.js:57–74；OverlayScreen.jsx:20、PauseOverlay.jsx:15；奖励CTA WaveRewardOverlay.jsx:61 自绘CSS|B5/B6/B7|确认程序绘制底板/边线/圆角|P1：美术底板切片；按钮真实事件、文字与焦点保留|
|塔卡/奖励卡/类别胶囊/升级徽章|BuildBar.jsx:114/121/125；WaveRewardOverlay.jsx:48/49/56/60|D1/D3/B6|确认CSS程序绘制|P1：美术框与徽章改切图/可伸缩切片；卡宽140/gap8/max920及资格规则保留|
|WASD、Esc 键帽|GameHud.jsx:108；PauseOverlay.jsx:14，rounded/border/shadow|B7|确认CSS绘制，按键文字动态|P1：键帽美术底板切图；字母/当前绑定仍为文本|
|奖励落地椭圆与两根短色线|WaveRewardOverlay.jsx:52–54|B6|确认 CSS rounded/rotate 绘制装饰|P1：这属于纯美术，必须切图，不能以功能几何解释|
|奖励标题两颗星|WaveRewardOverlay.jsx:38 `✦` 字体字符|B6|确认字体绘制装饰，非图形切片|P2：以原稿装饰图替换；标题字仍动态|
|开始页左右装饰横线|OverlayScreen.jsx:18 CSS h-px 背景色|B5|确认程序绘制|P2：作为原稿装饰线应切图；无需把普通布局分隔都做位图|
|tooltip 尾巴|BuildBar.jsx:88 CSS旋转方块/竖线，位置来自实际可见卡交集|D2|确认程序绘制；锚点与连线长度具有动态功能|美术尾端皮肤切片；实际所属卡锚点/越界夹取维持代码。不得为了切图回退已经修好的可见性|
|塔/Boss/奖励肖像|ui.jsx:56–63 → characters/index.js:29–31 → characters/manifest.js:2 的 icon.src → public/art/characters/v1/**/icon.svg|D1/D3/B6 + manifest.sourceCatalog 中角色原稿|确认加载资源文件，但**非原画栅格切图**：例如 basic/icon.svg:1 为 body-only editable production source，含身体/脚/炮口等路径，无 image 嵌入|P1：角色头像必须改为获批原画的透明肖像切图；原画引用和 SHA 是参考来源，不能证明像素来自原稿|
|塔上下文升级/降级菜单|TowerContextMenu.jsx:9–22 → ui surface.menu/designSystem.js:38 + ghost button:66|当前八张对应玩家菜单精确原稿未确认|确认通用 CSS 菜单；图形设计来源不确定|P2：作为玩家界面补获批菜单皮肤及切片，不能归入开发者低优先级豁免|

## 资产与非美术功能边界

审计涉及的 ui.jsx 没有任何 approved PNG 图片引用。公共 art 目录当前主要为 characters/world；玩家 UI 的图形通过 JSX SVG 和 CSS 定义。本报告未找到当前玩家 UI 使用的获批原图切片链。角色图标 `<img>` 只是载体，SVG 内部仍是路径；同目录存在 icon.png/body.png 不代表正在使用，也不能仅凭 PNG 后缀断定为原稿切图，需要核验其生产过程。

应保留动态的部分：实际血量宽度/填充比例（GameHud.jsx:55/89）、数字/计时/波次/行动/对策、奖励真实数值、文字换行、真实按钮点击区域、焦点与 hover 状态、滚动条、卡片排版、tooltip 锚点、音量原生 range、拖建资格。这些功能几何本身不等于原画美术图形；框、血条端帽、贴纸徽记可分离成切图皮肤后继续由代码驱动。BuildBar.jsx:93/94 滚动露边渐隐是动态可滚提示，属于功能效果，不足以证明冒用原稿；不要把它与 B6 的纯装饰短线混为一谈。

开发工具（DebugSpawnPanel/BossEditor/导出测试界面）不在本轮玩家包装范围；这里没有以开发栏遮挡来制造玩家 UI 缺陷。结论不重开已通过的交互问题，新增的是美术来源合规问题。建议先建立 UI 切图清单/透明资产/可伸缩边框与批准原图 SHA 的对应，再替换渲染入口；不得只把现在的 SVG 导出 PNG 后称为原画切图。

未确定项：音量图标、上下文菜单的精确获批原稿；各角色 SVG 的完整制作脚本未在本轮定位，不能推断是某种自动矢量化工具。已确定的是运行资产内容为矢量路径、无原画像素嵌入，且当前 UI 不走 raster cut 资源链。实际 Canvas 放置圈/ghost/check 等世界渲染由其他审计负责，本报告仅覆盖玩家 DOM UI。
