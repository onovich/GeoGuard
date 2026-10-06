from PIL import Image
from pathlib import Path
import json, hashlib, shutil

root=Path('.'); source=root/'docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r10'; out=root/'public/art/original/v1/characters/rail'; out.mkdir(parents=True,exist_ok=True)
down=json.loads((source/'rail-down-rigid-source-candidates.json').read_text(encoding='utf8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def match(image,factors):
    px=image.load()
    for y in range(image.height):
        for x in range(image.width):
            r,g,b,a=px[x,y]
            if a<=12:px[x,y]=(r,g,b,0)
            elif g>r+5 and g>b+15:px[x,y]=(round(r*factors[0]),round(g*factors[1]),round(b*factors[2]),a)
    return image
pipe=match(Image.open(source/'rail-down-neutral-pipes.png').convert('RGBA'),down[0]['colorProcessing']['rgbFactors']);pipe=pipe.resize((round(pipe.width*.65),round(pipe.height*.65)),Image.Resampling.LANCZOS);pipe.save(out/'rigid-down-pipes.png')
frames={};records=[]
for pose in ['neutral','squash','stretch']:
    for facing in ['right','left','up','down']:
        key=pose+'-'+facing; attachments=[]
        if facing=='down':
            record=next(r for r in down if r['pose']==pose); raw=Image.open(source/'rail-down-soft-bodies-ai.png').convert('RGBA').crop(record['bodyCrop']);raw=match(raw,record['colorProcessing']['rgbFactors']);image=raw.resize((round(raw.width*.5),round(raw.height*.5)),Image.Resampling.LANCZOS)
            x,y=record['pipePlacement']; attachments=[{'part':'rigid-down-pipes','src':'art/original/v1/characters/rail/rigid-down-pipes.png','crop':[0,0,*pipe.size],'target':[x*.5,y*.5,pipe.width*.5,pipe.height*.5]}]
            # Source mint mouth ellipses: original crop-local [32,184], [99,184].
            muzzles=[[(x+px*.65)*.5,(y+184*.65)*.5] for px in [32,99]]
            origin={'source':'rail-down-soft-bodies-ai.png','bodyCrop':record['bodyCrop'],'pipeOriginal':'rail-down-neutral-pipes.png','pipeAttachment':attachments,'processing':record['colorProcessing'],'uniformBodyResampling':.5,'uniformPipeResampling':.65}
        else:
            p=source/('rail-'+key+('-matched-candidate.png' if facing=='up' else '-candidate.png'));image=Image.open(p).convert('RGBA');origin={'source':str(p).replace('\\','/'),'sourceSha':sha(p)}
            muzzles=({'neutral':[[79,15],[114,15]],'squash':[[93,15],[124,15]],'stretch':[[79,15],[114,15]]}[pose] if facing=='up' else {'neutral':[[243,39],[243,72]],'squash':[[253,40],[253,75]],'stretch':[[245,39],[245,74]]}[pose] if facing=='right' else {'neutral':[[13,39],[13,73]],'squash':[[13,43],[13,79]],'stretch':[[13,39],[13,74]]}[pose])
        box=image.getbbox(); baseline=box[3]-1; scan=baseline-5; runs=[]; start=None
        for x in range(image.width+1):
            on=x<image.width and image.getpixel((x,scan))[3]>64
            if on and start is None:start=x
            if not on and start is not None:
                if x-start>=3:runs.append([start,x-1])
                start=None
        if len(runs)!=2:raise ValueError((key,'expected two actual foot runs',runs))
        rootx=sum((a+b)/2 for a,b in runs)/2; file=out/(key+'.png');image.save(file)
        frames[key]={'src':str(file.relative_to('public')).replace('\\','/'),'root':[rootx,baseline],'size':list(image.size),'muzzles':muzzles,'attachments':attachments}
        records.append({'key':key,'origin':origin,'rootLocal':[rootx,baseline],'footScanY':scan,'selectedFootRuns':runs,'sourceMuzzlesLocal':muzzles,'runtime':str(file).replace('\\','/'),'runtimeSha':sha(file)})
frames['neutral']=frames['neutral-right']
data={'referenceRadius':100,'authoredFacing':True,'moveFrames':['squash','neutral','stretch','neutral'],'poseMapping':{'neutral':'neutral','squash':'squash','stretch':'stretch','attack':'neutral','windup':'squash','trigger':'neutral','recover':'neutral','contact':'neutral'},'frames':frames}
p=root/'src/view/art/characters/originalFrameData.js';d=json.loads(p.read_text(encoding='utf8').split('=',1)[1].strip().rstrip(';'));d['tower:RAIL']=data;p.write_text('export const originalFrameData = '+json.dumps(d,indent=2)+';\n',encoding='utf8')
p=root/'src/view/art/characters/originalLayerData.js';d=json.loads(p.read_text(encoding='utf8').split('=',1)[1].strip().rstrip(';'));d.pop('tower:RAIL',None);p.write_text('export const originalLayerData = '+json.dumps(d,indent=2)+';\n',encoding='utf8')
record={'classification':'AI-directional adaptation; down formal AI body plus single source-pixel rigid pipe runtime attachment; no program contours','sourceReview':'r10 source precheck only, awaiting actual runtime','attackMapping':'neutral facing reused, no independent authored attack or move attack','frames':records,'rigidPipeRuntime':{'path':str(out/'rigid-down-pipes.png').replace('\\','/'),'sha':sha(out/'rigid-down-pipes.png'),'size':pipe.size},'registration':data}
(out/'directional-source.json').write_text(json.dumps(record,indent=2),encoding='utf8');(source/'rail-directional-runtime-registration.json').write_text(json.dumps(record,indent=2),encoding='utf8')
