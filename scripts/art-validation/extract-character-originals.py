"""Original concept pixels with recorded local AI-guide patches; never authored paths."""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib, json
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT/'docs/art-direction/sticker-bible-2026-10-01'
library=ROOT/'scripts/art-validation/extract-original-art.py'
ns={'__file__':str(library)}
exec(library.read_text(encoding='utf8').split("cut('leafLogo'")[0],ns)
alpha=ns['alpha_exterior']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def enemy01_local_rejected():
    source=BASE/'production-art-2026-10-02/enemies/submissions/r02/images/01-fast-tank.png'
    ai_file=ROOT/'docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r03/enemy01-ai-guides-clean.png'
    original=Image.open(source);ai=Image.open(ai_file)
    roots=[193,571,929,1321];states=['neutral','squash','stretch','contact']
    contact=Image.new('RGB',(1280,650),(180,180,180));labels=ImageDraw.Draw(contact)
    for row,identity in enumerate(['FAST','TANK']):
        folder=ROOT/f'public/art/original/v1/characters/{identity.lower()}';folder.mkdir(parents=True,exist_ok=True)
        y0,y1,root_y=(205,466,449)if row==0 else(600,860,843)
        columns=[(30,340),(395,715),(775,1095),(1140,1505)]if row==0 else[(25,365),(385,739),(760,1105),(1120,1510)]
        records=[]
        for col,(state,(x0,x1),root_x)in enumerate(zip(states,columns,roots)):
            crop=(x0,y0,x1,y1);raw=original.crop(crop).convert('RGBA');alpha(raw).save(folder/f'{state}-original-alpha.png')
            regions=[(root_x-1,y0,root_x+2,y1),(x0,root_y-2,x1,root_y+2),(root_x-16,root_y-15,root_x+16,min(y1,root_y+16))]
            # Remove guides before background flood so enclosed paper below feet can escape.
            for region in regions:raw.paste(ai.crop(region),(region[0]-x0,region[1]-y0))
            fixed=alpha(raw);fixed.save(folder/f'{state}.png')
            records.append({'state':state,'crop':crop,'rootLocal':[root_x-x0,root_y-y0],'AIEditSourceRects':regions,'url':f'art/original/v1/characters/{identity.lower()}/{state}.png','sha':sha(folder/f'{state}.png'),'visibleAlphaBounds':fixed.getchannel('A').getbbox()})
            small=fixed.copy();small.thumbnail((300,280));contact.paste(small,(col*320,row*325+30),small);labels.text((col*320+10,row*325+5),f'{identity}/{state}',fill='#4B281C')
        data={'classification':'original-source-crop+local-AI-guide-edit','source':str(source.relative_to(ROOT)).replace('\\','/'),'sourceSha':sha(source),'AIOutput':str(ai_file.relative_to(ROOT)).replace('\\','/'),'AIOutputSha':sha(ai_file),'processing':'Original pixels preserved except 3px vertical guide strip, 4px ground-line strip and 32px root-cross patch. Same-position AI output copied only in those masks before exterior paper alpha flood. No drawing. Original alpha crops retained.','frames':records}
        (folder/'source.json').write_text(json.dumps(data,indent=2),encoding='utf8')
    contact.save(ROOT/'docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r03/enemy01-local-edit-contact.jpg')

def enemy01():
    import shutil
    source=BASE/'production-art-2026-10-02/enemies/submissions/r02/images/01-fast-tank.png'
    staged=ROOT/'docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r03/enemy01-ai-guides-clean.png'
    edited=BASE/'production-supplements-2026-10-06/enemy01-fast-tank-guides-clean.png'
    shutil.copyfile(staged,edited)
    im=Image.open(edited).convert('RGBA');states=['neutral','squash','stretch','contact'];runtime={}
    contact=Image.new('RGB',(1320,700),(180,180,180));labels=ImageDraw.Draw(contact)
    for row,identity in enumerate(['FAST','TANK']):
        folder=ROOT/f'public/art/original/v1/characters/{identity.lower()}'
        if (folder/'source.json').exists() and not (folder/'source-local-rejected.json').exists():
            shutil.copyfile(folder/'source.json',folder/'source-local-rejected.json')
            for state in states:shutil.copyfile(folder/f'{state}.png',folder/f'{state}-local-rejected.png')
        y0,y1=(180,480)if row==0 else(590,865)
        columns=[(30,365),(380,750),(770,1105),(1120,1510)]if row==0 else[(20,375),(380,750),(760,1110),(1120,1515)]
        frames=[]
        for col,(state,(x0,x1))in enumerate(zip(states,columns)):
            crop=[x0,y0,x1,y1];sprite=im.crop(crop);a=sprite.getchannel('A')
            # Preserve antialiasing above 12; remove only nearly invisible AI exterior dust.
            sprite.putalpha(a.point(lambda v:0 if v<=12 else v));a=sprite.getchannel('A')
            bounds=a.point(lambda v:255 if v>64 else 0).getbbox();scan_y=bounds[3]-6;runs=[];start=None
            for x in range(sprite.width+1):
                opaque=x<sprite.width and a.getpixel((x,scan_y))>64
                if opaque and start is None:start=x
                if not opaque and start is not None:
                    if x-start>=3:runs.append([start,x])
                    start=None
            if len(runs)!=2:raise ValueError(f'{identity}/{state} foot run registration ambiguous: {runs}')
            root=[sum((lo+hi)/2 for lo,hi in runs)/2,bounds[3]-1]
            output=folder/f'{state}.png';sprite.save(output)
            frames.append({'state':state,'crop':crop,'rootLocal':root,'rootMeasurement':{'alphaThreshold':64,'scanY':scan_y,'soleRuns':runs,'baselineY':bounds[3]-1},'url':f'art/original/v1/characters/{identity.lower()}/{state}.png','sha':sha(output),'visibleAlphaBounds':sprite.getchannel('A').getbbox(),'size':list(sprite.size)})
            display=sprite.copy();display.thumbnail((315,300));contact.paste(display,(col*330+5,row*350+35),display);labels.text((col*330+10,row*350+8),f'{identity}/{state} root={root}',fill='#4B281C')
        data={'classification':'original-concept AI-edited-entire-frame','originalSource':source.relative_to(ROOT).as_posix(),'originalSourceSha':sha(source),'editedSource':edited.relative_to(ROOT).as_posix(),'editedSourceSha':sha(edited),'processing':'Built-in imagegen full-frame guide cleanup, per-board root source approval. Crop original AI-edited atlas; retain real alpha, remove alpha<=12 exterior dust only. No local seam candidate, no hand drawn pixels, no SVG rasterization. Register each actual sole-pair midpoint; fixed local root in runtime.','frames':frames}
        (folder/'source.json').write_text(json.dumps(data,indent=2),encoding='utf8')
        runtime[f'enemy:{identity}']={'referenceRadius':80 if row==0 else 130,'frames':{f['state']:{'src':f['url'],'root':f['rootLocal'],'size':f['size']}for f in frames}}
    (ROOT/'src/view/art/characters/originalFrameData.js').write_text('// Generated from approved AI-edited concept crops; source.json records provenance and actual sole roots.\nexport const originalFrameData = '+json.dumps(runtime,indent=2)+';\n',encoding='utf8')
    contact.save(ROOT/'docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r03/enemy01-registered-contact.jpg')

if __name__=='__main__':enemy01()
