import {isCentreBulletInsideSource,recordSourceSuppression} from './sourceBirthVisibility.js';
import { P, finitePoint, number, isolated, lifeAlpha, handled, unsupported } from './palette.js';
import { shotStyles } from './manifest.js';

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
  const source=item.sourceArtId??({basic:'tower:BASIC',cannon:'tower:CANNON',sniper:'tower:SNIPER'}[item.data?.kind??item.style??'basic']);
  const image=assets?.originalEffects?.[source+'|bullet'];if(!image)return unsupported;
  if(isCentreBulletInsideSource(item,item.ownerSourceBounds)){recordSourceSuppression(assets,'bullet',item,'safe centre bullet inside measured owner source bounds');return handled;}
  isolated(ctx,lifeAlpha(item),()=>{
    ctx.translate(item.x,item.y);ctx.rotate(angle);
    const width=radius*s.rx*2*1.6,height=width*image.height/image.width;
    // Long independent slugs use their source tail as the render anchor. Their
    // true physics centre, radius, speed and collision remain unchanged.
    const rear=(source==='tower:SNIPER'||source==='tower:RAIL')?0:-width/2;
    ctx.drawImage(image,rear,-height/2,width,height);
  });
  return handled;
}
