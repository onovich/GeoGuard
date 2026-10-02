# 只读功能/场景核查
|代码来源|现有事实与本轮美术边界|
|---|---|
|canvasRenderer.js|canvas尺寸除DPR取逻辑宽高；translate(width/2-cameraX,height/2-cameraY)，没有透视缩放。地面随camera无限延伸；shake只作用相机。角色、掉落、危区/弹体、dragPlacement是world坐标。|
|gameConfig.js|BASIC速射塔15/0.3秒，CANNON榴弹炮40/1.5秒，SNIPER穿透塔80/2秒，BURST散射塔66/0.95秒为base例值；初始前三塔，BURST需解锁。|
|GameHud.jsx|playing显示HP/maxHP、money、wave/time、pause；Boss title/counterplay/members/name/phase/P计数/HP/action/guardCount动态。操作提示可关闭，手机30秒倒计时。audio props未渲染入口。|
|BuildBar.jsx|只画真实towerTypes；cost、level+1/4、效果类别/间隔；拖卡建造，触摸滚动与180ms长按/向上拖区分，溢出渐隐。普通玩家不新增收费升级。|
|GameScreen.jsx|canvas与screen UI分层；playing且paused且非奖励时显示暂停覆盖，继续/Esc。debug/editor/export不包装。|
|OverlayScreen.jsx|START显示“几何防线”说明与“开始游戏”；其他nonplaying显示“防线崩溃”、到达波次/战斗时间、“重新挑战”。开发测试入口排除本轮产品美术。|
|WaveRewardOverlay.jsx|动态三choice；unlock/upgrade/money/repair样式，修复非固定第四张；升级只影响后续建造。|
|bossOptimizedAbilities / bossMechanicEntities|HIVE巢独立HP实体，巢脉冲为node中心圆；optimized broodShift无line。不能把旧fallback当当前生效入口。|
|waveTable / encounterRuntime|第5波HIVE_T1不适合P2/3；完整HIVE位于第23波。最终原画已改WAVE23。r02移除FAST，以NEST真实可召唤BASIC替代；progressionRules的enemyCount===0排除前波残留解释。|

图中文字均是动态显示例值。图像原画不等于排版、对比、碰撞、缩放或设备实测。详细来源与SHA见source-fingerprints.json。

