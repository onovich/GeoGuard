# 模块 API v1（待基线与主审放行后实现）

这里定义实现接口，不是已存在的模块。全部 ES modules；不加依赖。worker 在自己的 index.js 提前提供这些导出，具体内部文件可自由拆分。不得跨所有权目录改文件。图集/资源清单不得由一个 worker 覆盖其他 worker 的输出。

## 字段和通用语义

集成创建 `src/view/art/contracts.js` 与 `src/view/art/integration/`，记录 schemaVersion=1 及 DTO 校验。worker 可独立按本合同实现，不等待共享文件。依赖单向：hooks/renderer → integration adapter → characters/world；UI → characters 的静态 icon 接口。characters/world 不互相 import、不导入 hook/UI；engine 不导入任何 view 模块。

```js
// 所有坐标除 manifest source pixel 外均为世界逻辑单位；时间为秒。
// draw 中 ctx 已有 DPR 与 camera transform。不得再次应用 DPR/camera。
Frame = { schemaVersion: 1, epoch, time, dt, paused, viewport: {width,height,dpr},
  camera: {x,y}, quality: 'full'|'reduced' };
Actor = { key, artId, domain: 'hero'|'tower'|'enemy'|'boss'|'mechanic',
  x,y,radius, referenceRadius, facing:'right'|'left'|'up', aimAngle,
  pose:'neutral'|'move'|'attack'|'windup'|'recover'|'intro'|'trigger'|'broken'|'fade',
  poseTime, poseProgress, movementSpeed, alpha,
  level, hp,maxHp, shield,maxShield, hitFlash,
  states:{frozen,slowed,phased,burrowed,armored,open,partnerFallen},
  boss:{phaseIndex,phaseCount,castAbility,actionMode,actionTimer,windupDuration},
  mechanic:{kind,timer,life,targetKey,parentKey,cargo},
  presentationOffset:{x:0,y:0} };
// boss/mechanic 可为 null；level 默认为0，progress限0..1，非适用字段给安全缺省。
// time/dt 从 gameTime 差分，暂停 dt=0。Actor 无可调用方法、无原始实体引用。
AssetLoadResult = {status:'ready'|'partial'|'failed', assets, errors: [{url,reason}]};
DrawResult = {drawn: boolean, reason?: 'missing'|'unsupported'|'not-ready'};
```

取向由集成从真实 shot velocity/实际位移/locked target 推导，只更新表现；塔没有新目标时保持上次朝向。aimAngle 是世界 +X 为0、Canvas y向下的弧度。正上为-π/2。body 不随 aimAngle 整体360度旋转；取向选择与炮组允许角域由角色 manifest 负责。上下角度超出已生产范围时使用最近合法 rig 投影加独立发射效果，不改变弹道。

## characters/index.js

```js
export const CHARACTER_ART_SCHEMA_VERSION = 1;
export const characterManifest; // 静态可序列化，48个 artId
export function resolveCharacterArtId({domain,id,isBoss,twinRole,mechanicKind});
// unknown => null; hero => hero:PLAYER; mechanic优先；双子优先；只剥离 _T[123]
export function getCharacterIcon(artId); // {src,width,height,alt} | null；同步、无DOM/解码
export async function loadCharacterArt({baseUrl, signal} = {}); // AssetLoadResult
export function drawCharacter(ctx, actor, frame, assets); // DrawResult，仅身体/附属部件
export function getCharacterAnchors(actor, frame); // 与draw使用同一pose/rig矩阵
// {root:{x,y}, collisionCenter:{x,y}, muzzles:[{id,x,y,axisAngle}],
//  parts:{[partId]:{x,y,angle}}, bounds:{x,y,width,height}}
```

drawn=false 时 renderer 执行该实体的旧几何回退，不能同时画双身体；不允许函数内部对 gameplay state 取全局引用。根锚影子、血条、状态和弹体都不是 drawCharacter 的职责。getCharacterAnchors 在资源尚未加载时也可从静态 manifest 得到安全锚；未知 artId 返回 null，不能 NaN。getCharacterIcon 的 src 由 manifest 构造，UI 不复制 URI 常量；图标和身体共用解剖来源但图标是独立导出。

