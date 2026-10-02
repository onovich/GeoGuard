# Independent art validation tools

These tools only write QA output and never modify implementation to satisfy tests. Current output boundary: `docs/art-implementation-2026-10-02/qa/submissions/r02`. The primary reviewer must authorize future output revisions. No candidate conclusion is valid if sources change during execution.

`node export-baseline.mjs` reads the fixed Git commit with ls-tree/show; it makes no Git writes. The full export lives under the QA output's `baseline/node_modules/geoguard-baseline`, preventing duplicate Node test discovery. The browser mirror at `baseline/browser` contains identical bytes without tests, outside node_modules so React JSX processing works. Existing exports are refused rather than overwritten.

Run from the repository root:

```powershell
node --test tests/art-snapshot.test.js tests/art-baseline-contract.test.js
node scripts/art-validation/protected-audit.mjs
node scripts/art-validation/resource-contract.mjs --source <fixed-source-root> --out <new-report.json>
node scripts/art-validation/compare-behavior.mjs --baseline <fixed-baseline-root> --candidate <fixed-candidate-root> --out <new-output-directory> --omit-projectile-metadata approved --contract-sha b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba
node scripts/art-validation/browser-runner.mjs --mode fixed --source <fixed-source-root> --out <new-output-directory> --browser <existing-Chromium-executable>
node scripts/art-validation/browser-runner.mjs --mode ui --source <fixed-source-root> --out <new-output-directory> --browser <existing-Chromium-executable>
node scripts/art-validation/browser-runner.mjs --mode performance --source <fixed-source-root> --out <new-output-directory> --browser <existing-Chromium-executable>
node scripts/art-validation/browser-runner.mjs --mode characters --samples <375-concrete-samples.json> --source <fixed-candidate-root> --out <new-output-directory> --browser <existing-Chromium-executable>
```

Use the bundled Playwright package, or pass its absolute directory using `--playwright`. In this environment its default Chromium version is unavailable; an existing executable was verified at `C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe`. No installation is required. The runner uses a temporary localhost Vite server and closes it and its headless browser. Source files remain untouched; Vite cache goes into the output directory. Tailwind content paths are explicitly fixed to the selected source root, independent of the invoking cwd.

The baseline/candidate snapshot serializer preserves all gameplay fields, array order, Set membership by entity identity, and RNG state/consumption. Only the three approved projectile metadata keys can be excluded, scoped to actual projectile objects. CRLF/LF normalization applies only to source audit classification, never runtime values. Numeric changes, timing, x/y, damage and hit order remain exact.

`fixed` uses constructed real-engine states and the production Canvas renderer. It freezes gameplay state, traps renderer Math.random, checks state before/after and checks context transform restoration. It does not inject an imagined window.game API. A failing scene is recorded and later scenes continue.

`ui` uses the real game page, mouse/keyboard events and the game's existing 试玩数据 JSON export for observations. It executes initial normal build/cancel/overlap/insufficient/pause/resume/movement at three desktop sizes plus sandbox nine-card and reward interaction. Normal boss-to-reward, every reward count/position and end/restart remain explicit later requirements, not implied passes.

`performance` performs three 60-second stationary Canvas draw samples, each with ten seconds of warmup. It captures frame intervals and draw CPU time separately. This is not full-game FPS; baseline/candidate must be repeated under matching browser/hardware/viewport/DPR and comparable host load. No renderer result establishes full gameplay performance.

`characters` accepts a ledger with exactly keyed samples `{key, actor, frame}`. Each actor/frame must be a concrete producer/QA-observed mapping to that approved action, not a default pose assigned to many labels. Null mappings return pending without calling a drawing API. Actual draws produce `captured_unreviewed`, never visual approval. Follow the source mapping, inspect all 375 images and transition evidence, and write an independent review before claiming full coverage.

Current module signatures are taken from the primary-approved integration r01 packet, SHA above. Resource manifest/export checks prove only interface/structure and missing-resource diagnostics. They do not prove that anatomy, anchors, danger geometry or any image looks correct.
