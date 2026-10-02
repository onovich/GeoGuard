# r04 additive shape morph contract for Boss A

Primary may forward this exact additive contract to Boss A for its new r03 exclusive data revision. This owner does not edit bossRigDataA.js. The shared sampler accepts a rig-level plain `shapeMorphs` object, inherited by the selected variant:

```js
shapeMorphs: {
  'single-top-shell': {
    fromD: 'M... C... C... C... C... Z', // fitted closed shell, existing r02 coordinates
    toD: 'M66.4 159.12 C69.92 112.48 91.04 86.08 128 86.08 C164.96 86.08 186.08 112.48 189.6 159.12 C172.88 156.92 150.66 155.82 128.33 155.82 C106 155.82 83.56 156.92 66.4 159.12 Z',
    poses: ['attack'], curve: 'sin2',
  },
},
```

Both paths must have exactly the same sequence of uppercase commands and argument counts. All coordinates already use fitted source space, not the pre-fit authored geometry. If the worker adds the field before its fitting helper, the helper must transform fromD/toD identically; otherwise add shapeMorphs after fitRig. Closed shell fromD must be copied from the exported fitted neutral shape. The toD above is the exact fitted raised shell with its last cubic split at t=.5, preserving the original curve. IDs are unique and stable across variants. Keep all connector/face/body/feet paths and R/C0/r0 unchanged.

During attack, weight=sin(pi*clamp(poseProgress,0,1))². Sample each numeric path coordinate as from+(to-from)*weight. Attack starts closed, reaches the exact approved raised shell at 0.5 and ends closed, matching neutral/windup/recover source geometry. The attachment column remains present behind the shell; both use the same fixed-root body matrix. No extra timer, world translation, alpha crossfade, organ duplication or engine state.

The sampler traces interpolated numeric commands directly in Canvas; it creates no per-frame Path2D. Static source paths still precompile. SVG export serializes the same interpolated commands. Primary QA should sample progress 0,.125,.25,.375,.5,.625,.75,.875,1, verify R/C0 invariant, zero shell difference at transition endpoints, exact target at .5, and connector contact at intermediate samples.

Shared soft-body and part angle windup weights in r04 now use sin(pi*progress), returning to neutral at both ends. Attack already has this endpoint property. This removes windup1→attack0 and attack1→recover0 matrix jumps across all identities without adding view clocks. Paused inputs are deterministic; interruption immediately selects the new actual pose with no leftover animation or global cache. A deliberately interrupted mid-pose can immediately reset the deformation; smooth interruption blending, if desired by primary, would require an integration sidecar previous-pose DTO and separate approval. This revision does not claim that optional blend has been implemented.