manifest 资源相对地址以 `import.meta.env.BASE_URL` 为根；例如 `art/characters/v1/tower/basic/icon.svg`。Vite 子路径部署不可硬编码站点 `/art`。`baseUrl` 只用于测试或部署前缀，由集成传入。模块 import 阶段不访问 window/document/Image，Node 验证器可以加载静态 manifest。

## world/index.js

```js
export const WORLD_ART_SCHEMA_VERSION = 1;
export const worldManifest;
export async function loadWorldArt({baseUrl, signal} = {}); // AssetLoadResult
export function drawWorldBackground(ctx, frame, assets); // world viewport范围稀疏纹样
export function drawWorldItem(ctx, item, frame, assets); // DrawResult
export function drawHazard(ctx, hazard, frame, assets, pass); // pass='fill'|'boundary'
export function drawActorOverlay(ctx, actor, anchors, frame, assets, pass);
// pass='shadow'|'status'；不包含HP/文字/等级（集成沿用并改样式）
export function drawPlacement(ctx, placement, frame, assets); // 范围/足迹/状态章，无身体
```

```js
WorldItem = {key,kind:'projectile'|'drop'|'particle'|'impactWave'|'feedback'|'link',
  x,y,x2,y2,radius,angle,alpha,color,style,life,maxLife,
  sourceArtId,sourceKey,shotIndex,anchors, data};
// data仅包括对应只读副本：弹体vx/vy及kind；波growth/maxRadius/dash/spokes等；
// feedback.type为shot/hit/spawn/defeat/refund；link.from/to是实际存在端点。
Hazard = {key,type:'area'|'line',x,y,x2,y2,radius,width,timer,maxTimer,
  pulsesRemaining,pulseInterval,radiusStep,terrain,label,color,ownerKey,ownerMechanicKey};
Placement = {x,y,radius,range,canPlace,invalidReason,artId,alpha};
```

WorldItem data 允许添加纯显示字段，schemaVersion 不变时旧实现忽略未知字段。禁止包含 damageTarget/spawn/update 等函数。field 不适用可省略；没有来源的旧存量弹体走 kind 的通用 fallback，不能按 color 假定塔身份。角色 muzzle anchors 由集成传给 world，world 不反向依赖角色内部层级。

所有画法只消费 DTO。区域 radius 不随装饰缩放；线形 width 是逻辑半宽（视觉完整条带宽 2*width，端帽半径width）。轨迹 angle=atan2(vy,vx)。MORTAR 当前仍是直线逻辑弹，不实现弹道抛物线/延迟落地。装饰不得暗示另一个实际危险区。

## 弹体最小来源扩展（集成所有权）

第一处可申请解除文件级冻结的 engine 文件是 combatOffenseRuntime.js，且仅此表现元数据补充：

```js
// createProjectile 返回对象追加三字段；extras未提供时为null/null/0。
sourceArtId: extras.sourceArtId ?? null,
sourceUid: extras.sourceUid ?? null,
shotIndex: extras.shotIndex ?? 0,
// player extras: sourceArtId:'hero:PLAYER', sourceUid:'player', shotIndex:0
// tower extras: sourceArtId:`tower:${tower.id}`, sourceUid:tower.uid, shotIndex:index
```

只追加上述字段，不改 createProjectile 位置/速度/伤害/寿命/碰撞/顺序，不插入随机数、不改变 target/burstCount/spread。hook 在 offense 后捕获追加对象，写外部表现 WeakMap，不需添加行为 callback。用 `epoch/tower/uid` 或 `epoch/hero/player` 还原 sourceKey。BURST 第5枚若实际升级产生，可用 shotIndex%4 选视觉炮口重复闪光，不能加第5孔或截断弹数。只同意原数值发射事件附表现来源，不允许 world worker 自行更改 engine。

world 提案中的 appearanceSource/ownerUid 对应统一 `sourceArtId/sourceUid`；不再添加同义字段。shotEventId 在sidecar内分配，不写state。shot捕获必须位于offense返回后、同step碰撞更新之前，不能用帧末差集；因此同step出生即命中的弹体也有真实shot事件。

