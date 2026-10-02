# UI r02 桌面分板与只读核功能

2026-10-02，Asia/Shanghai。仅电脑端原画；手机暂缓。r01等已封存包不可变；仅写本ui/r02与最后原子更新本组READY。使用imagegen内置工具，引用和每次结果均view_image。状态仅submitted，由主审独占审批。

依据 desktop-usability-review.md 与正式 reviews/ui-r01.md，先核源码再分三板，避免复制开始/结束/暂停及手机。高密度真实战斗主体与背景优化由主审转交相应所有者，本UI包只关闭UI证据缺口，不能自称高密度联合验收完成。

## 源码结论

- BuildBar：按towerTypes渲染；available筛选、sortOrder沿TOWER_ORDER。容器overflow-x-auto，监听scroll、显示左右fade，无onWheel横滚转换，也无左右翻页按钮。明确鼠标抓住原生水平滚动条滑块拖动；支持设备原生横向scroll输入，不能把竖向滚轮、Shift+滚轮或拖卡片背景滚动写成游戏已实现的保证。左右fade/露边/可见滑块是发现线索，不新增塔分页玩法。
- 左键mousedown立即beginTowerDrag；money<cost没有disabled检查。hover使用原有title：summary＋伤害＋间隔＋射程；画板说明浮层为该内容的皮肤/锚点目标，现行浏览器原生title位置不受代码保证。原生右键会调用蓝图context menu，属于本轮既有排除的调试升降级，不包装为玩家控制。
- placementRules：资金优先失败，其次player/tower/enemy阻挡；hazards未参与资格。鼠标释放先检查buildBarRect外扩18px取消，再重新评估；只有place-tower扣费；无效与不足产生floating text然后清拖。暂停/奖励清拖。画板拖中状态章为美术说明目标，释放失败文字绑定invalidReason，不能声称源码已有持续提示章。
- GameHud：每个存活group的title/counterplay与每个member name/hpRatio/phase/phaseIndex/count/actionLabel保留；不聚合双子HP、不增tab/折叠。enraged附phase，guardCount>0才追加护卫，exposed强调动作。紧凑为布局目标，不能省字段。
- rewardRules：choices≤3，去重fallback物资可能只剩1；所有塔解锁且满级、满HP时只物资，缺HP时修复＋物资；并非固定3空槽。title/subtitle/detail/type/amount/towerId全部实际字段。蓝图只更新catalog，已有state.towers保持原等级。整卡点击选定，无新增确认/刷新/跳过。

## 分板（先计划后生图）

|板|格|需实际可见的证据|
|---|---|---|
|DUI01 九塔与滚动|A标准1440×900同屏；B右端同底栏；C完整9卡顺序展开，仅原画外部源条；D较小960×720同屏|9身份图形＋真实名称/费用/不同Lv/类别/间隔；身份费用一级，副字段二级；资金60例值，不足深字＋标签但仍可抓；A约6全卡＋第7露边，B到哨戒塔，水平条thumb端点与鼠标；小窗维持140卡宽约5全卡＋下一露边，不缩字|
|DUI02 鼠标状态|A hover；B有效；C实体阻挡无效；D资金不足；E回栏取消|五个桌面完整同屏时序分别展示（不同快照，不同时五个ghost）；保留topHUD/中央PLAYER/底栏；指针明确；hover原有完整说明于底栏上方边缘；ghost虚化、射程sage细虚圈、coral危区填充边界独立；有效可重叠危区；不足仍起拖；释放/取消结果不扣费；回栏框为外部18px解释|
|DUI03 Boss与奖励|A标准紧凑HIVE；B紧凑双成员长对策；C小窗双成员；D/E/F实际1/2/3奖励窗口（F兼长文校核，不再额外重复G）|短头像/内边距/空白，Boss占用顶部目标≤180px，保持每成员HP/phase/action及完整对策；双子真实中文对策换行，独立行；单项居中、两项并排、三项等宽，不虚构填充；长蓝图detail重排去重复，未来建造规则仅一次但保留补贴、造价、伤害、射程、间隔；较小窗口仍电脑端|

## canonical与例值

9塔复用r01/tower-icon-sources.json指定NEUTRAL第1格，实际全部重看；PLAYER单叶无脸无四肢；HIVE三孔两触角五底瓣；双子日6瓣月1永久coral边。图板缩略图不成为新身体权威，不导出透明图标。等级与状态外置，不随rig镜像。背景仍以已批BG01/BG02或主审后续批准的background新版为准，UI里的地面只上下文。

卡序BASIC/CANNON/SNIPER/RAPID/MORTAR/FROST/RAIL/BURST/SENTINEL。直接调用既有buildTowerAtLevel得到展示Lv/成本/间隔：2/20/0.28、1/40/1.5、3/140/1.73、1/28/0.12、2/95/2.14、1/55/0.85、1/98/1.65、2/87/0.88、4/120/0.44；资金60不足SNIPER/MORTAR/RAIL/BURST/SENTINEL。类别优先splash/pierce/slow/burst/单体。

奖励例状态需区别于九塔栏快照。1/2项使用wave34、money80、全9塔满级，分别hp100/100和50/100：fallback物资302，修复50；3项使用wave32、money20、满HP、仅FROST未解锁/BASIC Lv1/其余已解锁Lv4：unlock-FROST55、support_money360、upgrade-BASIC补贴5。计划器实际输出另存rule-evidence.json；非运行截图/概率或历史轨迹验证，不用wave8全塔满级的不可成立例值。

目标桌面1440×900与960×720，卡140px、gap8、栏min(92vw,920px)、底24px；正文≥14、费用≥16、辅助≥12、动作≥14，浅底深棕#4B281C，sage#B6D4AE、mint资源#A8D8BC深绿边、coral#F4ADA0、honey#F8DDAA、奖励blue#C7E4F4。PNG像素非逻辑尺寸，对比/字号/鼠标/溢出仍接入验证。没有新游戏控制、代码或接入。

## 生成中主审预检与分板细化

主审已授权BG r02作为最终背景权威，实际重看新版两板并读reviews/background-r02.md；其稀疏缺口斑合同覆盖本计划早期提及BG r01的最终来源。DUI01地面仍仅上下文。

主审要求DUI02所有完整同屏HIVE快照均有同一组件完整名称/HP/phase/action/counterplay；A/E无存活危区为恢复，B/C/D有NESTpulse盘为攻击。已定向编辑到edit4并实际重看根目录最终稿：五格完整HUD；B ghost在珊瑚盘内且与NEST身体分离；C有实体塔与ghost重叠；其余保持正确NEST、整栏取消框与无翻页箭头。危险盘/射程是平面圆目标，生产仍按runtime owner/center/radius，不能从此板测半径。预检不等于正式批准。
