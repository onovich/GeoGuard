"""Read-only upstream audit + editable vector illustration proposal. Writes only this revision."""
from pathlib import Path
import json, hashlib, math, re, html
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[4]
ART = ROOT / 'docs/art-direction/sticker-bible-2026-10-01'
FX = ART / 'production-art-2026-10-02/effects-ui/submissions/r02'
BG = ART / 'scene-ui-2026-10-02/background/submissions/r02'
INK = '#4B281C'
CREAM = '#FFF9EF'

def read(path): return json.loads(path.read_text(encoding='utf-8-sig'))
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def dump(name, value):
    (OUT/name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

class Board:
    """One scene description rendered as editable SVG and a 2x supersampled PNG."""
    def __init__(self, name, width, height):
        self.name, self.w, self.h = name, width, height
        self.svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">']
        self.im = Image.new('RGB', (width*2,height*2), CREAM)
        self.d = ImageDraw.Draw(self.im)
        self.rect(0,0,width,height,CREAM)
    def attrs(self, fill, stroke, sw):
        return f'fill="{fill or "none"}" stroke="{stroke or "none"}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"'
    def rect(self,x,y,w,h,fill=None,stroke=None,sw=1,r=0):
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" {self.attrs(fill,stroke,sw)}/>')
        self.d.rounded_rectangle((x*2,y*2,(x+w)*2,(y+h)*2), radius=r*2, fill=fill,outline=stroke,width=max(1,round(sw*2)))
    def ellipse(self,cx,cy,rx,ry,fill=None,stroke=None,sw=1):
        self.svg.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" {self.attrs(fill,stroke,sw)}/>')
        self.d.ellipse(((cx-rx)*2,(cy-ry)*2,(cx+rx)*2,(cy+ry)*2), fill=fill,outline=stroke,width=max(1,round(sw*2)))
    def poly(self,pts,fill=None,stroke=None,sw=1):
        xy=' '.join(f'{x:.2f},{y:.2f}' for x,y in pts)
        self.svg.append(f'<polygon points="{xy}" {self.attrs(fill,stroke,sw)}/>')
        p=[(x*2,y*2) for x,y in pts]
        self.d.polygon(p,fill=fill)
        if stroke: self.d.line(p+[p[0]],fill=stroke,width=max(1,round(sw*2)),joint='curve')
    def line(self,pts,color,sw=1):
        xy=' '.join(f'{x:.2f},{y:.2f}' for x,y in pts)
        self.svg.append(f'<polyline points="{xy}" {self.attrs(None,color,sw)}/>')
        self.d.line([(x*2,y*2) for x,y in pts],fill=color,width=max(1,round(sw*2)),joint='curve')
        for x,y in (pts[0],pts[-1]): self.d.ellipse(((x-sw/2)*2,(y-sw/2)*2,(x+sw/2)*2,(y+sw/2)*2),fill=color)
    def text(self,x,y,value,size=18,color=INK,bold=False):
        self.svg.append(f'<text x="{x}" y="{y}" font-family="Segoe UI,Arial,sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}">{html.escape(value)}</text>')
        font=ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf',size*2)
        self.d.text((x*2,y*2),value,fill=color,font=font,anchor='ls')
    def save(self):
        (OUT/(self.name+'.svg')).write_text('\n'.join(self.svg+['</svg>'])+'\n',encoding='utf-8')
        self.im.resize((self.w,self.h),Image.Resampling.LANCZOS).save(OUT/(self.name+'.png'))

def path_points(segments):
    result=[segments[0]]
    p=segments[0]
    for c1,c2,q in segments[1:]:
        for i in range(1,17):
            t=i/16; u=1-t
            result.append((u**3*p[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t**3*q[0],u**3*p[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t**3*q[1]))
        p=q
    return result

def lobed(b,x,y,rx,ry,color):
    # BG r02 silhouette language: asymmetry + wide blunt cut-ins, no object outline.
    p=path_points([(-.95,.18),((-.98,-.05),(-.55,-.12),(-.58,-.35)),((-.6,-.57),(-.12,-.38),(.12,-.55)),((.6,-.67),(.7,-.3),(.9,-.26)),((1.1,-.05),(.87,.16),(.52,.18)),((.25,.18),(.45,.48),(.12,.5)),((-.18,.61),(-.8,.46),(-.65,.25)),((-.56,.13),(-.95,.35),(-.95,.18))])
    b.poly([(x+a*rx,y+c*ry) for a,c in p],color)

def glow_seed(b,x,y,rx,ry,color,edge=INK):
    b.ellipse(x,y,rx,ry,color,edge,max(1,rx*.07))
    # Broad internal value facet and white reflection, entirely within the body.
    b.ellipse(x+rx*.08,y+ry*.15,rx*.7,ry*.63,{'#A8D8BC':'#8BB99C','#F8DDAA':'#EAC581','#E7A08A':'#CC8772','#C7E4F4':'#9FC8E2','#C7B6DD':'#AA98C9','#759D81':'#5F8268'}.get(color,color))
    b.ellipse(x-rx*.25,y-ry*.32,rx*.36,ry*.17,'#FFFDF3')

def lance(b,x,y,rx,ry,color):
    pts=path_points([(-rx,0),((-.45*rx,-.75*ry),(.38*rx,-1.1*ry),(rx,0)),((.45*rx,.9*ry),(-.4*rx,.9*ry),(-rx,0))])
    b.poly([(x+a,y+c) for a,c in pts],color,INK,max(1,rx*.025))
    b.poly([(x-rx*.6,y-ry*.12),(x+rx*.62,y),(x-rx*.42,y+ry*.48)], '#BCE4CC' if color=='#A8D8BC' else '#DCCFF0')
    b.line([(x-rx*.52,y-ry*.23),(x+rx*.27,y-ry*.35)],'#FFFDF3',max(1,ry*.2))

def flash(b,x,y,s,kind='basic',ice=False):
    edge='#577DA3' if ice else '#804425'
    color='#C7E4F4' if ice else '#F8DDAA'
    if kind=='sniper':
        pts=path_points([(0,0),((s*.78,-s*.04),(s*1.02,-s*.14),(s*1.1,-s*.78)),((s*1.16,-s*.14),(s*1.3,-s*.03),(s*2.04,0)),((s*1.3,s*.04),(s*1.16,s*.14),(s*1.1,s*.78)),((s*1.02,s*.14),(s*.78,s*.03),(0,0))])
    else:
        pts=path_points([(0,0),((0,-s*.28),(s*.25,-s*.38),(s*.42,-s*.28)),((s*.34,-s*.87),(s*.96,-s*.9),(s*1.01,-s*.37)),((s*1.6,-s*.44),(s*1.76,s*.12),(s*1.11,s*.3)),((s*1.04,s*.95),(s*.35,s*.82),(s*.4,s*.31)),((s*.08,s*.38),(0,s*.2),(0,0))])
    b.poly([(x+a,y+c) for a,c in pts],color,edge,max(1,s*.08))
    if kind!='sniper': b.ellipse(x+s*.73,y,s*.38,s*.28,'#FFE9B4' if not ice else '#E6F5FF')

def dashed_circle(b,x,y,r,color,width=2):
    for i in range(20):
        a=2*math.pi*i/20
        b.line([(x+math.cos(a+t)*r,y+math.sin(a+t)*r) for t in [j*.01 for j in range(18)]],color,width)

def capsule(b,x,y,x2,y2,r,fill,edge):
    angle=math.atan2(y2-y,x2-x)
    pts=[]
    for cx,cy,start in [(x2,y2,angle-math.pi/2),(x,y,angle+math.pi/2)]:
        pts += [(cx+math.cos(start+i*math.pi/24)*r,cy+math.sin(start+i*math.pi/24)*r) for i in range(25)]
    b.poly(pts,fill,edge,2)

PROJECTILES=[
    ('PLAYER','basic','B01/P01','seed','#F8DDAA',4.5,2.6),
    ('BASIC','basic','B01/P02','seed','#A8D8BC',4,4),
    ('CANNON','cannon','B01/P03','seed','#A8D8BC',7,7),
    ('SNIPER','sniper','B01/P04','lance','#A8D8BC',12,3),
    ('RAPID','basic','B01/P05','seed','#A8D8BC',5.6,2.7),
    ('MORTAR','cannon','B01/P06','seed','#E7A08A',7,7),
    ('FROST','basic','B01/P07','seed','#C7E4F4',6.2,2.9),
    ('RAIL','sniper','B01/P08','lance','#C7B6DD',15,2.7),
    ('BURST','basic','B01/P09','burst','#A8D8BC',6.2,2.8),
    ('SENTINEL','basic','B01/P10','seed','#759D81',5,3.2),
]

def shot(b,x,y,source,mult=1):
    name,kind,cell,form,color,rx,ry=source
    rx*=mult; ry*=mult
    if form=='lance': lance(b,x,y,rx,ry,color)
    else:
        glow_seed(b,x,y,rx,ry,color)
        if form=='burst':
            # Right tip uses the approved coral patch, clipped by ellipse arithmetic.
            pts=[(x+rx*.52,y-ry*.85)]+[(x+rx*math.cos(t),y+ry*math.sin(t)) for t in [(-1+2*i/24)*math.acos(.52) for i in range(25)]]
            b.poly(pts,'#E7A08A')
            b.ellipse(x,y,rx,ry,None,INK,max(1,rx*.07))

def make_previews():
    b=Board('ground-preview',1440,900)
    marks=[(160,150,80,38),(565,45,65,34),(980,145,80,34),(1370,70,83,38),(345,330,80,32),(800,340,82,35),(1235,430,72,32),(70,570,87,38),(530,610,88,36),(1040,660,79,32),(1430,730,87,38),(265,840,65,34),(810,865,82,32),(1145,855,83,34)]
    for i,(x,y,rx,ry) in enumerate(marks): lobed(b,x,y,rx,ry,'#EDF0DF' if i%2==0 else '#F6EFE2')
    for x,y in [(90,300),(610,220),(1130,45),(1370,330),(860,590),(390,745),(1310,860)]:
        b.line([(x-7,y),(x-10,y-6)],'#CBD8BA',5)
        b.line([(x,y),(x,y-11)],'#CBD8BA',5)
        b.line([(x+7,y),(x+10,y-6)],'#CBD8BA',5)
    b.save()

    b=Board('projectile-preview',1200,970)
    b.text(34,48,'WORLD / 10 SHOT SOURCES',30,bold=True)
    b.text(34,78,'Editable production proposal from accepted B01. Enlarged + 1x; no body sprites.',16)
    for i,p in enumerate(PROJECTILES):
        col=i%2; row=i//2; x=30+col*585; y=110+row*158
        b.rect(x,y,560,145,'#FFFCF5','#DDCFB8',1,16)
        b.text(x+18,y+29,p[0],19,bold=True)
        b.text(x+190,y+29,p[2]+' / '+p[1],14)
        shot(b,x+110,y+87,p,5)
        flash(b,x+248,y+88,33 if p[1]=='cannon' else 22,p[1],p[0]=='FROST')
        shot(b,x+456,y+79,p,1)
        b.text(x+418,y+118,'1x proposal',13)
    b.text(34,935,'P=(projectile.x,y); M=measured emitter; births, count, speed, radius, life and damage remain logical.',15)
    b.save()

    b=Board('geometry-preview',1200,840)
    b.text(30,47,'WORLD / GEOMETRY + FEEDBACK',30,bold=True)
    b.text(30,77,'Accepted B03/B04/S11/U10 language. Documentation samples, not a battle or damage animation.',15)
    for x,y,w,h in [(30,105,350,240),(405,105,360,240),(790,105,380,240),(30,370,350,225),(405,370,360,225),(790,370,380,225),(30,620,350,190),(405,620,360,190),(790,620,380,190)]: b.rect(x,y,w,h,'#FFFCF5','#DDCFB8',1,16)
    b.text(49,136,'H01 / full disk',20,bold=True)
    b.ellipse(200,240,74,74,'#FFEAE0')
    dashed_circle(b,200,240,74,'#E96F65',3)
    b.text(75,329,'radius = real radius; no safe hole',14)
    b.text(424,136,'H02 / finite capsule',20,bold=True)
    b.rect(451,201,266,72,'#FFEAE0','#E96F65',3,36)
    b.line([(487,237),(681,237)],'#D8AF9C',1)
    for x in [487,681]: b.ellipse(x,237,3,3,INK)
    b.text(439,304,'half width = width; round endpoints',14)
    b.text(439,328,'boundary does not pulse outward',14)
    b.text(809,136,'H04 / each actual line',20,bold=True)
    capsule(b,841,275,1098,187,18,'#FFEAE0','#E96F65')
    capsule(b,915,174,1060,292,18,'#FFEAE0','#E96F65')
    b.text(812,329,'oblique / parallel; no extra box corners',14)
    b.text(49,401,'M09 / true drop',20,bold=True)
    for cx,cy,s in [(175,477,39),(292,477,9)]:
        b.poly([(cx,cy-s),(cx+s*.77,cy),(cx,cy+s),(cx-s*.77,cy)],'#A8D8BC','#2F7556',max(1,s*.06))
        b.poly([(cx,cy-s*.78),(cx,cy+s*.7),(cx+s*.59,cy)],'#88C9A8')
        b.line([(cx-s*.46,cy-3),(cx-2,cy-s*.57)],'#E5F7E8',max(1,s*.1))
    b.text(49,562,'state.drops only; refunds are immediate',14)
    b.text(424,401,'S11 / separate root shadow',20,bold=True)
    for i in range(15):
        t=i/14; color=f'#{int(239-47*t):02x}{int(226-58*t):02x}{int(207-57*t):02x}'
        b.ellipse(581,485,83*(1-t*.72),28*(1-t*.72),color)
    b.text(437,562,'root follows owner; no baked ground',14)
    b.text(809,401,'M11 / death particles',20,bold=True)
    for x,y,angle in [(900,474,-.7),(1039,466,.5),(1003,523,-.5),(927,524,.6)]:
        pts=[(-7,-13),(5,-10),(8,10),(-3,5),(-7,0)]
        b.poly([(x+a*math.cos(angle)-c*math.sin(angle),y+a*math.sin(angle)+c*math.cos(angle)) for a,c in pts],'#E7A08A','#895344',2)
    for a in range(7):
        angle=a*math.pi*2/7
        b.line([(968+math.cos(angle)*21,488+math.sin(angle)*21),(968+math.cos(angle)*32,488+math.sin(angle)*32)],'#895344',3)
    b.text(811,562,'particles only; no corpse or new child',14)
    b.text(49,651,'U10 / build range',20,bold=True)
    for x,color,fill in [(134,'#69A983','#EAF3E2'),(280,'#E7857A','#FFEAE0')]:
        b.ellipse(x,719,43,43,fill); dashed_circle(b,x,719,43,color,2)
    b.text(48,790,'range from catalog; canPlace from logic',14)
    b.text(424,651,'R01 / hit family',20,bold=True)
    for k,(x,color) in enumerate([(472,'#A8D8BC'),(580,'#A8D8BC'),(686,'#F8DDAA')]):
        if k==0:
            for dx,dy in [(0,-17),(17,0),(0,17),(-17,0)]: b.ellipse(x+dx,717+dy,6 if dx==0 else 10,10 if dx==0 else 6,color,'#528E72',1.5)
        elif k==1:
            b.ellipse(x,717,14,14,'#F8DDAA','#7C9877',2); dashed_circle(b,x,717,30,'#A5BD9C',3)
        else: flash(b,x-22,717,20,'sniper')
    b.text(432,790,'existing hit event; cosmetic timing only',14)
    b.text(809,651,'WARNING / RESOLVE / FADE',18,bold=True)
    b.text(811,701,'timer > 0 : real hazard boundary',15)
    b.text(811,731,'resolve : logical instant / next pulse',15)
    b.text(811,761,'fade : existing transient life only',15)
    b.save()

def make_coverage():
    split=read(FX/'production-split.json'); catalog=read(FX/'cell-catalog.json')['cells']
    owned=[k for k in catalog if k.startswith(('B01/','B02/','B03/','B04/','R01/HIT')) or k=='B07/U10']
    cells=[]
    for key in owned:
        c=catalog[key]
        if key in ['B02/S12','B02/S14']: owner='world primitive; character/UI integration owns labels/layout'
        elif key=='B02/S08': owner='world tint parameters; characters own body alpha mask'
        elif key=='B02/S13': owner='world BG r02 supersedes older ground sample'
        elif key=='B07/U10': owner='world range; characters ghost; UI reason text'
        else: owner='world'
        cells.append({'cell':key,'title':c['title'],'sourceFile':c['file'],'proposedOwner':owner,'lifecycle':c.get('lifecycle'), 'status':'planned_not_implemented'})
    assignments=[]
    for group in ['friendly','enemies','bossMechanicReferences']:
        for row in split[group]:
            assignments.append({'key':row['key'],'group':group,'cells':row.get('effectCells',[]),'sourceDirection':row.get('currentFriendlyDirectionPolicy') or row.get('directionReuse'),'status':'planned_contract_dependent'})
    abilities=[]
    for key,row in split['abilityCatalog'].items():
        abilities.append({'abilityId':key,'standardOrSurvivor':row.get('standardOrSurvivor'),'availability':row.get('availability'),'dispatch':row.get('dispatch'),'cells':row.get('effectCells',[]),'geometryMappings':row.get('geometryMappings',[]),'lifecycleByCell':row.get('lifecycleByCell'),'status':'mapped_not_runtime_verified'})
    projectile_rows=[]
    for name,kind,cell,form,color,rx,ry in PROJECTILES:
        projectile_rows.append({'appearanceSourceProposal':name,'motionKind':kind,'sourceCell':cell,'form':form,'fill':color,'displayBoundsProposal':[round(rx*2,2),round(ry*2,2)],'hitFamily':{'basic':'R01/HIT_BASIC','cannon':'R01/HIT_CANNON','sniper':'R01/HIT_SNIPER'}[kind],'origin':'actual projectile.x/y; no spawn relocation','metadataDependency':'explicit source identity and actual shot/hit event, not color inference'})
    result={'status':'coverage_plan_not_implementation','sourceReview':'effects-ui r02 accepted; inline submitted strings are historical source metadata','counts':{'worldRelatedCells':len(cells),'sourceAssignments':len(assignments),'abilityCatalog':len(abilities),'standardOrSurvivorSkills':sum(bool(r['standardOrSurvivor']) for r in abilities),'projectileSources':len(projectile_rows),'motionKinds':len(set(r['motionKind'] for r in projectile_rows))},'cells':cells,'projectiles':projectile_rows,'assignments':assignments,'abilities':abilities,'enemyEffects':split['enemyEffects']}
    dump('coverage.json',result)
    assert result['counts']['sourceAssignments']==375
    assert result['counts']['standardOrSurvivorSkills']==95
    assert result['counts']['projectileSources']==10
    assert result['counts']['motionKinds']==3
    assert all(cell in catalog for r in assignments for cell in r['cells'])
    return result['counts']

def make_index():
    rel=lambda path: Path(__import__('os').path.relpath(path,OUT)).as_posix()
    sources=[('Approved BG01',BG/'bg01-clean-background.png'),('Approved shots B01',FX/'b01-friendly-projectiles.png'),('Approved hazard B03',FX/'b03-hazard-lifecycle.png'),('Approved feedback B04',FX/'b04-mechanic-feedback.png')]
    previews=''.join(f'<figure><a href="{n}.svg"><img src="{n}.png" alt="{n}"></a><figcaption>{n} · SVG editable proposal, click for vector</figcaption></figure>' for n in ['ground-preview','projectile-preview','geometry-preview'])
    source_images=''.join(f'<details><summary>{label}</summary><img src="{rel(path)}" alt="{label}"></details>' for label,path in sources)
    (OUT/'index.html').write_text(f'''<!doctype html><html lang="en"><meta charset="utf-8"><title>GeoGuard World r01 plan</title><style>body{{margin:0;background:#fff9ef;color:#4b281c;font:16px/1.5 system-ui}}main{{max-width:1200px;margin:40px auto;padding:0 24px}}h1{{font-size:32px}}figure{{margin:30px 0}}img{{display:block;width:100%;height:auto;border-radius:12px}}figcaption{{padding:8px 0}}a{{color:#2f7556}}summary{{cursor:pointer;padding:16px 0}}.notice{{border:1px solid #dac9af;border-radius:12px;padding:18px;background:#fffdf7}}</style><main><h1>GeoGuard / World r01</h1><p class="notice">Read-only inspection and production proposal. Submitted for review; no runtime integration, body sprite, gameplay change or device validation. Source art is approved; these new editable samples await approval.</p><p><a href="implementation-plan.md">Implementation plan</a> · <a href="coverage.json">Cell, identity and 95-skill coverage</a> · <a href="packet.json">Sealed packet</a></p>{previews}<h2>Approved source references</h2><p>Original references remain outside this revision; these links do not copy or alter the source boards.</p>{source_images}</main></html>''',encoding='utf-8')

def seal(counts):
    paths=[BG/'bg01-clean-background.png',BG/'bg02-ground-layers.png',BG/'production-notes.md',BG/'packet.json',ART/'scene-ui-2026-10-02/reviews/background-r02.md',FX/'production-split.json',FX/'cell-catalog.json',FX/'production-notes.md',FX/'b01-friendly-projectiles.png',FX/'b02-status-world.png',FX/'b03-hazard-lifecycle.png',FX/'b04-mechanic-feedback.png',FX/'b07-controls-placement.png',FX/'packet.json',ART/'production-art-2026-10-02/effects-ui/submissions/r01/vfx-projectile-flash-hit.png',ART/'production-art-2026-10-02/reviews/effects-ui-r02.md',ART/'production-art-2026-10-02/friendly/submissions/r03/production-split.json',ART/'production-art-2026-10-02/friendly/submissions/r03/reuse-design.md',ART/'production-art-2026-10-02/integration/submissions/r02/production-map.json',ART/'scene-ui-2026-10-02/delivery/submissions/r02/packet.json']
    paths += [ROOT/p for p in ['src/view/canvas/canvasRenderer.js','src/logic/engine/combatOffenseRuntime.js','src/logic/engine/combatFrameRuntime.js','src/logic/engine/combatRules.js','src/logic/engine/enemyDefeatRuntime.js','src/logic/engine/battlefieldRules.js','src/logic/engine/bossMechanicEntities.js','src/logic/engine/enemyBehaviorRuntime.js','src/logic/hooks/useGeoGuardGame.jsx','src/data/gameConfig.js']]
    assert all(p.exists() for p in paths),[str(p) for p in paths if not p.exists()]
    inputs=[{'path':p.relative_to(ROOT).as_posix(),'sha256':sha(p),'bytes':p.stat().st_size,'use':'readonly source/dependency'} for p in paths]
    dump('source-fingerprints.json',{'inputs':inputs,'status':'snapshot_at_plan_submission'})
    files=[p for p in OUT.iterdir() if p.is_file() and p.name not in ['packet.json']]
    packet={'owner':'world','revision':'r01','status':'submitted_plan','scope':'Background, independent projectiles/muzzle/hit/death/hazards/shadows/drops/build-range; source mapping for independent statuses/mechanic feedback','authorization':'Read-only inspection and production proposal only. Implementation requires explicit main-review approval.','coverage':counts,'files':[{'path':p.name,'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(files)],'inputs':inputs,'ownership':{'currentWrites':['docs/art-implementation-2026-10-02/world/submissions/r01/**','docs/art-implementation-2026-10-02/world/READY.json (atomic final pointer)'],'proposedImplementation':['src/view/art/world/**','public/art/world/**'],'excluded':['src/view/canvas/canvasRenderer.js','src/logic/**','src/data/**','src/view/art/characters/**','UI','package files','sealed upstream art','Git']},'requirements':[{'id':'W01','need':'Approve baseline and unified render/source/anchor/event contract','blocking':'implementation'},{'id':'W02','need':'Explicit source identity for all projectiles, same-step true shot/hit events','blocking':'10 source appearances / dedicated muzzle+hit semantic fidelity'},{'id':'W03','need':'Measured character rig root/M and LEFT/UP transform contract','blocking':'external shadows/flash attachment'},{'id':'W04','need':'Integration owns shared renderer layer changes, event cleanup and metadata additions','blocking':'scene integration'},{'id':'W05','need':'Review editable samples and actual 1x crowded scenes after integration','blocking':'visual acceptance'}],'validation':{'coverage':'375 source assignments, 95 standard/survivor skills, all referenced cells resolvable; planned only','editablePreview':'SVG and supersampled PNG from one authored description; based on viewed approved source boards, no generative redraw or board crop','geometry':'Read-only actual logic probe recorded in verification.json','runtime':'not run; no source or gameplay modification','performance':'not measured','mobile':'deferred'},'limitations':['New vectors are proposed editable production samples, not accepted exports or sprites','Canonical board root/M numbers remain design proposals, not measured pixels','No persistent resolve damage phase or full-line fade invented','Coverage of 95 skill maps is declared source coverage, not live execution proof']}
    dump('packet.json',packet)
    assert all(sha(OUT/f['path'])==f['sha256'] for f in packet['files'])
    # READY written only by separate final sealing step after actual image inspection.

if __name__=='__main__':
    assert ROOT.name=='GeoGuard',str(ROOT)
    make_previews(); counts=make_coverage(); make_index(); seal(counts)
    print(json.dumps({'output':str(OUT),'coverage':counts,'ready':'not published; await preview inspection'},ensure_ascii=False))
