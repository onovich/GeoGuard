import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../../../../..'),name=process.argv[2]??'source-snapshot',target=path.join(dir,name);
if(fs.existsSync(target))throw Error('Snapshot already exists; do not replace captured evidence.');
const files=[];const walk=d=>{for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p):files.push(p);}};
walk('src');walk('public');files.push('index.html','package.json','package-lock.json','vite.config.js','tailwind.config.js','postcss.config.js');
const rows=[];
for(const relative of files){const from=path.join(root,relative),to=path.join(target,relative),bytes=fs.readFileSync(from);fs.mkdirSync(path.dirname(to),{recursive:true});fs.writeFileSync(to,bytes);rows.push({path:relative.replaceAll('\\','/'),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
const changed=rows.filter(r=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,r.path))).digest('hex')!==r.sha256);
fs.writeFileSync(path.join(dir,name==='source-snapshot'?'captured-source.json':`captured-${name}.json`),JSON.stringify({capturedAt:new Date().toISOString(),origin:root,snapshot:target,changedDuringCapture:changed,files:rows},null,2)+'\n');
if(changed.length)throw Error('Source changed during capture; snapshot must not be counted as stable.');
console.log(JSON.stringify({target,files:rows.length,changed:changed.length}));
