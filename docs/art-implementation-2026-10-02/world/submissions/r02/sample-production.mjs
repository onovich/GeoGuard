// Production sampler uses the runtime Canvas drawers, never separate mock-art geometry.
import { createRequire } from 'node:module';
import { mkdirSync,writeFileSync } from 'node:fs';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url);
const runtime=process.env.WORLD_CANVAS_MODULE ?? 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas';
const {createCanvas,Path2D}=require(runtime);
globalThis.Path2D=Path2D;
const W=await import('../../../../../src/view/art/world/index.js');
const {shotStyles}=await import('../../../../../src/view/art/world/manifest.js');
const out=dirname(fileURLToPath(import.meta.url));
const root=resolve(out,'../../../../..');
const art=resolve(root,'public/art/world/v1');
const {assets,status}=await W.loadWorldArt();
if(status!=='ready')throw new Error('Production vectors not ready');
const frame={schemaVersion:1,epoch:1,time:1,dt:0,paused:true,quality:'full',viewport:{width:1440,height:900,dpr:1},camera:{x:720,y:450}};
const exports=[];
function render(path,width,height,draw,record=true) {
  const canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
  draw(ctx);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,canvas.toBuffer('image/png'));
  if(record)exports.push({path:path.replace(root+'\\','').replaceAll('\\','/'),width,height,textureBytes:width*height*4,bytes:canvas.toBuffer('image/png').length});
  return canvas;
}
const item=(sourceArtId,x,y)=>({kind:'projectile',sourceArtId,x,y,radius:shotStyles[sourceArtId].kind==='cannon'?7:shotStyles[sourceArtId].kind==='sniper'?3:4,angle:0,data:{kind:shotStyles[sourceArtId].kind,vx:500,vy:0}});
for(const [id,s] of Object.entries(shotStyles)) {
  render(resolve(art,'projectiles',id.split(':')[1].toLowerCase()+'.png'),64,64,c=>W.drawWorldItem(c,item(id,32,32),frame,assets));
  render(resolve(art,'effects','flash-'+id.split(':')[1].toLowerCase()+'.png'),64,64,c=>W.drawWorldItem(c,{kind:'feedback',sourceArtId:id,x:16,y:32,data:{type:'shot',time:1,angle:0,shotIndex:0,projectileKind:s.kind}},frame,assets));
}
render(resolve(art,'icons/drop.png'),64,64,c=>W.drawWorldItem(c,{kind:'drop',x:32,y:32,radius:10},frame,assets));
render(resolve(art,'effects/shadow.png'),64,32,c=>W.drawActorOverlay(c,{x:32,y:4,radius:14,states:{}},{root:{x:32,y:16}},frame,assets,'shadow'));
for(const kind of ['basic','cannon','sniper'])render(resolve(art,'effects/hit-'+kind+'.png'),64,64,c=>W.drawWorldItem(c,{kind:'feedback',x:32,y:32,data:{type:'hit',time:.94,projectileKind:kind}},frame,assets));
for(const type of ['defeat','summon-success','split-success','refund'])render(resolve(art,'effects/'+type+'.png'),64,64,c=>W.drawWorldItem(c,{kind:'feedback',x:32,y:32,data:{type,time:.9,amount:12,childKeys:['real-child-1']}},frame,assets));
render(resolve(art,'background/neutral.png'),1440,900,c=>W.drawWorldBackground(c,frame,assets));
const hazard={x:32,y:32,radius:24,type:'area',timer:.6,maxTimer:1,pulsesRemaining:1};
for(const [style,fields] of [['area',{}],['web',{terrain:true,label:'web',mechanicKind:'web'}],['root',{terrain:true,label:'poison',mechanicKind:'root'}]])render(resolve(art,'hazards/'+style+'.png'),64,64,c=>{const h={...hazard,...fields};W.drawHazard(c,h,frame,assets,'fill');W.drawHazard(c,h,frame,assets,'boundary');});
render(resolve(art,'hazards/line.png'),128,64,c=>{const h={...hazard,type:'line',x:24,y:32,x2:104,y2:32,width:12};W.drawHazard(c,h,frame,assets,'fill');W.drawHazard(c,h,frame,assets,'boundary');});

