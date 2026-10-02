import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const owner=path.resolve(here,'../..');
const r01=path.join(owner,'submissions/r01');
const require=createRequire(import.meta.url);
const sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write=(name,data)=>fs.writeFileSync(path.join(here,name),typeof data==='string'?data:JSON.stringify(data,null,2)+'\n','utf8');
const states=['neutral','squash','stretch','attack'];
const ids=['basic','burst'];
const oldPacket=JSON.parse(fs.readFileSync(path.join(r01,'packet.json'),'utf8'));
const sealed=[...oldPacket.files.map(f=>({path:f.path,sha256:f.sha256})),{path:'submissions/r01/packet.json',sha256:hash(path.join(r01,'packet.json'))}];
function checkSealed(){for(const f of sealed)if(hash(path.join(owner,f.path))!==f.sha256)throw new Error('Sealed r01 changed '+f.path);}
checkSealed();
const sources=[];
const images=new Map();
fs.mkdirSync(path.join(here,'transparent'),{recursive:true});
for(const id of ids)for(const state of states){
  const source=path.join(r01,'previews',`${id}-${state}.svg`);
  sources.push({path:`submissions/r01/previews/${id}-${state}.svg`,sha256:hash(source)});
  const png=await sharp(source).png().toBuffer();
  const metadata=await sharp(png).metadata();
  if(metadata.width!==256||metadata.height!==256||!metadata.hasAlpha)throw new Error('Invalid raster '+id+state);
  fs.writeFileSync(path.join(here,'transparent',`${id}-${state}.png`),png);
  images.set(id+'-'+state,png);
}
const text=(x,y,value,size=18,fill='#4B281C')=>`<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" fill="${fill}">${value}</text>`;
const background=(w,h,markup)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#FFF9EF"/>${markup}</svg>`);
const composites=[];
let labels=text(28,40,'GEOGUARD / BASIC + BURST / R01 EXACT VECTOR RASTERS',25)+text(28,72,'Unapproved feasibility studies. No source edits. Root guides are review overlays only.',16);
for(let col=0;col<4;col++)labels+=text(166+col*276,112,states[col].toUpperCase(),16);
for(let row=0;row<2;row++){
  const id=ids[row],y=142+row*290;
  labels+=text(26,y+126,id.toUpperCase(),18);
  for(let col=0;col<4;col++){
    const x=122+col*276;
    labels+=`<rect x="${x}" y="${y}" width="256" height="256" rx="10" fill="#FFFCF7" stroke="#D8C8B7"/><path d="M${x+10} ${y+224} H${x+246}" stroke="#BAA991" stroke-dasharray="4 5"/><path d="M${x+128} ${y+218} V${y+230} M${x+122} ${y+224} H${x+134}" stroke="#8E9B77" stroke-width="1.5"/>`;
    composites.push({input:images.get(id+'-'+states[col]),left:x,top:y});
  }
}
labels+=text(28,756,'BODY / FACE / FEET + RIGID LAUNCHER. No shadow, projectile, HP, summon or gameplay change.',15);
await sharp(background(1248,780,labels)).composite(composites).png().toFile(path.join(here,'poses-contact-sheet.png'));

const smallComposite=[];
let smallLabels=text(28,40,'GEOGUARD / SMALL-SIZE REVIEW / R01 EXACT SVG SOURCES',25)+text(28,72,'48 / 64 / 96 output pixels. Four state columns. Alpha composited onto cream for review.',16);
for(let col=0;col<4;col++)smallLabels+=text(186+col*245,110,states[col].toUpperCase(),16);
for(let idIndex=0;idIndex<2;idIndex++)for(let sizeIndex=0;sizeIndex<3;sizeIndex++){
  const id=ids[idIndex],size=[48,64,96][sizeIndex],row=idIndex*3+sizeIndex,y=140+row*124;
  smallLabels+=text(26,y+59,`${id.toUpperCase()} / ${size}px`,16);
  for(let col=0;col<4;col++){
    const x=174+col*245,top=y+(108-size),left=x+Math.round((150-size)/2);
    smallLabels+=`<rect x="${x}" y="${y}" width="150" height="110" rx="8" fill="#FFFCF7" stroke="#D8C8B7"/>`;
    smallComposite.push({input:await sharp(path.join(r01,'previews',`${id}-${states[col]}.svg`)).resize(size,size).png().toBuffer(),left,top});
  }
}
smallLabels+=text(28,918,'These 2 identities are studies, not all48 production body completion or continuous-animation approval.',15);
await sharp(background(1190,944,smallLabels)).composite(smallComposite).png().toFile(path.join(here,'small-contact-sheet.png'));
checkSealed();
write('source-manifest.json',{revision:'r02',r01PacketSha256:sealed.at(-1).sha256,renderer:{name:'sharp',version:sharp.versions.sharp,engine:sharp.versions.rsvg,node:process.version},sourceSVGs:sources,sealedR01FileChecks:sealed.length,sealedR01Unchanged:true,conversion:'direct rasterization; all8 original SVGs read only; no browser and no image generation'});
write('verification.json',{status:'raster_export_verified_not_art_approval',sourceSVGCount:8,transparentPNGs:8,contactSheets:2,transparentOutputSize:[256,256],smallSizes:[48,64,96],identities:['tower:BASIC','tower:BURST'],states,sealedR01Unchanged:true,runtimeModifiedByThisOwner:false,visualReview:'see visual-review.md after direct view_image inspection',productionCompleted:0});
console.log(JSON.stringify({renderer:sharp.versions.sharp,transparent:8,contactSheets:2,r01Unchanged:true},null,2));
