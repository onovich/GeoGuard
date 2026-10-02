import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url)),owner=path.resolve(out,'../..'),root=path.resolve(out,'../../../../..');
if(fs.existsSync(path.join(out,'READY')))throw new Error('r03 is already immutable');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]);
const relative=file=>path.relative(root,file).replaceAll('\\','/');
const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);};
const atomic=(file,value)=>{fs.writeFileSync(`${file}.tmp`,JSON.stringify(value,null,2)+'\n','utf8');fs.renameSync(`${file}.tmp`,file);};
const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8'));
const moduleFiles=['index.js','manifest.js','rig.js','rigData.js'].map(p=>path.join(root,'src/view/art/characters',p));
for(const file of moduleFiles)copy(file,path.join(out,'runtime-snapshot',path.basename(file)));
const produced=Object.values(manifest).filter(v=>v.status==='produced_pending_review');
const publicFiles=produced.flatMap(v=>walk(path.join(root,'public',path.dirname(v.sourceFile))));
for(const file of publicFiles)copy(file,path.join(out,'public-snapshot',path.relative(path.join(root,'public/art/characters/v1'),file)));
const deployed=[...moduleFiles,...publicFiles];
const workspaceFiles=deployed.map(file=>({path:relative(file),sha256:sha(file),bytes:fs.statSync(file).size,snapshotPath:`submissions/r03/${moduleFiles.includes(file)?`runtime-snapshot/${path.basename(file)}`:`public-snapshot/${path.relative(path.join(root,'public/art/characters/v1'),file).replaceAll('\\','/')}`}`}));
// Prior packets must remain intact, including every previously sealed file.
for(const revision of ['r01','r02']){
 const packet=JSON.parse(fs.readFileSync(path.join(owner,'submissions',revision,'packet.json'),'utf8'));
 for(const entry of packet.files)if(sha(path.join(owner,entry.path))!==entry.sha256)throw new Error(`Prior immutable file changed: ${entry.path}`);
}
const contractFile=path.join(root,'docs/art-implementation-2026-10-02/integration/submissions/r01/packet.json');
if(sha(contractFile)!=='b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba')throw new Error('Approved contract changed');
const qa=JSON.parse(fs.readFileSync(path.join(out,'qa-action-inputs-375.json'),'utf8'));
for(const entry of qa.sourceFiles)if(sha(path.join(root,entry.path))!==entry.sha256)throw new Error(`QA inputs stale: ${entry.path}`);
const files=walk(out).filter(f=>!['packet.json','READY','READY.json'].includes(path.basename(f))&&!f.endsWith('.tmp')).map(file=>({path:`submissions/r03/${path.relative(out,file).replaceAll('\\','/')}`,sha256:sha(file),bytes:fs.statSync(file).size}));
const verification=JSON.parse(fs.readFileSync(path.join(out,'verification.json'),'utf8'));
const feedback=JSON.parse(fs.readFileSync(path.join(out,'feedback-audit.json'),'utf8'));
const packet={schemaVersion:1,owner:'characters',revision:'r03',status:'ready_for_review',scope:'eight_formal_editable_character_samples_and_public_API',contract:{path:relative(contractFile),sha256:sha(contractFile)},baselineCommit:'23ce1a33d0a72674286d67ba80c8f7b1260153e2',files,workspaceFiles,
 identities:produced.map(v=>v.artId),counts:{identities:48,producedPendingReview:8,notProduced:40,referenceActions:375,drawableReferences:56,pendingReferences:319,archivedReferences:4,activeAbilityInputMappings:95,publicTransparentPNGs:16,contactPNGs:6},
 apiExports:['CHARACTER_ART_SCHEMA_VERSION','characterManifest','resolveCharacterArtId','getCharacterIcon','loadCharacterArt','drawCharacter','getCharacterAnchors'],
 coveredRequirements:['Approved editable body-only source + transparent PNG/icon + measured source/root/C/r0/P/M','Continuous fixed-root soft sampler, rigid launcher attachment, mirror and approved direction projection','True shot-axis M metadata and actual current world flash API composition','S08 full-body palette hitFlash with unchanged alpha mask','Compact runtime 48/375 manifest, full immutable docs provenance','375 explicit QA reference Actor/Frame inputs plus95 current ability samples','Stable group output contract approved by primary'],
 tests:{art:verification,feedbackSummary:{shotScenarios:feedback.records.length,hitMasksVerified:feedback.hitChecks.length,status:feedback.status},commands:['build-production.mjs','render-and-validate.mjs','render-feedback-audit.mjs','build-qa-inputs.mjs'].map(command=>({command,exitCode:0})),sealedPriorPacketsUnchanged:true},
 dependencies:[{owner:'integration',requirement:'primary approves sample packet before G2 integration'},{owner:'world',requirement:'shot audit uses current read-only feedback API; hashes in feedback-audit.json; not world acceptance'},{owner:'characters-boss-a/b/enemies',requirement:'28 parallel group identities remain unmerged and pending'}],
 openIssues:['Primary visual/production acceptance pending','40 identities/319 reference actions not produced','Gameplay behavior, desktop layouts, performance and actual simulation screenshots remain integration/QA gates'],
 limitations:['No engine/data/config/package/renderer/UI changes or Git operation by this owner','No gameplay or full replacement completion claim','Shot audit is native API composition using frozen test event DTOs; not simulation capture','Native Canvas style getter restore quirk handled by actual pixel-color verification'],summary:'八个正式可编辑生产样板、真实半径PNG、R/P/M审计、真实轴向flash及全身受击、375/95精确QA输入已提交；其余40身份明确待制作。'};
atomic(path.join(out,'packet.json'),packet);
for(const file of files)if(sha(path.join(owner,file.path))!==file.sha256)throw new Error(`Seal mismatch ${file.path}`);
for(const file of workspaceFiles)if(sha(path.join(root,file.path))!==file.sha256)throw new Error(`Deployment mismatch ${file.path}`);
const ready={schemaVersion:1,owner:'characters',revision:'r03',status:'ready_for_review',packetPath:'submissions/r03/packet.json',packetSha256:sha(path.join(out,'packet.json')),readyAt:new Date().toISOString(),producedPendingReview:8,notProduced:40};
atomic(path.join(out,'READY'),{...ready,packetPath:'packet.json'});
atomic(path.join(owner,'READY.json'),ready);atomic(path.join(owner,'READY'),ready);
console.log(JSON.stringify({files:files.length,workspaceFiles:workspaceFiles.length,packetSha256:ready.packetSha256,ready:ready.packetPath},null,2));
