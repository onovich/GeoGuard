import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../../../..');
if(fs.existsSync(path.join(out,'READY')))throw Error('Sealed submission is immutable');
const fixtureOnly=process.argv.includes('--fixtures-only');
const provisional=process.argv.includes('--develop-camera');
const {chromium}=createRequire(import.meta.url)('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,ignoreDefaultArgs:['--hide-scrollbars'],executablePath:'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});
const page=await browser.newPage({viewport:{width:1440,height:900}}),base='http://127.0.0.1:5174';
const report={scope:fixtureOnly?'Actual React component fixtures; no game-loop claim':'Actual GameScreen and original engine; separate deterministic component fixtures',dependencies:{},game:[],fixtures:[],errors:[],responses:[]};
page.on('pageerror',e=>report.errors.push(String(e)));
page.on('response',r=>{if(r.url().includes('/art/characters/'))report.responses.push({url:r.url(),status:r.status()});});
const write=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n','utf8');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const walk=dir=>fs.readdirSync(dir).flatMap(n=>{const p=path.join(dir,n);return fs.statSync(p).isDirectory()?walk(p):[p];});
const sourceHashes=()=>Object.fromEntries(['src','public/art'].flatMap(p=>walk(path.join(root,p))).map(p=>[path.relative(root,p).replaceAll('\\','/'),hash(p)]));
const sourceBefore=sourceHashes();
const dependency=owner=>{const ready=JSON.parse(fs.readFileSync(path.join(root,`docs/art-implementation-2026-10-02/${owner}/READY.json`),'utf8'));assert.equal(hash(path.join(root,`docs/art-implementation-2026-10-02/${owner}`,ready.packetPath)),ready.packetSha256);return ready;};
report.dependencies.characters=dependency('characters');report.dependencies.integration=dependency('integration');
assert.equal(report.dependencies.characters.revision,'r04');
const sizes=[[1440,900],[1280,720],[960,720]];
const snap=()=>page.evaluate(()=>window.__GEOGUARD_ART_QA__.snapshot());
const click=async name=>page.getByRole('button',{name,exact:true}).click();
const expand=async()=>{if(await page.getByRole('button',{name:'Expand',exact:true}).isVisible())await click('Expand');};
const collapse=async()=>{if(await page.getByRole('button',{name:'Collapse',exact:true}).isVisible())await click('Collapse');};
const step=async frames=>page.evaluate(frames=>window.__GEOGUARD_ART_QA__.step({frames}),frames);
const drag=async(locator,x,y,collapseDuring=false)=>{await locator.scrollIntoViewIfNeeded();const b=await locator.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();if(collapseDuring){await page.getByRole('button',{name:'Collapse',exact:true}).focus();await page.keyboard.press('Enter');}await page.mouse.move(x,y,{steps:8});await page.mouse.up();};
const spawn=async(name,x,y)=>{await expand();await click('Bosses');await drag(page.getByText(name,{exact:true}),x,y,true);};
const debugPresentation=async hidden=>page.evaluate(hidden=>{const label=[...document.querySelectorAll('span')].find(e=>e.textContent==='Dev Test Field');const panel=label?.closest('div.absolute');if(panel)panel.style.display=hidden?'none':'';},hidden);
const dom=()=>page.evaluate(async()=>{
  const api=await import('/src/view/art/characters/index.js');
  const rect=el=>{const r=el?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}:null;};
  return{missing:[...document.querySelectorAll('[data-art-missing]')].map(e=>e.dataset.artMissing),icons:[...document.querySelectorAll('img[data-art-id]')].map(e=>({artId:e.dataset.artId,src:e.getAttribute('src'),canonical:api.getCharacterIcon(e.dataset.artId)?.src,loaded:e.complete&&e.naturalWidth>0,width:e.naturalWidth,height:e.naturalHeight})),hud:rect(document.querySelector('[data-player-hud]')),boss:rect(document.querySelector('[data-boss-hud]')),bar:rect(document.querySelector('[data-build-scroll]')),cards:[...document.querySelectorAll('[data-tower-card]')].map(e=>({id:e.dataset.towerCard,...rect(e)})),members:[...document.querySelectorAll('[data-boss-member]')].map(e=>({text:e.textContent,hp:e.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')})),dialog:rect(document.querySelector('[role=dialog]')),rewardCount:document.querySelector('[data-reward-choices]')?.dataset.rewardChoices};
});
const capture=async(name,list,extra={})=>{await page.waitForTimeout(100);await page.waitForFunction(()=>[...document.querySelectorAll('img[data-art-id]')].every(e=>e.complete&&e.naturalWidth>0));const evidence=await dom();assert.deepEqual(evidence.missing,[]);assert(evidence.icons.every(e=>e.src===e.canonical&&e.loaded));await page.screenshot({path:path.join(out,name+'.png')});list.push({name,...extra,...evidence});};
try{
  if(!fixtureOnly){
    if(!provisional)assert.notEqual(report.dependencies.integration.revision,'r04','Wait for final product camera packet; r04 is a comparison only');
    report.provisionalUnsealedCamera=provisional;
    for(const [width,height]of sizes){
      const tag=`${width}x${height}`;await page.setViewportSize({width,height});await page.goto(base+'/?artqa=1');await page.waitForFunction(()=>window.__GEOGUARD_ART_QA__&&window.__GEOGUARD_ART_INSPECT__().art.status==='ready');
      const camera=await page.evaluate(async()=>{const api=await import('/src/view/art/integration/worldCamera.js');return api.DESKTOP_WORLD_ZOOM;});assert.equal(camera,1.25);
      await click('开始游戏');await page.evaluate(()=>window.__GEOGUARD_ART_QA__.reset({seed:20261002,mode:'normal'}));if(await page.getByRole('button',{name:'我知道了',exact:true}).isVisible())await click('我知道了');
      await drag(page.locator('[data-tower-card=BASIC]'),width/2-125,height/2-100);
      const built=await snap();assert.equal(built.semantic.state.money,30);assert.equal(built.semantic.state.towers.length,1);assert(Math.abs(built.semantic.state.towers[0].x+100)<1e-7);assert(Math.abs(built.semantic.state.towers[0].y+80)<1e-7);
      await step(120);await capture(`game-normal-${tag}`,report.game,{kind:'normal-game',inverseInputVerified:true,worldPlacement:{x:built.semantic.state.towers[0].x,y:built.semantic.state.towers[0].y}});
      await click('暂停');await page.getByRole('dialog',{name:'游戏已暂停',exact:true}).waitFor();await capture(`game-pause-${tag}`,report.game,{kind:'normal-game-pause'});await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'游戏已暂停',exact:true}).waitFor({state:'hidden'});
      await page.evaluate(()=>window.__GEOGUARD_ART_QA__.reset({seed:72014,mode:'debug'}));await expand();await click('Unlock All Towers');await collapse();await debugPresentation(true);
      await page.locator('[data-build-scroll]').evaluate(e=>{e.scrollLeft=0;});
      await capture(`game-nine-towers-${tag}`,report.game,{kind:'actual-sandbox',debugPanelPresentationHidden:true});const nine=await dom();assert.equal(nine.cards.length,9);const full=nine.cards.filter(c=>c.x>=nine.bar.x&&c.right<=nine.bar.right).length;assert.equal(full,width===960?5:6);report.game.at(-1).firstPageFullCards=full;
      const b=await page.locator('[data-build-scroll]').boundingBox();await page.mouse.move(b.x+30,b.y+b.height-8);await page.mouse.down();await page.mouse.move(b.x+b.width-30,b.y+b.height-8,{steps:8});await page.mouse.up();
      const scroll=await page.locator('[data-build-scroll]').evaluate(e=>({left:e.scrollLeft,max:e.scrollWidth-e.clientWidth}));assert.equal(scroll.left,scroll.max);await capture(`game-nine-scroll-end-${tag}`,report.game,{kind:'actual-sandbox',nativeMouseScrollbar:true,scroll});
      await debugPresentation(false);await spawn('蜂巢建筑师',width/2+210,height/2-110);await step(66);await debugPresentation(true);await capture(`game-single-${tag}`,report.game,{kind:'actual-sandbox-HIVE',debugPanelPresentationHidden:true});assert.equal((await dom()).members.length,1);
      await debugPresentation(false);await expand();await click('Wave 1');await collapse();await spawn('昼夜双子',width/2+180,height/2-100);await step(66);await debugPresentation(true);await capture(`game-twins-${tag}`,report.game,{kind:'actual-debug-wave-flow-GUI-TWINS',debugPanelPresentationHidden:true});assert.equal((await dom()).members.length,2);
      write(`game-twins-${tag}-state.json`,await snap());
      // Original GUI towers and combat create the survivor; no state setter.
      await debugPresentation(false);await expand();await click('Boss Duel');await click('Phase 3');await collapse();
      let survivor=false;for(let n=0;n<1800;n++){await step(1);const s=await snap();const alive=s.semantic.state.enemies.filter(e=>e.isBoss&&e.hp>0);if(alive.length===1&&alive[0].bossState?.partnerFallen&&await page.locator('[data-boss-member]').count()===1){survivor=true;break;}if(!alive.length)break;}
      assert(survivor,`No real surviving twin at ${tag}`);await debugPresentation(true);await capture(`game-survivor-${tag}`,report.game,{kind:'actual-debug-wave-flow-real-twin-defeat',debugPanelPresentationHidden:true});write(`game-survivor-${tag}-state.json`,await snap());
      const final=await snap();report.game.at(-1).art=final.art;
      if(!provisional)assert.deepEqual(final.art.fallbackArtIds,[]);assert.deepEqual(final.art.drawErrors,[]);assert.deepEqual(final.presentation.errors,[]);
      assert.equal((await dom()).members.length,1);assert((await dom()).members[0].text.includes('ENRAGED'));
      await page.evaluate(()=>window.__GEOGUARD_ART_QA__.reset({seed:20261002,mode:'normal'}));
      const cancelBox=await page.locator('[data-tower-card=BASIC]').boundingBox();await page.mouse.move(cancelBox.x+40,cancelBox.y+45);await page.mouse.down();await page.mouse.move(width/2+130,height/2+60,{steps:5});await page.mouse.move(cancelBox.x+40,cancelBox.y+45,{steps:5});await page.mouse.up();
      const canceled=await snap(),cancelPass=canceled.semantic.state.money===45&&canceled.semantic.state.towers.length===0;report.game.push({name:`game-reset-return-cancel-${tag}`,kind:'real-GUI-reset-and-drag-back',passed:cancelPass,money:canceled.semantic.state.money,towers:canceled.semantic.state.towers.length,geometry:canceled.geometry});if(!provisional)assert(cancelPass,'Reset must retain build bar cancellation rectangle');
    }
  }
  await page.goto(base+'/docs/art-implementation-2026-10-02/ui/submissions/r03/component-harness.html');await page.waitForFunction(()=>typeof window.setUiFixture==='function');await click('我知道了');
  for(const [width,height]of sizes){
    await page.setViewportSize({width,height});
    for(const mode of ['twins','single','survivor','long-boss','status','reward-one','reward-two','reward-three']){
      await page.evaluate(mode=>window.setUiFixture(mode),mode);await capture(`component-${mode}-${width}x${height}`,report.fixtures,{mode,kind:'actual-components-with-original-engine-derived-data'});
      const record=report.fixtures.at(-1);if(mode.startsWith('reward-')){const count=['reward-one','reward-two','reward-three'].indexOf(mode)+1;assert.equal(Number(record.rewardCount),count);const choices=page.locator('[data-reward-choices] button');assert.equal(await choices.count(),count);for(const e of await choices.all()){const r=await e.boundingBox();assert(r.y>=0&&r.y+r.height<=height);}const before=await page.evaluate(()=>window.uiFixtureAudit.events.filter(e=>e.type==='reward').length);await choices.first().click();assert.equal(await page.evaluate(()=>window.uiFixtureAudit.events.filter(e=>e.type==='reward').length),before+1);record.selectionCallbackExactlyOnce=true;}
      if(['twins','status'].includes(mode))assert(record.boss.bottom<=180);
    }
  }
  assert.equal(report.responses.filter(r=>r.status!==200&&r.status!==304).length,0);
  assert.deepEqual(report.errors,[]);
  const sourceAfter=sourceHashes(),sourceDeltas=[...new Set([...Object.keys(sourceBefore),...Object.keys(sourceAfter)])].filter(p=>sourceBefore[p]!==sourceAfter[p]);write(fixtureOnly?'fixture-source-audit.json':'runtime-source-audit.json',{files:sourceBefore,sourceDeltas});report.sourceDeltas=sourceDeltas;
  if(!provisional)assert.deepEqual(sourceDeltas,[],'Source changed during final capture');
  if(!provisional)assert.deepEqual(dependency('integration'),report.dependencies.integration,'Integration packet changed during capture');
  report.status='passed';
}catch(error){report.status='failed';report.errors.push(String(error.stack??error));await page.screenshot({path:path.join(out,fixtureOnly?'fixture-failure.png':'final-failure.png')});if(!fixtureOnly)write('final-failure-state.json',await snap().catch(()=>null));process.exitCode=1;}
finally{write(fixtureOnly?'fixture-verification.json':'runtime-verification.json',report);await browser.close();console.log(JSON.stringify({status:report.status,game:report.game.length,fixtures:report.fixtures.length,errors:report.errors}));}
