import {isSafeCentreEmission,recordSourceSuppression} from './sourceBirthVisibility.js';
import { P, clamp, finitePoint, number, isolated, lifeAlpha, handled, unsupported, missing } from './palette.js';
import { sourceImage } from './sourcePixels.js';
import { getShotStyle } from './projectiles.js';

function flashAt(ctx,x,y,angle,kind,source,assets,scale=1) {
  const style=getShotStyle(source,kind) ?? getShotStyle(null,'basic');
  const id=source??({basic:'tower:BASIC',cannon:'tower:CANNON',sniper:'tower:SNIPER'}[kind]??'tower:BASIC');
  const image=assets?.originalEffects?.[id+'|flash'];if(!image)return null;
  const width=(kind==='cannon'?22:kind==='sniper'?18:14)*scale,height=width*image.height/image.width;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(image,0,-height/2,width,height);ctx.restore();
  if(assets.onSourceDraw)try{assets.onSourceDraw({key:id+'|flash',mode:'image',context:assets.sourceContext??null,resource:image.src,x,y,width,height,angle,alpha:ctx.globalAlpha})}catch{}
  return style;
}

const chips=['chip-coral-a','chip-coral-b','chip-brown','chip-coral-c'];
function chipKey(item) {
  const text=String(item.key??item.id??item.style??'chip');
  let hash=0;for(const character of text)hash=(hash*31+character.charCodeAt(0))>>>0;
  return chips[hash%chips.length];
}
export function drawDrop(ctx,item,frame,assets) {
  if(!finitePoint(item)||!(item.radius>0))return unsupported;
  // Every independent pickup retains its own exact position/value/lifecycle.
  // A compact source sprite keeps dense loot subordinate to character silhouettes.
  isolated(ctx,lifeAlpha(item)*.82,()=>sourceImage(ctx,assets,'ui:gem',item.x,item.y,item.radius*2*1.1));
  return handled;
}
export function drawParticle(ctx,item,frame,assets) {
  if(!finitePoint(item))return unsupported;
  const size=Math.max(.5,number(item.data?.size,number(item.radius,2)));
  const key=item.style==='leaf'?'particle-leaf':chipKey(item);
  isolated(ctx,lifeAlpha(item),()=>sourceImage(ctx,assets,'world:'+key,item.x,item.y,size*1.7,undefined,number(item.angle,Math.atan2(number(item.data?.vy),number(item.data?.vx)))));
  return handled;
}
function impactKey(t) {return t<.25?'impact-onset':t<.7?'impact-peak':'impact-fade';}
export function drawImpactWave(ctx,item,frame,assets) {
  if(!finitePoint(item)||!(item.radius>=0))return unsupported;
  const style=item.style??item.data?.style;
  const accent={twinFinisher:'accent-twin',dragonFinisher:'accent-dragon',spiderFinisher:'accent-spider',astrolabeFinisher:'accent-astro'}[style];
  const t=item.maxLife>0?1-clamp(item.life/item.maxLife):.5;
  isolated(ctx,lifeAlpha(item),()=>sourceImage(ctx,assets,'world:'+(accent??impactKey(t)),item.x,item.y,Math.max(1,item.radius*2),undefined,number(item.data?.rotation)));
  return handled;
}
function drawHit(ctx,x,y,kind,source,t,assets) {
  const width=(kind==='cannon'?28:kind==='sniper'?20:16)*(.7+.3*Math.sin(Math.PI*t));
  sourceImage(ctx,assets,'world:'+impactKey(t),x,y,width);
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
  if(type==='shot'&&isSafeCentreEmission(event.birthOrigin)){recordSourceSuppression(assets,'flash',item,'safe centre is not anatomical aperture; actual hit feedback retained');return handled;}
  if(['summon-success','split-success'].includes(type) && !event.childKeys?.length) return missing;
  if(type==='refund' && !(event.amount>0)) return missing;
  isolated(ctx,alpha,()=>{
    const x=position.x,y=position.y;
    if(type==='shot') {
      const muzzles=item.anchors?.muzzles;
      const muzzle=muzzles?.length?muzzles[Math.max(0,number(event.shotIndex,item.shotIndex??0))%muzzles.length]:null;
      // A clamped near-field birth must never flash behind the blocking target.
      // The shot owns its immutable accepted birth; subsequent pose motion cannot drag it.
      const at=finitePoint(event.birthOrigin?.accepted)?event.birthOrigin.accepted:finitePoint(muzzle)?muzzle:position;
      flashAt(ctx,at.x,at.y,number(muzzle?.axisAngle,number(event.angle,item.angle??0)),kind,source,assets,.85+.15*Math.sin(t*Math.PI));
    } else if(type==='hit')drawHit(ctx,x,y,kind,source,t,assets);
    else if(type==='defeat') {
      // Presentation budget only: these are source chips, never independent entities.
      const count=frame?.quality==='reduced'?2:3;
      for(let i=0;i<count;i++) {
        const a=i*Math.PI*2/count,r=1+t*11;
        sourceImage(ctx,assets,'world:'+chips[i],x+Math.cos(a)*r,y+Math.sin(a)*r,4.5*(1-t*.4),undefined,a);
      }
    } else if(type==='refund') {
      // The actual amount remains dynamic; this creates no pickup or AI object.
      sourceImage(ctx,assets,'ui:gem',x-15,y,12);
      sourceImage(ctx,assets,'world:refund-rays',x+10,y,32,40);
      ctx.save();ctx.fillStyle='#3F7659';ctx.font='bold 14px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('+'+event.amount,x+10,y);ctx.restore();
    } else {
      sourceImage(ctx,assets,type==='split-success'?'world:split-small':'world:summon',x,y,20+12*t);
    }
  });return handled;
}

export function drawLink(ctx,item,frame,assets) {
  const from=item.data?.from??item,to=item.data?.to??{x:item.x2,y:item.y2};
  if(!finitePoint(from)||!finitePoint(to))return unsupported;
  const style=item.style??item.data?.type;
  isolated(ctx,lifeAlpha(item)*.6,()=>{
    if(style==='root') {
      const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy);
      if(len>0)sourceImage(ctx,assets,'world:root-link',(from.x+to.x)/2,(from.y+to.y)/2,len,10,Math.atan2(dy,dx));
    } else {
      // Target acquisition has an actual destination reticle; no illustrative A/B arrow.
      sourceImage(ctx,assets,'world:target-ring',to.x,to.y,18);
    }
  });return handled;
}
