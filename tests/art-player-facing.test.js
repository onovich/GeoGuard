import test from 'node:test';
import assert from 'node:assert/strict';
import {createRuntimeState} from '../src/logic/engine/gameState.js';
import {createPresentationRuntime} from '../src/view/art/integration/presentationRuntime.js';
test('hero shows the recent left shot while moving right and resumes movement-facing after shot expires',()=>{
 const state=createRuntimeState(),runtime=createPresentationRuntime();const viewport={width:1280,height:720,dpr:1},camera={x:0,y:0,zoom:1.25};
 runtime.prepare(state,viewport,camera);state.projectiles.push({sourceArtId:'hero:PLAYER',x:state.player.x,y:state.player.y,vx:-420,vy:0,kind:'basic',birthOrigin:{sourceFacing:'left'}});runtime.captureShots(state,0);
 state.gameTime=.1;state.player.x+=10;let actor=runtime.prepare(state,viewport,camera).actors.find(e=>e.actor.domain==='hero').actor;assert.equal(actor.facing,'left');assert.equal(actor.pose,'attack');
 state.gameTime=.3;state.player.x+=20;actor=runtime.prepare(state,viewport,camera).actors.find(e=>e.actor.domain==='hero').actor;assert.equal(actor.facing,'right');assert.equal(actor.pose,'move');assert.equal(actor.aimAngle,0);
});
