# 电脑端持久验收与封包协议

写入仅delivery。所有已封存submissions不可变；不运行旧r01构建/封包脚本去覆盖历史。不跨会话发消息，缺口与依赖写队列，由主审转交。

## 入队与批准

读取各组READY，登记观察revision/READY SHA/packetPath。目标为UI r02、background r02、master r04；若返修产生新revision，保存原目标、退回记录与替代revision，经主审明确批准后采用新版本。逐项核对owner/revision/packetPath/files/images/requirements/openIssues/dependencies，路径规范化不得越过所属组。

READY仅表示提交。accepted权威来自reviews主审逐图记录，依赖有批准不等于当前图或总册批准。旧submitted/pending历史字段保持原样。所有退回事项在新revision对应主审结论下关闭，保留原记录及SHA；未关闭事项不得隐藏。

## 来源与单位

每个整体元素连接新精细UI/BG板格、最终桌面复合及文件/revision/SHA/主审。鼠标悬停、起拖、有效/无效/不足、回栏取消、双成员/长对策、1/2/3实际奖励及全解锁底栏有独立状态索引，不将互斥状态拼成同一战斗快照。

高密度快照登记真实波次、身份/变体、阶段、技能和owner；现有项目没有独立精英身份时注明，不创造新精英。screen/world/world-linked UI与规格注释分别登记，影子/弹体/资源/危区/身体独立归属。

logical_px设计尺寸/卡宽/间距/锚点/字号与image_pixel PNG尺寸分栏，数值附来源。world几何与运行字段沿真实合同；禁止由原画量测碰撞、挂点或逻辑尺寸。实测值无证据即null，runtimeValidated=false。

## 本轮正式图列表

以获批桌面UI r02/BG r02/master r04包的正式images清单建立列表，不预设图数。只读候选/退稿的prompt与生成历史可进入审计，但不进入正式画廊。历史母稿若为说明依赖需单独标历史，不能当作本轮补证通过。旧手机只有历史文本链接，不内嵌，不作为当前批准证据或缺口关闭依据。

新生效规格明确覆盖旧图冲突，并保留浅底深棕字#4B281C、mint菱形资源、全rig方向/固定root、准确危险几何和动态字段边界。HTML只展示实际生成PNG，不绘制或重组替代原画。

## 最终授权与封包

等待三组正式批准及主审最终授权，再建立submissions/r02。校验各文件/来源SHA、所有本地链接/图引用、完整要求/状态映射与审批历史；相对链接按封包文件自身位置重新解析。

packet.status=submitted，files采用相对delivery组路径与SHA256，images仅正式桌面图；coveredRequirements引用本轮索引，openIssues保留总图册等待主审。不自标accepted。封存后最后通过同文件系统临时READY→原子替换，更新delivery/READY.json；旧r01不覆盖。

总图册须主审独立批准；所有准备、完整性校验、上游接受都不代替此批准。提交后停止等主审。原画仍不是透明生产素材、分层源稿、动画/图集、代码接入、真实字体/鼠标触控/对比/设备/性能验证。