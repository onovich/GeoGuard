import {createRuntimeState} from '../src/logic/engine/gameState.js';
import {buildTowerAtLevel} from '../src/logic/engine/towerRules.js';
import {createPlacedTower} from '../src/logic/engine/debugTowerRuntime.js';
import {updateTowerOffenseRuntime} from '../src/logic/engine/combatOffenseRuntime.js';
import {createPresentationRuntime} from '../src/view/art/integration/presentationRuntime.js';
import {getCharacterAnchors} from '../src/view/art/characters/index.js';
import {updateProjectileRuntime} from '../src/logic/engine/combatFrameRuntime.js';
import {resolveProjectileBirth} from '../src/logic/engine/projectileBirth.js';
import test from 'node:test';import assert from 'node:assert/strict';
const norm=a=>Math.atan2(Math.sin(a),Math.cos(a));
function shoot(id,angle,d,extra=null){const state=createRuntimeState(),tower=createPlacedTower({tower:buildTowerAtLevel(state.towerCatalog.find(t=>t.id===id),0),uid:41,x:0,y:0});tower.artContinuousCandidate=true;tower.lastShoot=tower.fireRate;state.towers=[tower];state.enemies=[{uid:91,x:Math.cos(angle)*d,y:Math.sin(angle)*d,radius:10,hp:12}];if(extra)state.enemies.push(extra);const runtime=createPresentationRuntime();runtime.prepare(state,{width:900,height:500});updateTowerOffenseRuntime({state,dt:0,spawnParticle:()=>{},resolveProjectileOrigin:r=>runtime.resolveProjectileOrigin(state,r,getCharacterAnchors)});return{state,tower,shots:state.projectiles};}
test('actual candidate offense keeps source ray and safe birth through nonlinear lower-sector targets',()=>{
 for(const id of ['SNIPER','RAIL'])for(const angle of [.346,1.12,...[90,95,100,108,112.5,115,125,135,157.5].map(x=>x*Math.PI/180)])for(const d of [10,30,60,110]){
 const {state,tower,shots}=shoot(id,angle,d);assert.equal(shots.length,tower.burstCount??1);for(const p of shots){assert.ok(Math.abs(norm(Math.atan2(p.vy,p.vx)-p.birthOrigin.sourceBoreAxisAngle))<1e-5,`${id}/${angle}/${d}`);assert.ok(Math.abs(Math.hypot(p.vx,p.vy)-(tower.projectileSpeed??500))<1e-8);assert.equal(p.damage,tower.damage);assert.equal(p.radius,tower.pierce?3:4);assert.equal(p.sourceUid,41);if(d>p.radius+14)assert.ok(Math.hypot(p.x-state.enemies[0].x,p.y-state.enemies[0].y)>=state.enemies[0].radius+p.radius+4);else assert.deepEqual({x:p.x,y:p.y},{x:0,y:0});}
 }
});
test('no anatomical forward ray remains explicit centre strategy rather than false zero-root approval',()=>{
 const target={uid:91,x:30,y:0,radius:10,hp:12},owner={x:0,y:0};const birth=resolveProjectileBirth({owner,state:{enemies:[target]},angle:0,radius:3,sourceArtId:'tower:RAIL',target,resolveProjectileOrigin:r=>({x:70,y:0,sourceBoreAxisAngle:Math.PI/2,sourceAimAngle:Math.PI/2})});
 assert.deepEqual(birth.point,owner);assert.equal(birth.metadata.birthStrategy,'no-anatomical-ray-root-centre');assert.equal(birth.metadata.sourceAimAngle,Math.PI/2);assert.equal(birth.metadata.acceptedAimResidual,-Math.PI/2);
});
test('real extra BASIC blocks retreat endpoint: safe centre birth and actual first collision retain chosen target',()=>{
 const extra={uid:92,id:'BASIC',type:'BASIC',x:35,y:-22,hp:12,radius:10};const {state,tower,shots}=shoot('RAIL',.346,30,extra),p=shots[0];
 assert.equal(p.birthOrigin.birthStrategy,'no-safe-source-ray-centre');assert.deepEqual({x:p.x,y:p.y},{x:0,y:0});assert.equal(extra.hp,12);assert.ok(Math.abs(norm(Math.atan2(p.vy,p.vx)-.346))<1e-8);assert.equal(p.damage,tower.damage);assert.ok(Math.abs(Math.hypot(p.vx,p.vy)-700)<1e-8);
 const hits=[];for(let i=0;i<6;i++)updateProjectileRuntime({state,dt:1/60,damageEnemy:(e,d)=>{hits.push({uid:e.uid,damage:d});e.hp-=d},spawnFloatingText:()=>{},spawnParticle:()=>{},spawnImpactWave:()=>{}});
 assert.equal(hits[0].uid,91);assert.equal(hits[0].damage,tower.damage);assert.equal(extra.hp,12);assert.equal(state.enemies[0].hp,12-tower.damage);
});