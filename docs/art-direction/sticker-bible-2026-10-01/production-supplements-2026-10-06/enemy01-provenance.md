# FAST / TANK 正式生产补充来源

分类：**original-concept AI-edited-entire-frame**。不是旧原稿未修改切图，也不是局部像素编辑。

原板：docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/enemies/submissions/r02/images/01-fast-tank.png

原板SHA256：f82cdc95cf7a5c0ec11147847615e3752866ceff1e93c2651cbfcabf8e251d5f

编辑板：docs/art-direction/sticker-bible-2026-10-01/production-supplements-2026-10-06/enemy01-fast-tank-guides-clean.png

编辑板SHA256：2927dbcca0b7e532421cf5ac8b87a3689b66e5751c01b1ebc5d5715fd4ce6384

内置imagegen参照该原板清理跨身体中轴虚线、脚底基线、ROOT标记和全部文字；保持8个原有形象、每帧位置、比例、颜色、器官计数及动作意图。此前尝试3px局部替换形成竖色缝，已明确拒绝，不接入。整帧编辑候选已获主审逐板来源预检通过；不是全身份AI重绘通用批准。

生产从编辑板真实RGBA裁切，仅清除alpha<=12的近透明外部噪点，不绘制或重描任何形体。各帧root取靠近脚底的两条真实脚掌alpha>64区间中心的平均，基线取真实脚底最后一行；详见public/art/original/v1/characters/fast/source.json与tank/source.json。运行仅drawImage，四态整体采样不再整体压伸，固定脚水平中心。

真实运行及战斗动态仍待验，不以来源通过替代动画通过。
