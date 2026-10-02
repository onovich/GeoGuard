import { P } from './palette.js';
import { referenceSources } from './referenceSources.js';

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
  schemaVersion:1, version:'v1', status:'produced_pending_review', renderMode:'compiled-vector',
  sourceFile:'src/view/art/world/vectors.js', anchorsMeasured:true,
  referenceSources,
  background:{ source:'docs/art-direction/sticker-bible-2026-10-01/scene-ui-2026-10-02/background/submissions/r02/bg01-clean-background.png', color:P.cream, cellSize:[360,225], patchProbability:.8, grassProbability:.4, coordinateSpace:'world', seamless:true },
  projectiles:Object.fromEntries(Object.entries(shotStyles).map(([artId,s]) => [artId,{
    artId, source:source+'b01-friendly-projectiles.png', cell:'B01/'+s.cell, kind:s.kind,
    sourceSize:{width:64,height:64}, centerPx:[32,32], localAxisRadians:0, anchorsMeasured:true,
    collisionRadiusPx:s.kind==='cannon'?7:s.kind==='sniper'?3:4,
    visualScaleMode:'actual-projectile-radius', shape:s.shape, aspect:[s.rx,s.ry],
    neutralExport:`art/world/v1/projectiles/${artId.split(':')[1].toLowerCase()}.png`,
    hitSource:'R01/HIT_'+s.kind.toUpperCase(),
  }])),
  effects:{ flash:{source:source+'b01-friendly-projectiles.png',pivot:'left rear M; +X forward'},hit:{source:source.replace('r02/','r01/')+'vfx-projectile-flash-hit.png',pivot:'world hit center'},death:{source:source+'b04-mechanic-feedback.png',cell:'M11',body:false},drop:{source:source+'b04-mechanic-feedback.png',cell:'M09',fill:P.mint,stroke:P.green},shadow:{source:source+'b02-status-world.png',cell:'S11',pivot:'measured actor root'} },
  hazards:{source:source+'b03-hazard-lifecycle.png',area:'real filled disk',line:'finite capsule with half-width=width',passes:['fill','boundary'],lifecycle:'timer>0; fade only existing transient'},
  overlays:{source:source+'b02-status-world.png',passes:['shadow','status'],noLabels:true},
  supportedItems:['projectile','drop','particle','impactWave','feedback','link'],
  eventTypes:['shot','hit','defeat','summon-success','split-success','refund'],
  sharedContract:'docs/art-implementation-2026-10-02/integration/submissions/r01/module-api.md',
});
