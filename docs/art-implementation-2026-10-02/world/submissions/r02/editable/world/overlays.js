import { P, clamp, finitePoint, number, isolated, handled, unsupported, missing } from './palette.js';
import { ellipse, segment } from './vectors.js';

function brackets(ctx,x,y,r,color,width=2) {
  ctx.strokeStyle=color;ctx.lineWidth=width;
  for(const start of [-Math.PI*.31,Math.PI*.69]) {
    ctx.beginPath();ctx.arc(x,y,r,start,start+Math.PI*.62);ctx.stroke();
  }
}

export function drawActorOverlay(ctx,actor,anchors,frame,assets,pass) {
  if(!finitePoint(actor) || !['shadow','status'].includes(pass)) return unsupported;
  const r=Math.max(1,number(actor.radius,12)),s=actor.states ?? {};
  isolated(ctx,actor.alpha??1,()=>{
    if(pass==='shadow') {
      if(!finitePoint(anchors?.root) || s.burrowed) return;
      const {x,y}=anchors.root;
      const rx=r*.88,ry=Math.max(2,r*.28);
      // Gradient maps with the same ellipse transform, separate from body/movement squash.
      ctx.save();ctx.translate(x,y);ctx.scale(1,ry/rx);
      const g=ctx.createRadialGradient(0,0,0,0,0,rx);
      g.addColorStop(0,'rgba(113,77,50,0.27)');g.addColorStop(.65,'rgba(139,108,73,0.13)');g.addColorStop(1,'rgba(139,108,73,0)');
      ellipse(ctx,0,0,rx,rx,g);ctx.restore();return;
    }
    if(actor.shield>0) {
      ctx.save();ctx.globalAlpha*=.55+.35*clamp(actor.shield/Math.max(actor.maxShield??0,actor.shield));
      brackets(ctx,actor.x,actor.y,r+4,P.sage,2.6);ctx.restore();
    }
    if(s.slowed) {
      ctx.save();ctx.setLineDash([5,3]);ellipse(ctx,actor.x,actor.y+r*.35,r+3,(r+3)*.43,null,P.iceShade,1.5);ctx.restore();
    }
    if(s.frozen) { brackets(ctx,actor.x,actor.y,r+5,P.iceShade,3);brackets(ctx,actor.x,actor.y,r+7,P.iceEdge,1); }
    if(s.armored) {
      ctx.beginPath();ctx.arc(actor.x,actor.y,r+4,Math.PI*1.1,Math.PI*1.9);ctx.strokeStyle='#87907A';ctx.lineWidth=3;ctx.stroke();
    }
    if(s.jammed) {
      for(const side of [-1,1]) {
        ctx.beginPath();
        for(let i=0;i<=12;i++) {const x=actor.x+side*(r+5+i*.55),y=actor.y+Math.sin(i/12*Math.PI*3)*2;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
        ctx.strokeStyle=P.purple;ctx.lineWidth=1.5;ctx.stroke();
      }
    }
    if(s.open) {
      // Whole-body vulnerability: envelope from measured body bounds, never paired belly targets.
      const b=anchors?.bounds;
      const valid=b && finitePoint(b) && b.width>0 && b.height>0;
      const x=valid?b.x+b.width/2:actor.x,y=valid?b.y+b.height/2:actor.y;
      const rx=valid?b.width*.58+3:r+8,ry=valid?b.height*.58+3:r+8;
      ctx.save();ctx.globalAlpha*=.08;ellipse(ctx,x,y,rx,ry,P.honey);ctx.restore();
      ellipse(ctx,x,y,rx,ry,null,'#DEAA50',2.1);
      ctx.save();ctx.globalAlpha*=.4;ellipse(ctx,x,y,rx+2.5,ry+2.5,null,P.honeyShade,1);ctx.restore();
      for(let i=0;i<8;i++) {
        const a=i*Math.PI/4;
        segment(ctx,x+Math.cos(a)*(rx+5),y+Math.sin(a)*(ry+5),x+Math.cos(a)*(rx+8),y+Math.sin(a)*(ry+8),'#DEAA50',1.6);
      }
    }
    if(s.partnerFallen) {
      brackets(ctx,actor.x,actor.y,r+8,P.danger,2.8);
      for(const a of [-.6,.6,Math.PI-.6,Math.PI+.6]) segment(ctx,actor.x+Math.cos(a)*(r+11),actor.y+Math.sin(a)*(r+11),actor.x+Math.cos(a)*(r+15),actor.y+Math.sin(a)*(r+15),P.danger,2);
    }
    if(s.phased) {ctx.save();ctx.globalAlpha*=.3;ctx.setLineDash([2,5]);ellipse(ctx,actor.x,actor.y,r+3,r+3,null,P.coral,1.4);ctx.restore();}
    if(s.burrowed) {
      const root=finitePoint(anchors?.root)?anchors.root:actor;
      ellipse(ctx,root.x,root.y,r*1.1,r*.3,'#D6BDA2');ellipse(ctx,root.x,root.y,r*.62,r*.12,'#997556');
      for(let i=0;i<4;i++) ellipse(ctx,root.x-r+i*r*.64,root.y-r*.2-(i%2)*2,1.6,1.2,'#B39170');
    }
    if(actor.hitFlash>0) {
      ctx.save();ctx.globalAlpha*=clamp(actor.hitFlash)*.7;
      for(let i=0;i<4;i++) {
        const a=i*Math.PI/2+Math.PI/4;
        segment(ctx,actor.x+Math.cos(a)*(r+2),actor.y+Math.sin(a)*(r+2),actor.x+Math.cos(a)*(r+5),actor.y+Math.sin(a)*(r+5),P.honeyShade,1.5);
      }ctx.restore();
    }
    if(actor.pose==='intro') {
      ctx.save();ctx.globalAlpha*=.5;ctx.setLineDash([7,4]);ellipse(ctx,actor.x,actor.y,r+10,r+10,null,P.honeyShade,2);ctx.restore();
    }
  });
  return pass==='shadow'&&!finitePoint(anchors?.root)?missing:handled;
}

export function drawPlacement(ctx,placement,frame,assets) {
  if(!finitePoint(placement) || !(placement.range>0)) return unsupported;
  const valid=placement.canPlace===true,color=valid?'#69A983':P.coralShade;
  isolated(ctx,placement.alpha??.8,()=>{
    ctx.save();ctx.globalAlpha*=.12;ellipse(ctx,placement.x,placement.y,placement.range,placement.range,valid?P.mint:P.coral);ctx.restore();
    ctx.setLineDash([6,5]);ellipse(ctx,placement.x,placement.y,placement.range,placement.range,null,color,1.6);
    ctx.setLineDash([]);
    if(placement.radius>0) {ctx.save();ctx.globalAlpha*=.4;ellipse(ctx,placement.x,placement.y,placement.radius,placement.radius,null,color,1);ctx.restore();}
    const x=placement.x+number(placement.radius,14)+6,y=placement.y+number(placement.radius,14)+6;
    ellipse(ctx,x,y,7,7,valid?'#69A983':P.coralShade);
    if(valid) {segment(ctx,x-3,y,x-1,y+2,P.white,1.8);segment(ctx,x-1,y+2,x+3,y-3,P.white,1.8);}
    else {segment(ctx,x-2.5,y-2.5,x+2.5,y+2.5,P.white,1.8);segment(ctx,x-2.5,y+2.5,x+2.5,y-2.5,P.white,1.8);}
  });
  return handled;
}
