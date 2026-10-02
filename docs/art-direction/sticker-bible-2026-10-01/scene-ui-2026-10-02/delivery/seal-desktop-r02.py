"""Seal desktop-only r02. No source mutations, art approval or game integration."""
from pathlib import Path
import hashlib, html, json, os, re
from urllib.parse import unquote

DELIVERY=Path(__file__).resolve().parent
ROOT=DELIVERY/'desktop-preparation'
SCENE=DELIVERY.parent
PACK=DELIVERY/'submissions/r02'
def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def rel(p,base=PACK):
    try: return os.path.relpath(p,base).replace('\\','/')
    except ValueError: return str(p).replace('\\','/')
def write(name,obj): (PACK/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if PACK.exists(): raise SystemExit('Refuse to overwrite r02 submission.')
baseline=read(ROOT/'immutable-baseline.json')
old_ready_sha=sha(DELIVERY/'READY.json')
assert old_ready_sha==baseline['deliveryREADYSha256']
assert read(DELIVERY/'READY.json')['revision']=='r01'
for f in baseline['files']: assert sha(ROOT/f['path'])==f['sha256']
manifest=read(ROOT/'gallery-manifest.json')
queue=read(ROOT/'queue.json')
source_audit=read(ROOT/'source-audit.json')
assert queue['delivery']['finalAssemblyAuthorized']
assert len(manifest['images'])==7 and len({p['file'] for p in manifest['images']})==7
assert len(source_audit['packetFiles'])==66
assert len(source_audit['sourceFingerprints'])==108 and source_audit['fixedSourceMatches']==107
assert len(source_audit['historicalMutableReadySnapshots'])==1
assert not source_audit['sourceErrors'] and not read(ROOT/'link-audit.json')['missing']
for d in queue['dependencies']:
    assert d['status'].startswith('accepted_by_primary')
    assert sha(ROOT/d['targetPacket'])==d['packetSha256']
    assert sha(ROOT/d['primaryReview'])==d['reviewSha256']
for f in source_audit['packetFiles']: assert sha(ROOT/f['path'])==f['sha256']
for s in source_audit['sourceFingerprints']:
    p=(ROOT/s['path']).resolve()
    if s['result']=='historical_mutable_READY_snapshot':
        assert p==(SCENE/'master/READY.json').resolve()
        assert sha(p)==s['actualSha256'] and s['sha256']!=s['actualSha256']
        assert '54' in (SCENE/'reviews/master-r04.md').read_text(encoding='utf-8-sig')
    else: assert sha(p)==s['sha256'] and s['result']=='match'
for s in source_audit['inheritedDesktopFlowChecks']: assert sha(ROOT/s['path'])==s['sha256']

PACK.mkdir(parents=True)
snapshots=['queue.json','requirements.json','source-alignment.json','source-audit.json','gallery-manifest.json','link-audit.json','immutable-baseline.json']
owned=set(snapshots+['index.html','README.md','approval-history.md','actual-state-and-limits.md','verification.json','audit-protocol.md'])
def rebase(v):
    if isinstance(v,dict): return {k:rebase(x) for k,x in v.items()}
    if isinstance(v,list): return [rebase(x) for x in v]
    if isinstance(v,str):
        if v in owned: return v
        if re.match(r'^[A-Za-z]:[/\\]',v): return v.replace('\\','/')
        if v.startswith('../'): return rel(ROOT/v)
    return v
for name in snapshots:
    data=rebase(read(ROOT/name))
    if name=='queue.json':
        data['status']='submitted_for_primary_delivery_review'
        data['delivery']['status']='submitted_not_self_approved'
        data['delivery'].pop('READYPublished',None)
        data['delivery']['publication']=dict(method='atomic READY after seal verification',READY='../../READY.json',packetPath='packet.json',primaryApproval='pending')
    if name=='gallery-manifest.json': data['status']='submitted_for_primary_delivery_review'
    if name=='immutable-baseline.json': data['deliveryREADYSnapshotPolicy']='Historical r01 queue pointer observed before r02 publication; expected to change upon atomic r02 READY. Immutable r01 files and packet remain unchanged.'
    write(name,data)
markup=(ROOT/'index.html').read_text(encoding='utf-8')
def rebase_html(m):
    attr,value=m[1],html.unescape(m[2])
    if value.startswith(('#','http:','https:','data:')): return m[0]
    target=value if value in owned else rel(ROOT/unquote(value))
    return f'{attr}="{html.escape(target,quote=True)}"'
markup=re.sub(r'(href|src)="([^"]+)"',rebase_html,markup)
(PACK/'index.html').write_text(markup,encoding='utf-8')
(PACK/'audit-protocol.md').write_text((ROOT/'audit-protocol.md').read_text(encoding='utf-8'),encoding='utf-8')
(PACK/'README.md').write_text('''# GeoGuard 电脑端原画图册 delivery r02

状态：submitted，等待主审独立验收；不自行批准。手机暂缓，不作本轮证据或阻塞项。

入口：[纯桌面7图画册](index.html)。新正式列表仅BG r02两图、UI r02三图、master r04最终两图。候选/退稿/旧母稿/旧RAIL不在正式图列表；旧开始、结束、暂停仅继承UI r01桌面A/B/C格，手机只有历史链接。

[30项桌面要求](requirements.json)与[source-alignment](source-alignment.json)包含48项新UI逐格、九塔canonical、整体→精细BG/UI→最终联合、screen/world层及逻辑单位。[实际状态与限制](actual-state-and-limits.md)记录实际计数、BEACON历史召唤、HP修正、弹体寿命及裁切。[审批历史](approval-history.md)、[队列](queue.json)、[SHA](source-audit.json)、[本地引用](link-audit.json)可独立核查。

66上游封包文件SHA一致；108条来源记录分为107条固定文件匹配及1条master/READY历史可变队列快照。另有3条继承桌面流程来源检查。不能宣称108条当前全部同旧hash一致，不能隐藏READY差异或把它误报缺失素材。

原生title位置/延时由浏览器控制；控制锚点、持续拖放check/X/!章是表现目标，非代码已有控件。水平滑块为原生横滚，不承诺竖滚轮转换。所有费用/HP/文字读取动态数据；最终PNG资源偏cyan，生产仍为mint #A8D8BC及浅底深棕字#4B281C。

仅静态原画与规范；不是透明资源、分层源稿、连续动画/图集、精确挂点或可运行游戏。未验证运行鼠标、真实字体/对比、窗口/DPR安全区、完整轨迹/经济可达性或性能；无代码修改、资源接入或部署。
''',encoding='utf-8')
(PACK/'actual-state-and-limits.md').write_text('''# 最终实际状态与生产界限

## A 波31普通清场

19敌：BASIC12/TANK7。10实塔：BASIC6/BURST4。PLAYER1，菱形资源4，可辨独立弹26（基本球9、BURST椭圆16、PLAYER蜂蜜1）。无Boss或敌危区。首段六完整卡及RAIL露边、原生横向滑块、SNIPER已有title内容悬停。

波队列BASIC10加历史BEACON召唤幸存2；BEACON5.5秒召3个普通BASIC，ownerBossUid=null，BEACON死亡不清子单位，再死1剩2。TANK7不超队列8。不存在新精英身份；TANK是既有重装身份。初始22敌/13塔/23弹计划被批准按实际画面更新。

## B 波27双子

8实塔：BASIC5/BURST2/SENTINEL1；另1独立SENTINEL拖建幽灵不计实塔。曜子/蚀子两成员，PLAYER1，无普通怪/掉落，可辨飞行弹15（BURST9/基本球4/SENTINEL1/PLAYER1）。只1月方lunarSnare盘；曜子准备、蚀子攻击，完整共同对策。资金18低于成本69仍可起拖。末段六完整卡及前卡露边。

敌月危盘边界完整；SENTINEL幽灵射程右侧被视口裁切，未宣称全部射程边界完整。A/B是合法互补快照，不把普通怪群与不可能Boss技能拼成同一战斗。

## 数据、单位与未验证边界

BASIC Lv0/1/2 maxHP50/58/67。A受伤27/67、38/58、38/58；B37/67、32/58，SENTINEL69/125。旧CANNON51/93不能套用替换后的BASIC。目录/费用/等级与UI示例分别记录，不固定FROST55等示例为所有等级。

飞行弹为混合寿命快照；B左BURST5枚包含可能上轮幸存，不表示一轮发5弹或同步第一轮射击；没有完整轨迹模拟。A目标1440×900，B1280×720；UI另含960×720小电脑规范，均logical_px设计。renderAnchor只是image_pixel图上定位，不是实测world挂点或逻辑布局。

正文/费用/卡宽140/间距8/栏宽min(92vw,920px)等是设计目标。原画资源色偏cyan，生产mint #A8D8BC深绿边；微小身体/HP填充/几何由canonical与源合同控制。实机鼠标、真实字体/对比、DPR/安全区、性能与经济可达性未验证。手机暂缓；无代码/资源接入。
''',encoding='utf-8')
history=['# 主审与退稿历史','','本delivery r02仅submitted，等待主审。旧封包pending文字保留；以下主审书面记录为接受权威。','','|版本|记录|范围/闭环|','|---|---|---|']
for owner,rev,note in [('delivery','r01','历史完整原画总册；手机不用于本轮通过'),('background','r02','缺口淡斑替换规则椭圆，阴影与地面归属分离'),('ui','r02','48项与三图；DUI02选稿路径纠正至edit4；费用/九塔/鼠标/奖励通过'),('master','r04','A实际19敌10塔，B8塔+ghost；形体、横滚、组名、腹斑、HP与BEACON来源闭环；资源cyan按mint生产；射程右侧裁切保留')]:
    history.append(f'|{owner} {rev}|[主审]({rel(SCENE/"reviews"/f"{owner}-{rev}.md")})|{note}|')
history+=['','master r04来源55条中54固定匹配，1 master/READY为旧队列hash，r04发布后自然变化。主审明确记录该差异，保留原封包；不生成伪修复revision。','退稿保留generation-record与prompt作为审计历史，不进入7新图列表。旧母稿/RAIL仅追溯，旧UI02仅继承桌面A/B/C；不嵌手机原画。','']
(PACK/'approval-history.md').write_text('\n'.join(history),encoding='utf-8')

checks=[]
def check(source,ref,kind):
    ref=html.unescape(ref)
    if ref.startswith(('http:','https:','data:','mailto:')): return
    value=unquote(ref).split('#')[0].split('?')[0]
    p=source.parent/value if value else source
    exists=p.exists()
    if '#' in ref and value in ('','index.html'): exists=exists and f'id="{ref.split("#",1)[1]}"' in p.read_text(encoding='utf-8')
    checks.append(dict(source=rel(source),reference=ref,target=rel(p),exists=exists,kind=kind))
for p in PACK.iterdir():
    if p.suffix=='.html':
        for ref in re.findall(r'(?:href|src)="([^"]+)"',p.read_text(encoding='utf-8')): check(p,ref,'packaged_html')
    if p.suffix=='.md':
        for ref in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')): check(p,ref,'packaged_markdown')
for r in read(PACK/'requirements.json')['requirements']:
    for ref in r['evidence']+r['reviewEvidence']: check(PACK/'requirements.json',ref,'requirement_evidence')
def alignment_refs(obj,key=''):
    if isinstance(obj,dict):
        for k,v in obj.items(): alignment_refs(v,k)
    elif isinstance(obj,list):
        for v in obj: alignment_refs(v,key)
    elif isinstance(obj,str) and key in ('file','path','source','review','evidence','sourceDerivedEvidence','primaryExplanation','finalStateEvidence','finalReviewEvidence'):
        if obj.startswith('../') or obj in owned or re.match(r'^[A-Za-z]:[/\\]',obj): check(PACK/'source-alignment.json',obj,'alignment_reference')
alignment_refs(read(PACK/'source-alignment.json'))
for p in read(PACK/'gallery-manifest.json')['images']:
    check(PACK/'gallery-manifest.json',p['file'],'formal_image')
    assert sha(PACK/p['file'])==p['sha256']
errors=[r for r in checks if not r['exists']]
assert not errors,errors
links=read(PACK/'link-audit.json')
links.update(status='submitted_integrity_snapshot',packageChecked=len(checks),packageMissing=errors,packageEntries=checks)
write('link-audit.json',links)
verification=dict(status='integrity_checked_not_self_approved',formalNewDesktopImages=7,HTMLImages=len(re.findall('<img ',markup)),SVGCanvasReplacements=len(re.findall('<(?:svg|canvas)',markup)),requirements=30,UIFineRequirements=48,upstreamPacketFiles=66,sourceEntries=108,fixedSourceMatches=107,historicalMutableREADY=1,inheritedFlowChecks=3,packageLocalReferences=len(checks),missingLinks=0,oldR01Unchanged=True,runtimeValidated=False,phoneDeferred=True,primaryDeliveryApproval='pending')
assert verification['HTMLImages']==7 and verification['SVGCanvasReplacements']==0
write('verification.json',verification)
packet_files=[]
for p in sorted(PACK.iterdir()):
    assert p.read_bytes()[:3]!=b'\xef\xbb\xbf'
    if p.suffix=='.json': read(p)
    packet_files.append(dict(path=rel(p,DELIVERY),sha256=sha(p),bytes=p.stat().st_size))
packet=dict(owner='delivery',revision='r02',status='submitted',approval='awaiting_primary_review',scope='desktop_only_phone_deferred',files=packet_files,images=[dict(id=p['id'],path=rel((PACK/p['file']).resolve(),DELIVERY),sha256=p['sha256'],imagePixels=p['imagePixels'],authorityReview=rel((PACK/p['review']).resolve(),DELIVERY)) for p in read(PACK/'gallery-manifest.json')['images']],coveredRequirements=[r['id'] for r in read(PACK/'requirements.json')['requirements']],openIssues=['delivery r02 complete desktop gallery and synthesized coverage await independent primary review'],dependencies=[dict(owner=o,revision=r,review=rel(SCENE/'reviews'/f'{o}-{r}.md',DELIVERY),status='accepted_by_primary') for o,r in [('background','r02'),('ui','r02'),('master','r04')]],summary='纯电脑端7新图；30需求/48UI逐格，整体→精细→联合及层/鼠标/全解锁/实际密集计数与限制。66上游文件一致；107固定来源匹配＋1历史可变READY，差异保留。旧菜单仅继承桌面格，手机仅历史。submitted待主审，不自行批准。',limitations=['no runtime/device/contrast/font/mouse/performance/economy/full-trajectory validation','not transparent production assets or layered source/animation/atlas','no game code/resource integration/deployment','resource raster cyan; production mint target; ghost range right edge clipped'],immutableAfterReady=True,previousReady=read(DELIVERY/'READY.json'))
write('packet.json',packet)
for f in packet['files']: assert sha(DELIVERY/f['path'])==f['sha256']
for f in baseline['files']: assert sha(ROOT/f['path'])==f['sha256']
assert sha(DELIVERY/'READY.json')==old_ready_sha
ready=dict(revision='r02',packetPath='submissions/r02/packet.json',packetSha256=sha(PACK/'packet.json'))
temp=DELIVERY/'.READY-desktop-r02.tmp'
temp.write_text(json.dumps(ready,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
os.replace(temp,DELIVERY/'READY.json')
print(json.dumps(dict(status='submitted_awaiting_primary',revision='r02',formalNewDesktopImages=7,packetFiles=len(packet_files),upstreamFiles=66,fixedSources=107,historicalMutableREADY=1,packageLocalReferences=len(checks),missingLinks=0,READY='published_atomically'),ensure_ascii=False))
