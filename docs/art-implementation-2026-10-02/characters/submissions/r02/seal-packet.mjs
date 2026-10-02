import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const owner=path.resolve(dir,'../..');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(p,d.name)):[path.join(p,d.name)]);
const files=walk(dir).filter(f=>path.basename(f)!=='packet.json').map(f=>({path:'submissions/r02/'+path.relative(dir,f).replaceAll('\\','/'),sha256:sha(f),bytes:fs.statSync(f).size}));
const packet={owner:'characters',revision:'r02',status:'submitted_for_visual_study_review',scope:'non_browser_raster_supplement_of_sealed_r01_studies',files,
 images:[{path:'submissions/r02/poses-contact-sheet.png',width:1248,height:780},{path:'submissions/r02/small-contact-sheet.png',width:1190,height:944}],
 sourcePacket:{path:'submissions/r01/packet.json',sha256:sha(path.join(owner,'submissions/r01/packet.json'))},
 coveredRequirements:['Non-browser local SVG rasterization using bundled sharp','BASIC/BURST neutral/squash/stretch/attack contact sheet','48/64/96px contact sheet','8 separate256px transparent body PNGs','Direct view_image inspection of both sheets','Sealed r01 all20 file hashes unchanged'],
 counts:{identities:2,statesPerIdentity:4,transparentPNGs:8,contactSheets:2,productionCompleted:0},
 dependencies:['Unified contract approval before formal samples'],openIssues:[],limitations:['Exact conversion of unapproved r01 studies; not production approval','No browser, gameplay, code/package changes, image generation or Git operation'],
 summary:'按主审要求提供直接可view_image审阅的BASIC/BURST动作与小尺寸PNG接触表，封存r01不改。'};
fs.writeFileSync(path.join(dir,'packet.json'),JSON.stringify(packet,null,2)+'\n','utf8');
for(const f of files)if(sha(path.join(owner,f.path))!==f.sha256)throw new Error('Seal mismatch');
const ready={owner:'characters',revision:'r02',status:packet.status,packetPath:'submissions/r02/packet.json',packetSha256:sha(path.join(dir,'packet.json')),scope:packet.scope,productionCompleted:0};
const tmp=path.join(owner,'READY.tmp.json');
fs.writeFileSync(tmp,JSON.stringify(ready,null,2)+'\n','utf8');
fs.renameSync(tmp,path.join(owner,'READY.json'));
console.log(JSON.stringify({files:files.length,packetSha256:ready.packetSha256,ready:ready.packetPath},null,2));
