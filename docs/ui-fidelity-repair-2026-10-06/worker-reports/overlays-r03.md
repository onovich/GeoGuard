# Overlay repair r03 — balanced subtitles

Parent inspected mixed reward fixture at1280x720 and returned one orphan final Chinese character in unlock subtitle, plus24px vertical icon offset.

Subtitle now uses CSS text-wrap:balance to distribute actual complete text across lines. Actual funding/try-build facts remain unchanged. Three-choice layout reserves uniform48px (two24px lines) subtitle slot, aligning main symbols when one/two-line subtitles coexist. One/two-choice layout does not impose this extra slot, preserving compact centered cards. No clipping/truncation or reward-data change.

Changed WaveRewardOverlay.jsx only. UI-design-system4/4 and build passed. Browser measurements and screenshot assessment remain centralized with parent, avoiding browser contention; no independent visual pass claim.