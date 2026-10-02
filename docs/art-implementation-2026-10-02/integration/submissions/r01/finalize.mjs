import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const ownerDir=path.resolve(dir,'../..');
if(fs.existsSync(path.join(dir,'READY')))throw Error('r01 is already immutable');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const atomic=(p,v)=>{const tmp=p+'.tmp';fs.writeFileSync(tmp,JSON.stringify(v,null,2)+'\n','utf8');fs.renameSync(tmp,p);};
const files=fs.readdirSync(dir).filter(n=>!['packet.json','READY','READY.json'].includes(n)&&!n.endsWith('.tmp')).sort().map(p=>({path:p,bytes:fs.statSync(path.join(dir,p)).size,sha256:sha(path.join(dir,p))}));
const packet={schemaVersion:1,owner:'integration',revision:'r01',status:'ready_for_review',approval:'pending_primary_review',
  scope:'desktop implementation contract only; no src/public/package writes; no Git operations',
  counts:{identities:48,referenceStates:375,exactSourcePoseGroups:205,defaultAndSurvivorSkills:95,supportedHandlers:100},
  files,entry:'README.md',api:'module-api.md',ownership:'ownership-and-rollout.md',
  proposedEngineExceptions:['combatOffenseRuntime.js: sourceArtId/sourceUid/shotIndex metadata only','combatFrameRuntime.js: optional read-only onProjectileHit notification at existing confirmed hit only'],
  dependencies:{publishedBaseline:'pending reviewer release gate; observed-baseline is not release proof',contractApproval:'pending',upstreamArt:'production integration r02; desktop delivery r02 with external final acceptance'},
  validation:{mappingAndCurrentSource:'passed',protectedWorktreeFingerprint:'passed at sealing; see verification.json',runtimeTests:'not_run',visualProduction:'not_produced',devicePerformance:'not_run'},
  openItems:['Reviewer approval and baseline execution gate','Measured production resources/anchors and real gameplay integration are subsequent work','Optional hit notification is a specifically reviewable second engine presentation-only insertion, not a collision change'],
  immutableAfterReady:true,reportPolicy:'one completion report; no proactive cross-thread messages; wait for primary reviewer'};
atomic(path.join(dir,'packet.json'),packet);
const ready={owner:'integration',revision:'r01',packetPath:'packet.json',packetSha256:sha(path.join(dir,'packet.json')),readyAt:new Date().toISOString(),status:'ready_for_review'};
atomic(path.join(dir,'READY'),ready);
atomic(path.join(dir,'READY.json'),ready);
const pointer={...ready,packetPath:'submissions/r01/packet.json'};
atomic(path.join(ownerDir,'READY'),pointer);
atomic(path.join(ownerDir,'READY.json'),pointer);
console.log(JSON.stringify(pointer,null,2));
