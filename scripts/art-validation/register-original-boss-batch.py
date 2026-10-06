"""Register approved actual crop pixels. No shape painting or AI reconstruction."""
from pathlib import Path
from PIL import Image
import json,hashlib,shutil,sys
from collections import deque
root=Path(__file__).resolve().parents[2]
submission=root/('docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/'+(sys.argv[1] if len(sys.argv)>1 else 'r08'))
module=root/'src/view/art/characters/originalFrameData.js'
data=json.loads(module.read_text(encoding='utf8').split(' = ',1)[1].strip().rstrip(';'))
mp=root/'src/view/art/characters/manifest.js';text=mp.read_text(encoding='utf8');prefix=text[:text.index('{')];manifest=json.loads(text[text.index('{'):].strip().rstrip(';'))
refs={'TWINS_SUN':125,'TWINS_MOON':125,'DRAGON':125,'SPIDER_MATRIARCH':105,'BLOOD_FORGE':150,'VOID_CONDUCTOR':150,'LABYRINTH_KEEPER':150,'NIGHTMARE_BLOOM':150,'HIVE':150,'COMMANDER':140,'HUNTER':110,'FORTRESS':150,'PRISM':120,'FROST_JUDGE':150,'RAIL_WARLORD':135,'COLLECTOR':130,'ASTROLABE':135}
# True sole centers isolate feet from lower hands/shields; suspended identities use original ground guide.
manual={
 'TWINS_SUN':[[335,452],[673,452],[1013,452],[1357,452]],
 'TWINS_MOON':[[335,803],[673,803],[1013,803],[1357,803]],
 'DRAGON':[[340,367],[710,367],[1095,367],[1479,367]],
 'VOID_CONDUCTOR':[[209,824],[587,824],[949,824],[1327,824]],
 'NIGHTMARE_BLOOM':[[315,834],[653,834],[998,834],[1348,834]],
 'HIVE':[[189,426],[576,426],[960,426],[1346,426]],
 'PRISM':[[260,797],[626,797],[970,797],[1335,797]],
 'ASTROLABE':[[195,835],[577,835],[957,835],[1336,835]],
}
feet_windows={
 'FORTRESS':[[[84,105],[213,234]],[[91,110],[219,239]],[[88,108],[221,240]],[[95,115],[227,247]]],
 'FROST_JUDGE':[[[141,153],[206,217]],[[142,159],[206,222]],[[141,157],[207,225]],[[143,154],[209,219]]],
 'RAIL_WARLORD':[[[75,89],[172,193]],[[74,91],[172,192]],[[72,86],[173,193]],[[77,91],[177,197]]],
}
all_records=[]
for path in sorted(submission.glob('*-original-candidate.json')):
 records=json.loads(path.read_text(encoding='utf8'));all_records.extend(records)
