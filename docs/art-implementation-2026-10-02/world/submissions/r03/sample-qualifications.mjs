import { createRequire } from 'node:module';
import { mkdirSync,writeFileSync } from 'node:fs';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url);
const {createCanvas,Path2D}=require(process.env.WORLD_CANVAS_MODULE ?? 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
globalThis.Path2D=Path2D;
const W=await import('../../../../../src/view/art/world/index.js');
const out=dirname(fileURLToPath(import.meta.url)),root=resolve(out,'../../../../..'),publicOut=resolve(root,'public/art/world/v2/effects');
const {assets}=await W.loadWorldArt();
const frame={schemaVersion:1,epoch:2,time:12,dt:0,paused:true,quality:'full',viewport:{width:1440,height:900,dpr:1},camera:{x:0,y:0}};
const variants=[['jammed',{states:{jammed:true}}],['healing',{healAura:{active:true,range:118,amount:6,eligibleTargetKeys:['real-target']}}],['fusing',{fuse:{active:true,remaining:.28,duration:.8,radius:78}}]];
mkdirSync(publicOut,{recursive:true});
const neutral=[];
for(const [name,fields] of variants){
  const c=createCanvas(256,256),ctx=c.getContext('2d');
  W.drawActorOverlay(ctx,{x:128,y:128,radius:12,hp:20,states:{},...fields},{root:{x:128,y:144},bounds:{x:114,y:110,width:28,height:34}},frame,assets,'status');
  const path=resolve(publicOut,name+'.png');writeFileSync(path,c.toBuffer('image/png'));
  neutral.push({name,path:'art/world/v2/effects/'+name+'.png',sourceSize:[256,256],collisionCenterPx:[128,128],radiusParameter:12,...fields});
}
const c=createCanvas(1440,960),ctx=c.getContext('2d');ctx.fillStyle='#FFF9EF';ctx.fillRect(0,0,1440,960);ctx.fillStyle='#4B281C';ctx.font='bold 28px Segoe UI';ctx.fillText('WORLD r03 / ACTUAL QUALIFICATION + HIT DRAWERS',30,45);ctx.font='15px Segoe UI';ctx.fillText('Approved S04 + S15 reuse / explicit live flags / no new hazard, healing, damage or success event',30,76);
for(const [i,[name,fields]] of variants.entries()){
  const x=245+i*475,y=255;ctx.font='bold 22px Segoe UI';ctx.fillText(name.toUpperCase(),x-75,127);
  const actor={x,y,radius:12,hp:20,alpha:1,states:{},...fields},anchor={root:{x,y:y+16},bounds:{x:x-14,y:y-18,width:28,height:34}};
  W.drawActorOverlay(ctx,actor,anchor,frame,assets,'status');ctx.font='15px Segoe UI';
  const texts=i===0?['Living affected tower / true eligibility','S04 dual purple waves + external X']:i===1?['Living eligible source / actual range=118','S15 sparse sage ring / no filled disk']:['Actual fuse progress=.65 / source local','S15 honey clock / not explosion radius'];
  texts.forEach((s,row)=>ctx.fillText(s,x-177,418+row*25));
}
ctx.font='bold 22px Segoe UI';ctx.fillText('UNKNOWN / FALSE / DEAD ELIGIBILITY: NO OVERLAY',35,510);ctx.font='15px Segoe UI';ctx.fillText('No identity guessing. Empty areas below are intentional; no phantom success, aura or countdown.',35,540);
for(const [i,[name,fields]] of variants.entries()){
  const x=245+i*475,y=596;W.drawActorOverlay(ctx,{x,y,radius:12,hp:0,states:{},...fields},{root:{x,y:y+16}},frame,assets,'status');
}
ctx.font='bold 22px Segoe UI';ctx.fillText('TRUE HIT SOURCE / THREE EXISTING KINDS',35,682);
for(const [i,[id,kind]] of [['tower:BASIC','basic'],['tower:CANNON','cannon'],['tower:RAIL','sniper']].entries()){
  const x=210+i*490,y=785;ctx.save();ctx.translate(x,y);ctx.scale(3,3);
  W.drawWorldItem(ctx,{kind:'feedback',x:0,y:0,sourceArtId:id,data:{type:'hit',time:11.94,sourceArtId:id,projectileKind:kind}},frame,assets);ctx.restore();
  ctx.font='17px Segoe UI';ctx.fillStyle='#4B281C';ctx.fillText(id+' / '+kind,x-100,888);
}
writeFileSync(resolve(out,'qualifications-production.png'),c.toBuffer('image/png'));
writeFileSync(resolve(out,'manifest.json'),JSON.stringify(W.worldManifest,null,2)+'\n');
writeFileSync(resolve(out,'neutral-exports.json'),JSON.stringify({status:'produced_pending_review',version:'v2',newExports:neutral,preserved:'public/art/world/v1 unchanged; r02 accepted',runtimeTextureBytes:0,estimatedNewTextureBytes:3*256*256*4},null,2)+'\n');
console.log(JSON.stringify({preview:'qualifications-production.png',newExports:3,unchangedV1:true}));
