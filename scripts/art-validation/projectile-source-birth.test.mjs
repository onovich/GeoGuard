import assert from 'node:assert/strict';
import {resolveProjectileBirth} from '../../src/logic/engine/projectileBirth.js';
import {createProjectile,updateTowerOffenseRuntime,updatePlayerOffenseRuntime} from '../../src/logic/engine/combatOffenseRuntime.js';
import {createRuntimeState} from '../../src/logic/engine/gameState.js';
import {buildTowerAtLevel} from '../../src/logic/engine/towerRules.js';
import {createPlacedTower} from '../../src/logic/engine/debugTowerRuntime.js';
const owner={x:0,y:0},enemy=(x,y=0,extra={})=>({uid:7,x,y,radius:10,hp:100,...extra});
const run=(enemies,requested={x:40,y:0})=>resolveProjectileBirth({owner,state:{enemies},angle:0,radius:4,resolveProjectileOrigin:()=>requested});
assert.deepEqual(resolveProjectileBirth({owner,state:{enemies:[]},radius:4}),{point:{x:0,y:0},metadata:null});
assert.deepEqual(run([]).point,{x:40,y:0});
assert.equal(run([enemy(30)]).point.x,11.5);
assert.equal(run([enemy(10)]).point.x,0);
assert.equal(run([enemy(30,0,{hp:0})]).point.x,40);
assert.equal(run([enemy(30,0,{burrowed:true})]).point.x,40);
assert.equal(run([enemy(30,80)]).point.x,40);
assert.equal(run([],null).metadata.mode,'missing-source-centre');
const results=[];
for(const id of ['PLAYER',...createRuntimeState().towerCatalog.map(t=>t.id)])for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2,Math.PI/4]){
 const states=[createRuntimeState(),createRuntimeState()];
 for(const state of states){state.player.x=0;state.player.y=0;state.player.lastShoot=state.player.shootCd;state.enemies=[enemy(Math.cos(angle)*100,Math.sin(angle)*100)];if(id!=='PLAYER'){const t=state.towerCatalog.find(t=>t.id===id);const placed=createPlacedTower({tower:buildTowerAtLevel(t,0),uid:1,x:0,y:0});placed.lastShoot=placed.fireRate;state.towers=[placed]}}
 const shoot=(state,resolveProjectileOrigin)=>id==='PLAYER'?updatePlayerOffenseRuntime({state,dt:1/60,resolveProjectileOrigin}):updateTowerOffenseRuntime({state,dt:1/60,spawnParticle:()=>{},resolveProjectileOrigin});
 shoot(states[0]);shoot(states[1],()=>({x:Math.cos(angle)*30,y:Math.sin(angle)*30,kind:'source-muzzle'}));
 assert.equal(states[0].projectiles.length,states[1].projectiles.length);
 for(let i=0;i<states[0].projectiles.length;i++){const a=states[0].projectiles[i],b=states[1].projectiles[i];assert.equal(b.x,b.previousX);assert.equal(b.y,b.previousY);for(const key of ['damage','life','kind','radius','pierce','splash','slowRatio','slowDuration','shotIndex'])assert.deepEqual(a[key],b[key],`${id} ${key}`);assert.ok(Math.abs(Math.hypot(a.vx,a.vy)-Math.hypot(b.vx,b.vy))<1e-9,'speed scalar retained');assert.ok(Math.abs(Math.atan2(Math.sin(Math.atan2(a.vy,a.vx)-Math.atan2(b.vy,b.vx)),Math.cos(Math.atan2(a.vy,a.vx)-Math.atan2(b.vy,b.vx))))<1e-9,'collinear source retains direction');assert.deepEqual(b.birthOrigin.accepted,{x:b.x,y:b.y})}
 results.push({id,angle,count:states[1].projectiles.length});
}
console.log(JSON.stringify({passed:true,nearFieldCases:7,offenseCases:results.length,results},null,2));

const lateral=createRuntimeState();lateral.player.x=0;lateral.player.y=0;lateral.player.lastShoot=lateral.player.shootCd;lateral.enemies=[enemy(0,110)];updatePlayerOffenseRuntime({state:lateral,dt:0,resolveProjectileOrigin:()=>({x:43,y:-25})});const lp=lateral.projectiles[0],expected=Math.atan2(135,-43);assert.ok(Math.abs(Math.atan2(lp.vy,lp.vx)-expected)<1e-12);console.log('lateral birth aims at unchanged selected target, scalar speed400 retained');
