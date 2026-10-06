import { P } from './palette.js';
import { referenceSources } from './referenceSources.js';
import {originalEffectsData} from './originalEffectsData.js';

const source = 'docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/effects-ui/submissions/r02/';
export const shotStyles = Object.freeze({
  'hero:PLAYER': { cell:'P01', kind:'basic', shape:'seed', fill:P.honey, shade:P.honeyShade, rx:1.125, ry:.65 },
  'tower:BASIC': { cell:'P02', kind:'basic', shape:'seed', fill:P.mint, shade:P.mintShade, rx:1, ry:1 },
  'tower:CANNON': { cell:'P03', kind:'cannon', shape:'seed', fill:P.mint, shade:P.mintShade, rx:1, ry:1 },
  'tower:SNIPER': { cell:'P04', kind:'sniper', shape:'lance', fill:P.mint, shade:P.mintShade, rx:4, ry:1 },
  'tower:RAPID': { cell:'P05', kind:'basic', shape:'seed', fill:P.mint, shade:P.mintShade, rx:1.4, ry:.675 },
  'tower:MORTAR': { cell:'P06', kind:'cannon', shape:'seed', fill:P.coral, shade:P.coralShade, rx:1, ry:1 },
  'tower:FROST': { cell:'P07', kind:'basic', shape:'seed', fill:P.ice, shade:P.iceShade, rx:1.55, ry:.725 },
  'tower:RAIL': { cell:'P08', kind:'sniper', shape:'lance', fill:P.lavender, shade:'#AA98C9', rx:5, ry:.9 },
  'tower:BURST': { cell:'P09', kind:'basic', shape:'seed', fill:P.mint, shade:P.mintShade, rx:1.55, ry:.7, coralTip:true },
  'tower:SENTINEL': { cell:'P10', kind:'basic', shape:'seed', fill:P.sage, shade:P.sageShade, rx:1.25, ry:.8 },
});

export const worldManifest = Object.freeze({
 schemaVersion:1,version:'source-pixels-2026-10-06',status:'produced_pending_review',
 renderMode:'decoded-original-source-PNG + explicitly functional geometry',
 sourceFile:'src/view/art/world/originalEffectsData.js',referenceSources,
 actualRuntimeImages:originalEffectsData,
 provenanceDirectory:'docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/',
 background:{source:'docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/background/submissions/r02/bg02-ground-layers.png',runtime:['ground:cream-base-tile','ground:mint-patch','ground:cream-patch','ground:grass-a','ground:grass-b'],patchCell:[360,225],patchProbability:.8,grassCell:[240,180],grassProbability:.55,coordinateSpace:'world',sourceTileRepeat:true},
 projectiles:Object.fromEntries(Object.entries(shotStyles).map(([artId,s])=>[artId,{artId,originalReference:source+'b01-friendly-projectiles.png',classification:'formal original-concept AI-edited atlas; not untouched crop',cell:'B01/'+s.cell,kind:s.kind,runtime:originalEffectsData[artId+'|bullet'],flashRuntime:originalEffectsData[artId+'|flash'],logicalBirth:'actual source-muzzle birth with centre-to-muzzle live-hurtbox clamp; hero nominal centre emitter; explicit timing change, awaiting runtime acceptance',collision:'unchanged live logical item.radius, never image bounds',velocity:'unchanged live logical velocity',sourceRecord:'public/art/original/v1/effects/friendly-fx-source.json'}])),
 effects:{hit:{runtimeKeys:['world:impact-onset','world:impact-peak','world:impact-fade'],pivot:'real hit point'},death:{runtimeKeys:['world:chip-coral-a','world:chip-coral-b','world:chip-brown','world:chip-coral-c'],body:false,independentEntity:false},drop:{runtimeKey:'ui:gem',eligibility:'state.drops only'},refund:{runtimeKeys:['ui:gem','world:refund-rays'],amount:'real event.amount > 0; dynamic text',independentPickup:false},shadow:{source:'production-art r02 BURST real shadow crop',runtime:'art/original/v1/root-shadow-ground.png',pivot:'registered actual actor sole/root'},specialAccents:{twinFinisher:'world:accent-twin',dragonFinisher:'world:accent-dragon',spiderFinisher:'world:accent-spider',astrolabeFinisher:'world:accent-astro'}},
 hazards:{source:source+'b03-hazard-lifecycle.png',area:'true logical disk footprint',line:'true finite capsule half-width=item.width',cosmeticImages:['world:web-terrain','world:root-terrain','world:hazard-pulse-inner'],passes:['fill','boundary'],lifecycle:'render exact timer>0; no cosmetic source extends actual hurtbox',terrainClassification:'formal original-concept AI annotation cleanup; original/request/runtime SHA in r11'},
 overlays:{source:source+'b02-status-world.png',passes:['shadow','status'],skinImages:['shield','slow','frozen','jam','armor','phase','burrow','open','enraged','phase-intro-outer'].map(key=>'world:'+key),hitFlash:'source-body alpha brightness only; B02 mask-only dashed rectangle excluded'},
 qualificationOverlays:{jammed:{runtime:'world:jam',fields:['hp','states.jammed']},healing:{runtime:['world:heal-ring','world:heal-plus'],classification:'formal newly generated supplement art, not old B02 crop',fields:['hp','healAura.active','healAura.range','healAura.eligibleTargetKeys']},fusing:{runtime:'ui:clock',fields:['hp','fuse.active','fuse.remaining','fuse.duration'],progress:'functional arc follows exact remaining/duration',ignoredConfiguration:'fuse.radius never creates a danger footprint'},unknownEligibility:'draw nothing; never infer eligibility from identity'},
 functionalGeometryWhitelist:['actual hazard fill/rim with logical radius/width/timer','actual tower placement range and collision radius','fuse countdown progress arc','dynamic health fill','dynamic readable text/numbers','keyboard focus outline and native interactive controls'],
 playerVisualFallback:'none; missing source must remain diagnostic, no ornamental vector renderer',
 supportedItems:['projectile','drop','particle','impactWave','feedback','link'],eventTypes:['shot','hit','defeat','summon-success','split-success','refund'],
 sharedContract:'docs/art-implementation-2026-10-02/integration/submissions/r01/module-api.md',
});
