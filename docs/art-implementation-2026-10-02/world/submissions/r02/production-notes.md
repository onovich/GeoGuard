# World r02：真实生产模块样板

状态 ready_for_review，资源/代码样板待主审验收；没有自行批准、Git、引擎修改或跨 owner 写入。依据已通过world r01方案与integration r01合同，正式基线为23ce1a33d0a72674286d67ba80c8f7b1260153e2。此次只写 src/view/art/world/**、public/art/world/**、world/submissions/r02 和最后的world READY指针。

## 本轮实际交付

统一API八项全部实现；ES modules在无window/document/Image的Node环境可import。loadWorldArt延迟一次预编译Path2D，支持已中止signal返回failed；无图片下载/解码，assets为本地可编辑矢量路径。baseUrl参数兼容合同，无网络资源时不消费它；manifest的审阅PNG地址为相对部署根的art/world/v1/...，不以/art硬编码运行请求。现存路径资源不依赖公开PNG，PNG是同一runtime采样器的透明neutral导出。

- world背景：奶油#FFF9EF，两个不对称钝缺口路径，弱sage/骨色淡斑与稀疏三短草；360×225世界cell、deterministic hash，不用共享Math.random。跨负坐标cell唯一归属；绘制范围包含邻区图形外伸，使用frame.camera实际shake后的值，ctx不重复做camera/DPR。
- 弹体：hero:PLAYER＋九tower来源，B01/P01–P10的种籽/圆球/细尖梭/双色BURST/冰蓝/深sage身份与色阶；每个只读实际radius、velocity、previous坐标。未知旧来源按kind通用外观，不按color猜身份。CANNON/MORTAR仍cannon直线，没有轨迹插值、出生位移或新数值。
- 独立flash/hit/defeat/成功召唤/分裂/退款：消费真实feedback DTO，shot使用传入anchors.muzzles，shotIndex%实际四口使第5弹复用已有出口。hit三家族、已有particles、impactWave包括四专题style；success必须有实际childKeys、退款必须有正amount，不画拾取或发钱。生命周期优先消费sidecar给的maxLife/alpha，只衰减一次，暂停仅消费frame.time不自推进。
- 危险：fill与boundary分离；完整实心area与有限round-cap胶囊line；边界描线内缩半笔宽，外界精确到radius/width，紧迫度只改变透明度/dash。零长度line退化圆；timer<=0不画危险边界，淡出只画已有impactWave。WEB根网都裁在真实圆盘内；ROOT已按集成新增的真实mechanicKind=root辨识，不依poison猜身份。
- overlay：固定anchors.root软影、shield/slow/frozen/armor/phase/burrow/hit射线/intro/狂暴。OPEN按anchors.bounds整个身体包络画完整蜂蜜外置轮廓与弱全身亮度，不是双侧腹核弱点；实际缺bounds时回退整个碰撞圆包络，不新增判定。HP/文字/等级交集成；没有复制角色身体。
- links消费实际from/to和data.type，ROOT双细sage曲线，SEAL/RETICLE/windup目标线；placement只范围/碰撞足迹/check或cross，无ghost身体、提示文案或新建造规则。真正drops才画薄荷菱形，不改拾取半径/金钱。

34项neutral导出：10弹体、10来源flash、drop、shadow、3 hit、4 feedback、ground、area/WEB/ROOT/line。除ground奶油底外为透明PNG。所有角色身体、机关本体、召唤单位、血条/等级都不在这些资源里。编译矢量source在src目录，封包editable/world保存此次代码副本；manifest记录全套上游源SHA。每个弹体neutral为64×64中心[32,32]，来源命中族和真实radius缩放已登记；flash根按采样器[16,32]左后挂点导出，无按可见bounds自动居中。

## 三张实际PNG预览

- background-production.png：1440×900，真实drawWorldBackground；非有限无缝tile方案，正式运行仍确定性绘制。
- projectiles-production.png：10来源，4×放大弹体、2×flash及1×实际逻辑像素；真实drawWorldItem，没有另绘示意素材。
- hazards-overlays-production.png：真实area/line/WEB/ROOT、独立状态与反馈/placement。图中WEB/ROOT统一radius65仅为看清绘制的DTO样本，不改运行WEB52/ROOT44+radiusStep；文案明确sample。所有状态槽与事件是独立函数样本，不是可共存的游戏截图。

三张均实际view_image查看。主审预审要求已落实：ROOT根网消费真实kind；OPEN由左右括号改成完整身体bounds外置包络。后续正式视觉审阅由主审给决定。

## 验证事实与限制

verify-production.mjs通过：8导出、10不同弹体PNG/3 kind、29次deep-frozen DTO绘制、保存恢复matrix/alpha/dash/shadow与实际paint style、禁止共享RNG、零长/斜线胶囊与圆盘fill+boundary共10,695个非零像素的边界检查、四口第5发复用、无childKeys不画成功效果、abort返回failed。

负坐标移动15px：背景重复同位渲染PNG完全相同；world primitive坐标及变换记录完全相同。462,000个重叠channel比较中88个native antialias边缘值有差、最大4/255，单列如实记录，不是位置漂移或模拟数值容差。native Canvas的fillStyle/strokeStyle JS getter在restore后保留旧赋值字符串，因此验证实际恢复后的paint像素，不用错误getter结果冒充Canvas状态泄漏。PNG验证是原生Canvas采样，不是浏览器/可玩联调/95技能执行/帧率验收。

本轮npm run build尝试失败：另一owner的characters/index.js尚无法解析./manifest.js。world模块所有import、loader和直接Canvas执行通过；没有替对方创建文件或绕过失败。全项目build由集成/QA在各模块齐备后重跑。

## 精确未接入/后续项目

1. 用户完整可玩替换仍须集成实际renderer/hook接线、角色资源、UI与QA联合场景验收；本包不是完整工程完成。
2. sourceArtId、shot/hit/source event数据与measured muzzle/bounds由集成/角色负责。已读当前presentationRuntime：ROOT mechanicKind与links data.type已匹配；目前captureHit若未补真实投射物来源，则只能generic basic命中，不宣称来源3类命中已实机完成。
3. S04 JAM绘制原语支持states.jammed，但已读当前Actor DTO还未传该资格；MEDIC healAura和BOMBER fuse资格装饰还没有DTO字段/调用。本轮不从artId推断伤害/范围，不伪造hazard。下一轮需主审协调纯显示资格字段，才标这些可运行覆盖。
4. S08 body alpha mask属于角色身体绘制；world仅外置hit rays。S12等级/S14 HP不属world API，集成继续负责标签；S13旧椭圆地表被BG r02新地面替代。
5. 95技能coverage是上游逐项到绘制原语/实际事件的归属表；真实技能激活/源清理/失败生成/owner死亡余波验证待G2/G3/G5。所有新增帧只消费DTO，不产生逻辑实体、伤害、金钱或射击次数。
6. G1物体1×辨识、拥挤运行危边不被身体遮住、实际muzzle/影子位置、浏览器DPR/resize/性能待集成QA实测。已通过资源以后保留；返修另建revision。
