// Images are decoded once by world/index. This module transforms real source pixels only.
export function sourceImage(ctx,assets,key,x,y,width,height,angle=0) {
  const image=assets?.originalEffects?.[key];
  if(!image){assets?.onMissingSource?.(key);return false}if(!(width>0))return false;
  const h=height>0?height:width*image.height/image.width;
  ctx.save();ctx.translate(x,y);if(angle)ctx.rotate(angle);ctx.drawImage(image,-width/2,-h/2,width,h);ctx.restore();
  if(assets.onSourceDraw)try{assets.onSourceDraw(Object.freeze({key,mode:'image',context:assets.sourceContext??null,resource:image.src,x,y,width,height:h,angle,alpha:ctx.globalAlpha}));}catch{}
 return true;
}

// Stretch only the source skin center; all four corners remain sampled source pixels.
export function sourceNineSlice(ctx,assets,key,x,y,width,height,inset=12) {
 const image=assets?.originalEffects?.[key];if(!image){assets?.onMissingSource?.(key);return false}if(!(width>0&&height>0))return false;
 const n=Math.min(inset,image.width/2,image.height/2),cap=Math.min(n,width/2,height/2),dx=cap,dy=cap;
 const sx=[0,n,image.width-n,image.width],sy=[0,n,image.height-n,image.height];
 const tx=[x,x+dx,x+width-dx,x+width],ty=[y,y+dy,y+height-dy,y+height];
 for(let row=0;row<3;row++)for(let column=0;column<3;column++)if(tx[column+1]>tx[column]&&ty[row+1]>ty[row])ctx.drawImage(image,sx[column],sy[row],sx[column+1]-sx[column],sy[row+1]-sy[row],tx[column],ty[row],tx[column+1]-tx[column],ty[row+1]-ty[row]);
 if(assets.onSourceDraw)try{assets.onSourceDraw(Object.freeze({key,mode:'nine-slice',context:assets.sourceContext??null,resource:image.src,x,y,width,height,alpha:ctx.globalAlpha}));}catch{}
 return true;
}
