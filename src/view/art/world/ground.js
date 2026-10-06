import {number,handled,unsupported,missing} from './palette.js';
const basePatterns=new WeakMap(),chunkCaches=new WeakMap();const CHUNK=512,MAX_CHUNKS=16;
function hash(x,y,salt=0) {
  let value = Math.imul(x|0,0x45d9f3b) ^ Math.imul(y|0,0x119de1f3) ^ salt;
  value = Math.imul(value ^ (value>>>16),0x45d9f3b);
  return ((value ^ (value>>>16))>>>0)/4294967296;
}

function paintGround(ctx,sources,left,top,width,height){const base=sources['ground:cream-base-tile'];let pattern=basePatterns.get(ctx);if(!pattern){pattern=ctx.createPattern(base,'repeat');basePatterns.set(ctx,pattern)}
    ctx.fillStyle=pattern; ctx.fillRect(left,top,width,height);
    // One owner per cell. Include neighboring cells for mark extents/actual shaken camera.
    for(let iy=Math.floor((top-130)/225);iy<=Math.floor((top+height+130)/225);iy++) {
      for(let ix=Math.floor((left-150)/360);ix<=Math.floor((left+width+150)/360);ix++) {
        if(hash(ix,iy,17)<.8) {
          const x=ix*360+45+hash(ix,iy,31)*260, y=iy*225+40+hash(ix,iy,53)*145;
          ctx.save(); ctx.translate(x,y); ctx.rotate((hash(ix,iy,67)-.5)*.5);
          const patch=sources[hash(ix,iy,109)<.5?'ground:mint-patch':'ground:cream-patch'];
          if(patch){const w=110+hash(ix,iy,83)*40,h=w*patch.height/patch.width;ctx.drawImage(patch,-w/2,-h/2,w,h)}
          ctx.restore();
        }

      }
    }
    // Grass has its own finer sparse lattice: patch cells must not create grass-free windows.
    for(let gy=Math.floor((top-24)/180);gy<=Math.floor((top+height+24)/180);gy++){
      for(let gx=Math.floor((left-24)/240);gx<=Math.floor((left+width+24)/240);gx++){
        if(hash(gx,gy,149)>=.55)continue;
        const x=gx*240+25+hash(gx,gy,163)*185,y=gy*180+24+hash(gx,gy,179)*132;
        const grass=sources[hash(gx,gy,181)<.5?'ground:grass-a':'ground:grass-b'];
        if(grass){const w=24,h=w*grass.height/grass.width;ctx.drawImage(grass,x-w/2,y-h,w,h)}
      }
    }
}
export function drawWorldBackground(ctx,frame,assets){const{width,height}=frame?.viewport??{};if(!(width>0&&height>0))return unsupported;const sources=assets?.originalEffects;if(!sources?.['ground:cream-base-tile'])return missing;let cache=chunkCaches.get(sources);if(!cache){cache=new Map();chunkCaches.set(sources,cache)}const left=number(frame.camera?.x)-width/2,top=number(frame.camera?.y)-height/2;ctx.save();ctx.globalAlpha=1;for(let iy=Math.floor(top/CHUNK);iy<=Math.floor((top+height)/CHUNK);iy++)for(let ix=Math.floor(left/CHUNK);ix<=Math.floor((left+width)/CHUNK);ix++){const key=ix+'/'+iy;let tile=cache.get(key);if(!tile){tile=typeof OffscreenCanvas==='function'?new OffscreenCanvas(CHUNK,CHUNK):Object.assign(document.createElement('canvas'),{width:CHUNK,height:CHUNK});const local=tile.getContext('2d');local.translate(-ix*CHUNK,-iy*CHUNK);paintGround(local,sources,ix*CHUNK,iy*CHUNK,CHUNK,CHUNK);cache.set(key,tile);while(cache.size>MAX_CHUNKS)cache.delete(cache.keys().next().value)}else{cache.delete(key);cache.set(key,tile)}ctx.drawImage(tile,ix*CHUNK,iy*CHUNK)}ctx.restore();if(assets.onSourceDependency)for(const key of['ground:cream-base-tile','ground:mint-patch','ground:cream-patch','ground:grass-a','ground:grass-b'])assets.onSourceDependency({key,mode:'original-png-world-chunk-cache-dependency',role:'dependency-not-visible-paint-count',sourceContext:assets.sourceContext??null});return handled}
export const groundCacheBudget={chunkWorldSize:CHUNK,maxChunks:MAX_CHUNKS,maxBackingRGBABytes:CHUNK*CHUNK*4*MAX_CHUNKS,scope:'bounded source-pixel composed surfaces; theoretical backing size, not measured memory'};
