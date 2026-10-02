import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {RIGS} from '../../../../../src/view/art/characters/rigData.js';
import {buildCharacterPlan,pathCommands,planToSvg} from '../../../../../src/view/art/characters/rig.js';
import * as api from '../../../../../src/view/art/characters/index.js';
const require=createRequire(import.meta.url),deps='C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,Path2D}=require(path.join(deps,'@napi-rs/canvas')),sharp=require(path.join(deps,'sharp'));
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../../../..');
if(fs.existsSync(path.join(out,'READY')))throw new Error('r04 is sealed; use a new revision');
const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8'));
const ids=Object.keys(manifest);assert.equal(Object.keys(RIGS).length,48);
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,Buffer.isBuffer(value)||typeof value==='string'?value:JSON.stringify(value,null,2)+'\n');};
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);Object.values(v).forEach(freeze);}return v;};
const frame=freeze({schemaVersion:1,epoch:'r04:audit',time:0,dt:0,paused:true,quality:'full'});
const actor=(id,changes={})=>freeze({key:`r04:${id}`,artId:id,x:RIGS[id].center[0],y:RIGS[id].center[1],radius:RIGS[id].collisionRadius,referenceRadius:RIGS[id].referenceRadius,facing:'right',aimAngle:0,pose:'neutral',poseTime:0,poseProgress:0,alpha:1,boss:id.startsWith('boss:')?{phaseIndex:0,castAbility:null}:null,...changes});
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-9,`${label}: ${a} / ${b}`);
assert.equal(typeof globalThis.window,'undefined');
const tracedLoad=await api.loadCharacterArt();assert.equal(tracedLoad.status,'ready');
const traced=createCanvas(256,256).getContext('2d');assert.equal(api.drawCharacter(traced,actor('tower:BASIC'),frame,tracedLoad.assets).drawn,true);
globalThis.Path2D=Path2D;const loaded=await api.loadCharacterArt();freeze(loaded.assets);assert.equal(loaded.status,'ready');assert.equal(loaded.errors.length,0);
const alphaBounds=async png=>{
 const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=info.width,y0=info.height,x1=-1,y1=-1,edge=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);if(!x||!y||x===info.width-1||y===info.height-1)edge++;}
 return {x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,edgePixels:edge};
};
const body=(id,changes={})=>{const canvas=createCanvas(256,256);assert.equal(api.drawCharacter(canvas.getContext('2d'),actor(id,changes),frame,loaded.assets).drawn,true);return canvas;};
function checker(c,x,y,w,h){for(let yy=y;yy<y+h;yy+=16)for(let xx=x;xx<x+w;xx+=16){c.fillStyle=((xx-x)/16+(yy-y)/16)%2?'#F7F3EA':'#ECE6D9';c.fillRect(xx,yy,Math.min(16,x+w-xx),Math.min(16,y+h-yy));}}
function label(c,t,x,y,size=14){c.fillStyle='#4B281C';c.font=`${size}px sans-serif`;c.fillText(t,x,y);}
function board(width,height,title){const b=createCanvas(width,height),c=b.getContext('2d');c.fillStyle='#FFF9EF';c.fillRect(0,0,width,height);label(c,title,18,30,20);return [b,c];}
const audit={schemaVersion:1,identities:{},transitions:[],clipping:[],rootChecks:0};
const [roster,rc]=board(1280,6*236+60,'48 identity bodies / shared production drawCharacter API');
for(const [index,id] of ids.entries()){
 const rig=RIGS[id],entry=manifest[id];assert.ok(Number.isFinite(entry.referenceRuntimeRadius)&&entry.referenceRuntimeRadius>0);
 const neutral=api.getCharacterAnchors(actor(id),frame);const samples=[];
 for(const pose of ['neutral','move','squash','stretch','windup','attack','recover','intro','trigger','broken','fade'])for(let i=0;i<=8;i++){
  const a=actor(id,{pose,poseProgress:i/8,poseTime:i*.72/8}),plan=buildCharacterPlan(a,frame),anchors=api.getCharacterAnchors(a,frame);
  near(anchors.root.x,neutral.root.x,`${id} root x`);near(anchors.root.y,neutral.root.y,`${id} root y`);near(anchors.collisionCenter.x,a.x,'C x');near(anchors.collisionCenter.y,a.y,'C y');audit.rootChecks++;
  for(const command of plan.commands)assert.ok(command.matrix.every(Number.isFinite));
  if(plan.launcher){near(Math.hypot(plan.launcher.matrix[0],plan.launcher.matrix[1]),1,'rigid x');near(Math.hypot(plan.launcher.matrix[2],plan.launcher.matrix[3]),1,'rigid y');}
 }
 for(const [from,fp,to,tp] of [['neutral',0,'windup',0],['windup',1,'attack',0],['attack',1,'recover',0],['recover',1,'neutral',0],['windup',1,'trigger',0],['trigger',1,'neutral',0]]){
  const pa=buildCharacterPlan(actor(id,{pose:from,poseProgress:fp}),frame),pb=buildCharacterPlan(actor(id,{pose:to,poseProgress:tp}),frame);let maxDifference=0;
  assert.equal(pa.commands.length,pb.commands.length,`${id} transition organ count`);
  pa.commands.forEach((a,j)=>{const b=pb.commands[j];assert.equal(a.shape.id,b.shape.id);a.matrix.forEach((v,k)=>maxDifference=Math.max(maxDifference,Math.abs(v-b.matrix[k])));
   const ap=a.shape.ellipse??(a.shape.commands??pathCommands(a.shape.d)).flatMap(c=>c.values),bp=b.shape.ellipse??(b.shape.commands??pathCommands(b.shape.d)).flatMap(c=>c.values);
   assert.equal(ap.length,bp.length,`${id} endpoint path topology`);ap.forEach((v,k)=>maxDifference=Math.max(maxDifference,Math.abs(v-bp[k])));
  });
  assert.ok(maxDifference<1e-8,`${id} ${from}->${to} jump ${maxDifference}`);audit.transitions.push({artId:id,from:`${from}:${fp}`,to:`${to}:${tp}`,maxDifference});
 }
 const staticPng=await sharp(path.join(root,'public',entry.sourceFile)).png().toBuffer();const pixels=await alphaBounds(staticPng);assert.equal(pixels.edgePixels,0,`${id} neutral clipped`);
 const dir=path.join(root,'public',path.dirname(entry.sourceFile));write(path.join(dir,'body.png'),staticPng);write(path.join(dir,'icon.png'),await sharp(path.join(dir,'icon.svg')).png().toBuffer());
 const poseNames=id.startsWith('mechanic:')?['neutral','trigger','broken','fade']:['neutral','squash','stretch','attack'];
 for(const pose of poseNames){const b=body(id,{pose,poseProgress:.5});const png=b.toBuffer('image/png');const bounds=await alphaBounds(png);if(bounds.edgePixels)audit.clipping.push({id,pose,bounds});
  write(path.join(out,'transparent',`${id.replace(':','-').toLowerCase()}-${pose}.png`),png);samples.push({pose,bounds,anchors:api.getCharacterAnchors(actor(id,{pose,poseProgress:.5}),frame)});
 }
 for(const facing of ['right','left','up'])for(const pose of ['neutral','squash','stretch'])if(rig.launcher){const aimAngle=facing==='up'?-Math.PI/2:facing==='left'?Math.PI:0;const bounds=await alphaBounds(body(id,{pose,facing,aimAngle}).toBuffer('image/png'));if(bounds.edgePixels)audit.clipping.push({id,pose,facing,bounds});const anchors=api.getCharacterAnchors(actor(id,{pose,facing,aimAngle}),frame);anchors.muzzles.forEach(m=>near(Math.atan2(Math.sin(m.axisAngle-aimAngle),Math.cos(m.axisAngle-aimAngle)),0,'M true axis'));}
 entry.sourceAlphaBoundsPx=pixels;entry.bodyPng=entry.sourceFile.replace('source.svg','body.png');write(path.join(dir,'rig.json'),entry);
 const cx=index%8*160+8,cy=Math.floor(index/8)*236+60;checker(rc,cx,cy,144,200);rc.drawImage(body(id),cx,cy,144,144);label(rc,id,cx,cy+172,11);
 audit.identities[id]={root:rig.root,center:rig.center,r0:rig.collisionRadius,referenceRadius:rig.referenceRadius,sourceAlphaBounds:pixels,organCounts:entry.organCounts,samples};
}
write(path.join(out,'identity-roster.png'),roster.toBuffer('image/png'));
const groups={towers:ids.filter(id=>id.startsWith('tower:')),mechanics:ids.filter(id=>id.startsWith('mechanic:')),enemies:ids.filter(id=>id.startsWith('enemy:')),bossesA:ids.filter(id=>id.startsWith('boss:')).slice(0,9),bossesB:ids.filter(id=>id.startsWith('boss:')).slice(9)};
for(const [name,list] of Object.entries(groups)){
 const [b,c]=board(1280,list.length*282+60,`${name} approved body poses / native Canvas API`);
 const [small,sc]=board(1280,list.length*96+60,`${name} reference runtime radius / 1 world unit = 1 pixel`);
 for(const [row,id] of list.entries())for(let col=0;col<4;col++){
  const pose=(id.startsWith('mechanic:')?['neutral','trigger','broken','fade']:['neutral','squash','stretch','attack'])[col];
  const x=col*320+32,y=row*282+60;checker(c,x,y,256,256);c.drawImage(body(id,{pose,poseProgress:.5}),x,y);label(c,`${id} / ${pose}`,x,y+275,14);
  checker(sc,col*320+20,row*96+60,280,70);api.drawCharacter(sc,actor(id,{x:col*320+160,y:row*96+93,radius:RIGS[id].referenceRadius,pose,poseProgress:.5}),frame,loaded.assets);label(sc,`${id} r=${RIGS[id].referenceRadius} ${pose}`,col*320+20,row*96+149,12);
 }
 write(path.join(out,`${name}-poses-contact.png`),b.toBuffer('image/png'));write(path.join(out,`${name}-runtime-size.png`),small.toBuffer('image/png'));
}
const special=['boss:FORTRESS','enemy:FAST','enemy:SPLINTER','enemy:SHIELD','enemy:BOMBER','enemy:BEACON','enemy:SCOUT','enemy:SIEGE'];
const [timeline,tc]=board(1440,special.length*184+60,'Continuous named-shape transitions / attack 0..1 / no duplicate anatomy');
for(const [row,id] of special.entries())for(let col=0;col<9;col++){const pose=id==='enemy:BEACON'?'windup':'attack',progress=col/8;const x=col*160,y=row*184+60;checker(tc,x,y,156,156);tc.drawImage(body(id,{pose,poseProgress:progress}),x,y,156,156);label(tc,`${id.split(':')[1]} ${progress}`,x+4,y+174,11);}
write(path.join(out,'continuous-variant-timeline.png'),timeline.toBuffer('image/png'));
write(path.join(out,'manifest.json'),manifest);const runtime=JSON.parse(JSON.stringify(api.characterManifest));for(const id of ids){runtime[id].sourceAlphaBoundsPx=manifest[id].sourceAlphaBoundsPx;runtime[id].bodyPng=manifest[id].bodyPng;}
write(path.join(root,'src/view/art/characters/manifest.js'),`// Compact48/375 runtime registry. Full source audit: characters/submissions/r04/manifest.json\nexport const characterManifest = ${JSON.stringify(runtime)};\n`);
write(path.join(out,'anchor-and-transition-audit.json'),audit);
assert.equal(audit.clipping.length,0,JSON.stringify(audit.clipping));
const verification={schemaVersion:1,status:'48_standalone_art_API_checks_passed',identities:48,referenceMappings:375,loader:'ready',rootChecks:audit.rootChecks,transitionChecks:audit.transitions.length,maxTransitionDifference:Math.max(...audit.transitions.map(t=>t.maxDifference)),clippedFrames:audit.clipping.length,trueShotAxes:true,noDOMImport:true,tracingFallback:true,immutableInputs:true,backend:'native Canvas + sharp; no gameplay claim',sourceFiles:fs.readdirSync(path.join(root,'src/view/art/characters')).filter(n=>n.endsWith('.js')).map(n=>({path:`src/view/art/characters/${n}`,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'src/view/art/characters',n))).digest('hex')}))};
write(path.join(out,'verification.json'),verification);console.log(JSON.stringify(verification));
