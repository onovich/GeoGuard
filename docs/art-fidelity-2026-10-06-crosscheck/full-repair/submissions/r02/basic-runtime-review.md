# BASIC 原像素分层运行候选

状态：READY（代表身份分层运行预检），S2全身份未完成。需要主审真实BASIC塔四向/动作检查。

身体/五官、双脚、刚性炮筒全部来自正式 basic-fixed-root.png 下排分层参考原像素。basic-part-source-check.jpg 是来源联系页，parts-source.json记录坐标与SHA；body-part/foot-left-part/foot-right-part/launcher-part均真实alpha裁切，无路径绘画、无生成shape raster。shadow候选alpha算法过度删除，未采用（联系页影子为空，明确未通过）。

originalPixels.js采用drawImage采样这些真实分层；BASIC不再调用drawPlan。既有矩阵保留root/左右镜像/瞄准语义，不生成身体美术。双脚fixed，软身体只在自身固定root附近缩放，炮筒独立刚性矩阵；up方向旋转同一刚性源筒。保留原玩法出生点与核心规则，M位置仍由原锚点接口返回。本次头像改为已获批 neutral-repaired.png。

读取：characters/index.js loadCharacterArt真正Image.decode四个PNG并存储originalBodies；缺失不静默退回旧手绘BASIC，返回original-pixels-not-loaded。其它身份仍待迁移，明确kind=original-pixels-migration，不宣称所有身份原画化。

原图分层的身体轮廓/五官是批准板自身的分层参考，完整四帧图保留用于动作对照。当前采用分层变换保持刚管，四状态真实运动还待主审验收；图像缩放不等于逐帧原图采样，不能把它记作四帧均实际载入。

验证：生产build通过；art-baseline-contract/art-final-preparation/art-snapshot共13测试通过，未改逻辑。CUA本子会话环境不可用，等待主审集中真实运行取证。尚未覆盖其它47身份/全部95技能/粒子，不能关闭全范围清单。
