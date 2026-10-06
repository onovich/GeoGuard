from PIL import Image,ImageDraw
from pathlib import Path
from collections import deque
import json,hashlib

base=Path('docs/art-direction/sticker-bible-2026-10-01/production-art-2026-10-02/effects-ui/submissions/r02');out=Path('public/art/original/v1/world');out.mkdir(parents=True,exist_ok=True);submission=Path('docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r11');submission.mkdir(parents=True,exist_ok=True)
items=[
('shield','b02-status-world.png',[116,121,326,269],'cool',[]),('slow','b02-status-world.png',[444,152,736,252],'blue',[]),('frozen','b02-status-world.png',[824,133,1104,268],'blue',[]),('jam','b02-status-world.png',[1188,159,1490,230],'cool',[]),('armor','b02-status-world.png',[101,348,309,458],'general',[]),('phase','b02-status-world.png',[474,344,712,472],'warm',[]),('burrow','b02-status-world.png',[806,364,1096,462],'general',[]),('open','b02-status-world.png',[52,549,354,690],'warm',[[166,588,240,625]]),('enraged','b02-status-world.png',[449,549,713,692],'warm',[]),('phase-intro','b02-status-world.png',[870,760,1040,923],'warm',[]),
('summon','b04-mechanic-feedback.png',[830,126,1086,328],'cool',[]),('node-break','b04-mechanic-feedback.png',[88,440,309,581],'warm',[]),('root-link','b04-mechanic-feedback.png',[835,478,1080,544],'cool',[]),('impact-onset','b04-mechanic-feedback.png',[402,718,513,828],'warm',[]),('impact-peak','b04-mechanic-feedback.png',[511,700,640,841],'warm',[]),('impact-fade','b04-mechanic-feedback.png',[646,718,751,830],'warm',[]),
('chip-coral-a','b04-mechanic-feedback.png',[901,704,939,753],'warm',[]),('chip-coral-b','b04-mechanic-feedback.png',[1000,751,1048,793],'warm',[]),('chip-brown','b04-mechanic-feedback.png',[868,788,907,825],'general',[]),('chip-coral-c','b04-mechanic-feedback.png',[950,819,985,861],'warm',[]),('particle-streak','b04-mechanic-feedback.png',[953,718,966,754],'general',[]),
('particle-leaf','b04-mechanic-feedback.png',[866,148,891,173],'cool',[]),('split-small','b04-mechanic-feedback.png',[1180,158,1278,265],'cool',[[1213,209,1244,241]]),('target-ring','b04-mechanic-feedback.png',[637,458,734,560],'warm',[[671,493,699,529],[680,458,689,489],[680,533,689,560],[637,503,662,517],[710,503,734,517]]),('web-terrain','b04-mechanic-feedback.png',[74,121,326,335],'cool',[{'circle':[198,230,20]}]),('root-terrain','b04-mechanic-feedback.png',[454,123,705,335],'cool',[{'circle':[582,231,20]}]),
('accent-twin','b04-mechanic-feedback.png',[1184,701,1324,760],'cool',[]),('accent-dragon','b04-mechanic-feedback.png',[1348,699,1509,760],'warm',[]),('accent-spider','b04-mechanic-feedback.png',[1185,789,1320,882],'cool',[]),('accent-astro','b04-mechanic-feedback.png',[1358,785,1510,876],'blue',[]),
]
records=[]
for key,filename,box,mode,exclude in items:
    source=base/filename; image=Image.open(source).convert('RGBA').crop(box);px=image.load()
    corners=[image.getpixel(p)[:3] for p in [(0,0),(image.width-1,0),(0,image.height-1),(image.width-1,image.height-1)]]
    matte=[sorted(c[i] for c in corners)[len(corners)//2] for i in range(3)]
    for y in range(image.height):
        for x in range(image.width):
            rgb=px[x,y][:3]; delta=max(abs(rgb[i]-matte[i]) for i in range(3));alpha=max(0,min(1,(delta-12)/45))
            for exclusion in exclude:
                if isinstance(exclusion,dict):
                    cx,cy,radius=exclusion['circle'];blocked=(x+box[0]-cx)**2+(y+box[1]-cy)**2<=radius**2
                else:
                    x0,y0,x1,y1=exclusion;blocked=x0<=x+box[0]<x1 and y0<=y+box[1]<y1
                if blocked:alpha=0
            if alpha<=0:px[x,y]=(*rgb,0)
            else:
                # Unpremultiply actual source color against estimated paper, not draw new pixels.
                clean=tuple(round(max(0,min(255,(rgb[i]-(1-alpha)*matte[i])/alpha))) for i in range(3));px[x,y]=(*clean,round(alpha*255))
    if key.startswith('chip-') or key=='particle-streak':
        visited=set();components=[]
        for y in range(image.height):
            for x in range(image.width):
                if (x,y) in visited or not px[x,y][3]:continue
                component=[];queue=deque([(x,y)]);visited.add((x,y))
                while queue:
                    a,b=queue.popleft();component.append((a,b))
                    for nx,ny in [(a-1,b),(a+1,b),(a,b-1),(a,b+1)]:
                        if 0<=nx<image.width and 0<=ny<image.height and (nx,ny) not in visited and px[nx,ny][3]:visited.add((nx,ny));queue.append((nx,ny))
                components.append(component)
        for component in sorted(components,key=len,reverse=True)[1:]:
            for x,y in component:px[x,y]=(*px[x,y][:3],0)
    tight=image.getbbox()
    if not tight:raise ValueError(key)
    image=image.crop(tight);path=out/(key+'.png');image.save(path)
    records.append({'key':key,'classification':'original source crop + estimated paper-matte alpha / source RGB unpremultiplication; no AI or contour painting','source':str(source).replace('\\','/'),'sourceSha':hashlib.sha256(source.read_bytes()).hexdigest(),'crop':box,'alphaMode':'paper-matte alpha and source RGB decontamination','paperMatteRGB':matte,'matteParameters':{'threshold':12,'opaqueDelta':57},'annotationExclusions':exclude,'tightAlphaCrop':tight,'runtime':str(path).replace('\\','/'),'runtimeSha':hashlib.sha256(path.read_bytes()).hexdigest(),'size':image.size,'status':'SOURCE CANDIDATE ONLY, not runtime installed'})
(submission/'world-source-candidates.json').write_text(json.dumps(records,indent=2),encoding='utf8')
contact=Image.new('RGBA',(1200,((len(records)+4)//5)*190),(175,175,175,255));draw=ImageDraw.Draw(contact)
for i,r in enumerate(records):
    a=Image.open(r['runtime']).convert('RGBA');a.thumbnail((215,145));x=i%5*240;y=i//5*190;draw.text((x+10,y+10),r['key'],fill='#4b281c');contact.alpha_composite(a,(x+10,y+30))
contact.convert('RGB').save(submission/'world-source-contact.jpg')
