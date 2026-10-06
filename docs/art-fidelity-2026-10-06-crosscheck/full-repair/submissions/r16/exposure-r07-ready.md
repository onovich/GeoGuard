# R16 r07 — source-ray safety candidate READY

Scope: targeted repair of R06 RAIL 19.82° / target distance30. No replacement source images; R06 approved lower-sector posture remains. Production SNIPER/RAIL candidate flag remains explicit QA only. No build/dist overwrite.

## Product change
`src/logic/engine/projectileBirth.js`: retains the established owner-segment joint solution when it actually converges. If angular residual >0.0001rad, solve the anatomical aperture ray to the same selected target without the discontinuous radial clamp. Then retreat along that *same* source axis to before the first applicable expanded enemy interval. Expanded radius remains enemy radius + actual projectile radius + existing4 safety margin; extra0.5 stand-off remains. Relevant intervals include forward-to-target and the owner-projection-to-M segment, plus the prior swept blocker. All live nonburrowed enemies are checked; the accepted endpoint must be outside every expanded circle. If old swept blocker does not intersect the source ray, or no valid forward ray exists, use explicit centre strategy with current source aim; metadata states `no-safe-source-ray-centre`/`no-anatomical-ray-root-centre`. An unsupported source-axis callback retains its true nonzero residual; it does not fake convergence.

Source ray does not edit target selection, speed scalar, spread/count, damage, radius/hurtbox, life, collision update or AI. It changes true birth geometry and resulting same-target travel direction/timing. These timing differences are intended and must be judged visually. Flash follows actual accepted origin. The original source M can differ in near contact; greenM/redaccepted QA markers expose this difference.

Actual RAIL callback reproduction (radius5 diagnostic, not actual pierce projectile): requested(27.9473,3.57731), accepted(27.41047,-9.30897), source axis1.5291622683rad, joint residual9.98e-9rad. Previous radial clamp had no continuous root at source circle tangency.

## Recheck entry
`/docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r16/continuous-shot-runtime.html`
Added actual UI headings95/100/108/112.5/115/125/157.5°, existing90/135/free64.17/free19.82 and distances10/30/60/110. `目标侧前额外敌人` creates real additional UID92, HP12/radius12, preserving real offense nearest-target selection and collision; receipts include all actual enemy positions/HP. Source images stay unchanged. Use actual0/1/3/6 frames and live step controls; no private browser automation.

## Implementation checks
`tests/art-source-ray-birth.test.js`: real production presentation callback + real tower offense for two candidate identities ×11 headings ×4 distances =88 actual births. Source axis vs first velocity <1e-5rad; true offense speed/damage/count/projectile radius/source UID preserved; every nonoverlap birth outside actual expanded selected target; centre overlap retained. Additional impossible-source callback proves explicit conservative fallback and honest nonzero axis residual. Together with existing centre/partial clamp tests:5/5 pass. Prior game-rules suite70/70 passes. These are engine checks, not browser visual approval. Root must additionally inspect extra blocker, centre overlap, M-in-circle and source-behind-target visual relations.

## Still OPEN
Candidate production activation and complete source prompt/crop/mask/Q/registration/gallery chain; two-tower r07 true shot visuals; twin survivor enrage + independent summons cleanup; full four-direction/action and375 qualifications; final dense death/heal/plus/projectile/flash layer audit; all desktop+DPR2 samecandidate; complete source consumer/provenance/deployed decode; samecandidate perf/tests/build and CRLF cleanup. Existing scoped approvals remain in root ledger; no broad completion claim.