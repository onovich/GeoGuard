# Delivery 准备记录

状态：preparation_only / awaiting_approved_sources。未提交、未发布READY、未生成最终HTML、未自审通过。

初始读取时仅协调文件存在，未找到预先提供的preparation.md。本文件是delivery按明确委托及coordination.md建立的准备索引，不能冒充主审额外要求。若主审随后提供完整清单，按新证据补充索引，不能声称此前已覆盖。

## 已建立文件

- requirements-index.json：35项要求，所有本轮证据初始为awaiting_evidence。
- source-alignment.json：整体元素→精细板/图格→最终复合，以及48身份/375来源基线和生效覆盖。
- audit-state.json：packet/READY队列、SHA、本地链接、退回闭环及阻塞项。
- file-protocol.md：文件、单位、证据、审批与封包规则。
- templates/：元素、布局、最终packet草案结构；模板不是提交包。

## 当前只读依据

- ../coordination.md
- ../../production-art-2026-10-02/final-acceptance.md
- ../../production-art-2026-10-02/integration/submissions/r02/coverage.json
- ../../production-art-2026-10-02/integration/submissions/r02/effective-specifications.md
- ../../production-art-2026-10-02/reviews/acceptance-standard.md

旧基线48身份、375唯一动作来源已获上一轮主审批准。本轮仍须独立完成master、background、ui和最终复合审批。旧规格可覆盖冲突简写，但不赋予任何本轮稿件通过状态。

## 等待条件

主审依持久提交机制转交下一阶段指令。当前不生成图、不制作替代原画、不修改其他目录、不跨会话消息、不提交部署。只有master、background、ui、最终复合全部有主审通过证据才组装最终包；图册自身仍待主审逐包验收。
## 母稿依赖更新：master r02

已只读核对READY→packet及10项SHA256，全部一致。主审reviews/master-r02.md明确批准桌面整体母稿，并关闭r01 FAST来源问题：替换为敌BASIC、移除速度线。批准范围是母稿及据此并行拆解背景/UI；不扩展为background/ui或最终复合通过。封包submitted/pending及历史依赖文字保持原样，审批权威另记主审记录。

图像1584×993 image_pixel与1440×900 logical_px设计目标已分栏；未据图片量测挂点或碰撞几何。来源为WAVE23 HIVE P2，线危区留待真实来源压力场景。逐元素/精细板格/复合映射仍为空待补，其他本轮要求保留awaiting_evidence。

当前仍preparation_only，finalAssemblyAllowed=false；未发布delivery READY，未组装最终HTML或最终包。
## 背景依赖更新：background r01

主审reviews/background-r01.md已逐图批准BG01及最终BG02。只读核验READY中的packet SHA、12项文件SHA，全部一致。正式画廊候选仅bg01-clean-background.png与bg02-ground-layers.png；iterations/bg02-first.png仅保留审计历史，禁止列为最终图板。

已登记三个world元素：奶油基底→BG02上排01，浅sage斑→上排02，短草→上排03；对应整体母稿地面语法及BG01干净上下文。BG02框、箭头、文字属于规格标注，不是screen玩家UI或world资产。位置为来源定义的语义/图格索引，不是像素实测。

UI仍待批准，最终复合尚未授权。背景批准不代表透明分层、无缝纹理、实际遮挡/设备/性能验证。当前仍preparation_only，未封最终包、未发布delivery READY。
## UI批准后画册草案

依据主审reviews/ui-r01.md，UI01/UI02/UI03三张正式板已登记；候选/退稿仅审计，不列最终图。现有6张正式来源，最终目标8张（母稿1＋最终复合2＋BG2＋UI3），其中母稿明确标记为阶段源稿。

index.html与gallery-manifest.json为未提交草案。build-draft.py仅只读上游并更新delivery草案，没有封包/发布READY功能。校验50个上游封包文件、118条来源指纹、345个本地引用，SHA失配与缺失链接均为0。JSON完整且UTF-8无BOM。来源映射已保留母稿8身份子集（其中SNIPER仅卡片）、九塔精确NEUTRAL账本、三地面格、四类UI面和七个world/screen接口；35项要求与49项UI逐格字段可查。

r02母稿/UI01背景被BG01/BG02覆盖；浅底深字、mint资源及UI03 sage #B6D4AE采用新规格。设计logical_px与PNG image_pixel分栏，实测为空。最终复合尚未批准，其图像和逐元素复合映射保持待填。delivery最终审查未完成，不自标accepted，不封最终READY。