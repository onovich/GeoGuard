"""Deterministic production pixels, never SVG rasterization or shape reconstruction."""
from PIL import Image, ImageDraw
from pathlib import Path
from collections import deque
import hashlib, json

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'docs/art-direction/sticker-bible-2026-10-01'
OUT = ROOT / 'public/art/original/v1'
OUT.mkdir(parents=True, exist_ok=True)
B5='production-art-2026-10-02/effects-ui/submissions/r02/b05-start-end.png'
B6='production-art-2026-10-02/effects-ui/submissions/r02/b06-rewards-blueprints.png'
B7='production-art-2026-10-02/effects-ui/submissions/r02/b07-controls-placement.png'
D3='scene-ui-2026-10-02/ui/submissions/r02/dui03-boss-rewards.png'
records=[]

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()

def alpha_exterior(im):
    """Remove only exterior-connected pale paper; retain enclosed light artwork."""
    im=im.convert('RGBA'); pixels=im.load(); w,h=im.size
    mask=bytearray(w*h); queue=deque(); corner=pixels[0,0][:3]
    def paper(x,y):
        r,g,b,a=pixels[x,y]; return a==0 or (min(r,g,b)>205 and max(r,g,b)-min(r,g,b)<42) or sum((v-c)**2 for v,c in zip((r,g,b),corner))<25**2
    def offer(x,y):
        i=y*w+x
        if not mask[i] and paper(x,y): mask[i]=1;queue.append((x,y))
    for x in range(w): offer(x,0);offer(x,h-1)
    for y in range(h): offer(0,y);offer(w-1,y)
    while queue:
        x,y=queue.popleft()
        for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=nx<w and 0<=ny<h: offer(nx,ny)
    for y in range(h):
        for x in range(w):
            if mask[y*w+x]: pixels[x,y]=(*pixels[x,y][:3],0)
    # Delete only isolated exterior paper dust; retain all meaningful source objects.
    seen=set()
    for y in range(h):
        for x in range(w):
            if (x,y) in seen or not pixels[x,y][3]: continue
            component=[]; q=deque([(x,y)]);seen.add((x,y))
            while q:
                p=q.popleft();component.append(p)
                for nx,ny in ((p[0]-1,p[1]),(p[0]+1,p[1]),(p[0],p[1]-1),(p[0],p[1]+1)):
                    if 0<=nx<w and 0<=ny<h and (nx,ny) not in seen and pixels[nx,ny][3]:seen.add((nx,ny));q.append((nx,ny))
            if len(component)<40:
                for px,py in component: pixels[px,py]=(*pixels[px,py][:3],0)
    return im

def cut(name,source,box):
    raw=Image.open(BASE/source).crop(box)
    im=alpha_exterior(raw); im.save(OUT/f'{name}.png')
    records.append(dict(id=name,classification='original-crop-alpha-exterior',source=f'docs/art-direction/sticker-bible-2026-10-01/{source}',sourceSha=sha(BASE/source),crop=box,processing='exterior-connected pale paper alpha removal; enclosed pixels preserved',size=im.size,url=f'art/original/v1/{name}.png',sha=sha(OUT/f'{name}.png')))

def skin(name,source,box,inset,center):
    raw=Image.open(BASE/source).crop(box).convert('RGBA'); w,h=raw.size;s=inset
    # Nine regions preserve original corners/edges, center copies a text-free source pixel.
    atlas=Image.new('RGBA',(s*2+1,s*2+1))
    xs=[(0,s),(s,w-s),(w-s,w)];ys=[(0,s),(s,h-s),(h-s,h)]
    for row,(y0,y1) in enumerate(ys):
        for col,(x0,x1) in enumerate(xs):
            tile=raw.crop((x0,y0,x1,y1))
            if col==1 and row!=1: tile=raw.crop((s+6,y0,s+7,y1))
            if row==1 and col!=1: tile=raw.crop((x0,h//2,x1,h//2+1))
            if row==1 and col==1: tile=raw.crop((center[0],center[1],center[0]+1,center[1]+1))
            tile=tile.resize((s if col!=1 else 1,s if row!=1 else 1),Image.Resampling.LANCZOS)
            atlas.paste(tile,((0,s,s+1)[col],(0,s,s+1)[row]))
    atlas=alpha_exterior(atlas);atlas.save(OUT/f'{name}.png')
    records.append(dict(id=name,classification='original-pixel-nine-slice-mosaic',source=f'docs/art-direction/sticker-bible-2026-10-01/{source}',sourceSha=sha(BASE/source),crop=box,inset=s,centerSample=[box[0]+center[0],box[1]+center[1]],processing='original border regions resampled into nine-slice atlas; center text-free original pixel; no drawing',size=atlas.size,url=f'art/original/v1/{name}.png',sha=sha(OUT/f'{name}.png')))

cut('leafLogo',B5,(325,266,532,370))
cut('shattered',B5,(1050,276,1365,430))
cut('heart',B6,(112,700,193,775))
cut('gem',B6,(839,385,951,493))
cut('blueprint',B6,(129,366,269,476))
cut('upgradeBlueprint',B6,(473,366,627,457))
cut('arrowUp',B6,(538,386,587,435))
cut('warning',B7,(863,735,897,775))
cut('check',B7,(633,760,683,817))
cut('close',B7,(776,759,830,812))
cut('arrowLeft',B7,(1307,313,1332,337))
cut('arrowDown',B7,(1361,310,1384,342))
cut('arrowRight',B7,(1409,313,1439,337))
cut('wave',D3,(288,107,309,139))
# Clock has no verified standalone crop in this board; formal asset gap.
if (OUT/'clock.png').exists(): (OUT/'clock.png').unlink()
skin('button-sage',B7,(157,346,387,410),29,(34,30))
skin('button-coral',B6,(554,703,787,769),29,(34,30))
skin('button-blue',B6,(69,551,368,610),26,(34,27))
skin('button-honey',B6,(763,551,1029,610),26,(34,27))
skin('panel',B6,(394,226,737,628),16,(20,100))
skin('card',B6,(394,226,737,628),16,(20,100))
skin('keycap',B7,(1344,250,1394,301),9,(6,22))
cut('reward-accent',B6,(367,133,411,181))
cut('title-start',B5,(255,388,623,486))
cut('title-end',B5,(1040,445,1385,537))
cut('divider',B5,(251,510,394,520))
if (OUT/'root-shadow.png').exists(): (OUT/'root-shadow.png').unlink()
(OUT/'manifest.json').write_text(json.dumps(dict(schemaVersion=1,assets=records),ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(records)} original pixel assets written')
contact=Image.new('RGB',(1000,((len(records)+4)//5)*170),(190,190,190)); draw=ImageDraw.Draw(contact)
for i,asset in enumerate(records):
    im=Image.open(OUT/f"{asset['id']}.png").convert('RGBA'); im.thumbnail((185,130))
    x=(i%5)*200+(200-im.width)//2; y=(i//5)*170+24
    contact.paste(im,(x,y),im);draw.text(((i%5)*200+8,(i//5)*170+4),asset['id'],fill=(0,0,0))
review=ROOT/'docs/art-fidelity-2026-10-06-crosscheck/full-repair/submissions/r03';review.mkdir(parents=True,exist_ok=True)
contact.save(review/'s1-source-contact.jpg')
