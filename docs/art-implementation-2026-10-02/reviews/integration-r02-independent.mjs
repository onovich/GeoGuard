import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRuntimeState } from '../../../src/logic/engine/gameState.js';
import { TOWER_LIBRARY } from '../../../src/data/gameConfig.js';
import { createProjectile, getTowerFireRateFactor, updatePlayerOffenseRuntime, updateTowerOffenseRuntime } from '../../../src/logic/engine/combatOffenseRuntime.js';
import { updateProjectileRuntime } from '../../../src/logic/engine/combatFrameRuntime.js';
import { createPresentationRuntime } from '../../../src/view/art/integration/presentationRuntime.js';
import { createArtRegistry, loadArtRegistry } from '../../../src/view/art/integration/assetRegistry.js';
import { tickBossMechanicRuntime } from '../../../src/logic/engine/bossMechanicEntities.js';
import { getCharacterAnchors } from '../../../src/view/art/characters/index.js';
import { drawStickerScene } from '../../../src/view/art/integration/stickerScene.js';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../../..');
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const baseline=JSON.parse(fs.readFileSync(path.resolve(dir,'../integration/submissions/r01/observed-baseline.json'),'utf8'));
const findings=[];
for(const file of baseline.files.filter(f=>/^src\/(data|logic\/engine)\//.test(f.path))) {
  let bytes=fs.readFileSync(path.join(root,file.path));
  if(file.path.endsWith('combatOffenseRuntime.js')) {
    let source=bytes.toString('utf8');
    source=source.replace(/  sourceArtId: extras.sourceArtId \?\? null,\r?\n  sourceUid: extras.sourceUid \?\? null,\r?\n  shotIndex: extras.shotIndex \?\? 0,\r?\n/,'');
    source=source.replace(", sourceArtId: 'hero:PLAYER', sourceUid: 'player', shotIndex: 0",'');
    source=source.replace(/              sourceArtId: `tower:\$\{tower.id\}`,\r?\n              sourceUid: tower.uid,\r?\n              shotIndex: index,\r?\n/,'');
    bytes=Buffer.from(source);
  }
  if(file.path.endsWith('combatFrameRuntime.js')) bytes=Buffer.from(bytes.toString('utf8')
    .replace('damageEnemy(enemy, projectile.damage, projectile);','damageEnemy(enemy, projectile.damage);')
    .replace('damageEnemy(otherEnemy, projectile.damage * 0.5, projectile);','damageEnemy(otherEnemy, projectile.damage * 0.5);'));
  assert.equal(sha(bytes),file.sha256,`Protected simulation source differs beyond approved metadata: ${file.path}`);
}
findings.push('All data/engine files byte-identical to observed release source after removing the exact approved 3-field insertion and two hit-source third arguments.');
const noop=()=>{};
const enemy=()=>({uid:1,id:'BASIC',x:35,y:0,hp:1000,maxHp:1000,radius:10,shield:0,slowRatio:1,slowTimer:0,hitFlash:0});
const shotSources=[];
for(const [id,template]of Object.entries(TOWER_LIBRARY)) {
  const state=createRuntimeState();state.enemies=[enemy()];
  state.towers=[{...template,uid:1,x:0,y:0,maxHp:template.hp,lastShoot:0}];
  const runtime=createPresentationRuntime();runtime.reset(state);
  updateTowerOffenseRuntime({state,dt:3,spawnParticle:noop});runtime.captureShots(state,0);
  assert.equal(state.projectiles.length,template.burstCount??1);
  for(const [index,p]of state.projectiles.entries()) {
    assert.equal(p.sourceArtId,`tower:${id}`);assert.equal(p.sourceUid,1);assert.equal(p.shotIndex,index);
    assert.equal(p.x,0);assert.equal(p.y,0);assert.equal(p.previousX,0);assert.equal(p.previousY,0);
  }
  shotSources.push(state.projectiles[0].sourceArtId);
  assert.equal(runtime.inspect().events.filter(e=>e.type==='shot').length,state.projectiles.length);
}
const state=createRuntimeState();state.enemies=[enemy()];const runtime=createPresentationRuntime();runtime.reset(state);
updatePlayerOffenseRuntime({state,dt:1});runtime.captureShots(state,0);
assert.equal(state.projectiles[0].sourceArtId,'hero:PLAYER');shotSources.push('hero:PLAYER');
updateProjectileRuntime({state,dt:.1,damageEnemy:(e,amount,p)=>{e.hp-=amount;runtime.captureHit(state,e,p);},spawnFloatingText:noop,spawnParticle:noop,spawnImpactWave:noop});
assert.equal(state.projectiles.length,0);assert(runtime.inspect().events.some(e=>e.type==='shot'));assert(runtime.inspect().events.some(e=>e.type==='hit'));
const snapshot=structuredClone(state);
runtime.captureBirths(state,[],state.enemies[0]);assert(!runtime.inspect().events.some(e=>e.type==='summon-success'));
runtime.captureBirths(state,[state.enemies[0]]);runtime.captureBirths(state,[state.enemies[0]]);
assert.equal(runtime.inspect().events.filter(e=>e.type==='summon-success').length,1);
const frame=runtime.prepare(state,{width:1280,height:720,dpr:1},{x:0,y:0});
const paused=runtime.prepare(state,{width:1280,height:720,dpr:1},{x:0,y:0},true);
assert.equal(paused.frame.dt,0);assert.equal(frame.actors[0].actor.poseTime,paused.actors[0].actor.poseTime);
assert.deepEqual(state,snapshot,'Presentation capture/preparation must not change simulation');
runtime.reset(state);assert.equal(runtime.inspect().events.length,0);assert.equal(runtime.inspect().actorCacheSize,0);
findings.push('Ten real shot sources preserve center/previous origin and actual burst count; same-step shot and hit survive projectile removal.');
findings.push('Successful births deduplicated, zero births emit nothing, presentation reads preserve deep simulation snapshot, pause/reset are isolated.');
const view={width:1280,height:720,dpr:1},camera={x:0,y:0};
const sample=createRuntimeState();sample.towers=[{...TOWER_LIBRARY.BASIC,uid:8,x:80,y:40,maxHp:50}];
sample.projectiles=[{sourceArtId:'tower:BASIC',sourceUid:8,shotIndex:0,x:80,y:40,vx:300,vy:0}];
const motion=createPresentationRuntime();motion.reset(sample);motion.captureShots(sample,0);
const start=motion.prepare(sample,view,camera).actors.find(e=>e.actor.domain==='tower').actor;
sample.gameTime+=.08;
const middle=motion.prepare(sample,view,camera).actors.find(e=>e.actor.domain==='tower').actor;
assert.equal(start.poseProgress,0);assert.equal(middle.pose,'attack');assert(Math.abs(middle.poseProgress-.5)<.001);
const startAnchors=getCharacterAnchors(start,{}),middleAnchors=getCharacterAnchors(middle,{});
assert.deepEqual(startAnchors.root,middleAnchors.root,'Attack must remain planted at the same world root');
assert.notDeepEqual(startAnchors.muzzles,middleAnchors.muzzles,'A real shot must deform the muzzle with its body');
for(const mode of ['trigger','broken','expiry','lost-target','lost-owner']) {
  const s=createRuntimeState(),rt=createPresentationRuntime();rt.reset(s);
  const boss={...enemy(),uid:40,isBoss:true,id:'FROST_JUDGE'};
  const seal={...enemy(),uid:41,id:'MECHANIC_SEAL',summonedByBossUid:40,mechanic:{kind:'seal',timer:.01,life:mode==='expiry'?.01:2,targetUid:5}};
  s.enemies=[boss,seal];s.towers=mode==='lost-target'?[]:[{uid:5,hp:50,x:0,y:0}];
  if(mode==='lost-owner')boss.hp=0;
  if(mode==='broken'){seal.hp=0;rt.captureHit(s,seal);}
  const before=rt.beginMechanicStep(s,seal);
  tickBossMechanicRuntime({state:s,enemy:seal,dt:.02,spawnAround:noop,queueAreaHazard:noop});
  rt.endMechanicStep(s,seal,before,.02);assert.equal(seal.hp,0);
  rt.captureDefeat(s,seal,{defeated:true},s.money);s.enemies=s.enemies.filter(e=>e!==seal);
  const retired=rt.prepare(s,view,camera).retired.find(e=>e.artId==='mechanic:SEAL');
  assert.equal(retired.pose,mode==='trigger'?'trigger':mode==='broken'?'broken':'neutral',mode);
  s.gameTime+=.12;assert.equal(rt.prepare(s,view,camera).retired.find(e=>e.artId==='mechanic:SEAL').poseProgress,.5);
  s.gameTime+=.13;assert.equal(rt.prepare(s,view,camera).retired.length,0);
  assert.deepEqual(rt.inspect().errors,[]);
}
findings.push('Real shot progresses 0→0.5 in 80ms, deforms its muzzle, and keeps the world root fixed.');
findings.push('Actual mechanic tick distinguishes successful seal trigger, confirmed kill, expiry, missing target and missing owner; retirement progresses and expires at 240ms.');
const auraState=createRuntimeState(),auraRuntime=createPresentationRuntime({getTowerFireRateFactor});
const medic={...enemy(),uid:20,x:0,y:0,healAura:{range:90,amount:8}};
const jammer={...enemy(),uid:21,x:20,y:0,jamAura:{range:95,fireRateFactor:1.8}};
const bomber={...enemy(),uid:22,x:70,y:0,explode:{fuse:.6,radius:80},fuseTimer:null};
auraState.enemies=[medic,jammer,bomber,{...enemy(),uid:23,x:10,y:0,isBoss:true},{...enemy(),uid:24,x:10,y:0,mechanic:{kind:'nest'}},{...enemy(),uid:25,x:10,y:0,hp:0}];
auraState.towers=[{...TOWER_LIBRARY.BASIC,uid:8,x:0,y:0,frozenTimer:2}];
let auraFrame=auraRuntime.prepare(auraState,view,camera);
assert.equal(auraFrame.actors.find(e=>e.actor.domain==='tower').actor.states.jammed,true);
assert.equal(auraFrame.actors.find(e=>e.actor.domain==='tower').actor.states.frozen,true);
assert.equal(auraFrame.actors.find(e=>e.entity===medic).actor.healAura.eligibleTargetKeys.length,2);
assert.equal(auraFrame.actors.find(e=>e.entity===bomber).actor.fuse.active,false);
bomber.fuseTimer=.4;medic.burrowed=true;auraState.towers[0].x=300;
auraFrame=auraRuntime.prepare(auraState,view,camera);
assert.equal(auraFrame.actors.find(e=>e.entity===medic).actor.healAura.active,false);
assert.equal(auraFrame.actors.find(e=>e.entity===bomber).actor.fuse.active,true);
assert.equal(auraFrame.actors.find(e=>e.actor.domain==='tower').actor.states.jammed,false);
findings.push('Jammed uses actual engine range/factor query, including simultaneous freeze; healing target eligibility and unlit/lit fuse fields follow actual entity data.');
for(const [kind,extras]of [['basic',{}],['cannon',{splash:80}],['sniper',{pierce:3,hitEnemies:new Set()}]]) {
  const s=createRuntimeState(),rt=createPresentationRuntime();rt.reset(s);s.enemies=[enemy(),{...enemy(),uid:2,x:75}];
  const p=createProjectile(0,0,0,500,10,{kind,sourceArtId:`tower:${kind==='basic'?'BASIC':kind==='cannon'?'CANNON':'SNIPER'}`,sourceUid:88,...extras});
  s.projectiles=[p];let hits=0;
  updateProjectileRuntime({state:s,dt:.2,damageEnemy:(e,amount,source)=>{assert.equal(source,p);e.hp-=amount;rt.captureHit(s,e,source);hits++;},spawnFloatingText:noop,spawnParticle:noop,spawnImpactWave:noop});
  assert.equal(hits,kind==='basic'?1:2);
  const captured=structuredClone(rt.inspect().events);assert(captured.every(e=>e.projectileKind===kind&&e.sourceArtId===p.sourceArtId));
  p.sourceArtId='changed-after-callback';p.kind='changed';assert.deepEqual(rt.inspect().events,captured,'Events must hold detached scalar source data');
}
{
  const s=createRuntimeState(),rt=createPresentationRuntime();rt.reset(s);s.enemies=[enemy()];
  s.projectiles=[0,1,2,3].map(index=>createProjectile(0,0,0,500,1,{sourceArtId:'tower:BURST',sourceUid:91,shotIndex:index}));
  updateProjectileRuntime({state:s,dt:.1,damageEnemy:(e,amount,p)=>{e.hp-=amount;rt.captureHit(s,e,p);},spawnFloatingText:noop,spawnParticle:noop,spawnImpactWave:noop});
  assert.equal(s.projectiles.length,0);assert.deepEqual(rt.inspect().events.map(e=>e.shotIndex),[3,2,1,0]);
  assert.equal(new Set(rt.inspect().events.map(e=>e.projectileKey)).size,4);
}
findings.push('Confirmed direct/basic, cannon splash and sniper penetration retain exact scalar source; four co-located projectiles preserve reverse callback order and distinct identity after same-step removal.');
{
  const s=createRuntimeState(),rt=createPresentationRuntime();rt.reset(s);s.enemies=[enemy()];s.towers=[{...TOWER_LIBRARY.BURST,uid:4,x:0,y:0,lastShoot:0}];
  updateTowerOffenseRuntime({state:s,dt:3,spawnParticle:noop});rt.captureShots(s,0);s.gameTime=.04;
  const forwarded=[],worldMethods=Object.fromEntries(['drawWorldBackground','drawHazard','drawActorOverlay','drawPlacement'].map(key=>[key,()=>({drawn:true})]));
  const reg=createArtRegistry();reg.status='ready';reg.characters={status:'ready',assets:{},module:{getCharacterAnchors,drawCharacter:()=>({drawn:true})}};
  reg.world={status:'ready',assets:{},module:{...worldMethods,drawWorldItem:(ctx,item)=>{if(item.data?.type==='shot')forwarded.push(item);return{drawn:true};}}};
  const ctx=new Proxy({measureText:()=>({width:20})},{get:(obj,key)=>obj[key]??noop,set:(obj,key,value)=>{obj[key]=value;return true;}});
  assert.equal(drawStickerScene(ctx,{width:1280,height:720},{state:s,art:{runtime:rt,registry:reg},getTowerById:noop,fallbackBody:()=>assert.fail('unexpected fallback')}),true);
  assert.equal(forwarded.length,4);assert.equal(new Set(forwarded.map(item=>`${item.x},${item.y}`)).size,4);
  for(const item of forwarded){const p=s.projectiles[item.shotIndex];assert.equal(item.anchors.muzzles[item.shotIndex].axisAngle,Math.atan2(p.vy,p.vx));}
  assert(Math.abs(rt.inspect().actors.find(a=>a.domain==='tower').aimAngle)<.001,'Burst body aims through actual shot centerline, not the last spread bullet');
}
findings.push('Production scene forwards four distinct deformed BURST muzzle positions and each exact projectile spread angle to world; body follows the measured burst centerline.');
const registry=createArtRegistry();
await loadArtRegistry(registry,{loaders:{characters:async()=>{throw Error('intentional missing character resource');},world:async()=>({loadWorldArt:async()=>({status:'ready',assets:{},errors:[]})})}});
assert.equal(registry.status,'partial');assert.equal(registry.errors.length,1);assert.equal(registry.characters.status,'failed');
findings.push('Missing character resource resolves partial failure without throwing or blocking simulation.');
const report={status:'passed',checkedAt:new Date().toISOString(),shotSources,findings,
  limits:['Source-family CPU checks pass; all three visual hit families still require independent live QA.','Browser play/visual checks are reported separately.']};
fs.writeFileSync(path.join(dir,'integration-r02-independent-checks.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
