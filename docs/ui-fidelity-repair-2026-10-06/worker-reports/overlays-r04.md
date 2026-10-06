# Overlay repair r04

Parent rejected fixed860px shell with sparse1/2 cards. Outer dialog maximum width now follows actual choice count:1=420px,2=580px,3=860px. Width remains100% subject to viewport padding, title/subtitle stay complete with balanced natural wrapping. Inner1/2 centered card width retained; actual reward count unchanged.

Subtitle reserved two-line48px height now applies to both2 and3-card rows, while single-card layout remains natural. Balancing and full text retained. Only WaveRewardOverlay.jsx modified.

UI architecture tests4/4 and build pass. Parent centralized screenshot verification required; no private browser contention or visual-pass claim.