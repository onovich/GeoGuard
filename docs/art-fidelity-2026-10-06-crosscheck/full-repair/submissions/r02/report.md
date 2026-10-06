# S1 r02 来源皮肤返修预检

状态：READY（来源候选预检），不是完整 S1 接入通过；产品界面尚未批量覆盖。

## 返修
- 面板改用正式 B06 中间奖励卡的原始干净圆角边框，不再使用带装饰/底部横带的 B07 暂停框。panel/card 同源。中心与延伸边采用原图无字像素，全部坐标与源 SHA 见 source-manifest.json。
- keycap 改取 B07 上方向键边框；九宫格延伸区域避开印刷箭头。动态文字预览的实际边框由 20px 改为 9px，恢复中心空间。
- close 收紧下沿并过滤面积小于40的孤立像素组件，红色外物已消失；主红圆、白叉及原描边保留。
- 人工逐图查看 panel/keycap/close，另外对 panel/card/keycap 完成奶油与深灰两底九宫格像素展开检查。无旧字或宽填色横带；原图底边的极细浅描边仍可见，没有擅自删除原描边。

## 验证与界限
- skin-expansion-pixel-check.png 是确定性 Pillow 九宫格展开检验，不冒称真实游戏截图。
- skin-preview.html 是实际 CSS border-image 预览，待主审真实浏览器验收，URL /docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r02/skin-preview.html。
- clock/root-shadow 无可靠清洁来源，已从候选移除，待正式补制；当前 22 个候选不能视作全通过。
- 处理分类：原图裁切/外连接背景 alpha 分离；九宫格为原像素重排及边采样。没有 SVG 栅格化或程序重绘。
- 接口和游戏规则未改，运行产品暂未载入这些候选。主审通过后接入，并补运行尺寸与来源清单。