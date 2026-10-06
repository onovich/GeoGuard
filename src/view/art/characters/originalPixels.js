import {originalContinuousCandidateData} from './originalContinuousCandidateData.js';
import {sourceMappedBounds} from './sourceSupport.js';
import {createBendMapper,drawBentSource} from './sourceBend.js';
// Rendering contains no authored paths: every visual pixel comes from approved source slices.
// Existing plan matrices retain fixed-root/aim semantics; they do not supply artwork.
import { originalLayerData } from './originalLayerData.js';
import { originalFrameData } from './originalFrameData.js';
// Root R16 source/composition/offense scoped approval: these two identities use
// the single source-layer assembly in the production registry. Historical eight
// whole-frame projections are not registered as body alternatives or fallbacks.
export const formalContinuousSourceIds=Object.freeze(['tower:SNIPER','tower:RAIL']);
export const originalPartSources = {
  'tower:BASIC': ['body', 'foot-left', 'foot-right', 'launcher'].map(part => ({ part, src: `art/original/v1/characters/basic/${part}-part.png` })),
  'tower:BURST': ['body', 'foot-left', 'foot-right', 'launcher'].map(part => ({ part, src: `art/original/v1/characters/burst/${part}-part.png` })),
  ...Object.fromEntries(Object.entries(originalLayerData).map(([id,data])=>[id,data.parts.map(({part,src})=>({part,src}))])),
  ...Object.fromEntries(Object.entries(originalFrameData).map(([id,data])=>[id,[...new Map(Object.entries(data.frames).flatMap(([part,frame])=>[{part,src:frame.src},...(frame.attachments??[]).map(({part,src})=>({part,src}))]).map(p=>[p.part,p])).values()]])),
};
for(const id of formalContinuousSourceIds)originalPartSources[id]=originalContinuousCandidateData[id].parts.map(({part,src})=>({part,src}));
const loadedParts = {};
const decodedImages = new Map();
const alphaRows = new WeakMap();
const alphaBoxes = new WeakMap();
const cropHulls = new WeakMap();
function measuredCropHull(image,crop) {
  let cache=cropHulls.get(image);if(!cache){cache=new Map();cropHulls.set(image,cache)}
  const key=crop.join(',');if(cache.has(key))return cache.get(key);
  const points=[];
  for(const[y,x0,x1]of alphaRows.get(image)??[]){
    if(y<crop[1]||y>=crop[1]+crop[3])continue;
    const left=Math.max(crop[0],x0),right=Math.min(crop[0]+crop[2],x1);
    if(right<=left)continue;
    points.push([left,y],[right,y],[left,y+1],[right,y+1]);
  }
  points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const lower=[],upper=[];
  for(const p of points){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p)}
  for(const p of [...points].reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p)}
  const hull=[...lower.slice(0,-1),...upper.slice(0,-1)];cache.set(key,hull);return hull;
}
function measureAlpha(image) {
  if(alphaRows.has(image))return;
  const canvas = document.createElement('canvas'); canvas.width=image.width; canvas.height=image.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const data=ctx.getImageData(0,0,image.width,image.height).data;const rows=[];
  for(let y=0;y<image.height;y++){let left=image.width,right=-1;for(let x=0;x<image.width;x++)if(data[(y*image.width+x)*4+3]>12){left=Math.min(left,x);right=x}if(right>=0)rows.push([y,left,right+1])}
  alphaRows.set(image,rows);
  alphaBoxes.set(image,rows.length?[Math.min(...rows.map(r=>r[1])),rows[0][0],Math.max(...rows.map(r=>r[2])),rows.at(-1)[0]+1]:null);
}

export async function loadOriginalParts(base, signal) {
  const bodies = {}; const errors = [];
  await Promise.all(Object.entries(originalPartSources).map(async ([id, sources]) => {
    const images = {};
    await Promise.all(sources.map(async source => {
      const url = `${base.endsWith('/') ? base : `${base}/`}${source.src}`;
      try {
        if (signal?.aborted) throw new Error('aborted');
        if(!decodedImages.has(url)){
          const image=new Image();image.src=url;
          decodedImages.set(url,image.decode().then(()=>image).catch(error=>{decodedImages.delete(url);throw error}));
        }
        const image=await decodedImages.get(url);
        if (signal?.aborted) throw new Error('aborted');
        measureAlpha(image); images[source.part] = image;
      } catch (error) { errors.push({ url, reason: String(error.message || error) }); }
    }));
    if (Object.keys(images).length === sources.length) { bodies[id] = images; loadedParts[id] = images; }
  }));
  return { bodies, errors };
}

