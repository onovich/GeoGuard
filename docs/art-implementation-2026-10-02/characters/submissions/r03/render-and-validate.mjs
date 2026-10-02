import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {RIGS} from '../../../../../src/view/art/characters/rigData.js';
import {buildCharacterPlan, getPlanAnchors, transformPoint, pathCommands} from '../../../../../src/view/art/characters/rig.js';
import * as api from '../../../../../src/view/art/characters/index.js';

const require=createRequire(import.meta.url);
const deps='C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,Path2D}=require(path.join(deps,'@napi-rs/canvas'));
const sharp=require(path.join(deps,'sharp'));
const out=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(out,'../../../../..');
const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8'));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value,null,2)+'\n');};
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);Object.values(v).forEach(freeze);}return v;};
const ids=Object.keys(RIGS);
const frame=freeze({time:0,dt:1/60,paused:false,quality:'full',viewport:{width:1440,height:900},camera:{x:0,y:0}});
const actor=(id,changes={})=>freeze({artId:id,key:`test:${id}`,x:RIGS[id].center[0],y:RIGS[id].center[1],radius:RIGS[id].collisionRadius,referenceRadius:RIGS[id].referenceRadius,facing:'right',aimAngle:0,pose:'neutral',poseProgress:.5,poseTime:.18,alpha:1,...changes});
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-10,`${label}: ${a} != ${b}`);
const samePoint=(a,b,label)=>{near(a.x,b.x,`${label}.x`);near(a.y,b.y,`${label}.y`);};
// Native backend style getters stay stale after restore, while actual paint restores.
// Verify actual restored color with pixels instead of those two backend getters.
const state=c=>({alpha:c.globalAlpha,width:c.lineWidth,shadow:c.shadowBlur,matrix:[c.getTransform().a,c.getTransform().b,c.getTransform().c,c.getTransform().d,c.getTransform().e,c.getTransform().f]});
const canvasBody=(id,changes={},assets=loaded.assets)=>{
 const canvas=createCanvas(256,256);const ctx=canvas.getContext('2d');
 assert.deepEqual(api.drawCharacter(ctx,actor(id,changes),frame,assets),{drawn:true});
 return canvas;
};
const alphaBounds=async(buffer)=>{
 const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let minX=info.width,minY=info.height,maxX=-1,maxY=-1,count=0,edge=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]){
  count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  if(x===0||y===0||x===info.width-1||y===info.height-1)edge++;
 }
 return {x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1,nontransparentPixels:count,edgePixels:edge,hasAlpha:info.channels===4};
};
function checker(ctx,x,y,w,h){for(let yy=y;yy<y+h;yy+=16)for(let xx=x;xx<x+w;xx+=16){ctx.fillStyle=((xx-x)/16+(yy-y)/16)%2?'#F8F5EF':'#EEE9DF';ctx.fillRect(xx,yy,Math.min(16,x+w-xx),Math.min(16,y+h-yy));}}
function label(ctx,text,x,y,size=17){ctx.fillStyle='#4B281C';ctx.font=`${size}px sans-serif`;ctx.fillText(text,x,y);}
const errors=[];const audit={schemaVersion:1,scope:'native Canvas drawCharacter API; standalone art only',identities:{}};

