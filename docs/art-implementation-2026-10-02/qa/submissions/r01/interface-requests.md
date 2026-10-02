# 集成适配请求：供主审审阅，QA 不写共享入口

下列是执行前契约请求，不是已存在接口。本轮停止在计划阶段。

|编号|owner|请求|缺失时处理|
|---|---|---|---|
|QA-I01|baseline / 主审|批准的不可变基线位置、hash manifest、能在 QA 许可输出目录运行的旧代码快照；现有测试/build日志必须含具体 source hash|当前源码哈希只能作观察；不能宣称 AI/数值前后相同。|
|QA-I02|integration / actors / effects|明确生产绘制导出、资源加载 readiness/error、逐 identity/action 的展示状态输入与映射、纯表现时钟；不写入引擎逻辑值|QA 独立页调用生产 renderer；动作不可精确触发则该条 blocked，不用伪造函数名。|
|QA-I03|actors / integration|九塔及全身份实际 root/pivot/muzzle/face/organ 坐标与空间、镜像/残余瞄准/压缩顺序、atlas trim offset；能读到 renderer 实际用的姿态/变换，而非另算装饰叠层|截图人工审图仍可做；数值根锚/挂点证明保留未运行。调试叠层必须与生产路径一致。|
|QA-I04|integration|实际游戏需要固定 seed、重置到批准 fixture、固定 dt/step、只读语义 snapshot、暂停/奖励/结束 UI 状态同步的开发专用机制（如已有则给入口）|真实 UI 手动沙盒复现仍有效但非逐帧确定；不能把独立 Canvas fixture 冒充实际 React 游戏全流程。共享 hook 修改归集成。|
|QA-I05|UI / integration|稳定可定位的真实交互控件及支持新 camera zoom 的点击到世界转换；hover/不足资金/九卡横滚实际实现契约|定位优先文本/role/DOM 实测；不借 QA 改 CSS。发现输入视觉不一致开 P1。|
|QA-I06|主审|主审已指定必测960×720、1280×720、1440×900；加测1920×1080及1440 DPR2；0.5 CSS px根锚建议容差、性能20%相对阈值与60s×3采样方法|阈值是QA提议，非既定批准规格。原始量测照录，未确认则不得按提议自行最终批准。|
|QA-I07|主审|后续输出目录及浏览器能力/故障注入可用性；批准 QA 自有 tests/art-*.test.js 与 scripts/art-validation/ 的实施时点|本轮所有游戏/浏览器检查 not_run；不安装依赖、不写 package、dist 或其他 owner 目录。|

95默认/幸存技能必须覆盖；另5个 legacy handlers 只作为现有开发界面兼容补测（hiveHeal、twinOrbit、twinBolt、twinSwap、dragonBreath）。tailSweep 在来源中标记无handler，不向默认技能范围虚增它。

请求不发跨线程工具消息，只通过本文件封包由主审轮询并分派。

主审补充已纳入：用户允许调整子弹生成位置。QA-I03需明确每种发射器采用保留逻辑起点或炮口适配，以及允许的边界变化；按计划C16专项回归，不把原点完全不变当硬性要求。
