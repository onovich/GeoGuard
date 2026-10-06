import {clamp,finitePoint} from './palette.js';
import {sourceImage} from './sourcePixels.js';

// All qualification art is a registered image. Actual living-entity qualification stays upstream.
export function drawQualifications(ctx,actor,anchors,assets,pass='status'){
  if(!(actor.hp>0))return;
  const states=actor.states??{},r=Math.max(1,Number.isFinite(actor.radius)?actor.radius:12);
  const top=finitePoint(anchors?.bounds)?anchors.bounds.y:actor.y-r;
  if(pass==='status'&&states.jammed===true)sourceImage(ctx,assets,'world:jam',actor.x,top-9,r*2+14);
  const heal=actor.healAura;
  if(heal?.active===true&&Number.isFinite(heal.range)&&heal.range>0&&Array.isArray(heal.eligibleTargetKeys)&&heal.eligibleTargetKeys.length>0){
    // Actual range-source ring belongs behind every opaque actor, not over recipients' faces.
    if(pass==='ground'){ctx.save();ctx.globalAlpha*=.25;sourceImage(ctx,assets,'world:heal-ring',actor.x,actor.y,heal.range*2,heal.range*2);ctx.restore();}
    else sourceImage(ctx,assets,'world:heal-plus',actor.x,top-10,12,12);
  }
  if(pass==='ground')return;
  const fuse=actor.fuse;
  if(fuse?.active===true&&Number.isFinite(fuse.remaining)&&fuse.remaining>0&&Number.isFinite(fuse.duration)&&fuse.duration>0){
    sourceImage(ctx,assets,'ui:clock',actor.x,top-10,13,13);
    // Whitelisted functional progress, not decorative clock artwork; follows exact real remaining.
    const progress=clamp(1-fuse.remaining/fuse.duration);
    if(progress>0){ctx.save();ctx.strokeStyle='#C69547';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(actor.x,actor.y,r+5,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();ctx.restore();}
  }
}
