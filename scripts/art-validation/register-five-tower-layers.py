from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
root=Path(__file__).resolve().parents[2];r=root/'docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r09';prior=r.parent/'r07'
def components(im):
 a=im.getchannel('A');seen=set();out=[]
 for y in range(im.height):
  for x in range(im.width):
   if a.getpixel((x,y))<=12 or (x,y)in seen:continue
   q=[(x,y)];seen.add((x,y));pixels=[]
   while q:
    xx,yy=q.pop();pixels.append((xx,yy))
    for nx,ny in [(xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)]:
     if 0<=nx<im.width and 0<=ny<im.height and (nx,ny)not in seen and a.getpixel((nx,ny))>12:seen.add((nx,ny));q.append((nx,ny))
   if len(pixels)>1000:out.append([min(x for x,y in pixels),min(y for x,y in pixels),max(x for x,y in pixels)+1,max(y for x,y in pixels)+1])
 return sorted(out,key=lambda b:b[0])
weapons=Image.open(r/'remaining-tower-weapons-ai.png').convert('RGBA');guns=components(weapons);assert len(guns)==5
config={'RAIL':('rail-rapid',0,[48,15,147,196],[0,-17,77,34],[[.945,.3],[.945,.75]],0),'RAPID':('rail-rapid',1,[27,44,192,162],[-9,-23,60,46],[[.895,.30],[.895,.74]],0),'MORTAR':('mortar-frost',0,[25,75,195,130],[-7,-42,75,75],[[.70,.22]],.8),'FROST':('mortar-frost',1,[16,80,212,131],[-4,-15,61,30],[[.76,.5]],0),'SENTINEL':('sentinel',0,[21,49,212,158],[-5,-17,52,34],[[.87,.5]],0)}
mod=root/'src/view/art/characters/originalLayerData.js';data=json.loads(mod.read_text(encoding='utf8').split(' = ',1)[1].strip().rstrip(';'));contact=Image.new('RGB',(1500,600),(170,170,170));draw=ImageDraw.Draw(contact)
for i,(identity,(stem,bodyindex,target,guntarget,normalizedM,intrinsic))in enumerate(config.items()):
 folder=root/f'public/art/original/v1/characters/{identity.lower()}';folder.mkdir(exist_ok=True);bodyboard=Image.open(prior/(stem+'-body-layers-ai.png')).convert('RGBA');bb=components(bodyboard)[bodyindex];body=bodyboard.crop(bb);body.putalpha(body.getchannel('A').point(lambda v:0 if v<=12 else v));body.save(folder/'body-part.png');gun=weapons.crop(guns[i]);gun.putalpha(gun.getchannel('A').point(lambda v:0 if v<=12 else v));gun.save(folder/'launcher-part.png')
 refmeta=json.loads((prior/(stem+'-source-candidate.json')).read_text(encoding='utf8'));reference=Image.open(root/refmeta['editedSource']).convert('RGBA');refcrop=refmeta['crops'][bodyindex*4];ref=reference.crop(refcrop);ref.save(folder/'neutral-reference.png');a=ref.getchannel('A');box=a.point(lambda v:255 if v>64 else 0).getbbox();scan=box[3]-6;runs=[];start=None
 for x in range(ref.width+1):
  on=x<ref.width and a.getpixel((x,scan))>64
  if on and start is None:start=x
  if not on and start is not None:
   if x-start>=3:runs.append([start,x])
   start=None
 assert len(runs)==2,(identity,runs)
 parts=[{'part':'body','src':f'art/original/v1/characters/{identity.lower()}/body-part.png','crop':[0,0,*body.size],'target':target,'space':'soft'}];footcrops=[]
 for j,(lo,hi)in enumerate(runs):
  crop=[max(0,lo-5),box[3]-35,min(ref.width,hi+5),box[3]+1];foot=ref.crop(crop);foot.save(folder/('foot-'+['left','right'][j]+'-part.png'));footcrops.append(crop);parts.append({'part':'foot-'+['left','right'][j],'src':f'art/original/v1/characters/{identity.lower()}/foot-'+['left','right'][j]+'-part.png','crop':[0,0,*foot.size],'target':[[83,197,28,23],[145,197,28,23]][j],'space':'fixed'})
 parts.append({'part':'launcher','src':f'art/original/v1/characters/{identity.lower()}/launcher-part.png','crop':[0,0,*gun.size],'target':guntarget,'space':'launcher'});data['tower:'+identity]={'parts':parts,'muzzleSource':[[x*gun.width,y*gun.height]for x,y in normalizedM],'intrinsicAngleCorrection':intrinsic,'upResidualCorrection':{'RAIL':.58,'RAPID':1.5707963268,'MORTAR':.88,'FROST':1.5707963268,'SENTINEL':1.5707963268}[identity],'launcherBehindBody':True,'icon':f'art/original/v1/characters/{identity.lower()}/neutral-reference.png'}
 source={'classification':'AI-layer-reconstruction body + independent weapon; feet actual guide-clean AI-frame crops','bodySource':(prior/(stem+'-body-layers-ai.png')).relative_to(root).as_posix(),'bodyCrop':bb,'weaponSource':(r/'remaining-tower-weapons-ai.png').relative_to(root).as_posix(),'weaponCrop':guns[i],'referenceSource':refmeta,'feetCropsLocalReference':footcrops,'actualParts':[{**p,'sha':hashlib.sha256((root/'public'/p['src']).read_bytes()).hexdigest()}for p in parts],'runtimeState':'combination and source proportions pending review'};(folder/'parts-source.json').write_text(json.dumps(source,indent=2),encoding='utf8')
 for row,im in enumerate([body,gun]):
  tile=im.copy();tile.thumbnail((280,260));contact.paste(tile,(i*300+10,row*300+30),tile);draw.text((i*300+10,row*300+5),identity+'/'+['body','weapon'][row],fill='#4B281C')
mod.write_text('export const originalLayerData = '+json.dumps(data,indent=2)+';\n',encoding='utf8');contact.save(r/'five-tower-layer-contact.jpg')
print('5 tower actual source layers registered; combination review pending')
