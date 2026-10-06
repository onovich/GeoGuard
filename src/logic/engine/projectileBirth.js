// Presentation supplies source pixels/geometry; safety clamp remains pure engine geometry.
export function resolveProjectileBirth({owner,state,angle,shotIndex=0,radius,sourceArtId,target,resolveProjectileOrigin}){
 const centre={x:owner.x,y:owner.y};
 if(!resolveProjectileOrigin)return{point:centre,metadata:null};
 let sourceFacingOverride;
 const request=(aim,acceptedBirthAim=false)=>resolveProjectileOrigin({source:owner,sourceArtId,angle:aim,shotIndex,target:target?{x:target.x,y:target.y}:null,...(acceptedBirthAim?{acceptedBirthAim:true,sourceFacingOverride}:{})});
 let requested=request(angle);sourceFacingOverride=requested?.sourceFacing;
 if(!Number.isFinite(requested?.x)||!Number.isFinite(requested?.y))return{point:centre,metadata:{mode:'missing-source-centre',ownerCentre:centre,requested:null}};
 const clampOrigin=m=>{const dx=m.x-centre.x,dy=m.y-centre.y,a=dx*dx+dy*dy;let limit=1,blocker=null;
  if(a>0)for(const enemy of state.enemies){if(!(enemy.hp>0)||enemy.burrowed)continue;
   const ex=centre.x-enemy.x,ey=centre.y-enemy.y,R=enemy.radius+radius+4,c=ex*ex+ey*ey-R*R;
   if(c<=0){limit=0;blocker=enemy.uid;break}
   const b=2*(ex*dx+ey*dy),d=b*b-4*a*c;if(d<0)continue;const entry=(-b-Math.sqrt(d))/(2*a);
   if(entry>=0&&entry<=limit){limit=Math.max(0,entry-.5/Math.sqrt(a));blocker=enemy.uid}
  }return{point:{x:centre.x+dx*limit,y:centre.y+dy*limit},limit,blocker};
 };
 let accepted=clampOrigin(requested),aimError=0,solverSamples=0;
 if(target&&Number.isFinite(target.x)&&Number.isFinite(target.y)&&(accepted.limit<1||Number.isFinite(requested.sourceBoreAxisAngle??requested.imageXAxisAngle))){
  const norm=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const sample=theta=>{const source=request(theta,true);solverSamples++;if(!Number.isFinite(source?.x)||!Number.isFinite(source?.y))return null;const safe=clampOrigin(source),direction=Math.atan2(target.y-safe.point.y,target.x-safe.point.x);return{theta,source,safe,error:norm(direction-(source.sourceBoreAxisAngle??source.imageXAxisAngle??theta))}};
  const centreAngle=Math.atan2(target.y-centre.y,target.x-centre.x);let best=sample(Math.atan2(target.y-accepted.point.y,target.x-accepted.point.x));
  // The accepted point itself changes with the source gun. Solve the same chosen
  // target's direction and safe birth together; no hurtbox expansion or damage edit.
  for(let i=0;best&&Math.abs(best.error)>1e-6&&i<8;i++){const next=sample(best.theta+best.error*.65);if(!next)break;if(Math.abs(next.error)<Math.abs(best.error))best=next;else break;}
  if(best&&Math.abs(best.error)>1e-6){let previous=null;for(let i=0;i<=12;i++){const next=sample(centreAngle-Math.PI/2+.001+i*(Math.PI-.002)/12);if(!next)continue;if(Math.abs(next.error)<Math.abs(best.error))best=next;if(previous&&previous.error*next.error<0&&Math.abs(previous.error-next.error)<Math.PI){let lo=previous,hi=next;for(let n=0;n<26;n++){const mid=sample((lo.theta+hi.theta)/2);if(!mid)break;if(Math.abs(mid.error)<Math.abs(best.error))best=mid;if(Math.abs(mid.error)<1e-7)break;if(lo.error*mid.error<=0)hi=mid;else lo=mid;}}previous=next;}}
  if(best){requested=best.source;accepted=best.safe;aimError=best.error;}
 }
 // A tangency in the owner-to-muzzle clamp can have no continuous joint root.
 // In that case solve the anatomical ray first and retreat along that same ray,
 // before the first expanded enemy interval. Never accept the discontinuity.
 let birthStrategy='owner-segment-joint';
 if(target&&Math.abs(aimError)>1e-4){
  const norm=a=>Math.atan2(Math.sin(a),Math.cos(a)),centreAngle=Math.atan2(target.y-centre.y,target.x-centre.x);
  const raySample=theta=>{const source=request(theta,true);solverSamples++;if(!Number.isFinite(source?.x)||!Number.isFinite(source?.y))return null;const direction=Math.atan2(target.y-source.y,target.x-source.x);return{theta,source,error:norm(direction-(source.sourceBoreAxisAngle??source.imageXAxisAngle??theta))}};
  let best=null,previous=null;
  for(let i=0;i<=128;i++){const next=raySample(centreAngle-Math.PI+i*2*Math.PI/128);if(!next)continue;if(!best||Math.abs(next.error)<Math.abs(best.error))best=next;
   if(previous&&previous.error*next.error<0&&Math.abs(previous.error-next.error)<Math.PI){let lo=previous,hi=next;for(let n=0;n<30;n++){const mid=raySample((lo.theta+hi.theta)/2);if(!mid)break;if(Math.abs(mid.error)<Math.abs(best.error))best=mid;if(Math.abs(mid.error)<1e-8)break;if(lo.error*mid.error<=0)hi=mid;else lo=mid;}}previous=next;
  }
  if(best&&Math.abs(best.error)<1e-5){
   const source=best.source,axis=source.sourceBoreAxisAngle??source.imageXAxisAngle??best.theta,ux=Math.cos(axis),uy=Math.sin(axis),targetDistance=(target.x-source.x)*ux+(target.y-source.y)*uy;
   let along=0,blocker=null,possible=true;const oldSafe=clampOrigin(source),ownerProjection=(centre.x-source.x)*ux+(centre.y-source.y)*uy;
   for(const enemy of state.enemies){if(!(enemy.hp>0)||enemy.burrowed)continue;const ex=enemy.x-source.x,ey=enemy.y-source.y,R=enemy.radius+radius+4,projection=ex*ux+ey*uy,perpendicular=ex*uy-ey*ux,disc=R*R-perpendicular*perpendicular;
    if(disc<0){if(oldSafe.blocker===enemy.uid)possible=false;continue;}const half=Math.sqrt(disc),entry=projection-half,exit=projection+half;
    if(entry<=targetDistance&&(exit>=Math.min(0,ownerProjection)||oldSafe.blocker===enemy.uid)&&entry-.5<along){along=entry-.5;blocker=enemy.uid;}
   }
   const point={x:source.x+ux*along,y:source.y+uy*along};
   if(possible&&targetDistance>0&&state.enemies.every(e=>!(e.hp>0)||e.burrowed||Math.hypot(point.x-e.x,point.y-e.y)>=e.radius+radius+4)){
    requested=source;accepted={point,limit:along<0?0:1,blocker};aimError=best.error;birthStrategy='source-ray-safe-retreat';
   }else{requested=request(centreAngle,true);accepted={point:centre,limit:0,blocker:oldSafe.blocker};aimError=norm(centreAngle-(requested.sourceBoreAxisAngle??requested.imageXAxisAngle??centreAngle));birthStrategy='no-safe-source-ray-centre';}
  }else{requested=request(centreAngle,true);accepted={point:centre,limit:0,blocker:accepted.blocker};aimError=norm(centreAngle-(requested.sourceBoreAxisAngle??requested.imageXAxisAngle??centreAngle));birthStrategy='no-anatomical-ray-root-centre';}
 }
 return{point:accepted.point,metadata:{mode:requested.kind??'source-muzzle',birthStrategy,ownerCentre:centre,requested:{x:requested.x,y:requested.y},accepted:accepted.point,clampedBy:accepted.limit<1?accepted.blocker:null,sourceMeasurement:requested.measurement??null,imageXAxisAngle:requested.imageXAxisAngle??null,sourceBoreAxisAngle:requested.sourceBoreAxisAngle??requested.imageXAxisAngle??null,sourceAimAngle:requested.sourceAimAngle??angle,sourceFacing:requested.sourceFacing??null,sourceAimExact:requested.sourceAimExact??false,acceptedAimResidual:aimError,acceptedAimSolverSamples:solverSamples}};
}
