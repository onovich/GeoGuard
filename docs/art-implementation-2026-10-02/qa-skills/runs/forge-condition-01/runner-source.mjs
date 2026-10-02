import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createFinalSession, dismissIntro, expandDebug, collapseDebug, dragDebugCard } from '../../../scripts/art-validation/final-session.mjs';
import { verifyFinalLock } from '../../../scripts/art-validation/final-lock.mjs';
import { fileHash, writeJSON } from '../../../scripts/art-validation/common.mjs';

const owner = path.dirname(fileURLToPath(import.meta.url));
const permission = JSON.parse(fs.readFileSync(path.join(owner,'PERMISSION.json')));
assert.equal(permission.permission,'PERMISSION_TO_RUN_BROWSER');
const lockPath=path.resolve(owner,'../qa/submissions/r04/candidate-lock.json');
const lockSha=permission.candidateLockSha256;
const lock=verifyFinalLock(lockPath,lockSha);
const options=Object.fromEntries(process.argv.slice(2).map(v=>{const i=v.indexOf('=');return [v.slice(0,i),v.slice(i+1)];}));
const runId=options.run ?? 'continuous-01';
assert.match(runId,/^[a-z0-9-]+$/);
const out=path.join(owner,'runs',runId);
assert.ok(!fs.existsSync(out),'New run directory required');
const plan=JSON.parse(fs.readFileSync(path.join(owner,'submissions/r01/scenes.json')));
let scenes=plan.scenes;
if(options.scenes) scenes=scenes.filter(s=>options.scenes.split(',').includes(s.sceneId));
if(options.survivor){assert.ok(['sun','moon'].includes(options.survivor));scenes=plan.scenes.filter(s=>s.encounter==='TWINS'&&s.phaseIndex===Number(options.phase??2)).map(s=>({...s,sceneId:`TWINS-${options.survivor}-survivor-P${s.phaseIndex+1}`,survivor:options.survivor,cases:[`C04-TWINS-${options.survivor}-P${s.phaseIndex+1}-${options.survivor==='sun'?'soloSolarVolley':'soloLunarOrbit'}`]}));}
const browserPath='C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe';
const viewHeight=Number(options.height)||900;
const session=await createFinalSession({sourceRoot:lock.sourceRoot,out,browserPath,width:1440,height:viewHeight});
const {page}=session;
fs.copyFileSync(fileURLToPath(import.meta.url),path.join(out,'runner-source.mjs'));
writeJSON(path.join(out,'session.json'),{sourceFingerprint:lock.sourceFingerprint,lockSha,browserPath,browserVersion:session.browserVersion,url:session.url,viewport:{width:1440,height:viewHeight,dpr:1},startedAt:new Date().toISOString(),runnerSha:fileHash(fileURLToPath(import.meta.url)),permission});
const results=[];
let frame=0,trace=[],keys=new Set();
const snap=()=>page.evaluate(()=>window.__GEOGUARD_ART_QA__.snapshot());
const mark=(operation,detail={})=>trace.push({frame,operation,...detail});
async function button(label){await expandDebug(page);await page.getByRole('button',{name:label,exact:true}).click();mark('GUI button',{label});await collapseDebug(page);}
async function setKeys(next){for(const k of keys)if(!next.has(k)){await page.keyboard.up(k);mark('GUI keyup',{key:k});}for(const k of next)if(!keys.has(k)){await page.keyboard.down(k);mark('GUI keydown',{key:k});}keys=next;}
function screenPoint(state,entity){const camera=state.camera;const ratio=camera.shakeTimer>0&&camera.shakeDuration>0?camera.shakeTimer/camera.shakeDuration:0;const strength=(camera.shakeStrength??0)*ratio;const angle=state.gameTime*30+(camera.shakeSeed??0);return {x:720+(entity.x-camera.x-Math.cos(angle)*strength)*1.25,y:viewHeight/2+(entity.y-camera.y-Math.sin(angle*1.18)*strength*.72)*1.25};}
async function dragTower(id,x,y){await collapseDebug(page);const c=page.locator(`[data-tower-card="${id}"]`);await c.scrollIntoViewIfNeeded();const b=await c.boundingBox();assert.ok(b);await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(x,y,{steps:5});await page.mouse.up();mark('GUI tower drag',{id,from:[b.x+b.width/2,b.y+b.height/2],to:[x,y]});}
async function capture(dir,name,snapshot=undefined){const s=snapshot??await snap();writeJSON(path.join(dir,name+'.json'),{frame,dt:1/60,snapshot:s,inputTrace:trace});await page.screenshot({path:path.join(dir,name+'.png')});return {json:name+'.json',png:name+'.png',frame,gameTime:s.semantic.state.gameTime};}
async function pauseCheck(dir,name){await setKeys(new Set());await page.keyboard.press('Escape');mark('GUI pause Escape');const before=await snap();const stepped=await page.evaluate(()=>window.__GEOGUARD_ART_QA__.step({frames:12,dt:1/60}));const after=await snap();assert.equal(stepped.advancedFrames,0);assert.equal(stepped.blocked,'paused');assert.deepEqual(after.semantic.state,before.semantic.state);const evidence=await capture(dir,name,after);await page.keyboard.press('Escape');mark('GUI resume Escape');return {pass:true,stepped,evidence};}

