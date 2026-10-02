import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url)),owner=path.resolve(out,'../..'),root=path.resolve(out,'../../../../..');
if(fs.existsSync(path.join(out,'READY')))throw new Error('r04 is already immutable');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]);
const relative=file=>path.relative(root,file).replaceAll('\\','/');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const atomic=(file,value)=>{fs.writeFileSync(`${file}.tmp`,JSON.stringify(value,null,2)+'\n','utf8');fs.renameSync(`${file}.tmp`,file);};
const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);};
const manifest=read(path.join(out,'manifest.json')),produced=Object.values(manifest).filter(v=>v.status==='produced_pending_review');assert.equal(produced.length,48);
const moduleFiles=fs.readdirSync(path.join(root,'src/view/art/characters')).filter(n=>n.endsWith('.js')).sort().map(n=>path.join(root,'src/view/art/characters',n));assert.equal(moduleFiles.length,9);
const qa=read(path.join(out,'qa-action-inputs-375.json')),verification=read(path.join(out,'verification.json')),feet=read(path.join(out,'qa-and-feet-verification.json')),morph=read(path.join(out,'palette-and-morph-verification.json'));
for(const result of [qa,verification])for(const entry of result.sourceFiles)assert.equal(sha(path.join(root,entry.path)),entry.sha256,`Stale input/audit ${entry.path}`);
assert.deepEqual(qa.counts,{references:375,drawableReferences:375,pendingReferences:0,archivedReferences:4,activeSkills:95});
assert.equal(feet.referenceSampleDraws,1146);assert.equal(feet.skillSampleDraws,882);assert.equal(morph.hitChecks.length,48);assert.equal(verification.clippedFrames,0);
const groupSpecs=[
 {owner:'boss-a',revision:'r03',sha256:'a2e12164eb54b088959966cc905a30ebbaee3c7e12992a6ec9656418ae3653d0',module:'bossRigDataA.js',review:'boss-a-r03.md',baseRevision:'r02',baseSha:'0644ccffb402fa0a971566a48cb3f568fde5b857d04e2eff3998bbb11ac79d60',baseReview:'boss-a-r02.md'},
 {owner:'boss-b',revision:'r02',sha256:'bd42d0e4940fbeffc6be57c520c4544d2e2c4fdc3997ad6f1dbf9fc2085b3b59',module:'bossRigDataB.js',review:'boss-b-r02.md'},
 {owner:'enemy-batch',revision:'r04',sha256:'41fca8359d8cab9bdb01be6cfc4963293c7806ea16c1c3a60c266b5a53939aac',module:'enemyRigData.js',review:'enemy-batch-r04.md',baseRevision:'r02',baseSha:'66fbeca9e8df115d2b30f53b2181f2d3a3d14337216f32c9792940c2fe12dd78',baseReview:'enemy-batch-r02.md'},
];
const dependencies=groupSpecs.map(spec=>{
 const file=path.join(root,'docs/art-implementation-2026-10-02',spec.owner,'submissions',spec.revision,'packet.json');assert.equal(sha(file),spec.sha256);
 const packet=read(file),modulePath=`src/view/art/characters/${spec.module}`,entry=packet.files.find(f=>f.path===modulePath);assert.ok(entry);assert.equal(sha(path.join(root,modulePath)),entry.sha256);
 const review=path.join(root,'docs/art-implementation-2026-10-02/reviews',spec.review);assert.ok(fs.existsSync(review));
 const dependency={owner:spec.owner,revision:spec.revision,packetPath:relative(file),packetSha256:spec.sha256,modulePath,moduleSha256:entry.sha256,reviewPath:relative(review),reviewSha256:sha(review),meaning:'primary accepted group data; aggregate and gameplay acceptance remain separate'};
 if(spec.baseRevision){const base=path.join(root,'docs/art-implementation-2026-10-02',spec.owner,'submissions',spec.baseRevision,'packet.json');assert.equal(sha(base),spec.baseSha);const review=path.join(root,'docs/art-implementation-2026-10-02/reviews',spec.baseReview);dependency.baseResources={packetPath:relative(base),packetSha256:spec.baseSha,reviewPath:relative(review),reviewSha256:sha(review)};}
 return dependency;
});
const contractFile=path.join(root,'docs/art-implementation-2026-10-02/integration/submissions/r01/packet.json');assert.equal(sha(contractFile),'b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba');
let previousSealedFiles=0;
for(const revision of ['r01','r02','r03'])for(const entry of read(path.join(owner,'submissions',revision,'packet.json')).files){assert.equal(sha(path.join(owner,entry.path)),entry.sha256,`Prior sealed file changed ${entry.path}`);previousSealedFiles++;}
for(const file of moduleFiles)copy(file,path.join(out,'runtime-snapshot',path.basename(file)));
const publicFiles=produced.flatMap(entry=>['source.svg','body.svg','body.png','icon.svg','icon.png','rig.json'].map(name=>path.join(root,'public',path.dirname(entry.sourceFile),name)));
assert.equal(new Set(publicFiles).size,288);
for(const file of publicFiles)copy(file,path.join(out,'public-snapshot',path.relative(path.join(root,'public/art/characters/v1'),file)));
const snapshotApi=await import(pathToFileURL(path.join(out,'runtime-snapshot/index.js')).href);assert.equal(Object.keys(snapshotApi.characterManifest).length,48);assert.equal((await snapshotApi.loadCharacterArt()).status,'ready');
const workspaceFiles=[...moduleFiles,...publicFiles].map(file=>({path:relative(file),sha256:sha(file),bytes:fs.statSync(file).size,snapshotPath:`submissions/r04/${moduleFiles.includes(file)?`runtime-snapshot/${path.basename(file)}`:`public-snapshot/${path.relative(path.join(root,'public/art/characters/v1'),file).replaceAll('\\','/')}`}`}));
const files=walk(out).filter(f=>!['packet.json','READY','READY.json'].includes(path.basename(f))&&!f.endsWith('.tmp')).map(file=>({path:`submissions/r04/${path.relative(out,file).replaceAll('\\','/')}`,sha256:sha(file),bytes:fs.statSync(file).size}));
const packet={schemaVersion:1,owner:'characters',revision:'r04',status:'ready_for_review',scope:'all_48_editable_character_bodies_public_API_and_375_95_inputs',baselineCommit:'23ce1a33d0a72674286d67ba80c8f7b1260153e2',contract:{path:relative(contractFile),sha256:sha(contractFile)},files,workspaceFiles,dependencies,
 identities:produced.map(v=>v.artId),counts:{identities:48,producedPendingReview:48,notProduced:0,referenceActions:375,drawableReferences:375,pendingReferences:0,archivedReferences:4,activeAbilityInputMappings:95,referenceSampleDraws:1146,skillSampleDraws:882,canonicalPublicFiles:288,publicTransparentPNGs:96,runtimeModules:9,runtimeModuleBytes:moduleFiles.reduce((n,f)=>n+fs.statSync(f).size,0),runtimeManifestBytes:fs.statSync(path.join(root,'src/view/art/characters/manifest.js')).size},
 apiExports:['CHARACTER_ART_SCHEMA_VERSION','characterManifest','resolveCharacterArtId','getCharacterIcon','loadCharacterArt','drawCharacter','getCharacterAnchors'],
 coveredRequirements:['All 48 editable neutral bodies, same-source SVG/PNG icons, measured R/C/r0/P/M and reference radii','Completed seven towers/five mechanics; merged 28 group identities without writing exclusive data modules','Fixed-root continuous windup/attack/recover/trigger boundaries and same-organ path interpolation','SCOUT approved exact leg subdivision + winding alignment, stable horizontal foot-joint mean and filled soles','SENTINEL two visible feet and connected near/far pads in all 12 direction/pose samples','FORTRESS exact single authored shell interpolation, TWINS_SUN eye and RAIL_WARLORD recover eye without duplication','S08 full-body palette flash across all48 with identical alpha masks','375 explicit source-bound positive-radius inputs, including4 archived concepts;95 actual active skills','Immutable runtime/public snapshots and verified preservation of earlier character submissions'],
 tests:{art:verification,referenceAndFeet:feet,paletteAndMorph:morph,commands:['build-production.mjs','render-and-validate.mjs','build-qa-inputs.mjs','verify-qa-and-visible-feet.mjs','verify-palette-and-morphs.mjs'].map(command=>({command,exitCode:0})),snapshotLoader:'ready',previousSealedFilesVerified:previousSealedFiles},
 preflight:{scout:'primary inspected and accepted enemy r04 repair',sentinel:'primary inspected latest12 direction/pose images; visible feet and far-pad upper/lower arcs accepted; final aggregate review remains pending'},
 openIssues:['Primary aggregate visual and production acceptance pending','Actual integration/QA must verify skill timing, interruption behavior, gameplay dispatch, world feedback, layouts and performance'],
 limitations:['No gameplay or complete replacement acceptance claim from standalone art checks','Mid-pose interruption statelessly adopts new pose; smooth interruption blending excluded by primary','SCOUT approved local contour raster bottoms can vary; fixed root and joint-center invariants do not claim invariant alpha baseline','No engine/world/UI/config/package/existing test or Git changes by this owner'],summary:'48身份与375参考/95技能输入全量汇总；连续过渡、脚掌/肩甲、单壳单眼和全身受击审计完成，待主审与实机QA。'};
atomic(path.join(out,'packet.json'),packet);
for(const file of files)assert.equal(sha(path.join(owner,file.path)),file.sha256,`Seal changed ${file.path}`);
for(const file of workspaceFiles)assert.equal(sha(path.join(root,file.path)),file.sha256,`Deployment changed ${file.path}`);
const ready={schemaVersion:1,owner:'characters',revision:'r04',status:'ready_for_review',packetPath:'submissions/r04/packet.json',packetSha256:sha(path.join(out,'packet.json')),readyAt:new Date().toISOString(),producedPendingReview:48,notProduced:0,referenceActions:375,activeSkills:95};
atomic(path.join(out,'READY'),{...ready,packetPath:'packet.json'});atomic(path.join(out,'READY.json'),{...ready,packetPath:'packet.json'});atomic(path.join(owner,'READY.json'),ready);atomic(path.join(owner,'READY'),ready);
console.log(JSON.stringify({files:files.length,workspaceFiles:workspaceFiles.length,packetSha256:ready.packetSha256,ready:ready.packetPath},null,2));
