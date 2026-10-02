import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const owner=path.resolve(dir,'../..');
const root=path.resolve(dir,'../../../../..');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const packet=JSON.parse(fs.readFileSync(path.join(dir,'packet.json'),'utf8'));
const coverage=JSON.parse(fs.readFileSync(path.join(dir,'coverage.json'),'utf8'));
const sources=JSON.parse(fs.readFileSync(path.join(dir,'source-fingerprints.json'),'utf8'));
const errors=[];
for(const file of packet.files){const target=path.resolve(owner,file.path);if(!target.startsWith(dir+path.sep)||sha(target)!==file.sha256)errors.push('packet SHA '+file.path);const bytes=fs.readFileSync(target);if(bytes.subarray(0,3).equals(Buffer.from([239,187,191])))errors.push('BOM '+file.path);}
const keys=coverage.items.flatMap(i=>i.actions.map(a=>a.key));
if(coverage.items.length!==48||keys.length!==375||new Set(keys).size!==375)errors.push('coverage');
const sourceChanges=sources.files.filter(f=>sha(path.join(root,f.path))!==f.sha256).map(f=>f.path);
// Source changes after authorized implementation may be legitimate; always report separately.
console.log(JSON.stringify({packetFiles:packet.files.length,identities:coverage.items.length,uniqueActions:new Set(keys).size,packetErrors:errors,sourceSnapshotChanges:sourceChanges,productionCompleted:0},null,2));
if(errors.length||sourceChanges.length)process.exitCode=1;
