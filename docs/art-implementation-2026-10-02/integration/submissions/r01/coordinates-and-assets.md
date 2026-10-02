# 坐标、锚点和资源生产

## 坐标合同

现有实体 `(x,y)` 是逻辑碰撞中心 C；不是脚底根锚。世界与屏幕均 y 向下。DPR 只由 useCanvasGameLoop 在 ctx 上设置一次，renderer 再设置 camera 平移一次。worker draw 接收已变换的 ctx 和世界坐标，不自己取 window.innerWidth 或乘 DPR。

每个身份 manifest 明确 sourceSize、rootPx=R、collisionCenterPx=C0、collisionRadiusPx=r0 和 referenceRuntimeRadius。所有帧/方向使用同一未裁切源画布和同一 R/C0；如果方向构造有差异，必须记录每方向的固定坐标映射，不能动态按可见 bbox 居中。上游256/512画布与锚数值均是提案，不是已测量素材；生产者要在自己的源稿上测量后替换 status，不能声明“沿用所以已验证”。

固定中性变换以逻辑中心为约束：选定统一 scale s，镜像矩阵 F=diag(±1,1)，令世界根锚 `Rw = C + s*F*(R-C0)`；源点 q 的世界位置为 `Rw + s*F*(q-R)`。因此 collisionCenter 始终映到 C，脚底 R 始终映到 Rw。scale 默认 `entity.radius / collisionRadiusPx`，若按固定 referenceRadius 维持画面大小，则需 manifest 显式记录 visualScaleMode 并保证实际碰撞足迹提示仍用 entity.radius；不得随手放大整图以凑原画占屏比例。

局部动作 D(q,t) 围绕声明关节变形，满足 D(R,t)=R；身体 squash 不改变 C、半径和危险几何。完整刚性炮组不继承身体 squash 的非均匀缩放，只有其连接点跟随身体，再按刚性变换计算。whole-body presentationOffset 首轮为0；若后来增加纯后坐，必须同移全部身体/挂点、影子仍守地面根锚，并单列偏移限值及重叠观察，不写逻辑 x/y。原画箭头不进入帧。

图集 trim 只用于打包：每帧记录 sourceSize、trimRect和spriteSourceOffset；还原到源画布坐标再变换。所有 root/C0/M/P 基于完整源画布像素，不是图册页面/裁切后像素。禁止各帧重新居中；不能把轮廓 minX/minY 当根锚。

炮口：每塔提供炮架 pivot P、一个或多个 M、局部轴向、可用方向、允许角域和遮挡顺序。BURST 必须四个2×2出口；enemy:BASIC 固定五芽，tower:BASIC 则是两上芽＋后侧短叶/瓣＋两脚，不能因同名BASIC混用解剖锁。PLAYER 无炮口器官，只在独立发射参考点画效果。LEFT 先绕固定 root 镜像整套局部 rig（P与M一起），再在镜像后的 P 做剩余瞄准；SENTINEL 不照搬旧板“LEFT180”。UP 使用各身份批准投影/遮挡，不将整身倒转。UI文字/等级始终可读。

## 炮口与逻辑出生点的决策

首轮 `createProjectile(owner.x,owner.y,...)` 保持不变。弹体图的中心仍为当前 projectile.x/y，不对视觉弹体施加持久偏移；独立短促闪光挂 M，在发射时同步真实方向。不能用一次“从M飞到逻辑中心”的拖影反向误导运动，不让闪光盖住近距离敌人/命中提示。

用户已允许真实出生点适配，因此**不是永久禁止**。如样板显示中心出生无法接受，提交单独选择：具体M世界变换、旧中心→新M距离、屏障关系、每种塔/方向/升级级别和最近目标的逐步碰撞轨迹。实际 x/y/previousX/previousY 同步改到M会改变第一段 swept collision；从中心保留previous而x置M又会引入瞬间命中段。两者都不是无风险纯换皮，不能夹进当前三个元数据字段修改。

该备选必须覆盖：目标与塔重叠、目标夹在C与M之间、目标在M后/前、枪口跨墙/塔边界、穿透首目标顺序、BURST四孔与实际4/5弹、射程判定仍从owner中心、固定life导致末端可达范围偏移。记录最早命中帧/敌uid顺序、伤害/穿透剩余/slow/splash/总路程并与基线比较。主审选择后才改；若出现意外玩法差异则回到当前中心方案。

## 文件布局及单资源元数据

