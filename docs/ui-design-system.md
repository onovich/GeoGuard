# GeoGuard UI Design System

This document is the project contract for reusable UI. New React UI should prefer the primitives and class tokens below before adding one-off Tailwind strings.

## Source Of Truth

- `src/view/designSystem.js`
  - Owns reusable class tokens for surfaces, text, buttons, badges, forms, segments, and cards.
  - Exports `cx`, `getButtonClass`, and `getBadgeClass`.
- `src/view/components/ui.jsx`
  - Owns reusable primitives: `Button`, `Badge`, `Panel`, `SectionHeading`, `Field`, `TextInput`, `TextareaInput`, and `SelectInput`.

## Component Rules

1. Use `Panel` for HUD panels, modal panels, glass panels, cards, and menus.
2. Use `Button` for command buttons. Add a new `variant` or `size` token in `designSystem.js` when a style repeats across components.
3. Use `Badge` for small status/type labels instead of hand-written pill classes.
4. Use `Field`, `TextInput`, `TextareaInput`, and `SelectInput` for editor/form surfaces.
5. Use `ui.segment.*` for segmented controls.
6. Use `ui.card.interactive` or another explicit card token for repeated clickable cards.
7. Avoid adding new large rounded cards unless the surface is a modal or existing gameplay overlay. Default repeated cards should stay compact.

## Current Adoption

- `GameHud`, `BuildBar`, `OverlayScreen`, `WaveRewardOverlay`, `TowerContextMenu`, `StatusBanner`, `DebugSpawnPanel`, and `BossEditorPanel` now consume the shared primitives or design tokens.
- Canvas drawing remains separate in `src/view/canvas/canvasRenderer.js` and should not import React UI primitives.

## Validation

Run these after changing UI primitives or shared tokens:

```powershell
npm test
npm run build
```

For visual changes, also run a local browser smoke and capture at least one screenshot of the start/debug flow.
