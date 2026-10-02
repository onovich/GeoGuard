import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'../../../../..');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(path.join(dir,p),'utf8'));
const errors=[];
const check=(ok,message)=>{if(!ok)errors.push(message);};
const ids=read('identity-map.json').identities;
const states=read('state-reuse-375.json').actions;
const skills=read('boss-skills-95.json');
check(ids.length===48&&new Set(ids.map(i=>i.artKey)).size===48,'identity count');
check(states.length===375&&new Set(states.map(i=>i.key)).size===375,'state count');
check(skills.skills.length===95&&skills.audit.runtimeDefaultAndSurvivor===95,'skill count');
for(const s of states)check(ids.some(i=>i.artKey===s.artKey)&&s.bodySources.length>0,`unmapped ${s.key}`);
for(const s of skills.skills)check(s.active&&s.handlerExists&&s.upstreamExcerptMatchesCurrentSource,`skill evidence ${s.abilityId}`);
for(const i of ids)check(states.filter(s=>s.artKey===i.artKey).length===i.referenceActions.length,`identity actions ${i.artKey}`);
for(const f of read('sources.json').files)check(fs.existsSync(path.join(root,f.path))&&sha(path.join(root,f.path))===f.sha256,`source changed ${f.path}`);
if(process.argv.includes('--baseline'))for(const f of read('observed-baseline.json').files)check(fs.existsSync(path.join(root,f.path))&&sha(path.join(root,f.path))===f.sha256,`baseline changed ${f.path}`);
if(fs.existsSync(path.join(dir,'packet.json'))){
  for(const f of read('packet.json').files)check(fs.existsSync(path.join(dir,f.path))&&sha(path.join(dir,f.path))===f.sha256,`packet changed ${f.path}`);
  if(fs.existsSync(path.join(dir,'READY')))check(read('READY').packetSha256===sha(path.join(dir,'packet.json')),'READY packet hash');
}
for(const name of fs.readdirSync(dir).filter(n=>/\.(md|json|mjs)$/.test(n))){
  const b=fs.readFileSync(path.join(dir,name));check(!(b[0]===239&&b[1]===187&&b[2]===191),`BOM ${name}`);
}
console.log(JSON.stringify({status:errors.length?'failed':'passed',identities:ids.length,states:states.length,skills:skills.skills.length,baselineChecked:process.argv.includes('--baseline'),errors},null,2));
process.exitCode=errors.length?1:0;
