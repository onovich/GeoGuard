import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { ROOT, DEFAULT_OUT, argsMap, writeJSON, fileHash, sourceManifest, compareManifests } from './common.mjs';
import { runUIFlow } from './ui-flow.mjs';

const require = createRequire(import.meta.url), args = argsMap();
const sourceRoot = path.resolve(args.source ?? path.join(DEFAULT_OUT,'baseline/browser'));
const out = path.resolve(args.out ?? path.join(DEFAULT_OUT,'browser-baseline'));
const mode = args.mode ?? 'fixed';
const packagePath = args.playwright ?? path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { chromium } = require(packagePath);
const before = sourceManifest(sourceRoot), errors = [], requests = [];
fs.mkdirSync(out,{recursive:true});
const scriptsRoot = path.join(ROOT,'scripts/art-validation');
const harnessFiles=['browser-runner.mjs','browser-page.mjs','browser-page.html','scene-kit.mjs','snapshot.mjs','ui-flow.mjs'].map(file=>({file,sha256:fileHash(path.join(scriptsRoot,file))}));
const tailwindConfig=(await import(pathToFileURL(path.join(sourceRoot,'tailwind.config.js')).href)).default;
const cssInputs=[path.join(sourceRoot,'index.html'),path.join(sourceRoot,'src/**/*.{js,jsx,ts,tsx}')].map(p=>p.replaceAll('\\','/'));
const server = await createServer({root:sourceRoot,configFile:false,css:{postcss:{plugins:[tailwindcss({...tailwindConfig,content:cssInputs}),autoprefixer()]}},plugins:[react(),{name:'independent-art-qa',configureServer(vite){vite.middlewares.use((req,res,next)=>{
  const url=new URL(req.url,'http://localhost');
  if(!url.pathname.startsWith('/__artqa/'))return next();
  const name=url.pathname.slice('/__artqa/'.length)||'browser-page.html';
  if(!['browser-page.html','browser-page.mjs','scene-kit.mjs','snapshot.mjs'].includes(name)){res.statusCode=404;res.end();return;}
  res.setHeader('Content-Type',name.endsWith('.html')?'text/html':'text/javascript');res.end(fs.readFileSync(path.join(scriptsRoot,name)));
});}}],server:{host:'127.0.0.1',port:0,fs:{allow:[ROOT,sourceRoot]}},cacheDir:path.join(out,'vite-cache'),logLevel:'error'});
await server.listen();
const base=`http://127.0.0.1:${server.httpServer.address().port}`;
let browser;
try { browser = await chromium.launch({headless:true,...(args.browser?{executablePath:args.browser}:{}),ignoreDefaultArgs:['--hide-scrollbars']}); }
catch(error){writeJSON(path.join(out,'launch-failure.json'),{error:String(error),packagePath,requestedBrowser:args.browser??'Playwright default',at:new Date().toISOString()});await server.close();throw error;}
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:Number(args.dpr??1)});
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
page.on('pageerror',e=>errors.push(String(e.stack||e.message||e)));
page.on('requestfailed',r=>requests.push({url:r.url(),failure:r.failure()}));
const results=[];
const capture=async name=>{const filename=`${name}.png`;await page.screenshot({path:path.join(out,filename)});return{file:filename,sha256:fileHash(path.join(out,filename)),visualStatus:'captured_unreviewed'};};
try{
  if(mode==='fixed'||mode==='performance'){
    await page.goto(base+'/__artqa/browser-page.html');await page.waitForFunction(()=>window.artQA?.ready);
    if(mode==='fixed'){
      for(const [width,height] of [[960,720],[1280,720],[1440,900]]){
        await page.setViewportSize({width,height});
        for(const options of [{kind:'catalog'},{kind:'density'},{kind:'boss',bossId:'TWINS'}]){
          const name=`${options.kind}-${width}x${height}`;
          try{
          const state=await page.evaluate(o=>window.artQA.load(o),options);
          const screenshot=await capture(name);writeJSON(path.join(out,name+'.state.json'),state);
          const purity=await page.evaluate(()=>window.artQA.purity(30));writeJSON(path.join(out,name+'.purity.json'),purity);
          results.push({name,options,screenshot,purity:{passed:purity.passed,error:purity.error,stateUnchanged:purity.stateUnchanged,randomCalls:purity.randomCalls,transformRestored:purity.transformRestored}});
          }catch(error){const message=String(error.stack??error);errors.push(message);results.push({name,options,error:message,screenshot:await capture(name+'-error'),status:'failed'});}
        }
      }
    }else{
      const width=Number(args.width??1440),height=Number(args.height??900);await page.setViewportSize({width,height});
      for(let trial=1;trial<=3;trial++){
        await page.evaluate(()=>window.artQA.load({kind:'density'}));
        const sample=await page.evaluate(o=>window.artQA.measure(o),{seconds:Number(args.seconds??60),warmup:10});
        const values=sample.frames.map(f=>f.interval).sort((a,b)=>a-b),renders=sample.frames.map(f=>f.renderMs).sort((a,b)=>a-b);
        const percentile=(list,p)=>list[Math.min(list.length-1,Math.floor(list.length*p))]??null;
        sample.summary={p50:percentile(values,.5),p95:percentile(values,.95),p99:percentile(values,.99),renderP95:percentile(renders,.95),over50ms:values.filter(x=>x>50).length};
        writeJSON(path.join(out,`performance-${trial}.json`),sample);results.push({trial,...sample.summary,frames:values.length,seconds:sample.seconds,warmup:sample.warmup,visibility:sample.visibility});
        console.log(JSON.stringify({trialComplete:trial,...sample.summary}));
      }
    }
  }else if(mode==='characters'){
    const ledger=JSON.parse(fs.readFileSync(args.samples,'utf8'));
    await page.goto(base+'/__artqa/browser-page.html');await page.waitForFunction(()=>window.artQA?.ready);
    for(const sample of ledger.samples){
      const result=await page.evaluate(s=>window.artQA.sampleCharacter(s),sample);
      if(result.status==='captured_unreviewed'){result.screenshot=await capture(sample.key.replace(/[^a-z0-9_-]/gi,'_'));}
      results.push({key:sample.key,...result});
    }
  }else if(mode==='ui'){
    results.push(...await runUIFlow({page,base,out,capture}));
  }else throw new Error(`Unknown mode ${mode}`);
}catch(e){errors.push(String(e.stack||e.message||e));await capture('runner-failure');fs.writeFileSync(path.join(out,'failure-dom.html'),await page.content());process.exitCode=1;}
finally{
  await browser.close();await server.close();
  const changedDuringRun=compareManifests(before,sourceManifest(sourceRoot));
  writeJSON(path.join(out,'report.json'),{mode,sourceRoot,sourceFiles:before,harnessFiles,cssInputs,environment:{browser:browser.version(),platform:process.platform,architecture:process.arch,cpuCount:os.cpus().length,cpuModel:os.cpus()[0]?.model,node:process.version,dpr:Number(args.dpr??1),headless:true},results,errors,failedRequests:requests,changedDuringRun,valid:!changedDuringRun.length,visualApproval:false});
  console.log(JSON.stringify({mode,cases:results.length,errors:errors.length,changedDuringRun:changedDuringRun.length,out}));
  if(errors.length||changedDuringRun.length||results.some(r=>(r.purity&&!r.purity.passed)||(r.checks&&Object.values(r.checks).some(v=>!v))))process.exitCode=1;
}
