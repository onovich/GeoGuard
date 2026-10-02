import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(out,'../../../../..');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(path.join(out,p),'utf8'));
const verification=read('verification.json');
if(Object.values(verification.checks).some(v=>!v))throw new Error('Preview checks must pass before seal.');
for(const s of read('source-evidence.json').sources){if(hash(path.join(root,s.path))!==s.sha256)throw new Error('Source changed since inspection: '+s.path);}
const coverage=read('coverage.json');
if(coverage.requirements.length!==48||new Set(coverage.requirements.map(r=>r.id)).size!==48)throw new Error('Exactly 48 unique source requirement IDs required.');
const requests=read('contract-requests.json');
requests.requests=requests.requests.map(r=>({...r,primaryRoutingStatus:['C-01','C-06'].includes(r.id)?'accepted-routing-in-primary-followup-implementation-dispatch-pending':'submitted-for-integration-contract'}));
fs.writeFileSync(path.join(out,'contract-requests.json'),JSON.stringify(requests,null,2)+'\n','utf8');
const files=fs.readdirSync(out).filter(f=>fs.statSync(path.join(out,f)).isFile()&&!['packet.json'].includes(f)&&!f.endsWith('.tmp')).sort();
const packet={schemaVersion:1,owner:'ui',revision:'r01',status:'submitted-planning-review-not-implementation',date:'2026-10-02 Asia/Shanghai',
scope:'Read-only reconnaissance, complete ownership/resource/state implementation plan, standalone reference production preview. No src/public/package or sealed-art changes.',
authority:'docs/art-implementation-2026-10-02/coordination.md',
baseline:{primaryReportedCommit:'23ce1a3',gitOperationsByUiWorker:false,implementationAuthorized:false,awaiting:'sealed integration contract r01 and explicit primary implementation dispatch'},
coverage:{sourceRequirementCount:48,mappedRequirementCount:48,completedRuntimeRequirements:0,requirements:coverage.requirements.map(r=>r.id),map:'coverage.json',supplemental:coverage.supplementalScope.map(r=>r.id)},
files:files.map(f=>({path:'docs/art-implementation-2026-10-02/ui/submissions/r01/'+f,sha256:hash(path.join(out,f)),bytes:fs.statSync(path.join(out,f)).size})),
checks:verification.checks,verification:'verification.json',preview:'preview.html',
dependencies:requests.requests.map(r=>({id:r.id,owner:r.owner,status:r.primaryRoutingStatus,request:r.request})),
limitations:verification.limitations,
primaryRequiredNextStep:'Review packet and approve integration contract before assigning source implementation. Preserve developer default styles; no direct source writes until dispatch.',
};
fs.writeFileSync(path.join(out,'packet.json'),JSON.stringify(packet,null,2)+'\n','utf8');
const packetPath='docs/art-implementation-2026-10-02/ui/submissions/r01/packet.json';
const ownerDir=path.resolve(out,'../..');
const ready={schemaVersion:1,owner:'ui',revision:'r01',status:'submitted_planning_review_pending',packet:packetPath,packetSha256:hash(path.join(out,'packet.json')),requirements:48,implementationAuthorized:false,previewChecksPassed:true};
const temp=path.join(ownerDir,'READY.r01.tmp');
fs.writeFileSync(temp,JSON.stringify(ready,null,2)+'\n','utf8');
fs.renameSync(temp,path.join(ownerDir,'READY.json'));
console.log(JSON.stringify({ready:'docs/art-implementation-2026-10-02/ui/READY.json',packet:packetPath,packetSha256:ready.packetSha256,files:files.length,requirements:48,sourceUnchanged:true}));