// Retained QA entry is idempotent; formal sources are already decoded by the`r`n// normal production registry, with the same required-part failure contract.
export async function loadOriginalContinuousCandidates(base='/') {
 const errors=[];
 for(const[id,data]of Object.entries(originalContinuousCandidateData)){
  const images=loadedParts[id];if(!images){errors.push({id,reason:'normal source registry not loaded'});continue;}
  for(const part of data.parts){if(images[part.part])continue;try{const image=new Image();image.src=base+part.src;await image.decode();measureAlpha(image);images[part.part]=image;}catch(error){errors.push({id,part:part.part,reason:String(error)});}}
 }
 return{errors};
}
function candidateCommands(plan){
 const data=originalContinuousCandidateData[plan.artId];if(!data||(!formalContinuousSourceIds.includes(plan.artId)&&!plan.actor.sourceCandidateContinuousParts))return null;
 const angle=Math.atan2(Math.sin(plan.actor.aimAngle??0),Math.cos(plan.actor.aimAngle??0)),c=Math.cos(angle),s=Math.sin(angle),scale=plan.rig.collisionRadius/data.referenceRadius;
 const w=pixelWorld(plan),imageWorld=[Math.abs(w[0]),0,0,w[3],plan.actor.x-Math.abs(w[0])*plan.rig.center[0],w[5]],matrix=combine(imageWorld,[scale,0,0,scale,...plan.rig.root]);
 const eyeTarget=[data.headSideOffset*c+data.headPerpendicularOffset*s-300*Math.max(0,-c)*Math.max(0,s),-data.headHeight+(s>0?(data.headHeight-80)*Math.exp(-Math.pow((angle-1.7453292519943295)/.3141592653589793,2)):0)],offset=[data.headJoint[0]-data.headEye[0],data.headJoint[1]-data.headEye[1]],joint=[eyeTarget[0]+c*offset[0]-s*offset[1],eyeTarget[1]+s*offset[0]+c*offset[1]];
 const bend={pivot:data.bodyNeck,rigidUntil:data.bodyRigidUntil,fixedFrom:data.bodyFixedFrom,headAnchor:{root:data.bodyRoot,referenceRadius:data.referenceRadius,sideOffset:0,height:0,target:[data.bodyRoot[0]+joint[0],data.bodyRoot[1]+joint[1]]}};
 const pose=['squash','stretch'].includes(plan.actor.pose)?plan.actor.pose:'neutral';
 return[{part:'candidate-body-'+pose,matrix,crop:[0,0,...data.bodySize],target:[-data.bodyRoot[0],-data.bodyRoot[1],...data.bodySize],bend,bendDelta:0,bendMapper:createBendMapper(bend,0,...data.bodySize)},
 {part:'candidate-head-neutral',matrix:combine(matrix,[c,s,-s,c,eyeTarget[0]-c*data.headEye[0]+s*data.headEye[1],eyeTarget[1]-s*data.headEye[0]-c*data.headEye[1]]),crop:[0,0,...data.headSize],target:[0,0,...data.headSize]}];
}

