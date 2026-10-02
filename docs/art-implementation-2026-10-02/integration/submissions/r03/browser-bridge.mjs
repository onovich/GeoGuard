import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {createServer} from 'vite';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=process.argv[3]?path.resolve(process.argv[3]):path.resolve(dir,'../../../../..'),out=path.resolve(dir,process.argv[2]??'browser-bridge');fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=await createServer({root,configFile:path.join(root,'vite.config.js'),cacheDir:path.join(out,'vite-cache'),server:{host:'127.0.0.1',port:0,hmr:false,watch:null},logLevel:'error'});await server.listen();
const base=`http://127.0.0.1:${server.httpServer.address().port}`,browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(String(e)));
const write=(name,data)=>fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(data,null,2)+'\n');
const click=name=>page.getByRole('button',{name,exact:true}).click();
const expand=async()=>{if(await page.getByRole('button',{name:'Expand',exact:true}).isVisible())await click('Expand');};
const collapse=async()=>{if(await page.getByRole('button',{name:'Collapse',exact:true}).isVisible())await click('Collapse');};
const step=frames=>page.evaluate(n=>window.__GEOGUARD_ART_QA__.step({frames:n}),frames),snapshot=()=>page.evaluate(()=>window.__GEOGUARD_ART_QA__.snapshot());
const drag=async(locator,x,y)=>{await locator.scrollIntoViewIfNeeded();const b=await locator.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(x,y,{steps:10});await page.mouse.up();};
const sequence=async seed=>{
  await page.evaluate(seed=>window.__GEOGUARD_ART_QA__.reset({seed,mode:'debug'}),seed);await collapse();
  await drag(page.locator('[data-tower-card="BASIC"]'),860,570);
  await expand();await click('Enemies');await drag(page.getByText('重装兵',{exact:true}),970,600);await collapse();
  await step(60);await page.keyboard.down('d');await step(30);await page.keyboard.up('d');await step(90);
  return snapshot();
};
try{
  await page.goto(base);await page.getByRole('button',{name:'开始游戏',exact:true}).waitFor();assert.equal(await page.evaluate(()=>typeof window.__GEOGUARD_ART_QA__),'undefined');checks.push('DEV URL without opt-in has no control bridge.');
  await page.goto(base+'/?artqa=1');await page.waitForFunction(()=>window.__GEOGUARD_ART_QA__&&['partial','ready'].includes(window.__GEOGUARD_ART_INSPECT__().art.status));
  await page.evaluate(()=>{window.__testNativeRandom=Math.random;window.__testNativeRandomCalls=0;window.__testRandomWrapper=()=>{window.__testNativeRandomCalls++;return window.__testNativeRandom();};Math.random=window.__testRandomWrapper;});
  const first=await sequence(1729);write('seed-1729-first',first);
  const second=await sequence(1729);write('seed-1729-second',second);
  assert.deepEqual(second.semantic,first.semantic);assert.equal(second.control.rngCalls,first.control.rngCalls);
  const other=await sequence(1730);write('seed-1730',other);assert.notDeepEqual(other.semantic,first.semantic);
  checks.push('Two identical real mouse/keyboard traces with seed 1729 produce identical semantic state/events and RNG count; seed 1730 differs.');
  const readOnly=await page.evaluate(()=>{const api=window.__GEOGUARD_ART_QA__,s=api.snapshot();s.semantic.state.player.hp=-999;return api.snapshot().semantic.state.player.hp;});assert.notEqual(readOnly,-999);
  await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'游戏已暂停'}).waitFor();const paused=await snapshot();assert.equal((await step(120)).blocked,'paused');assert.equal((await snapshot()).semantic.state.gameTime,paused.semantic.state.gameTime);await click('继续游戏');
  await expand();await click('Open Reward');const reward=await snapshot();assert(reward.semantic.rewardState.active);assert.equal((await step(120)).blocked,'reward');assert.equal((await snapshot()).semantic.state.gameTime,reward.semantic.state.gameTime);await page.screenshot({path:path.join(out,'reward-frozen.png')});
  checks.push('Actual pause and GUI reward dialogs freeze manual steps; snapshot mutation cannot affect the game.');
  await page.evaluate(()=>window.__GEOGUARD_ART_QA__.reset({seed:99,mode:'debug'}));
  const renderCalls=await page.evaluate(()=>{const before=window.__testNativeRandomCalls;window.__GEOGUARD_ART_QA__.step({frames:120});return {nativeCalls:window.__testNativeRandomCalls-before,restored:Math.random===window.__testRandomWrapper};});assert.equal(renderCalls.nativeCalls,0);assert(renderCalls.restored);
  const beforeRelease=(await snapshot()).semantic.state.gameTime;await page.evaluate(()=>window.__GEOGUARD_ART_QA__.release());await page.waitForTimeout(300);assert((await snapshot()).semantic.state.gameTime>beforeRelease);assert(await page.evaluate(()=>Math.random===window.__testRandomWrapper));
  await page.evaluate(()=>{Math.random=window.__testNativeRandom;});checks.push('Step/draw does not consume native randomness; reference is restored; release resumes real RAF progression.');
  write('summary',{sameSeedHash:crypto.createHash('sha256').update(JSON.stringify(first.semantic)).digest('hex'),rngCalls:first.control.rngCalls,eventCount:first.semantic.events.length,renderCalls});
}catch(error){errors.push(String(error.stack??error));await page.screenshot({path:path.join(out,'failure.png')});process.exitCode=1;}
finally{write('report',{checkedAt:new Date().toISOString(),sourceRoot:root,status:errors.length?'failed':'passed',checks,errors});await browser.close();await server.close();console.log(JSON.stringify({checks,errors,out}));}
