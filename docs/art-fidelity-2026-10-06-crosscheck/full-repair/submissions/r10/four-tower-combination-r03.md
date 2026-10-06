# 四塔组合返修 r03 · READY 静态运行复验

已逐图自看 four-pose-affine-selfcheck（离线真实 PNG 采样与模块矩阵自检，非浏览器实机证据）。四向/四姿态固定同尺度，所有身体与脚完整，无离体切口；FROST up 进一步埋入连接点，避免裁切后背座小尾外露。

实际浏览器验收入口为 four-tower-proportion-preview.html 与 r06 通用真实模块页；仍等待主审 CUA，不自行通过。

- RAPID/FROST/SENTINEL：源 crop 删除新增 AI 圆背座；采样 crop-origin 与 target 匹配，原有正向 offset 已移除。实际管像素在身体后绘，身体覆盖切口，保留可读的双管/槽/重口；源炮孔同矩阵。
- MORTAR：批准的连续圆肩层，118×118 刚杯目标，向身体内回收连接；恢复肩杯关系，无顶部软体缺口，无盖嘴。
- 脚部仍先绘/身体覆盖上切口，sole root 未移，刚管没有 soft scale。

RAIL 另包来源获准，正在进入方向帧；本报告不包含其运行通过。真实出生、首段轨迹、世界尺寸、95技能、UI/world残留与最终性能仍未验收。源码核心规则未改。
