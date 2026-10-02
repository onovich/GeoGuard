import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {createServer} from 'vite';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.join(dir,'source-snapshot'),out=path.join(dir,'browser-detail');fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=await createServer({root,configFile:path.join(root,'vite.config.js'),cacheDir:path.join(out,'vite-cache'),server:{host:'127.0.0.1',port:0,hmr:false,watch:null},logLevel:'error'});await server.listen();
const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(String(e)));
const click=name=>page.getByRole('button',{name,exact:true}).click(),inspect=()=>page.evaluate(()=>window.__GEOGUARD_ART_INSPECT__());
const capture=async name=>{await page.screenshot({path:path.join(out,name+'.png')});fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(await inspect(),null,2)+'\n');};
try{
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}`);await click('开发测试入口');await click('Clear All');await click('Collapse');
  const before=await inspect();await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');const after=await inspect();assert(after.state.player.x>before.state.player.x+20);checks.push('Actual keyboard movement changes player position.');
  const card=page.locator('[data-tower-card="BASIC"]');const b=await card.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(430,590,{steps:12});
  const ghost=await inspect();assert(ghost.state.dragPlacement.active&&ghost.state.dragPlacement.canPlace);await capture('01-real-placement-ghost');await page.mouse.up();assert.equal((await inspect()).state.towers.length,1);checks.push('Live legal ghost/range appears before mouse-up; actual placement creates exactly one tower.');
  await click('Expand');await click('Bosses');const boss=page.getByText('冰环审判者',{exact:true});await boss.scrollIntoViewIfNeeded();const box=await boss.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(1040,640,{steps:12});await page.mouse.up();await click('Phase 2');await click('Collapse');
  await page.waitForFunction(()=>window.__GEOGUARD_ART_INSPECT__().presentation.actors.some(a=>a.artId==='mechanic:SEAL'),{},{timeout:22000});await capture('02-live-seal');
  await page.waitForFunction(()=>window.__GEOGUARD_ART_INSPECT__().presentation.retired.some(a=>a.artId==='mechanic:SEAL'&&['trigger','broken'].includes(a.pose)),{},{timeout:6000});
  const retired=(await inspect()).presentation.retired;assert(retired.some(a=>a.artId==='mechanic:SEAL'));await capture('03-seal-retirement');checks.push('Actual live SEAL body captured, then confirmed trigger/broken retirement observed.');
}catch(error){errors.push(String(error.stack??error));await page.screenshot({path:path.join(out,'failure.png')});process.exitCode=1;}
finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checkedAt:new Date().toISOString(),sourceRoot:root,status:errors.length?'failed':'passed',checks,errors},null,2)+'\n');await browser.close();await server.close();console.log(JSON.stringify({checks,errors,out}));}
