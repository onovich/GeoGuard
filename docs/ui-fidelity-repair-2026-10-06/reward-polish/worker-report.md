# UI-G01/G02 reward polish worker report

2026-10-06. Product changes: WaveRewardOverlay.jsx; new pure view helper rewardPresentation.js; GameScreen.jsx single prop connection towerTypes={towerTypes}. No reward rules, numeric data, AI or application callback changed. No commits/pushes.

## Data source and hierarchy

Current values come from existing useGeoGuardGame towerTypes blueprint catalog, passed into overlay (not placed tower stats). Offered upgraded values come from actual choice.detail produced by materializeRewardChoices/getTowerPreviewSummary; helper parses damage, range, shot interval. Primary16px bold rows show real damage and shot interval before→after, never DPS or percentages. Range before→after remains14px secondary alongside price change and capability tags. Level1→2 becomes14px secondary; blueprint restriction and funding subsidy remain complete. All27 actual upgrades (9 identities ×3 levels) agree with authoritative upgradeTower; no mutation of current tower.

If catalog missing, helper shows actual post value only, with no invented before value. If detail format cannot be parsed, original subtitle and unparsed stat remain; no synthetic benefit. Parent fixture must pass same reward catalog that materialized its offer, not a global all-tower catalog. Parent confirmed fixture connection.

## Simplification

Tower h3 retains actual tower name without repeated解锁/升级/蓝图; type badge retains新防御塔/蓝图强化; CTA states action. Support badges distinguish即时获得/生命恢复 instead of repeating物资补给/紧急修复 title. Text arrows normalizeASCII -> to visual →; price label drops colon. Canonical64px tower identity and upgrade badge, restrained strokes,7 shared subgrid rows and adaptive420/580/768 shell preserved. Body14px/20px, CTA16px/48px intact.

## Checks and boundaries

27 real upgrade comparisons passed for damage/range/interval; current input unchanged; missing catalog returns post-only and malformed detail returns no comparisons. node --test tests/ui-design-system.test.js4/4 passed. npm run build passed (existing chunk-size/duplicate import/Browserslist warnings remain). No private browser automation or screenshots; actual density may increase due level now retained separately. Parent must verify mixed/long/1/2/3 and missing-catalog component fallback; no visual-pass claim before central acceptance.
## r02 strict return: capped-rate is not a benefit

Parent first screenshot measured mixed768x535.5 and judged layout acceptable but returned RAPID late0.1→0.1 as a false primary benefit. Pure presentation helper now exposes real improvements separately: damage/range require after>before; interval requires after<before. Primary block includes only verified improved damage/interval. Unchanged interval stays in secondary stats with full before/after comparison; no field deletion. Missing current catalog cannot claim improvement and uses original subtitle fallback.

Rechecked all27 actual catalog upgrades and explicit0.1 capped-rate case. RAPID0:0.12→0.11 primary; RAPID1:0.11→0.1 primary; RAPID2:0.1→0.1 auxiliary. Damage/range/interval comparisons all match authoritative data. UI tests4/4 and build pass. No general layout changes. Await parent reinspection of capped RAPID plus central final checks.