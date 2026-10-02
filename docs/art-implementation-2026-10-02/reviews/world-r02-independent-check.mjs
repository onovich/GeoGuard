import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const require=createRequire(import.meta.url);
const {createCanvas,Path2D}=require(process.env.WORLD_CANVAS_MODULE ?? 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
globalThis.Path2D=Path2D;
const W=await import('../../../src/view/art/world/index.js');
assert.deepEqual(Object.keys(W).sort(),['WORLD_ART_SCHEMA_VERSION','drawActorOverlay','drawHazard','drawPlacement','drawWorldBackground','drawWorldItem','loadWorldArt','worldManifest'].sort());
assert.equal(W.WORLD_ART_SCHEMA_VERSION,1);
assert.equal((await W.loadWorldArt({signal:{aborted:true}})).status,'failed');
const {assets}=await W.loadWorldArt();
function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
const frame=freeze({schemaVersion:1,epoch:1,time:1,dt:0,paused:true,quality:'full',viewport:{width:400,height:300,dpr:1},camera:{x:-400,y:-300}});
const canvas=createCanvas(250,200),ctx=canvas.getContext('2d');
ctx.globalAlpha=.83;ctx.fillStyle='#123456';ctx.strokeStyle='#654321';ctx.lineWidth=7;ctx.setLineDash([3,8]);ctx.shadowBlur=9;ctx.shadowOffsetX=2;ctx.shadowOffsetY=4;ctx.translate(3,4);
// Bundled native Canvas style getters retain their last assigned JS strings after restore,
// although native paint correctly restores. Probe paint pixels, not those stale getters.
const before={alpha:ctx.globalAlpha,width:ctx.lineWidth,dash:ctx.getLineDash(),shadow:ctx.shadowBlur,ox:ctx.shadowOffsetX,oy:ctx.shadowOffsetY,matrix:[ctx.getTransform().a,ctx.getTransform().b,ctx.getTransform().c,ctx.getTransform().d,ctx.getTransform().e,ctx.getTransform().f]};
const after=()=>({alpha:ctx.globalAlpha,width:ctx.lineWidth,dash:ctx.getLineDash(),shadow:ctx.shadowBlur,ox:ctx.shadowOffsetX,oy:ctx.shadowOffsetY,matrix:[ctx.getTransform().a,ctx.getTransform().b,ctx.getTransform().c,ctx.getTransform().d,ctx.getTransform().e,ctx.getTransform().f]});
function assertStyleRestored(){
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;ctx.setLineDash([]);
  ctx.clearRect(200,150,50,50);ctx.fillRect(210,160,10,10);ctx.beginPath();ctx.moveTo(230,170);ctx.lineTo(230,190);ctx.stroke();
  assert.deepEqual([...ctx.getImageData(215,165,1,1).data],[18,52,86,255]);
  assert.deepEqual([...ctx.getImageData(230,180,1,1).data],[101,67,33,255]);ctx.restore();
}
const actor=freeze({x:40,y:40,radius:14,alpha:.8,shield:12,maxShield:24,hitFlash:.5,pose:'intro',states:{frozen:true,slowed:true,phased:true,armored:true,open:true,partnerFallen:true,jammed:true}});
const anchors=freeze({root:{x:40,y:57},muzzles:[{x:58,y:40,axisAngle:0}]});
const items=[{kind:'drop',x:40,y:40,radius:9},{kind:'particle',x:60,y:40,radius:3,life:1,maxLife:.4,data:{vx:10,vy:20}},{kind:'link',x:20,y:70,x2:120,y2:80,data:{type:'root'}},...['twinFinisher','dragonFinisher','spiderFinisher','astrolabeFinisher'].map(style=>({kind:'impactWave',x:80,y:70,radius:24,life:.1,maxLife:.2,style})),...['shot','hit','defeat','summon-success','split-success','refund'].map(type=>({kind:'feedback',x:60,y:40,alpha:.5,maxLife:.3,sourceArtId:'tower:BASIC',anchors,data:{type,time:.9,angle:0,projectileKind:'basic',childKeys:['actual-child'],amount:12}}))];
const nativeSizes=new Set(),projectileHashes=[];
const savedRandom=Math.random;
Math.random=()=>{throw new Error('World must not consume shared simulation RNG');};
try {
  for(const [id,resource] of Object.entries(W.worldManifest.projectiles)) {
    const dto=freeze({kind:'projectile',x:110,y:80,radius:resource.collisionRadiusPx,sourceArtId:id,data:{kind:resource.kind,vx:20,vy:-30,previousX:105,previousY:82}});
    const original=JSON.stringify(dto);assert.equal(W.drawWorldItem(ctx,dto,frame,assets).drawn,true);assert.equal(JSON.stringify(dto),original);assert.deepEqual(after(),before);assertStyleRestored();
    const c=createCanvas(64,64),cx=c.getContext('2d');W.drawWorldItem(cx,{...dto,x:32,y:32,angle:0,data:{kind:resource.kind,vx:500,vy:0}},frame,assets);
    projectileHashes.push(createHash('sha256').update(c.toBuffer('image/png')).digest('hex'));nativeSizes.add(resource.kind);
  }
  for(const item of items){freeze(item);const value=JSON.stringify(item);assert.equal(W.drawWorldItem(ctx,item,frame,assets).drawn,true);assert.equal(JSON.stringify(item),value);assert.deepEqual(after(),before);assertStyleRestored();}
  for(const pass of ['shadow','status']){assert.equal(W.drawActorOverlay(ctx,actor,anchors,frame,assets,pass).drawn,true);assert.deepEqual(after(),before);}
  for(const kind of ['root','web'])for(const pass of ['fill','boundary']){assert.equal(W.drawHazard(ctx,freeze({type:'area',x:90,y:90,radius:35,timer:.4,maxTimer:1,terrain:true,label:kind==='root'?'poison':'web',mechanicKind:kind}),frame,assets,pass).drawn,true);assert.deepEqual(after(),before);}
  W.drawPlacement(ctx,freeze({x:100,y:100,range:70,radius:14,canPlace:false}),frame,assets);assert.deepEqual(after(),before);
  W.drawWorldBackground(ctx,frame,assets);assert.deepEqual(after(),before);assertStyleRestored();
} finally {Math.random=savedRandom;}
assert.equal(new Set(projectileHashes).size,10);assert.equal(nativeSizes.size,3);

function hazardPixels(h,pass='fill') {
  const c=createCanvas(180,130),cx=c.getContext('2d');W.drawHazard(cx,freeze(h),frame,assets,pass);return cx.getImageData(0,0,180,130).data;
}
function distanceToSegment(x,y,h){const dx=h.x2-h.x,dy=h.y2-h.y,t=Math.max(0,Math.min(1,((x-h.x)*dx+(y-h.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-h.x-t*dx,y-h.y-t*dy);}
let testedNonzeroPixels=0;
for(const h of [{type:'line',x:35,y:35,x2:130,y2:85,width:18,timer:.2,maxTimer:1},{type:'line',x:70,y:70,x2:70,y2:70,width:18,timer:.2,maxTimer:1},{type:'area',x:70,y:70,radius:30,timer:.2,maxTimer:1}]) {
  for(const pass of ['fill','boundary']) {
    const pixels=hazardPixels(h,pass);
    for(let y=0;y<130;y++)for(let x=0;x<180;x++)if(pixels[(y*180+x)*4+3]>2) {
      const d=h.type==='area'?Math.hypot(x+.5-h.x,y+.5-h.y):distanceToSegment(x+.5,y+.5,h);
      assert.ok(d<=(h.radius??h.width)+1.1,'hazard drawing must stay inside true footprint plus AA fringe');testedNonzeroPixels++;
    }
  }
}
const h={type:'line',x:35,y:65,x2:130,y2:65,width:18,timer:.2,maxTimer:1};
const pixels=hazardPixels(h);
assert.ok(pixels[(65*180+18)*4+3]>0,'start round cap exists');
assert.ok(pixels[(65*180+147)*4+3]>0,'end round cap exists');
assert.ok(pixels[(82*180+80)*4+3]>0,'full half-width exists');
assert.equal(pixels[(84*180+149)*4+3],0,'no rectangular end corner');
assert.equal(hazardPixels({...h,timer:0}).some(x=>x!==0),false,'no drawn hazard after logical removal/resolve');

function background(camX){const c=createCanvas(400,300),cx=c.getContext('2d'),operations=[];const f={...frame,camera:{x:camX,y:-300}};cx.translate(200-camX,150+300);
  const spy=new Proxy(cx,{get(target,key){const value=target[key];if(typeof value!=='function')return value;return (...args)=>{if(['translate','scale','rotate','moveTo','lineTo','bezierCurveTo'].includes(key))operations.push([key,...args]);return value.apply(target,args);};},set(target,key,value){target[key]=value;return true;}});
  W.drawWorldBackground(spy,f,assets);return {operations,png:c.toBuffer('image/png'),pixels:cx.getImageData(0,0,400,300).data};}
const a=background(-400),again=background(-400),b=background(-385);
assert.deepEqual(a.png,again.png);
let overlapMismatch=0,overlapMaxDelta=0;
for(let y=0;y<300;y++)for(let x=0;x<385;x++)for(let channel=0;channel<4;channel++){
  const delta=Math.abs(a.pixels[(y*400+x+15)*4+channel]-b.pixels[(y*400+x)*4+channel]);
  if(delta)overlapMismatch++;overlapMaxDelta=Math.max(delta,overlapMaxDelta);
}
assert.deepEqual(a.operations,b.operations,'world primitive coordinates/transforms unchanged across camera movement');
assert.ok(overlapMaxDelta<=8 && overlapMismatch/(385*300*4)<.001,'native AA differences confined to a tiny edge fringe');
const c=createCanvas(220,64),cx=c.getContext('2d');
const four=freeze({muzzles:[40,80,120,160].map(x=>({x,y:32,axisAngle:0}))});
W.drawWorldItem(cx,freeze({kind:'feedback',x:0,y:0,sourceArtId:'tower:BURST',anchors:four,data:{type:'shot',time:1,angle:0,shotIndex:4,projectileKind:'basic'}}),frame,assets);
const p=cx.getImageData(0,0,220,64).data;
assert.ok(p[(32*220+44)*4+3]>0,'fifth real shot reuses M1');assert.equal(p[(32*220+164)*4+3],0,'no fifth organ/extra flash');
const beforeMissing=c.toBuffer('image/png');
assert.equal(W.drawWorldItem(cx,{kind:'feedback',x:0,y:0,data:{type:'summon-success',time:1,childKeys:[]}},frame,assets).drawn,false);
assert.deepEqual(c.toBuffer('image/png'),beforeMissing);
const report={status:'passed_module_checks',apiExports:8,projectileSources:10,motionKinds:3,projectileImagesDistinct:10,deepFrozenDtoDrawCalls:items.length+16,contextRestoration:true,styleRestoration:'actual paint pixel probe; bundled native fill/stroke JS getters remain stale after restore',noSharedRandom:true,negativeCoordinateWorldOverlap:{cameraMove:15,totalComparedChannels:385*300*4,differingChannels:overlapMismatch,maxDelta:overlapMaxDelta,worldCoordinates:'exact operation equality',note:'native AA edge fringe separately recorded; not simulation tolerance'},hazardNonzeroPixelsChecked:testedNonzeroPixels,hazardFootprint:'area/oblique capsule/zero length capsule, fill+boundary within 1.1px AA fringe',burstFifthShot:'actual index4 reuses first of four supplied M anchors',emptySuccessFeedback:'missing, no pixels',importSideEffects:'Node import with no window/document/Image',signalAbort:'failed result without side effects',proofLimits:['native Canvas sampler, not browser gameplay','no 95-skill execution, user flow, crowded runtime or performance claim']};
writeFileSync(new URL('world-r02-independent-check.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
