import { P, clamp, finitePoint, number, isolated, lifeAlpha, handled, unsupported, missing } from './palette.js';
import { vector, ellipse, segment } from './vectors.js';
import { getShotStyle } from './projectiles.js';

function flashAt(ctx,x,y,angle,kind,source,assets,scale=1) {
  const style=getShotStyle(source,kind) ?? getShotStyle(null,'basic');
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale((kind==='cannon'?11:kind==='sniper'?9:7)*scale,(kind==='cannon'?11:kind==='sniper'?9:7)*scale);
  vector(ctx,assets,kind==='sniper'?'star':'flash',source==='tower:FROST'?P.ice:P.honey,source==='tower:FROST'?P.iceEdge:P.ink,.08);
  if(kind!=='sniper') ellipse(ctx,.73,0,.38,.28,source==='tower:FROST'?'#E6F5FF':'#FFE9B4');
  ctx.restore();
  return style;
}

export function drawDrop(ctx,item,frame,assets) {
  if(!finitePoint(item) || !(item.radius>0)) return unsupported;
  isolated(ctx,lifeAlpha(item),()=>{
    ctx.translate(item.x,item.y);ctx.scale(item.radius,item.radius);
    vector(ctx,assets,'diamond',P.mint);
    ctx.fillStyle='#88C9A8';ctx.beginPath();ctx.moveTo(0,-.78);ctx.lineTo(.59,0);ctx.lineTo(0,.7);ctx.fill();
    segment(ctx,-.46,-.08,-.06,-.57,'#E5F7E8',.1);
    vector(ctx,assets,'diamond',null,P.green,Math.max(.07,.65/item.radius));
  });return handled;
}

export function drawParticle(ctx,item,frame,assets) {
  if(!finitePoint(item)) return unsupported;
  const size=Math.max(.5,number(item.data?.size,number(item.radius,2)));
  isolated(ctx,lifeAlpha(item),()=>{
    ctx.translate(item.x,item.y);ctx.rotate(number(item.angle,Math.atan2(number(item.data?.vy),number(item.data?.vx))));
    ctx.scale(size*.85,size);
    vector(ctx,assets,item.style==='leaf'?'leaf':'chip',item.style==='leaf'?P.mint:P.coral,frame?.quality==='reduced'?null:'#895344',.2);
  });return handled;
}

function ring(ctx,x,y,r,color,width=1.7,fillAlpha=0) {
  if(fillAlpha>0) {ctx.save();ctx.globalAlpha*=clamp(fillAlpha);ellipse(ctx,x,y,r,r,color);ctx.restore();}
  ellipse(ctx,x,y,r,r,null,color,width);
}

