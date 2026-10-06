import { P, clamp, finitePoint, number, isolated, handled, unsupported, missing } from './palette.js';
import { ellipse } from './vectors.js';
import { drawQualifications } from './qualifications.js';
import {sourceImage} from './sourcePixels.js';

export function drawActorOverlay(ctx,actor,anchors,frame,assets,pass) {
  if(!finitePoint(actor) || !['shadow','status'].includes(pass)) return unsupported;
  if(assets?.onSourceDraw)assets={...assets,sourceContext:{kind:'actor-overlay',uid:actor.uid,key:actor.key,artId:actor.artId,pass}};
  const r=Math.max(1,number(actor.radius,12)),s=actor.states ?? {};
  isolated(ctx,actor.alpha??1,()=>{
    if(pass==='shadow') {
      drawQualifications(ctx,actor,anchors,assets,'ground');
      if(!finitePoint(anchors?.root) || s.burrowed) return;
      const {x,y}=anchors.root;
      if(!assets?.originalShadow)return;
      // Actual approved original ellipse pixels, tinted offline; no drawn gradient.
      // Ground registration stays at the logic-owned root and is independent of body squash.
      const width=Math.max(12,Math.min(140,number(anchors?.bounds?.width,r*2)*.76));
      const height=width*34/147;
      ctx.drawImage(assets.originalShadow,x-width/2,y-height*.45,width,height);
      // Source shield is behind the opaque body: no ring strokes can cross eyes.
      const b=anchors?.bounds;if(actor.shield>0&&b&&b.width>0&&b.height>0){ctx.save();ctx.globalAlpha*=.60;sourceImage(ctx,assets,'world:shield',b.x+b.width/2,b.y+b.height/2,b.width+9,b.height+9);ctx.restore();}
      return;
    }
    const b=anchors?.bounds,valid=b&&finitePoint(b)&&b.width>0&&b.height>0;
    const x=valid?b.x+b.width/2:actor.x,y=valid?b.y+b.height/2:actor.y;
    const width=valid?b.width+9:r*2+9,height=valid?b.height+9:r*2+9;
    // Shield source is drawn in the behind-body pass above.
    if(s.slowed)sourceImage(ctx,assets,'world:slow',actor.x,actor.y+r*.55,(r+3)*2);
    if(s.frozen)sourceImage(ctx,assets,'world:frozen',x,y,width+3,height+3);
    // Source double arch is a crown above the actual alpha outline, not a face mask.
    // Keep its original aspect and only transform the approved pixels.
    if(s.armored){const markerWidth=Math.min(24,width*.38);sourceImage(ctx,assets,'world:armor',x,(valid?b.y:actor.y-r)-markerWidth*.28-3,markerWidth,markerWidth*.48);}
    drawQualifications(ctx,actor,anchors,assets);
    if(s.open)sourceImage(ctx,assets,'world:open',x,y,width+8,height+8);
    if(s.partnerFallen)sourceImage(ctx,assets,'world:enraged',x,y,width+10,height+10);
    if(s.phased){ctx.save();ctx.globalAlpha*=.45;sourceImage(ctx,assets,'world:phase',x,y+height*.16,width+8,height*.7);ctx.restore();}
    if(s.burrowed){const root=finitePoint(anchors?.root)?anchors.root:actor;sourceImage(ctx,assets,'world:burrow',root.x,root.y-r*.2,r*2.8);}
    // S08 is a source-alpha mask instruction, not an external drawn star/frame.
    // Original character renderer already applies the actual hitFlash brightness.
    // Actual source outer-ring layer clears its two inner decorative rings. Its transparent hole is >=60% of the source extent.
    // Register to true pixel bounds, without the +9 status envelope or a duplicated diagonal margin.
    if(actor.pose==='intro'){ctx.save();ctx.globalAlpha*=.55;sourceImage(ctx,assets,'world:phase-intro-outer',x,y,((valid?b.width:r*2)+4)/.60,((valid?b.height:r*2)+4)/.60);ctx.restore();}

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
    sourceImage(ctx,assets,valid?'ui:check':'ui:close',x,y,16);

  });
  return handled;
}
