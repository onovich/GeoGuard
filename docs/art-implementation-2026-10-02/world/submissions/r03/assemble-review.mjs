import {readFileSync,writeFileSync,readdirSync,mkdirSync,copyFileSync,statSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const out=dirname(fileURLToPath(import.meta.url)), root=resolve(out,'../../../../..');
const rel=p=>relative(root,p).replaceAll('\\','/');
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(name,value)=>writeFileSync(resolve(out,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n','utf8');
const oldPath=resolve(out,'../r02/packet.json'),old=read(oldPath);
assert.equal(hash(oldPath),'0483636f0462c5a2374baa70ccbb421cf2d2f7f6de525d438cb3dfb73cda34da');
const immutable=old.files.filter(f=>!f.path.startsWith('src/view/art/world/'));
for(const f of immutable)assert.equal(hash(resolve(root,f.path)),f.sha256,'preserved r02 '+f.path);
write('preservation-audit.json',{status:'passed',acceptedPacket:rel(oldPath),acceptedPacketSha256:hash(oldPath),immutableFilesChecked:immutable.length,acceptedPngsChecked:immutable.filter(f=>f.path.startsWith('public/art/world/v1/')).length,files:immutable});
const code=resolve(root,'src/view/art/world'),snapshot=resolve(out,'editable/world');mkdirSync(snapshot,{recursive:true});
for(const name of readdirSync(code).filter(n=>n.endsWith('.js')))copyFileSync(resolve(code,name),resolve(snapshot,name));
const dependencies=[
 'docs/art-implementation-2026-10-02/integration/submissions/r01/packet.json',
 'docs/art-implementation-2026-10-02/integration/submissions/r02/status-api-addendum.md',
 'docs/art-implementation-2026-10-02/reviews/hit-source-and-status-addendum.md',
 'docs/art-implementation-2026-10-02/reviews/world-r02.md',
 'src/view/art/integration/presentationRuntime.js',
 'src/logic/engine/gameState.js','src/logic/engine/encounterRuntime.js','src/data/gameConfig.js',
 'src/logic/engine/combatOffenseRuntime.js','src/logic/engine/combatFrameRuntime.js','src/logic/engine/combatRules.js'
].map(path=>({path,bytes:statSync(resolve(root,path)).size,sha256:hash(resolve(root,path)),ownership:'read-only dependency; not world-owned production'}));
write('dto-bindings.json',{status:'approved_fields_consumed_and_actual_pipeline_fixture_passed',observedAt:new Date().toISOString(),dependencies,fields:{jammed:'living actor + states.jammed === true, copied from injected real getTowerFireRateFactor query with only frozenTimer disabled on query copy',healing:'living actor + healAura.active === true + finite positive range + nonempty actual eligibleTargetKeys; ongoing eligibility only, no success claim',fusing:'living actor + fuse.active === true + finite positive remaining/duration; clamp(1-remaining/duration); local radius actor.radius+5; fuse.radius never drawn',hit:'feedback hit reads scalar projectileKind first, else sourceArtId/sourceKey mapping, else existing kind fallback; data captured from actual direct/splash callbacks'},pipelineEvidence:'adapter-pipeline-validation.json',mutableEntityReferencePassedToWorld:false});
const coverage=read(resolve(out,'../r02/coverage.json'));
coverage.status='produced_with_approved_qualification_DTO_bindings_single_fixture_verified';
for(const cell of coverage.cells){
 if(cell.cell==='B02/S04')cell.status='jam_produced_actual_qualification_DTO_matched_fixture_passed';
 if(cell.cell==='B02/S15')cell.status='intro_preserved_heal_fuse_produced_approved_DTO_matched_fixture_passed';
 if(cell.cell.startsWith('R01/HIT_'))cell.status='produced_actual_source_callback_DTO_draw_fixture_passed_full_QA_pending';
}
coverage.revision='r03';coverage.inheritedCoverage='r02 coverage.json';coverage.runtimeAcceptance=false;
coverage.actualPipeline={status:'single_fixture_passed',sourceIdentities:10,trueDamageCallbacks:17,hitFamilies:3,evidence:'adapter-pipeline-validation.json'};
coverage.runtimeSkillsExecuted=0;write('coverage.json',coverage);
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.WORLD_CANVAS_MODULE??'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const exports=read(resolve(out,'neutral-exports.json')).newExports, audits=[];
for(const f of exports){
 const p=resolve(root,'public',f.path),img=await loadImage(p);assert.equal(img.width,256);assert.equal(img.height,256);
 const c=createCanvas(256,256),ctx=c.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,256,256).data;
 let minX=256,minY=256,maxX=-1,maxY=-1,pixels=0;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(data[(y*256+x)*4+3]){pixels++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
 assert.ok(pixels>0);assert.ok(minX>0&&minY>0&&maxX<255&&maxY<255);
 assert.equal(data[3],0);assert.equal(data[(255*256+255)*4+3],0);
 audits.push({name:f.name,path:rel(p),sha256:hash(p),dimensions:[256,256],collisionCenterPx:f.collisionCenterPx,alphaBounds:[minX,minY,maxX,maxY],nonzeroAlphaPixels:pixels,transparentCorners:true,clipping:false,sourceSizeMeaning:'neutral overlay-only fixture; world units 1:1, character root [128,144] and supplied body bounds [114,110,28,34]'});
}
write('anchor-audit.json',{status:'passed',newExports:audits,preservedV1:'preservation-audit.json',estimatedNewTextureBytes:3*256*256*4,runtimeTextureBytes:0});
write('build-validation.json',{command:'npm run build',exitCode:0,status:'passed',modulesTransformed:103,observed:'completed during this r03 revision before sealing; no production source changes afterward',warnings:['characters/index.js imported dynamically and statically','output chunk exceeds 500 kB'],architecture:{command:'npm run check:architecture',exitCode:0,passedTests:11,log:'architecture.log'},fullGameplayDifferential:false});
write('production-notes.md',`# World r03 production addendum

The accepted r02 world art is preserved. This revision completes the three outstanding eligibility displays and verifies the true projectile source reaching existing hit drawers. Production uses editable Canvas vectors; the three new transparent neutral PNGs are review/export resources. The public API remains the same eight exports and schema version 1.

## Added displays

- B02/S04 JAM: dual purple waves and an external X. Requires a living actor and the approved states.jammed flag. Freeze and JAM can coexist.
- B02/S15 healing: sparse sage arcs at the actual healAura.range and an external plus. Requires active true eligibility with at least one eligibleTargetKey. It denotes an ongoing eligible aura; it does not assert successful healing this frame.
- B02/S15 fuse: a small honey clock around the living source at actor.radius + 5. Progress is clamped from actual positive remaining/duration. The explosion radius is unused in drawing; missing, expired or invalid timing draws nothing.

No identity-based eligibility or alternate guessed fields are used. Qualifications flow through the existing status-pass ActorOverlay call. Existing r02 OPEN, ROOT, background, projectiles, hazards and feedback are unchanged apart from delegating qualifications to the new helper and recording v2 resources in the manifest.

## Source hit proof

The integration addendum and its main review approve the two existing direct/splash damage callbacks supplying projectile as a third parameter. World receives copied scalar metadata through the presentation sidecar. World did not edit engine, hooks, integration or character files. Existing feedback consumes explicit projectileKind first and source mapping second, retaining its generic fallback.

verify-adapter-pipeline.mjs imports the actual state/entity factories, offense producers, projectile update, damage resolver and presentation adapter. Its single fixture produces 10 source identities, observes 17 real damage callbacks and 17 corresponding hit events across three existing families, and checks copied source keys and shot indices. Draws preserve fixture state; sidecar errors are zero. This proves this producer/callback/DTO/draw fixture only.

## Verification and resources

- verify-production.mjs: eight API exports, 10 distinct projectile samples, read-only frozen DTO draws, Canvas state restoration, real capsule/disk footprints, negative world-coordinate consistency and supplied muzzle anchor reuse pass.
- verify-qualifications.mjs: three qualified overlays, 12 unqualified cases, real aura range, no filled heal disk, local fuse independent of explosion radius, clamped countdown, pause determinism, 10 source bindings and explicit kind precedence pass.
- verify-adapter-pipeline.mjs: actual engine/adapter/world fixture passes as scoped above.
- npm run build passes (103 transformed modules). It retains character static/dynamic import and bundle-size warnings. npm run check:architecture passes all 11 tests; log included.
- Actual final production preview was inspected with view_image. It intentionally shows overlay-only samples rather than fabricated character bodies.
- The three v2 PNGs are 256 × 256, transparent, collision center [128,128], unclipped. Alpha bounds and hashes are in anchor-audit.json. Estimated texture allocation if loaded is 786,432 bytes; vector runtime loads no PNG texture.
- The accepted r02 packet and every immutable r02 document/export hash were rechecked. All 34 v1 PNGs are unchanged. Eleven current world source files are snapshotted under editable/world.

The previous negative-coordinate probe records exact world-operation equality, with 88 differing native antialias channels out of 462,000 (maximum 4/255); it is not a claim of byte-perfect native antialiasing. Hazard footprints allow the recorded 1.1 px native antialias fringe.

## Remaining acceptance work

Qualification DTO and true source-hit gaps are resolved for this fixture. Complete baseline frame differentials, same-frame disappear/penetration/splash/multiple-shot QA, full browser/DPR gameplay, character body/muzzle integration, crowded/performance validation, cleanup and actual execution of the 95 mapped standard/survivor skills remain integration/QA acceptance work. S08 body masking remains character-owned; S12/S14 labels remain integration-owned. This packet does not claim complete gameplay or final runtime acceptance.

Published revisions are immutable. Do not rerun the included output-writing scripts against a sealed r03; copy them into a new revision for further work.
`);
write('index.html',`<!doctype html><meta charset="utf-8"><title>World r03</title><style>body{margin:32px;background:#fff9ef;color:#4e2e20;font:16px system-ui}img{max-width:100%;height:auto}a{color:#587f68}</style><h1>World r03 qualification and source hit review</h1><p><a href="production-notes.md">Production notes</a> · <a href="dto-bindings.json">Approved DTO bindings</a> · <a href="adapter-pipeline-validation.json">Actual pipeline evidence</a> · <a href="anchor-audit.json">Alpha and anchors</a> · <a href="coverage.json">Coverage</a></p><img src="qualifications-production.png" alt="Actual qualification and hit drawer samples"><p>Overlay-only sampler; full gameplay acceptance remains integration and QA work.</p>`);
console.log(JSON.stringify({status:'assembled',immutableFilesChecked:immutable.length,sourceFiles:readdirSync(snapshot).length,newExports:audits.length}));
