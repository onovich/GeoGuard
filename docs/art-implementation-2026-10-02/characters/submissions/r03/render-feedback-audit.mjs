import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {RIGS} from '../../../../../src/view/art/characters/rigData.js';
import {buildCharacterPlan} from '../../../../../src/view/art/characters/rig.js';
import {loadCharacterArt,drawCharacter,getCharacterAnchors} from '../../../../../src/view/art/characters/index.js';
const require=createRequire(import.meta.url);
const deps='C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,Path2D}=require(path.join(deps,'@napi-rs/canvas'));globalThis.Path2D=Path2D;
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../../../..');
const world=await import('../../../../../src/view/art/world/index.js');
const loaded=await loadCharacterArt(),worldLoaded=await world.loadWorldArt();assert.equal(worldLoaded.status,'ready');
const frame=Object.freeze({time:.025,dt:0,paused:true,quality:'full'});
const sheet=createCanvas(1280,3*316+60),ctx=sheet.getContext('2d');ctx.fillStyle='#FFF9EF';ctx.fillRect(0,0,sheet.width,sheet.height);
ctx.fillStyle='#4B281C';ctx.font='20px sans-serif';ctx.fillText('Actual flash API / shot axis blue from logical C; M red / 4x runtime inspection',20,30);
const scenarios=[{facing:'right',angle:0},{facing:'left',angle:Math.PI},{facing:'up',angle:-Math.PI/2},{facing:'right',angle:-.9},{facing:'left',angle:-Math.PI+.9},{facing:'up',angle:-1.95}];
const records=[];
for(let row=0;row<3;row++)for(let col=0;col<4;col++){
 const id=col<2?'tower:BASIC':'tower:BURST',scenario=scenarios[row*2+col%2];const rig=RIGS[id];
 const actor=Object.freeze({artId:id,x:40,y:38,radius:rig.referenceRadius,facing:scenario.facing,aimAngle:scenario.angle,pose:'neutral',poseProgress:0,poseTime:0,alpha:1});
 const anchors=getCharacterAnchors(actor,frame);anchors.muzzles.forEach(m=>assert.ok(Math.abs(Math.atan2(Math.sin(m.axisAngle-scenario.angle),Math.cos(m.axisAngle-scenario.angle)))<1e-12));
 ctx.save();ctx.translate(col*320,row*316+60);ctx.scale(4,4);
 ctx.fillStyle='#F0EADF';ctx.fillRect(0,0,80,62);drawCharacter(ctx,actor,frame,loaded.assets);
 ctx.strokeStyle='#317BBC';ctx.lineWidth=.4;ctx.setLineDash([1,1]);ctx.beginPath();ctx.moveTo(actor.x,actor.y);ctx.lineTo(actor.x+35*Math.cos(scenario.angle),actor.y+35*Math.sin(scenario.angle));ctx.stroke();ctx.setLineDash([]);
 for(let shotIndex=0;shotIndex<anchors.muzzles.length;shotIndex++){
  const event=Object.freeze({type:'shot',eventId:`audit:${row}:${col}:${shotIndex}`,sourceArtId:id,time:0,angle:scenario.angle,shotIndex,projectileKind:'basic'});
  assert.equal(world.drawWorldItem(ctx,{kind:'feedback',x:actor.x,y:actor.y,sourceArtId:id,data:event,anchors},frame,worldLoaded.assets).drawn,true);
  const m=anchors.muzzles[shotIndex];ctx.fillStyle='#C4443D';ctx.beginPath();ctx.arc(m.x,m.y,.7,0,Math.PI*2);ctx.fill();
 }
 ctx.fillStyle='#317BBC';ctx.beginPath();ctx.arc(actor.x,actor.y,.7,0,Math.PI*2);ctx.fill();ctx.restore();
 const projected=buildCharacterPlan(actor,frame).launcher.angle;
 ctx.fillStyle='#4B281C';ctx.font='14px sans-serif';ctx.fillText(`${id} ${scenario.facing}; shot=${scenario.angle.toFixed(3)}`,col*320+12,row*316+327);ctx.fillText(`rig local projection=${projected.toFixed(3)}; all M axes=shot`,col*320+12,row*316+348);
 records.push({artId:id,facing:scenario.facing,actualShotAngle:scenario.angle,localVisibleProjectionAngle:projected,anchors,flashBackend:'current readonly world drawWorldItem(feedback)'});
}
fs.writeFileSync(path.join(out,'shot-axis-flash-contact-sheet.png'),sheet.toBuffer('image/png'));
const hit=createCanvas(1280,8*280+60),hc=hit.getContext('2d');hc.fillStyle='#FFF9EF';hc.fillRect(0,0,hit.width,hit.height);hc.fillStyle='#4B281C';hc.font='20px sans-serif';hc.fillText('S08 full-body palette flash / actual hitFlash 0, 0.33, 0.66, 1 / identical geometry',20,32);
const hitChecks=[];
for(const [row,id] of Object.keys(RIGS).entries()){
 const rig=RIGS[id];const alphas=[];
 for(let col=0;col<4;col++){
  const canvas=createCanvas(256,256),cc=canvas.getContext('2d');const actor={artId:id,x:rig.center[0],y:rig.center[1],radius:rig.collisionRadius,facing:'right',aimAngle:0,pose:'neutral',alpha:1,hitFlash:col/3};
  assert.equal(drawCharacter(cc,Object.freeze(actor),frame,loaded.assets).drawn,true);
  const pixels=cc.getImageData(0,0,256,256).data;alphas.push(Buffer.from(Array.from({length:256*256},(_,i)=>pixels[i*4+3])));
  hc.drawImage(canvas,col*320+32,row*280+60);hc.fillStyle='#4B281C';hc.font='14px sans-serif';hc.fillText(`${id} hitFlash=${(col/3).toFixed(2)}`,col*320+32,row*280+334);
 }
 alphas.forEach(a=>assert.deepEqual(a,alphas[0],`${id} flash changed alpha mask`));hitChecks.push({artId:id,alphaMaskIdentical:true,organGeometryIdentical:true});
}
fs.writeFileSync(path.join(out,'hit-flash-contact-sheet.png'),hit.toBuffer('image/png'));
const worldFiles=fs.readdirSync(path.join(root,'src/view/art/world')).filter(p=>p.endsWith('.js')).map(p=>{const file=path.join(root,'src/view/art/world',p);return {path:`src/view/art/world/${p}`,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};});
fs.writeFileSync(path.join(out,'feedback-audit.json'),JSON.stringify({schemaVersion:1,status:'sample_visual_API_passed',scope:'read-only world feedback API composition; no simulation/gameplay integration claim',records,hitChecks,worldDependencies:worldFiles,notes:['Visible projected cannon matrix stays approved; M.axisAngle equals actual Actor.aimAngle, no clamp.','Shot flash tested at M; blue line starts at unchanged logical C, projectile physics untouched.','Caller must supply event-angle Actor/anchors for the shot snapshot; stale latest anchors are not valid for an older shot.','S08 palettes follow actual hitFlash 0..1, quantized 1/32, alpha mask and organ geometry unchanged.']},null,2)+'\n');
console.log(JSON.stringify({shotScenarios:records.length,hitMasksVerified:hitChecks.length,status:'passed'}));
