# SCOUT脚掌连续性数据返修 r04（待主审复审）

此前r03是已封只读拓扑审计，因此主审本次授权的数据返修另建r04。r02/r03 docs、全部public资源和共享rig/registry保持不变。本轮只改enemyRigData.js内SCOUT crouch/chase的long-leg-left、long-leg-right四条d字符串。

按主审实际审图后的指定配对，将每条variant路径的**原第2条C**在t=.5精确de Casteljau拆成两条C；从M C⁴ Z变成与neutral一致的M C⁵ Z。保留完整第1条腿前弧；第2/3条对应脚外沿/底；第4条脚内回弧；第5条腿后回髋。没有执行此前只读报告中C3配对建议。现共享generic不再需要对这四条路径按最长段拆分，也不会触发其5C↔4C特判；没有叠加shapeMorphs。

四条路径的129参数点精确对照误差为0；其余11身份深相等，SCOUT恢复这四条d后其余全部字段深相等。R=[128,236]、C=[128,141]、collisionRadius=95，器官、五官、joint与poseVariants未改。

使用当前共享rig.js原文的内存快照，注入本组数据执行实际sampler。采样attack 0/.125/.25/.375/.5/.625/.75/.875/1，真实chase选择器；crouch端点走真实squash选择器，未虚构其进度动画。代码SHA在validation.json。旧模块快照只用于同一共享sampler下比较修改前后端点，不改公共运行实现。

- [scout-attack-timeline.png](scout-attack-timeline.png)：实际查看九帧；.25/.75双脚仍是有珊瑚填充的脚掌，腿/脚没有退化为棕线。单体、单眼、双腿各一份，无alpha叠双身。
- [scout-endpoints.png](scout-endpoints.png)：实际查看neutral/crouch/chase；三端点PNG与改前逐字节相同。
- [split-proof.json](split-proof.json)：四条原曲/拆后曲与控制多边形。
- [validation.json](validation.json)：固定根/碰撞中心、足关节中点、alpha底边与脚掌填充证据。

三种端点足关节x平均值均128，attack全部采样也128；R与C不移动，Actor输入未改写。每足在y≥215区域的珊瑚填充至少267像素、宽至少10px，不能用仅有描边的腿线冒称脚掌存在。

**真实alpha并非全姿态同一底边：**neutral/crouch/chase的底边y=236/238/234，在本轮修改前后逐字节相同；attack九帧底边为236/235/233/233/234/233/233/235/236。这是保留原端点后的局部轮廓形变，并非整体平移。脚关节中点不等同于不对称像素质量中心。本包没有为了宣称底边零差而移动或重画批准端点。若主审还要求所有实际alpha底边完全相等，需要另行明确端点几何返修；本次不夹带该改变。

本次不自称SCOUT或其余六身份连续动画通过。资源造型沿用r02外部批准，SCOUT四条数据补段/九帧供主审复审后再由角色主会话重新汇总。
