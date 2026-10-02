# Characters r04: full production aggregation

48 identities are produced and drawable through the seven-export public character API. The status remains `produced_pending_review` until primary accepts this aggregate. This revision completes seven towers and five mechanics, retains the eight earlier sample bodies, and merges the 28 group identities from accepted Boss A, Boss B and enemy resources. No engine, UI, world, configuration, package, existing test or Git changes are made by this owner.

## Review images

- `identity-roster.png`: all 48 neutral bodies.
- Five `*-poses-contact.png` sheets: source-space poses; five `*-runtime-size.png` sheets: reference radius at one world unit per pixel.
- `continuous-variant-timeline.png`: FORTRESS and seven enemy transitions, nine progress samples each.
- `scout-feet-repair.png`: two rows with enlarged foot regions. Accepted enemy r04 exact C2 splits plus aligned contour winding preserve both feet; their joint mean x remains 128. The smallest measured isolated sole fill is 405 pixels. Raster bottom is allowed to vary with the approved local contour.
- `sentinel-feet-repair.png`: RIGHT/LEFT/UP by neutral/squash/stretch/attack. The lower body reveals both fixed feet, each retaining at least 111 visible fill pixels. Far pad center moved locally from (186,154) to (198,151), behind the body, retaining its 25x32 radius and the larger 32x38 near pad. Actual composited upper and lower far-pad contributions remain visible in all 12 frames, with minimum 93/64 contribution pixels respectively. Root (128,220), collision center (128,145), foot contacts and barrel pivot remain fixed.
- `eye-and-shell-transitions.png`: one FORTRESS shell and one eye per side during TWINS_SUN attack and RAIL_WARLORD recover. No duplicated body or eye.
- `hit-flash-roster.png`: all 48 palettes at actual hitFlash 0 and 1. Four strengths were checked for identical alpha and anatomy.

## Validation

Native Canvas and sharp render the actual public API without a browser or DOM. `verification.json` reports 4,752 root checks, 288 boundary checks, maximum boundary difference 1.4210854715202004e-14, and zero clipped sampled frames. Rigid launchers preserve dimensions; all muzzle axis metadata uses actual aimAngle, including the nine towers' supported directions.

`qa-and-feet-verification.json` reports 1,146 reference sample draws and 882 active-skill sample draws, immutable inputs, restored caller Canvas state, 48 deterministic paused samples and the visible-foot/pad metrics. `palette-and-morph-verification.json` reports 48 identical flash alpha masks, 27 shell/eye samples, and unique named shapes for all 1,146 reference samples. FORTRESS output equals one explicit authored morph at every sampled progress.

All 375 reference keys retain source hashes and cell locators. Four archived twin concepts remain explicit neutral source reuse, not additional runtime events. All 95 active default/survivor skills retain actual owners and dispatch metadata. Every runtime and source Actor has a positive radius; BEACON STRETCH maps to its authored trigger. OPEN, children, money/refund, hazards, projectile origins, shadow, levels and effects remain external.

## Dependencies and limits

Approved integration contract r01 SHA: `b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba`. Baseline: `23ce1a33d0a72674286d67ba80c8f7b1260153e2`.

Boss A uses r02 resources plus r03 FORTRESS repair, Boss B uses r02, and enemy uses r02 resources plus r04 SCOUT repair. Their latest packet and exclusive module hashes are pinned in packet.json. Primary review records are referenced there; this owner does not self-approve those resources.

All ordinary windup/attack/trigger/recover boundaries return to the base geometry. Decorative sway follows Frame.time. An interruption immediately adopts the supplied new pose without an actor cache; primary explicitly excluded smooth interruption blending. Runtime manifest is compact; full source trace remains in `manifest.json`. Snapshot modules and 288 canonical public files are immutable inside this submission. Earlier r01/r02/r03 sealed files are hash-checked and preserved.

Primary aggregate visual acceptance, actual game integration, skill timing, world effects, desktop layouts and performance remain integration/QA gates. Standalone API checks do not claim those gates passed.

Primary inspected the final 12 SENTINEL images and accepted the feet/far-pad preflight repair before sealing. SCOUT's data repair is approved in enemy-batch-r04.md. These preflight results do not replace formal aggregate or actual game QA acceptance.
