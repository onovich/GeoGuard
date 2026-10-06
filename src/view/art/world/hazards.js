import { P, clamp, finitePoint, number, isolated, handled, unsupported } from './palette.js';
import {sourceImage} from './sourcePixels.js';

// Finite segment Minkowski disk; zero-length segment naturally becomes a circle.
function capsule(ctx,h,r) {
  const x2=number(h.x2,h.x),y2=number(h.y2,h.y),a=Math.atan2(y2-h.y,x2-h.x);
  ctx.beginPath();
  ctx.moveTo(h.x+Math.cos(a-Math.PI/2)*r,h.y+Math.sin(a-Math.PI/2)*r);
  ctx.lineTo(x2+Math.cos(a-Math.PI/2)*r,y2+Math.sin(a-Math.PI/2)*r);
  ctx.arc(x2,y2,r,a-Math.PI/2,a+Math.PI/2);
  ctx.lineTo(h.x+Math.cos(a+Math.PI/2)*r,h.y+Math.sin(a+Math.PI/2)*r);
  ctx.arc(h.x,h.y,r,a+Math.PI/2,a+Math.PI*1.5);
  ctx.closePath();
}

function footprint(ctx,h,inset=0) {
  if(h.type==='area') {ctx.beginPath();ctx.arc(h.x,h.y,Math.max(0,h.radius-inset),0,Math.PI*2);}
  else capsule(ctx,h,Math.max(0,h.width-inset));
}

function terrainAccents(ctx,h,assets) {
  if(h.type!=='area')return;
  const key=h.label==='web'||h.label==='silk'?'web-terrain':h.mechanicKind==='root'?'root-terrain':null;
  if(!key)return; // No invented ROOT identity for generic poison hazards.
  ctx.save();footprint(ctx,h);ctx.clip();ctx.globalAlpha*=.45;
  sourceImage(ctx,assets,'world:'+key,h.x,h.y,h.radius*2,h.radius*2);ctx.restore();
}

export function drawHazard(ctx,h,frame,assets,pass) {
  if(assets?.onSourceDraw)assets={...assets,sourceContext:{kind:'hazard',key:h.key,type:h.type,label:h.label,position:[h.x,h.y],pass}};
  if(!finitePoint(h) || !['area','line'].includes(h.type) || !(h.timer>0) || !['fill','boundary'].includes(pass)) return unsupported;
  const radius=h.type==='area'?h.radius:h.width;
  if(!(Number.isFinite(radius)&&radius>0) || (h.type==='line' && !finitePoint({x:h.x2,y:h.y2}))) return unsupported;
  const urgency=1-clamp(h.timer/(h.maxTimer>0?h.maxTimer:h.timer));
  isolated(ctx,1,()=>{
    if(pass==='fill') {
      footprint(ctx,h);ctx.fillStyle=P.danger;ctx.globalAlpha*=.065+urgency*.085;ctx.fill();
      ctx.globalAlpha/= .065+urgency*.085;
      terrainAccents(ctx,h,assets);
      if(h.type==='area' && h.pulsesRemaining>1) {
        ctx.save();footprint(ctx,h);ctx.clip();ctx.globalAlpha*=.26;
        sourceImage(ctx,assets,'world:hazard-pulse-inner',h.x,h.y,h.radius*1.48,h.radius*1.48);ctx.restore();
      }
    } else {
      // Inset stroke center ensures outer stroke edge never exceeds logical footprint.
      const rim=Math.min(radius,1.5+urgency*.8);
      footprint(ctx,h,rim/2);ctx.lineWidth=rim;ctx.strokeStyle=P.danger;
      ctx.globalAlpha*=.65+urgency*.35;
      ctx.setLineDash(urgency>.83?[]:[Math.max(4,radius*.12),Math.max(3,radius*.08)]);
      ctx.stroke();
    }
  });
  return handled;
}
