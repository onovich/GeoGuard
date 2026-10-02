import { P, clamp, finitePoint, number, isolated, handled, unsupported } from './palette.js';
import { segment, ellipse } from './vectors.js';

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

function terrainAccents(ctx,h) {
  if(!h.terrain || h.type!=='area') return;
  ctx.save(); footprint(ctx,h); ctx.clip(); ctx.globalAlpha*=.48;
  const r=h.radius;
  if(h.label==='web' || h.label==='silk') {
    for(let i=0;i<7;i++) {
      const a=i*Math.PI*2/7;
      segment(ctx,h.x,h.y,h.x+Math.cos(a)*r,h.y+Math.sin(a)*r,P.purple,1.2);
    }
    for(const scale of [.33,.63,.88]) {
      ctx.beginPath();
      for(let i=0;i<=7;i++) {
        const a=i*Math.PI*2/7,b=a+Math.PI/7;
        if(i===0)ctx.moveTo(h.x+Math.cos(a)*r*scale,h.y+Math.sin(a)*r*scale);
        else ctx.quadraticCurveTo(h.x+Math.cos(b-Math.PI*2/7)*r*scale*.72,h.y+Math.sin(b-Math.PI*2/7)*r*scale*.72,h.x+Math.cos(a)*r*scale,h.y+Math.sin(a)*r*scale);
      }
      ctx.strokeStyle=P.purple;ctx.lineWidth=1;ctx.stroke();
    }
  } else if(h.mechanicKind==='root') {
    // Owner identity resolved by integration, never inferred from the generic poison label.
    for(let i=0;i<6;i++) {
      const a=i*Math.PI/3,dx=Math.cos(a),dy=Math.sin(a);
      const mid={x:h.x+dx*r*.38-dy*r*.08,y:h.y+dy*r*.38+dx*r*.08};
      const end={x:h.x+dx*r*.87,y:h.y+dy*r*.87};
      ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.quadraticCurveTo(mid.x-dy*r*.13,mid.y+dx*r*.13,mid.x,mid.y);ctx.quadraticCurveTo(end.x-dx*r*.2+dy*r*.13,end.y-dy*r*.2-dx*r*.13,end.x,end.y);
      ctx.strokeStyle=P.purple;ctx.lineWidth=1.6;ctx.stroke();
      for(const [distance,side] of [[.4,1],[.64,-1]]) {
        const x=h.x+dx*r*distance,y=h.y+dy*r*distance;
        segment(ctx,x,y,x+dx*r*.13-dy*r*.16*side,y+dy*r*.13+dx*r*.16*side,P.purple,1.1);
      }
    }
  } else {
    // Generic poison/spore decoration. ROOT-specific identity is not inferred from poison label.
    for(let i=0;i<8;i++) {
      const a=i*Math.PI*2/8, distance=r*(i%2?.6:.35);
      ellipse(ctx,h.x+Math.cos(a)*distance,h.y+Math.sin(a)*distance,2.2,1.5,P.purple);
    }
  }
  ctx.restore();
}

export function drawHazard(ctx,h,frame,assets,pass) {
  if(!finitePoint(h) || !['area','line'].includes(h.type) || !(h.timer>0) || !['fill','boundary'].includes(pass)) return unsupported;
  const radius=h.type==='area'?h.radius:h.width;
  if(!(Number.isFinite(radius)&&radius>0) || (h.type==='line' && !finitePoint({x:h.x2,y:h.y2}))) return unsupported;
  const urgency=1-clamp(h.timer/(h.maxTimer>0?h.maxTimer:h.timer));
  isolated(ctx,1,()=>{
    if(pass==='fill') {
      footprint(ctx,h);ctx.fillStyle=P.danger;ctx.globalAlpha*=.065+urgency*.085;ctx.fill();
      ctx.globalAlpha/= .065+urgency*.085;
      terrainAccents(ctx,h);
      if(h.type==='area' && h.pulsesRemaining>1) {
        ctx.save();footprint(ctx,h);ctx.clip();ctx.globalAlpha*=.26;
        ctx.setLineDash([4,7]);ellipse(ctx,h.x,h.y,h.radius*.43,h.radius*.43,null,P.purple,1);
        ellipse(ctx,h.x,h.y,h.radius*.68,h.radius*.68,null,P.mintShade,1);ctx.restore();
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
