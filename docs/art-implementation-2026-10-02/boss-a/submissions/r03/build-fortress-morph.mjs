import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {BOSS_RIGS_A} from '../../../../../src/view/art/characters/bossRigDataA.js';
import {BOSS_RIGS_A as BASELINE} from './bossRigDataA.r02.snapshot.js';
const out=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(out,'../../../../..');
const dir=path.join(root,'public/art/characters/v1/boss/fortress');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write=(file,v)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n','utf8');};
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const otherIds=Object.keys(BASELINE).filter(id=>id!=='boss:FORTRESS');
const otherResourceHashes=otherIds.flatMap(id=>walk(path.join(root,'public/art/characters/v1/boss',id.split(':')[1].toLowerCase()))).map(file=>({path:path.relative(root,file).replaceAll('\\','/'),sha256:sha(file)}));
for(const id of otherIds)assert.deepEqual(BOSS_RIGS_A[id],BASELINE[id],id+' data changed');
const rig=BOSS_RIGS_A['boss:FORTRESS'];
const {shapeMorphs,...withoutMorph}=rig;assert.deepEqual(withoutMorph,BASELINE['boss:FORTRESS']);
const oldPacket=JSON.parse(fs.readFileSync(path.join(out,'../r02/packet.json'),'utf8'));
const oldDocFiles=oldPacket.files.filter(f=>f.path.startsWith('docs/art-implementation-2026-10-02/boss-a/submissions/r02/'));
for(const f of oldDocFiles)assert.equal(sha(path.join(root,f.path)),f.sha256,'immutable r02 doc '+f.path);
const contract='docs/art-implementation-2026-10-02/characters/submissions/r04/path-morph-contract.md';
assert.equal(sha(path.join(root,contract)),'80b061391c2fd6fd3f49796acd8071a4fb8c0622f9d61103e65fac5e4b8431e0');
const requireRuntime=createRequire('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=requireRuntime('sharp');
const samplerPath=path.join(root,'src/view/art/characters/rig.js');
const original=fs.readFileSync(samplerPath,'utf8');
write(path.join(out,'shared-sampler-snapshot.txt'),original);
const sampler=original.replace(/import \{ RIGS, PALETTE \} from '\.\/rigData\.js';/,`import {BOSS_RIGS_A as RIGS} from '${pathToFileURL(path.join(root,'src/view/art/characters/bossRigDataA.js')).href}'; const PALETTE=${JSON.stringify({brown:'#4B281C',coral:'#F77965',coralShade:'#CB584C',cream:'#FFF9EF',pink:'#F4ADA0',honey:'#F8DDAA',honeyLight:'#FFEAC3'})};`);
const {buildCharacterPlan,pathCommands,planToSvg,getPlanAnchors,primeCharacterPaths,drawPlan}=await import('data:text/javascript;base64,'+Buffer.from(sampler).toString('base64'));
const morph=shapeMorphs['single-top-shell'];
const from=pathCommands(morph.fromD),to=pathCommands(morph.toD);
assert.equal(morph.curve,'sin2');assert.deepEqual(morph.poses,['attack']);
assert.deepEqual(from.map(c=>[c.op,c.values.length]),to.map(c=>[c.op,c.values.length]));
assert.equal(morph.fromD,BASELINE['boss:FORTRESS'].variants.neutralBody.shapes.find(s=>s.id==='single-top-shell').d);
const actor=(progress,facing='right',real=false)=>({artId:'boss:FORTRESS',x:real?64:rig.center[0],y:real?70:rig.center[1],radius:real?rig.referenceRadius:rig.collisionRadius,pose:'attack',poseProgress:progress,poseTime:0,facing,aimAngle:facing==='left'?Math.PI:0,alpha:1,boss:{phaseIndex:2,castAbility:'quake'}});
const get=(progress,facing='right',real=false)=>buildCharacterPlan(actor(progress,facing,real));
const shellOf=p=>p.commands.find(c=>c.shape.id==='single-top-shell');
const connectorOf=p=>p.commands.find(c=>c.shape.id==='shell-connector');
const coordsEqual=(actual,expected)=>assert.deepEqual(actual,expected);
coordsEqual(shellOf(get(0)).shape.commands,from);
coordsEqual(shellOf(get(1)).shape.commands,from);
coordsEqual(shellOf(get(.5)).shape.commands,to);

const cubic=(points,t)=>points[0].map((_,i)=>(1-t)**3*points[0][i]+3*(1-t)**2*t*points[1][i]+3*(1-t)*t*t*points[2][i]+t**3*points[3][i]);
const lowerAt128=commands=>{
  const v=commands[4].values,prev=commands[3].values.slice(-2),points=[prev,v.slice(0,2),v.slice(2,4),v.slice(4,6)];
  let lo=0,hi=1;for(let n=0;n<64;n++){const mid=(lo+hi)/2;if(cubic(points,mid)[0]>128)lo=mid;else hi=mid;}
  return cubic(points,(lo+hi)/2)[1];
};
const column=pathCommands(BASELINE['boss:FORTRESS'].shapes.find(s=>s.id==='shell-connector').d);
const columnTop=column[0].values[1],columnBottom=column[2].values[1];
const lowerBodyCommands=pathCommands(BASELINE['boss:FORTRESS'].shapes.find(s=>s.id==='lower-body').d);
// All interpolated lower-shell control Ys are >=155.82. At x128 the roof
// midpoint is <=106.32. The column interval therefore intersects the shell
// throughout every weight u in [0,1], not just the nine displayed samples.
const shellLowerControlBound=Math.min(...[from,to].flatMap(commands=>commands.slice(3,5).flatMap(c=>c.values.filter((_,i)=>i%2))));
const continuousShellOverlapBound=Math.min(shellLowerControlBound,columnBottom)-Math.max(from[1].values[5],to[1].values[5],columnTop);
const baseUpperControlBound=Math.max(lowerBodyCommands[0].values[1],...lowerBodyCommands[1].values.filter((_,i)=>i%2));
const continuousBaseOverlapBound=columnBottom-baseUpperControlBound;
assert(continuousShellOverlapBound>0&&continuousBaseOverlapBound>0);
const progressValues=Array.from({length:9},(_,i)=>i/8);
const rows=[],runtimeRows=[],contact=[],alpha=[],editable=[];
let maxRootError=0,minContact=Infinity;
for(const facing of ['right','left']){
  const comps=[],realComps=[];
  for(const [i,progress] of progressValues.entries()){
    const a=actor(progress,facing),before=JSON.stringify(a),p=buildCharacterPlan(a),s=shellOf(p),post=connectorOf(p);
    assert.equal(JSON.stringify(a),before);
    assert.deepEqual(s.matrix,post.matrix,'shell/column common matrix');
    assert.deepEqual(post.matrix,p.commands.find(c=>c.shape.id==='lower-body').matrix,'column/base common matrix');
    assert.equal(post.shape.d,BASELINE['boss:FORTRESS'].shapes.find(s=>s.id==='shell-connector').d);
    const weight=Math.sin(Math.PI*progress)**2;
    for(let j=0;j<from.length;j++)coordsEqual(s.shape.commands[j].values,from[j].values.map((v,k)=>v+(to[j].values[k]-v)*weight));
    const upperY=s.shape.commands[1].values[5];
    const lowerY=lowerAt128(s.shape.commands);
    const overlap=Math.min(lowerY,columnBottom)-Math.max(upperY,columnTop);
    assert(overlap>0,'column loses shell contact');minContact=Math.min(minContact,overlap);
    const anch=getPlanAnchors(p),expectedRoot={x:rig.root[0],y:rig.root[1]};
    maxRootError=Math.max(maxRootError,Math.abs(anch.root.x-expectedRoot.x),Math.abs(anch.root.y-expectedRoot.y));
    assert.deepEqual(anch.collisionCenter,{x:rig.center[0],y:rig.center[1]});
    const base=buildCharacterPlan({...a,pose:'neutral',poseProgress:0});
    for(const id of ['foot-left','foot-right'])assert.deepEqual(p.commands.find(c=>c.shape.id===id).matrix,base.commands.find(c=>c.shape.id===id).matrix);
    assert.deepEqual(p.rig.joints,BASELINE['boss:FORTRESS'].joints);
    const real=get(progress,facing,true),realAnch=getPlanAnchors(real);
    const scale=rig.referenceRadius/rig.collisionRadius;
    assert(Math.abs(realAnch.root.x-64)<1e-12&&Math.abs(realAnch.root.y-(70+scale*(rig.root[1]-rig.center[1])))<1e-12);
    contact.push({progress,facing,weight,root:anch.root,collisionCenter:anch.collisionCenter,sharedBodyMatrix:s.matrix,upperAtCenterY:upperY,lowerAtCenterY:lowerY,columnY:[columnTop,columnBottom],shellColumnOverlapSourcePx:overlap,overlapAtRuntimeRadiusPx:overlap*Math.hypot(real.commands.find(c=>c.shape.id==='single-top-shell').matrix[2],real.commands.find(c=>c.shape.id==='single-top-shell').matrix[3]),runtimeRoot:realAnch.root});
    const svg=planToSvg(p),png=await sharp(Buffer.from(svg)).png().toBuffer();
    const name=`attack-${String(i).padStart(2,'0')}-${facing}`;
    write(path.join(dir,'continuous',name+'.svg'),svg);fs.writeFileSync(path.join(dir,'continuous',name+'.png'),png);
    write(path.join(out,'editable',name+'.svg'),svg);editable.push(name+'.svg');
    const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});let edge=0;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(x===0||y===0||x===info.width-1||y===info.height-1)edge=Math.max(edge,data[(y*info.width+x)*info.channels+info.channels-1]);
    assert.equal(edge,0);alpha.push({progress,facing,width:info.width,height:info.height,edgeAlpha:edge});
    comps.push({input:await sharp(png).resize(192,192).toBuffer(),left:i*192,top:0});
    realComps.push({input:await sharp(Buffer.from(planToSvg(real,{width:128,height:128,viewBox:[0,0,128,128]}))).png().toBuffer(),left:i*128,top:0});
  }
  rows.push(await sharp({create:{width:1728,height:192,channels:4,background:'#FFF9EF'}}).composite(comps).png().toBuffer());
  runtimeRows.push(await sharp({create:{width:1152,height:128,channels:4,background:'#FFF9EF'}}).composite(realComps).png().toBuffer());
}
await sharp({create:{width:1728,height:384,channels:4,background:'#FFF9EF'}}).composite(rows.map((input,i)=>({input,left:0,top:i*192}))).png().toFile(path.join(out,'fortress-morph-contact-sheet.png'));
await sharp({create:{width:1152,height:256,channels:4,background:'#FFF9EF'}}).composite(runtimeRows.map((input,i)=>({input,left:0,top:i*128}))).png().toFile(path.join(out,'fortress-runtime-contact-sheet.png'));

