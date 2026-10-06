"""Inspection-only connected-alpha contact sheet; never certifies or registers art."""
from PIL import Image,ImageDraw
from pathlib import Path
import sys,json,hashlib
source=Path(sys.argv[1]);original=Path(sys.argv[2]);names=sys.argv[3].split(',');labels=sys.argv[4].split(',')if len(sys.argv)>4 else ['neutral','squash','stretch','contact'];im=Image.open(source).convert('RGBA');w,h=im.size;a=im.getchannel('A');p=a.load();seen=set();regions=[]
for y in range(h):
 for x in range(w):
  if p[x,y]<=12 or (x,y)in seen:continue
  stack=[(x,y)];seen.add((x,y));b=[x,y,x,y];count=0
  while stack:
   xx,yy=stack.pop();count+=1;b=[min(b[0],xx),min(b[1],yy),max(b[2],xx),max(b[3],yy)]
   for q in [(xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)]:
    if 0<=q[0]<w and 0<=q[1]<h and p[q[0],q[1]]>12 and q not in seen:seen.add(q);stack.append(q)
  if count>1000:regions.append(b)
if len(regions)!=4*len(names):raise ValueError(f'Expected {4*len(names)} connected bodies, got {regions}')
rows=[sorted(regions,key=lambda b:b[0])]if len(names)==1 else[sorted([b for b in regions if (b[1]+b[3])/2<h/2],key=lambda b:b[0]),sorted([b for b in regions if (b[1]+b[3])/2>=h/2],key=lambda b:b[0])]
if any(len(row)!=4 for row in rows):raise ValueError(rows)
contact=Image.new('RGB',(1320,350*len(rows)),(180,180,180));d=ImageDraw.Draw(contact);crops=[]
for row,boxes in enumerate(rows):
 for col,b in enumerate(boxes):
  crop=[max(0,b[0]-12),max(0,b[1]-12),min(w,b[2]+13),min(h,b[3]+13)];crops.append(crop);sprite=im.crop(crop);sprite.putalpha(sprite.getchannel('A').point(lambda v:0 if v<=12 else v));sprite.thumbnail((310,295));contact.paste(sprite,(col*330+8,row*350+30),sprite);d.text((col*330+8,row*350+8),names[row]+'/'+labels[col],fill='#4B281C')
stem=source.name.replace('-ai-guides-clean-final.png','').replace('-ai-guides-clean.png','');contact.save(source.with_name(stem+'-candidate-contact.jpg'));sha=lambda file:hashlib.sha256(file.read_bytes()).hexdigest();source.with_name(stem+'-source-candidate.json').write_text(json.dumps({'classification':'original-concept AI-edited-entire-frame candidate pending source approval','source':original.as_posix(),'sourceSha':sha(original),'editedSource':source.as_posix(),'editedSha':sha(source),'crops':crops,'names':names},indent=2),encoding='utf8')
print(crops)
