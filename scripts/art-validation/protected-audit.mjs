import path from 'node:path';
import {ROOT,DEFAULT_OUT,argsMap,sourceManifest,compareManifests,writeJSON}from'./common.mjs';
const args=argsMap(),baseline=path.resolve(args.baseline??path.join(DEFAULT_OUT,'baseline/node_modules/geoguard-baseline')),candidate=path.resolve(args.candidate??ROOT);
const before=sourceManifest(baseline),after=sourceManifest(candidate),differences=compareManifests(before,after);
const protectedFiles=p=>p.startsWith('src/data/')||p.startsWith('src/logic/engine/')||p.startsWith('tests/')||/^(package(-lock)?\.json|(vite|tailwind|postcss)\.config\.js)$/.test(p);
const records=differences.map(d=>({...d,protected:protectedFiles(d.path),requiresSourceReview:d.kind!=='line_endings_only'&&protectedFiles(d.path),approvedPossibleExtension:['src/logic/engine/combatOffenseRuntime.js','src/logic/engine/combatFrameRuntime.js'].includes(d.path)?'Requires exact source review against contract; file is NOT exempt':null}));
writeJSON(path.resolve(args.out??path.join(DEFAULT_OUT,'protected-file-audit.json')),{createdAt:new Date().toISOString(),baseline,candidate,normalization:'CRLF to LF only; behavior snapshots remain exact with array/event order preserved',before,after,records,semanticProtectedChanges:records.filter(r=>r.requiresSourceReview),eolOnly:records.filter(r=>r.kind==='line_endings_only').length,scope:'source observation during implementation, not final candidate approval'});
console.log(JSON.stringify({eolOnly:records.filter(r=>r.kind==='line_endings_only').length,semanticProtectedChanges:records.filter(r=>r.requiresSourceReview).map(r=>r.path)}));
