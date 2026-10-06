# UI 与尺度批次 READY（仍非最终）

真实生产页面可验HUD/建造栏/右键菜单；另desktop-lineup-runtime.html 实际drawStickerScene整调用链，可切HP0/11/50/100，等级1/4/5/8，塔/敌人/Boss同一1.25镜头。HP独立cap按目标height同倍率dx/dy，已修源角片被拉成箭头；动态HP fill/数值仍来自数据。world级别1–4原点，>4实际数字源keycap。

UI：BuildBar 卡片用已批准源card、拖拽状态源honey；tooltip尾用已批准源arrowDown而非CSS菱形；边溢出指示用源左右箭头，去掉渐变；UP+冗余标去除，真实Lv文本保留；lowFunds仅warning/动态可读文本不画红底块。HUD的HP/BossHP原B02皮肤、分隔源divider，StatusBanner去重复程序圆底；右键TowerContextMenu原面板及sage/honey按钮，操作保持。功能焦点仍保留。

世界展示倍数单独ORIGINAL_DISPLAY_SCALE，围绕原真实脚根变换：hero1.15、BASIC1.15、CANNON1.25、SNIPER1.7、RAPID/MORTAR1.35、FROST1.5、SENTINEL1.2、enemyBASIC1.12；其它身份1。同一变换作用身体、真实alpha bounds及sourceM，刚管相对body大小不变，footRoot不移动；不改任何collision/range/AI/逻辑位置，相机仍1.25。未以旧rig bounds伪证大小。

构建116模块通过（UI批次、尺度前后一致语法检查另已通过）。真正实战角色尺度/密度/动画与十源出射、95技能、首次解码/性能、DPR1/2多桌面尺寸仍未关闭；本包仅请求集中实机验收并继续独立收尾来源和映射。