const combine = (a, b) => [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
// Presentation-only calibration around the unchanged source sole root. Collision/range/AI never read this.
// Reference: approved master/submissions/r04/master-desktop-density-r04.png, normalized to 1280px width.
// Screen targets: PLAYER ~40x70, BASIC tower ~65–75, BASIC enemy ~50–60.
// One common 1.65 world-art scale establishes hierarchy; tower corrections only compensate source atlas resolution/height.
const WORLD_ART_BASE_SCALE=1.65;
export const ORIGINAL_DISPLAY_SCALE=Object.freeze({
 'hero:PLAYER':1.22*WORLD_ART_BASE_SCALE,
 'tower:BASIC':1.15*1.6,'tower:CANNON':1.25*1.6,'tower:SNIPER':1.7*1.6,
 'tower:RAPID':1.35*1.6,'tower:MORTAR':1.35*1.6,'tower:FROST':1.5*1.6,'tower:SENTINEL':1.2*1.6,
 'tower:BURST':1.6,'tower:RAIL':1.6,'enemy:BASIC':1.12*WORLD_ART_BASE_SCALE,'enemy:TANK':1.35*WORLD_ART_BASE_SCALE,
});
const displayWorldCache=new WeakMap();
function pixelWorld(plan){
 if(displayWorldCache.has(plan))return displayWorldCache.get(plan);
 const m=plan.world,factor=ORIGINAL_DISPLAY_SCALE[plan.artId]??WORLD_ART_BASE_SCALE;
 const rx=m[0]*plan.rig.root[0]+m[2]*plan.rig.root[1]+m[4],ry=m[1]*plan.rig.root[0]+m[3]*plan.rig.root[1]+m[5];
 const result=combine([factor,0,0,factor,rx*(1-factor),ry*(1-factor)],m);displayWorldCache.set(plan,result);return result;
}
function pixels(ctx, image, matrix, crop, target) {
  ctx.save(); ctx.transform(...matrix); ctx.drawImage(image, ...crop, ...target); ctx.restore();
}

function originalLauncherImageMatrix(plan) {
  // Up-projection backplate is attached at the body's right rim, not over its face.
  const layer=originalLayerData[plan.artId];
    if(layer?.neckPivot){
      const [x,y]=layer.neckPivot;
      const px=plan.soft[0]*x+plan.soft[2]*y+plan.soft[4],py=plan.soft[1]*x+plan.soft[3]*y+plan.soft[5];
      let angle=Math.atan2(plan.launcher.matrix[1],plan.launcher.matrix[0]);
      if(plan.launcher.up)angle-=Math.PI/2;
      return combine(pixelWorld(plan),[Math.cos(angle),Math.sin(angle),-Math.sin(angle),Math.cos(angle),px,py]);
    }
  const registeredOffset=plan.launcher.up?(layer?.upOffset??(plan.artId==='tower:BURST'?[36,0]:[0,0])):(layer?.attachmentOffset??[0,0]);
  // Downward fire attaches at the lower rim rather than rotating the mouth into the opaque chest.
  // This is a source-image joint translation only; sole/root and collision never move.
  const offset=plan.actor.sourceAimExact&&plan.actor.facing==='down'?[registeredOffset[0],registeredOffset[1]+60]:registeredOffset;
  const attachment=combine(pixelWorld(plan),[1,0,0,1,...offset]);
  let matrix=combine(attachment,plan.launcher.matrix);
  if(plan.launcher.up){
    // The retained BASIC up plan has a front-projection angle of zero;
    // BURST retained side plan has -0.58. Rotate the real side image to up
    // once, preserving the plan's bounded aim residual and attachment pivot.
    const angle=-Math.PI/2+(layer?.upResidualCorrection??(plan.artId==='tower:BURST'?.58:0));
    matrix=combine(matrix,[Math.cos(angle),Math.sin(angle),-Math.sin(angle),Math.cos(angle),0,0]);
  }
  if(layer?.intrinsicAngleCorrection){const a=layer.intrinsicAngleCorrection;matrix=combine(matrix,[Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);}
  if(plan.actor.sourceAimExact && Number.isFinite(plan.actor.aimAngle)){
    // Aiming rotates the actual rigid source pixels around their existing attachment.
    // MORTAR source is an oblique cup: its measured source axis is -0.8 rad.
    const localAxis=plan.artId==='tower:MORTAR'?-.8:0;
    const current=Math.atan2(matrix[1]*Math.cos(localAxis)+matrix[3]*Math.sin(localAxis),matrix[0]*Math.cos(localAxis)+matrix[2]*Math.sin(localAxis));
    const delta=plan.actor.aimAngle-current,c=Math.cos(delta),s=Math.sin(delta),x=matrix[4],y=matrix[5];
    matrix=combine([c,s,-s,c,0,0],matrix);matrix[4]=x;matrix[5]=y;
  }
  return matrix;
}

const candidateCompositeCache=new Map();let candidateStages;
export function getContinuousCandidateCompositeDiagnostics(){return candidateStages?.map(([label,canvas])=>{const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let alpha=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>12)alpha++;return{label,alphaPixels:alpha,dataUrl:canvas.toDataURL()}})??[];}
function drawCandidateComposite(ctx,plan,images,commands){
 const data=originalContinuousCandidateData[plan.artId],key=plan.artId+'/'+commands[0].part+'/'+plan.actor.aimAngle;
 let result=candidateCompositeCache.get(key);
 if(!result){
  const [body,head]=commands,base=body.matrix,det=base[0]*base[3]-base[1]*base[2],inv=[base[3]/det,-base[1]/det,-base[2]/det,base[0]/det,(base[2]*base[5]-base[3]*base[4])/det,(base[1]*base[4]-base[0]*base[5])/det],hm=combine(inv,head.matrix);
  const make=()=>Object.assign(document.createElement('canvas'),{width:600,height:600}),origin=[300,400];
  const paint=(canvas,part,isHead)=>{const c=canvas.getContext('2d');c.save();c.translate(...origin);if(isHead){c.transform(...hm);c.drawImage(images[part],0,0);}else drawBentSource(c,images[part],body.bendMapper,body.target,alphaRows.get(images[part]));c.restore();};
  const b=make(),h=make(),bf=make(),hf=make(),bs=make(),hs=make();
  paint(b,body.part,false);paint(h,head.part,true);paint(bf,'candidate-body-connector-fill',false);paint(hf,'candidate-head-connector-fill',true);paint(bs,'candidate-body-connector-stroke',false);paint(hs,'candidate-head-connector-stroke',true);const rawBody=make(),rawHead=make();rawBody.getContext('2d').drawImage(b,0,0);rawHead.getContext('2d').drawImage(h,0,0);
  // Remove only closing source strokes where the other source's actual fill overlaps.
  // No new fill/outline is painted; union exterior strokes remain source pixels.
  for(const[stroke,fill,destination]of[[bs,hf,b],[hs,bf,h]]){const m=stroke.getContext('2d');m.globalCompositeOperation='destination-in';m.drawImage(fill,0,0);const d=destination.getContext('2d');d.globalCompositeOperation='destination-out';d.drawImage(stroke,0,0);}
  b.getContext('2d').setTransform(1,0,0,1,0,0);b.getContext('2d').globalCompositeOperation='source-over';b.getContext('2d').drawImage(h,0,0);candidateStages=[['raw body actual transform',rawBody],['raw head actual transform',rawHead],['body counterpart-fill',bf],['head counterpart-fill',hf],['source cap overlap body',bs],['source cap overlap head',hs],['final original-source union',b]];result={canvas:b,origin};candidateCompositeCache.set(key,result);while(candidateCompositeCache.size>8)candidateCompositeCache.delete(candidateCompositeCache.keys().next().value);
 }
 ctx.save();ctx.transform(...commands[0].matrix);ctx.drawImage(result.canvas,-result.origin[0],-result.origin[1]);ctx.restore();
}
export function drawOriginalParts(ctx, plan, images, onSourceDraw) {
  if (!Object.hasOwn(originalPartSources,plan.artId) || !images) return false;
  // Validate the actual required images before using a warm composite. A cached
  // texture is an optimization, never a substitute for missing source assets.
  if (originalPartSources[plan.artId].some(source => !images[source.part])) return false;
  // Real underground state hides the source body; independent source earth/hole overlay remains.
  if(plan.actor.states?.burrowed)return true;
  ctx.save(); ctx.globalAlpha *= plan.alpha;
  // Preserve real damage feedback by filtering the source pixels themselves.
  // No replacement contour or procedural particle artwork is introduced.
  if(plan.hitFlash>0)ctx.filter=`brightness(${1+Math.min(1,plan.hitFlash)*.65})`;
  const commands=originalCommands(plan),candidate=!!candidateCommands(plan);if(candidate)drawCandidateComposite(ctx,plan,images,commands);
  for(const command of commands){const {part,matrix,crop,target}=command;if(candidate){}else if(command.bend&&(command.bendDelta||command.bend.headAnchor)){ctx.save();ctx.transform(...matrix);drawBentSource(ctx,images[part],command.bendMapper,target,alphaRows.get(images[part]));ctx.restore();}else pixels(ctx,images[part],matrix,crop,target);if(onSourceDraw)try{onSourceDraw(Object.freeze({key:plan.artId+'/'+part,artId:plan.artId,actorKey:plan.actor.key,pose:plan.actor.pose,mode:command.bend&&(command.bendDelta||command.bend.headAnchor)?'original-source-texture-remap':'original-source-part',sourceResidualAngle:command.bendDelta??0,textureGrid:command.bendMapper?{columns:command.bendMapper.columns,bodyRows:command.bendMapper.segments.length-2}:null,resource:images[part].src,crop:[...crop],target:[...target],matrix:[...matrix],alpha:ctx.globalAlpha}));}catch{}}
  ctx.restore(); return true;
}

function originalCommands(plan) {
  const candidate=candidateCommands(plan);if(candidate)return candidate;
  const layer=originalLayerData[plan.artId];
  if(layer)return [...layer.parts].sort((a,b)=>(a.space==='fixed'?0:(a.space==='soft'?!layer.launcherBehindBody:layer.launcherBehindBody)?1:2)-(b.space==='fixed'?0:(b.space==='soft'?!layer.launcherBehindBody:layer.launcherBehindBody)?1:2)).map(part=>({...part,matrix:part.space==='soft'?combine(pixelWorld(plan),plan.soft):part.space==='launcher'?originalLauncherImageMatrix(plan):pixelWorld(plan)}));
  const source=originalFrameData[plan.artId];
  if(source){
    const state=selectOriginalFrame(plan.actor,source),frame=source.frames[state];
    const scale=plan.rig.collisionRadius/(frame.referenceRadius??source.referenceRadius);
    // Actual sole center is aligned to the unchanged world-root projection.
    // No soft matrix: an authored pose is sampled, so feet never slide or deform.
    const imageWorld=source.authoredFacing?[Math.abs(pixelWorld(plan)[0]),0,0,pixelWorld(plan)[3],plan.actor.x-Math.abs(pixelWorld(plan)[0])*plan.rig.center[0],pixelWorld(plan)[5]]:pixelWorld(plan);
    const matrix=combine(imageWorld,[scale,0,0,scale,plan.rig.root[0],plan.rig.root[1]]);
    const bend=source.continuousSourceAim&&plan.actor.sourceAimExact?frame.bend:null,delta=bend?Math.atan2(Math.sin(plan.actor.aimAngle-frame.sourceAxis),Math.cos(plan.actor.aimAngle-frame.sourceAxis)):0;const pivot=bend?[bend.pivot[0]-frame.root[0],bend.pivot[1]-frame.root[1]]:[0,0],c=Math.cos(delta),sn=Math.sin(delta),attachmentMatrix=combine(matrix,[c,sn,-sn,c,pivot[0]-c*pivot[0]+sn*pivot[1],pivot[1]-sn*pivot[0]-c*pivot[1]]);if(bend?.headAnchor){const mapped=createBendMapper(bend,delta,...frame.size).map(bend.pivot);attachmentMatrix[4]+=matrix[0]*(mapped[0]-bend.pivot[0])+matrix[2]*(mapped[1]-bend.pivot[1]);attachmentMatrix[5]+=matrix[1]*(mapped[0]-bend.pivot[0])+matrix[3]*(mapped[1]-bend.pivot[1]);}return [{part:state,matrix,bend,bendDelta:delta,bendMapper:bend?createBendMapper(bend,delta,...frame.size):null,crop:[0,0,...frame.size],target:[-frame.root[0],-frame.root[1],...frame.size]},...(frame.attachments??[]).map(part=>({...part,matrix:attachmentMatrix,target:[part.target[0]-frame.root[0],part.target[1]-frame.root[1],part.target[2],part.target[3]]}))];
  }
  const commands=[
    ...(plan.artId==='tower:BURST'?[
      {part:'foot-left',matrix:pixelWorld(plan),crop:[6,4,32,33],target:[86.5,197,22,22.6875]},
      {part:'foot-right',matrix:pixelWorld(plan),crop:[5,3,32,34],target:[147.5,197,22,23.375]},
      {part:'body',matrix:combine(pixelWorld(plan),plan.soft),crop:[8,2,144,139],target:[28,42,178,171.819444]},
    ]:[
      {part:'foot-left',matrix:pixelWorld(plan),crop:[9,8,41,35],target:[85,197,27,23]},
      {part:'foot-right',matrix:pixelWorld(plan),crop:[10,8,39,35],target:[146,197,27,23]},
      {part:'body',matrix:combine(pixelWorld(plan),plan.soft),crop:[12,10,140,134],target:[28,42,178,170.37]},
    ]),
  ];
  if (plan.launcher) {
    const matrix=originalLauncherImageMatrix(plan);
    commands.push(plan.artId==='tower:BURST'
      ?{part:'launcher',matrix,crop:[6,5,95,87],target:[-1,-35.5,77.9,71.34]}
      :{part:'launcher',matrix,crop:[6,14,104,54],target:[-13,-13.5,52,27]});
  }
  return commands;
}

export function getOriginalPixelMuzzles(plan) {
 const candidate=candidateCommands(plan);if(candidate){const data=originalContinuousCandidateData[plan.artId],m=candidate[1].matrix;return data.muzzles.map(([x,y],i)=>({id:`M${i+1}`,x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5],sourceBoreAxisAngle:plan.actor.aimAngle,imageXAxisAngle:Math.atan2(m[1],m[0]),axisAngle:plan.actor.aimAngle,measurement:"formal source-layer candidate aperture, identical rigid PNG matrix"}));}
  const frameSource=originalFrameData[plan.artId];
  if(frameSource?.authoredFacing){const command=originalCommands(plan)[0],frame=frameSource.frames[command.part],m=command.matrix,t=command.target;const point=([x,y])=>{const q=command.bendMapper?command.bendMapper.map([x,y]):[x,y];return{x:m[0]*(q[0]+t[0])+m[2]*(q[1]+t[1])+m[4],y:m[1]*(q[0]+t[0])+m[3]*(q[1]+t[1])+m[5]}};const bore=(frame.sourceAxis??({right:0,left:Math.PI,up:-Math.PI/2,down:Math.PI/2})[plan.actor.facing??'right'])+(command.bendDelta??0);return(frame.muzzles??[]).map((p,i)=>({id:`M${i+1}`,...point(p),launcherPivot:frame.bend?point(frame.bend.pivot):null,axisAngle:plan.actor.aimAngle??0,imageXAxisAngle:command.bendDelta??0,sourceBoreAxisAngle:bore,measurement:'actual directional source aperture; rigid source-head pixel transform, fixed soles'}));}
  if(!plan.launcher)return []; // No anatomical muzzle: logical center emitter is separate.
  const layer=originalLayerData[plan.artId];
  if(layer){const gun=layer.parts.find(p=>p.part==='launcher'),matrix=originalLauncherImageMatrix(plan);return layer.muzzleSource.map(([x,y],i)=>{const px=gun.target[0]+(x-gun.crop[0])*gun.target[2]/gun.crop[2],py=gun.target[1]+(y-gun.crop[1])*gun.target[3]/gun.crop[3];return{id:`M${i+1}`,x:matrix[0]*px+matrix[2]*py+matrix[4],y:matrix[1]*px+matrix[3]*py+matrix[5],launcherPivot:{x:matrix[4],y:matrix[5]},axisAngle:plan.actor.aimAngle??0,imageXAxisAngle:Math.atan2(matrix[1],matrix[0]),sourceBoreAxisAngle:Math.atan2(matrix[1]*Math.cos(plan.artId==='tower:MORTAR'?-.8:0)+matrix[3]*Math.sin(plan.artId==='tower:MORTAR'?-.8:0),matrix[0]*Math.cos(plan.artId==='tower:MORTAR'?-.8:0)+matrix[2]*Math.sin(plan.artId==='tower:MORTAR'?-.8:0)),measurement:'source-pixel-aperture-center'};});}
  if(plan.artId==='tower:BASIC'){
    const matrix=originalLauncherImageMatrix(plan);
    const px=-13+(88-6)*.5,py=-13.5+(40.5-14)*.5;
    return [{id:'M1',x:matrix[0]*px+matrix[2]*py+matrix[4],y:matrix[1]*px+matrix[3]*py+matrix[5],launcherPivot:{x:matrix[4],y:matrix[5]},axisAngle:plan.actor.aimAngle??0,imageXAxisAngle:Math.atan2(matrix[1],matrix[0]),measurement:'actual BASIC source dark aperture center [88,40.5], same PNG matrix'}];
  }
  if(plan.artId!=='tower:BURST')return []; // No source-measured muzzle; do not borrow old drawn rig.
  const matrix=originalLauncherImageMatrix(plan);
  // Source side-projection bores; their perspective sizes need not be equal.
  // Uniform .82 source scaling keeps the four holes rigid throughout soft poses.
  return [[61,32.5],[85.5,32.5],[61,64.25],[85.5,64.25]].map(([x,y],index)=>{
    const px=-1+(x-6)*.82,py=-35.5+(y-5)*.82;
    return {id:`M${index+1}`,x:matrix[0]*px+matrix[2]*py+matrix[4],y:matrix[1]*px+matrix[3]*py+matrix[5],launcherPivot:{x:matrix[4],y:matrix[5]},axisAngle:plan.actor.aimAngle??0,imageXAxisAngle:Math.atan2(matrix[1],matrix[0]),measurement:'source-pixel-bore-center'};
  });
}

