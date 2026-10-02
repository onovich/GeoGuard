# Character group rig output contract, schema 1

This contract is proposed for primary review. It does not authorize the group workers to write until the primary approves it. The eight formal samples remain this owner's current delivery. Source provenance and action mapping follow the approved integration r01 contract, SHA256 b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba.

## Exclusive files and identities

| Worker | Exclusive module | Named export | Identities |
|---|---|---|---|
| Boss A | `src/view/art/characters/bossRigDataA.js` | `BOSS_RIGS_A` | boss:COMMANDER, HUNTER, FORTRESS, PRISM, FROST_JUDGE, RAIL_WARLORD, COLLECTOR, TWINS_SUN |
| Boss B | `src/view/art/characters/bossRigDataB.js` | `BOSS_RIGS_B` | boss:TWINS_MOON, DRAGON, SPIDER_MATRIARCH, ASTROLABE, BLOOD_FORGE, VOID_CONDUCTOR, LABYRINTH_KEEPER, NIGHTMARE_BLOOM |
| Enemies | `src/view/art/characters/enemyRigData.js` | `ENEMY_RIGS` | enemy:FAST, TANK, SPLINTER, SHIELD, MEDIC, BOMBER, JAMMER, PHASE, BURROWER, BEACON, SCOUT, SIEGE |

Each export is a plain object keyed by full `domain:ID`. Workers may write only their assigned module, approved group documentation directory, and `public/art/characters/v1/boss/<lowercase-id>/` or `enemy/<lowercase-id>/` directories for the identities above. Use the exact `resourceSlug` from integration identity-map.json. No worker changes rig.js, rigData.js, manifest.js, index.js, shared helpers, dependency files, engine, renderer, data, or another identity. Workers do not import rigData.js, which will import their modules during this owner's final merge. This owner retains HIVE, BASIC, SHARD, all friendly characters, all seven mechanics, runtime API, registry, sample assets and final merge.

## Serializable rig format

```js
export const BOSS_RIGS_A = {
  'boss:COMMANDER': {
    root: [128, 232], center: [128, 140], collisionRadius: 104,
    referenceRadius: 29, softPivot: [128, 232],
    shapes: [
      {id: 'body', d: 'M… C… Z', fill: 'coral', stroke: 'brown', width: 4.5},
      {id: 'eye', ellipse: [128, 120, 7, 10], fill: 'brown', stroke: null, width: 0},
    ],
    joints: {'eye': [128, 120]},
  },
};
```

Example coordinates are schematic; measure each rig's approved source independently. All source canvases are 256 by 256 and stay untrimmed for body animation. Shapes are ordered back to front. Supported path commands are absolute uppercase M, L, C, Q, Z, with explicit commands and finite numeric coordinates. Exactly one of `d` or `ellipse:[cx,cy,rx,ry]` is present. Fill/stroke may be literal CSS hex or one of brown, sage, sageLight, sageShade, coral, coralLight, coralShade, cream, honey, honeyLight, greenDark, pink. A line has fill:null. Shape ids must be unique within each pose. No text, images, DOM, randomness, callbacks, imports from runtime engine, or baked external effects.

The root R, logical collision center C0, radius r0 and reference runtime radius are measured numeric values. Set softPivot=R. Whole-body scale is actor.radius/r0. The shared sampler maps C0 to actor.x/y and fixes R during deformation. Body rotation remains zero. Whole-rig left reflection includes every part and muzzle. `space:'fixed'` preserves ground contacts under body deformation; ids of contact joints start with `foot-`. A face normally inherits body deformation, with no fixed-space eyes or mouth.

Optional `mirrorX:true` reflects the shape about source x=128. Optional `partId` selects a transform declared below. Name joints for every actual organ, attachment and tip needed for audit; contour organs may have joints without independent shape paths. Fixed organ counts and silhouette follow the identity anatomy contract, not this example.

## Local articulated parts and variants

```js
partTransforms: {
  'ear-left': {
    pivot: [96, 64], rigid: false,
    angleByPose: {windup: -.12, attack: .08},
    sway: {amplitude: .03, period: .72}, angleMin: -.2, angleMax: .2,
  },
},
variants: {phase2: {shapes: [], joints: {}, partTransforms: {}}},
poseVariants: {broken: 'brokenPose'},
phaseVariants: {2: 'phase2'},
abilityVariants: {exactRuntimeAbilityKey: {windup: 'windupPose', attack: 'attackPose'}},
```

Every `partId` must have a matching part transform and pivot, and all artwork attached to that part uses the same transform. Soft parts inherit body deformation and then local rotation. Rigid parts attach to the deformed joint but retain uniform dimensions. Angles are radians; windup uses sin(progress*pi/2), attack uses sin(progress*pi); sway uses poseTime. No timer or game-state mutation. Variants replace only shapes/joints/partTransforms, retaining R/C0/r0/source size. Ability selector precedence is ability+pose, then pose, then phase. Phase indices and ability keys must match approved runtime evidence; do not invent keys. Static variants alone do not establish continuous transitions: workers must show the intermediate poses and flag any unsupported transition for this owner.

Optional `brokenShapes` replaces all shapes in broken/fade. `brokenMode:'replace-body'` plus `replaceBodyId` replaces only one body shape, preserving legal face/contact parts. Fragment count is identity-specific. Fade is alpha only; summons/children/projectiles are independent actors, never silhouettes baked into the parent body.

## Delivery and validation

Provide editable source, transparent neutral source PNG, named organ audit, source R/C0/r0/P coordinates, fixed-root neutral/squash/stretch and approved action previews, and actual runtime-radius PNG contact sheet. Include right/left and relevant approved up projection, phase/ability key mappings, independent child identities, source paths/SHA256 and exact approved action-cell references in the group's immutable packet. Keep all upstream audit excerpts in docs, not the runtime module. PNG body frames stay untrimmed; static icons may use a separate measured crop.

Validate all declared paths, finite matrices, organ counts, root invariance, face attachment, phase/ability selection and zero input mutation. Public assets must have transparent background and no shadows, hit effects, OPEN badge, HUD, summoned bodies, hazard or level decorations. Body disappearance and external OPEN overlays follow existing runtime windows. Do not claim gameplay integration or complete identity coverage from artwork previews. The primary approves packets; this owner imports named group exports, regenerates the compact manifest and verifies the combined API afterward.
