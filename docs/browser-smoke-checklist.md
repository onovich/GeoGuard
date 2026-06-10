# GeoGuard Browser Smoke Checklist

Use this checklist after UI, input, reward, or Boss authoring changes. It is intentionally lightweight and does not require new repo dependencies.

## Setup

1. Run validation first:

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
```

2. Start the local dev server:

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\StartDevServer.cmd
```

The expected local URL is `http://127.0.0.1:5188/`.

## Smoke Path

1. Open `http://127.0.0.1:5188/`.
2. Enter the localhost-only debug mode from the start overlay.
3. Confirm the debug HUD, top debug panel, controls hint, and build bar render without overlap.
4. Switch to `Author`.
5. Confirm `Boss Authoring Lab`, `Spawn Edited Boss`, `Copy JSON`, and the live JSON panel are visible.
6. Capture screenshots for the debug panel and Boss authoring panel.

Recommended artifact names:

- `.tmp/geoguard-refactor-smoke.png`
- `.tmp/geoguard-boss-author-smoke.png`

## Cleanup

Stop the dev server:

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\StopDevServer.cmd
```
