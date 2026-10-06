# HUD build r02 / 验收 Fixture
2026-10-06。主审打回r01三卡溢出：452px遗漏Panel两侧共3px边框。已改为 N*140+(N-1)*8+16padding+3border，3卡455px；仍保留92vw/920上限、原生滚动条，不以隐藏掩盖裁边。待主审实测455px无overflow后批准。

临时入口： http://127.0.0.1:5173/.tmp/ui-repair-2026-10-06/fixture/index.html

fixture/index.html、main.jsx仅.tmp文件。直接import当前生产GameHud/BuildBar/StatusBanner/OverlayScreen/PauseOverlay/WaveRewardOverlay和原CSS，不复制实现。16个可见切换按钮，左下组件检查可收起。?case=混合三奖/两奖/单奖/双子/幸存者等可直达；Esc恢复普通组件模式。

真实性边界：本页面是组件验收，不是游戏实机、没有world、AI、运行伤害/经济或正常波次链。塔来自createInitialTowerCatalog/buildTowerAtLevel，奖励直接buildRewardOfferPlan/materializeRewardChoices生成。三同类是全解锁Lv1高资金；混合是wave32 FROST未解锁/BASIC Lv1/其余Lv4/money20；两/单奖wave34全解锁Lv4/money80，HP50/100。Node已验证两/单真实规则输出repair+money/money。Boss由createBossEncounterRuntime建立当前COMMANDER/最长真中文名/TWINS，buildBossHudRuntime/addBossHudArtIds产生当前presentational props；仅人为指定hpRatio测试点、phaseIndex=1和windup/recover，幸存者partnerFallen=true，不声称完整AI轨迹。

应用choice只记录回调并切普通组件状态，不执行经济、不能作为奖励功能测试。起拖仅记录ID，mouseup清除，无placement资格模拟；该fixture只验组件尺寸/排版/真实字段/hover focus/滚动/视觉，功能资格须真实游戏验收。

HTML/JSX Vite HTTP200。产品r02仅修改BuildBar内容宽公式。其他产品文件未动。