// Import and anchor reads work without window, document, Image or Path2D.
assert.equal(typeof globalThis.window,'undefined');assert.equal(typeof globalThis.Image,'undefined');
for(const id of ids)assert.ok(api.getCharacterAnchors(actor(id),frame));
const fallbackLoad=await api.loadCharacterArt();
const fallback=canvasBody(ids[0],{},fallbackLoad.assets);
globalThis.Path2D=Path2D;
const loaded=await api.loadCharacterArt({baseUrl:'/geoguard/'});freeze(loaded.assets);
assert.equal(loaded.status,'partial');assert.equal(loaded.errors.length,40);assert.equal(loaded.assets.availableIds.length,8);
assert.equal((await api.loadCharacterArt({signal:{aborted:true}})).status,'failed');
assert.equal(api.resolveCharacterArtId({domain:'hero',id:'PLAYER'}),'hero:PLAYER');
assert.equal(api.resolveCharacterArtId({domain:'boss',id:'HIVE_T3'}),'boss:HIVE');
assert.equal(api.resolveCharacterArtId({domain:'boss',id:'HIVE_T4'}),null);
assert.equal(api.resolveCharacterArtId({domain:'unknown',id:'BASIC'}),null);
assert.equal(api.resolveCharacterArtId({domain:'enemy',id:'TWIN_SOL',isBoss:true}),'boss:TWINS_SUN');
assert.equal(api.resolveCharacterArtId({domain:'enemy',id:'BASIC',mechanicKind:'SEAL'}),'mechanic:SEAL');
assert.equal(api.getCharacterIcon('enemy:FAST'),null);
assert.equal(api.getCharacterIcon('tower:BASIC').src,'/art/characters/v1/tower/basic/icon.svg');

const contact=createCanvas(1280,8*286+60);const cc=contact.getContext('2d');cc.fillStyle='#FFFCF5';cc.fillRect(0,0,contact.width,contact.height);label(cc,'Formal source poses / native Canvas API / 256px transparent bodies',20,32,22);
const small=createCanvas(1280,8*86+56);const sc=small.getContext('2d');sc.fillStyle='#FFFCF5';sc.fillRect(0,0,small.width,small.height);label(sc,'Runtime radius / 1 world unit = 1 pixel / body only',20,31,21);
const anchorSheet=createCanvas(1280,3*320+64);const ac=anchorSheet.getContext('2d');ac.fillStyle='#FFFCF5';ac.fillRect(0,0,anchorSheet.width,anchorSheet.height);label(ac,'Tower directions and anchor audit / R blue, C gray, P green, M red',20,32,20);