function title(ctx,text,subtitle){ctx.fillStyle='#FFF9EF';ctx.fillRect(0,0,1360,1050);ctx.fillStyle='#4B281C';ctx.font='bold 28px Segoe UI';ctx.fillText(text,30,44);ctx.font='15px Segoe UI';ctx.fillText(subtitle,30,74);}
render(resolve(out,'background-production.png'),1440,900,c=>W.drawWorldBackground(c,frame,assets),false);
render(resolve(out,'projectiles-production.png'),1360,940,c=>{
  title(c,'WORLD v1 / ACTUAL PRODUCTION VECTORS','10 explicit sourceArtId values / three motion kinds / 4x display + 1x / same runtime code');
  for(const [i,[id,s]] of Object.entries(Object.entries(shotStyles))) {
    const n=+i,x=30+(n%2)*665,y=110+Math.floor(n/2)*155;
    c.strokeStyle='#DDCFB8';c.lineWidth=1;c.strokeRect(x,y,640,140);
    c.fillStyle='#4B281C';c.font='bold 18px Segoe UI';c.fillText(id,x+16,y+27);c.font='13px Segoe UI';c.fillText('B01/'+s.cell+' / '+s.kind,x+274,y+27);
    c.save();c.translate(x+132,y+80);c.scale(4,4);W.drawWorldItem(c,item(id,0,0),frame,assets);c.restore();
    c.save();c.translate(x+309,y+80);c.scale(2,2);W.drawWorldItem(c,{kind:'feedback',x:0,y:0,sourceArtId:id,data:{type:'shot',time:1,angle:0,projectileKind:s.kind}},frame,assets);c.restore();
    W.drawWorldItem(c,item(id,x+531,y+73),frame,assets);c.font='13px Segoe UI';c.fillText('1x',x+521,y+109);
  }
},false);
render(resolve(out,'hazards-overlays-production.png'),1360,920,c=>{
  title(c,'WORLD v1 / ACTUAL GEOMETRY + INDEPENDENT EFFECTS','Root-owned terrain / exact line half-width and round caps / root shadow / real-event DTO samples');
  const f={...frame,viewport:{width:1360,height:920,dpr:1}};
  const area={...hazard,x:120,y:200,radius:65};
  const web={...area,x:370,terrain:true,label:'web',mechanicKind:'web'};
  const roots={...area,x:625,terrain:true,label:'poison',mechanicKind:'root'};
  for(const h of [area,web,roots])for(const pass of ['fill','boundary'])W.drawHazard(c,h,f,assets,pass);
  const line={...area,type:'line',x:820,y:185,x2:1190,y2:238,width:28};
  for(const pass of ['fill','boundary'])W.drawHazard(c,line,f,assets,pass);
  c.font='16px Segoe UI';c.fillStyle='#4B281C';['area','WEB radius=65 sample','ROOT same disk','line width=28 (full 56)'].forEach((s,i)=>c.fillText(s,[58,290,555,815][i],310));
  const rows=[['shadow',{}],['shield',{shield:24,maxShield:24}],['frozen',{states:{frozen:true}}],['OPEN',{states:{open:true}}],['burrow',{states:{burrowed:true}}],['phase',{states:{phased:true}}]];
  for(const [i,[name,fields]] of rows.entries()) {
    const x=100+i*220,y=430,actor={x,y,radius:18,states:{},...fields};
    W.drawActorOverlay(c,actor,{root:{x,y:y+15},bounds:{x:x-22,y:y-34,width:44,height:64}},f,assets,name==='shadow'?'shadow':'status');c.fillText(name,x-30,486);
  }
  const events=['hit','defeat','summon-success','split-success','refund'];
  for(const [i,type] of events.entries()) {
    const x=105+i*265;W.drawWorldItem(c,{kind:'feedback',x,y:595,data:{type,time:.9,projectileKind:'basic',childKeys:['success-uid'],amount:12}},f,assets);c.fillText(type,x-55,649);
  }
  W.drawPlacement(c,{x:150,y:780,radius:14,range:65,canPlace:true},f,assets);
  W.drawPlacement(c,{x:400,y:780,radius:14,range:65,canPlace:false},f,assets);
  W.drawWorldItem(c,{kind:'link',style:'root',x:555,y:775,x2:770,y2:815},f,assets);
  W.drawWorldItem(c,{kind:'drop',x:925,y:780,radius:10},f,assets);
  W.drawWorldItem(c,{kind:'impactWave',x:1175,y:780,radius:45,life:.17,maxLife:.28,style:'twinFinisher'},f,assets);
},false);
writeFileSync(resolve(out,'neutral-exports.json'),JSON.stringify({status:'produced_pending_review',renderSource:'src/view/art/world/index.js',exports,textureBytes:exports.reduce((n,e)=>n+e.textureBytes,0),runtimeTextureBytes:0,textureNote:'Export estimates only. Runtime uses precompiled local vectors, no PNG decoding.'},null,2)+'\n');
writeFileSync(resolve(out,'manifest.json'),JSON.stringify(W.worldManifest,null,2)+'\n');
console.log(JSON.stringify({exports:exports.length,previews:3,out}));
