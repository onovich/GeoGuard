# effects-ui r01 审查入口

本包为完整资源清单和两张内置imagegen样板。状态submitted，等待主审；不自标accepted。所有文件先齐备，再写packet及原子READY；本revision提交后不修改。

1. 先看 [inventory.md](inventory.md)：三种kind/十个发射来源、通用效果、危险区、召唤/状态/OPEN、地面/影子/等级、完整GameScreen UI功能及开发测试边界。
2. 看 [boss-effects.md](boss-effects.md)：15单Boss＋日月双体＝17运行期身体，95个标准遭遇／幸存独特技能；另列5个基础模板／自定义支持技能；全集100个处理来源。
3. 看 [dispatch-differences.md](dispatch-differences.md)：37个optimized handler，其中35个替代基础分支＋2个独奏；HIVE/机关/召唤/位移/数目差异逐项列出。
4. 实际查看 [vfx-projectile-flash-hit.png](vfx-projectile-flash-hit.png) 和 [hud-desktop-mobile.png](hud-desktop-mobile.png)。前者无body，后者仅UI中的三个常态塔卡小图参考，不能当身份生产母版。两图均有DESIGN SAMPLE标记，未来出图须重绘为分层独立源稿。
5. [design-contract.json](design-contract.json) 记录归属/锚点/生命周期语义，[boss-source-map.json](boss-source-map.json)、[runtime-catalog.json](runtime-catalog.json)、[source-fingerprints.json](source-fingerprints.json) 提供真实来源，完整提示词在 [prompts.md](prompts.md)。

自检只涵盖本包文件完整性、SHA256、UTF-8无BOM、清单handler覆盖和已生成原画目视检查，不是实机测试。不运行npm构建／游戏测试，不修改src、玩法参数、资源接入、其他组目录，不提交或部署。

可审结论：三种kind与10个来源分开；枪口M不迁移逻辑出生点；HIVE当前NEST→BASIC、summonSwarm→SHARD；COURIER即时退款不增拾取；BURST内部level3五发不增第五孔；危区warning→逻辑瞬间结算→cosmetic fade；塔上下文升级仅debug；普通玩家奖励强化只影响后续新建蓝图。

待主审决定：样板可否成为后续绘制规则；其他组三方独立效果需求何时统一移交。可继续核实作者库tailSweep名称存在但未找到处理分支，不凭名新增效果。声音控制仅有数据传递，没有当前玩家渲染入口，故样板未画；是否后续加入需另行授权UI范围。

本包完成后停下。不得在主审明确批准前批量生成全部效果或更改本revision。连续帧与数值挂点交给后续生产实现独立验收。
