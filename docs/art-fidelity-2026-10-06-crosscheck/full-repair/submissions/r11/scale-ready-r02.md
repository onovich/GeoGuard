# 世界尺度 r02 READY

基准正式scene-ui/master/submissions/r04/master-desktop-density-r04.png，已实际view_image通读。统一1280宽，原稿高度800.6，实际1280×801生产drawStickerScene模块保持1.25相机，同10塔/19敌/1英雄屏幕root分布。master-density-comparison.html给原图与实际上下对照，动态表测真实PNG alpha bounds宽高。

以整体基准建立共同源美术倍率1.65，塔以1.6为共同倍率、此前各atlas校准比例保留：英雄2.013、BASIC塔1.84、普通BASIC1.848；预期hero约40×74、BASIC塔约70、普通体约55。其它怪物/Boss/机制同1.65主次，九塔源分辨率补偿同组校准，非逐ID无依据放大。源脚root恒定，M/bounds/刚管同矩阵；核心半径/位置/实体数量/AI/数值不变。接地影改按真身体宽.76，不再以旧半径硬cap压成窄影；独立弹体/drop纯视觉同比1.6，逻辑半径/速度/命中不变。

源静态比例不重新重绘。近敌遮挡、射程与碰撞边界、密集玩法、真实镜头/整体UI、DPR2明确模拟仍开放；本包不以QA根点摆场声称这些已过。
