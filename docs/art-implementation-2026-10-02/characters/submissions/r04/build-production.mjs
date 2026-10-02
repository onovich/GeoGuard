import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {RIGS} from '../../../../../src/view/art/characters/rigData.js';
import {buildCharacterPlan,planToSvg,getPlanAnchors} from '../../../../../src/view/art/characters/rig.js';
const out=path.dirname(fileURLToPath(import.meta.url));
if(fs.existsSync(path.join(out,'READY')))throw new Error('r04 is sealed; use a new revision');
const root=path.resolve(out,'../../../../..');
const identityMap=JSON.parse(fs.readFileSync(path.join(root,'docs/art-implementation-2026-10-02/integration/submissions/r01/identity-map.json'),'utf8'));
const coverage=JSON.parse(fs.readFileSync(path.join(out,'../r01/coverage.json'),'utf8'));
const bossRuntimeVariants=JSON.parse(fs.readFileSync(path.join(root,'docs/art-implementation-2026-10-02/integration/submissions/r01/runtime-boss-variants.json'),'utf8'));
const contract=path.join(root,'docs/art-implementation-2026-10-02/integration/submissions/r01/packet.json');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
if(sha(contract)!=='b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba')throw new Error('Approved integration contract SHA differs');
const write=(file,data)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof data==='string'?data:JSON.stringify(data,null,2)+'\n','utf8');};
const manifest={};
const actionPose=(action,item)=>{
 const direct={NEUTRAL:'neutral',INTACT:'neutral',MOVE:'move',SQUASH:'squash',STRETCH:'stretch',ATTACK:'attack',AUTO_ATTACK:'attack',WINDUP:'windup',OPEN:'recover',TRIGGER:'trigger',BROKEN:'broken',FADE:'fade',SPLIT_3:'neutral',RUN:'move',HOP:'move',CHASE_PLAYER:'move',HEAVY_MOVE:'squash',GUARD:'attack',HEAL:'attack',INFLATE:'attack',JAM:'attack',PHASE_DASH:'move',EMERGE:'neutral',STRIKE_TOWER:'attack',SUMMON_3_BASIC:'windup'};
 if(action.action==='STRETCH'&&item.artKey==='enemy:BEACON')return 'trigger';
 return direct[action.action]??(action.bodySources.some(s=>s.label==='ATTACK')?'attack':'neutral');
};
for(const item of identityMap.identities){
 const rig=RIGS[item.artKey];
 const source=coverage.items.find(i=>i.identity===item.artKey);
 const slug=item.resourceSlug;
 const entry={schemaVersion:1,artId:item.artKey,version:'v1',status:rig?'produced_pending_review':'not_produced',
  sourceSize:rig?{width:256,height:256}:null,rootPx:rig?.root??null,collisionCenterPx:rig?.center??null,
  collisionRadiusPx:rig?.collisionRadius??null,referenceRuntimeRadius:rig?.referenceRadius??item.runtimeRadius??bossRuntimeVariants.find(v=>v.artKey===item.artKey&&!/_T[123]$/.test(v.templateId))?.radius??(item.group==='mechanic'?(item.id==='WALL'?18:13):null),
  visualScaleMode:'runtime-radius',anchorsMeasured:Boolean(rig),geometryMeasurementMode:rig?'authored vector joints, shared sampler; raster alpha audit in r04':null,
  anatomy:item.anatomy,organCounts:source.organCounts,
  parts:rig?[{id:'body',parent:null,class:'soft',pivotPx:rig.softPivot},...Object.entries(rig.joints).map(([id,pivotPx])=>({id,parent:'body',class:id.startsWith('foot-')?'fixed-contact':'soft-attached',pivotPx,embeddedContour:!rig.shapes.some(s=>s.id===id)})),...(rig.launcher?[{id:'launcher',parent:'body',class:'rigid',pivotPx:rig.launcher.pivot}]:[])]:[],
  muzzles:rig?.launcher?.muzzles.map((m,i)=>({id:`M${i+1}`,partId:'launcher',positionPx:[rig.launcher.pivot[0]+m[0],rig.launcher.pivot[1]+m[1]],axisRadians:0,angleMin:-.44,angleMax:.44}))??[],
  directions:rig?{right:{mirror:false,bodyRotation:0,launcherAngleRange:[-.44,.44]},left:{mirror:'entire rig at root including face/feet/P/M before residual aim',launcherAngleRange:[-.44,.44]},up:rig.launcher?{mirror:false,pivotPx:rig.launcher.upPivot??rig.launcher.pivot,projection:rig.launcher.upShapes?'vertical tube with elliptical visible aperture':'approved BURST upward oblique 4-bore common plane',projectedAxisRadians:rig.launcher.upShapes?-Math.PI/2:rig.launcher.upAngle,angleRange:rig.launcher.upShapes?[-.22,.22]:[-.15,.15]}:{mirror:false,bodyRotation:0},outOfRange:'nearest supported rigid projection; actual projectile direction/origin remain logical'}:{},
  clips:rig?{neutral:{duration:1,loop:true,frames:'continuous vector sampler'},move:{duration:.72,loop:true,frames:'N->stretch->N->squash->N; smooth fixed-root sine'},attack:{duration:'existing window',loop:false,frames:'progress0..1; local body pulse only'},windup:{duration:'existing window',loop:false,frames:'progress0..1; local compression only'},recover:{duration:'existing window',loop:false,frames:'same neutral body; external OPEN overlay only'},broken:{duration:'sidecar only',loop:false,frames:rig.brokenShapes?'authored fragments':'neutral disappearance body'},fade:{duration:'sidecar only',loop:false,frames:'authored broken body, alpha1-progress'},sourceOffset:[0,0],sourceSize:[256,256],trim:null}:{},
  actions:Object.fromEntries(source.actions.map(a=>[a.action,{status:rig?'produced_pending_review':'not_produced',pose:rig?actionPose(a,item):null,clip:rig?actionPose(a,item):null,archiveOnly:a.namedBodyMode?.includes('archived')??false,facing:a.action.startsWith('DIR_')?a.action.slice(4).toLowerCase():null,externalLevel:a.action.startsWith('LV')?Number(a.action.slice(2))-1:null,mappingMode:a.mappingMode,bodySources:a.bodySources,effectKeys:a.effectKeys,notes:a.action==='SPLIT_3'?'pre-split body only; independent SPLINTER body resource registered separately':a.action.startsWith('P')?'existing runtime phase only; same approved body reuse':null}])),
  sourceFile:rig?`art/characters/v1/${slug}/source.svg`:null,
  bodyResource:rig?`art/characters/v1/${slug}/body.svg`:null,
  icon:rig?{src:`art/characters/v1/${slug}/icon.svg`,width:64,height:64,alt:item.artKey}:null,
  referenceSources:[...new Map(source.actions.flatMap(a=>a.bodySources).map(s=>[s.path,{path:s.path,sha256:s.sha256}])).values()],
 };
 manifest[item.artKey]=entry;
 if(!rig)continue;
 const actor={artId:item.artKey,x:rig.center[0],y:rig.center[1],radius:rig.collisionRadius,facing:'right',aimAngle:0,pose:'neutral',poseProgress:0,poseTime:0,alpha:1};
 const plan=buildCharacterPlan(actor,{quality:'full'});
 const anchors=getPlanAnchors(plan);
 entry.neutralBoundsPx=anchors.bounds;
 entry.muzzles=anchors.muzzles.map((m,i)=>({id:`M${i+1}`,partId:'launcher',positionPx:[m.x,m.y],axisRadians:m.axisAngle,visibleProjectionAxisRadians:plan.launcher.angle,angleMin:-.44,angleMax:.44}));
 if(rig.launcher){entry.directions.up.projection=rig.launcher.upShapes?'vertical tube with elliptical visible aperture':item.artKey==='tower:BURST'?'approved upward oblique 4-bore common plane':'rigid authored launcher at supported upward angle';entry.directions.up.projectedAxisRadians=rig.launcher.upShapes?-Math.PI/2:rig.launcher.upAngle??-.58;}
 entry.clips.windup.frames='continuous sin(pi*progress) soft compression or sin² named-part variant; neutral endpoints';
 entry.clips.attack.frames='continuous local pulse or sin² named-part variant; neutral endpoints';
 entry.clips.recover.frames='approved recover body sampled continuously; OPEN remains external';
 const bodySvg=planToSvg(plan);
 const dir=path.join(root,'public/art/characters/v1',slug);
 write(path.join(dir,'source.svg'),bodySvg);write(path.join(dir,'body.svg'),bodySvg);
 const bounds=anchors.bounds;const side=Math.max(bounds.width,bounds.height)+12;
 const viewBox=[bounds.x+(bounds.width-side)/2,bounds.y+(bounds.height-side)/2,side,side];
 entry.iconSourceViewBox=viewBox;
 write(path.join(dir,'icon.svg'),planToSvg(plan,{width:64,height:64,viewBox}));
 write(path.join(out,'editable',slug+'.svg'),bodySvg);
 write(path.join(dir,'rig.json'),entry);
}
const compactManifest=Object.fromEntries(Object.entries(manifest).map(([id,entry])=>{
 const sourceCatalog=entry.referenceSources;
 const sourceIndex=new Map(sourceCatalog.map((s,i)=>[s.path,i]));
 const {referenceSources,...runtime}=entry;
 runtime.sourceCatalog=sourceCatalog;
 runtime.actions=Object.fromEntries(Object.entries(entry.actions).map(([key,action])=>{
  const {bodySources,notes,...mapping}=action;
  return [key,{...mapping,sourceCells:bodySources.map(s=>({source:sourceIndex.get(s.path),row:s.row,column:s.column,label:s.label}))}];
 }));
 return [id,runtime];
}));
// All source excerpts and full locators remain in the immutable documentation manifest.
write(path.join(root,'src/view/art/characters/manifest.js'),`// Generated compact runtime registry. Full provenance: characters/submissions/r04/manifest.json.\n// 48 identities; produced_pending_review entries are drawable; other identities fall back.\nexport const characterManifest = ${JSON.stringify(compactManifest)};\n`);
write(path.join(out,'manifest.json'),manifest);
console.log(JSON.stringify({identities:Object.keys(manifest).length,produced:Object.values(manifest).filter(e=>e.status==='produced_pending_review').length,mappedProducedActions:Object.values(manifest).filter(e=>e.status==='produced_pending_review').reduce((n,e)=>n+Object.keys(e.actions).length,0)},null,2));
