# 玩家UI × 完整画册只读校对

2026-10-06。只读产品审查，未修改产品代码、既有验收或待办状态。结论：近期UI修复与reward-polish确实在当前游戏生效；未确认需要重开这些已通过项的新功能缺陷。UI与世界角色的整体比例仍未达到master目标，此为既有VF-01/03联动，不等于把全部UI重新判失败。

## 依据和真实试玩条件

读取完整画册index.html的有效/历史分类与制作规范入口，聚焦玩家UI对照以下当前有效板（路径均相对docs/art-direction/sticker-bible-2026-10-01/）：

- scene-ui-2026-10-02/master/submissions/r04/master-desktop-density-r04.png、master-desktop-twins-r04.png：整体画面中的HUD、Boss和底栏关系。
- scene-ui-2026-10-02/ui/submissions/r02/dui01-nine-towers-scroll.png、dui02-mouse-states.png、dui03-boss-rewards.png：140/8/920、说明连接、单双Boss字段、真实奖励数量。
- production-art-2026-10-02/effects-ui/submissions/r02/b05-start-end.png、b06-rewards-blueprints.png、b07-controls-placement.png：开始/暂停/结算符号与奖励物件、教学/Banner。
- 同目录ui-color-type-spec.md覆盖生成图浅底白字/cyan/渐变；production-notes明确文字/规则优先，PNG不能反推屏幕像素。历史手机稿不作为本轮桌面权威。

以上八板已view_image观察；其他角色板属于另两组审查，不宣称本UI组逐一审查所有45板或375动作。读取art-fidelity-2026-10-03/backlog.md、ui-fidelity-repair-2026-10-06/review.md、followup-repair/review.md、reward-polish/review.md。没有以旧整卡绿色或旧860px奖励截图当当前状态。

真实试玩使用CUA独立Chrome tab 578043375，http://127.0.0.1:5173/；IAB unavailable后使用现有Chrome提供的独立新页，不碰用户页、不修改全局viewport。实际innerWidth2304、innerHeight1334、DPR1。截图原始PNG2304×1334，工具显示有缩略，不把缩略后的文字大小当computed style。临时页已关闭。

覆盖普通开始/暂停/恢复、开局三卡、真实BASIC拖建（45→30）、真实开发Open Reward三同类（BASIC 6→7、0.3→0.28；选定后cost15→20、Lv1→2）、真实双子拖放、真实HIVE拖放和现有Phase2切换、首卡及后端卡keyboard focus/native auto scroll。没有使用fixture替代这些真实游戏证据。

## 已确认差距（保留原待办）

|优先级/项|当前观察|建议与边界|
|---|---|---|
|P1，既有VF-01/03联动|normal-built-stable.png中68px卡肖像大于场上BASIC，英雄更小；master density/twins里身体是战斗画面主体，而实机先识别底卡。root当前shared/normal.jpg、wave31-active.jpg的1280画面也存在这种世界/底栏主次差距。|先统一世界表现尺寸/相机/主体读感，再联合UI构图评审；不能再仅减小底栏或字号解决，也不能凭2304尺寸推断1440失败。三卡空框与191px旧栏问题已修复，本次不误报复发。|

没有确认新的P0或独立UI P1。开发栏无论展开还是收起仍会盖顶中区域，这是测试界面限制，不算真实玩家HUD还原缺陷；DOM完整字段仅证明字段保留，不证明截图全无遮挡。

## 当前通过项复核（不是旧稿）

- 开始真实出现叶片、标题与mint分隔小物，sage深棕CTA；暂停有叶片、Esc键帽与sage继续。VF07关于统一honey按钮/蓝图箭头缺陷没有复现。结束本轮没新运行，不据此宣布死亡截图通过或失败。
- 暂停computed font16px，生命条比旧6px厚，资金/生命一级、时间/音频框更轻。波次明确旗帜，未再把wave皇冠问题误报。
- 普通三卡实测bar455×166、clientWidth453=scrollWidth453，没有横滚裁卡；正常费用/不足符号清楚。9塔保持横滚与最后卡完整，通过键盘自动滚到后端；主审前轮左右手动离屏与partial/resize证据有效，本次不冒充全部重跑。
- normal-tooltip-stable.png：说明14px、真伤害/间隔/射程、小尾所属清楚；教学暂避且不挡说明。actual-last-cards.png显示BURST焦点和完整后端说明。
- Boss运行DOM：双子680×115，top66/bottom181；两成员姓名、独立HP、phase/P/action、完整对策。HIVE真单Boss姓名完整。开发收起条遮住双子组标题/上部，不据此重开VF09；下部成员和对策可见。没有新取证完全无遮挡的整张BossHUD。
- actual-reward.png是最新真实Open Reward：奶油卡、绿类型徽、真实塔身份+升级徽、伤害/间隔前后一级、仅后续新建规则、补贴/造价/射程/溅射完整、CTA齐。实际选择BASIC后建造栏cost20/Lv2/0.28，回调生效。没发现旧整卡绿色、重复长塔标题或将无变化间隔当主收益复发。

## 纯审美精修建议（不作已确认功能缺陷）

|优先级|具体对照|建议|
|---|---|---|
|P2，封面/暂停品牌进一步精修|start.png、pause.png对照B05 U01/B07 U06；状态语义已对齐，但中文标题依然是普通系统粗体，封面字形气质比原画较方正、字面存在感弱。|在系统正文保持可读的前提下设计单独主标题字形/更有表现力的封面组合；不要改浅面深字、CTA语义，不能把生成图白字/渐变作为改善目标。这是已通过VF07后的风格上限建议，不重新指称缺少logo。|
|P3，辅助教学图形|normal.png对照B07 U08；目前WASD四键一行，方向键仍是文字，原画含方向键簇。|可把方向键做小键簇或精简更明确图形，但紧凑提示当前可读、可关闭，与说明互斥有效，不应为追求图形扩大到遮主体的常驻大框。|

## 本轮未验证与证据边界

未重新触发实际死亡/重试，未抓鼠标仍按下的ghost/持续状态章/射程/危盘交叠中间态；真实拖建只确认释放成功与费用。未逐项重跑混合/1/2奖励、末级RAPID0.1下限、正常击杀奖励链、幸存者、全部Boss、960/1440和DPR2。本轮这些沿用正式旧验收，不能拿其旧图称新取证，也不能把未测写confirmed。

当前实际独立证据：start.png、normal.png、pause.png、actual-reward.png、actual-twins-collapsed.png、actual-hive-collapsed.png、actual-hive-phase2.png、actual-last-cards.png、normal-built-stable.png、normal-tooltip-stable.png。

截图瞬时状态须以像素为准：actual-twins.png为收起过渡帧仍显示展开开发面板；actual-tooltip.png前帧未显示说明；normal-built.png仍显示暂停过渡帧；normal-built-pause.png属于暂停。它们保留审计，但不用于声称对应稳定状态。新稳定证据用*-stable及*-collapsed文件。

root shared/normal.jpg、wave31-active.jpg为主审本轮1280截图，我实际view_image参考；不是本UI组独立操作该尺寸。2304身体截图已提供其他组使用，开发UI不属玩家包装范围。