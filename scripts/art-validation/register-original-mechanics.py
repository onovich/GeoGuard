from pathlib import Path
from PIL import Image
import json,hashlib,shutil
root=Path(__file__).resolve().parents[2];r=root/'docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r10'
mp=root/'src/view/art/characters/manifest.js';txt=mp.read_text(encoding='utf8');prefix=txt[:txt.index('{')];manifest=json.loads(txt[txt.index('{'):].strip().rstrip(';'))
mod=root/'src/view/art/characters/originalFrameData.js';data=json.loads(mod.read_text(encoding='utf8').split(' = ',1)[1].strip().rstrip(';'))
refs={'NEST':110,'WEB':140,'ROOT':140,'WALL':150,'SEAL':150,'RETICLE':130,'COURIER':130}
nominal={'WEB':[[309,774],[675,774],[1060,774],[1455,774]],'ROOT':[[232,407],[635,407],[1045,407],[1450,407]],'SEAL':[[238,430],[638,430],[1046,430],[1450,430]],'RETICLE':[[249,394],[665,394],[1066,394],[1471,394]]}
courier=[[[155,218],[271,311]],[[583,636],[718,768]],[[1033,1085],[1163,1192]],[[1434,1482],[1559,1587]]]
records=[]
for p in r.glob('*-original-candidate.json'):records.extend(json.loads(p.read_text(encoding='utf8')))
for identity in refs:
 rows=[f for f in records if f['id']==identity];folder=root/f'public/art/original/v1/characters/mechanic-{identity.lower()}';folder.mkdir(exist_ok=True);frames={};measured=[]
 for i,f in enumerate(rows):
  im=Image.open(root/f['output']);a=im.getchannel('A');box=a.point(lambda v:255 if v>64 else 0).getbbox();scan=box[3]-6;runs=[];start=None;feet=None
  for x in range(im.width+1):
   on=x<im.width and a.getpixel((x,scan))>64
   if on and start is None:start=x
   if not on and start is not None:
    if x-start>=3:runs.append([start,x])
    start=None
  if identity in nominal:
   gx,gy=nominal[identity][i];contact=[gx-f['crop'][0],gy-f['crop'][1]];method='explicit source nominal guide root; original body-to-baseline gap retained'
  elif identity=='COURIER':
   feet=[]
   for lo,hi in courier[i]:
    lo-=f['crop'][0];hi-=f['crop'][0];sole=max(y for y in range(im.height) for x in range(lo,hi) if a.getpixel((x,y))>64);xs=[x for x in range(lo,hi) if any(a.getpixel((x,yy))>64 for yy in range(max(0,sole-2),sole+1))];feet.append({'soleY':sole,'horizontalRun':[min(xs),max(xs)+1],'centerX':(min(xs)+max(xs)+1)/2})
   contact=[sum(v['centerX'] for v in feet)/2,max(v['soleY'] for v in feet)];method='explicit two foot source windows; true alpha soles with perspective baseline difference retained, horizontal mean fixed'
  else:
   assert len(runs)==2,(identity,f['state'],runs);contact=[sum((lo+hi)/2 for lo,hi in runs)/2,box[3]-1];method='actual paired sole alpha midpoint'
  dest=folder/(f['state']+'.png');shutil.copyfile(root/f['output'],dest);url=dest.relative_to(root/'public').as_posix();frames[f['state']]={'src':url,'size':list(im.size),'root':contact};measured.append({**f,'runtimeUrl':url,'rootLocal':contact,'rootMeasurement':{'method':method,'selectedFootRuns':None if identity in nominal else runs,'selectedActualFeet':feet,'scanY':scan,'nominalBodyGap':contact[1]-(box[3]-1) if identity in nominal else 0},'runtimeSha':hashlib.sha256(dest.read_bytes()).hexdigest()})
 frames['neutral']=frames['intact'];art='mechanic:'+identity;data[art]={'referenceRadius':refs[identity],'moveFrames':['intact'],'poseMapping':{'neutral':'intact','intact':'intact','attack':'trigger','trigger':'trigger','windup':'intact','open':'trigger','broken':'broken','fade':'fade','move':'intact','squash':'intact','stretch':'trigger','contact':'trigger'},'frames':frames}
 source={'identity':art,'classification':'original-crop-guide-and-paper-alpha','originalSource':rows[0]['source'],'originalSourceSha':rows[0]['sourceSha'],'frames':measured,'runtimeNotes':'Authored INTACT/TRIGGER/BROKEN/FADE; same entity broken pieces, no children. FADE source pale colors sampled with existing single lifecycle alpha.'};(folder/'source.json').write_text(json.dumps(source,indent=2),encoding='utf8')
 e=manifest[art];e.update({'pixelSourceStatus':'actual-original-lifecycle-png-runtime-review-pending','sourceClassification':source['classification'],'actualPixelFrameManifest':(folder/'source.json').relative_to(root/'public').as_posix(),'bodyResource':frames['intact']['src'],'bodyPng':frames['intact']['src'],'icon':{'src':frames['intact']['src'],'width':frames['intact']['size'][0],'height':frames['intact']['size'][1],'alt':identity},'actualOriginalFrames':measured,'geometryMeasurementMode':'actual cached alpha bbox and explicit sole/nominal roots','clipFrameVisualSource':'Original PNG INTACT/TRIGGER/BROKEN/FADE'})
 for clip in e.get('clips',{}).values():
  if isinstance(clip,dict):clip.setdefault('historicalVectorClipDescription',clip.get('frames'));clip['frames']='Actual decoded original lifecycle PNGs'
mod.write_text('export const originalFrameData = '+json.dumps(data,indent=2)+';\n',encoding='utf8');mp.write_text(prefix+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
print('Registered 7 actual original mechanics / 28 lifecycle frames')
