import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {RIGS} from '../../../../../src/view/art/characters/rigData.js';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../../../..');
if(fs.existsSync(path.join(out,'READY')))throw new Error('r04 is sealed; use a new revision');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const coverage=read('docs/art-implementation-2026-10-02/characters/submissions/r01/coverage.json');
const reuse=read('docs/art-implementation-2026-10-02/integration/submissions/r01/state-reuse-375.json');
const skills=read('docs/art-implementation-2026-10-02/integration/submissions/r01/boss-skills-95.json').skills;
const variants=read('docs/art-implementation-2026-10-02/integration/submissions/r01/runtime-boss-variants.json');
const manifest=read('docs/art-implementation-2026-10-02/characters/submissions/r04/manifest.json');
const frame={schemaVersion:1,epoch:'qa:r04',time:1,dt:0,paused:true,viewport:{width:1440,height:900,dpr:1},camera:{x:0,y:0},quality:'full'};
const defaults=id=>({key:`qa:${id}`,artId:id,domain:id.split(':')[0],x:128,y:128,radius:manifest[id].referenceRuntimeRadius,referenceRadius:manifest[id].referenceRuntimeRadius,facing:'right',aimAngle:0,pose:'neutral',poseTime:0,poseProgress:0,movementSpeed:0,alpha:1,level:0,hp:100,maxHp:100,shield:0,maxShield:0,hitFlash:0,states:{frozen:false,slowed:false,phased:false,burrowed:false,armored:false,open:false,partnerFallen:false},boss:null,mechanic:null,presentationOffset:{x:0,y:0}});
const phaseData=id=>variants.find(v=>v.artKey===id&&!/_T[123]$/.test(v.templateId))??variants.find(v=>v.artKey===id);
const validAbility=(id,ability)=>skills.some(s=>s.abilityId===ability&&s.active&&s.actualOwners.includes(id));
const phaseOf=(id,ability)=>Math.max(0,phaseData(id)?.phases?.findIndex(p=>p.abilities.includes(ability))??0);
const sample=(id,changes,label,phaseIndex=0,castAbility=null)=>{
 const actor={...defaults(id),...changes};
 if(id.startsWith('boss:'))actor.boss={phaseIndex,phaseCount:phaseData(id)?.phases?.length??3,castAbility,actionMode:actor.pose==='neutral'?'idle':actor.pose,actionTimer:actor.pose==='windup'?1-actor.poseProgress:0,windupDuration:1};
 if(id.startsWith('mechanic:'))actor.mechanic={kind:id.slice(9).toLowerCase(),timer:actor.poseProgress,life:1,targetKey:null,parentKey:null,cargo:0};
 const rig=RIGS[id];
 return {label,execution:rig?'drawCharacter':'pending-production-do-not-render-as-covered',diagnosticOnly:['squash','stretch'].includes(actor.pose),runtimeActor:actor,sourceActor:rig?{...actor,x:rig.center[0],y:rig.center[1],radius:rig.collisionRadius}:null,frame};
};
const entries=[];
for(const item of coverage.items)for(const action of item.actions){
 const id=item.identity,key=action.action,samples=[],archived=action.namedBodyMode?.includes('archived')??false;
 const bodyLabels=action.bodySources.map(s=>s.label);
 const poseByKey={NEUTRAL:'neutral',INTACT:'neutral',SQUASH:'squash',STRETCH:'stretch',ATTACK:'attack',AUTO_ATTACK:'attack',MOVE:'move',WINDUP:'windup',OPEN:'recover',TRIGGER:'trigger',BROKEN:'broken',FADE:'fade'};
 let pose=poseByKey[key]??'neutral';
 if(id==='enemy:BEACON'&&key==='STRETCH')pose='trigger';
 if(item.group==='boss'&&!poseByKey[key])pose=bodyLabels.includes('ATTACK')?'attack':'neutral';
 if(/^DIR_/.test(key)){
  const facing=key.slice(4).toLowerCase();samples.push(sample(id,{facing,aimAngle:facing==='up'?-Math.PI/2:facing==='left'?Math.PI:0},key));
 }else if(/^LV[1-4]$/.test(key))samples.push(sample(id,{level:Number(key.slice(2))-1},'same body + external level overlay'));
 else if(/^P[1-3]$/.test(key))samples.push(sample(id,{pose:'neutral'},'approved phase neutral-body reuse',Number(key.slice(1))-1));
 else if(archived)samples.push(sample(id,{pose:'neutral'},'archived concept; neutral source reuse; no runtime event'));
 else if(item.group==='boss'&&Array.isArray(action.runtimeEvent)&&action.runtimeEvent.some(a=>validAbility(id,a))){
  for(const ability of action.runtimeEvent.filter(a=>validAbility(id,a)))for(const progress of [0,.5,1])samples.push(sample(id,{pose,poseProgress:progress,poseTime:progress,states:{...defaults(id).states,partnerFallen:key.startsWith('SOLO')}},`${ability}/${pose}/${progress}`,phaseOf(id,ability),ability));
 }else if(key==='MOVE'||['RUN','HOP','CHASE_PLAYER'].includes(key))for(let i=0;i<=8;i++)samples.push(sample(id,{pose:'move',poseTime:i*.72/8,movementSpeed:1},`fixed-position loop ${i}/8`));
 else if(key==='HEAVY_MOVE')samples.push(sample(id,{pose:'squash',movementSpeed:1},'heavy movement source squash; diagnostic in-place key pose'));
 else if(key==='SUMMON_3_BASIC')for(const p of ['windup','trigger','recover'])for(const progress of [0,.5,1])samples.push(sample(id,{pose:p,poseProgress:progress,poseTime:progress},`BEACON source ${p}/${progress}; children separate`));
 else if(key==='PHASE_DASH')samples.push(sample(id,{pose:'move',poseTime:.18,movementSpeed:1,alpha:.42,states:{...defaults(id).states,phased:true}},'existing phased state; normal movement, no invented dash'));
 else if(key==='EMERGE')for(const burrowed of [true,false])samples.push(sample(id,{pose:'neutral',alpha:burrowed?.25:1,states:{...defaults(id).states,burrowed}},`same actor burrowed=${burrowed}; no displacement`));
 else if(['GUARD','HEAL','INFLATE','JAM','STRIKE_TOWER'].includes(key))for(const progress of [0,.5,1])samples.push(sample(id,{pose:'attack',poseProgress:progress,poseTime:progress},`approved ${bodyLabels.join('/')} source/contact body; external effect separate`));
 else if(key==='SPLIT_3')samples.push(sample(id,{pose:'neutral'},'same pre-split SHARD body; actual SPLINTER child actors separate'));
 else for(const progress of ['attack','windup','recover','trigger','fade'].includes(pose)?[0,.5,1]:[0])samples.push(sample(id,{pose,poseProgress:progress,poseTime:progress},`${pose}/${progress}`));
 const sourceReuse=reuse.actions.find(a=>a.key===action.key);assert.ok(sourceReuse);
 entries.push({key:action.key,artId:id,action:key,status:RIGS[id]?'produced_pending_review':'not_produced',archiveOnly:archived,bodyReuseKey:sourceReuse.bodyReuseKey,upstreamPointer:sourceReuse.upstreamPointer,sourceContract:action.sourceContract,mappingMode:action.mappingMode,namedBodyMode:action.namedBodyMode,sourceLabels:bodyLabels,runtimeEvent:action.runtimeEvent,effectKeys:action.effectKeys,bodySourceLocators:action.bodySources.map(({path,sha256,row,column,label})=>({path,sha256,row,column,label})),samples,
  relatedActors:id==='boss:HIVE'&&key==='HATCH'?[{artId:'mechanic:NEST',pose:'trigger',meaning:'actual NEST trigger; independent BASIC children only if successful'}]:key==='SPLIT_3'?[{artId:'enemy:SPLINTER',meaning:'actual three independent child UIDs; not part of parent'}]:key==='SUMMON_3_BASIC'?[{artId:'enemy:BASIC',meaning:'only actual successful child UIDs, never assume requested 3'}]:[],
  note:key==='OPEN'?'recover body is reused; states.open remains false in body-only reference; full-layer QA must derive OPEN from actual damageTakenMultiplier>1':null});
}
assert.equal(entries.length,375);const drawable=entries.filter(e=>e.status==='produced_pending_review').length;
const abilitySamples=skills.filter(s=>s.active).map(skill=>({abilityId:skill.abilityId,actualDispatch:skill.actualDispatch,sourceOwners:skill.actualOwners,owners:skill.actualOwners.map(id=>({artId:id,status:RIGS[id]?'produced_pending_review':'not_produced',samples:['windup','attack','recover'].flatMap(pose=>[0,.5,1].map(progress=>sample(id,{pose,poseProgress:progress,poseTime:progress},`${skill.abilityId}/${pose}/${progress}`,phaseOf(id,skill.abilityId),skill.abilityId)))}))}));
assert.equal(abilitySamples.length,95);
const sourceFiles=fs.readdirSync(path.join(root,'src/view/art/characters')).filter(name=>name.endsWith('.js')).map(name=>{const file=path.join(root,'src/view/art/characters',name);return {path:`src/view/art/characters/${name}`,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};});
assert.ok(entries.every(e=>e.samples.every(s=>Number.isFinite(s.runtimeActor.radius)&&s.runtimeActor.radius>0)),'No null reference radii');
fs.writeFileSync(path.join(out,'qa-action-inputs-375.json'),JSON.stringify({schemaVersion:1,revision:'r04',scope:'reference action inputs; not production completion or invented game state',sourceFiles,counts:{references:375,drawableReferences:drawable,pendingReferences:375-drawable,archivedReferences:entries.filter(e=>e.archiveOnly).length,activeSkills:95},entries,bossAbilitySamples:abilitySamples},null,2)+'\n');
console.log(JSON.stringify({references:entries.length,drawable,pending:375-drawable,abilities:abilitySamples.length,archived:entries.filter(e=>e.archiveOnly).length}));