for identity in refs:
 rows=[r for r in all_records if r['id']==identity]
 if not rows:continue
 folder=root/f'public/art/original/v1/characters/boss-{identity.lower()}';folder.mkdir(parents=True,exist_ok=True);frames=[]
 for index,r in enumerate(rows):
  source=root/r['output'];im=Image.open(source).convert('RGBA');a=im.getchannel('A');opaque=a.point(lambda v:255 if v>64 else 0).getbbox();visible=a.point(lambda v:255 if v>12 else 0).getbbox();scan=opaque[3]-6;runs=[];start=None
  for x in range(im.width+1):
   on=x<im.width and a.getpixel((x,scan))>64
   if on and start is None:start=x
   if not on and start is not None:
    if x-start>=3:runs.append([start,x])
    start=None
  selected_feet=None
  if identity=='SPIDER_MATRIARCH':
   # Source four large load-bearing legs extend below the suspended tiny feet.
   y0=665-r['crop'][1];seen=set();selected_feet=[]
   for yy in range(y0,im.height):
    for xx in range(im.width):
     if (xx,yy) in seen or a.getpixel((xx,yy))<=64:continue
     q=deque([(xx,yy)]);seen.add((xx,yy));pixels=[]
     while q:
      x,y=q.popleft();pixels.append((x,y))
      for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
       if 0<=nx<im.width and y0<=ny<im.height and (nx,ny) not in seen and a.getpixel((nx,ny))>64:seen.add((nx,ny));q.append((nx,ny))
     if len(pixels)>15:
      sole=max(y for x,y in pixels);sole_x=[x for x,y in pixels if y>=sole-2];lo=min(sole_x);hi=max(sole_x)+1;selected_feet.append({'horizontalRun':[lo,hi],'soleY':sole,'centerX':(lo+hi)/2})
   assert len(selected_feet)==4,(r['state'],selected_feet)
   selected_feet.sort(key=lambda f:f['centerX']);contact=[sum(f['centerX'] for f in selected_feet)/4,max(f['soleY'] for f in selected_feet)];method='four physical load-bearing large leg soles alpha components below global y665; tiny feet suspended above excluded; center of four supports, lower actual sole baseline'
  elif identity in feet_windows:
   selected_feet=[]
   for lo,hi in feet_windows[identity][index]:
    sole=max(y for y in range(im.height) for x in range(lo,hi) if a.getpixel((x,y))>64)
    selected_feet.append({'horizontalRun':[lo,hi],'soleY':sole,'centerX':(lo+hi)/2})
   contact=[sum(f['centerX'] for f in selected_feet)/2,max(f['soleY'] for f in selected_feet)]
   method='actual paired feet alpha>64 runs, explicit foot isolation excluding fists/shields/abdomen/rail tip; root x mean of both sole centers; y lower physical sole'
  elif identity in manual:
   x,y=manual[identity][index];contact=[x-r['crop'][0],y-r['crop'][1]]
   method='original ground guide nominal root, airborne offset preserved'if identity in manual else'manually isolated actual paired feet horizontal midpoint; excludes fists/shields/abdomen'
  else:
   if len(runs) not in ([2,4] if identity=='SPIDER_MATRIARCH' else [2]):raise ValueError((identity,r['state'],runs))
   contact=[sum((lo+hi)/2 for lo,hi in runs)/len(runs),opaque[3]-1];method='actual alpha>64 paired sole horizontal midpoint, scan six pixels above opaque baseline'
  dest=folder/(r['state']+'.png');shutil.copyfile(source,dest);url=dest.relative_to(root/'public').as_posix();frames.append({**r,'url':url,'sha':hashlib.sha256(dest.read_bytes()).hexdigest(),'size':list(im.size),'visibleAlphaBounds':visible,'rootLocal':contact,'rootMeasurement':{'method':method,'detectedAlphaContactRuns':runs,'selectedActualFeet':selected_feet,'scanY':scan,'opaqueBottom':opaque[3]-1,'nominalRootSourceGlobal':manual[identity][index] if identity in manual else None,'nominalGroundGap':contact[1]-(opaque[3]-1) if identity in manual else 0}})
 record={'identity':'boss:'+identity,'classification':'original-crop-alpha-exterior plus explicitly measured internal paper separation where noted','originalSource':rows[0]['source'],'originalSourceSha':rows[0]['sourceSha'],'processing':'Approved original pixels only; outside paper alpha and specified enclosed gaps. No AI, vector rasterization or path painting.','presentationReferenceRadius':refs[identity],'frames':frames,'runtimeDerivedMapping':'No authored MOVE: neutral reused. Source NEUTRAL/WINDUP/ATTACK/OPEN retained. QA squash/stretch/contact aliases are derived, not new authored actions.'}
 (folder/'source.json').write_text(json.dumps(record,indent=2),encoding='utf8');art_id='boss:'+identity;data[art_id]={'referenceRadius':refs[identity],'moveFrames':['neutral'],'poseMapping':{'neutral':'neutral','windup':'windup','attack':'attack','trigger':'attack','open':'open','recover':'neutral','move':'neutral','squash':'windup','stretch':'attack','contact':'attack','intro':'neutral'},'frames':{f['state']:{'src':f['url'],'root':f['rootLocal'],'size':f['size']}for f in frames}}
 e=manifest[art_id];e.update({'pixelSourceStatus':'original-concept-cropped-frames-runtime-review-pending','sourceClassification':record['classification'],'actualPixelFrameManifest':(folder/'source.json').relative_to(root/'public').as_posix(),'sourceFile':record['originalSource'],'bodyResource':frames[0]['url'],'bodyPng':frames[0]['url'],'icon':{'src':frames[0]['url'],'width':frames[0]['size'][0],'height':frames[0]['size'][1],'alt':identity},'actualOriginalFrames':frames,'actualPixelAlphaBoundsByFrame':{f['state']:f['visibleAlphaBounds']for f in frames},'geometryMeasurementMode':'actual source alpha bbox; original actual soles or explicit nominal airborne ground root; old functional joints only','clipFrameVisualSource':'original PNG discrete NEUTRAL/WINDUP/ATTACK/OPEN source pixels'})
 if 'sourceAlphaBoundsPx'in e:e['historicalVectorAlphaBoundsPx']=e.pop('sourceAlphaBoundsPx')
 for clip in e.get('clips',{}).values():
  if isinstance(clip,dict):clip.setdefault('historicalVectorClipDescription',clip.get('frames'));clip['frames']='Actual decoded original-source PNG samples; truthful poseMapping in originalFrameData.js'
module.write_text('// Approved source PNG crops. Each source.json records provenance and actual or nominal ground roots.\nexport const originalFrameData = '+json.dumps(data,indent=2)+';\n',encoding='utf8')
mp.write_text(prefix+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
print(f'Registered {len(set(r["id"] for r in all_records))} original-source Boss bodies / {len(all_records)} real frames. Skill effects and runtime review pending.')
