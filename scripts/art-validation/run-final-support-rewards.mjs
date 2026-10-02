import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {argsMap,writeJSON} from './common.mjs';import {verifyFinalLock} from './final-lock.mjs';import {createFinalSession,dismissIntro,expandDebug,collapseDebug,dragDebugCard} from './final-session.mjs';
const args=argsMap(),lock=verifyFinalLock(path.resolve(args.lock),args['lock-sha']),out=path.resolve(args.out);if(fs.existsSync(out))throw Error('Fresh evidence required');fs.mkdirSync(out,{recursive:true});
const session=await createFinalSession({sourceRoot:lock.sourceRoot,out:path.join(out,'browser'),browserPath:args.browser}),{page}=session,records=[];
const snap=()=>page.evaluate(()=>window.__GEOGUARD_ART_QA__.snapshot()),save=async(name,s)=>{writeJSON(path.join(out,name+'.json'),s);await page.screenshot({path:path.join(out,name+'.png')});};
try{
 await page.goto(session.url+'?artqa=1');await page.getByRole('button',{name:'开发测试入口',exact:true}).click();await dismissIntro(page);await page.waitForFunction(()=>window.__GEOGUARD_ART_QA__&&window.__GEOGUARD_ART_INSPECT__().art.status==='ready');
 for(const type of ['support_money','support_repair']){
  await page.evaluate(()=>window.__GEOGUARD_ART_QA__.reset({seed:1729,mode:'debug'}));await expandDebug(page);
  if(type==='support_money'){await page.getByLabel('Infinite Money',{exact:true}).uncheck();await collapseDebug(page);for(const x of [550,890]){const b=await page.locator('[data-tower-card="SNIPER"]').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(x,450,{steps:4});await page.mouse.up();}}
  else{await page.getByLabel('Infinite HP',{exact:true}).uncheck();await dragDebugCard(page,{label:'重装兵',x:745,y:450});for(let i=0;i<30;i++){await page.evaluate(()=>window.__GEOGUARD_ART_QA__.step({frames:6,dt:1/60}));if((await snap()).semantic.state.player.hp<=80)break;}}
  await expandDebug(page);await page.getByRole('button',{name:'Open Reward',exact:true}).click();const before=await snap(),index=before.semantic.rewardState.choices.findIndex(c=>c.type===type);assert.ok(index>=0);const choice=before.semantic.rewardState.choices[index];await save(type+'-before',before);await page.locator('[data-reward-choices] > button').nth(index).click();const after=await snap();assert.equal(after.semantic.rewardState.active,false);
  if(type==='support_money')assert.equal(after.semantic.state.money,before.semantic.state.money+choice.amount);else assert.equal(after.semantic.state.player.hp,Math.min(before.semantic.state.player.maxHp,before.semantic.state.player.hp+choice.amount));
  await save(type+'-after',after);records.push({type,index,choice,before:{money:before.semantic.state.money,hp:before.semantic.state.player.hp},after:{money:after.semantic.state.money,hp:after.semantic.state.player.hp},pass:true});
 }
}catch(error){records.push({pass:false,error:String(error.stack??error)});await save('failure',await snap()).catch(()=>{});}
finally{await session.close();verifyFinalLock(path.resolve(args.lock),args['lock-sha']);writeJSON(path.join(out,'report.json'),{scope:'Actual developer UI options, actual enemy damage and actual Open Reward buttons; original rule/effects, no runtime HP or money setters',records,errors:session.errors,pass:records.length===2&&records.every(r=>r.pass)&&!session.errors.length});}
