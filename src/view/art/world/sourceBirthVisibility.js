// A safe logical centre is not an anatomical aperture. Keep simulation intact;
// omit the misleading flash and only occlude the bullet while inside its owner's
// measured source-alpha bounding rectangle (a declared conservative visual mask).
export function isSafeCentreEmission(origin){
 const c=origin?.ownerCentre,p=origin?.accepted,m=origin?.requested;
 return [c?.x,c?.y,p?.x,p?.y,m?.x,m?.y].every(Number.isFinite)
  &&Math.hypot(p.x-c.x,p.y-c.y)<1e-6&&Math.hypot(m.x-c.x,m.y-c.y)>1e-6;
}
export function isCentreBulletInsideSource(item,bounds){
 if(!isSafeCentreEmission(item?.data?.birthOrigin)||!bounds)return false;
 const {x,y,width,height}=bounds,r=Math.max(0,item.radius??0);
 return [x,y,width,height,item.x,item.y].every(Number.isFinite)
  &&item.x>=x-r&&item.x<=x+width+r&&item.y>=y-r&&item.y<=y+height+r;
}
export function recordSourceSuppression(assets,kind,item,reason){
 try{assets?.onPresentationSuppressed?.({kind,key:item?.key,sourceKey:item?.sourceKey,sourceArtId:item?.sourceArtId,position:[item?.x,item?.y],reason,birthStrategy:item?.data?.birthOrigin?.birthStrategy??null})}catch{}
}