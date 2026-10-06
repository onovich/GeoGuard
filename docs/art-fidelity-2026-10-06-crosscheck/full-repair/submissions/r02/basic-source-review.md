# BASIC 原图四关键帧局部辅助线修复预检

状态：READY（来源帧候选，未接运行身体）。主审查看 basic-local-repair-check.jpg。原始透明裁切仍保留 basic-frame-check.png，AI整板 basic-ai-clean.png 仅作为局部像素修复输入，不将全板重采样角色接入。

实际候选 public/art/original/v1/characters/basic/*-repaired.png，每帧由原始BASIC板裁切，外连接纸背景alpha分离，针对ROOT辅助线做明确局部矩形alpha排除；原稿ROOT白圈侵入底描边处，仅替换12×7像素区域为对齐后的AI输出。区域外像素与原始裁切严格相同。source-repaired.json记录旧源SHA/crop/alpha排除矩形、AI输出SHA、局部编辑矩形及运行URL/SHA。分类 original-source crop + local AI-edit，绝不称纯原图裁切。

AI工具为内置imagegen透明编辑。编辑目标是正式 basic-fixed-root.png，prompt指定保留四姿态、单眼/笑嘴/两顶芽/侧芽/双脚/刚性炮筒，去全部字/ROOT/底线/下排教程，仅恢复被辅助标记遮挡的描边。模型实际重采样了其它轮廓，故未整体采用，仅采样上述小区域。不是程序路径补描边。

root坐标来自原图每格ROOT标记，随裁切变为 neutral[138,290]、squash[144,210]、stretch[111,325]、attack[132,280]。运行时使用这些局部锚点定位同一个世界root；不能按外接框中心直接替换造成水平位移。身体图像不含独立子弹或阴影，没有标题/锚点/别的角色。

边界：这四张为整合身体关键帧，目前炮口已含于身体帧，动态刚管瞄准尚需原图分层。四帧来源预检不等于动画/炮口最终验收，不能据此关闭S2。
