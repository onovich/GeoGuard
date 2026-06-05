# Boss Redesign Status

## Goal

Turn GeoGuard boss fights from oversized elites into readable encounter fights with:

- a clear combat fantasy
- visible phase changes
- memorable telegraphs and silhouettes
- distinct counterplay
- support for multi-actor encounters such as Twins

## What Is Done

### System

- True encounter support for multi-boss fights, especially `TWINS`
- Shared reward / aftermath handling for boss encounters
- Boss-owned summons and hazards integrated into wave cleanup rules
- Real-wave integration for the expanded boss roster

### Readability

- Persistent boss HUD with summaries, counters, health, phase bars, and phase intent
- In-world boss labels for current phase and phase intent
- Boss entrance spotlights
- Phase-shift banners and light camera shake
- Cleaner differentiation between area telegraphs, line telegraphs, and finisher telegraphs

### Showcase Bosses

The following fights are now the benchmark encounters in the set:

1. `TWINS`
2. `DRAGON`
3. `SPIDER_MATRIARCH`
4. `ASTROLABE`

Each now has stronger phase identity, clearer endgame patterns, and more distinct stage presence.

## Remaining Work

The redesign is now in the "finish polish" range rather than the "missing systems" range.

### High Priority

- Do a full-wave pacing pass across waves 1-16 from a real-play perspective
- Continue equalizing presentation quality for non-showcase bosses
- Tune outliers where a boss can still feel like cooldown rotation instead of a composed phase fight

### Medium Priority

- Expand debug validation presets for faster boss encounter review
- Continue cleaning legacy text / encoding leftovers in older files
- Add any final VFX/audio hooks if the project later grows dedicated asset support

## Practical Completion Read

If the project stopped here, the boss redesign would already ship as a strong feature set.

What remains is mostly polish:

- tightening encounter pacing
- lifting the non-showcase bosses closer to the showcase standard
- continuing presentation cleanup

That means the redesign is functionally complete, with remaining work concentrated in balancing and refinement rather than missing core features.