```text
src/view/art/characters/index.js + 内部实现与静态manifest
public/art/characters/v1/<group>/<id>/body.png、parts/*.png、clips/*.png、icon.svg
src/view/art/world/index.js + 内部实现与静态manifest
public/art/world/v1/background/、projectiles/、effects/、hazards/、icons/
public/art/ui/v1/ 仅UI自身界面装饰图标（非角色与world资源）
docs/art-implementation-2026-10-02/<owner>/submissions/rNN/
  editable/、manifest.json、previews/、anchor-audit.json、validation.json、packet.json
```

可编辑源为手工/程序可编辑 SVG、分层矢量或同等原生源；导出透明PNG用于Canvas，UI小图标可SVG。不允许从生成设定板裁一格去底后充资源，不把图中文字当UI文字。源可由代码绘制但必须能逐部件编辑、有独立器官/脸部锚/炮架定义，不能交一个不透明整图。每项标出批准参照来源及sha，生成工具不是“原画批准自动转生产批准”。

允许characters/world以预编译Path2D/贝塞尔数据直接绘制正式矢量资源，静态缓存可使用PNG；这与SVG源是等效可编辑生产路径。选此方式时仍交透明neutral导出、同一生产采样器生成的动作预览和完整manifest/测量，不强制每个复用状态位图化。禁止每帧编码SVG或重新构建复杂路径；加载API可返回已就绪路径资源，无外部图片也仍遵守ready/errors合同。

```json
{
  "schemaVersion":1,"artId":"tower:BASIC","version":"v1",
  "status":"produced_pending_review",
  "sourceSize":{"width":256,"height":256},
  "rootPx":[128,205],"collisionCenterPx":[128,136],"collisionRadiusPx":40,
  "referenceRuntimeRadius":14,"visualScaleMode":"runtime-radius",
  "anchorsMeasured":false,
  "parts":[],"muzzles":[],"directions":{},"clips":{},"actions":{},
  "icon":{"src":"art/characters/v1/tower/basic/icon.svg","width":64,"height":64},
  "sourceFile":"editable/tower/basic.svg","referenceSources":[]
}
```

上例数值仅展示字段，**不是可采用的已批准锚值**。实际交付不得保留 anchorsMeasured=false。parts 必填本身份真实器官/层级/parent/pivot（允许无炮但不能全部省略）。muzzles 为 `[{id,partId,positionPx:[x,y],axisRadians,angleMin,angleMax}]`；四孔四项。directions 记录 right/left/up 的镜像/遮挡/允许角度，PLAYER不要求炮架。clips 记录 frames/每帧duration/loop，以及 atlasRect/sourceOffset/sourceSize；actions 将本身份全部参考key映射到clip/pose/transform/overlay，并说明 archiveOnly 的历史项。

375 条必须全部有资源归属或明确复用/历史状态标记，不能用一个默认 fallback 把覆盖数凑齐。动作可用原地部件动画＋关键帧；不要求375套图。持续动作（MOVE、windup）必须可循环/按现有窗口缩放；真实瞬移直接切位置，不能动画插值出新的碰撞途径。新局/阶段打断后没有遗留循环。

## 生产验收材料

- 每身份 body-only 透明棋盘预览、1×实战尺寸预览、root/C/M/P叠图、逐帧根锚差和器官数量清单；包含 LEFT/UP/循环接缝。眼槽闭合不当作眼睛消失，PLAYER仍0眼0嘴、单叶。
- 每个rig可隐藏弹体/召唤/影子/状态而身体仍完整。身体资源不得烘焙弹体、落点、箭头、标签、召唤单位、危险盘。
- 每图集透明边缘/trim/sourceOffset检查；PNG解码尺寸、byte数、纹理估算width*height*4、加载失败预览与一份按文件SHA清单。单图集建议不超过2048×2048以便分批加载，超出需给实测理由，不在未测量时承诺内存/帧率。
- 九塔与PLAYER至少10种明确来源的独立弹体外观；运动规则仍只有既有basic/cannon/sniper及其参数。危险几何以真实type/label组合覆盖95技能，不为每技能重复图集。
- world背景是新制作的稀疏无缝资源或确定性世界坐标绘制；奶油底、无纹理噪声/深色网格，纹样弱于影子。装饰hash不得调用共享Math.random影响模拟。
- 薄荷资源色目标#A8D8BC/深绿边，深棕正文#4B281C；浅绿按钮深棕文字。不从master图的cyan示例覆盖文字规范。

资源生产合格后才进入接入验收。原画审批、资源审批、连续动画实测、桌面运行验收四个状态分别记录。
