# 电脑端 delivery r02 覆盖准备

状态 preparation_only。仅本目录准备，不生成原画、不组装最终包、不发布新READY。现有delivery r01封包/READY保持原样。

读取依据：../../desktop-usability-review.md。新授权以电脑端原画优化为范围；手机暂缓，覆盖此前协调文件的手机要求在本轮的适用范围，不构成本轮阻塞。无游戏代码修改、资源接入或部署。

## 持久索引

- queue.json：UI r02、background r02、master r04的目标提交/主审/退回闭环及delivery最终授权。
- requirements.json：30项待关闭要求，拆自七类可用性缺口与布局、来源、审计边界。
- source-alignment.json：整体→精细UI/BG→最终桌面复合、鼠标交互/全解锁/密集状态/逻辑布局的待填结构。
- immutable-baseline.json：上一轮delivery r01的12文件与packet、审批、READY指纹，只读基线。
- audit-protocol.md：正式桌面列表、指纹/本地链接、返修及新revision协议。
- open-items.md：本轮所有待关闭项及提交依赖。

旧桌面视觉方向、开始/结束/暂停/奖励语义可保留，但旧母稿/六塔RAIL/九塔来源账本不自动关闭本轮高密度、全解锁底栏、鼠标同屏缺口。旧手机只保留历史链接，不能列本轮正式图或通过证据。

所有证据初始待填。依主审分别通知审批后只读校验并登记，不能仅由READY已出现推定通过。UI r02/BG r02/master r04全部正式通过且主审通知最终授权后才建立delivery/submissions/r02/，封存packet后原子更新READY，再停止等待主审。
## 背景r02依赖更新

主审reviews/background-r02.md正式accepted，范围仅背景原画与规范。READY→packet及10项封包SHA已核对，两正式板登记；稀疏不对称缺口斑替换规则椭圆，地面与root阴影分离。BG-01按背景主审关闭，BG-02/SEP-02保留联合复合待验证。新背景权威优先于UI上下文地面。UI/master/总图册审批与最终授权仍等待；未创建新packet或发布新READY。
## UI r02批准后的纯桌面图册草案

主审reviews/ui-r02.md正式接受三板与48项映射；DUI02选稿路径问题由edit4最终文件关闭。40项BG/UI封包文件与53条来源SHA一致，286个本地引用无缺失。index.html仅5张本轮获批细化板，目标最终7张（BG2/UI3/master2）；旧UI02开始/结束/暂停仅继承桌面A/B/C格，旧手机只有历史链接。旧母稿和RAIL只追溯，不充当高密度补证。

明确差异：已有title内容的控制锚点是设计目标，当前位置/延时由浏览器原生title决定；持续拖放状态章是表现目标，现行释放失败才浮字；原生水平滑块可鼠标拖动，不承诺源码不存在的滚轮转换。DUI02 B危险边界靠近底栏仍待最终master检查。

master r04两图已获主审生图授权，delivery最终组装授权仍未到达。无submissions/r02封包，delivery READY保持r01不可变。