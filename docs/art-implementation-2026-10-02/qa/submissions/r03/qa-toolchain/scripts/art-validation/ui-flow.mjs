// Operates the actual source UI through real browser input. No state injection.
import fs from 'node:fs';
import path from 'node:path';
import { writeJSON } from './common.mjs';

export async function runUIFlow({page,base,out,capture}){
  const records=[];
  const telemetry=async label=>{
    await page.getByRole('button',{name:'试玩数据',exact:true}).click();
    const report=JSON.parse(await page.getByLabel('试玩 JSON 数据').inputValue());
    writeJSON(path.join(out,label+'.telemetry.json'),report);
    await page.getByRole('button',{name:'返回游戏',exact:true}).click();
    return {money:report.current.money,battleSeconds:report.current.battleSeconds,latest:report.samples.at(-1),events:report.events,mode:report.mode};
  };
  const drag=async(card,x,y,midCapture)=>{
    const box=await card.boundingBox();if(!box)throw new Error('Build card not visible');
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
    await page.mouse.move(x,y,{steps:12});if(midCapture)await capture(midCapture);await page.mouse.up();
  };
  for(const [width,height]of [[960,720],[1280,720],[1440,900]]){
    const tag=`ui-${width}x${height}`;
    await page.setViewportSize({width,height});await page.goto(base+'/');
    await page.getByRole('button',{name:'开始游戏',exact:true}).waitFor();await capture(tag+'-start');
    await page.getByRole('button',{name:'开始游戏',exact:true}).click();
    const basic=page.locator('div[title]').filter({hasText:'速射塔'}).first();
    await basic.waitFor();await basic.hover();await capture(tag+'-hover');
    const initial=await telemetry(tag+'-initial');
    const box=await basic.boundingBox();
    await drag(basic,box.x+box.width/2,box.y+box.height/2,tag+'-cancel-drag');
    const canceled=await telemetry(tag+'-cancel');
    await drag(basic,width/2+100,height/2,tag+'-valid-ghost');
    const built=await telemetry(tag+'-built');await capture(tag+'-built');
    await drag(basic,width/2+100,height/2,tag+'-overlap-ghost');
    const rejected=await telemetry(tag+'-overlap');
    const sniper=page.locator('div[title]').filter({hasText:'穿透塔'}).first();
    await drag(sniper,width/2-110,height/2,tag+'-insufficient-ghost');
    const insufficient=await telemetry(tag+'-insufficient');
    await page.getByRole('button',{name:'暂停',exact:true}).click();
    await page.getByRole('heading',{name:'游戏已暂停',exact:true}).waitFor();await capture(tag+'-pause');
    const pausedA=await telemetry(tag+'-paused-a');await page.waitForTimeout(300);
    const pausedB=await telemetry(tag+'-paused-b');
    await page.getByRole('button',{name:'继续游戏',exact:true}).click();
    await page.keyboard.down('w');await page.waitForTimeout(180);await page.keyboard.up('w');
    const resumed=await telemetry(tag+'-resumed');
    const checks={startsNormal:initial.mode==='normal'&&initial.money===45,cancelNoCost:canceled.money===initial.money&&canceled.latest.towers.total===0,buildOnce:built.money===30&&built.latest.towers.total===1,overlapNoCost:rejected.money===built.money&&rejected.latest.towers.total===1,insufficientNoCost:insufficient.money===rejected.money&&insufficient.latest.towers.total===1,pauseFreezesGameTime:pausedA.battleSeconds===pausedB.battleSeconds,resumeMoves:resumed.latest.player.y!==pausedB.latest.player.y};
    records.push({tag,checks,visualStatus:'captured_unreviewed',scope:'real normal source UI, real mouse/keyboard, state observed via existing export UI'});
  }
  // A separate genuine sandbox UI flow establishes all nine cards and reward interaction.
  await page.goto(base+'/');await page.getByRole('button',{name:'开发测试入口',exact:true}).click();
  await page.getByRole('button',{name:'Collapse',exact:true}).click();
  const cards=page.locator('div[title]').filter({hasText:/Lv\./});
  const count=await cards.count();await capture('ui-debug-nine-towers');
  await page.getByRole('button',{name:'Expand',exact:true}).click();
  await page.getByRole('button',{name:'Open Reward',exact:true}).click();
  const heading=page.getByRole('heading',{name:'Boss 已击破',exact:true});await heading.waitFor();
  const dialog=heading.locator('xpath=../..');const choices=dialog.locator('button');
  const choiceCount=await choices.count(),choiceText=await choices.first().innerText();await capture('ui-debug-reward');
  await choices.first().click();await heading.waitFor({state:'hidden'});
  const rewardTelemetry=await telemetry('ui-debug-reward-after');
  records.push({tag:'ui-debug',checks:{nineCards:count===9,rewardCanSelect:choiceCount>0&&rewardTelemetry.events.some(e=>e.type.includes('reward'))},count,choiceCount,choiceText,visualStatus:'captured_unreviewed',scope:'real sandbox reward; does not prove normal boss-defeat reward chain'});
  writeJSON(path.join(out,'ui-flow.json'),{records,notRun:['normal boss-defeat reward chain','reward choices at positions 2/3','reward counts 1/2','death/end/restart','real candidate art and all later UI semantics']});
  return records;
}
