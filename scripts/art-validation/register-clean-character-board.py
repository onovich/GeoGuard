"""Register a reviewer-approved AI edited sheet as real cropped alpha pixels.
No pixel painting; true contact root from source silhouette, no baked translation.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json,hashlib,sys,shutil
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'docs/art-direction/sticker-bible-2026-10-01'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def register(config):
    original=ROOT/config['original'];edited=ROOT/config['candidate']
    formal=BASE/'production-supplements-2026-10-06'/config['formalName'];shutil.copyfile(edited,formal)
    im=Image.open(formal).convert('RGBA');runtime={};contact=Image.new('RGB',(1320,350*sum((len(e.get('states',['neutral','squash','stretch','contact']))+3)//4 for e in config['identities'])),(180,180,180));draw=ImageDraw.Draw(contact);row_offset=0
    for row,entry in enumerate(config['identities']):
        identity=entry['id'];asset_folder=entry.get('folder',identity.lower());art_id=entry.get('artId',f'enemy:{identity}');folder=ROOT/f'public/art/original/v1/characters/{asset_folder}';folder.mkdir(parents=True,exist_ok=True);frames=[]
        for col,(state,crop)in enumerate(zip(entry.get('states',['neutral','squash','stretch','contact']),entry['crops'])):
            sprite=im.crop(crop);sprite.putalpha(sprite.getchannel('A').point(lambda v:0 if v<=12 else v));a=sprite.getchannel('A');b=a.point(lambda v:255 if v>64 else 0).getbbox();scan_y=b[3]-6;runs=[];start=None
            for x in range(sprite.width+1):
                on=x<sprite.width and a.getpixel((x,scan_y))>64
                if on and start is None:start=x
                if not on and start is not None:
                    if x-start>=3:runs.append([start,x])
                    start=None
            detected_runs=runs.copy()
            manual_contact=entry.get('contactMeasurement',{}).get(state)
            if manual_contact:
                scan_y=manual_contact['scanYGlobal']-crop[1]
                runs=[[lo-crop[0],hi-crop[0]]for lo,hi in manual_contact['footRunsGlobal']]
            if state in entry.get('footRunOverrides',{}):runs=entry['footRunOverrides'][state]
            if len(runs)!=entry['soleRuns']:raise ValueError(f'{identity}/{state}: expected {entry["soleRuns"]} contacts, got {runs}')
            root=[sum((lo+hi)/2 for lo,hi in runs)/len(runs),b[3]-1]
            if manual_contact:root[1]=manual_contact['baselineYGlobal']-crop[1]
            output=folder/f'{state}.png';sprite.save(output);frames.append({'state':state,'sourceLabel':entry.get('sourceLabels',{}).get(state,state),'crop':crop,'rootLocal':root,'rootMeasurement':{'scanY':scan_y,'alphaThreshold':64,'soleRuns':runs,'detectedRuns':detected_runs,'manualContactIsolation':bool(manual_contact)or state in entry.get('footRunOverrides',{}),'isolationReason':entry.get('footOverrideReason'),'manualContact':manual_contact,'baselineY':root[1]},'url':f'art/original/v1/characters/{asset_folder}/{state}.png','sha':sha(output),'visibleAlphaBounds':a.getbbox(),'size':list(sprite.size)})
            thumbnail=sprite.copy();thumbnail.thumbnail((310,295));contact.paste(thumbnail,(col%4*330+8,(row_offset+col//4)*350+30),thumbnail);draw.text((col%4*330+8,(row_offset+col//4)*350+8),f'{identity}/{entry.get("sourceLabels",{}).get(state,state)} root={root}',fill='#4B281C')
        data={'classification':'original-concept AI-edited-entire-frame','originalSource':config['original'],'originalSourceSha':sha(original),'editedSource':formal.relative_to(ROOT).as_posix(),'editedSourceSha':sha(formal),'prompt':config['prompt'],'processing':'Reviewed full-frame AI guide removal; actual RGBA crop, alpha<=12 exterior dust removed. True alpha contact-root registration. No path painting or rasterized vectors.','presentationReferenceRadius':entry['referenceRadius'],'runtimeDerivedMapping':entry.get('runtimeDerivedMapping'),'intermediateEdits':config.get('intermediateEdits',[]),'frames':frames}
        (folder/'source.json').write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding='utf8')
        runtime[art_id]={'referenceRadius':entry['referenceRadius'],'moveFrames':entry.get('moveFrames'),'poseMapping':entry.get('poseMapping'),'frames':{f['state']:{'src':f['url'],'root':f['rootLocal'],'size':f['size']}for f in frames}}
        row_offset+=(len(frames)+3)//4
    module=ROOT/'src/view/art/characters/originalFrameData.js';existing=json.loads(module.read_text(encoding='utf8').split(' = ',1)[1].rstrip().rstrip(';'));existing.update(runtime);module.write_text('// Approved edited concept PNG crops. Each source.json records provenance and actual contact roots.\nexport const originalFrameData = '+json.dumps(existing,indent=2)+';\n',encoding='utf8')
    contact.save(ROOT/config['contactOutput'])
    manifest_file=ROOT/'src/view/art/characters/manifest.js';text=manifest_file.read_text(encoding='utf8');prefix=text[:text.index('{')];manifest=json.loads(text[text.index('{'):].rstrip().rstrip(';'))
    for entry in config['identities']:
        identity=entry['id'];asset_folder=entry.get('folder',identity.lower());art_id=entry.get('artId',f'enemy:{identity}');s=json.loads((ROOT/f'public/art/original/v1/characters/{asset_folder}/source.json').read_text(encoding='utf8'));e=manifest[art_id];e.update({'pixelSourceStatus':'AI-edited-concept-frames-runtime-review-pending','sourceFile':s['editedSource'],'originalConceptFile':s['originalSource'],'sourceClassification':s['classification'],'actualPixelFrameManifest':f'art/original/v1/characters/{asset_folder}/source.json','bodyResource':s['frames'][0]['url'],'bodyPng':s['frames'][0]['url'],'icon':{'src':s['frames'][0]['url'],'width':s['frames'][0]['size'][0],'height':s['frames'][0]['size'][1],'alt':entry['name']},'geometryMeasurementMode':'actual alpha>12 bounds; per-frame contact root measured alpha>64; retained functional joints only','anchorCoordinateSpace':'256x256 retained functional layout; bitmap frame roots separately recorded','actualOriginalFrames':s['frames'],'clipFrameVisualSource':'AI-edited original concept PNG discrete frames; no vector sampler'})
        for clip in e.get('clips',{}).values():
            if isinstance(clip,dict):
                if 'frames'in clip:
                    clip.setdefault('historicalVectorClipDescription',clip['frames'])
                    clip['frames']='Actual decoded PNG authored frame samples; poseMapping/moveFrames recorded in originalFrameData.js. Original alpha fade preserved; no vector sampler.'
                clip['runtimeVisualSource']=e['clipFrameVisualSource']
        if 'sourceAlphaBoundsPx'in e:e['historicalVectorAlphaBoundsPx']=e.pop('sourceAlphaBoundsPx')
        e['actualPixelAlphaBoundsByFrame']={f['state']:f['visibleAlphaBounds']for f in s['frames']}
        e['actualPixelSourceSizesByFrame']={f['state']:f['size']for f in s['frames']}
    manifest_file.write_text(prefix+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
    formal.with_suffix('.json').write_text(json.dumps({**config,'classification':'original-concept AI-edited-entire-frame','originalSourceSha':sha(original),'editedSourceSha':sha(formal),'formalSource':formal.relative_to(ROOT).as_posix()},indent=2,ensure_ascii=False),encoding='utf8')
    group='塔与英雄'if any(e.get('artId','').startswith(('hero:','tower:'))for e in config['identities'])else'Boss'if any(e.get('artId','').startswith('boss:')for e in config['identities'])else'敌人与机制'
    bible=BASE/'index.html';text=bible.read_text(encoding='utf8');rel=formal.relative_to(BASE).as_posix();ids=' / '.join(e['id']for e in config['identities']);article=f'<article data-group="{group}"><a href="{rel}" target="_blank"><img loading="lazy" src="{rel}" alt="{ids} 原概念AI去辅助线"></a><div class="caption"><h2>生产补充 · {ids}</h2><p>整帧AI编辑原概念，非旧板直接切图；原帧真实像素，固定接触root。来源通过，动态待验。</p><a href="{rel[:-4]}.json">来源处理记录</a></div></article>'
    if rel not in text:text=text.replace('</main>',article+'</main>',1)
    bible.write_text(text,encoding='utf8')
if __name__=='__main__':register(json.loads(Path(sys.argv[1]).read_text(encoding='utf8')))
