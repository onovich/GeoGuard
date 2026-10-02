from pathlib import Path
import json, math, html, shutil
from PIL import Image, ImageDraw, ImageFont

owner = Path(__file__).resolve().parent
out = owner / 'submissions' / 'r02'
assert not (out / 'packet.json').exists(), 'Immutable sealed packet'
out.mkdir(parents=True, exist_ok=True)
(out / 'contacts').mkdir(exist_ok=True)
(out / 'evidence').mkdir(exist_ok=True)
audit = json.loads((owner / 'runtime-audit.json').read_text('utf-8'))
font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 17)
small = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 14)
title = ImageFont.truetype('C:/Windows/Fonts/consolab.ttf', 21)
rows = []
for skill in audit['skills']:
    best = skill['bestEvidence']
    assert best and best['visibleAllStages']
    item = {'index': skill['index'], 'ability': skill['ability'], 'scene': best['scene'], 'role': best['role'], 'actualPhaseIndex': best['phaseIndex'], 'dispatchPath':skill['dispatchPath'], 'source':skill['source'], 'stages':{}, 'originReport':best['report'], 'visualApproval':False}
    folder = out / 'evidence' / f"{skill['index']:02}-{skill['ability']}"
    folder.mkdir(exist_ok=True)
    for stage in ['windup','execute','recover']:
        data = best['stages'][stage]
        for ext in ['png','json']:
            shutil.copyfile(owner / data[ext], folder / f'{stage}.{ext}')
        item['stages'][stage] = {'frame':data['frame'],'gameTime':data['time'],'mode':data['mode'],'screen':data['screen'],'opening':data['opening'],'png':(folder / f'{stage}.png').relative_to(out).as_posix(),'json':(folder / f'{stage}.json').relative_to(out).as_posix(),'originPng':data['png'],'originJson':data['json'], 'ownedHazardCount':len(data['ownedHazards']), 'ownedChildrenCount':len(data['ownedChildren'])}
    # Full per-item pause frame, where captured in this representative scene.
    if best.get('pause'):
        p=best['pause']['evidence']; source=owner / Path(best['report']).parent
        for ext in ['png','json']:
            shutil.copyfile(source / p[ext], folder / f'pause.{ext}')
        item['pause']={'pass':best['pause']['pass'],'frame':p['frame'],'png':(folder/'pause.png').relative_to(out).as_posix(),'json':(folder/'pause.json').relative_to(out).as_posix()}
    rows.append(item)

per_page=8; tw,th=400,250; row_h=292
for page_i in range(math.ceil(len(rows)/per_page)):
    group=rows[page_i*per_page:(page_i+1)*per_page]
    img=Image.new('RGB',(1200,62+row_h*len(group)), '#fff9ef');d=ImageDraw.Draw(img)
    d.text((12,5),f'GeoGuard actual skills {page_i+1:02}/12 | frozen candidate f353ca07 | NOT VISUAL APPROVAL',font=title,fill='#4b281c')
    for col,stage in enumerate(['WINDUP','EXECUTE (may directly recover)','RECOVER / OPEN']):d.text((col*tw+8,34),stage,font=font,fill='#4b281c')
    for row_i,item in enumerate(group):
        y=62+row_i*row_h
        label=f"{item['index']:02} {item['ability']} | {item['scene']} / {item['role']} | actual P{item['actualPhaseIndex']+1}"
        d.text((8,y+2),label,font=font,fill='#4b281c')
        for col,stage in enumerate(['windup','execute','recover']):
            s=item['stages'][stage];pic=Image.open(out/s['png']).convert('RGB');pic.thumbnail((tw,th),Image.Resampling.LANCZOS)
            # Entire original PNG, proportionally scaled; no crop, recolor, overlay or invented art.
            img.paste(pic,(col*tw+(tw-pic.width)//2,y+25+(th-pic.height)//2))
            d.text((col*tw+5,y+276),f"f{s['frame']} t={s['gameTime']:.3f}s {s['mode']} H{s['ownedHazardCount']} C{s['ownedChildrenCount']}",font=small,fill='#4b281c')
    img.save(out/'contacts'/f'skills-{page_i+1:02}.png')

(out/'png-index.json').write_text(json.dumps({'skills':rows,'contactMethod':'Full original PNG uniformly scaled and laid out; labels only outside source images; no cropping/retouching','visualApproval':False},ensure_ascii=False,indent=2)+'\n','utf-8')
body=['<!doctype html><meta charset="utf-8"><title>95 actual skill lifecycles</title><style>body{font:16px/1.5 system-ui;background:#fff9ef;color:#4b281c;margin:24px}table{border-collapse:collapse}td,th{padding:8px;border:1px solid #b6a99a}img{max-width:100%}a{color:#285b5b}.frames{display:flex}.frames a{width:33.3%}</style><h1>95 actual skill lifecycles — root review pending</h1><p>Original GUI + original engine. Three stages have exact seed/frame/state records. Instant effects may execute directly into recover. Source candidate f353ca07. All original PNGs are linked below; contact sheets only resize/layout whole images.</p><p><a href="README.md">Scope and limitations</a> · <a href="coverage.json">Coverage</a> · <a href="png-index.json">Machine PNG index</a></p><h2>Contact sheets</h2>']
body+= [f'<a href="contacts/skills-{i:02}.png">Sheet {i:02}</a> · ' for i in range(1,13)]
for item in rows:
    body.append(f"<h2 id='{item['ability']}'>{item['index']:02} {html.escape(item['ability'])}</h2><p>{html.escape(item['scene'])} / {item['role']}; actual P{item['actualPhaseIndex']+1}</p><div class='frames'>")
    for stage in ['windup','execute','recover']:
        s=item['stages'][stage];body.append(f"<a href='{s['png']}'><img loading='lazy' src='{s['png']}' alt='{item['ability']} {stage}'>{stage}: f{s['frame']}, {s['gameTime']:.3f}s, {s['mode']}</a>")
    body.append('</div><p>'+ ' · '.join(f"<a href='{item['stages'][s]['json']}'>{s} full snapshot</a>" for s in ['windup','execute','recover'])+'</p>')
(out/'index.html').write_text(''.join(body),'utf-8')
print(json.dumps({'skills':len(rows),'contactSheets':12,'output':str(out)}))
