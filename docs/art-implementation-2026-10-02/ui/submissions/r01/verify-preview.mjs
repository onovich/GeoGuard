import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(out,'../../../../..');
const require=createRequire(import.meta.url);
const { chromium }=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const luminance=color=>{
 const channels=color.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
};
const ink=luminance('#4B281C');
const contrasts=['#FFF9EF','#B6D4AE','#F4ADA0','#F8DDAA','#A8D8BC','#C7E4F4'].map(background=>({foreground:'#4B281C',background,ratio:(luminance(background)+.05)/(ink+.05)}));
const browser=await chromium.launch({headless:true,ignoreDefaultArgs:['--hide-scrollbars'],executablePath:'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});
const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const sizes=[[1440,900],[1280,720],[960,720]], layout=[];
for(const [width,height] of sizes){
 await page.setViewportSize({width,height});
 await page.goto(pathToFileURL(path.join(out,'preview.html')).href);
 await page.waitForLoadState('load');
 await page.locator('.tower[data-id=SNIPER]').hover();
 await page.screenshot({path:path.join(out,`preview-twins-${width}x${height}.png`)});
 const metrics=await page.evaluate(()=>{
   const bar=document.querySelector('.build'),boss=document.querySelector('.boss'),viewport=bar.getBoundingClientRect();
   const get=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
   return {bar:get(bar),clientWidth:bar.clientWidth,scrollWidth:bar.scrollWidth,boss:get(boss),cards:[...document.querySelectorAll('.tower')].map(el=>({id:el.dataset.id,...get(el)})),visibleFull:[...document.querySelectorAll('.tower')].filter(el=>{const r=el.getBoundingClientRect();return r.left>=viewport.left+2&&r.right<=viewport.right-2}).length,tooltip:get(document.getElementById('tip')),bodyOverflow:document.documentElement.scrollWidth>innerWidth};
 });
 await page.evaluate(()=>{const bar=document.getElementById('build');bar.scrollLeft=bar.scrollWidth;});
 const end=await page.evaluate(()=>{const b=document.getElementById('build'),c=document.querySelector('.tower[data-id=SENTINEL]'),br=b.getBoundingClientRect(),cr=c.getBoundingClientRect();return{scrollLeft:b.scrollLeft,maxScroll:b.scrollWidth-b.clientWidth,sentinelFull:cr.left>=br.left&&cr.right<=br.right};});
 layout.push({viewport:{width,height},...metrics,end});
 if(width===960)await page.screenshot({path:path.join(out,'preview-scroll-end-960x720.png')});
}
const rewards=[];
await page.setViewportSize({width:960,height:720});
for(const id of ['one','two','three']){
 await page.evaluate(id=>window.setMode('reward-'+id),id);
 const item=await page.evaluate(id=>{
  const r=document.getElementById('reward-'+id),cards=[...r.querySelectorAll('.rewardcard')],rect=r.getBoundingClientRect();
  return {id,choices:cards.length,modal:{width:rect.width,height:rect.height,top:rect.top,bottom:rect.bottom},cards:cards.map(c=>{const b=c.getBoundingClientRect();return{width:b.width,height:b.height,scrollHeight:c.scrollHeight,clientHeight:c.clientHeight,title:c.querySelector('h3').textContent,fullDetail:c.querySelector('.detail').textContent}})};
 },id);
 await page.screenshot({path:path.join(out,`preview-reward-${id}-960x720.png`)});
 await page.locator(`#reward-${id} .rewardcard`).first().click();
 item.previewSelectionRecorded=await page.evaluate(()=>Boolean(window.previewChoice));
 rewards.push(item);
}
await page.evaluate(()=>window.setMode('pause'));
await page.screenshot({path:path.join(out,'preview-pause-960x720.png')});
await browser.close();
const source=JSON.parse(fs.readFileSync(path.join(out,'source-evidence.json'),'utf8'));
const sourceCheck=source.sources.map(s=>({path:s.path,unchanged:hash(path.join(root,s.path))===s.sha256}));
const result={scope:'standalone-docs-preview-only-not-game-runtime',date:'2026-10-02 Asia/Shanghai',checks:{noPageErrors:errors.length===0,all48Mapped:JSON.parse(fs.readFileSync(path.join(out,'coverage.json'),'utf8')).requirements.length===48,allSourcesUnchanged:sourceCheck.every(s=>s.unchanged),width140All:layout.every(l=>l.cards.every(c=>c.width===140)),bossFieldsInBounds:layout.every(l=>l.boss.x>=0&&l.boss.right<=l.viewport.width&&l.boss.bottom-42<=180),noPageHorizontalOverflow:layout.every(l=>!l.bodyOverflow),nativeScrollReachesSentinel:layout.every(l=>l.end.sentinelFull&&Math.abs(l.end.scrollLeft-l.end.maxScroll)<2),realRewardCounts:rewards.map(r=>r.choices).join(',')==='1,2,3',reward960InView:rewards.every(r=>r.modal.top>=42&&r.modal.bottom<=720),allSolidContrastAA:contrasts.every(c=>c.ratio>=4.5)},errors,layout,rewards,contrasts,sourceCheck,limitations:['No source/public/package changes, no game launch, no actual place/reject/cancel gameplay validation.','Preview sheet crops are reference samples with possible root-line pixels, not production icons or animation.','Source-derived reward examples are pure rule inputs, not simulated gameplay history.','Actor/world/background integration, actual text over world contrast, performance and keyboard/game input regression remain pending.','Pause is review-only rendering until integration-owned GameScreen extraction is approved.','All geometry y coordinates include a 42px review toolbar; game-space boss bottom subtracts this external toolbar.']};
fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify({checks:result.checks,layout:layout.map(l=>({viewport:l.viewport,fullCards:l.visibleFull,bossBottom:l.boss.bottom,scrollEnd:l.end})),rewards:rewards.map(r=>({id:r.id,count:r.choices,height:r.modal.height})),errors},null,2));
if(Object.values(result.checks).some(v=>!v))process.exitCode=1;
