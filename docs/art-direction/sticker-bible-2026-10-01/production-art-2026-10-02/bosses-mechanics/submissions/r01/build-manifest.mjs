import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
const repo = 'D:/WebProjects/GeoGuard';
const out = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const refRoot = 'docs/art-direction/sticker-bible-2026-10-01/action-consistency/';
const read = p => fs.readFileSync(path.join(repo,p),'utf8');
const write = (name,value) => fs.writeFileSync(path.join(out,name), typeof value === 'string' ? value : JSON.stringify(value,null,2)+'\n','utf8');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const anatomy = JSON.parse(read(refRoot+'anatomy-lock.json')).items.filter(x=>['boss','mechanic'].includes(x.group));
const E='src/logic/engine/encounterRuntime.js', A='src/logic/engine/bossAbilityRuntime.js', O='src/logic/engine/bossOptimizedAbilities.js', M='src/logic/engine/bossMechanicEntities.js', C='src/logic/engine/bossCombatRuntime.js', H='src/logic/hooks/useGeoGuardGame.jsx';
const encounter = await import(pathToFileURL(path.join(repo,E)));
function sections(file,pattern) {
  const text=read(file), matches=[...text.matchAll(pattern)];
  return Object.fromEntries(matches.map((m,i)=>[m[1],{file,startLine:text.slice(0,m.index).split('\n').length,endLine:text.slice(0,matches[i+1]?.index??text.length).split('\n').length-1,text:text.slice(m.index,matches[i+1]?.index??text.length).trim()}]));
}
const base=sections(A,/^  if \(abilityName === '([^']+)'\)/gm);
const optimized=sections(O,/^  (\w+): \(c\) =>/gm);
// Last handler ends before dispatch; preserve only handler, not exported dispatcher.
optimized.soloLunarOrbit.text=optimized.soloLunarOrbit.text.split('\n};')[0];
optimized.soloLunarOrbit.endLine=205;
function evidence(file,needle){const lines=read(file).split('\n');return {file,line:lines.findIndex(x=>x.includes(needle))+1,anchor:needle};}
const entryEvidence=[evidence(H,'runBossOptimizedAbility({'),evidence(O,'const handler = handlers[context.abilityName]'),evidence(O,'else runBossAbilityEffect(context)')];
const phaseById={};
for (const x of anatomy.filter(x=>x.group==='boss')) {
  if(x.id.startsWith('TWINS_')){
    const members=encounter.createTwinsEncounterMembers({value:100,maxHp:100,baseSpeed:10,damage:10});
    phaseById[x.id]=members[x.id==='TWINS_SUN'?0:1].phases;
  }else phaseById[x.id]=encounter.getBossPhaseOverrides({id:x.id});
}
const attach={
 COMMANDER:['top-lobes:3','arms:2; inner-fists:2','feet:2'], HUNTER:['rear-ear:1','top-horn:1','nose-wedge:1','rear-lobe:1','feet:2'], FORTRESS:['top-shell:1','side-shields:2','feet:2'], PRISM:['mirror-wings:2 (parent parts, not PHASE units)'], HIVE:['top-ears:2','nest-apertures:3; upper1/lower2','skirt-lobes:5'], FROST_JUDGE:['U-collar:1','fists:2','floating-crown:1 (parent part)','chest-diamond:1'], RAIL_WARLORD:['back-fins:2','feet:2','tail-lobe:1','rigid-rail-arms:2 + center-port:1'], COLLECTOR:['top-buds:2','feet:2','curled-tail-arm:1','belly-coin:1'], TWINS_SUN:['sun-petals:6'], TWINS_MOON:['coral-lower-mark:1'], DRAGON:['wings:2','continuous-tail:1','rounded-muzzle:1'], SPIDER_MATRIARCH:['large-legs:4','short-bottom-feet:2'], ASTROLABE:['moon-shell:1','center-orb:1','orbit-orb:1 (parent part; no independent HP)'], BLOOD_FORGE:['door-arms:2','feet:2','core-orb:1'], VOID_CONDUCTOR:['arms:2 with 3 fingers each','skirt-lobes:3'], LABYRINTH_KEEPER:['door-shields:2','feet:2'], NIGHTMARE_BLOOM:['main-petals:3','rear-leaves:2','bottom-leaves:2','teeth:6 upper3/lower3'], NEST:['nest-petals:3','feet:2','teeth:2','tongue:1'],WEB:['interwoven-bands:3','center-knot:1'],ROOT:['root-mat:1','sprouts:3'],WALL:['corner-lobes:4','feet:2'],SEAL:['opposing-claws:2; rounded tips; no head/feet'],RETICLE:['arcs:3 at 12/4/8 oclock'],COURIER:['long-ear:1','feet:2','bag:1','mint-diamond:1 (cargo symbol; not pickup logic)']
};
const footIds=new Set(['COMMANDER','HUNTER','FORTRESS','RAIL_WARLORD','COLLECTOR','SPIDER_MATRIARCH','BLOOD_FORGE','LABYRINTH_KEEPER','NEST','WALL','COURIER']);
const rootFor=id=>({contractId:`root:${id}`,canvas:[512,512],root:[256,448],collisionCenter:[256,288],collisionOffsetFromRoot:[0,-160],units:'proposed source-canvas pixels; art design specification, not extracted sprite measurements',kind:footIds.has(id)?'fixed-ground-foot-midpoint':'fixed-ground-projection',rule:'All states keep root fixed. Preserve source canvas and crop offset. World x/y remain logic collision center; draw origin = world center - collisionCenter. Shadows, guides and status overlays exported separately.'});
const special={
 COMMANDER:{ADVANCE:['summonFormation','commandLine','phalanxAdvance'],SHIELD:['shieldPulse'],DASH:['commandRush']},
 HUNTER:{PROBE:['dashAtPlayer','markPrey'],PINCER:['summonScouts','pincerRush'],AFTERIMAGE:['afterimageBurst','feintStrike']},
 FORTRESS:{SIEGE:['summonSiege','bastionMortar'],ARMOR:['fortify','shockRam'],QUAKE:['quake','bunkerRing']},
 PRISM:{BEAM:['prismBeam','refractVolley'],MIRRORS:['mirrorSummon','prismLattice','mirrorStep'],TRIPLE:['tripleBeam']},
 HIVE:{NEST:['spawnHive','broodShift'],HATCH:['mechanic:nest:trigger'],SWARM:['summonSwarm','hivePulse','hiveCollapse']},
 FROST_JUDGE:{RING:['frostRing','whiteout'],FREEZE:['freezeTower','glacialPrison','coldSnap'],STORM:['summonFrostGuards','whiteout','coldSnap']},
 RAIL_WARLORD:{MARK:['markTower','crosshairBarrage'],SNIPE:['railShot','suppressiveGrid'],OVERLOAD:['overload','killLane']},
 COLLECTOR:{TAX:['stealMoney','taxBeacon'],ESCORT:['summonScouts','paydaySweep'],RANSOM:['ransomBurst','repossess']},
 TWINS_SUN:{SOLO:['soloSolarVolley'],ORBIT:[],SWAP:[],ECLIPSE:['eclipsePulse','twinCrossfire'],SOLO_SUN:['soloSolarVolley']},
 TWINS_MOON:{SOLO:['soloLunarOrbit'],ORBIT:[],SWAP:[],ECLIPSE:['eclipsePulse','twinCrossfire'],SOLO_MOON:['soloLunarOrbit']},
 DRAGON:{BREATH:['dragonStrafe'],TAIL:['wingBuffet'],METEOR:['meteorRain'],STRAFE:['dragonStrafe'],EMBER_WAKE:['emberWake'],WING_BUFFET:['wingBuffet'],SKY_DIVE:['skyDive'],INFERNO_RING:['infernoRing']},
 SPIDER_MATRIARCH:{WEB:['webTrap','silkVolley'],BROOD:['spawnSpiderlings','broodAmbush','nestBloom'],FIELD:['webField']},
 ASTROLABE:{WELL:['gravityWell','starfall'],ORBIT:['orbitalShots','orbitalLock'],SINGULARITY:['singularity','eventHorizon']},
 BLOOD_FORGE:{ARMOR:['forgeArmor','slagDrop'],SACRIFICE:['sacrificeMinions','brandLine'],OVERHEAT:['moltenBurst','forgeDetonation']},
 VOID_CONDUCTOR:{PULSE_MEASURE:['pulseMeasure'],SYNCOPATE:['syncopate'],CRESCENDO:['crescendo'],TWO_BEAT:['conductLines','tempoShift'],FINALE:['finale']},
 LABYRINTH_KEEPER:{WALL:['raiseWalls','corridorClamp'],GATE:['gateSwap','mazeFold'],COMPRESS:['mazeCrush','deadEnd']},
 NIGHTMARE_BLOOM:{SEED:['seedPods','blightRoots'],BLOOM:['poisonBloom','sporeBurst'],GARDEN:['gardenWake','creepingCanopy']}
};
const manualNotes={
 'TWINS_SUN:ORBIT':'旧概念同轨姿态保留；当前TWIN_SOL默认技能无twinOrbit。可用于原地idle表现，不声称轨道攻击。',
 'TWINS_MOON:ORBIT':'旧概念同轨姿态保留；当前TWIN_LUNA默认技能无twinOrbit。可用于原地idle表现。soloLunarOrbit另列真实技能。',
 'TWINS_SUN:SWAP':'旧换位概念归档；当前成员默认技能无twinSwap。不以本图新增互换位置能力。',
 'TWINS_MOON:SWAP':'旧换位概念归档；当前成员默认技能无twinSwap。不以本图新增互换位置能力。',
 'DRAGON:BREATH':'保留旧key；身体吐息姿态复用到当前dragonStrafe线危险区，不制造实体火球。dragonBreath仅存在基础实现/旧模板，非默认phase。',
 'DRAGON:TAIL':'保留旧key；尾部姿态仅作为当前wingBuffet排斥区域动作的身体候选。tailSweep不在当前phase，且无效果handler；不得当真实尾扫技能。',
 'HIVE:HATCH':'孵化主体是独立NEST，HIVE身体复用NEUTRAL；NEST实际触发BASIC，不能烘焙回HIVE。'
};
const overrideNotes={
 markTower:'基础即时线攻击被独立RETICLE取代，hp16，targetUid，1.5秒后目标处延迟区域；节点可击破。',
 mirrorStep:'当前仅Boss逻辑换位+旧点到新点line hazard；基础PHASE召唤和impact wave不执行。',
 spawnHive:'当前两个独立NEST，hp36；不是基础BEACON。NEST触发另生BASIC。',
 broodShift:'当前迁移到NEST旁；无NEST则spawnHive。基础BEACON/迁移线/impact wave不执行。',
 hivePulse:'当前NEST点区域危险，ownerMechanicUid；基础BEACON点与治疗不执行。',
 hiveCollapse:'当前NEST点区域危险；基础BEACON周围SHARD不执行。summonSwarm仍基础SHARD。',
 stealMoney:'生成携款COURIER成功才扣钱；打破直接返还state.money；不生成必须拾取的state.drops。',
 taxBeacon:'当前只区域危险；基础扣钱不执行，也不生成BEACON实体。',
 repossess:'当前区域危险+携款COURIER；基础直接damageTarget/直接扣钱不同。',
 frostRing:'当前排队frost区域；基础即刻damageArea和周边敌人slow不执行。',
 freezeTower:'当前生成SEAL hp16；基础直接frozenTimer=3.5不执行。SEAL成功触发冻结1.6秒并结束节点。',
 coldSnap:'当前最多两个高cost塔对应SEAL；基础多目标frost区域不执行。',
 webTrap:'当前WEB hp16和绑定ownerMechanicUid地形；基础普通区域不执行。',
 silkVolley:'当前两个WEB；基础三次随机区域不执行。',
 nestBloom:'当前两个WEB hp20；基础SPLINTER和终局特效不执行。名字nest不表示NEST实体。',
 webField:'当前WEB(nestBloom)+3 SPLINTER；基础BURROWER和大范围终局效果不执行。',
 seedPods:'当前两个ROOT；基础MEDIC不执行。',
 gardenWake:'当前ROOT+3 SHARD+附近非Boss非机关治疗；基础6 SHARD及大区域不执行。',
 creepingCanopy:'当前复用seedPods=ROOT；基础五个spore区域不执行。',
 raiseWalls:'当前独立WALL构成带缺口围栏；基础SIEGE与区域不执行。',
 gateSwap:'当前切换横竖WALL布局并使旧墙hp=0；基础Boss瞬移及连线不执行。',
 mazeCrush:'当前每个WALL点区域，绑定ownerMechanicUid；基础塔/玩家点区域不同。',
 deadEnd:'当前复用mazeCrush；基础四个环绕区域不执行。',
 gravityWell:'当前区域pull带maxPullStep；视觉只消费实际危险边界与时间。',
 singularity:'当前单一持续排队区域pull；基础直接移动塔坐标与终局线/冲击波不执行。',
 sacrificeMinions:'当前仅windup已标记且存活范围内单位，设置hp=0/consumed，治疗护盾+排队区域；基础直接splice不同。',
 quake:'当前延迟区域；基础即时damageArea不执行。',
 wingBuffet:'当前负pull区域；基础立即推玩家/塔坐标与impact wave不执行。',
 skyDive:'当前dashTimer/vx/vy与目标延迟区域；基础瞬移和终局额外效果不执行。',
 conductLines:'当前按beat两条平行线；基础Boss起点交叉线不执行。',
 pulseMeasure:'当前按beat四角区域；基础随机点不执行。',
 tempoShift:'当前nextBeat+2 FAST；基础冻结塔与4 FAST不执行。',
 syncopate:'当前按beat三条线；基础固定间隔不同。',
 crescendo:'当前按beat四圈；基础五圈不同。',
 finale:'当前按beat八方向线；基础固定delay不同。',
 soloSolarVolley:'幸存日新增三线；原twinCrossfire移除，不是新实体。',
 soloLunarOrbit:'幸存月新增四区；原twinCrossfire移除，不是新实体。'
};
const helperEvidence={
 spawnHive:[evidence(O,"plant(c, 'nest'")],broodShift:[evidence(O,"plant(c, 'nest'")],
 stealMoney:[evidence(O,'const stealWithCourier'),evidence(O,"plant(context, 'courier'")],repossess:[evidence(O,'const stealWithCourier')],
 webField:[evidence(O,'nestBloom:')],gardenWake:[evidence(O,'seedPods:')],creepingCanopy:[evidence(O,'seedPods:')],raiseWalls:[evidence(O,'const placeWalls')],gateSwap:[evidence(O,'const placeWalls')],deadEnd:[evidence(O,'mazeCrush:')]
};
const mechanicSpawns={markTower:['RETICLE'],spawnHive:['NEST'],broodShift:['NEST (only when none)'],stealMoney:['COURIER'],repossess:['COURIER'],freezeTower:['SEAL'],coldSnap:['SEAL'],webTrap:['WEB'],silkVolley:['WEB'],nestBloom:['WEB'],webField:['WEB'],seedPods:['ROOT'],gardenWake:['ROOT'],creepingCanopy:['ROOT'],raiseWalls:['WALL'],gateSwap:['WALL']};
const relatedMechanics={hivePulse:['NEST'],hiveCollapse:['NEST'],mazeCrush:['WALL'],deadEnd:['WALL']};
const effectiveExtras={webField:["SPLINTER"],gardenWake:['SHARD']};
function extractUnits(text){return [...new Set([...text.matchAll(/spawnAround\([^,]+,\s*'([^']+)'|spawnEnemyAt\('([^']+)'/g)].map(x=>x[1]??x[2]))];}
function visualOps(text){let a=[];for(const [token,type]of [['queueLineHazard','line-hazard: telegraph + active + aftermath'],['queueAreaHazard','area-hazard: telegraph + active + aftermath'],['spawnImpactWave','impact-wave: decorative feedback, separate lifecycle'],['damageArea','instant-area-feedback: no invented projectile'],['spawnFloatingText','floating-text: UI feedback'],['.shield','shield-overlay'],['frozenTimer','target-freeze-overlay'],['enemy.hp = Math.min','healing-feedback']])if(text.includes(token))a.push(type);return a;}
const defaults=new Set(Object.values(phaseById).flatMap(ps=>ps.flatMap(p=>p.abilities)));
const abilityIds=[...new Set([...defaults,'soloSolarVolley','soloLunarOrbit','hiveHeal','twinOrbit','twinBolt','twinSwap','dragonBreath','tailSweep'])];
const catalog={};
for(const id of abilityIds){
 const selected=optimized[id]??base[id];const raw=selected?.text??'';
 const owners=anatomy.filter(x=>x.group==='boss'&&phaseById[x.id].some(p=>p.abilities.includes(id))).map(x=>x.id);
 if(id==='soloSolarVolley')owners.push('TWINS_SUN');if(id==='soloLunarOrbit')owners.push('TWINS_MOON');
 const expanded=raw+(id==='deadEnd'?optimized.mazeCrush.text:'')+(id==='webField'?optimized.nestBloom.text:'')+(['gardenWake','creepingCanopy'].includes(id)?optimized.seedPods.text:'')+(['stealMoney','repossess'].includes(id)?read(O).slice(read(O).indexOf('const stealWithCourier'),read(O).indexOf('// These handlers')):'');
 let effects=visualOps(expanded);
 if(['webTrap','silkVolley','nestBloom','webField','seedPods','gardenWake','creepingCanopy'].includes(id))effects.push('mechanic-owned terrain (WEB/ROOT only), ends when mechanic is defeated');
 if(['freezeTower','coldSnap'].includes(id))effects.push('target-freeze overlay only after living SEAL timer fires; node ends');
 if(id==='markTower')effects.push('target area-mark after living RETICLE timer fires; node ends');
 if(['stealMoney','repossess'].includes(id))effects.push('money feedback/courier cargo; direct refund, no pickup entity');
 if(relatedMechanics[id]?.length)effects.push('uses existing independent mechanic world anchors: '+relatedMechanics[id].join(', '));
 let motions=[];
 if(/dashTimer\s*=/.test(raw))motions.push('world dash through logic dashTimer/dashVx/dashVy; body plays in place');
 if(/(?:boss|c\.boss)\.[xy]\s*=/.test(raw))motions.push('world-position reassignment by logic; no sprite root displacement');
 if(/pull:/.test(raw))motions.push('hazard pull/push affects targets in logic, never baked into body');
 if(['raiseWalls','gateSwap'].includes(id))motions.push('independent WALL placement/replacement; not Boss body motion');
 catalog[id]={abilityId:id,owners,defaultEncounter:defaults.has(id),availability:defaults.has(id)?'default phase':id.startsWith('solo')?'survivor-added':selected?'legacy/editor-only handler; not default phase':'library key without effect handler; not default phase',dispatch:optimized[id]?'optimized':base[id]?'fallback':'no-handler',body:'Same identity rig; NEUTRAL -> WINDUP -> ATTACK -> OPEN/recover. Per-skill effects/entities stay outside body; actual actionMode controls duration.',attachment:'Use owner attachment contracts; parent parts never acquire HP.',summon:[...extractUnits(raw),...(effectiveExtras[id]??[])].filter((v,i,a)=>a.indexOf(v)===i).map(id=>({id,class:'independent-ai-hp-unit',owner:'enemies group'})),mechanic:(mechanicSpawns[id]??[]).map(id=>({id,class:'independent-hp-timed-mechanic',owner:'bosses-mechanics group'})),relatedMechanics:relatedMechanics[id]??[],effect:effects,logicalMotion:motions.length?motions:['No additional body translation specified by this handler; ordinary movement still controlled by logic.'],runtimeEvidence:[...entryEvidence,...(selected?[{file:selected.file,startLine:selected.startLine,endLine:selected.endLine}]:[evidence('src/logic/engine/bossAuthoringRules.js',id+':')]),...(helperEvidence[id]??[])],overrideDifference:overrideNotes[id]??'No optimized override; the base handler executes.',sourceExcerpt:raw};
}
const mechanics={
 NEST:{create:['spawnHive','broodShift'],trigger:'At timer expiry spawnAround BASIC x3; timer resets 6s; first timer 3s. Spawn budget may prevent actual children.',summon:['BASIC'],effect:['independent summon feedback only after successful spawn'],motion:'Static world root; no chase AI.'},
 WEB:{create:['webTrap','silkVolley','nestBloom','webField'],trigger:'WEB terrain queued at creation; timer eventually set 100. TRIGGER is visual active-state reference, not a second damage or spawn event.',summon:[],effect:['ownerMechanicUid web terrain'],motion:'Static world root.'},
 ROOT:{create:['seedPods','gardenWake','creepingCanopy'],trigger:'At timer expiry create child ROOT with own uid/hp and parentUid; first timer3s then4s; each child queues its own terrain.',summon:['ROOT'],effect:['ownerMechanicUid poison terrain','optional parent-child link is effect only'],motion:'Static node; child at independent world point, not stretching parent body.'},
 WALL:{create:['raiseWalls','gateSwap'],trigger:'Solid independent enemy; timer becomes100. Layout replacement kills previous walls; no new attack in TRIGGER pose. mazeCrush/deadEnd hazards separate.',summon:[],effect:['ownerMechanicUid wall area warnings for mazeCrush/deadEnd'],motion:'Static individual roots; layout replacement creates new nodes.'},
 SEAL:{create:['freezeTower','coldSnap'],trigger:'timer1.5s; living target tower gets max(current frozenTimer,1.6); node hp=0. Pre-trigger destruction prevents freeze. life2s.',summon:[],effect:['target-only freeze overlay, separate tower anchor; do not include tower or FROST_JUDGE in SEAL body'],motion:'Static node; center between boss and target used for initial placement only.'},
 RETICLE:{create:['markTower'],trigger:'timer1.5s; living target gets area hazard radius32 damage22 delay0.8; node hp=0. Pre-trigger destruction prevents warning/attack. life2s.',summon:[],effect:['target area mark, separate from three-arc node'],motion:'Static node. Target position resolved at trigger.'},
 COURIER:{create:['stealMoney','repossess'],trigger:'Moves along escapeVx/y; life8s then escaped=true hp=0. Defeat before escape returns cargo directly to state.money. TRIGGER is escape pose, not a pickup spawn.',summon:[],effect:['cargo/coin feedback and floating text; no new state.drops pickup'],motion:'World movement only escapeVx/y * dt; foot loop stays on root.'}
};
const entities=anatomy.map(x=>({id:x.id,key:x.key,runtimeId:x.id==='TWINS_SUN'?'TWIN_SOL':x.id==='TWINS_MOON'?'TWIN_LUNA':x.group==='mechanic'?'MECHANIC_'+x.id:x.id,class:x.group==='boss'?'independent-ai-hp-boss':'independent-hp-timed-mechanic',anatomy:x.anatomy,sourceSheets:[...new Set(x.actions.map(a=>a.sheet))],root:rootFor(x.id),attachment:attach[x.id].map((desc,i)=>({id:`${x.id}:part:${i+1}`,class:'parent-body-part',description:desc,anchor:'fixed anatomical joint in owner local canvas, follows owner deformation; no own uid/hp/timer',numericAnchorStatus:'art specification; individual joint coordinates require approved source drawing'})),phases:phaseById[x.id]??null,mechanic:mechanics[x.id]??null,approval:'submitted; not production-ready'}));
const actions=[];
for(const x of anatomy)for(const a of x.actions){
 const entity=entities.find(y=>y.key===x.key);let ids=[],mode='',note=manualNotes[x.id+':'+a.action]??'';
 if(x.group==='boss'){
  if(/^P[123]$/.test(a.action)){ids=phaseById[x.id][Number(a.action[1])-1].abilities;mode='phase-body-reuse';}
  else if(a.action==='NEUTRAL'){mode='idle-body';}
  else if(a.action==='WINDUP'){ids=[...new Set(phaseById[x.id].flatMap(p=>p.abilities))];mode='common-windup';}
  else if(a.action==='OPEN'){mode='recover-body + independent OPEN overlay';}
  else {ids=special[x.id]?.[a.action]??[];mode=ids.length?'ability-body-reference':'archived-concept-body-reuse';}
 }else {ids=mechanics[x.id].create;mode='mechanic-'+a.action.toLowerCase();}
 const actual=ids.filter(id=>catalog[id]);const hatching=ids.includes('mechanic:nest:trigger');
 const summon=x.group==='mechanic'?mechanics[x.id].summon.map(id=>({id,class:id==='ROOT'?'independent-hp-timed-mechanic':'independent-ai-hp-unit',when:a.action==='TRIGGER'?'successful timer event':'not spawned by this visual state'})):hatching?[{id:'BASIC',class:'independent-ai-hp-unit',when:'independent NEST timer; no HIVE body spawn'}]:actual.flatMap(id=>[...catalog[id].summon,...catalog[id].mechanic]);
 const fx=x.group==='mechanic'?mechanics[x.id].effect:actual.flatMap(id=>catalog[id].effect);
 if(a.action==='OPEN')fx.push('whole-body OPEN tint/outline separate overlay; no added weak-point hole');
 if(hatching)fx.push('independent NEST timer feedback; do not emit from HIVE apertures');
 if(a.action==='BROKEN'||a.action==='FADE')fx.push('decorative break/fade only; no additional damage or spawn event');
 const motion=x.group==='mechanic'?[mechanics[x.id].motion]:actual.flatMap(id=>catalog[id].logicalMotion);
 actions.push({key:x.key+':'+a.action,id:x.id,group:x.group,sourceActionKey:a.action,sourceSheet:a.sheet,sourceApproval:a.status,productionApproval:'submitted-not-approved',root:entity.root,body:{resource:`body/${x.id}/${['NEUTRAL','P1','P2','P3','HATCH'].includes(a.action)?'NEUTRAL':a.action}`,mode,anatomyLock:x.anatomy,rule:'body only; no emitted object, shadow, warning, projectile, flash, summon, target, or overlay baked in; retain fixed face/organ anchors'},attachment:entity.attachment,summon,effect:[...new Set(fx)],projectile:[],muzzle:{status:'no independent projectile emitted by these handlers; geometry hazards use runtime source points',artAnchor:'optional local casting cue follows anatomy; must not relocate hazard or add projectile'},logicalMotion:motion.length?[...new Set(motion)]:['in-place body; world movement from existing logic only'],runtimeAbilityIds:ids,runtimeEvidence:[...entryEvidence,...(x.group==='mechanic'?[evidence(M,'export const spawnBossMechanic'),evidence(M,'export const tickBossMechanicRuntime'),evidence(M,'export const settleMechanicDefeatRuntime')]:[evidence(E,x.id.startsWith('TWINS_')?'export const createTwinsEncounterMembers':"bossTemplate.id === '"+x.id+"'"),evidence(C,'export const tickBossCombatRuntime')]),...actual.flatMap(id=>catalog[id].runtimeEvidence.slice(3))],notes:note||'旧动作key保留；实际技能完整表以entities.phases及abilityCatalog为准，P1–P3不替代技能清单。'});
}
 const dormant=['hiveHeal','twinOrbit','twinBolt','twinSwap','dragonBreath','tailSweep'];
for(const a of actions)if(a.runtimeAbilityIds.includes('mechanic:nest:trigger'))a.runtimeEvidence.push(evidence(M,"if (mechanic.kind === 'nest')"));
for(const c of Object.values(catalog)){
 c.root=c.owners.map(id=>({id,contract:rootFor(id)}));
 c.requestedSpawnCalls=[...c.sourceExcerpt.matchAll(/(?:c\.)?spawnAround\([^\n]+|(?:c\.)?spawnEnemyAt\([^\n]+/g)].map(m=>m[0]);
}
const sourceFiles=[E,A,O,M,C,H,'src/logic/engine/bossAuthoringRules.js',refRoot+'anatomy-lock.json'];
const manifest={schemaVersion:1,owner:'bosses-mechanics',revision:'r01',status:'submitted',counts:{bossBodies:17,mechanics:7,bossReferences:actions.filter(x=>x.group==='boss').length,mechanicReferences:actions.filter(x=>x.group==='mechanic').length,totalReferences:actions.length,defaultAbilities:defaults.size,survivorAbilities:2},dispatchRule:'useGeoGuardGame -> runBossOptimizedAbility -> optimized handler if present, else runBossAbilityEffect; user/main-review correction received before submission',coverageScope:'Default encounter phase skills plus both survivor additions; legacy concept keys preserved explicitly. Arbitrary user-authored editor phase programs are outside this static default inventory.',productionReadiness:'reference specification only; no transparent sprites, intermediate animation, editable vector source, atlas or game integration claimed',sources:sourceFiles.map(file=>({file,sha256:hash(path.join(repo,file))})),classDefinitions:{independentAiHp:'Boss/enemy with own uid/hp/behavior; TWINS two members',independentHpTimedMechanic:'SEAL/etc own uid/hp/timer/life even without navigation AI',parentBodyPart:'Only visual anatomy, follows owner; no own hp or lifecycle',pureEffect:'Hazards/impact waves/status overlays/links/guide marks separate from body; hazards retain actual logic ownership and time'},entities,actions,abilityCatalog:catalog,dormantLegacyKeys:dormant,openIssues:['根锚和collisionCenter为制作设计坐标，未输出逐帧透明资源，需后续原生源稿与叠帧验证。','所有新样板和清单等待主审；不得据此批量生成余下Boss。','旧TWINS ORBIT/SWAP、DRAGON BREATH/TAIL保留key并注明当前默认技能差异；不得新增玩法。'],dependencies:[{owner:'enemies',ids:['BASIC','SHARD','SHIELD','SCOUT','PHASE','SIEGE','SPLINTER','BURROWER','FAST'],scope:'independent summoned unit production resources; icons on HIVE sheet are schematic only'},{owner:'effects-ui',scope:'all abilityCatalog.effect entries; SEAL target overlay; mechanic terrain; OPEN/shield/hit/death/shadow; no body baking',coordination:'main reviewer routes dependencies; no cross-group writes'}]};
if(actions.length!==192||manifest.counts.bossReferences!==164||manifest.counts.mechanicReferences!==28)throw Error('coverage mismatch');
if(new Set(actions.map(x=>x.key)).size!==192)throw Error('duplicate actions');
for(const a of actions)for(const id of a.runtimeAbilityIds)if(!catalog[id]&&id!=='mechanic:nest:trigger')throw Error('unmapped '+id);
write('production-split.json',manifest);
const esc=s=>String(s??'').replaceAll('|',' / ').replaceAll('\n',' ');
const md=['# Boss／机关生产拆分清单 · r01','','17身体164参考 + 7机关28参考 = **192/192**。清单保留全部原图动作key。样板及本清单均待主审，未声明可运行资源。','','## 当前运行入口与纠错','','`useGeoGuardGame.jsx:798 → runBossOptimizedAbility`。有optimized handler则覆盖，无则fallback。主审已撤销旧spawnHive=BEACON要求。当前spawnHive=NEST，NEST timer=BASIC，summonSwarm=SHARD。','','COURIER奖励直接返还money；旧production-notes可拾钻描述不作为新玩法。双子是TWIN_SOL与TWIN_LUNA两个独立HP实体，幸存分别加soloSolarVolley/soloLunarOrbit并移除twinCrossfire。','','## 制作共用契约','','每身份固定512×512设计画布，root=(256,448)、collisionCenter=(256,288)、固定偏移(0,-160)。这是待原生源稿验证的设计坐标，不是将设定板直接裁切后的实测值。每帧root固定；脚角色用接地点中点，无脚用投影。移动、dash、迁移和pull全部由当前逻辑提供。','身体不含影子、召唤、危险区、目标、闪光、弹体、OPEN描边。部件表只表示父级器官，不增加独立目标。当前技能是line/area hazards或实体召唤，不据技能名称创造敌方projectile。具体代码摘录随JSON保留。','','## 身份与完整技能','','|身份／runtime ID|分类与器官锁|P1 / P2 / P3 当前技能|父级部件|','|---|---|---|---|'];
for(const e of entities)md.push(`|${e.id} / ${e.runtimeId}|${e.class}；${esc(e.anatomy)}|${e.phases?e.phases.map((p,i)=>'P'+(i+1)+': '+p.abilities.join(', ')).join('<br>'):esc(e.mechanic.trigger)}|${esc(attach[e.id].join('; '))}|`);
md.push('','## 逐参考动作（完整192行）','','root与部件逐条写入JSON；下表用同ID固定root／attachment契约，技能ID展开到下节。空技能表示生命周期/旧概念复用，不意味着遗漏。','','|原始key|body归属|实际技能|独立召唤／机关|独立效果|逻辑位移／说明|','|---|---|---|---|---|---|');
for(const a of actions)md.push(`|${a.key}|${a.body.resource} / ${a.body.mode}|${a.runtimeAbilityIds.join(', ')||'生命周期或归档复用'}|${[...new Set(a.summon.map(x=>x.id))].join(', ')||'—'}|${esc(a.effect.join('; '))||'—'}|${esc(a.logicalMotion.join('; '))} ${esc(manualNotes[a.id+':'+a.sourceActionKey]??'')}|`);
md.push('','## 逐真实技能与覆盖差异','','|技能|调用路径|独立单位／机关|效果|逻辑位移|依据|覆盖差异|','|---|---|---|---|---|---|---|');
for(const c of Object.values(catalog))md.push(`|${c.abilityId} (${c.availability})|${c.dispatch}|${[...c.summon,...c.mechanic].map(x=>x.id).join(', ')||'—'}|${esc(c.effect.join('; '))||'—'}|${esc(c.logicalMotion.join('; '))}|${c.runtimeEvidence.slice(3).map(e=>e.file+':'+(e.line??e.startLine)).join('<br>')}|${esc(c.overrideDifference)}|`);
md.push('','## 机关生命周期','','|机关|创建技能|TRIGGER真实含义|BROKEN/FADE|','|---|---|---|---|');
for(const [id,m]of Object.entries(mechanics))md.push(`|${id}|${m.create.join(', ')}|${m.trigger}|受击死亡／寿命／父级失效按运行期结算；破碎消散只美术，不产生新伤害。${id==='COURIER'?'逃走无返还；击破直接返款，装饰钻不是必须拾取物。':''}|`);
md.push('','## 第一包与后续边界','','仅HIVE、SEAL新生图；HIVE ATTACK为新增生产示意，不增算192源参考。HIVE五瓣修订后的hive-production.png为本次候选，draft图片均归档不采用。SEAL四状态本体与空心目标冻结overlay分栏。独立召唤小图是示意，正式敌人资源归enemies组。','本包不提供可直接导入透明帧、矢量源稿、图集、帧时序、每帧像素固定锚证明或实机测试。主审批准前不得批量扩展其他Boss。','');
write('production-split.md',md.join('\n'));
write('optimized-overrides.md',['# 当前覆盖差异（逐handler）','','调用入口：'+entryEvidence.map(e=>e.file+':'+e.line).join(' → '),'',...Object.entries(overrideNotes).map(([k,v])=>`- **${k}** — ${v} (${O}:${optimized[k]?.startLine})`),'','基础未覆盖技能仍执行fallback；全部默认技能见production-split.json。旧模板/编辑器能力不自动视为默认遭遇。'].join('\n'));
console.log(JSON.stringify({counts:manifest.counts,actions:actions.length,handlers:Object.keys(optimized).length,abilityCatalog:Object.keys(catalog).length,unmappedDefault:[...defaults].filter(x=>!catalog[x])},null,2));
