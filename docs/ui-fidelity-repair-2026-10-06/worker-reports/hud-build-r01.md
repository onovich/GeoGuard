# HUD / 建造栏 r01：提交主审

2026-10-06，范围仅 GameHud.jsx、BuildBar.jsx、StatusBanner.jsx。不提交，不改逻辑、数据、renderer、资源或其他组件。

## 参考与实现

已阅读当日复诊、20项backlog、旧UI报告，实际 view_image 查看获批 DUI01/02/03 与 master density/twins r04。依据 UI color/type spec 与 desktop production-notes，使用奶油深棕、mint资金、coral生命；不照抄生成渐变、cyan或浅绿白字。

- VF09：单Boss头像跨两行，姓名完整不换行、HP单独整行；阶段/狂暴/P索引及动作/护卫右侧。双Boss独立四列姓名、头像、HP和阶段动作，每条独立。组标题不同于成员名时保留，避免幸存者丢组标题。完整对策保留。
- VF10：暂停采用新API stickerMd 16px/24，清除text-sm冲突；关闭教学 stickerSm 14px；拖建、资金不足14px。辅助等级/类型仍12px。
- VF03/16：140px卡、gap8、max920及native水平滚动保留；开局3卡容器宽452px，无空框。卡min-height148、居中名、64px角色、18px费用；不足用独立warning符号+局部coral。不disabled，不更改起拖和资格。
- VF17：浮层宽夹取360/栏宽/窗口、按卡中心定位，小尾精确连卡中心，整体pointer-events-none，scroll/拖中清除。
- VF18：教学WASD键帽、方向键与拖建文字，原一次关闭和mobile原提示保留；bottom206避开新的底栏，需实机核验。Banner改内容自适应宽、最大480、少量tone圆徽；保留waveMsg/topInset事件与数据。
- VF19：玩家HP10px、heart28px，HP数值16px；资金20px/gem28；时间14px/clock16维持次级，Boss条10px。

## 已运行验证

npm run check:architecture：11/11通过。npm run build：通过。共享基础组并行工作中，主审应在所有组停止后重测。仅开发者原本bundle大小、dynamic/static import和Browserslist提示，未新增测试失败。

本组未进行UI自动化、未生成实机截图或凭源码宣布美观通过。主审集中CUA验收，以下待观察后才能批准：960x720/1280x720/1440x900 DPR1/2、单Boss最长名称和长对策/双子/幸存者、开局三卡/九卡首末/native滚动、不足起拖/取消释放不扣费、hover/focus首末尾定位、教学关闭与可读性、普通/banner/Boss密集组合。

已保留全部原费用/等级/类型/间隔/summary/伤害/射程，原pointer/touch事件、原cancel整栏矩形上报。效果/UI单次关闭不影响engine。