export function selectOriginalFrame(actor,source) {
  let state=source?.poseMapping?.[actor.pose];
    // The real Boss recovery vulnerability selects the approved OPEN body frame.
    // Preserve the actual AI pose DTO; this changes only source-frame presentation.
    if(actor.domain==='boss'&&actor.pose==='recover'&&actor.states?.open)state=source?.poseMapping?.open??state;
  if(!state&&['squash','stretch','contact'].includes(actor.pose))state=actor.pose;
  if(!state&&['attack','trigger'].includes(actor.pose))state='contact';
  if(!state&&actor.pose==='windup')state='squash';
  if(!state&&actor.pose==='move'){
    const cycle=source?.moveFrames??['neutral','squash','neutral','stretch','contact','neutral'];
    state=cycle[Math.floor((Math.max(0,actor.poseTime??0)%.72)/(.72/cycle.length))];
  }
  if(source?.authoredFacing){let direction=actor.facing??'right';if(source.continuousSourceAim&&Number.isFinite(actor.aimAngle)){direction=Object.entries(source.frames).filter(([key])=>key.startsWith('neutral-')).sort((a,b)=>Math.abs(Math.atan2(Math.sin(actor.aimAngle-a[1].sourceAxis),Math.cos(actor.aimAngle-a[1].sourceAxis)))-Math.abs(Math.atan2(Math.sin(actor.aimAngle-b[1].sourceAxis),Math.cos(actor.aimAngle-b[1].sourceAxis))))[0][0].slice(8);}const key=(state??'neutral')+'-'+direction;return source.frames[key]?key:'neutral-right';}
  return state&&source?.frames[state]?state:'neutral';
}

