import { P, finitePoint, number, isolated, lifeAlpha, handled, unsupported } from './palette.js';
import { shotStyles } from './manifest.js';
import { vector, ellipse, segment } from './vectors.js';

export function getShotStyle(sourceArtId,kind='basic') {
  return shotStyles[sourceArtId] ?? ({basic:shotStyles['tower:BASIC'],cannon:shotStyles['tower:CANNON'],sniper:shotStyles['tower:SNIPER']}[kind]);
}

export function drawProjectile(ctx,item,frame,assets) {
  if(!finitePoint(item)) return unsupported;
  const s=getShotStyle(item.sourceArtId,item.data?.kind ?? item.style ?? 'basic');
  if(!s) return unsupported;
  const radius=Math.max(.5,number(item.radius,s.kind==='cannon'?7:s.kind==='sniper'?3:4));
  const vx=number(item.data?.vx), vy=number(item.data?.vy);
  const angle=vx || vy ? Math.atan2(vy,vx) : number(item.angle);
  isolated(ctx,lifeAlpha(item),()=>{
    if(s.kind==='sniper' && finitePoint({x:item.data?.previousX,y:item.data?.previousY})) {
      ctx.save(); ctx.globalAlpha*=.35;
      segment(ctx,item.data.previousX,item.data.previousY,item.x,item.y,s.fill,Math.max(1,radius*.7));
      ctx.restore();
    }
    ctx.translate(item.x,item.y); ctx.rotate(angle); ctx.scale(radius*s.rx,radius*s.ry);
    vector(ctx,assets,s.shape,s.fill);
    ctx.save();
    // Clip facets/tip to the authored silhouette. No square corners or outline gaps.
    const path=assets?.paths?.[s.shape];
    if(path) ctx.clip(path); else { vector(ctx,assets,s.shape); ctx.clip(); }
    if(s.shape==='lance') {
      ctx.fillStyle=s.shade; ctx.beginPath(); ctx.moveTo(-.6,-.12); ctx.lineTo(.62,0);ctx.lineTo(-.42,.48);ctx.fill();
      segment(ctx,-.52,-.23,.27,-.35,P.white,.16);
    } else {
      ellipse(ctx,.08,.15,.7,.63,s.shade);
      if(s.coralTip) {ctx.fillStyle=P.coral;ctx.fillRect(.52,-1,1,2);}
      ellipse(ctx,-.25,-.32,.36,.17,P.white);
    }
    ctx.restore();
    vector(ctx,assets,s.shape,null,P.ink,Math.max(.07,.7/(radius*Math.max(s.rx,s.ry))));
  });
  return handled;
}
