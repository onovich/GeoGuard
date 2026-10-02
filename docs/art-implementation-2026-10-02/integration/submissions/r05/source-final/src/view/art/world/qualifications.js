import { P, clamp, finitePoint } from './palette.js';
import { segment } from './vectors.js';

// Pure qualification displays derived upstream from actual living entities.
// These rings never enter hazards and never drive healing, fire-rate or blast timing.
export function drawQualifications(ctx, actor, anchors) {
  if (!(actor.hp > 0)) return;
  const states=actor.states??{}, r=Math.max(1,Number.isFinite(actor.radius)?actor.radius:12);
  if(states.jammed===true) {
    for(const side of [-1,1])for(const row of [-1,1]) {
      ctx.beginPath();
      for(let i=0;i<=16;i++) {
        const x=actor.x+side*(r+5+i*.55),y=actor.y+row*3+Math.sin(i/16*Math.PI*3)*1.6;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.strokeStyle=P.purple;ctx.lineWidth=1.4;ctx.stroke();
    }
    const top=finitePoint(anchors?.bounds)?anchors.bounds.y:actor.y-r;
    segment(ctx,actor.x-2.5,top-6.5,actor.x+2.5,top-1.5,P.purple,1.8);
    segment(ctx,actor.x-2.5,top-1.5,actor.x+2.5,top-6.5,P.purple,1.8);
  }
  const heal=actor.healAura;
  if(heal?.active===true && Number.isFinite(heal.range) && heal.range>0 && Array.isArray(heal.eligibleTargetKeys) && heal.eligibleTargetKeys.length>0) {
    // S15 reused as a sparse sage eligibility ring, centered at the actual aura origin.
    // No fill, coral boundary, clock countdown, success flash or extra hurtful disk.
    const range=heal.range;
    ctx.save();ctx.globalAlpha*=.27;ctx.strokeStyle=P.mintShade;ctx.lineWidth=1.25;
    for(let i=0;i<6;i++) {
      const a=i*Math.PI/3;
      ctx.beginPath();ctx.arc(actor.x,actor.y,range,a+.12,a+.62);ctx.stroke();
    }
    ctx.restore();
    const top=finitePoint(anchors?.bounds)?anchors.bounds.y:actor.y-r;
    // Small external plus marker denotes the eligibility source, not a new body organ.
    segment(ctx,actor.x-3,top-5,actor.x+3,top-5,P.sage,1.5);
    segment(ctx,actor.x,top-8,actor.x,top-2,P.sage,1.5);
  }
  const fuse=actor.fuse;
  if(fuse?.active===true && Number.isFinite(fuse.remaining) && fuse.remaining>0 && Number.isFinite(fuse.duration) && fuse.duration>0) {
    // Local S15-style honey clock belongs to the source. Never show explosion radius.
    const progress=clamp(1-fuse.remaining/fuse.duration), radius=r+5;
    ctx.save();ctx.globalAlpha*=.72;ctx.strokeStyle=P.honeyShade;ctx.lineWidth=1.7;
    for(let i=0;i<6;i++) {
      const a=-Math.PI/2+i*Math.PI/3;
      ctx.beginPath();ctx.arc(actor.x,actor.y,radius,a+.1,a+.78);ctx.stroke();
    }
    ctx.restore();
    if(progress>0) {
      ctx.beginPath();ctx.arc(actor.x,actor.y,radius-2,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);
      ctx.strokeStyle='#C69547';ctx.lineWidth=1.5;ctx.stroke();
    }
    segment(ctx,actor.x,actor.y-radius-4,actor.x,actor.y-radius-1,P.honeyShade,1.5);
  }
}