第二处最小表现扩展为 `combatFrameRuntime.js` 的 `updateProjectileRuntime` 入参追加可选 `onProjectileHit`。仅在原 `isLineHazardHit` 成功分支、原 `damageEnemy(enemy, projectile.damage)` 后通知 `onProjectileHit?.({projectile,enemy,x:projectile.x,y:projectile.y})`，原后续hitFlash/粒子/减速/溅射/穿透/删除顺序原样保持。这是已确定命中的观察通知，不改变条件或重复调用damageEnemy。hook传入捕获异常的无副作用函数，仅同步复制源身份、命中点、敌key、kind/slow/splash等已有值，渲染稍后消费。回调不得写参数、读RNG、抛出中断逻辑；未传回调完全沿用原行为。溅射次级伤害沿用现有impactWave，不伪造第二枚弹体命中。

统一表现事件 DTO：`{eventId,epoch,time,type,sourceArtId,sourceKey,targetKey,position:{x,y},angle,shotIndex,projectileKind,childKeys,amount}`。type仅shot/hit/defeat/summon-success/split-success/refund，非适用字段省略。shot/hit有真实来源；summon-success/split-success只列实际新增childKeys；refund是settle前后真实正金额且已确认COURIER未escaped；defeat附最后Actor副本。事件创建在集成sidecar，不注册world callback到引擎。world收到WorldItem kind=feedback，data为该事件的冻结副本。

## 玩家 UI

保留现有组件默认 export 和 props。UI 可新增 `PauseOverlay.jsx`：

```jsx
export default function PauseOverlay({visible,onResume}) { /* ... */ }
// GameScreen: visible={paused && gameState==='PLAYING' && !rewardState.active}
// onResume={togglePause}; 是否显示由screen决定，不重复推导游戏状态。
```

GameHud/BuildBar/OverlayScreen/StatusBanner/TowerContextMenu/WaveRewardOverlay 只用已有 props。BuildBar 保留 setBuildBarRect、拖放、contextmenu、overflow 通路。UI不得 import engine/hooks；图片解析可 import characters 静态 icon API。debug 组件不切换到新玩家 tokens；shared ui.jsx 现有 variant 保持兼容，新增 sticker variant 给玩家调用。暂停事件仍由当前 togglePause/Esc/blur 实现。

允许以下仅表现的向后兼容props增量，由集成接线：hook在 `buildBossHudRuntime` 返回后按member.id匹配当前boss.uid，给成员副本补 `artId`，不改bossHudRuntime.js；UI用member.artId取头像，缺失时文字fallback。当前HUD成员只有hpRatio，不新增猜测hp/maxHp文字。`GameHud` 可接 `onLayout({bottom})`，UI用ResizeObserver报告实际HUD+Boss容器屏幕下沿；GameScreen维护独立layout state，向 `StatusBanner` 传可选 `topInset=bottom+8`。状态不进game state、不参与碰撞；未提供回调/偏移保留现有兼容行为。UI负责观测，集成负责两组件连线；不依固定13%位置推断不会重叠。

现有TowerContextMenu仅debug入口，本轮保持可用即可，不新增玩家菜单/卖塔功能。本r01不引入camera zoom，screen↔world仍现有1:1逻辑像素；DPR不等于zoom。若后续主审批准zoom，集成同时负责toWorldPoint与绘制逆变换，不能只放大图像。

## 加载、失败和重置

加载从 hook effect 发起一次，render 不创建 Image/Promise、不 fetch。decode失败返回 partial及列表；无图片时可先用旧几何，玩法不等待网络。manifest/file命名带版本，UI icon有文字/几何 fallback。load函数支持 AbortSignal，卸载取消后不更新 React state。新局清sidecar，不重复解码已缓存图集；动画按游戏时钟而不是 Date.now/random。表现异常以有限一次诊断+旧几何回退，不阻断 update/输入；不得静默把资源失败当完整替换验收通过。
