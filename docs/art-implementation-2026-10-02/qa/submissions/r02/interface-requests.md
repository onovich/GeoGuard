# QA r02 接口/固定候选需求

仅由主审分派。QA不改src，也不联系worker。

|ID|owner|需求及理由|
|---|---|---|
|QA-I02|characters / integration|375 reference action→实际Actor/Frame输入（或能独立导出这些DTO的生产采样器）及manifest动作项的准确解释。目前统一API pose没有SQUASH/STRETCH枚举；不能由QA把同一neutral随机贴到这些key上。action-samples.json已准备375条，actor/frame为null的条目严格pending。|
|QA-I03|characters|样板及后续全量封包实际manifest/源稿/anchor测量、poseProgress/poseTime控制点、允许残余瞄准角、器官与父级。QA将按独立图审与同生产矩阵输出交叉检查；schema存在不替代图像检查。|
|QA-I04|integration|需要可复现的真实游戏定seed、step/reset、只读语义snapshot/事件接口时，仅开发环境提供，不能引入玩法字段或监听器副作用。现有试玩数据已足够验证基础鼠标金额/塔数/暂停；不足以验证每帧375动作、命中归因或注入已批准高密度状态。|
|QA-I08|主审|提供固定候选快照/封包SHA与样板接受记录。已中止滚动候选结论；不以正在写的文件重复制造无效性能或行为证据。|
|QA-B001|integration / 主审|基线双子Canvas缺dist声明，证据在issues.json。修复是否纳入本阶段由主审分派；QA只复验。|

首轮已经明确保留中心出生；仅sourceArtId/sourceUid/shotIndex可从行为快照排除。可选onProjectileHit通知按批准合同检查不改变原命中顺序/数值/RNG。真实炮口出生是未来明确批准的例外，用r01 C16专项，不自动放宽当前零逻辑差分要求。
