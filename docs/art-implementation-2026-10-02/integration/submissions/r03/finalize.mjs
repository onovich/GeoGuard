import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),owner=path.resolve(dir,'../..'),root=path.resolve(dir,'../../../../..');
if(fs.existsSync(path.join(dir,'READY')))throw Error('r03 is immutable.');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),read=p=>JSON.parse(fs.readFileSync(path.join(dir,p),'utf8'));
const atomic=(p,v)=>{fs.writeFileSync(p+'.tmp',JSON.stringify(v,null,2)+'\n');fs.renameSync(p+'.tmp',p);};
for(const file of ['validation.json','bridge-unit.json','integration-checks.json','browser-bridge-stable/report.json','browser-qualifications-stable/report.json'])assert.equal(read(file).status,'passed',file);
assert(read('validation.json').productionControlEntryAbsent);assert.equal(read('captured-source.json').changedDuringCapture.length,0);
const prior=JSON.parse(fs.readFileSync(path.join(dir,'../r02/scope.json'),'utf8'));
const owned=[...prior.files.map(row=>row.path),'src/view/art/integration/devQaBridge.js','src/logic/hooks/useCanvasGameLoop.js'];
const scope=owned.map(file=>{const live=sha(path.join(root,file)),captured=sha(path.join(dir,'source-snapshot',file));assert.equal(live,captured,file);return{path:file,sha256:live,capturedPath:`source-snapshot/${file}`};});
for(const row of prior.files.filter(row=>row.path!=='src/logic/hooks/useGeoGuardGame.jsx'))assert.equal(sha(path.join(root,row.path)),row.sha256,`Unexpected change since r02: ${row.path}`);
// Also ensure the entire copied source/resources remain exactly what was tested.
for(const file of read('captured-source.json').files)assert.equal(sha(path.join(dir,'source-snapshot',file.path)),file.sha256,file.path);
atomic(path.join(dir,'scope.json'),{owner:'integration',files:scope,changesSinceR02:['src/view/art/integration/devQaBridge.js','src/logic/hooks/useGeoGuardGame.jsx','src/logic/hooks/useCanvasGameLoop.js'],dataEngineUnchangedSinceR02:true,engineFreeze:'only previously approved metadata and callback provenance',noGitOperations:true});
const files=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['vite-cache','build-cache','node_modules'].includes(e.name))continue;const p=path.join(d,e.name),rel=path.relative(dir,p).replaceAll('\\','/');if(e.isDirectory())walk(p);else if(!['packet.json','READY','READY.json'].includes(rel)&&!rel.endsWith('.tmp'))files.push({path:rel,bytes:fs.statSync(p).size,sha256:sha(p)});}};walk(dir);files.sort((a,b)=>a.path.localeCompare(b.path));
const packet={schemaVersion:1,owner:'integration',revision:'r03',status:'ready_for_review',approval:'pending_primary_review',entry:'README.md',scope:'DEV deterministic clock/RNG bridge and live world qualification/hit integration; not final 48/375/95 acceptance',files,
  dependencies:{baseline:'23ce1a33d0a72674286d67ba80c8f7b1260153e2',integrationR02:'abfb65f3c3d92f8642dcbdd5e3bf2c866a80632ac023099d73af72c406c7883d',worldR03:'262e4c66738cd66168c37f3423d3bb2835fb9206e12419249fc2c211b3319018',devApproval:'../../../reviews/integration-r02.md',sourceSnapshot:'captured-source.json'},
  api:{gate:'import.meta.env.DEV and URL artqa=1',global:'__GEOGUARD_ART_QA__',methods:['reset','step','snapshot','release'],arbitraryStateSetter:false},
  validation:{build:'passed',productionEntryAbsent:true,existingTests:{passed:106,failed:0},scope:'passed',bridgeUnit:'passed',realGuiSameSeedReplay:'passed',nativeRngRestoration:'passed',pauseRewardRelease:'passed',realHealJamFuseAndThreeHitFamilies:'sample evidence passed; independent full QA pending'},
  openItems:['external full character assembly approval','375 pose and 95 skill full real-flow evidence','independent protected-logic 96-case difference QA','three desktop sizes and normal-player dense battlefield/performance','1.0 vs moderate camera zoom proposal without default behavior change'],
  immutableAfterReady:true,reportPolicy:'one report; no proactive cross-thread messages; wait for primary reviewer'};
atomic(path.join(dir,'packet.json'),packet);const ready={owner:'integration',revision:'r03',packetPath:'packet.json',packetSha256:sha(path.join(dir,'packet.json')),readyAt:new Date().toISOString(),status:'ready_for_review'};
atomic(path.join(dir,'READY'),ready);atomic(path.join(dir,'READY.json'),ready);const pointer={...ready,packetPath:'submissions/r03/packet.json'};atomic(path.join(owner,'READY'),pointer);atomic(path.join(owner,'READY.json'),pointer);
for(const file of files)assert.equal(sha(path.join(dir,file.path)),file.sha256,file.path);console.log(JSON.stringify({...pointer,verifiedFiles:files.length},null,2));