// Path2D counter: static paths are primed once; morphed shells use numeric trace.
const previousPath2D=globalThis.Path2D;let compiledCount=0,traceCubics=0;
globalThis.Path2D=class{constructor(){compiledCount++;}ellipse(){}};
primeCharacterPaths();const afterPrime=compiledCount;
const ctx={globalAlpha:1,save(){},restore(){},transform(){},beginPath(){},moveTo(){},lineTo(){},bezierCurveTo(){traceCubics++;},quadraticCurveTo(){},closePath(){},ellipse(){},fill(){},stroke(){}};
for(const facing of ['right','left'])for(const progress of progressValues)drawPlan(ctx,get(progress,facing));
assert.equal(compiledCount,afterPrime);assert.equal(traceCubics,18*4);
globalThis.Path2D=previousPath2D;

// Refresh only FORTRESS pose exports under the current common sampler; neutral
// source/icon and the other seven identities are not rewritten by this script.
const namedPoses=[['neutral',{}],['left',{facing:'left'}],['up-body-reuse',{facing:'up',aimAngle:-Math.PI/2}],['squash',{pose:'squash'}],['stretch',{pose:'stretch'}],['windup-half',{pose:'windup',poseProgress:.5}],['windup',{pose:'windup',poseProgress:1}],['attack-quarter',{pose:'attack',poseProgress:.25}],['attack',{pose:'attack',poseProgress:.5}],['attack-end',{pose:'attack',poseProgress:1}],['open-body',{pose:'recover'}]];
for(const [name,extra] of namedPoses){const a={...actor(0),pose:'neutral',poseProgress:0,...extra};const svg=planToSvg(buildCharacterPlan(a));write(path.join(dir,'poses',name+'.svg'),svg);fs.writeFileSync(path.join(dir,'poses',name+'.png'),await sharp(Buffer.from(svg)).png().toBuffer());}
const rigMetadata=JSON.parse(fs.readFileSync(path.join(dir,'rig.json'),'utf8'));
rigMetadata.shapeMorphs=shapeMorphs;
rigMetadata.clips.attack={...rigMetadata.clips.attack,frames:'single-top-shell numeric same-topology morph: sin(pi*progress)^2; closed at 0/1, exact raised at .5; same body matrix/column',samples:progressValues};
rigMetadata.continuousRepair={status:'produced_pending_review',revision:'boss-a/r03',shapeId:'single-top-shell',columnUnchanged:true,rootCenterRadiusUnchanged:true};
write(path.join(dir,'rig.json'),rigMetadata);
write(path.join(out,'shape-morph-data.json'),{artId:'boss:FORTRESS',shapeMorphs,root:rig.root,center:rig.center,collisionRadius:rig.collisionRadius,referenceRadius:rig.referenceRadius,connectorD:BASELINE['boss:FORTRESS'].shapes.find(s=>s.id==='shell-connector').d});
write(path.join(out,'contact-audit.json'),{columnTop,columnBottom,minShellColumnOverlapSourcePx:minContact,allProgressCertificate:{weightRange:[0,1],columnCutX:128,lowerShellBezierControlYBound:shellLowerControlBound,upperShellAtCenterMaxY:Math.max(from[1].values[5],to[1].values[5]),guaranteedShellColumnOverlapSourcePx:continuousShellOverlapBound,lowerBodyUpperControlMaxY:baseUpperControlBound,guaranteedColumnBaseOverlapSourcePx:continuousBaseOverlapBound,commonAffineMatrix:true},samples:contact});
write(path.join(out,'alpha-audit.json'),alpha);
for(const f of otherResourceHashes)assert.equal(sha(path.join(root,f.path)),f.sha256,'other identity resource changed during repair: '+f.path);
write(path.join(out,'unchanged-seven.json'),{dataDeepEqual:true,identities:otherIds,currentResourceSha256:otherResourceHashes,resourcesUnchangedAcrossThisBuild:true});
for(const f of oldDocFiles)assert.equal(sha(path.join(root,f.path)),f.sha256);
write(path.join(out,'validation.json'),{status:'offline_continuous_morph_passed_pending_primary_review',contract:{path:contract,sha256:sha(path.join(root,contract))},sourceSamplerSha256:sha(path.join(out,'shared-sampler-snapshot.txt')),sampledProgress:progressValues,directions:['right','left'],sampleCount:contact.length,topology:from.map(c=>[c.op,c.values.length]),startExactClosed:true,endExactClosed:true,midpointExactRaised:true,fromDExactR02Closed:true,allOtherFortressFieldsDeepEqual:true,otherSevenRigsDeepEqual:true,otherSevenResourcesUnchanged:true,r02DocumentsUnchanged:true,maxRootError,collisionCenterInvariant:true,fixedFootMatricesInvariant:true,organJointsInvariant:true,columnPathInvariant:true,columnAndShellMatrixIdentical:true,columnAndBaseMatrixIdentical:true,minShellColumnOverlapSourcePx:minContact,allProgressShellContactLowerBound:continuousShellOverlapBound,allProgressBaseContactLowerBound:continuousBaseOverlapBound,transparentFrameBorders:true,zeroInputMutation:true,canvasTrace:{staticPath2DCount:afterPrime,extraPath2DOver18Frames:compiledCount-afterPrime,numericShellCubicCalls:traceCubics},actualPublicRegistryIntegrationTested:false,gameplayTested:false,sharedModuleWritten:false});
assert.equal(sha(samplerPath),sha(path.join(out,'shared-sampler-snapshot.txt')),'Shared sampler changed during build');
console.log(JSON.stringify({samples:contact.length,maxRootError,minContact,endpointExact:true,midpointExact:true,extraPath2D:compiledCount-afterPrime}));
