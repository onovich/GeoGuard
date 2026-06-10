# GeoGuard Refactor Architecture Checklist

Use this checklist before committing code changes. Keep it short on purpose; the detailed handoff docs can explain history, but commits need a fast standard.

## Layer Boundaries

1. `src/data`
   - Owns authored data and presentation data.
   - Must not import `src/logic` or `src/view`.

2. `src/logic/engine`
   - Owns pure or callback-driven runtime rules.
   - May import `src/data` and sibling engine helpers.
   - Must not import React hooks, React components, screens, canvas, or design-system UI.

3. `src/logic/hooks`
   - Owns React state orchestration and browser/runtime bridges.
   - May call engine helpers and data helpers.
   - Must not import React components, screens, or design-system primitives.
   - Canvas drawing is the only view import currently allowed from hook orchestration.

4. `src/view/canvas`
   - Owns Canvas drawing only.
   - May read runtime state, data constants, and drawing math.
   - Must not import React components, React hooks, screens, or UI primitives.

5. `src/view/components`
   - Owns React UI rendering only.
   - May import data copy/config and shared UI primitives.
   - Must not import engine modules or hooks.

6. `src/view/screens`
   - Owns composition between hooks and view components.
   - May import `src/logic/hooks`.
   - Must not import engine modules directly.

## UI Standard

1. Start from `src/view/components/ui.jsx` and `src/view/designSystem.js`.
2. Add component-local Tailwind clusters only when the style is not reusable.
3. If a pattern repeats, add a token or primitive first.
4. Keep Canvas rendering independent from React UI primitives.

## Boss Presentation Standard

1. Boss summary, threats, counterplay, phase intent, phase tone, and phase callouts belong in `src/data/bossPresentation.js`.
2. Runtime code should consume data helpers instead of embedding presentation maps.
3. Canvas should draw state, not own authored presentation text.

## Commit Gate

Run this before commit, or use the project git wrapper that runs it automatically:

```powershell
npm run check:architecture
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
```

The project Codex hook also runs the fast architecture check on Stop when relevant files changed.
