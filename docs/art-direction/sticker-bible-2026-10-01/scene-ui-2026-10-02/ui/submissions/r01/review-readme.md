# UI r01 送审入口

2026-10-02。状态 submitted；主审审批 pending。本组不自标 accepted。请从 [图册](index.html) 实际逐张查看最终 UI01/UI02/UI03，审批以主审独占 reviews/ 记录为准。

|最终板|格位与重点|
|---|---|
|[UI01](ui01-hud-build-hints.png)|A桌面/B手机独立布局；顶部两行、长Boss对策、两完整卡＋第三露边；C/D/E横滚/塔卡长按或上拖/临时触点与关闭提示；资金与费用菱形已定向改为薄荷绿|
|[UI02](ui02-player-flow.png)|A开始/B结束/C暂停；C实际图已改为清晰“按 Esc 或点击继续游戏恢复。”；D/E实际三奖励桌面/手机卡体；F修复替换一卡；G旧塔保持原等级、蓝图只指向后续建造|
|[UI03](ui03-components-states.png)|A深色费用/等级/不足卡；B文字＋形状放置失败/回栏取消；C双子逐行两成员/独立HP阶段动作/长对策两行/另时刻幸存狂暴/条件护卫字段；D受伤HP35/58、等级独立、平面圆盘与独立线带2×width；E色字目标；F9塔精确源格账本|

主审已进行UI01布局与UI02构成预检，提出资金身份与Esc文案返修。本包实际执行颜色/说明修图，保留每次完整prompt、精确输入与输出来源、原图SHA和历史候选，随后实际view_image查看最终版本；此制作观察不是主审最终批准。UI03后续也需主审逐图核验。

主审随后实际重看UI01/UI03，薄荷绿资金与UI03双子逐成员、幸存状态、低资金起拖、35/58受伤塔、危险区非禁建、九塔来源通过构成预检。UI03 E格sage的HEX生成印字出现重复A，按主审授权在production-notes显式覆盖为 **#B6D4AE**，其余色码也以文字规格为准，不复制生成印字作色码；无需为该标注重画。以上均为预检记录，正式审批仍待主审。

`requirements-map.json` 共49项逐格玩家功能/状态/字段映射，`production-notes.md` 为生效文字规格，`element-map.json` 区分world/screen/模态/教学注释，`tower-icon-sources.json` 含9塔逐源文件/行/NEUTRAL第1格与SHA。图上的英文/中文样例、字级与屏幕尺寸是设计；运行时必须实际动态排字。UI02 E仅奖励卡体精细示意，标题/副标题共享D，不能当成删除手机BossClear标题的实现指令。

`source-fingerprints.json` 包括55个只读来源，其中16张引用/依赖图片在本会话实际查看。`generation-record.json` 保存内置image_gen的10次调用、完整prompt及输入内容SHA；3个最终输出与7个候选均保存。candidates/ 仅生成审计历史，不能作为当前UI来源、补图或最终新增7板。UI01最后颜色edit调用原本使用未封存的最终路径，其旧输入精确内容已留存 candidates/ui01-edit2.png；记录 inputContentArchive 供SHA核验，不与后续薄荷最终稿混淆。

9塔未重新生成一组身体；未展示的RAPID/MORTAR/FROST/RAIL/SENTINEL逐源映射，图标生产复用原NEUTRAL主体，去导线/格标/独立徽记，保留器官与root合同。当前没有透明图标导出，生成卡片缩略图不覆盖身体权威。HIVE肖像从已批master继承，并实际查看hive-production上行NEUTRAL交叉核对，不新增战斗实体。

UI01地面只作为上下文，最终背景来源必须使用已批background r01 BG01/BG02与主审background-r01.md，不以UI01较密草痕建立新背景。master的手绘危险圈不是碰撞资源；生产几何按旧效果合同与runtime center/radius/segment/width。

未改src/玩法/历史美术，未提交部署。禁止新增debug升降级、付费升级、声音控件、常驻摇杆、商城/售塔、第四奖励、跳过或新确认。低资金仍可起拖；修复玩家HP；蓝图仅强化后续建造。390×844/1440×900、字体/触控/对比是目标，未实机验证。透明源资源、可编辑分层、动画、精确挂点、图集、接入、设备/性能及最终压力复合另属后续。

packet.json 保存所有本组包文件SHA；最后READY发布后r01不可变，返修新revision。正式提交后本组停止等待主审。
