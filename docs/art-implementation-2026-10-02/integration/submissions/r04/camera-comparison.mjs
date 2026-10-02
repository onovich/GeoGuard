import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';import {createServer} from 'vite';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.join(dir,'source-snapshot'),out=path.resolve(dir,process.argv[2]??'comparison');if(fs.existsSync(path.join(dir,'READY'))&&out.startsWith(dir+path.sep))throw Error('r04 is immutable; choose an output directory outside r04.');fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=await createServer({root,configFile:path.join(root,'vite.config.js'),cacheDir:path.join(out,'vite-cache'),server:{host:'127.0.0.1',port:0,hmr:false,watch:null},logLevel:'error'});await server.listen();
const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1}),errors=[],scenes=[],actions=[];
page.on('pageerror',e=>errors.push(String(e)));
const write=(name,data)=>fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(data,null,2)+'\n');
const snapshot=()=>page.evaluate(()=>window.__GEOGUARD_ART_QA__.snapshot());
const click=async name=>{await page.getByRole('button',{name,exact:true}).click();actions.push({action:'button',name});};
const expand=async()=>{if(await page.getByRole('button',{name:'Expand',exact:true}).isVisible())await click('Expand');};
const collapse=async()=>{if(await page.getByRole('button',{name:'Collapse',exact:true}).isVisible())await click('Collapse');};
const step=async frames=>{actions.push({action:'step',frames,dt:1/60});return page.evaluate(frames=>window.__GEOGUARD_ART_QA__.step({frames}),frames);};
const drag=async(locator,x,y,collapseDuringDrag=false)=>{
  await locator.scrollIntoViewIfNeeded();const label=await locator.textContent(),b=await locator.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
  if(collapseDuringDrag){await page.getByRole('button',{name:'Collapse',exact:true}).focus();await page.keyboard.press('Enter');}
  await page.mouse.move(x,y,{steps:8});await page.mouse.up();actions.push({action:'mouse-drag',label,to:[x,y],collapseDuringDrag});
};
const spawn=async(name,x,y,section='Enemies')=>{await expand();await click(section);const before=(await snapshot()).semantic.state.enemies.length;await drag(page.getByText(name,{exact:true}),x,y,true);assert((await snapshot()).semantic.state.enemies.length>before,`${name} GUI spawn rejected`);};
const hideDebugPresentation=async hide=>page.evaluate(hide=>{
  const marker=[...document.querySelectorAll('span')].find(e=>e.textContent==='Dev Test Field');
  const panel=marker?.closest('div.absolute');if(panel)panel.style.display=hide?'none':'';
  // Presentation only: this never writes mode, resources, gameplay or handlers.
},hide);
const installPreview=()=>page.evaluate(()=>{
  const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),native=ctx.translate.bind(ctx);
  window.__cameraComparison={scale:1,worldTransforms:0};
  ctx.translate=function(x,y){
    const t=ctx.getTransform(),dpr=devicePixelRatio||1,width=canvas.width/dpr,height=canvas.height/dpr;
    // Only intercept the renderer's top-level world transform. Nested rig,
    // muzzle, shadow and world-item transforms remain the original functions.
    if(t.a===dpr&&t.d===dpr&&t.b===0&&t.c===0&&t.e===0&&t.f===0){
      const z=window.__cameraComparison.scale;native(width/2,height/2);ctx.scale(z,z);native(x-width/2,y-height/2);window.__cameraComparison.worldTransforms++;
    }else native(x,y);
  };
});
const capturePair=async(name,provenance)=>{
  const before=await snapshot();const normalHash=crypto.createHash('sha256').update(JSON.stringify(before.semantic)).digest('hex');
  const metrics=[];
  for(const zoom of [1,1.25]){
    const evidence=await page.evaluate(async zoom=>{
      window.__cameraComparison.scale=zoom;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const snap=window.__GEOGUARD_ART_QA__.snapshot(),{getCharacterAnchors}=await import('/src/view/art/characters/index.js');
      const state=snap.semantic.state,cam=state.camera,ratio=cam.shakeTimer>0&&cam.shakeDuration>0?cam.shakeTimer/cam.shakeDuration:0;
      const strength=(cam.shakeStrength??0)*ratio,angle=state.gameTime*30+(cam.shakeSeed??0);
      const camera={x:cam.x+Math.cos(angle)*strength,y:cam.y+Math.sin(angle*1.18)*strength*.72};
      const hud=document.querySelector('[data-player-hud]').getBoundingClientRect(),bar=document.querySelector('[data-build-bar]').getBoundingClientRect();
      const actors=snap.presentation.actors.map(actor=>{const anchors=getCharacterAnchors(actor,{time:state.gameTime}),b=anchors?.bounds;
        const x=b?720+zoom*(b.x-camera.x):null,y=b?450+zoom*(b.y-camera.y):null,w=b?b.width*zoom:0,h=b?b.height*zoom:0;
        return{artId:actor.artId,key:actor.key,pose:actor.pose,poseTime:actor.poseTime,world:{x:actor.x,y:actor.y,radius:actor.radius},collisionDiameterCss:actor.radius*2*zoom,bodyCss:b?{x,y,width:w,height:h}:null,
          fullyInViewport:b?x>=0&&y>=0&&x+w<=1440&&y+h<=900:false,fullyInClearPlayfield:b?x>=0&&y>=hud.bottom&&x+w<=1440&&y+h<=bar.top:false};});
      const rect=r=>({x:r.x,y:r.y,width:r.width,height:r.height});
      return{zoom,worldViewport:{width:1440/zoom,height:900/zoom},hud:rect(hud),buildBar:rect(bar),clearPlayfieldCss:{top:hud.bottom,bottom:bar.top},actors,worldTransforms:window.__cameraComparison.worldTransforms,availableIds:snap.art.availableIds};
    },zoom);
    const file=`${name}-${zoom===1?'100':'125'}.png`;await page.screenshot({path:path.join(out,file)});metrics.push({...evidence,file});
    assert.deepEqual((await snapshot()).semantic,before.semantic,'Preview must not change world state, events or resources');
  }
  assert.deepEqual(metrics[0].hud,metrics[1].hud);assert.deepEqual(metrics[0].buildBar,metrics[1].buildBar);
  await page.evaluate(()=>window.__cameraComparison.scale=1);
  const row={name,provenance,semanticSha256:normalHash,mode:before.semantic.state.mode,gameTime:before.semantic.state.gameTime,debugOptions:before.semantic.state.debugOptions,money:before.semantic.state.money,
    counts:{enemies:before.semantic.state.enemies.length,towers:before.semantic.state.towers.length,hazards:before.semantic.state.hazards.length,projectiles:before.semantic.state.projectiles.length},
    metrics,worldUnchanged:true,uiRectanglesUnchanged:true};scenes.push(row);write(name+'-state',before);write(name+'-comparison',row);console.log(JSON.stringify({scene:name,counts:row.counts,mode:row.mode}));
};
try{
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/?artqa=1`);await page.waitForFunction(()=>window.__GEOGUARD_ART_QA__&&window.__GEOGUARD_ART_INSPECT__().art.status==='ready');
  assert.equal((await snapshot()).art.availableIds.length,48);await installPreview();
  await click('开始游戏');await page.evaluate(()=>window.__GEOGUARD_ART_QA__.reset({seed:20261002,mode:'normal'}));
  if(await page.getByRole('button',{name:'我知道了',exact:true}).isVisible())await click('我知道了');
  await drag(page.locator('[data-tower-card="BASIC"]'),610,520);await drag(page.locator('[data-tower-card="BASIC"]'),830,500);
  assert.equal((await snapshot()).semantic.state.money,15);await step(600);
  assert.equal((await snapshot()).semantic.state.mode,'normal');assert.equal((await snapshot()).semantic.state.debugOptions.infiniteMoney,false);
  await page.waitForTimeout(3100);await capturePair('normal-wave1','Normal reset uses original initGame with starting funds 45; two real BASIC GUI builds cost 30; native wave1 advances 600 fixed steps. No debug entities/options.');
  await page.evaluate(()=>window.__GEOGUARD_ART_QA__.reset({seed:72014,mode:'debug'}));await expand();await click('Balanced');await collapse();
  await spawn('蜂巢建筑师',1060,310,'Bosses');await spawn('冰环审判者',410,320,'Bosses');
  const types=['方阵兵','疾袭兵','重装兵','裂片兵','护盾兵','医疗棱镜','爆破球','干扰体','相位兵','掘地者','信标兵','斥候','攻城块'];
  for(let ring=0;ring<3;ring++)for(let i=0;i<types.length;i++){
    const angle=(i/types.length)*Math.PI*2+ring*.16,rx=235+ring*65,ry=145+ring*18;
    await spawn(types[i],720+Math.cos(angle)*rx,450+Math.sin(angle)*ry);
  }
  await step(66);await hideDebugPresentation(true);assert.equal(await page.getByRole('button',{name:'Expand',exact:true}).isVisible(),false);
  await capturePair('dense-debug','Existing debug GUI: Balanced preset (6 towers), HIVE + FROST bosses, 39 ordinary enemies dragged through original controls. Infinite debug resources remain true. Only DebugSpawnPanel CSS display hidden for capture; HUD still identifies test mode.');
  await hideDebugPresentation(false);
  // Wait only for a real engine hazard; no fixture/state setter creates one.
  let hazard=false;for(let i=0;i<420;i++){await step(1);if((await snapshot()).semantic.state.hazards.length){hazard=true;break;}}
  assert(hazard,'No actual hazard appeared');await hideDebugPresentation(true);await capturePair('hazard-debug','Continuation of the same debug GUI encounter until an actual engine hazard exists; unchanged world snapshot shown at both scales.');
  await hideDebugPresentation(false);await page.evaluate(()=>window.__GEOGUARD_ART_QA__.reset({seed:52,mode:'debug'}));await spawn('裂片兵',780,510);await collapse();
  let splinter=false;for(let i=0;i<240;i++){await step(1);if((await snapshot()).semantic.state.enemies.some(e=>e.id==='SPLINTER')){splinter=true;break;}}
  assert(splinter,'Real SHARD defeat did not produce SPLINTER');await hideDebugPresentation(true);await capturePair('splinter-debug','Existing debug GUI spawns one SHARD; actual PLAYER attacks kill it and actual deathSpawn produces SPLINTER. Tiny-body visibility reference, not a dense normal wave.');
  const final=await snapshot();assert.deepEqual(final.art.drawErrors,[]);assert.deepEqual(final.presentation.errors,[]);
}catch(error){errors.push(String(error.stack??error));await page.screenshot({path:path.join(out,'failure.png')});write('failure-state',await snapshot().catch(()=>null));process.exitCode=1;}
finally{write('report',{checkedAt:new Date().toISOString(),status:errors.length?'failed':'passed',sourceRoot:root,renderOnlyPreview:true,productSourceModified:false,inputAtPreviewScale:false,viewport:{width:1440,height:900,dpr:1},scenes,errors,limits:['Current fixed 48-resource source, not final character approval; SCOUT/SENTINEL local repairs may remain.','No product zoom or inverse input implementation introduced. All GUI actions occur at 1.0; 1.25 is capture-only.','No performance claim; background may draw extra off-screen patterns before clipping.']});write('gui-actions',actions);await browser.close();await server.close();console.log(JSON.stringify({scenes:scenes.length,errors,out}));}
