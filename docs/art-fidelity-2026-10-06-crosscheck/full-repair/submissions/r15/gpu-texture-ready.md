# R15H source texture transport candidate

Same runtime entries: `freeaim-source-runtime.html` (AA extreme/noncardinal subset only, direction jumps remain rejected), `density-performance-runtime.html` (same720 declared density), optional actualnormal profile for separate scope.

`sourceTextureMesh.js` submits the existing piecewise-affine mapped triangles in one WebGL texture draw. SourceUV samples exact registered PNG, same mapper/active-alpha coverage, same world/output positions. Fragment shader only texture2D; no generated contour, fill, artwork or additional geometry. Canvas copy caches12 exact-angle compositions; no angle quantization. Original alpha bounds/M use unchanged map. Final single drawImage retains actual hitFlash image filter/alpha. Source grid vertices/UV map unchanged, two numerical head/sole/map tests pass.

Composition target reduced2×→1× source resolution, still full texture composed before world sampling; needs native extreme-AA visual recheck. Optional WebGL unavailable/compile failure returns the existing approved source-PNG Canvas triangle transport, never old rig art; backend status is explicit `sourceTextureBackend` in final density receipt (also read-only getSourceTextureBackend export). No resource decode failure masked by this optional transport selection.

Original rig-shape bounds are now skipped when actual source-alpha bounds replace them; functional joints/root still same transformations. No collision or core rules change. No build/dist overwrite. Request same density and selected AA review; this is not a direction-jump solution or final perf approval.