// Pure observation cache contains only cloned snapshots. Only qa.step advances original hook updates.
async function initObserver(){await page.evaluate(()=>{
  const qa=window.__GEOGUARD_ART_QA__;
  window.__QA_SKILLS_OBSERVATION__={previous:qa.snapshot(),frame:0};
});}
async function advance(){return page.evaluate(()=>{
  const qa=window.__GEOGUARD_ART_QA__, o=window.__QA_SKILLS_OBSERVATION__, rows=[];
  let latest=o.previous;
  for(let i=0;i<12;i++){
    const step=qa.step({frames:1,dt:1/60});if(!step.advancedFrames)return {rows,blocked:step.blocked,snapshot:qa.snapshot(),frame:o.frame,events:[]};
    o.frame++;const next=qa.snapshot(),state=next.semantic.state,prior=o.previous.semantic.state,events=[];
    for(const boss of state.enemies.filter(e=>e.isBoss)){
      const previous=prior.enemies.find(e=>e.uid===boss.uid),bs=boss.bossState,pbs=previous?.bossState;
      const execute=pbs?.actionMode==='windup'&&bs.actionMode!=='windup'&&pbs.castAbility===bs.castAbility&&boss.currentPhaseIndex===previous.currentPhaseIndex&&(boss.abilityCooldowns[bs.castAbility]??0)>(previous.abilityCooldowns[bs.castAbility]??0);
      if(execute||bs.actionMode!==pbs?.actionMode||bs.castAbility!==pbs?.castAbility||bs.partnerFallen!==pbs?.partnerFallen)events.push({uid:boss.uid,role:boss.twinRole??'boss',phaseIndex:boss.currentPhaseIndex,ability:bs.castAbility,mode:bs.actionMode,execute,partnerFallen:Boolean(bs.partnerFallen),previousMode:pbs?.actionMode});
    }
    for(const boss of prior.enemies.filter(e=>e.isBoss))if(!state.enemies.some(e=>e.uid===boss.uid))events.push({uid:boss.uid,role:boss.twinRole??'boss',ability:boss.bossState.castAbility,phaseIndex:boss.currentPhaseIndex,mode:'removed',previousHP:boss.hp});
    const childBefore=prior.enemies.filter(e=>e.summonedByBossUid!=null),childAfter=state.enemies.filter(e=>e.summonedByBossUid!=null);
    const childChanges={born:childAfter.filter(e=>!childBefore.some(p=>p.uid===e.uid)),gone:childBefore.filter(e=>!childAfter.some(p=>p.uid===e.uid))};
    const hazardChanges=state.hazards.length!==prior.hazards.length;
    rows.push({frame:o.frame,time:state.gameTime,player:{x:state.player.x,y:state.player.y,hp:state.player.hp},camera:state.camera,
      bosses:state.enemies.filter(e=>e.isBoss).map(e=>({uid:e.uid,role:e.twinRole??'boss',x:e.x,y:e.y,hp:e.hp,shield:e.shield,phaseIndex:e.currentPhaseIndex,mode:e.bossState.actionMode,ability:e.bossState.castAbility,actionTimer:e.bossState.actionTimer,cooldowns:e.abilityCooldowns,damageTakenMultiplier:e.damageTakenMultiplier,partnerFallen:e.bossState.partnerFallen})),
      hazards:state.hazards,children:childAfter.map(e=>({uid:e.uid,id:e.id,x:e.x,y:e.y,hp:e.hp,owner:e.summonedByBossUid,encounter:e.summonedByEncounterUid,mechanic:e.mechanic})),projectiles:state.projectiles.map(p=>({x:p.x,y:p.y,sourceUid:p.sourceUid,damage:p.damage})),events,childChanges});
    o.previous=next;latest=next;
    if(events.length||childChanges.born.length||childChanges.gone.length||hazardChanges||next.control.droppedEvents)return {rows,snapshot:next,events,childChanges,hazardChanges,frame:o.frame};
  }
  return {rows,snapshot:latest,events:[],frame:o.frame};
});}

