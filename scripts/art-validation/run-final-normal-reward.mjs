import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {argsMap,writeJSON} from './common.mjs';import {verifyFinalLock} from './final-lock.mjs';import {createFinalSession,dismissIntro} from './final-session.mjs';
const args=argsMap(),lock=verifyFinalLock(path.resolve(args.lock),args['lock-sha']),out=path.resolve(args.out);if(fs.existsSync(out))throw Error('Fresh evidence required');fs.mkdirSync(out,{recursive:true});
const session=await createFinalSession({sourceRoot:lock.sourceRoot,out:path.join(out,'browser'),browserPath:args.browser}),{page}=session,records=[];
const snap=()=>page.evaluate(()=>window.__GEOGUARD_ART_QA__.snapshot()),step=frames=>page.evaluate(frames=>window.__GEOGUARD_ART_QA__.step({frames,dt:1/60}),frames);
const save=async(name,s)=>{writeJSON(path.join(out,name+'.json'),s??await snap());await page.screenshot({path:path.join(out,name+'.png')});};
async function build(x,y){const b=await page.locator('[data-tower-card="BASIC"]').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(720+x*1.25,450+y*1.25,{steps:3});await page.mouse.up();}
try{
 await page.goto(session.url+'?artqa=1');await page.getByRole('button',{name:'开始游戏',exact:true}).click();await dismissIntro(page);await page.waitForFunction(()=>window.__GEOGUARD_ART_QA__&&window.__GEOGUARD_ART_INSPECT__().art.status==='ready');
 for(let pick=0;pick<3;pick++){
  await page.evaluate(()=>window.__GEOGUARD_ART_QA__.reset({seed:1729,mode:'normal'}));const trace=[];let s=await snap(),bossSeen=false;
  for(let sec=0;sec<960;sec++){
   if(s.semantic.rewardState.active||s.semantic.gameState!=='PLAYING')break;
   const st=s.semantic.state;for(let i=0;i<6&&!bossSeen&&s.semantic.state.money>=15;i++){const a=i*Math.PI/3,x=Math.round(75*Math.cos(a)),y=Math.round(75*Math.sin(a));if(s.semantic.state.towers.some(t=>Math.hypot(t.x-x,t.y-y)<30))continue;await build(x,y);s=await snap();}
   const target=s.semantic.state.enemies.find(e=>e.isBoss);if(target){const p=s.semantic.state.player,dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1,radial=Math.max(-1,Math.min(1,(d-145)/60)),tangent=d<220?1:0;const mx=dx/d*radial-dy/d*tangent,my=dy/d*radial+dx/d*tangent;for(const [key,on] of [['d',mx>.25],['a',mx<-.25],['s',my>.25],['w',my<-.25]])await page.keyboard[on?'down':'up'](key);}
   await step(15);s=await snap();const bosses=s.semantic.state.enemies.filter(e=>e.isBoss);trace.push({time:s.semantic.state.gameTime,hp:s.semantic.state.player.hp,money:s.semantic.state.money,towers:s.semantic.state.towers.length,enemies:s.semantic.state.enemies.length,bosses:bosses.map(e=>({id:e.id,uid:e.uid,hp:e.hp,phase:e.bossState?.phaseIndex})),reward:s.semantic.rewardState.active});
   if(bosses.length&&!bossSeen){bossSeen=true;await save('position-'+pick+'-boss-live',s);}
  }
  for(const key of ['w','a','s','d'])await page.keyboard.up(key);
  writeJSON(path.join(out,'position-'+pick+'-trace.json'),trace);await save('position-'+pick+'-before',s);assert.ok(bossSeen,'Must observe original normal wave boss alive');assert.ok(s.semantic.rewardState.active,'Original normal boss death must open reward');assert.equal(s.semantic.state.mode,'normal');assert.equal(s.semantic.state.debugOptions.infiniteHealth,false);assert.equal(s.semantic.state.debugOptions.infiniteMoney,false);
  const choices=s.semantic.rewardState.choices,choice=choices[pick];assert.ok(choice);const blocked=await step(120);assert.equal(blocked.advancedFrames,0);await page.locator('[data-reward-choices] > button').nth(pick).click();const after=await snap();assert.equal(after.semantic.rewardState.active,false);assert.equal(after.semantic.state.wave.number,2);
  if(choice.type==='unlock')assert.equal(after.semantic.state.towerCatalog.find(t=>t.id===choice.towerId).available,true);
  if(choice.type==='upgrade')assert.equal(after.semantic.state.towerCatalog.find(t=>t.id===choice.towerId).level,s.semantic.state.towerCatalog.find(t=>t.id===choice.towerId).level+1);
  if(choice.type==='support_money')assert.equal(after.semantic.state.money,s.semantic.state.money+choice.amount);
  await save('position-'+pick+'-after',after);records.push({pick,choice,normalBossSeen:true,nextWave:after.semantic.state.wave.number,pass:true});console.log(JSON.stringify(records.at(-1)));
 }
}catch(error){records.push({pass:false,error:String(error.stack??error)});await save('failure').catch(()=>{});}
finally{await session.close();verifyFinalLock(path.resolve(args.lock),args['lock-sha']);writeJSON(path.join(out,'report.json'),{scope:'Real normal wave, paid GUI builds from earned currency, actual engine clock and boss death/reward/choice/next wave; no debug options, fabricated HP or fake kills',records,errors:session.errors,pass:records.length===3&&records.every(r=>r.pass)&&!session.errors.length});}
