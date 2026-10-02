# FORTRESS 连续抬壳增量 r03

按 characters/submissions/r04/path-morph-contract.md 制作。bossRigDataA.js 仅在 fitRig 之后新增 FORTRESS 的 shapeMorphs['single-top-shell']；fromD 完全复制 r02 导出的闭壳路径，toD 用主审转达的同拓扑抬壳。两端均为拟合后256源坐标，命令序列 M/4C/Z，权重 sin²(π×progress)。未再次缩放 morph 坐标。

其余七个 rig 与 r02 源模块快照 deepEqual；FORTRESS 除 shapeMorphs 外全部数据也 deepEqual。柱、脸、眼、底座、两盾与两脚路径不变，R=[128,226]、C0=[128,177.6]、r0=92.4 不变。公共 rig.js 未由本组修改；只读其新采样器快照，以本组导入替换进行离线检查。r02 文档与封包保持原字节；r03 明确替代可变源模块以及 FORTRESS 的更新资源指纹，不重封 r02。

左右向分别采样 progress=0/.125/.25/.375/.5/.625/.75/.875/1：起点/终点命令参数与 closed 严格相等，中点与 toD 严格相等；18样本根锚残差为0、中心不变、脚矩阵不变、器官挂点不变、输入不变，透明帧边缘均为0 alpha。实际 radius=34 的图保持1×逻辑像素。

柱与壳、柱与底座使用同一身体矩阵。九进度采样的最小壳柱相交为0.220080076源像素；利用贝塞尔控制点凸包可界定整个 u∈[0,1]：壳下缘不低于 y=155.82、柱顶155.6，沿中心x128保底重叠0.22；底座上界≤185.52而柱底188.16，保底重叠2.64。描边重叠未计入这些正值。于是连接不仅在九张采样图上成立，整个连续权重区间也成立，公共身体矩阵保持该连接。

通过公共 drawPlan 对18帧进行 Canvas trace 计数：静态路径预编译后新增 Path2D=0，动态壳共72次三次贝塞尔 trace（18×4）。SVG和PNG均来自同一插值命令。已实际 view_image 查看 fortress-morph-contact-sheet.png 与 fortress-runtime-contact-sheet.png，抬升与回落连续，柱和奶油脸窗可辨，无器官复制、整体平移、外部效果或影子。

仅刷新 FORTRESS 自有 poses，新增 continuous/18组透明SVG/PNG和 morph 元数据；中性 source/body/icon 与其余七身份资源未由脚本重写。未改共享模块、registry、逻辑、依赖或 Git。完整实机公共播放、暂停/打断及最终主审验收仍待执行；本包是连续过渡的离线数据与资源证据，不自称整局通过。
