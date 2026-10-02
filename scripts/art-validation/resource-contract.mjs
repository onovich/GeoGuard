import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL}from'node:url';
import {ROOT,DEFAULT_OUT,argsMap,fileHash,sourceManifest,compareManifests,writeJSON}from'./common.mjs';

const args=argsMap(),root=path.resolve(args.source??ROOT),out=path.resolve(args.out??path.join(DEFAULT_OUT,'resource-contract.json'));
const contractRoot=path.join(ROOT,'docs/art-implementation-2026-10-02/integration/submissions/r01');
const expected='b068cd8cc19d808dd60f1b0eba855feeb11f019f8911ad8da8b17f1ba9d1b2ba';
if(fileHash(path.join(contractRoot,'packet.json'))!==expected)throw new Error('Approved contract SHA mismatch');
const packet=JSON.parse(fs.readFileSync(path.join(contractRoot,'packet.json')));
for(const f of packet.files)if(fileHash(path.join(contractRoot,f.path))!==f.sha256)throw new Error('Contract file hash mismatch '+f.path);
const identity=JSON.parse(fs.readFileSync(path.join(contractRoot,'identity-map.json'))).identities;
const actions=JSON.parse(fs.readFileSync(path.join(contractRoot,'state-reuse-375.json'))).actions;
const before=sourceManifest(root),issues=[],results={};
const specs={characters:{constants:['CHARACTER_ART_SCHEMA_VERSION','characterManifest'],functions:['resolveCharacterArtId','getCharacterIcon','loadCharacterArt','drawCharacter','getCharacterAnchors']},world:{constants:['WORLD_ART_SCHEMA_VERSION','worldManifest'],functions:['loadWorldArt','drawWorldBackground','drawWorldItem','drawHazard','drawActorOverlay','drawPlacement']}};
for(const [owner,spec]of Object.entries(specs)){
  const modulePath=path.join(root,`src/view/art/${owner}/index.js`);
  if(!fs.existsSync(modulePath)){results[owner]={status:'pending',reason:'module not produced'};continue;}
  try{
    // Node import proves import-time manifest APIs do not require DOM/Image/Path2D.
    const api=await import(pathToFileURL(modulePath).href);
    const missing=[...spec.constants.filter(k=>!(k in api)),...spec.functions.filter(k=>typeof api[k]!=='function')];
    if(missing.length)issues.push({owner,kind:'missing_exports',missing});
    results[owner]={status:missing.length?'failed':'interface_present_not_visually_accepted',missing};
    if(owner==='characters'&&!missing.length){
      if(api.CHARACTER_ART_SCHEMA_VERSION!==1)issues.push({owner,kind:'schema_version'});
      // Current producer index explicitly accesses characterManifest[artId].
      if(!api.characterManifest||Array.isArray(api.characterManifest))throw new Error('Expected artId-keyed manifest as current public implementation uses');
      const entries=Object.values(api.characterManifest),produced=entries.filter(e=>e.status==='produced_pending_review');
      const expectedIds=new Set(identity.map(i=>i.artKey));
      const unexpected=Object.keys(api.characterManifest).filter(id=>!expectedIds.has(id));
      if(unexpected.length)issues.push({owner,kind:'unexpected_identity_keys',unexpected});
      results[owner].identityCount=entries.length;results[owner].producedCount=produced.length;results[owner].pendingIdentities=identity.filter(i=>!produced.some(e=>e.artId===i.artKey)).map(i=>i.artKey);
      results[owner].entries=produced.map(e=>({artId:e.artId,anchorsMeasured:e.anchorsMeasured,actionCount:Object.keys(e.actions??{}).length,icon:e.icon,sourceFile:e.sourceFile}));
      for(const e of produced){
        const required=actions.filter(a=>a.artKey===e.artId).map(a=>a.action),missingActions=required.filter(a=>!Object.hasOwn(e.actions??{},a));
        if(missingActions.length)issues.push({owner,artId:e.artId,kind:'unmapped_reference_actions',missingActions});
        if(!e.anchorsMeasured)issues.push({owner,artId:e.artId,kind:'unmeasured_anchors'});
        if(e.icon?.src&&!fs.existsSync(path.join(root,'public',e.icon.src)))issues.push({owner,artId:e.artId,kind:'missing_icon',path:e.icon.src});
      }
    }
    if(owner==='world'&&!missing.length){results[owner].manifest=api.worldManifest;if(api.WORLD_ART_SCHEMA_VERSION!==1)issues.push({owner,kind:'schema_version'});}
  }catch(error){results[owner]={status:'pending_or_broken_in_progress_module',error:String(error.stack??error)};issues.push({owner,kind:'import_failure',message:String(error)});}
}
const changedDuringRun=compareManifests(before,sourceManifest(root));
const structureComplete=!issues.length&&!changedDuringRun.length&&results.characters?.producedCount===48&&results.characters?.pendingIdentities?.length===0&&results.world?.status==='interface_present_not_visually_accepted';
writeJSON(out,{contractSha256:expected,contractFilesVerified:packet.files.length,createdAt:new Date().toISOString(),source:root,sourceFiles:before,results,issues,changedDuringRun,valid:!changedDuringRun.length,structureComplete,complete:false,limitations:['No resource or visual approval inferred from schema/export presence.','Missing/in-progress candidate resources remain pending until sealed owner packets.','Runtime load, actual PNG decoding, failure injection, 375 action sampling and independent image review require browser evidence.']});
console.log(JSON.stringify({results:Object.fromEntries(Object.entries(results).map(([k,v])=>[k,{status:v.status,produced:v.producedCount,pending:v.pendingIdentities?.length}])),issues:issues.length,valid:!changedDuringRun.length}));
