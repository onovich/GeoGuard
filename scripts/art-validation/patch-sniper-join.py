from PIL import Image,ImageDraw
from pathlib import Path
import json,hashlib
f=Path('docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r07')
path=Path('public/art/original/v1/characters/sniper/body-part.png')
old=Image.open(path).convert('RGBA');edit=Image.open(f/'sniper-open-join-ai.png').convert('RGBA')
b=edit.getchannel('A').point(lambda a:255 if a>12 else 0).getbbox();edit=edit.crop(b).resize(old.size,Image.Resampling.LANCZOS);patched=old.copy();rects=[[384,57,446,125],[350,112,446,178]]
for box in rects:patched.paste(edit.crop(box),box)
patched.save(f/'sniper-local-join-body.png');contact=Image.new('RGB',(900,650),'#c8c6bc');d=ImageDraw.Draw(contact)
for i,im in enumerate([old,patched]):
 contact.paste(im,(i*450,30),im);d.text((i*450+8,8),'approved AI body'if i==0 else'local AI join patch',fill='#4B281C')
contact.save(f/'sniper-local-join-contact.jpg')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
(f/'sniper-local-join-source.json').write_text(json.dumps({'classification':'AI-local-layer-join-edit applied to previously AI-reconstructed layer','originalSource':path.as_posix(),'originalSourceSha':sha(path),'editedSource':str(f/'sniper-open-join-ai.png'),'editedSourceSha':sha(f/'sniper-open-join-ai.png'),'editedAlphaBBox':b,'processing':'Resample AI edit alpha bbox to approved layer size. Replace only listed join rectangles with actual AI pixels; rest unchanged, eyes outside patch rectangles. No procedural drawing.','localEditRects':rects,'output':str(f/'sniper-local-join-body.png'),'outputSha':sha(f/'sniper-local-join-body.png')},indent=2),encoding='utf8')
