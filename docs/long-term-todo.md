# GeoGuard Long-Term TODO

This file is for later work that is intentionally not part of the current fast-iteration pass.

## Tooling

- Add richer debug presets such as spawn-at-phase, common tower layouts, cooldown inspection, and step simulation.
- Add browser-level or rendering-sensitive integration coverage for the full reward modal lifecycle, visual transitions, and live input flows.

## Architecture

- Continue splitting `src/logic/hooks/useGeoGuardGame.jsx` into narrower runtime modules, especially remaining wave tick orchestration, boss scheduling, and debug panel bridges.
- Move more authored encounter data into structured config instead of mixed hook logic.
- Add a cleaner data layer for phase intent, counterplay text, and encounter presentation so tuning can stay mostly data-driven.

## Content Expansion

- Add more boss variants, elite encounters, and alternate wave compositions once the current roster balance is stable.
- Explore master/minion or multi-node encounters beyond the current dual-boss support.
- Add higher-difficulty remixes for existing bosses instead of only adding new bosses.

## Presentation

- Continue lifting non-showcase bosses toward the presentation quality of Twins, Dragon, Spider Matriarch, and Astrolabe.
- Revisit some legacy docs and bilingual text that still carry prototype-stage encoding or wording debt.

## Tuning

- Run deeper real-play balancing across waves 1-18 after enough iteration data accumulates.
- Add late-game economy sinks, recovery options, or broader progression systems only after the current core loop is stable.
