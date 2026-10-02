import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {RIGS} from '../../../../../src/view/art/characters/rigData.js';
import {buildCharacterPlan,drawPlan,planToSvg} from '../../../../../src/view/art/characters/rig.js';
import * as api from '../../../../../src/view/art/characters/index.js';
const require=createRequire(import.meta.url),deps='C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,Path2D}=require(path.join(deps,'@napi-rs/canvas')),sharp=require(path.join(deps,'sharp'));globalThis.Path2D=Path2D;
const out=path.dirname(fileURLToPath(import.meta.url)),input=JSON.parse(fs.readFileSync(path.join(out,'qa-action-inputs-375.json'),'utf8'));
if(fs.existsSync(path.join(out,'READY')))throw new Error('r04 is sealed; use a new revision');
const loaded=await api.loadCharacterArt();assert.equal(loaded.status,'ready');
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);Object.values(v).forEach(freeze);}return v;};
const frame=freeze({schemaVersion:1,epoch:'r04:feet',time:0,dt:0,paused:true,quality:'full'});
const make=(id,changes={})=>freeze({key:`feet:${id}`,artId:id,x:RIGS[id].center[0],y:RIGS[id].center[1],radius:RIGS[id].collisionRadius,facing:'right',aimAngle:0,pose:'neutral',poseProgress:0,poseTime:0,alpha:1,...changes});
let qaDraws=0,abilityDraws=0;
for(const entry of input.entries){assert.equal(entry.status,'produced_pending_review');assert.ok(entry.samples.length);for(const sample of entry.samples){assert.ok(sample.sourceActor);freeze(sample);const c=createCanvas(256,256).getContext('2d');assert.equal(api.drawCharacter(c,sample.sourceActor,sample.frame,loaded.assets).drawn,true);const a=api.getCharacterAnchors(sample.sourceActor,sample.frame);assert.ok(Number.isFinite(a.bounds.width)&&a.bounds.width>0);qaDraws++;}}
for(const ability of input.bossAbilitySamples)for(const owner of ability.owners)for(const sample of owner.samples){assert.ok(sample.sourceActor);freeze(sample);const c=createCanvas(256,256).getContext('2d');assert.equal(api.drawCharacter(c,sample.sourceActor,sample.frame,loaded.assets).drawn,true);abilityDraws++;}
assert.equal(input.entries.length,375);assert.equal(input.bossAbilitySamples.length,95);
const board=(width,height,title)=>{const canvas=createCanvas(width,height),c=canvas.getContext('2d');c.fillStyle='#FFF9EF';c.fillRect(0,0,width,height);c.fillStyle='#4B281C';c.font='20px sans-serif';c.fillText(title,16,28);return [canvas,c];};
const [scout,sc]=board(1440,2*298+60,'SCOUT exact semantic contour pairing / full soles at every intermediate pose');
const scoutMetrics=[];
for(let row=0;row<2;row++)for(let step=0;step<=8;step++){
 const actor=make('enemy:SCOUT',{pose:row?'squash':'attack',poseProgress:step/8});
 const plan=buildCharacterPlan(actor,frame);const canvas=createCanvas(256,256),c=canvas.getContext('2d');drawPlan(c,plan);
 const anchors=api.getCharacterAnchors(actor,frame);const footCenter=(anchors.parts['foot-left'].x+anchors.parts['foot-right'].x)/2;assert.ok(Math.abs(footCenter-128)<1e-9);
 for(const side of ['left','right']){
  const isolated=createCanvas(256,256),ic=isolated.getContext('2d');drawPlan(ic,{...plan,commands:plan.commands.filter(command=>command.shape.id===`long-leg-${side}`)});
  const pixels=ic.getImageData(0,0,256,256).data;let coralFootPixels=0;
  for(let y=207;y<241;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;if(pixels[i+3]>200&&pixels[i]>190&&pixels[i+1]>80&&pixels[i+1]<170&&pixels[i+2]>60&&pixels[i+2]<140)coralFootPixels++;}
  assert.ok(coralFootPixels>90,`SCOUT ${side} foot collapsed: ${coralFootPixels}`);scoutMetrics.push({pose:actor.pose,progress:step/8,side,coralFootPixels,footCenter});
 }
 sc.drawImage(canvas,step*160,row*298+60,156,156);sc.drawImage(canvas,50,199,150,46,step*160,row*298+222,156,48);sc.fillStyle='#4B281C';sc.font='11px sans-serif';sc.fillText(`${actor.pose} ${step/8}`,step*160+6,row*298+280);
 // SVG and Canvas share the actual intermediate commands; verify exported SVG decodes.
 await sharp(Buffer.from(planToSvg(plan))).png().toBuffer();
}
fs.writeFileSync(path.join(out,'scout-feet-repair.png'),scout.toBuffer('image/png'));
const [sentinel,sn]=board(1280,3*298+60,'SENTINEL visible feet / RIGHT LEFT UP / neutral squash stretch attack');
const sentinelMetrics=[];
for(let row=0;row<3;row++)for(let col=0;col<4;col++){
 const facing=['right','left','up'][row],pose=['neutral','squash','stretch','attack'][col];const a=make('tower:SENTINEL',{facing,pose,poseProgress:.5,aimAngle:facing==='left'?Math.PI:facing==='up'?-Math.PI/2:0});
 const canvas=createCanvas(256,256),c=canvas.getContext('2d');assert.equal(api.drawCharacter(c,a,frame,loaded.assets).drawn,true);const pixels=c.getImageData(0,0,256,256).data;
 const anchors=api.getCharacterAnchors(a,frame);assert.equal(anchors.root.y,220);assert.equal(anchors.root.x,128);assert.equal(anchors.collisionCenter.y,145);
 const visible=[];for(const key of ['foot-left','foot-right']){const cx=anchors.parts[key].x;let sageFootPixels=0;for(let y=204;y<221;y++)for(let x=Math.floor(cx-16);x<cx+16;x++){const i=(y*256+x)*4;if(pixels[i+3]>200&&Math.abs(pixels[i]-126)<3&&Math.abs(pixels[i+1]-159)<3&&Math.abs(pixels[i+2]-113)<3)sageFootPixels++;}assert.ok(sageFootPixels>75,`${facing}/${pose} hidden ${key}: ${sageFootPixels}`);visible.push({key,sageFootPixels});}
 const plan=buildCharacterPlan(a,frame),far=plan.commands.find(v=>v.shape.id==='shoulder-far');
 const noFar=createCanvas(256,256),nc=noFar.getContext('2d');drawPlan(nc,{...plan,commands:plan.commands.filter(v=>v!==far)});const hidden=nc.getImageData(0,0,256,256).data;
 const [ma,mb,mc,md,me,mf]=far.matrix,det=ma*md-mb*mc;let upperArcPixels=0,lowerArcPixels=0;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4,localY=(-mb*(x+.5-me)+ma*(y+.5-mf))/det;const diff=Math.abs(pixels[i]-hidden[i])+Math.abs(pixels[i+1]-hidden[i+1])+Math.abs(pixels[i+2]-hidden[i+2])+Math.abs(pixels[i+3]-hidden[i+3]);if(pixels[i+3]>200&&diff>60){if(localY<143)upperArcPixels++;if(localY>172)lowerArcPixels++;}}
 assert.ok(upperArcPixels>50&&lowerArcPixels>50,`${facing}/${pose} far pad hidden: ${upperArcPixels}/${lowerArcPixels}`);
 sentinelMetrics.push({facing,pose,feet:visible,farShoulder:{upperArcPixels,lowerArcPixels},root:anchors.root,center:anchors.collisionCenter});sn.drawImage(canvas,col*320+32,row*298+60);sn.fillStyle='#4B281C';sn.font='14px sans-serif';sn.fillText(`${facing} ${pose} / two feet + two pads`,col*320+32,row*298+337);
}
fs.writeFileSync(path.join(out,'sentinel-feet-repair.png'),sentinel.toBuffer('image/png'));
const context=createCanvas(256,256).getContext('2d');context.fillStyle='#123456';context.globalAlpha=.5;context.translate(5,7);const before=[context.getTransform().e,context.getTransform().f,context.globalAlpha];api.drawCharacter(context,make('tower:BASIC'),frame,loaded.assets);assert.deepEqual([context.getTransform().e,context.getTransform().f,context.globalAlpha],before);context.save();context.resetTransform();context.globalAlpha=1;context.clearRect(0,0,1,1);context.fillRect(0,0,1,1);assert.deepEqual([...context.getImageData(0,0,1,1).data],[18,52,86,255]);context.restore();
const pauses=[];for(const id of Object.keys(RIGS)){const c1=createCanvas(256,256),c2=createCanvas(256,256);const a=make(id,{pose:'windup',poseProgress:.37,poseTime:.16});api.drawCharacter(c1.getContext('2d'),a,frame,loaded.assets);api.drawCharacter(c2.getContext('2d'),a,frame,loaded.assets);assert.deepEqual(c1.toBuffer('image/png'),c2.toBuffer('image/png'));pauses.push(id);}
const result={schemaVersion:1,status:'reference_API_and_visible_feet_passed',referenceKeys:375,referenceSampleDraws:qaDraws,activeSkillKeys:95,skillSampleDraws:abilityDraws,scoutMetrics,sentinelMetrics,contextRestore:true,immutableInputs:true,pausedDeterminism:pauses.length,midPoseInterruption:'stateless immediate new pose; no lingering cache; smooth interruption blending excluded by primary',scope:'standalone production art only; gameplay integration remains QA'};
fs.writeFileSync(path.join(out,'qa-and-feet-verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({referenceKeys:375,qaDraws,activeSkills:95,abilityDraws,minScoutFootPixels:Math.min(...scoutMetrics.map(m=>m.coralFootPixels)),minSentinelFootPixels:Math.min(...sentinelMetrics.flatMap(m=>m.feet.map(f=>f.sageFootPixels))),status:result.status}));
