import {composeSourceTexture} from './sourceTextureMesh.js';
// Source-image coordinate remapping only. Triangles are clipping/texture maps,
// never painted character geometry. The head/gun moves rigidly; both feet stay fixed.
export function bendPoint(point,bend,delta){
 if(!bend||(!delta&&!bend.headAnchor))return [...point];const[x,y]=point,[px,py]=bend.pivot;
 const t=Math.max(0,Math.min(1,(y-bend.rigidUntil)/(bend.fixedFrom-bend.rigidUntil)));
 const weight=1-t*t*(3-2*t),angle=delta*weight,c=Math.cos(angle),s=Math.sin(angle);
 const anchor=bend.headAnchor,heading=(anchor?.sourceAxis??0)+delta;
 const shift=anchor?(anchor.target?[anchor.target[0]-px,anchor.target[1]-py]:[anchor.root[0]+anchor.referenceRadius*anchor.sideOffset*Math.cos(heading)-px,anchor.root[1]-anchor.referenceRadius*anchor.height-py]):[0,0];
 return [px+c*(x-px)-s*(y-py)+weight*shift[0],py+s*(x-px)+c*(y-py)+weight*shift[1]];
}
function textureTriangle(ctx,image,from,to,edgeOverlap=0){
 const [a,b,c]=from,[u,v,w]=to,dx1=b[0]-a[0],dy1=b[1]-a[1],dx2=c[0]-a[0],dy2=c[1]-a[1],det=dx1*dy2-dx2*dy1;
 if(Math.abs(det)<1e-8)return;
 const ax=((v[0]-u[0])*dy2-(w[0]-u[0])*dy1)/det,bx=((w[0]-u[0])*dx1-(v[0]-u[0])*dx2)/det;
 const ay=((v[1]-u[1])*dy2-(w[1]-u[1])*dy1)/det,by=((w[1]-u[1])*dx1-(v[1]-u[1])*dx2)/det;
 const sign=Math.sign((v[0]-u[0])*(w[1]-u[1])-(v[1]-u[1])*(w[0]-u[0])),clip=to.map((p,i)=>{const prev=to[(i+2)%3],next=to[(i+1)%3],dx1=p[0]-prev[0],dy1=p[1]-prev[1],dx2=next[0]-p[0],dy2=next[1]-p[1],l1=Math.hypot(dx1,dy1),l2=Math.hypot(dx2,dy2),n1=[sign*dy1/l1,-sign*dx1/l1],n2=[sign*dy2/l2,-sign*dx2/l2],factor=edgeOverlap/Math.max(.01,1+n1[0]*n2[0]+n1[1]*n2[1]);return[p[0]+(n1[0]+n2[0])*factor,p[1]+(n1[1]+n2[1])*factor]});ctx.save();ctx.beginPath();ctx.moveTo(...clip[0]);ctx.lineTo(...clip[1]);ctx.lineTo(...clip[2]);ctx.closePath();ctx.clip();ctx.transform(ax,ay,bx,by,u[0]-ax*a[0]-bx*a[1],u[1]-ay*a[0]-by*a[1]);ctx.drawImage(image,0,0);ctx.restore();
}
export function createBendMapper(bend,delta,width,height){
 const ys=[0,bend.rigidUntil,...Array.from({length:15},(_,i)=>bend.rigidUntil+(bend.fixedFrom-bend.rigidUntil)*(i+1)/16),bend.fixedFrom,height],columns=16;
 const segments=ys.slice(0,-1).map((y0,i)=>{const y1=ys[i+1],rowColumns=(y1<=bend.rigidUntil||y0>=bend.fixedFrom)?1:columns,cells=Array.from({length:rowColumns},(_,j)=>{const x0=width*j/rowColumns,x1=width*(j+1)/rowColumns;return{x0,x1,y0,y1,a:bendPoint([x0,y0],bend,delta),b:bendPoint([x1,y0],bend,delta),c:bendPoint([x0,y1],bend,delta),d:bendPoint([x1,y1],bend,delta)}});return{y0,y1,cells,a:cells[0].a,b:cells.at(-1).b,c:cells[0].c,d:cells.at(-1).d};});
 const map=([x,y])=>{if((!delta&&!bend.headAnchor)||y>=bend.fixedFrom)return[x,y];const row=segments.find(r=>y<=r.y1)??segments.at(-1),cell=row.cells[Math.max(0,Math.min(row.cells.length-1,Math.floor(x/width*row.cells.length)))],u=(x-cell.x0)/(cell.x1-cell.x0),v=(y-row.y0)/(row.y1-row.y0);const[a,b,c,d]=[cell.a,cell.b,cell.c,cell.d];return u+v<=1?[a[0]+u*(b[0]-a[0])+v*(c[0]-a[0]),a[1]+u*(b[1]-a[1])+v*(c[1]-a[1])]:[d[0]+(1-u)*(c[0]-d[0])+(1-v)*(b[0]-d[0]),d[1]+(1-u)*(c[1]-d[1])+(1-v)*(b[1]-d[1])];};
 return{segments,map,width,height,columns,delta,bend};
}
const coverageCache=new WeakMap(),sourceIds=new WeakMap(),compositions=new Map();let nextSourceId=1;
export function drawBentSource(ctx,image,mapper,target,alphaRows){
 let coverage=coverageCache.get(image);if(!coverage)coverageCache.set(image,coverage=new Map());const gridKey=mapper.segments.map(r=>`${r.y0}/${r.y1}/${r.cells.length}`).join(';');let active=coverage.get(gridKey);if(!active){active=new Set();mapper.segments.forEach((r,ri)=>r.cells.forEach((c,ci)=>{if(!alphaRows||alphaRows.some(([y,x0,x1])=>y+1>=r.y0-1&&y<=r.y1+1&&x1>=c.x0-1&&x0<=c.x1+1))active.add(`${ri}/${ci}`)}));coverage.set(gridKey,active)}
 if(!sourceIds.has(image))sourceIds.set(image,nextSourceId++);const key=`${sourceIds.get(image)}/${gridKey}/${mapper.delta}/${JSON.stringify(mapper.bend.headAnchor??null)}`;let composition=compositions.get(key);
 if(!composition){const vertices=mapper.segments.flatMap(r=>r.cells.flatMap(c=>[c.a,c.b,c.c,c.d])),ox=Math.floor(Math.min(...vertices.map(p=>p[0])))-2,oy=Math.floor(Math.min(...vertices.map(p=>p[1])))-2,w=Math.ceil(Math.max(...vertices.map(p=>p[0])))-ox+2,h=Math.ceil(Math.max(...vertices.map(p=>p[1])))-oy+2,scale=1,canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(w*scale,h*scale):Object.assign(document.createElement('canvas'),{width:w*scale,height:h*scale}),texture=canvas.getContext('2d');texture.scale(scale,scale);texture.translate(-ox,-oy);texture.imageSmoothingEnabled=true;
  const gpu=composeSourceTexture(image,mapper,active,{ox,oy,w,h});
  if(!gpu)for(const [ri,row]of mapper.segments.entries())for(const [ci,cell]of row.cells.entries()){if(!active.has(`${ri}/${ci}`))continue;const a=[cell.x0,row.y0],b=[cell.x1,row.y0],c=[cell.x0,row.y1],d=[cell.x1,row.y1];textureTriangle(texture,image,[a,b,c],[mapper.map(a),mapper.map(b),mapper.map(c)],.8);textureTriangle(texture,image,[d,c,b],[mapper.map(d),mapper.map(c),mapper.map(b)],.8)}
  composition={canvas:gpu??canvas,ox,oy,w,h};compositions.set(key,composition);while(compositions.size>12)compositions.delete(compositions.keys().next().value);
 }else{compositions.delete(key);compositions.set(key,composition)}
 ctx.drawImage(composition.canvas,target[0]+composition.ox,target[1]+composition.oy,composition.w,composition.h);
}