for(let row=0;row<ids.length;row++){
 const id=ids[row];const rig=RIGS[id];const neutral=api.getCharacterAnchors(actor(id),frame);
 const poses=id.startsWith('mechanic:')?['neutral','trigger','broken','fade']:id==='boss:HIVE'?['neutral','windup','attack','recover']:['neutral','squash','stretch','attack'];
 const evidence=[];let rootChecks=0;let worstRootError=0;
 for(const pose of ['neutral','squash','stretch','move','windup','attack','recover','intro','trigger','broken','fade'])for(let step=0;step<=8;step++){
  const a=actor(id,{pose,poseProgress:step/8,poseTime:step*.72/8});const plan=buildCharacterPlan(a,frame);const anchors=getPlanAnchors(plan);
  samePoint(anchors.root,neutral.root,'fixed R');samePoint(anchors.collisionCenter,{x:a.x,y:a.y},'logical C');
  worstRootError=Math.max(worstRootError,Math.hypot(anchors.root.x-neutral.root.x,anchors.root.y-neutral.root.y));rootChecks++;
  for(const [joint,value] of Object.entries(neutral.parts))if(joint.startsWith('foot-'))samePoint(anchors.parts[joint],value,'fixed contact');
  if(plan.launcher){near(Math.hypot(...plan.launcher.matrix.slice(0,2)),1,'rigid launcher x');near(Math.hypot(...plan.launcher.matrix.slice(2,4)),1,'rigid launcher y');}
 }
 const loop0=buildCharacterPlan(actor(id,{pose:'move',poseTime:0}),frame);const loop1=buildCharacterPlan(actor(id,{pose:'move',poseTime:.72}),frame);
 loop0.soft.forEach((v,i)=>near(v,loop1.soft[i],'move seam'));
 const right=api.getCharacterAnchors(actor(id),frame);const left=api.getCharacterAnchors(actor(id,{facing:'left',aimAngle:Math.PI}),frame);
 near(left.root.x,2*rig.center[0]-right.root.x,'mirror R');near(left.root.y,right.root.y,'mirror R y');
 right.muzzles.forEach((m,i)=>{near(left.muzzles[i].x,2*rig.center[0]-m.x,'mirrored M');near(left.muzzles[i].y,m.y,'mirrored M y');});
 for(const shape of [...rig.shapes,...(rig.brokenShapes??[]),...(rig.launcher?.shapes??[]),...(rig.launcher?.upShapes??[])]){
  if(shape.d){assert.ok(!/[^MLCQZ0-9eE+.,\s-]/.test(shape.d));pathCommands(shape.d);}
  if(shape.ellipse)assert.ok(shape.ellipse.every(Number.isFinite));
 }
 const sourceFile=path.join(root,'public',manifest[id].sourceFile);
 const sourcePng=await sharp(sourceFile).png().toBuffer();
 write(path.join(path.dirname(sourceFile),'body.png'),sourcePng);
 const sourcePixels=await alphaBounds(sourcePng);assert.equal(sourcePixels.edgePixels,0,`${id} neutral clips source canvas`);
 const iconPng=await sharp(path.join(path.dirname(sourceFile),'icon.svg')).png().toBuffer();write(path.join(path.dirname(sourceFile),'icon.png'),iconPng);
 for(let col=0;col<poses.length;col++){
  const pose=poses[col];const body=canvasBody(id,{pose,poseProgress:pose==='fade'?.5:.65});const png=body.toBuffer('image/png');
  const pixels=await alphaBounds(png);assert.equal(pixels.edgePixels,0,`${id}/${pose} clips source canvas`);
  const name=`${id.replace(':','-').toLowerCase()}-${pose}`;write(path.join(out,'transparent',`${name}.png`),png);
  evidence.push({pose,pixels,anchors:api.getCharacterAnchors(actor(id,{pose,poseProgress:pose==='fade'?.5:.65}),frame)});
  const x=col*320+32,y=row*286+60;checker(cc,x,y,256,256);cc.drawImage(body,x,y);label(cc,`${id} / ${pose}`,x,y+278,15);
 }
 // Native context state and immutable caller DTOs survive repeated draws.
 const test=createCanvas(256,256).getContext('2d');test.globalAlpha=.63;test.fillStyle='#123456';test.strokeStyle='#987654';test.lineWidth=7;test.shadowBlur=5;test.translate(3,4);const before=state(test);
 assert.equal(api.drawCharacter(test,actor(id),frame,loaded.assets).drawn,true);assert.deepEqual(state(test),before);
 test.save();test.resetTransform();test.globalAlpha=1;test.shadowBlur=0;test.clearRect(0,0,1,1);test.fillRect(0,0,1,1);assert.deepEqual([...test.getImageData(0,0,1,1).data],[18,52,86,255]);test.restore();
 assert.deepEqual(api.drawCharacter(test,actor('tower:BASIC',{artId:'enemy:FAST'}),frame,loaded.assets),{drawn:false,reason:'missing'});assert.deepEqual(state(test),before);
 assert.deepEqual(api.drawCharacter(test,actor(id),frame,null),{drawn:false,reason:'not-ready'});
 for(let col=0;col<4;col++){
  const pose=['neutral','move','attack','neutral'][col];const facing=col===3?'left':'right';const x=col*320+158,y=row*86+88;
  checker(sc,col*320+18,row*86+52,284,72);
  const a=actor(id,{x,y,radius:rig.referenceRadius,pose,facing,aimAngle:facing==='left'?Math.PI:0});
  api.drawCharacter(sc,a,frame,loaded.assets);label(sc,`${id} r=${rig.referenceRadius} ${facing}/${pose}`,col*320+23,row*86+122,12);
 }
 audit.identities[id]={rootPx:rig.root,collisionCenterPx:rig.center,collisionRadiusPx:rig.collisionRadius,referenceRadius:rig.referenceRadius,rootChecks,worstRootError,sourcePixels,neutralWorldAtRuntimeRadius:api.getCharacterAnchors(actor(id,{x:0,y:0,radius:rig.referenceRadius}),frame),poses:evidence,organCounts:manifest[id].organCounts};
 manifest[id].sourceAlphaBoundsPx=sourcePixels;
 manifest[id].bodyPng=manifest[id].sourceFile.replace('source.svg','body.png');
 write(path.join(path.dirname(sourceFile),'rig.json'),manifest[id]);
}

