# Delivery 文件与验收证据协议

所有delivery写入仅限本目录。其他工作组及reviews只读；不修改原画、历史packet、READY或审批记录。索引和模板属于准备文件，不能被当作提交包或通过证据。

## 来源对齐

每个整体元素使用稳定elementId，逐项记录master整体位置、background/ui精细板与具体格/命名区域、每幅最终复合位置及所用revision。文件、SHA256、packet和主审review链接必须同时保留。没有可证明的图格就标记待补，禁止仅按总数自动通过。

characterSources记录既有身份/action key、来源revision、身体或外部效果板/格与批准记录。48身份/375是历史完整基线；本轮画面展示子集应明确列出，不能声称本轮重绘375项。身体、弹体、召唤物、影子、状态的归属分开记录。

每个元素必填coordinateSpace（screen或world）及layer。图板格位置和画面中元素位置使用不同locator，禁止混写。若需要混合空间，拆为独立元素并建立关系。SENTINEL方向及浅底深字覆盖必须映射到具体受影响元素；图片冲突仍记录，不得隐藏。

## 布局与单位

桌面1440×900、手机390×844均为logical_px设计视口。bounds/anchor/字号/触控尺寸只能在来源提供时填写，evidenceType=design_proposal；图片像素尺寸另记image_pixel，不能由图片像素推断逻辑尺寸或运行期世界单位。world数值注明来源与单位；未知留null。

实测值只进入measuredValues并附measurementEvidence；无真实设备验证时runtimeValidated=false。图册保持“原画设计，未实机验证”说明。复杂战斗与手机遮挡记录主审视觉检查，不能改称性能/触控实测。

## 持久队列与审计

1. 只读扫描master/background/ui的READY.json。记录扫描时文件SHA、revision、packetPath、缺失与冲突；未出现READY仅为尚未提交。
2. READY必须指向同组submissions/rNN/packet.json；路径规范化后确认属于目标组，存在且revision/owner一致。
3. 校验files中每个相对组路径、真实文件SHA256（64位hex）、images所引用文件及prompt/生成记录。重复文件/身份映射、漏项、链接失效独立列出。
4. 审批权威为主审reviews；submitted/pending属于封包历史字段，不改写。登记每个图和要求的accepted / changes_requested / awaiting_dependency证据。review有歧义或没有逐图结论时待补，不推断已通过。
5. 退回按新revision及新review关闭，保留旧审查链。READY指向新版本不能自行证明旧问题已关闭。
6. 不跨会话发送消息；依赖/问题放本组记录或授权的后续packet，由主审扫描与转交。准备阶段不创建READY。

## 最终图册及封包

master r01、background、ui、master最终桌面/手机/复杂战斗复合全部有主审通过证据才允许最终组装。任何必需项未通过时保持finalAssemblyAllowed=false。

静态HTML只展示真实图像文件与来源、图格、分层、布局、覆盖、审批、生成记录和限制说明；不得用SVG/HTML/Canvas重绘、拼造替代原画。最终复合来自已审master生图，不能由delivery叠旧素材板替代。源稿、透明资源、连续帧、代码接入、设备与性能均不宣称完成。

最终包位于delivery/submissions/rNN/，packet遵守协调文件字段：files每条含相对delivery组路径及SHA256；images列图像引用；coveredRequirements列有证据的要求；openIssues/dependencies保留真实未闭环项。每个JSON/HTML/MD引用相对其自身文件位置解析，不沿用准备目录相对链接。

封存后不可修改。核验完整后先写同目录临时READY文件，再同文件系统原子替换delivery/READY.json，字段为revision/packetPath。最终提交后停止等待。delivery不得写accepted；总图册必须主审审查，不因上游通过而宣称最终完成。