# Characters r03: eight formal editable samples

Status: ready for primary review. This packet supplies production source and the public schema-1 API for PLAYER, BASIC/BURST towers, BASIC/SHARD enemies, HIVE, NEST and SEAL. Eight identities and 56 reference mappings are produced pending review. The registry preserves all 48 identities and 375 action mappings; 40 identities and 319 references remain not produced and explicitly fall back. No gameplay integration, desktop performance, full coverage or primary acceptance is claimed.

## Review files

- poses-contact-sheet.png: native drawCharacter API, untrimmed 256px bodies, four source poses for each identity.
- runtime-size-contact-sheet.png: actual reference radius at one world unit per pixel; the separate 2x version is inspection enlargement.
- directions-anchors-contact-sheet.png: neutral/squash RIGHT/LEFT/UP, visible root R, logical center C, attachment P and muzzles M.
- shot-axis-flash-contact-sheet.png: 12 RIGHT/LEFT/UP/diagonal scenarios using the current read-only world feedback API. The blue line shows the logical shot axis starting at unchanged C; flashes draw at M. This is standalone API composition, not a simulated gameplay frame.
- hit-flash-contact-sheet.png: actual hitFlash values 0, 1/3, 2/3, 1, applied to all body fills/strokes with unchanged alpha mask and anatomy.
- anchor-audit.json, feedback-audit.json and verification.json: numeric and pixel evidence, with backend scope.
- qa-action-inputs-375.json and qa-inputs.md: exact reference-to-Actor/Frame inputs and 95 current ability sampling inputs, produced/pending/historical distinctions.
- rig-data-output-contract.md: stable contract approved by primary in reviews/character-group-contract.md. Three delegated group modules remain separate work and are not imported in this sample packet.

## Runtime implementation

`index.js` exports CHARACTER_ART_SCHEMA_VERSION, characterManifest, resolveCharacterArtId, getCharacterIcon, loadCharacterArt, drawCharacter and getCharacterAnchors. Module imports are DOM-free. The loader precompiles editable paths and returns partial with eight available identities and 40 not-produced errors. Body drawing has no network/bitmap decode dependency. Static SVG icons are measured cropped views with BASE_URL-safe URLs. Each public identity includes source.svg, body.svg, body.png, icon.svg, icon.png and rig.json. PNG backgrounds are transparent. Body animation retains the complete 256px source canvas.

The shared rig sampler fixes R during nonuniform soft-body deformation, maps C0 to actor.x/y and scales by radius/r0. Faces follow soft bodies. Ground contacts are fixed. Entire-rig reflection includes every organ, P and M. Cannon placement follows the deformed mount while preserving rigid dimensions; BURST keeps four equal bores in one plane. BASIC UP uses the approved vertical tube; BURST UP retains the approved oblique plane. M.axisAngle returns the true Actor.aimAngle, separate from the visible projection angle. Shot snapshot anchors must be sampled with event.angle; simulation projectile birth stays at logical C.

HIVE keeps two ears, five skirt lobes, two closed eyes and three fixed apertures. Its phase body and OPEN recover reuse are explicit; child resources remain separate. NEST has three body lobes, two teeth, one tongue and two fixed contacts; broken/fade uses separated lobes. SEAL breaks from two opposed claws into four fragments. SHARD split retains the pre-split body; SPLINTER child production is pending. PLAYER has one droplet and leaf with no added face, limbs or launcher.

S08 modulates the full body palette toward cream from the actual hitFlash value, quantized to 1/32 and cached. It creates no geometry, timers, translation or simulation writes. External shadows, muzzle flashes, projectiles, summons, hazards, OPEN badge, level badge, HP and HUD remain outside body source.

The runtime manifest is 167,912 bytes, reduced from the preliminary approximately 498 KB. It retains source catalogs and exact per-action source-cell indices, part/anchor/count data, and production status. Full repeated source excerpts and provenance are preserved in manifest.json and the source coverage packet rather than shipped in each runtime action.

## Validation and limits

All standalone scripts exited 0: build-production.mjs, render-and-validate.mjs, render-feedback-audit.mjs and build-qa-inputs.mjs. The art/API checks cover 792 source-root samples, move seam, fixed contacts, logical center, rigid barrel basis, whole-rig M reflection, equal four bores, transparent boundaries, immutable input DTOs, context restoration, resolver/tier/unknown handling, abort/fallback, DOM-free import and the no-Path2D tracing fallback. The current native Canvas backend leaves fillStyle/strokeStyle getters stale after restore; restored paint was verified by actual pixel color instead. Browser/gameplay context behavior remains a separate integration QA gate.

Source and public assets are copied into this packet's runtime-snapshot and public-snapshot folders before sealing. These copies remain immutable when later approved revisions change deployment files. packet.json also records current workspace deployment hashes. The packet excludes the independently owned world files; feedback-audit records their read-only hashes as dependencies. No Git, engine/data/config/package/renderer/UI mutation was performed by this owner.

Reproduction while unsealed: run build-production, render-and-validate, render-feedback-audit, build-qa-inputs in that order. After READY, do not run these builders in r03; repairs or expansion require a new revision. Primary review determines production acceptance and G2 sample integration. The approved group workers' 28 identities are parallel production work, not coverage accepted by this packet.
