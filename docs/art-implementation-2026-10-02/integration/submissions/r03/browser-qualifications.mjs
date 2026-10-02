import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {createServer} from 'vite';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=process.argv[3]?path.resolve(process.argv[3]):path.resolve(dir,'../../../../..'),out=path.resolve(dir,process.argv[2]??'browser-qualifications');fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=await createServer({root,configFile:path.join(root,'vite.config.js'),cacheDir:path.join(out,'vite-cache'),server:{host:'127.0.0.1',port:0,hmr:false,watch:null},logLevel:'error'});await server.listen();
const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],checks=[];page.on('pageerror',e=>errors.push(String(e)));
const click=name=>page.getByRole('button',{name,exact:true}).click(),snapshot=()=>page.evaluate(()=>window.__GEOGUARD_ART_QA__.snapshot()),step=n=>page.evaluate(frames=>window.__GEOGUARD_ART_QA__.step({frames}),n);
const expand=async()=>{if(await page.getByRole('button',{name:'Expand',exact:true}).isVisible())await click('Expand');},collapse=async()=>{if(await page.getByRole('button',{name:'Collapse',exact:true}).isVisible())await click('Collapse');};
const drag=async(locator,x,y)=>{await locator.scrollIntoViewIfNeeded();const b=await locator.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(x,y,{steps:10});await page.mouse.up();};
const spawn=async(name,x,y)=>{await expand();await click('Enemies');await drag(page.getByText(name,{exact:true}),x,y);await collapse();};
const capture=async name=>{await page.screenshot({path:path.join(out,name+'.png')});fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(await snapshot(),null,2)+'\n');};
try{
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?artqa=1`);await page.waitForFunction(()=>window.__GEOGUARD_ART_QA__&&['partial','ready'].includes(window.__GEOGUARD_ART_INSPECT__().art.status));
  await page.evaluate(()=>window.__GEOGUARD_ART_QA__.reset({seed:42,mode:'debug'}));await collapse();
  await drag(page.locator('[data-tower-card="BASIC"]'),840,570);await spawn('干扰体',920,590);await spawn('医疗棱镜',1010,600);await spawn('方阵兵',1020,640);await spawn('爆破球',730,610);
  await page.evaluate(()=>{const api=window.__GEOGUARD_ART_QA__;for(let n=0;n<90;n++){api.step();if(api.snapshot().presentation.actors.some(a=>a.fuse?.active))break;}});
  const active=await snapshot(),actors=active.presentation.actors;
  assert(actors.some(a=>a.domain==='tower'&&a.states.jammed));assert(actors.some(a=>a.healAura?.active&&a.healAura.eligibleTargetKeys.length));assert(actors.some(a=>a.fuse?.active));assert.equal(active.semantic.state.hazards.length,0);
  await capture('01-live-heal-jam-fuse');checks.push('Actual GUI enemies expose jammed tower, eligible heal aura and lit fuse; world r03 overlays render without inventing hazards.');
  await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'游戏已暂停'}).waitFor();const frozen=await snapshot();assert.equal((await step(60)).blocked,'paused');assert.deepEqual((await snapshot()).presentation.actors,frozen.presentation.actors);await click('继续游戏');
  await step(60);const expired=await snapshot();assert(!expired.presentation.actors.some(a=>a.artId==='enemy:BOMBER'));await capture('02-fuse-expired');checks.push('Pause preserves fuse/actor state; resume reaches real explosion/removal.');
  for(const [towerId,kind]of [['CANNON','cannon'],['SNIPER','sniper']]){
    await page.evaluate(()=>window.__GEOGUARD_ART_QA__.reset({seed:90,mode:'debug'}));await collapse();await drag(page.locator(`[data-tower-card="${towerId}"]`),860,570);await spawn('重装兵',940,590);
    const hit=await page.evaluate(({towerId,kind})=>{const api=window.__GEOGUARD_ART_QA__;for(let n=0;n<200;n++){api.step();const s=api.snapshot();if(s.eventLog.some(e=>e.type==='hit'&&e.sourceArtId===`tower:${towerId}`&&e.projectileKind===kind))return s;}return null;},{towerId,kind});
    assert(hit,`${towerId} real hit missing`);await capture(`03-${kind}-real-hit`);checks.push(`${towerId} actual GUI build and firing produces ${kind} source-family hit in real game.`);
  }
  const end=await snapshot();assert.deepEqual(end.art.drawErrors,[]);assert.deepEqual(end.presentation.errors,[]);
}catch(error){errors.push(String(error.stack??error));await page.screenshot({path:path.join(out,'failure.png')});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify(await snapshot(),null,2));process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checkedAt:new Date().toISOString(),sourceRoot:root,status:errors.length?'failed':'passed',checks,errors,limits:['Some enemy/tower bodies are retained fallback while character production is pending; this validates world qualification/hit effects, not those character resources.','Heal aura denotes eligibility, not an assertion of positive healing on a full-health target.']},null,2)+'\n');await browser.close();await server.close();console.log(JSON.stringify({checks,errors,out}));}
