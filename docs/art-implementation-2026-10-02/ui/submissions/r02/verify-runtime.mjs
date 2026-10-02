import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const out=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const { chromium }=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,ignoreDefaultArgs:['--hide-scrollbars'],executablePath:'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const base='http://127.0.0.1:5174';
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
const audit={kind:'actual-local-game-and-actual-React-component-fixtures',game:[],fixtures:[],fontAudit:[],errors};
async function fontAudit(selector,label){
 const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
 const {root}=await cdp.send('DOM.getDocument');const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});
 const fonts=nodeId?await cdp.send('CSS.getPlatformFontsForNode',{nodeId}):{};
 audit.fontAudit.push({label,selector,declared:await page.locator(selector).first().evaluate(el=>getComputedStyle(el).fontFamily),...fonts});await cdp.detach();
}
const money=()=>page.locator('[data-player-hud]').locator('div.pointer-events-auto').locator('span').first().textContent();
try{
 await page.goto(base);await page.getByRole('button',{name:'开始游戏',exact:true}).waitFor();
 await page.screenshot({path:path.join(out,'game-start-1440x900.png')});
 await fontAudit('#game-overlay-title','game-start-Chinese');
 await page.getByRole('button',{name:'开始游戏',exact:true}).click();
 await page.getByRole('button',{name:'我知道了',exact:true}).click();
 await page.waitForTimeout(350);
 const before=await money();
 const basic=await page.locator('[data-tower-card=BASIC]').boundingBox();
 await page.mouse.move(basic.x+45,basic.y+40);await page.mouse.down();await page.mouse.move(480,360,{steps:8});await page.mouse.up();await page.waitForTimeout(120);
 const after=await money();
 audit.game.push({check:'normal-game-valid-build',moneyBefore:before,moneyAfter:after});
 const second=await page.locator('[data-tower-card=BASIC]').boundingBox();
 await page.mouse.move(second.x+45,second.y+40);await page.mouse.down();await page.mouse.move(510,370,{steps:5});await page.mouse.move(second.x+45,second.y+40,{steps:5});await page.mouse.up();await page.waitForTimeout(120);
 audit.game.push({check:'normal-game-return-to-bar-cancel',moneyAfter:await money()});
 const sniper=await page.locator('[data-tower-card=SNIPER]').boundingBox();
 await page.mouse.move(sniper.x+40,sniper.y+40);await page.mouse.down();await page.mouse.move(600,300,{steps:5});
 await page.screenshot({path:path.join(out,'game-insufficient-drag-1440x900.png')});
 await page.mouse.up();await page.waitForTimeout(100);
 audit.game.push({check:'normal-game-insufficient-release',moneyAfter:await money(),dragHintCleared:await page.getByText('拖到场地里建造',{exact:true}).count()===0});
 await page.mouse.move(second.x+40,second.y+40);await page.mouse.down();await page.mouse.move(480,360,{steps:5});await page.mouse.up();await page.waitForTimeout(100);
 audit.game.push({check:'normal-game-existing-tower-overlap-rejected',moneyAfter:await money()});
 await page.locator('[data-tower-card=BASIC]').click({button:'right'});
 audit.game.push({check:'normal-game-no-debug-context-entry',contextButtons:await page.getByRole('button',{name:'升级',exact:true}).count()});
 await page.getByRole('button',{name:'试玩数据',exact:true}).click();
 const report=JSON.parse(await page.getByRole('textbox',{name:'试玩 JSON 数据'}).inputValue());
 fs.writeFileSync(path.join(out,'game-input-telemetry.json'),JSON.stringify(report,null,2)+'\n','utf8');
 await page.getByRole('button',{name:'返回游戏',exact:true}).click();
 await page.getByRole('button',{name:'关闭声音',exact:true}).click();
 await page.getByRole('slider',{name:'音量',exact:true}).fill('0.35');
 audit.game.push({check:'audio-persisted',settings:await page.evaluate(()=>JSON.parse(localStorage.getItem('geoguard-audio-settings')))});
 for(const [width,height] of [[1440,900],[1280,720],[960,720]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);await page.screenshot({path:path.join(out,`game-playing-${width}x${height}.png`)});
  audit.game.push({check:'runtime-desktop-snapshot',viewport:{width,height},geometry:await page.evaluate(()=>{const r=document.querySelector('[data-build-scroll]').getBoundingClientRect();return{bar:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},cardWidths:[...document.querySelectorAll('[data-tower-card]')].map(el=>el.getBoundingClientRect().width),missingArt:[...document.querySelectorAll('[data-art-missing]')].map(el=>el.dataset.artMissing)}})});
 }
 await fontAudit('[data-tower-card=BASIC] > span','game-tower-Chinese');
 await page.getByRole('button',{name:'暂停',exact:true}).click();
 await page.getByRole('dialog',{name:'游戏已暂停',exact:true}).waitFor();
 await page.screenshot({path:path.join(out,'game-pause-960x720.png')});
 await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'游戏已暂停',exact:true}).waitFor({state:'hidden'});
 audit.game.push({check:'pause-Escape-resume',passed:true});
 const interruptCard=await page.locator('[data-tower-card=BASIC]').boundingBox();
 await page.mouse.move(interruptCard.x+40,interruptCard.y+40);await page.mouse.down();await page.mouse.move(280,280,{steps:4});await page.keyboard.press('Escape');
 await page.getByRole('dialog',{name:'游戏已暂停',exact:true}).waitFor();
 await page.getByText('拖到场地里建造',{exact:true}).waitFor({state:'hidden'});await page.mouse.up();
 await page.getByRole('button',{name:'继续游戏',exact:true}).click();
 audit.game.push({check:'pause-interrupt-clears-drag',moneyAfter:await money(),hintCleared:await page.getByText('拖到场地里建造',{exact:true}).count()===0});
 await page.goto(base);await page.getByRole('button',{name:'开发测试入口',exact:true}).click();
 await page.getByRole('button',{name:'Unlock All Towers',exact:true}).click();
 await page.getByRole('button',{name:'Collapse',exact:true}).click();
 await page.locator('[data-tower-card=BASIC]').click({button:'right'});
 await page.getByRole('button',{name:'升级',exact:true}).click();
 audit.game.push({check:'debug-context-compatibility',basicLabel:await page.locator('[data-tower-card=BASIC]').getAttribute('aria-label'),cardCount:await page.locator('[data-tower-card]').count()});
 await page.getByRole('button',{name:'我知道了',exact:true}).click();
 await page.screenshot({path:path.join(out,'game-debug-nine-towers-960x720.png')});
}catch(error){audit.gameError=String(error);}
try{
 await page.goto(base+'/docs/art-implementation-2026-10-02/ui/submissions/r02/component-harness.html');
 await page.waitForFunction(()=>typeof window.setUiFixture==='function');
 await page.getByRole('button',{name:'我知道了',exact:true}).click();
 for(const [width,height] of [[1440,900],[1280,720],[960,720]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>window.setUiFixture('twins'));await page.waitForTimeout(80);
  await page.locator('[data-build-scroll]').evaluate(el=>{el.scrollLeft=0;});await page.waitForTimeout(40);
  await page.locator('[data-tower-card=SNIPER]').hover();
  await page.screenshot({path:path.join(out,`component-twins-${width}x${height}.png`)});
  const metric=await page.evaluate(()=>{
   const b=document.querySelector('[data-build-scroll]'),r=b.getBoundingClientRect(),boss=document.querySelector('[data-boss-hud]').getBoundingClientRect();
   return {bar:{width:r.width,top:r.top,bottom:r.bottom},fullCards:[...b.children].filter(el=>{const c=el.getBoundingClientRect();return c.left>=r.left&&c.right<=r.right}).length,cardWidths:[...b.children].map(el=>el.getBoundingClientRect().width),boss:{width:boss.width,bottom:boss.bottom,height:boss.height},members:[...document.querySelectorAll('[data-boss-member]')].map(el=>({text:el.textContent,hp:el.querySelector('[role=progressbar]').getAttribute('aria-valuenow')})),tooltip:document.querySelector('[role=tooltip]')?.textContent,missingArt:[...document.querySelectorAll('[data-art-missing]')].map(el=>el.dataset.artMissing)};
  });
  const nativeBar=await page.locator('[data-build-scroll]').boundingBox();
  await page.mouse.move(nativeBar.x+30,nativeBar.y+nativeBar.height-8);await page.mouse.down();await page.mouse.move(nativeBar.x+nativeBar.width-30,nativeBar.y+nativeBar.height-8,{steps:8});await page.mouse.up();await page.waitForTimeout(50);
  metric.end=await page.evaluate(()=>{const b=document.querySelector('[data-build-scroll]'),r=b.getBoundingClientRect(),c=b.querySelector('[data-tower-card=SENTINEL]').getBoundingClientRect();return{scrollLeft:b.scrollLeft,maxScroll:b.scrollWidth-b.clientWidth,sentinelFull:c.left>=r.left&&c.right<=r.right,hoverHidden:!document.querySelector('[role=tooltip]')};});
  audit.fixtures.push({mode:'twins',viewport:{width,height},...metric});
  if(width===960)await page.screenshot({path:path.join(out,'component-scroll-end-960x720.png')});
 }
 await page.locator('[data-build-scroll]').evaluate(el=>{el.scrollLeft=0;});
 await page.locator('[data-tower-card=BASIC]').dispatchEvent('mousedown',{button:0,clientX:80,clientY:600});
 audit.fixtures.push({check:'low-money-still-starts-drag',passed:await page.evaluate(()=>window.uiFixtureAudit.events.some(e=>e.type==='begin-drag'&&e.id==='BASIC'))});
 await page.mouse.up();
 for(const mode of ['single','survivor','status','pause','start','end','reward-one','reward-two','reward-three']){
  await page.evaluate(mode=>window.setUiFixture(mode),mode);await page.waitForTimeout(70);
  await page.screenshot({path:path.join(out,`component-${mode}-960x720.png`)});
  const record={mode,geometry:await page.evaluate(()=>{const dialog=document.querySelector('[role=dialog]'),boss=document.querySelector('[data-boss-hud]'),status=document.querySelector('[role=status]');const rect=el=>{const r=el?.getBoundingClientRect();return r?{top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null};return{dialog:rect(dialog),boss:rect(boss),status:rect(status),rewardCount:document.querySelector('[data-reward-choices]')?.dataset.rewardChoices,members:[...document.querySelectorAll('[data-boss-member]')].map(el=>el.textContent),cardBackgrounds:[...document.querySelectorAll('[data-reward-choices] button')].map(el=>getComputedStyle(el).backgroundColor)};})};
  if(mode.startsWith('reward-')){
   record.callbacksBefore=await page.evaluate(()=>window.uiFixtureAudit.events.filter(e=>e.type==='reward').length);
   if(mode==='reward-three'){
    const first=await page.locator('[data-reward-choices] button').first().textContent();
    await page.locator('[data-reward-choices] button').first().focus();await page.keyboard.press('Shift+Tab');
    record.focusWrapLast=await page.evaluate(()=>document.activeElement.textContent.includes('应用升级'));
    await page.keyboard.press('Tab');record.focusWrapFirst=await page.locator('[data-reward-choices] button').first().evaluate(el=>el===document.activeElement);
   }
   await page.locator('[data-reward-choices] button').first().click();
   record.selected=await page.evaluate(()=>window.uiFixtureAudit.events.filter(e=>e.type==='reward').at(-1)?.id);
   record.callbacksAfter=await page.evaluate(()=>window.uiFixtureAudit.events.filter(e=>e.type==='reward').length);
  }
  audit.fixtures.push(record);
 }
 await page.evaluate(()=>window.setUiFixture('twins'));await page.waitForTimeout(50);
 await fontAudit('[data-boss-member] > span','fixture-boss-Chinese');
 audit.fixtureEvents=await page.evaluate(()=>window.uiFixtureAudit.events);
}catch(error){audit.fixtureError=String(error);}
await browser.close();
const getGame=check=>audit.game.find(g=>g.check===check);
const twins=audit.fixtures.filter(f=>f.mode==='twins');
const rewardRecords=audit.fixtures.filter(f=>f.mode?.startsWith('reward-'));
const status=audit.fixtures.find(f=>f.mode==='status')?.geometry;
audit.checks={
 noPageErrors:!errors.length&&!audit.gameError&&!audit.fixtureError,
 validBuildDeductsExactly15:getGame('normal-game-valid-build')?.moneyBefore==='45'&&getGame('normal-game-valid-build')?.moneyAfter==='30',
 cancelNoCharge:getGame('normal-game-return-to-bar-cancel')?.moneyAfter==='30',
 insufficientReleaseNoCharge:getGame('normal-game-insufficient-release')?.moneyAfter==='30'&&getGame('normal-game-insufficient-release')?.dragHintCleared,
 entityOverlapNoCharge:getGame('normal-game-existing-tower-overlap-rejected')?.moneyAfter==='30',
 contextDebugOnly:getGame('normal-game-no-debug-context-entry')?.contextButtons===0&&getGame('debug-context-compatibility')?.cardCount===9&&getGame('debug-context-compatibility')?.basicLabel.includes('等级2/4'),
 audioSaved:getGame('audio-persisted')?.settings.enabled===false&&getGame('audio-persisted')?.settings.volume===0.35,
 pauseInterrupt:getGame('pause-interrupt-clears-drag')?.moneyAfter==='30'&&getGame('pause-interrupt-clears-drag')?.hintCleared,
 actualSansFontHit:audit.fontAudit.length===3&&audit.fontAudit.every(f=>f.fonts.some(font=>font.familyName==='Noto Sans SC'&&font.glyphCount>0)),
 nineCardSizes:twins.length===3&&twins.every(f=>f.cardWidths.length===9&&f.cardWidths.every(w=>w===140)),
 firstPageDensity:twins.map(f=>f.fullCards).join(',')==='6,6,5',
 mouseNativeScrollToLast:twins.every(f=>f.end.sentinelFull&&f.end.scrollLeft===f.end.maxScroll&&f.end.hoverHidden),
 fullTwinFields:twins.every(f=>f.members.length===2&&f.members[0].text.includes('灼线 · P2/3')&&f.members[1].text.includes('锁域 · P2/3')&&f.members[1].text.includes('攻击 · 避开危险区')),
 bossBottomTarget:twins.every(f=>f.boss.bottom<=180),
 statusAvoidsBoss:status?.status.top>=status?.boss.bottom+8,
 realRewardsOneTwoThree:rewardRecords.map(r=>r.geometry.rewardCount).join(',')==='1,2,3',
 rewardFullScreenReachability:rewardRecords.every(r=>r.geometry.dialog.top>=0&&r.geometry.dialog.bottom<=720),
 oneCallbackPerReward:rewardRecords.every(r=>r.callbacksAfter-r.callbacksBefore===1),
 rewardFocusTrap:rewardRecords.find(r=>r.mode==='reward-three')?.focusWrapLast&&rewardRecords.find(r=>r.mode==='reward-three')?.focusWrapFirst,
};
fs.writeFileSync(path.join(out,'runtime-verification.json'),JSON.stringify(audit,null,2)+'\n','utf8');
console.log(JSON.stringify({checks:audit.checks,gameError:audit.gameError,fixtureError:audit.fixtureError,errors:errors.slice(0,5),fontAudit:audit.fontAudit},null,2));
if(Object.values(audit.checks).some(value=>!value))process.exitCode=1;
