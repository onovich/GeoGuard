import test from 'node:test';import assert from 'node:assert/strict';
import {isSafeCentreEmission,isCentreBulletInsideSource} from '../src/view/art/world/sourceBirthVisibility.js';
import {drawFeedback} from '../src/view/art/world/feedback.js';
import {drawProjectile} from '../src/view/art/world/projectiles.js';
const birth={ownerCentre:{x:0,y:0},accepted:{x:0,y:0},requested:{x:40,y:-35},birthStrategy:'no-safe-source-ray-centre'};
test('all anatomical centre clamps omit false muzzle flashes, including normal centre overlap',()=>{
 const ctx=new Proxy({},{get(){throw Error('suppressed flash must not paint')}}),receipts=[];
 for(const birthStrategy of ['owner-segment-joint','no-safe-source-ray-centre']){
 const item={key:'shot',kind:'feedback',sourceArtId:'tower:RAIL',x:0,y:0,data:{type:'shot',time:0,birthOrigin:{...birth,birthStrategy}}};assert.equal(drawFeedback(ctx,item,{time:0},{onPresentationSuppressed:r=>receipts.push(r)}).drawn,true);
 }
 assert.equal(receipts.length,2);assert.equal(isSafeCentreEmission({...birth,requested:{x:0,y:0}}),false,'logical PLAYER centre remains legitimate');assert.equal(isSafeCentreEmission({...birth,accepted:{x:2,y:0}}),false,'noncentre normal near clamp remains visible');
});
test('conservative centre bullet hides only inside measured source bounds; source still required',()=>{
 const item={key:'bullet',kind:'projectile',sourceArtId:'tower:RAIL',x:0,y:0,radius:3,ownerSourceBounds:{x:-20,y:-70,width:70,height:80},data:{kind:'sniper',vx:700,vy:0,birthOrigin:birth}};
 assert.equal(isCentreBulletInsideSource(item,item.ownerSourceBounds),true);assert.equal(isCentreBulletInsideSource({...item,x:60},item.ownerSourceBounds),false);assert.equal(isCentreBulletInsideSource(item,null),false);
 const ctx=new Proxy({},{get(){throw Error('inside bullet must not paint')}}),receipts=[];
 assert.equal(drawProjectile(ctx,item,{time:0},{originalEffects:{'tower:RAIL|bullet':{width:30,height:8}},onPresentationSuppressed:r=>receipts.push(r)}).drawn,true);assert.equal(receipts[0].kind,'bullet');
 assert.equal(drawProjectile(ctx,item,{time:0},{originalEffects:{}}).drawn,false,'hidden presentation never excuses missing original asset');
});