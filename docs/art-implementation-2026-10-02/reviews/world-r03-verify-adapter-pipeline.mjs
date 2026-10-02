// Actual producer/adapter/world fixture probe, without browser state or core source edits.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createRuntimeState} from '../../../src/logic/engine/gameState.js';
import {createEnemyRuntimeEntityFromKey} from '../../../src/logic/engine/encounterRuntime.js';
import {TOWER_LIBRARY} from '../../../src/data/gameConfig.js';
import {getTowerFireRateFactor,updatePlayerOffenseRuntime,updateTowerOffenseRuntime} from '../../../src/logic/engine/combatOffenseRuntime.js';
import {updateProjectileRuntime} from '../../../src/logic/engine/combatFrameRuntime.js';
import {resolveEnemyDamage} from '../../../src/logic/engine/combatRules.js';
import {createPresentationRuntime} from '../../../src/view/art/integration/presentationRuntime.js';
import * as W from '../../../src/view/art/world/index.js';
const require=createRequire(import.meta.url);
const {createCanvas,Path2D}=require(process.env.WORLD_CANVAS_MODULE ?? 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
globalThis.Path2D=Path2D;
const {assets}=await W.loadWorldArt();
const enemy=(id,uid,x,y)=>({...createEnemyRuntimeEntityFromKey({enemyKey:id,uid}),x,y});
const tower=(id,uid)=>({...TOWER_LIBRARY[id],uid,x:0,y:0,maxHp:TOWER_LIBRARY[id].hp,lastShoot:0,frozenTimer:0});
const viewport={width:400,height:300,dpr:1},camera={x:0,y:0};
const statusState=createRuntimeState();statusState.gameTime=12;
statusState.towers=[{...tower('BASIC',1),frozenTimer:.5}];
statusState.enemies=[enemy('MEDIC',1,0,0),enemy('BASIC',2,40,0),enemy('JAMMER',3,0,15),{...enemy('BOMBER',4,100,100),fuseTimer:.28}];
const statusRt=createPresentationRuntime({getTowerFireRateFactor});
const snapshot=JSON.stringify(statusState),scene=statusRt.prepare(statusState,viewport,camera,true);
assert.equal(JSON.stringify(statusState),snapshot,'adapter qualification queries do not mutate fixture state');
const actor=id=>scene.actors.find(row=>row.actor.artId===id).actor;
assert.equal(actor('tower:BASIC').states.jammed,true);assert.equal(actor('tower:BASIC').states.frozen,true);
assert.equal(actor('enemy:MEDIC').healAura.range,118);assert.ok(actor('enemy:MEDIC').healAura.eligibleTargetKeys.length>0);
assert.equal(actor('enemy:BOMBER').fuse.remaining,.28);assert.equal(actor('enemy:BOMBER').fuse.radius,78);
const pixels=[];
for(const id of ['tower:BASIC','enemy:MEDIC','enemy:BOMBER']){
  const a=actor(id),c=createCanvas(400,300),ctx=c.getContext('2d');ctx.translate(200,150);
  assert.equal(W.drawActorOverlay(ctx,a,{root:{x:a.x,y:a.y+a.radius},bounds:{x:a.x-a.radius,y:a.y-a.radius,width:2*a.radius,height:2*a.radius}},scene.frame,assets,'status').drawn,true);
  assert.ok(ctx.getImageData(0,0,400,300).data.some((v,i)=>i%4===3&&v>0));pixels.push(id);
}
assert.equal(JSON.stringify(statusState),snapshot,'world consumes actual adapter DTO without gameplay mutation');

const state=createRuntimeState();state.gameTime=12;
state.towers=Object.keys(TOWER_LIBRARY).map((id,i)=>tower(id,i+1));
state.enemies=[{...enemy('BASIC',1,40,0),hp:10000,maxHp:10000},{...enemy('BASIC',2,65,0),hp:10000,maxHp:10000}];
const rt=createPresentationRuntime({getTowerFireRateFactor});rt.reset(state);
updatePlayerOffenseRuntime({state,dt:2.4});updateTowerOffenseRuntime({state,dt:2.4,spawnParticle:()=>{}});
rt.captureShots(state,0);
const producedSources=new Set(state.projectiles.map(p=>p.sourceArtId));assert.equal(producedSources.size,10);
let trueDamageCallbacks=0;
updateProjectileRuntime({state,dt:.1,damageEnemy:(target,amount,projectile)=>{
  const result=resolveEnemyDamage(target,amount);target.hp=result.hp;target.shield=result.shield;
  trueDamageCallbacks++;rt.captureHit(state,target,projectile);
},spawnFloatingText:()=>{},spawnParticle:()=>{},spawnImpactWave:()=>{}});
const result=rt.prepare(state,viewport,camera,true),hits=result.items.filter(item=>item.kind==='feedback'&&item.data.type==='hit');
assert.equal(hits.length,trueDamageCallbacks);assert.equal(new Set(hits.map(item=>item.sourceArtId)).size,10);
assert.equal(new Set(hits.map(item=>item.data.projectileKind)).size,3);
assert.ok(hits.every(item=>typeof item.sourceKey==='string'&&Number.isInteger(item.data.shotIndex)));
const gameAfter=JSON.stringify(state);
for(const hit of hits){const c=createCanvas(200,100),ctx=c.getContext('2d');assert.equal(W.drawWorldItem(ctx,hit,result.frame,assets).drawn,true);assert.ok(ctx.getImageData(0,0,200,100).data.some((v,i)=>i%4===3&&v>0));}
assert.equal(JSON.stringify(state),gameAfter);assert.deepEqual(rt.inspect().errors,[]);assert.deepEqual(statusRt.inspect().errors,[]);
const report={status:'passed_actual_engine_adapter_world_fixture',qualifiedActors:pixels,jamAndFreezeIndependent:true,healTrueTargetKeys:true,fuseActualRemainingAndConfig:true,producedProjectileSources:10,trueDamageCallbacks,hitEvents:hits.length,sourceHitIdentities:10,hitFamilies:3,sourceKeysAndShotIndexCopied:true,sidecarErrors:0,drawDoesNotMutateFixture:true,scope:'single fixture producer/callback/DTO/draw pipeline; no browser gameplay, 95 skills, performance or complete baseline differential'};
writeFileSync(new URL('world-r03-pipeline-independent.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
