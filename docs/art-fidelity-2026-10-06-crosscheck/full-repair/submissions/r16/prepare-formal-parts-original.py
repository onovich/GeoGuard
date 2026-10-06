from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib,shutil
root=Path('docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r16');root.mkdir(parents=True,exist_ok=True)
home=Path('C:/Users/Administrator/.codex/generated_images/01a10d62-ff3b-7341-b5f5-194703a5f6ed');data={};records=[]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
for id,file,ref,height,side in [('SNIPER','exec-0c4d1184-d54e-4d5d-99f0-275543901d85.png',140,188,40),('RAIL','exec-be2947c7-13eb-412d-bc52-4f1041db17e2.png',100,247,55)]:
 source=root/(id.lower()+'-formal-parts-ai.png');shutil.copyfile(home/file,source);im=Image.open(source).convert('RGBA');a=np.array(im);boxes=[];parts=[];out=Path('public/art/original/v1/characters')/id.lower()/'continuous-parts-candidate';out.mkdir(parents=True,exist_ok=True)
 for name,(left,right) in [('body',(0,900)),('head',(900,im.width))]:
  yy,xx=np.where(a[:,left:right,3]>12);box=[int(xx.min()+left),int(yy.min()),int(xx.max()+left+1),int(yy.max()+1)];crop=im.crop(box);scale=.275 if id=='SNIPER' else .30
  if name=='body':
   # Narrow neck length calibrated to original neutral proportions; belly/feet copied intact.
   neck=340 if id=='SNIPER' else 340;factor=.65 if id=='SNIPER' else .76;target=int(round(neck*factor));neckimage=crop.crop((0,0,crop.width,neck)).resize((crop.width,target),Image.Resampling.BICUBIC);body=Image.new('RGBA',(crop.width,crop.height-neck+target));body.alpha_composite(neckimage);body.alpha_composite(crop.crop((0,neck,crop.width,crop.height)),(0,target));crop=body
  crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.LANCZOS);part=out/(name+'-neutral.png');crop.save(part);parts.append((name,crop,box,scale));records.append({'identity':id,'classification':'formal AI layer reconstruction + deterministic crop/source resampling','source':source.as_posix(),'sourceSha':sha(source),'originalReference':f'public/art/original/v1/characters/{id.lower()}/'+('neutral-right.png' if id=='SNIPER' else 'continuous/neutral-right.png'),'crop':box,'uniformScale':scale,'neckCalibration':{'segmentRows':340,'factor':factor}if name=='body' else None,'output':part.as_posix(),'outputSha':sha(part)})
 body=dict((n,c)for n,c,_,_ in parts)['body'];head=dict((n,c)for n,c,_,_ in parts)['head'];ba=np.array(body);ha=np.array(head);bh,bw=ba.shape[:2]
 # true sole centers measured separately in left/right foot regions
 soles=[]
 for l,r in [(0,bw//2),(bw//2,bw)]:
  ys,xs=np.where(ba[int(bh*.84):,l:r,3]>12);bottom=int(ys.max()+int(bh*.84));near=np.where(ba[max(0,bottom-2):bottom+1,l:r,3]>12)[1];soles.append([float((near.min()+near.max())/2+l),bottom])
 rootpoint=[sum(p[0]for p in soles)/2,max(p[1]for p in soles)]
 # dark isolated eye blobs (exclude connected outer contour) measured via flood-fill.
 mask=(ha[:,:,0]<100)&(ha[:,:,1]<75)&(ha[:,:,2]<45)&(ha[:,:,3]>128);seen=np.zeros(mask.shape,bool);components=[]
 for y,x in zip(*np.where(mask)):
  if seen[y,x]:continue
  todo=[(x,y)];seen[y,x]=1;points=[]
  while todo:
   px,py=todo.pop();points.append((px,py))
   for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
    nx,ny=px+dx,py+dy
    if 0<=ny<mask.shape[0] and 0<=nx<mask.shape[1] and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=1;todo.append((nx,ny))
  if 20<len(points)<500:components.append({'count':len(points),'center':np.mean(points,axis=0).tolist()})
 eyes=sorted(components,key=lambda c:c['count'],reverse=True)[:2];eye=[sum(e['center'][i]for e in eyes)/2 for i in range(2)]
 # Actual source pad anchor measured inside its opaque mint tab, no generated guide.
 pad=[(1083-987)*scale,(379-108)*scale]if id=='SNIPER' else[(1090-994)*scale,(427-113)*scale]
 # M are actual narrow snout tip / two source painted pipe apertures.
 muzzles=[[(1585-987)*scale,(237-108)*scale]]if id=='SNIPER' else[[(1553-994)*scale,(219-113)*scale],[(1553-994)*scale,(322-113)*scale]]
 capHeight=18 if id=='SNIPER' else 22
 # Preserve every external stroke; isolated connector stroke masks are only optional overlap alpha masks.
 for name,image in [('body',body),('head',head)]:
  pixels=np.array(image);roi=np.zeros(pixels.shape[:2],bool)
  if name=='body':roi[:35,:]=True
  else:roi[int(pad[1]-22):,:int(pad[0]+35)]=True
  brown=(pixels[:,:,0]<110)&(pixels[:,:,1]<85)&(pixels[:,:,2]<55)&(pixels[:,:,3]>12)&roi
  stroke=pixels.copy();stroke[~brown,3]=0;fill=pixels.copy();fill[brown,3]=0
  Image.fromarray(stroke).save(out/(name+'-connector-stroke.png'));Image.fromarray(fill).save(out/(name+'-connector-fill.png'))
 # derived belly-only Q poses; neck/head/soles use unchanged pixels.
 for pose,amplitude in [('squash',-.10),('stretch',.10)]:
  pix=np.array(body);result=Image.new('RGBA',body.size);y0=int(bh*.58);y1=int(bh*.90)
  for y in range(bh):
   t=(y-y0)/(y1-y0);shift=amplitude*(y1-y0)*np.sin(np.pi*t)**2 if 0<t<1 else 0
   sy=max(0,min(bh-1,int(round(y-shift))));result.paste(body.crop((0,sy,bw,sy+1)),(0,y))
  result.save(out/('body-'+pose+'.png'))
 data['tower:'+id]={'referenceRadius':ref,'bodyRoot':rootpoint,'bodySize':list(body.size),'bodyNeck':[bw*.60,12 if id=='SNIPER' else 18],'bodyFixedFrom':bh*.56,'headSize':list(head.size),'headEye':eye,'headJoint':pad,'headHeight':height,'headSideOffset':side,'muzzles':muzzles,'parts':[{ 'part':'candidate-'+n,'src':(out/(n+'.png')).as_posix().removeprefix('public/')}for n in ['body-neutral','body-squash','body-stretch','head-neutral','body-connector-stroke','body-connector-fill','head-connector-stroke','head-connector-fill']], 'sourceSoleCenters':soles,'eyeComponents':eyes}
 (out/'source-record.json').write_text(json.dumps({'records':[r for r in records if r['identity']==id],'registration':data['tower:'+id]},indent=2),encoding='utf-8')
(root/'parts-source-records.json').write_text(json.dumps(records,indent=2),encoding='utf-8');Path('src/view/art/characters/originalContinuousCandidateData.js').write_text('export const originalContinuousCandidateData = '+json.dumps(data,indent=2)+';\n',encoding='utf-8')
print(json.dumps({k:{'bodyRoot':v['bodyRoot'],'bodyNeck':v['bodyNeck'],'headEye':v['headEye'],'headJoint':v['headJoint'],'sizes':[v['bodySize'],v['headSize']]}for k,v in data.items()}))