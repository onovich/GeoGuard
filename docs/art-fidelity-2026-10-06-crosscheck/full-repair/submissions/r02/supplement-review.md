# S1 缺口补制候选预检

状态：READY，仅请求六个新制图标来源验收，不宣称完整S1完成。尚未接入新制六图标。

## 来源分类

ui-supplement-new.png 为内置 imagegen 参照正式 B07/B06 生成的全新补充图标板，不是旧原稿切片。ui-supplement-flat.png 为其再次编辑结果；剔除高光并请求平色、去光晕。实际 alpha 合成 ui-supplement-alpha-check.jpg 证明背景透明，PNG 透明区RGB有棕色但alpha为0；不可凭view_image透明区RGB判定有发光。

六个真实裁切文件位于 public/art/original/v1/supplement/，独立manifest含新制板SHA/crop/alphaTrim/运行URL。小尺寸24/40/64像素联系页 ui-supplement-small-check.jpg，钟表/Boss/阶段/暂停/声音/静音可辨。

## Prompt 与执行

工具：内置 image_gen，transparent_background=true，两次。首次输入角色为style reference：正式 production-art-2026-10-02/effects-ui/submissions/r02/b07-controls-placement.png 与 b06-rewards-blueprints.png。

首次要求新制两行三列六图标，分别cream钟表、coral软角Boss脸、honey阶段菱形、暂停两条、音量扬声器、静音扬声器加coral叉。完整形体、无字、真实透明、暖棕描边、24px可辨。第二次编辑只去全部光晕/阴影/高光并要求平色，保存为flat版本；没有使用程序路径绘制。

## 其它在制状态

已批准原图候选接入 Button/Panel/14种 StickerSymbol，build通过。开始按钮第二外环来自既有 focus-visible 键盘焦点样式和 useModalFocus 自动聚焦；Button 没有新增装饰外环或shadow，该功能焦点保留。面板旧shadow仍待整体皮肤整理，封面CSS分隔线尚待来源替换。

BASIC 四帧裁切显示辅助ROOT白圈侵入底描边。内置imagegen已生成 basic-ai-clean.png，但模型对整套轮廓有所重采样，不能直接称局部修复并接入。后续仅取被辅助线覆盖的局部像素修补、保持其它原画像素，提交原图与修复对照后再接身体。当前身体运行仍旧资产，不虚报完成。