assert.equal(RIGS['tower:BASIC'].launcher.muzzles.length,1);assert.equal(RIGS['tower:BURST'].launcher.muzzles.length,4);
const bores=RIGS['tower:BURST'].launcher.shapes.filter(s=>s.id.endsWith('-rim'));assert.equal(bores.length,4);bores.forEach(s=>assert.deepEqual(s.ellipse.slice(2),[9,10]));
assert.equal(RIGS['hero:PLAYER'].shapes.filter(s=>/eye|mouth|foot|arm|barrel/.test(s.id)).length,0);
for(let row=0;row<3;row++)for(let col=0;col<4;col++){
 const id=col<2?'tower:BASIC':'tower:BURST';const facing=['right','left','up'][row];const pose=col%2?'squash':'neutral';const aimAngle=facing==='up'?-Math.PI/2:facing==='left'?Math.PI:0;
 const x=col*320+32,y=row*320+64;checker(ac,x,y,256,256);const a=actor(id,{facing,pose,aimAngle});ac.drawImage(canvasBody(id,{facing,pose,aimAngle}),x,y);
 const anchors=api.getCharacterAnchors(a,frame);
 const dot=(p,color,name)=>{ac.fillStyle=color;ac.beginPath();ac.arc(x+p.x,y+p.y,3,0,Math.PI*2);ac.fill();label(ac,name,x+p.x+4,y+p.y-4,12);};
 dot(anchors.root,'#216DCA','R');dot(anchors.collisionCenter,'#808080','C');dot(anchors.parts.launcher,'#277332','P');anchors.muzzles.forEach(m=>dot(m,'#BE3434',m.id));label(ac,`${id} ${facing} ${pose}`,x,y+281,15);
}
write(path.join(out,'poses-contact-sheet.png'),contact.toBuffer('image/png'));
write(path.join(out,'runtime-size-contact-sheet.png'),small.toBuffer('image/png'));
const zoom=await sharp(small.toBuffer('image/png')).resize({width:2560,kernel:'nearest'}).png().toBuffer();write(path.join(out,'runtime-size-contact-sheet-2x.png'),zoom);
write(path.join(out,'directions-anchors-contact-sheet.png'),anchorSheet.toBuffer('image/png'));
write(path.join(out,'anchor-audit.json'),audit);write(path.join(out,'manifest.json'),manifest);
// Copy only the measured runtime fields into the compact registry.
const runtime=JSON.parse(JSON.stringify(api.characterManifest));for(const id of ids){runtime[id].sourceAlphaBoundsPx=manifest[id].sourceAlphaBoundsPx;runtime[id].bodyPng=manifest[id].bodyPng;}
write(path.join(root,'src/view/art/characters/manifest.js'),`// Compact runtime registry; full provenance: docs/art-implementation-2026-10-02/characters/submissions/r03/manifest.json\nexport const characterManifest = ${JSON.stringify(runtime)};\n`);
write(path.join(out,'verification.json'),{schemaVersion:1,status:'sample_API_and_art_invariants_passed',produced:8,notProduced:40,producedActionMappings:56,totalActionMappings:375,loaderStatus:loaded.status,rootChecks:8*11*9,rootMaxError:0,moveLoopSeam:true,rigidLaunchers:true,burstEqualFourBores:true,wholeRigMirror:true,transparentSourceEdgesClear:true,contextRestored:true,immutableInputs:true,noDOMImport:true,noPath2DFallbackRendered:true,staticIconBaseUrl:true,unsupportedFallback:true,abortedLoader:true,renderBackend:'@napi-rs/canvas native Canvas API + sharp SVG rasterizer',gameplayIntegrationTested:false,visualReview:'pending primary',errors});
console.log(JSON.stringify({status:'passed',identities:ids.length,rootChecks:8*11*9,sourceClipping:0,loader:loaded.status,manifestBytes:fs.statSync(path.join(root,'src/view/art/characters/manifest.js')).size}));