export function getOriginalPixelBounds(plan) {
  const images=loadedParts[plan.artId];if(!images)return null;
  if(originalFrameData[plan.artId]){
    const command=originalCommands(plan)[0],box=alphaBoxes.get(images[command.part]);if(!box)return null;
    const m=command.matrix,t=command.target;
    if(originalFrameData[plan.artId].continuousSourceAim){const points=[];for(const item of originalCommands(plan)){const image=images[item.part],im=item.matrix,it=item.target;if(item.bendMapper){const b=sourceMappedBounds(image,alphaRows.get(image)??[],item.bendMapper,{matrix:im,offset:it});if(b)points.push([b.x,b.y],[b.x+b.width,b.y+b.height])}else{for(const p of measuredCropHull(image,item.crop)){const x=it[0]+(p[0]-item.crop[0])*it[2]/item.crop[2],y=it[1]+(p[1]-item.crop[1])*it[3]/item.crop[3];points.push([im[0]*x+im[2]*y+im[4],im[1]*x+im[3]*y+im[5]])}}}const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return{x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys),measurement:'cached alpha>12 row-envelope supports clipped to exact runtime texture triangles; includes rigid attachments'};}


    // Whole-frame matrices are axis-aligned flip/scale: four alpha-bbox corners
    // give the exact AABB, avoiding per-row work at enemy density.
    const xs=[box[0],box[2]].map(x=>m[0]*(t[0]+x)+m[4]);
    const ys=[box[1],box[3]].map(y=>m[3]*(t[1]+y)+m[5]);
    return {x:Math.min(...xs),y:Math.min(...ys),width:Math.abs(xs[1]-xs[0]),height:Math.abs(ys[1]-ys[0]),measurement:'actual-source-alpha-threshold12-cached-bbox'};
  }
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  for(const {part,matrix:m,crop:c,target:t} of originalCommands(plan))for(const [x,py]of measuredCropHull(images[part],c)){
      const localX=t[0]+(x-c[0])/c[2]*t[2],localY=t[1]+(py-c[1])/c[3]*t[3];
      const px=m[0]*localX+m[2]*localY+m[4],wy=m[1]*localX+m[3]*localY+m[5];
      left=Math.min(left,px);top=Math.min(top,wy);right=Math.max(right,px);bottom=Math.max(bottom,wy);
  }
  return Number.isFinite(left)?{x:left,y:top,width:right-left,height:bottom-top,measurement:'actual-source-alpha-threshold12'}:null;
}
