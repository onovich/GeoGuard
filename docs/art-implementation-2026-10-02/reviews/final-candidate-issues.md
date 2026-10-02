# 最终候选开放问题

- I06：重置时清空 buildBarRect，而栏仍挂载，拖回栏可能误建造。integration 回放发现，交回 integration hook 层修复；复核 reset→拖回取消、不生成实体、不扣钱。冻结引擎不变。
- I07：UI 实机预采样发现双子拖动 ghost 使用 boss:TWINS 而非实际 SUN/MOON 身份，产生 Canvas fallback。主审交回 integration 映射修复；UI 保存复现并在最终稳定版核对 ghost 与真实落地双身体，默认路径不得残留 fallback。

两项尚未关闭时不批准完整候选。owner 提交不可变证据后根审追加关闭结论；本记录不将别线程报告等同主审实机复核。

- Q08：performance-01 的 dense-with-real-hazards DPR2 测量期 towers 与 projectiles 的 min/p50/p95/max 全为0。帧率记录有效，但不能证明完整交火性能。主审退回 QA 新 performance-02，保留此前全部证据；要求原 GUI 建立持续多塔、实际弹体/命中与危险区，10秒预热60秒实际game-time测量，报告分布与操作成本，禁止改生产数值或注入状态。此项未关闭前最终性能不通过。
