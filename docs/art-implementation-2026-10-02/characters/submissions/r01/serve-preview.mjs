import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const submission=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(submission,'../../../../..');
const entry='/docs/art-implementation-2026-10-02/characters/submissions/r01/index.html';
const types={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
  const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(url==='/'){res.writeHead(302,{Location:entry});res.end();return;}
  const file=path.resolve(root,'.'+(url==='/'?entry:url));
  if (!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]??'text/plain; charset=utf-8','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
}).listen(8787,'127.0.0.1',()=>console.log('Read-only staging preview http://127.0.0.1:8787/'));