try{
  await page.goto(session.url+'?artqa=1');await page.getByRole('button',{name:'开发测试入口',exact:true}).click();await dismissIntro(page);await page.waitForFunction(()=>window.__GEOGUARD_ART_QA__&&window.__GEOGUARD_ART_INSPECT__().art.status==='ready');
  for(const scene of scenes){
    const dir=path.join(out,scene.sceneId);fs.mkdirSync(dir);frame=0;trace=[];const casts=[],active=new Map(),completed=new Set(),paused=new Set();let captureIndex=0,lastMinions=-999,lastDecoy=-999,lastKillTower=-999,realDefeat=null,defeatMode=false,secondDefeat=null;const errors=[];
    try{
      await setKeys(new Set());await page.evaluate(seed=>window.__GEOGUARD_ART_QA__.reset({seed,mode:'debug'}),scene.seed);mark('DEV reset',{seed:scene.seed,mode:'debug'});await collapseDebug(page);
      if(scene.survivor)await button('Wave 1');
      // Only target-sensitive bosses receive towers. Tower outside attack range preserves original boss HP.
      if(['FROST_JUDGE','RAIL_WARLORD'].includes(scene.encounter)){await dragTower('BASIC',380,600);if(scene.encounter==='FROST_JUDGE')await dragTower('BASIC',360,390);}
      await dragDebugCard(page,{label:scene.label,boss:true,x:1100,y:440});mark('GUI boss drag',{label:scene.label,screen:[1100,440]});await button(`Phase ${scene.phaseIndex+1}`);
      if(scene.encounter==='COLLECTOR'){await expandDebug(page);await page.getByLabel('Infinite Money',{exact:true}).uncheck();mark('GUI Infinite Money OFF');await collapseDebug(page);}
      await initObserver();await capture(dir,'setup');
      let finishedAt=null;
      for(let iteration=0;frame<(Number(options.maxFrames)||7200);iteration++){
        const before=await snap(),state=before.semantic.state,bosses=state.enemies.filter(e=>e.isBoss);
        if(!bosses.length){if(defeatMode){secondDefeat=await capture(dir,'actual-boss-death',before);await page.evaluate(()=>window.__GEOGUARD_ART_QA__.step({frames:180,dt:1/60}));frame+=180;await capture(dir,'actual-death-aftermath');}else errors.push('All bosses defeated through actual combat before requested coverage');break;}
        const nearest=bosses.reduce((a,b)=>Math.hypot(a.x-state.player.x,a.y-state.player.y)<Math.hypot(b.x-state.player.x,b.y-state.player.y)?a:b),distance=Math.hypot(nearest.x-state.player.x,nearest.y-state.player.y);
        const nextKeys=new Set();let dx=state.player.x-nearest.x,dy=state.player.y-nearest.y;
        if(distance<290||distance>440){if(distance>440){dx=-dx;dy=-dy;}if(Math.abs(dx)>Math.abs(dy)*.4)nextKeys.add(dx<0?'a':'d');if(Math.abs(dy)>Math.abs(dx)*.4)nextKeys.add(dy<0?'w':'s');}
        if(options.kite==='horizontal'){dx=nearest.x+(state.player.x<nearest.x?-310:310)-state.player.x;dy=nearest.y-state.player.y;nextKeys.clear();if(Math.abs(dx)>24)nextKeys.add(dx<0?'a':'d');if(Math.abs(dy)>40)nextKeys.add(dy<0?'w':'s');}
        if(scene.survivor&&options.strategy==='hero'){
          const victim=bosses.find(b=>b.twinRole!==scene.survivor),keep=bosses.find(b=>b.twinRole===scene.survivor);
          if(victim&&keep){const angle=Math.atan2(victim.y-keep.y,victim.x-keep.x);dx=victim.x+Math.cos(angle)*140-state.player.x;dy=victim.y+Math.sin(angle)*140-state.player.y;nextKeys.clear();if(Math.abs(dx)>14)nextKeys.add(dx<0?'a':'d');if(Math.abs(dy)>14)nextKeys.add(dy<0?'w':'s');}
        }
        if(defeatMode){dx=nearest.x-state.player.x;dy=nearest.y-state.player.y;nextKeys.clear();if(distance>120){if(Math.abs(dx)>20)nextKeys.add(dx<0?'a':'d');if(Math.abs(dy)>20)nextKeys.add(dy<0?'w':'s');}}
        await setKeys(nextKeys);
        if(scene.survivor){
          const victim=bosses.find(b=>b.twinRole!==scene.survivor),survivor=bosses.find(b=>b.twinRole===scene.survivor);
          if(options.strategy!=='hero'&&victim&&survivor&&frame-lastKillTower>150){
            const angle=Math.atan2(victim.y-survivor.y,victim.x-survivor.x),point=screenPoint(state,{x:victim.x+Math.cos(angle)*115,y:victim.y+Math.sin(angle)*115});
            if(point.x>80&&point.x<1360&&point.y>190&&point.y<680){await dragTower('BASIC',point.x,point.y);lastKillTower=frame;}
          }
          if(victim&&victim.hp<30&&frame%12===0)await capture(dir,`before-defeat-f${frame}`,before);
          if(!victim&&survivor?.bossState.partnerFallen&&!realDefeat){realDefeat=await capture(dir,'real-partner-defeat-and-enrage',before);mark('observed real partner defeat',{survivorRole:scene.survivor,uid:survivor.uid,hp:survivor.hp,phaseIndex:survivor.currentPhaseIndex,debugWaveFlow:state.debugWaveFlow});}
        }
        if(['BLOOD_FORGE','COMMANDER'].includes(scene.encounter)&&scene.phaseIndex>0&&frame-lastMinions>120&&state.enemies.filter(e=>!e.isBoss&&!e.mechanic&&Math.hypot(e.x-nearest.x,e.y-nearest.y)<160).length<3){const p=screenPoint(state,{x:nearest.x+45,y:nearest.y+45});if(p.x>120&&p.x<1320&&p.y>190&&p.y<viewHeight-210){await dragDebugCard(page,{label:'重装兵',x:p.x,y:p.y});mark('GUI nearby minion prerequisite drag',{screen:[p.x,p.y]});lastMinions=frame;}}
        if(options.decoys==='true'&&frame-lastDecoy>90&&state.enemies.filter(e=>!e.isBoss&&!e.mechanic&&Math.hypot(e.x-state.player.x,e.y-state.player.y)<100).length<4){const p=screenPoint(state,{x:state.player.x+25,y:state.player.y+25});await dragDebugCard(page,{label:'重装兵',x:p.x,y:p.y});mark('GUI player-adjacent TANK to preserve original forgeGuard lifetime',{screen:[p.x,p.y]});lastDecoy=frame;}
        const advanced=await advance();frame=advanced.frame;fs.appendFileSync(path.join(dir,'frames.ndjson'),advanced.rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
        if(advanced.blocked){errors.push('Original update blocked: '+advanced.blocked);break;}
        const s=advanced.snapshot;
        if(s.control.droppedEvents){errors.push('Event ledger overflow; subsequent evidence invalid');break;}
        if(s.art.fallbackArtIds.length||s.art.drawErrors.length||s.presentation.errors.length){errors.push('Art error/fallback');break;}
        let evidence=null;
        const significant=advanced.events.length||advanced.childChanges?.born.length||advanced.childChanges?.gone.length||advanced.hazardChanges;
        if(significant&&captureIndex<180)evidence=await capture(dir,`${String(++captureIndex).padStart(3,'0')}-f${frame}`,s);
        for(const event of advanced.events){
          let record=active.get(event.uid);
          if(event.mode==='windup'&&event.previousMode!=='windup'){
            record={sequence:casts.length+1,uid:event.uid,role:event.role,phaseIndex:event.phaseIndex,ability:event.ability,windup:evidence,execute:null,recover:null,exit:null,runtimeStatus:'partial',effectStatus:'requires_review',visualStatus:'not_reviewed'};casts.push(record);active.set(event.uid,record);
            if(!paused.has(event.ability)){record.pause=await pauseCheck(dir,`pause-${event.ability}`);paused.add(event.ability);}
          }
          if(!record||record.ability!==event.ability)continue;
          if(event.execute){record.execute=evidence;record.directToRecover=event.mode==='recover';}
          if(event.mode==='recover'&&record.execute&&!record.recover){record.recover=evidence;record.runtimeStatus='actual_dispatch_and_recover_observed';completed.add(`C04-${scene.encounter}-${event.role}-P${event.phaseIndex+1}-${event.ability}`);}
          if(event.mode==='idle'&&record.recover&&!record.exit)record.exit=evidence;
          if(event.mode==='removed')record.removal=evidence;
        }
        const soloCaptured=scene.survivor&&options.anyPhase==='true'&&casts.some(c=>c.ability===(scene.survivor==='sun'?'soloSolarVolley':'soloLunarOrbit')&&c.recover);
        if((scene.cases.every(k=>completed.has(k))||soloCaptured)&&frame>=(Number(options.minFrames)||0)){finishedAt??=frame;if(frame-finishedAt>=90){if(options.defeat==='true'){if(!defeatMode){defeatMode=true;mark('GUI movement to engage original boss after capture');await capture(dir,'before-actual-kill');}}else break;}}
      }
      await setKeys(new Set());await capture(dir,'before-cleanup');if(scene.survivor)await button('Sandbox');await button('Clear Enemies');mark('GUI Clear Enemies cleanup');await page.evaluate(()=>window.__GEOGUARD_ART_QA__.step({frames:30,dt:1/60}));frame+=30;const clean=await snap();assert.equal(clean.semantic.state.enemies.length,0);assert.equal(clean.semantic.state.hazards.length,0);await capture(dir,'gui-cleanup',clean);
      await page.evaluate(seed=>window.__GEOGUARD_ART_QA__.reset({seed,mode:'debug'}),scene.seed);mark('DEV reset cleanup',{seed:scene.seed});const reset=await snap();assert.equal(reset.semantic.state.enemies.length,0);assert.equal(reset.semantic.state.hazards.length,0);await capture(dir,'reset-cleanup',reset);
    }catch(error){errors.push(String(error.stack??error));await capture(dir,'failure').catch(()=>{});}
    const result={sceneId:scene.sceneId,seed:scene.seed,dt:1/60,frames:frame,expected:scene.cases,completed:[...completed],missing:scene.cases.filter(k=>!completed.has(k)),casts,realDefeat,secondDefeat,errors,inputTrace:trace,status:errors.length?'needs_review':scene.cases.every(k=>completed.has(k))?'lifecycle_captured_effect_review_pending':'coverage_incomplete',visualApproval:false};
    writeJSON(path.join(dir,'report.json'),result);results.push(result);writeJSON(path.join(out,'progress.json'),{results,uniqueAbilities:[...new Set(results.flatMap(r=>r.casts.filter(c=>c.recover).map(c=>c.ability)))]});console.log(JSON.stringify({scene:scene.sceneId,completed:completed.size,expected:scene.cases.length,errors}));
  }
}finally{
  await session.close();const post=verifyFinalLock(lockPath,lockSha);writeJSON(path.join(out,'report.json'),{sourceFingerprint:post.sourceFingerprint,lockSha,postSourceUnchanged:true,results,browserErrors:session.errors,requests:session.requests,visualApproval:false});
}
