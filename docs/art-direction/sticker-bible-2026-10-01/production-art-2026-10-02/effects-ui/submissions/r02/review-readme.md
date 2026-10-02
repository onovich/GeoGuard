# effects-ui r02送审

入口：index.html。七张新板按B01至B07顺序展示；r01已过HIT/HUD只保留，不重复生成。production-split.json是完整映射权威，skill-map.md是95项简表；每项的geometryMappings包含真实primitive/label、sourceCall或机关后续触发，lifecycleByCell列出触发/停止条件。

本轮覆盖10来源弹体与flash、16状态/战场格、4危区家族、12独立机关/生成/退款反馈格、开始/结束、三奖励卡/替代修复/蓝图、暂停/状态/桌面手机提示/放置/建造状态。106我方＋77敌人＋192 Boss/机关参考映射完整，93默认＋2幸存技能逐项可查。H03是disk内装饰，H04是按真实端点构图的多线模板，不能把装饰环/十字当判定。

当前依赖为最终已书面通过friendly r03、enemies r02、bosses-mechanics r03。LEFT含P/M的整个rig镜像、UP已过构造来源由当前friendly合同权威控制；不采用旧r01任意360的简化投影解释。原上游身体和坐标只读，本组没有重绘或批准其他组身体。

主审聊天中的阶段意见：B01/B02/B03视觉通过；B04/B05构成和实体边界通过；B05白字浅绿按钮要求明确规格修订。本包ui-color-type-spec.md以深棕#4B281C覆盖浅色按钮字，给出建议字号下限。B06/B07尚待本次正式查看；全部r02整包状态保持submitted，阶段图像意见不冒充整包通过。

核对重点：M08只真实COURIER击破未逃退款，施法阶段不画+退款；M09只真实state.drops。BEACON现有尝试波与额外成功UID闪分开。WEB/ROOT和RETICLE的后续handler独立映射。OPEN全身倍率条件，不做腹核弱点。BURST四孔仍可五发；PLAYER没有炮/脸/肢体。当前玩家UI没有声音控件，也没有收费升级入口。U11滚动箭头只是原画说明，不增按钮。

图像均为内建image_gen设计板并已实际查看，非透明PNG生产资源、atlas、连续动画或实机截图。原画上示例数值和尺寸不表示小尺寸、设备布局、可读性或对比实测通过。verification.json记录文件、源数据、引用、索引脚本语法及BOM校验；未运行游戏构建或接入测试。

完成封包后只原子更新本组READY.json。r01不修改，r02封包后不修改；等待主审具体意见，返修另建revision。未改src、玩法参数、其他组文件、全局批准清单，未发送其他聊天消息、Git提交或部署。