export function drawImpactWave(ctx,item,frame,assets) {
  if(!finitePoint(item) || !(item.radius>=0)) return unsupported;
  const data=item.data??{}, r=item.radius;
  isolated(ctx,lifeAlpha(item),()=>{
    if(Array.isArray(data.dash))ctx.setLineDash(data.dash.filter(v=>Number.isFinite(v)&&v>=0).slice(0,12));
    const color=item.sourceArtId ? getShotStyle(item.sourceArtId,data.kind)?.fill ?? P.honeyShade : P.honeyShade;
    ring(ctx,item.x,item.y,r,color,Math.min(3,Math.max(1,number(data.lineWidth,1.7))),number(data.fillAlpha,.04));
    ctx.setLineDash([]);
    if(frame?.quality==='reduced') return;
    const style=item.style ?? data.style;
    if(style==='twinFinisher') {
      ctx.save();ctx.translate(item.x,item.y);ctx.rotate(number(data.rotation));
      for(let part=0;part<2;part++) {
        ctx.beginPath();
        for(let i=0;i<=32;i++) {
          const a=part*Math.PI+i*Math.PI/32;
          const x=Math.cos(a)*r*.78,y=Math.sin(a*2)*r*.24;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }ctx.strokeStyle=part?P.lavender:P.mint;ctx.lineWidth=2;ctx.stroke();
      }ctx.restore();
    } else if(style==='dragonFinisher') {
      for(let row=-1;row<=1;row++) {
        ctx.beginPath();
        for(let i=0;i<=24;i++) {const x=item.x-r*.7+i*r*1.4/24,y=item.y+Math.sin(i/24*Math.PI*2)*r*.1+row*r*.19;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
        ctx.strokeStyle=P.honeyShade;ctx.lineWidth=2;ctx.stroke();
      }
    } else if(style==='spiderFinisher' || style==='astrolabeFinisher') {
      const nodes=style==='spiderFinisher'?7:8;
      for(let i=0;i<nodes;i++) {
        const a=i*Math.PI*2/nodes+number(data.rotation);
        const x=item.x+Math.cos(a)*r*.78,y=item.y+Math.sin(a)*r*(style==='astrolabeFinisher'?.4:.78);
        if(style==='spiderFinisher')segment(ctx,item.x,item.y,x,y,P.purple,1);
        ellipse(ctx,x,y,2.1,2.1,style==='spiderFinisher'?P.lavender:P.ice,P.iceEdge,.8);
      }
    } else {
      const count=Math.min(24,Math.max(0,Math.round(number(data.spokes))));
      for(let i=0;i<count;i++) {
        const a=i*Math.PI*2/count+number(data.rotation);
        segment(ctx,item.x+Math.cos(a)*r*.55,item.y+Math.sin(a)*r*.55,item.x+Math.cos(a)*r*.88,item.y+Math.sin(a)*r*.88,color,1);
      }
    }
  });return handled;
}

function drawHit(ctx,x,y,kind,source,t,assets) {
  const scale=.55+Math.sin(Math.PI*t)*.6;
  if(kind==='sniper')flashAt(ctx,x-9*scale,y,0,'sniper',source,assets,scale);
  else if(kind==='cannon') {
    ring(ctx,x,y,7+12*t,P.mintShade,1.7,.06);
    ctx.save();ctx.setLineDash([5,4]);ring(ctx,x,y,10+16*t,P.mint,1.3);ctx.restore();
  } else {
    for(let i=0;i<4;i++) {
      const a=i*Math.PI/2,r=7*scale;
      ctx.save();ctx.translate(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.rotate(a);ctx.scale(4.2*scale,2.4*scale);
      vector(ctx,assets,'seed',P.honey,P.green,.2);ctx.restore();
    }
  }
}

export function drawFeedback(ctx,item,frame,assets) {
  const event=item.data ?? {}, type=event.type;
  const position=finitePoint(item)?item:event.position;
  if(!finitePoint(position)) return missing;
  const defaultDuration={shot:.11,hit:.18,defeat:.42,'summon-success':.28,'split-success':.28,refund:.48}[type];
  if(!defaultDuration) return unsupported;
  const duration=item.maxLife>0?item.maxLife:defaultDuration;
  const age=Math.max(0,number(frame?.time)-number(event.time,number(frame?.time)));
  if(age>=duration) return handled;
  const t=age/duration, alpha=Number.isFinite(item.alpha)||item.maxLife>0?lifeAlpha(item):1-t,source=item.sourceArtId??event.sourceArtId;
  const kind=event.projectileKind??getShotStyle(source)?.kind??'basic';
  if(['summon-success','split-success'].includes(type) && !event.childKeys?.length) return missing;
  if(type==='refund' && !(event.amount>0)) return missing;
  isolated(ctx,alpha,()=>{
    const x=position.x,y=position.y;
    if(type==='shot') {
      const muzzles=item.anchors?.muzzles;
      const muzzle=muzzles?.length?muzzles[Math.max(0,number(event.shotIndex,item.shotIndex??0))%muzzles.length]:null;
      const at=finitePoint(muzzle)?muzzle:position;
      flashAt(ctx,at.x,at.y,number(muzzle?.axisAngle,number(event.angle,item.angle??0)),kind,source,assets,.85+.15*Math.sin(t*Math.PI));
    } else if(type==='hit')drawHit(ctx,x,y,kind,source,t,assets);
    else if(type==='defeat') {
      const count=frame?.quality==='reduced'?4:7;
      for(let i=0;i<count;i++) {
        const a=i*Math.PI*2/count,r=3+t*19;
        ctx.save();ctx.translate(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.rotate(a);ctx.scale(2.3*(1-t*.4),3);
        vector(ctx,assets,'chip',P.coral,'#895344',.2);ctx.restore();
      }
    } else if(type==='refund') {
      // The actual amount is handled by HUD/floating text; no new pickup object.
      ring(ctx,x,y,7+t*12,P.mintShade,1.6);
      for(let i=0;i<4;i++) {const a=i*Math.PI/2;segment(ctx,x+Math.cos(a)*12,y+Math.sin(a)*12,x+Math.cos(a)*16,y+Math.sin(a)*16,P.green,1.5);}
    } else {
      ring(ctx,x,y,7+13*t,P.mintShade,2);
      if(frame?.quality!=='reduced')for(let i=0;i<5;i++) {
        const a=i*Math.PI*2/5,r=12+10*t;
        ctx.save();ctx.translate(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.rotate(a);ctx.scale(1.8,3.2);
        vector(ctx,assets,'leaf',P.mint);ctx.restore();
      }
    }
  });return handled;
}

export function drawLink(ctx,item,frame,assets) {
  const from=item.data?.from ?? item, to=item.data?.to ?? {x:item.x2,y:item.y2};
  if(!finitePoint(from)||!finitePoint(to))return unsupported;
  const style=item.style??item.data?.type;
  const root=style==='root',target=['target','seal','reticle','windup'].includes(style);
  isolated(ctx,lifeAlpha(item)*.6,()=>{
    if(root) {
      const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy);
      if(!len)return;
      for(let side=-1;side<=1;side+=2) {
        ctx.beginPath();
        for(let i=0;i<=16;i++) {
          const t=i/16,off=Math.sin(t*Math.PI*2)*4*side;
          const x=from.x+dx*t-dy/len*off,y=from.y+dy*t+dx/len*off;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        }ctx.strokeStyle=P.mintShade;ctx.lineWidth=1.5;ctx.stroke();
      }
    } else {
      ctx.setLineDash([4,5]);segment(ctx,from.x,from.y,to.x,to.y,target?P.coralShade:P.sage,1.2);
      ctx.setLineDash([]);ellipse(ctx,to.x,to.y,5,5,null,target?P.coralShade:P.sage,1.2);
    }
  });return handled;
}
