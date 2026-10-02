# 敌人12身份：来源勘察 r01

2026-10-02。owner：enemy-batch。此包只提交来源核实、实际看图记录与逐身份轮廓/部件构造方案；尚未制作生产rig、透明资源或连续动作。基线23ce1a3来自主审派发，未执行Git操作。

身份：FAST、TANK、SPLINTER、SHIELD、MEDIC、BOMBER、JAMMER、PHASE、BURROWER、BEACON、SCOUT、SIEGE。共67个批准状态key，48个唯一身体概念格。BASIC、SHARD及样板HIVE不在本组实施范围。

- [逐身份构造](construction-plan.md)：独立轮廓、层级、连接、状态差异及需合同支持的局部动作。
- [来源与看图事实](sources.json)：7张最终身体板、1张关系板、1张批准桌面联合图，逐张view_image实际查看；身体板SHA与production-map一致。
- [67状态来源](actions.json)：精确继承最终bodySources，保留行列、格名、复用方式和外部审批证据；不是像素裁切坐标。
- [器官锁](anatomy.json)：12身份原始锁与最终合同部件、根锚语义。
- [核验](verification.json)：覆盖、文件SHA、源码观察边界与未完成项。

批准依据为production-art reviews/enemies-r01.md、enemies-r02.md及integration-r02.md；上游JSON中submitted/pending等历史字段不表示当前未批准，也不在本包改写。scene-ui按desktop-final-acceptance.md与reviews/master-r04.md；联合图只定风格与密度，角色精细身体以最终bodySources和anatomy-lock为准。

本包不批准自己的资源，不改src/public或共享registry/manifest，不安装依赖，不改逻辑。等待主审批准样板并派发分组新文件与rig数据合同后进入制作。源稿须逐部件可编辑；不得裁切设定板作为资源。
