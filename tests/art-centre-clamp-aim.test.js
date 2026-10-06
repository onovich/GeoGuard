import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveProjectileBirth} from '../src/logic/engine/projectileBirth.js';
const owner={x:0,y:0},target={x:-10,y:15},angle=Math.atan2(15,-10);
test('overlapping accepted centre re-samples the current chosen-target source axis',()=>{
 const calls=[],birth=resolveProjectileBirth({owner,state:{enemies:[{uid:7,hp:20,x:target.x,y:target.y,radius:20}]},angle,shotIndex:2,radius:4,sourceArtId:'tower:BASIC',target,resolveProjectileOrigin:r=>{calls.push(r);return{x:30,y:0,sourceAimAngle:r.acceptedBirthAim?r.angle:-2.7,sourceBoreAxisAngle:r.acceptedBirthAim?r.angle:-2.7}}});
 assert.deepEqual(birth.point,owner);assert.equal(birth.metadata.clampedBy,7);assert.equal(calls.length,2);assert.equal(calls[1].acceptedBirthAim,true);assert.equal(calls[1].shotIndex,2);assert.deepEqual(calls[1].target,target);assert.equal(birth.metadata.sourceAimAngle,angle);assert.equal(birth.metadata.sourceBoreAxisAngle,angle);
 const speed=420,vx=Math.cos(angle)*speed,vy=Math.sin(angle)*speed;assert.ok(Math.abs(Math.hypot(vx,vy)-speed)<1e-10);
});
test('unblocked source origin retains normal anatomical solve and accepted point',()=>{
 let count=0;const birth=resolveProjectileBirth({owner,state:{enemies:[{uid:7,hp:20,x:110,y:0,radius:12}]},angle:0,radius:4,sourceArtId:'tower:BASIC',target:{x:110,y:0},resolveProjectileOrigin:r=>{count++;assert.equal(r.acceptedBirthAim,undefined);return{x:30,y:0,sourceAimAngle:0}}});assert.equal(count,1);assert.deepEqual(birth.point,{x:30,y:0});assert.equal(birth.metadata.clampedBy,null);
});

test('partial near-field clamp jointly aligns accepted trajectory and rotating anatomical source',()=>{
 const target={x:60,y:20},enemy={uid:4,hp:20,...target,radius:12},muzzle=theta=>({x:70*Math.cos(theta)-12*Math.sin(theta),y:70*Math.sin(theta)+12*Math.cos(theta),sourceAimAngle:theta,sourceBoreAxisAngle:theta});
 const birth=resolveProjectileBirth({owner,state:{enemies:[enemy]},angle:Math.atan2(20,60),radius:4,sourceArtId:'tower:BASIC',target,resolveProjectileOrigin:r=>muzzle(r.angle)});
 assert.equal(birth.metadata.clampedBy,4);assert.ok(Math.hypot(birth.point.x,birth.point.y)>0);assert.ok(Math.hypot(birth.point.x-target.x,birth.point.y-target.y)>=20);
 const actual=Math.atan2(target.y-birth.point.y,target.x-birth.point.x);assert.ok(Math.abs(actual-birth.metadata.sourceAimAngle)<1e-6);assert.ok(Math.abs(birth.metadata.acceptedAimResidual)<1e-6);
});
