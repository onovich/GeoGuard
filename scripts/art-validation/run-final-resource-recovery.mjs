import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { argsMap, writeJSON } from './common.mjs';
import { verifyFinalLock } from './final-lock.mjs';
import { createFinalSession, dismissIntro } from './final-session.mjs';
const args=argsMap(),lock=verifyFinalLock(path.resolve(args.lock),args['lock-sha']),out=path.resolve(args.out);
if(fs.existsSync(out))throw Error('Fresh evidence required');fs.mkdirSync(out,{recursive:true});
const results=[];
for(const fault of ['icon-404','icon-bad-decode','icon-delay-2000','icon-delay-10000-reset','world-module-404','world-module-delay-reset']){
 const dir=path.join(out,fault),session=await createFinalSession({sourceRoot:lock.sourceRoot,out:dir,browserPath:args.browser,base:'/geoguard-qa/'}),{page}=session;
 const intercepted=[];let enabled=true;
 const icon=fault.startsWith('icon'),pattern=icon?'**/art/characters/**/icon.svg':'**/src/view/art/world/index.js*';
 try{
  await page.route(pattern,async route=>{
   if(!enabled)return route.continue();intercepted.push({url:route.request().url(),time:Date.now()});
   if(fault.includes('404'))return route.fulfill({status:404,body:'QA intentional missing resource'});
   if(fault.includes('bad-decode'))return route.fulfill({status:200,contentType:'image/svg+xml',body:'QA intentionally invalid SVG'});
   await new Promise(r=>setTimeout(r,fault.includes('10000')?10000:2000));return route.continue();
  });
  await page.goto(session.url+'?artqa=1',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'开发测试入口',exact:true}).click();await dismissIntro(page);
  await page.waitForFunction(()=>window.__GEOGUARD_ART_QA__);
  await page.evaluate(()=>window.__GEOGUARD_ART_QA__.reset({seed:1729,mode:'debug'}));
  await page.evaluate(()=>window.__GEOGUARD_ART_QA__.step({frames:30,dt:1/60}));
  const during=await page.evaluate(()=>window.__GEOGUARD_ART_QA__.snapshot());writeJSON(path.join(dir,'during.json'),during);await page.screenshot({path:path.join(dir,'during.png')});
  assert.ok(during.semantic.state.gameTime>0,'Original game advances despite art network fault');
  if(icon&&fault.includes('delay'))await page.waitForFunction(()=>[...document.querySelectorAll('img[data-art-id]')].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:16000});
  else if(icon)await page.locator('[data-art-missing]').first().waitFor();
  else await page.waitForFunction(()=>window.__GEOGUARD_ART_INSPECT__().art.status!=='loading');
  const settled=await page.evaluate(()=>({snapshot:window.__GEOGUARD_ART_QA__.snapshot(),missing:[...document.querySelectorAll('[data-art-missing]')].map(e=>e.dataset.artMissing),images:[...document.querySelectorAll('img[data-art-id]')].map(e=>({id:e.dataset.artId,complete:e.complete,width:e.naturalWidth}))}));
  writeJSON(path.join(dir,'settled.json'),settled);await page.screenshot({path:path.join(dir,'settled.png')});assert.ok(intercepted.length>0,'Fault must actually intercept a request');
  if(icon&&fault.includes('404')||fault.includes('bad-decode'))assert.ok(settled.missing.length>0);
  if(!icon&&fault.includes('404'))assert.equal(settled.snapshot.art.status,'partial');
  enabled=false;await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'开发测试入口',exact:true}).click();await dismissIntro(page);
  await page.waitForFunction(()=>window.__GEOGUARD_ART_INSPECT__?.().art.status==='ready'&&[...document.querySelectorAll('img[data-art-id]')].every(i=>i.complete&&i.naturalWidth>0));
  await page.evaluate(()=>window.__GEOGUARD_ART_QA__.reset({seed:1729,mode:'debug'}));await page.evaluate(()=>window.__GEOGUARD_ART_QA__.step({frames:30,dt:1/60}));
  const recovered=await page.evaluate(()=>window.__GEOGUARD_ART_QA__.snapshot());assert.deepEqual(recovered.art.fallbackArtIds,[]);assert.deepEqual(recovered.art.errors,[]);assert.ok(recovered.semantic.state.gameTime>0);assert.equal(await page.locator('[data-art-missing]').count(),0);
  writeJSON(path.join(dir,'recovered.json'),recovered);await page.screenshot({path:path.join(dir,'recovered.png')});
  results.push({fault,pass:true,intercepted,expectedPageErrors:session.errors,requests:session.requests,recovery:'network restored then real document reload; no automatic icon retry claim'});
 }catch(error){results.push({fault,pass:false,error:String(error.stack??error),intercepted});await page.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});}
 finally{await session.close();writeJSON(path.join(out,'progress.json'),results);console.log(JSON.stringify(results.at(-1)));}
}
verifyFinalLock(path.resolve(args.lock),args['lock-sha']);writeJSON(path.join(out,'report.json'),{sourceFingerprint:lock.sourceFingerprint,scope:'Actual app network fault injection; vector bodies have no bitmap request, system fonts have no external font request; world dynamic module can fail independently of statically imported character/UI module.',results,pass:results.every(r=>r.pass)});
