import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createDevQaBridge} from '../../../../../src/view/art/integration/devQaBridge.js';
const dir=path.dirname(fileURLToPath(import.meta.url)),original=Math.random;let state={gameTime:0},epoch=0;
const b={gameState:'PLAYING',paused:false,rewardActive:false,hidden:()=>false,state:()=>state,prepareAudio:()=>{},events:()=>[],
  initGame:()=>{state={gameTime:0,player:{radius:12},joystick:{}};epoch++;b.paused=false;b.rewardActive=false;},
  update:dt=>{state.gameTime+=dt;state.random=Math.random();},draw:()=>{},snapshot:()=>({state,gameState:b.gameState,paused:b.paused,rewardState:{active:b.rewardActive,choices:[]},presentation:{epoch,events:[]}})};
const c=createDevQaBridge(()=>b),api=c.api;
api.reset({seed:12});const a=[c.run(()=>Math.random()),c.run(()=>Math.random())];assert.equal(Math.random,original);
api.reset({seed:12});assert.deepEqual([c.run(()=>Math.random()),c.run(()=>Math.random())],a);
api.reset({seed:13});assert.notDeepEqual([c.run(()=>Math.random()),c.run(()=>Math.random())],a);
assert.throws(()=>c.run(()=>{throw Error('test');}),/test/);assert.equal(Math.random,original);
assert.throws(()=>c.run(()=>Promise.resolve()),/synchronous/);assert.equal(Math.random,original);
api.reset({seed:1});c.schedule(()=>{state.player.radius=14;},50);api.step({frames:2});assert.equal(state.player.radius,12);api.step();assert.equal(state.player.radius,14);
b.paused=true;let before=state.gameTime;assert.equal(api.step({frames:60}).blocked,'paused');assert.equal(state.gameTime,before);
b.paused=false;b.rewardActive=true;assert.equal(api.step({frames:60}).blocked,'reward');assert.equal(state.gameTime,before);
b.rewardActive=false;b.hidden=()=>true;assert.equal(api.step().blocked,'hidden');b.hidden=()=>false;
b.update=dt=>{state.gameTime+=dt;b.rewardActive=true;};assert.equal(api.step({frames:60}).advancedFrames,1);assert.equal(api.step().blocked,'reward');
const snap=api.snapshot();snap.semantic.state.player.radius=500;assert.equal(state.player.radius,14);
assert.throws(()=>api.step({frames:0}),RangeError);assert.throws(()=>api.step({dt:.2}),RangeError);assert.throws(()=>api.reset({seed:-1}),RangeError);
api.release();assert.equal(c.isManual(),false);assert.equal(Math.random,original);assert.throws(()=>api.step(),/reset/);
const report={status:'passed',checkedAt:new Date().toISOString(),checks:['same/different seed','Math.random restored after success/throw/Promise rejection','bounded step arguments','simulated timer','pause/reward/visibility and mid-batch reward gates','detached snapshots','release returns automatic mode']};fs.writeFileSync(path.join(dir,'bridge-unit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
