import { P, number, isolated, handled, unsupported } from './palette.js';
import { vector, segment } from './vectors.js';

function hash(x,y,salt=0) {
  let value = Math.imul(x|0,0x45d9f3b) ^ Math.imul(y|0,0x119de1f3) ^ salt;
  value = Math.imul(value ^ (value>>>16),0x45d9f3b);
  return ((value ^ (value>>>16))>>>0)/4294967296;
}

export function drawWorldBackground(ctx, frame, assets) {
  const {width,height}=frame?.viewport ?? {};
  if (!(width>0 && height>0)) return unsupported;
  const cx=number(frame.camera?.x), cy=number(frame.camera?.y);
  const left=cx-width/2, top=cy-height/2;
  isolated(ctx,1,()=>{
    ctx.fillStyle=P.cream; ctx.fillRect(left,top,width,height);
    // One owner per cell. Include neighboring cells for mark extents/actual shaken camera.
    for(let iy=Math.floor((top-130)/225);iy<=Math.floor((top+height+130)/225);iy++) {
      for(let ix=Math.floor((left-150)/360);ix<=Math.floor((left+width+150)/360);ix++) {
        if(hash(ix,iy,17)<.8) {
          const x=ix*360+45+hash(ix,iy,31)*260, y=iy*225+40+hash(ix,iy,53)*145;
          ctx.save(); ctx.translate(x,y); ctx.rotate((hash(ix,iy,67)-.5)*.5);
          ctx.scale(60+hash(ix,iy,83)*36,45+hash(ix,iy,97)*20);
          vector(ctx,assets,hash(ix,iy,109)<.5?'patchA':'patchB',hash(ix,iy,127)<.5?P.wash:P.bone);
          ctx.restore();
        }
        if(hash(ix,iy,149)<.4) {
          const x=ix*360+30+hash(ix,iy,163)*285, y=iy*225+24+hash(ix,iy,179)*175;
          segment(ctx,x-7,y,x-10,y-6,P.grass,4.5);
          segment(ctx,x,y,x,y-10,P.grass,4.5);
          segment(ctx,x+7,y,x+10,y-6,P.grass,4.5);
        }
      }
    }
  });
  return handled;
}
