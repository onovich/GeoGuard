from PIL import Image, ImageDraw
from pathlib import Path
from collections import deque
import json, hashlib
f=Path('docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r08')
p=f/'pair-03-frost-rail-original-candidate.json'
records=json.loads(p.read_text(encoding='utf8'))
for idx,r in enumerate(records[4:]):
 im=Image.open(r['output']).convert('RGBA');pix=im.load();w,h=im.size;seen=set();q=deque();seeds=[(250,50),(250,120 if idx==1 else 125)]
 def offer(x,y):
  if not(0<=x<w and 0<=y<h)or(x,y)in seen:return
  rr,gg,bb,aa=pix[x,y]
  if aa==0 or(min(rr,gg,bb)>70 and max(rr,gg,bb)-min(rr,gg,bb)<80):seen.add((x,y));q.append((x,y))
 for seed in seeds:offer(*seed)
 count=0
 while q:
  x,y=q.popleft();rr,gg,bb,aa=pix[x,y]
  if aa:pix[x,y]=(rr,gg,bb,0);count+=1
  for nx,ny in[(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:offer(nx,ny)
 im.save(r['output']);r['internalPaperEdgeCleanup']['connectedPaperRGBMin']=70;r['internalPaperEdgeCleanup']['additionalEdgeAlphaPixels']=count;r['outputSha']=hashlib.sha256(Path(r['output']).read_bytes()).hexdigest()
p.write_text(json.dumps(records,indent=2),encoding='utf8');c=Image.new('RGB',(1320,700),'#c8c6bc');d=ImageDraw.Draw(c)
for n,r in enumerate(records):
 im=Image.open(r['output']).convert('RGBA');im.thumbnail((310,290));c.paste(im,(n%4*330+8,n//4*350+30),im);d.text((n%4*330+8,n//4*350+8),r['id']+'/'+r['state'],fill='#4B281C')
c.save(f/'pair-03-frost-rail-original-contact.jpg')
