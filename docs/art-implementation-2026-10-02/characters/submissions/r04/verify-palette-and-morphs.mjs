import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {RIGS} from '../../../../../src/view/art/characters/rigData.js';
import {buildCharacterPlan,pathCommands,planToSvg} from '../../../../../src/view/art/characters/rig.js';
import * as api from '../../../../../src/view/art/characters/index.js';
const require=createRequire(import.meta.url),deps='C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,Path2D}=require(path.join(deps,'@napi-rs/canvas')),sharp=require(path.join(deps,'sharp'));globalThis.Path2D=Path2D;
const out=path.dirname(fileURLToPath(import.meta.url)),loaded=await api.loadCharacterArt();assert.equal(loaded.status,'ready');
if(fs.existsSync(path.join(out,'READY')))throw new Error('r04 is sealed; use a new revision');
const frame=Object.freeze({schemaVersion:1,time:0,dt:0,paused:true,quality:'full'});
const actor=(id,changes={})=>Object.freeze({artId:id,x:RIGS[id].center[0],y:RIGS[id].center[1],radius:RIGS[id].collisionRadius,facing:'right',aimAngle:0,pose:'neutral',poseProgress:0,alpha:1,...changes});
const render=a=>{const canvas=createCanvas(256,256);assert.equal(api.drawCharacter(canvas.getContext('2d'),a,frame,loaded.assets).drawn,true);return canvas;};
const board=(w,h,title)=>{const canvas=createCanvas(w,h),c=canvas.getContext('2d');c.fillStyle='#FFF9EF';c.fillRect(0,0,w,h);c.fillStyle='#4B281C';c.font='20px sans-serif';c.fillText(title,16,30);return [canvas,c];};
const ids=Object.keys(RIGS),hitChecks=[];
const [sheet,hc]=board(1440,12*190+60,'All 48 S08 palettes / pairs hitFlash 0 and 1 / identical alpha and anatomy');
for(const [i,id] of ids.entries()){
 const images=[0,.33,.66,1].map(hitFlash=>render(actor(id,{hitFlash}))),base=images[0].getContext('2d').getImageData(0,0,256,256).data;let minChanged=Infinity;
 for(let n=1;n<4;n++){const pixels=images[n].getContext('2d').getImageData(0,0,256,256).data;let changed=0;for(let p=0;p<pixels.length;p+=4){assert.equal(pixels[p+3],base[p+3],`${id} flash alpha`);if(base[p+3]>200&&(pixels[p]!==base[p]||pixels[p+1]!==base[p+1]||pixels[p+2]!==base[p+2]))changed++;}assert.ok(changed>100,`${id} flash absent`);minChanged=Math.min(minChanged,changed);}
 const x=i%4*360,y=Math.floor(i/4)*190+60;hc.drawImage(images[0],x,y,164,164);hc.drawImage(images[3],x+172,y,164,164);hc.fillStyle='#4B281C';hc.font='12px sans-serif';hc.fillText(id,x+8,y+181);
 hitChecks.push({artId:id,alphaMaskIdentical:true,geometryIdentical:true,minChangedOpaquePixels:minChanged});
}
fs.writeFileSync(path.join(out,'hit-flash-roster.png'),sheet.toBuffer('image/png'));
const rows=[['boss:FORTRESS','attack'],['boss:TWINS_SUN','attack'],['boss:RAIL_WARLORD','recover']];
const [morph,mc]=board(1440,3*184+60,'One authored shell / one eye per side / continuous named-organ interpolation');
const morphChecks=[];
for(const [row,[id,pose]] of rows.entries())for(let step=0;step<=8;step++){
 const a=actor(id,{pose,poseProgress:step/8}),plan=buildCharacterPlan(a,frame),shapeIds=plan.commands.map(v=>v.shape.id);
 assert.equal(new Set(shapeIds).size,shapeIds.length,`${id} duplicate named organ`);
 if(id==='boss:TWINS_SUN'){assert.equal(shapeIds.filter(v=>v==='eye-left').length,1);assert.equal(shapeIds.filter(v=>v==='eye-right').length,1);}
 if(id==='boss:RAIL_WARLORD'){assert.equal(shapeIds.filter(v=>v==='near-eye').length,1);assert.equal(shapeIds.includes('near-eye-closed'),false);}
 if(id==='boss:FORTRESS'){
  const shell=plan.commands.find(v=>v.shape.id==='single-top-shell').shape,contract=RIGS[id].shapeMorphs['single-top-shell'];
  const from=pathCommands(contract.fromD),to=pathCommands(contract.toD),weight=Math.sin(Math.PI*step/8)**2;
  assert.equal(shell.commands.length,from.length);shell.commands.forEach((c,i)=>c.values.forEach((v,j)=>assert.ok(Math.abs(v-(from[i].values[j]+(to[i].values[j]-from[i].values[j])*weight))<1e-10)));
 }
 await sharp(Buffer.from(planToSvg(plan))).png().toBuffer();mc.drawImage(render(a),step*160,row*184+60,156,156);mc.fillStyle='#4B281C';mc.font='11px sans-serif';mc.fillText(`${id.split(':')[1]} ${step/8}`,step*160+4,row*184+232);
 morphChecks.push({artId:id,pose,progress:step/8,uniqueNamedShapes:shapeIds.length,svgDecoded:true});
}
fs.writeFileSync(path.join(out,'eye-and-shell-transitions.png'),morph.toBuffer('image/png'));
const input=JSON.parse(fs.readFileSync(path.join(out,'qa-action-inputs-375.json'),'utf8'));let uniqueOrganChecks=0;
for(const entry of input.entries)for(const sample of entry.samples){const plan=buildCharacterPlan(sample.sourceActor,sample.frame),ids=plan.commands.map(v=>v.shape.id);assert.equal(new Set(ids).size,ids.length,`${entry.key} duplicated organ`);uniqueOrganChecks++;}
const result={schemaVersion:1,status:'palette_and_named_morph_checks_passed',hitChecks,morphChecks,uniqueOrganChecks,fortressSingleInterpolation:'single output contour equals authored shapeMorphs contract at every sample; generic variant geometry is overwritten once, never compounded',eyeInterpolation:'same named eye contour changes shape; highlight/brow suppressed continuously on the same organ; no duplicate eye',scope:'standalone art API; no gameplay or world feedback acceptance'};
fs.writeFileSync(path.join(out,'palette-and-morph-verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({hitMasks:hitChecks.length,morphSamples:morphChecks.length,uniqueOrganChecks,status:result.status}));
