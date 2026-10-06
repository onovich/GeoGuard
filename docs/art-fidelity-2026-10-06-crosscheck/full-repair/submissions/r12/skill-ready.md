# 95技能实引擎观测与浏览器试审入口

`boss-skills-runtime.html`现稳定，可独立CUA试审。16遭遇、阶段、双子Sun/Moon幸存，选择95skillId后「真实推进到所选cast」用真实每帧Boss选取/执行到观测的cast，未直接调用某技能。不需要完整通关。

`skill-coverage-table.md`是95项实际cast→真实actionMode/phase→独立UID样本→危区pulse/resolve→原稿cell的可读覆盖表，`skill-summary.json`摘要，完整`skill-runtime-observations.json`含150场（16×3阶段×3种子+6双子幸存），4491实际cast，12030危区生命周期记录，2451独立实体的出生/后续位置/HP/timer样本。95/95实际引擎cast已观察，**全部visualStatus仍pending**。记录阶段/原稿映射不等于像素现场验收，未关闭95技能或独立HP受伤证明。

新runtime-tools/scene-kit-current.mjs由冻结历史scene-kit另起，未改历史QA。正式runBossOptimizedAbility、tickBossCombatRuntime、enemy behavior及hazard solver推进真实逻辑。高友方HP、阶段HP/time探针，主覆盖offense关闭以免早杀Boss；不声称正常经济/玩家可达性。运行页面可独立开我方offense观察真实受伤。

修复此前测试入口的不足：
- 无固定hasOwnBehavior:true声明；出生与后续真实UID、位置、HP、mechanic.timer/fuseTimer明示。
- 每次真实updateHazard前取timer<=dt的对象，后记pulsesRemaining、timer续期、radius改变及ended；不以移除唯一条件判断pulse。captureHazardPulses同真实resolver集合，中间重复pulse不会漏。
- 死亡走真实settleEnemyDefeatRuntime并captureDefeat，成功召唤captureBirths只取实际新增对象；mechanic调用begin/end真实trigger资格。双子倒下真实settlement/enrage，已死partner不被阶段探针复活。
- 真实源冲击波callback与updateTransientVisualRuntime，独立效果不烘焙身体。伤害/子体数量/生命周期规则未改。

当前观测主覆盖未decode PNG，故不冒称95项源形都肉眼通过；浏览器页调用真实字符/世界PNG及drawStickerScene供主审核查。还需绘制路径与各技能source key收据、实际warn/active/resolve/fade逐cast视觉、独立实体HP改变与清理、死亡/真实密度。最终实战验收与性能未完成。

下一独立项：SNIPER/RAIL的四向整帧还不足以对齐斜向真轨迹，正在按正式AI补制方向原画流程补斜向参考，来源不称旧crop；近敌M夹取和真实自由aim继续返修。

## r02 目标/危区可见性返修与验收窗口
QA playerMotion现在明示bounded-orbit：将输入期望限制在(160±80,100±55)，经**实际**movePlayerOnBattlefield和墙/减速规则推进；不直接挪玩家坐标，不改变生产行为。主近景camera只在QA跟随活Boss/玩家的中点，zoom仍1.25。第二幅独立概览使用真实source alpha bounds+实际全危区几何/波半径合围，通过显式presentationZoom适配整幅，不当像素美观认证。因此长seek后可在概览确认完整源/目标/危区，同时近景仍保留实际人物尺度。覆盖150场重跑后95/95cast仍观察。
当前入口及import依赖冻结供主审约5分钟检查，等待主审结束释放；同时只处理文档与工作区外生图。

另一独立入口 `dpr-source-failure-runtime.html`：真实浏览器DPR不改，双backing-store1/2源渲染+真实输入坐标roundtrip、registry failed/partial、单体BASIC缺源。生产partial诊断整页文字，真实update停在资源非ready；单体缺源也全场明确缺失诊断并fatalSourceMissing门闩，避免敌/塔仅影子继续误导。未使用旧绘图fallback。此包只待实机，DPR2明确模拟。
