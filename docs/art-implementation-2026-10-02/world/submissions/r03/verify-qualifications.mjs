import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require=createRequire(import.meta.url);
const {createCanvas,Path2D}=require(process.env.WORLD_CANVAS_MODULE ?? 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
globalThis.Path2D=Path2D;
const W=await import('../../../../../src/view/art/world/index.js');
const {assets}=await W.loadWorldArt();
function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
const frame=freeze({schemaVersion:1,epoch:2,time:12,dt:0,paused:true,quality:'full',viewport:{width:300,height:300,dpr:1},camera:{x:0,y:0}});
const anchor=freeze({root:{x:150,y:168},bounds:{x:135,y:132,width:30,height:36}});
const base={x:150,y:150,radius:12,hp:20,alpha:1,states:{}};
function overlay(fields={}){
  const c=createCanvas(300,300),ctx=c.getContext('2d'),actor=freeze({...base,...fields});
  const before=JSON.stringify(actor);ctx.globalAlpha=.6;ctx.setLineDash([3,9]);ctx.shadowBlur=7;
  const original=ctx.globalAlpha;
  W.drawActorOverlay(ctx,actor,anchor,frame,assets,'status');
  assert.equal(JSON.stringify(actor),before);assert.equal(ctx.globalAlpha,original);assert.deepEqual(ctx.getLineDash(),[3,9]);assert.equal(ctx.shadowBlur,7);
  return {png:c.toBuffer('image/png'),px:ctx.getImageData(0,0,300,300).data};
}
const empty=overlay().png;
const invalid=[
  {artId:'enemy:JAMMER'},{artId:'enemy:MEDIC',healAura:{range:118}},{artId:'enemy:BOMBER',fuse:{remaining:.2}},
  {healAura:{active:true,range:118,eligibleTargetKeys:[]}},{healAura:{active:true,range:NaN,eligibleTargetKeys:['real-target']}},
  {healAura:{active:false,range:118,eligibleTargetKeys:['real-target']}},{healAura:{active:true,range:0,eligibleTargetKeys:['real-target']}},
  {fuse:{active:true,remaining:null,duration:.8}},{fuse:{active:true,remaining:.2,duration:Infinity}},
  {fuse:{active:false,remaining:.2,duration:.8}},{fuse:{active:true,remaining:0,duration:.8}},
  {hp:0,states:{jammed:true},healAura:{active:true,range:118,eligibleTargetKeys:['real-target']},fuse:{active:true,remaining:.2,duration:.8}},
];
for(const fields of invalid)assert.deepEqual(overlay(fields).png,empty,'no unqualified/incomplete/retired source overlay');
const qualified=[{states:{jammed:true}},{healAura:{active:true,range:118,amount:6,eligibleTargetKeys:['real-target']}},{fuse:{active:true,remaining:.24,duration:.8,radius:78}}];
for(const fields of qualified){assert.notDeepEqual(overlay(fields).png,empty);assert.deepEqual(overlay(fields).png,overlay(fields).png,'paused/fixed DTO deterministic');}
assert.deepEqual(overlay({fuse:{active:true,remaining:2,duration:.8}}).png,overlay({fuse:{active:true,remaining:.8,duration:.8}}).png);
assert.deepEqual(overlay({fuse:{active:true,remaining:.24,duration:.8,radius:999}}).png,overlay({fuse:{active:true,remaining:.24,duration:.8,radius:78}}).png,'explosion configuration radius is never drawn');
const fuse=overlay({fuse:{active:true,remaining:.24,duration:.8,radius:78}}).px;
let farFusePixels=0;
for(let y=0;y<300;y++)for(let x=0;x<300;x++)if(fuse[(y*300+x)*4+3]>0&&Math.hypot(x+.5-150,y+.5-150)>22)farFusePixels++;
assert.equal(farFusePixels,0,'local fuse clock never draws explosion-radius circle');
const healFields={healAura:{active:true,range:118,amount:6,eligibleTargetKeys:['real-target']}};
const heal=overlay(healFields).px;
assert.equal(heal[(150*300+150)*4+3],0,'no filled disk or successful healing flash at source center');
assert.ok(heal.some((v,i)=>i%4===3&&v>0),'eligible source has sparse aura');
const shifted=overlay({healAura:{...healFields.healAura,range:72}});assert.notDeepEqual(shifted.png,overlay(healFields).png,'actual aura radius consumed, no fixed 118');
const kindBySource={'hero:PLAYER':'basic','tower:BASIC':'basic','tower:CANNON':'cannon','tower:SNIPER':'sniper','tower:RAPID':'basic','tower:MORTAR':'cannon','tower:FROST':'basic','tower:RAIL':'sniper','tower:BURST':'basic','tower:SENTINEL':'basic'};
function hit(sourceArtId,kind,withKind=true){const c=createCanvas(64,64),ctx=c.getContext('2d');const dto=freeze({kind:'feedback',x:32,y:32,sourceArtId,data:{type:'hit',time:11.94,sourceArtId,...(withKind?{projectileKind:kind}:{})}});assert.equal(W.drawWorldItem(ctx,dto,frame,assets).drawn,true);return c.toBuffer('image/png');}
for(const [source,kind] of Object.entries(kindBySource))assert.deepEqual(hit(source,kind),hit(source,kind,false),'explicit true source routes to its existing three-family kind');
const families=['basic','cannon','sniper'].map(kind=>hit(null,kind).toString('base64'));
assert.equal(new Set(families).size,3);
// An explicit runtime kind takes precedence over the static source fallback.
assert.deepEqual(hit('tower:BASIC','cannon'),hit('tower:CANNON','cannon'));
const report={status:'passed_readonly_qualification_and_source_hit_checks',qualifiedOverlays:3,unqualifiedCases:invalid.length,sourceHitBindings:10,hitFamilies:3,explicitKindPrecedence:true,actualAuraRadiusConsumed:true,localFuseNoBlastRadius:true,clampedFuseProgress:true,pausedDeterminism:true,deepFrozenDtoUnchanged:true,contextStateRestored:true,notGameplayExecution:true};
writeFileSync(new URL('qualification-validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
