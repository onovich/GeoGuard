"""Seal delivery r01 and publish READY only after all integrity checks pass."""
from pathlib import Path
import hashlib, html, json, os, re, struct
from urllib.parse import unquote

ROOT=Path(__file__).resolve().parent
SCENE=ROOT.parent
REPO=SCENE.parents[3]
PACK=ROOT/'submissions/r01'
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def relative(p,base=PACK):
    try: return os.path.relpath(p,base).replace('\\','/')
    except ValueError: return str(p).replace('\\','/')
def write(name,obj): (PACK/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if (ROOT/'READY.json').exists() or PACK.exists(): raise SystemExit('Refuse to overwrite an existing submission or READY.')
manifest=read(ROOT/'gallery-manifest.json')
audit=read(ROOT/'audit-state.json')
assert len(manifest['images'])==8 and len({p['path'] for p in manifest['images']})==8
assert len(audit['files'])==75 and audit['finalAssemblyAllowed']
assert not read(ROOT/'source-audit.json')['errors']
assert not read(ROOT/'link-audit.json')['missing']
required_reviews=['master-r02','background-r01','ui-r01','master-r03']
for name in required_reviews:
    assert 'accepted' in (SCENE/'reviews'/f'{name}.md').read_text(encoding='utf-8-sig')
for p in manifest['images']:
    assert sha(ROOT/p['path'])==p['sha256']
    assert not any(x in p['path'] for x in ('candidates/','iterations/','submissions/r01/master-'))
for f in audit['files']: assert sha(ROOT/f['path'])==f['expectedSha256']
for row in read(ROOT/'source-audit.json')['entries']: assert sha(ROOT/row['path'])==row['expectedSha256']

PACK.mkdir(parents=True)
snapshots=['requirements-index.json','source-alignment.json','audit-state.json','source-audit.json','gallery-manifest.json','link-audit.json']
owned=set(snapshots+['index.html','preparation.md','file-protocol.md','README.md','approval-history.md','verification.json'])
def rebase(value):
    if isinstance(value,dict): return {k:rebase(v) for k,v in value.items()}
    if isinstance(value,list): return [rebase(v) for v in value]
    if isinstance(value,str):
        if value in owned: return value
        if re.match(r'^[A-Za-z]:[/\\]',value): return value.replace('\\','/')
        p=ROOT/value
        if p.exists() and (value.startswith('../') or '/' in value or value.endswith(('.md','.json','.html','.png'))): return relative(p)
    return value
for name in snapshots:
    value=read(ROOT/name)
    if name=='source-alignment.json':
        # Remove ambiguity from the copied upstream short body-source paths.
        for body in value['uiBodySources']:
            source=SCENE.parent/'production-art-2026-10-02'/body['source']
            body['source']=relative(source,ROOT)
            body['sha256']=sha(source)
        value['uiBodySourcesCoordinateBase']='Source fields are relative to this JSON document directory after packaging; tower absoluteSourcePath remains explicit.'
    value=rebase(value)
    if name=='audit-state.json':
        value['status']='submitted_for_primary_review'
        value.pop('finalREADYPublished',None)
        value['deliveryPublication']=dict(owner='delivery',revision='r01',method='immutable packet then atomic READY',approval='awaiting_primary_review',READY='../../READY.json',note='READY is published only after packet/hash/link verification; current pointer is outside immutable packet.')
    if name=='gallery-manifest.json': value['status']='submitted_for_primary_review'
    write(name,value)

markup=(ROOT/'index.html').read_text(encoding='utf-8')
def html_rebase(match):
    attr,ref=match.group(1),html.unescape(match.group(2))
    if ref.startswith(('#','https:','http:','data:')): return match.group(0)
    p=ROOT/unquote(ref)
    new=ref if ref in owned else relative(p)
    return f'{attr}="{html.escape(new,quote=True)}"'
markup=re.sub(r'(href|src)="([^"]+)"',html_rebase,markup)
(PACK/'index.html').write_text(markup,encoding='utf-8')
(PACK/'file-protocol.md').write_text((ROOT/'file-protocol.md').read_text(encoding='utf-8'),encoding='utf-8')
(PACK/'preparation.md').write_text('''# Delivery r01 送审范围

2026-10-02，Asia/Shanghai。已依据主审正式记录完成母稿→背景/UI→最终两图的来源对齐与总图册封装。状态为submitted，delivery不自审通过，总包等待主审验收。

8张正式图：master r02阶段母稿1；master r03桌面RAIL压力/手机HIVE最终复合2；background r01 BG01/BG02两板；ui r01 UI01/UI02/UI03三板。候选、退稿及历史孤立板不列最终画廊。母稿文字/资源色/背景冲突由获批UI/BG及r03合同覆盖。

35项要求、49项UI逐格字段、九塔NEUTRAL及角色展示子集均可追溯。所有坐标和字号目标按设计值标明，PNG像素单列，设备实测为空。准确危险几何由源码派生状态控制；不从位图量测挂点或碰撞。

75项上游封包文件、185条来源指纹SHA一致。历史submitted/pending封存字段不改写，批准权威为主审记录。packet最后封存，再原子发布READY。源稿/透明资源/连续动画/代码接入/设备触控字号对比DPR安全区/性能均未实施。没有游戏接入、提交或部署。
''',encoding='utf-8')
(PACK/'README.md').write_text('''# GeoGuard 整体场景与玩家UI原画总图册 r01

状态：submitted，等待主审逐包验收；不是delivery自审通过。

入口：[8图画册](index.html)。[来源与层映射](source-alignment.json)、[35项需求](requirements-index.json)、[审批历史](approval-history.md)、[通信队列与SHA](audit-state.json)、[所有来源指纹](source-audit.json)、[本地引用审计](link-audit.json)。

master r02是阶段源稿；两张最终复合为r03。背景稀疏度按BG01/BG02，浅底深字#4B281C、mint资源#A8D8BC、sage#B6D4AE按UI/r03规格生效。画册只显示真实生图产物，不代替原画，不混入候选与退稿。

1440×900与390×844为logical_px设计视口；图像尺寸为image_pixel。图板格、世界层、屏幕层与外部标注分开登记，准确圆/线几何沿源码合同。来源状态是可成立例值，非实机采样。

本轮非透明生产资产、可编辑分层源稿、动画/图集、实测挂点或可运行游戏。设备、触控、字号、合成对比、DPR、安全区、性能留接入阶段验证。封包不包含代码修改或部署。
''',encoding='utf-8')
history=['# 审批历史与生效范围','', '历史包submitted/pending保持原样；以下主审书面记录为批准权威。delivery r01本身尚未批准。','', '|版本|主审记录|范围|','|---|---|---|']
for name,scope in [('master-r01','changes_requested：FAST不属于W23 HIVE合法快照'),('master-r02','accepted：母稿；BASIC替换及速度线移除关闭r01退回'),('background-r01','accepted：BG01及最终BG02'),('ui-r01','accepted：UI01/UI02/UI03及49项图格；文字色码/背景覆盖'),('master-r03','accepted：两张最终复合；缺眼、rig方向、弹数、线长、腹斑等预检问题关闭')]:
    history.append(f'|{name}|[主审记录]({relative(SCENE/"reviews"/(name+".md"))})|{scope}|')
history+=['','上游通过仅覆盖原画设计，不扩展为透明资产、实机触控/字号/对比/性能或游戏接入通过。源指纹中的generated_images及退稿仅为生成历史，不进入8图列表。','']
(PACK/'approval-history.md').write_text('\n'.join(history),encoding='utf-8')

# Validate the packaged gallery and explicit JSON evidence after rebase.
checks=[]
def check(source,ref,kind):
    ref=html.unescape(ref)
    if ref.startswith(('https:','http:','data:','mailto:')): return
    value=unquote(ref).split('#')[0].split('?')[0]
    target=source.parent/value if value else source
    exists=target.exists()
    if '#' in ref and value in ('','index.html'): exists=exists and f'id="{ref.split("#",1)[1]}"' in target.read_text(encoding='utf-8')
    checks.append(dict(source=relative(source),reference=ref,target=relative(target),exists=exists,kind=kind))
for p in PACK.glob('*'):
    if p.suffix=='.html':
        for ref in re.findall(r'(?:href|src)="([^"]+)"',p.read_text(encoding='utf-8')): check(p,ref,'package_html')
    if p.suffix=='.md':
        for ref in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')): check(p,ref,'package_markdown')
for r in read(PACK/'requirements-index.json')['requirements']:
    for ref in r['evidence']+r['reviewEvidence']: check(PACK/'requirements-index.json',ref,'package_requirement_evidence')
for p in read(PACK/'gallery-manifest.json')['images']:
    check(PACK/'gallery-manifest.json',p['path'],'package_image')
    assert sha(PACK/p['path'])==p['sha256']
def check_alignment(value,key=''):
    if isinstance(value,dict):
        for k,v in value.items(): check_alignment(v,k)
    elif isinstance(value,list):
        for v in value: check_alignment(v,key)
    elif isinstance(value,str) and key in ('file','path','review','evidence','mappingEvidence','layerEvidence','requirementsEvidence','approval','cleanContext','finalReview','finalCompositionContract','finalStateContractEvidence','source'):
        if value.startswith('../') or value in owned or re.match(r'^[A-Za-z]:[/\\]',value): check(PACK/'source-alignment.json',value,'package_alignment_evidence')
check_alignment(read(PACK/'source-alignment.json'))
errors=[c for c in checks if not c['exists']]
assert not errors, errors
links=read(PACK/'link-audit.json')
links.update(status='submitted_audit_snapshot',packageChecked=len(checks),packageMissing=errors,packageEntries=checks)
write('link-audit.json',links)
verification=dict(status='integrity_checks_only_not_art_approval',formalImages=8,imageTags=len(re.findall('<img ',markup)),drawnReplacements=len(re.findall('<(?:svg|canvas)',markup)),requirements=35,uiFineRequirements=49,upstreamPacketFiles=75,sourceFingerprints=185,sourceErrors=0,originalLocalReferences=links['checked'],packagedLocalReferences=len(checks),missingLinks=0,deviceValidated=False,productionAssetsDelivered=False,primaryDeliveryApproval='pending')
assert verification['imageTags']==8 and verification['drawnReplacements']==0
write('verification.json',verification)
packet_files=[]
for p in sorted(PACK.iterdir()):
    if p.suffix=='.json': read(p)
    assert p.read_bytes()[:3]!=b'\xef\xbb\xbf'
    packet_files.append(dict(path=relative(p,ROOT),sha256=sha(p),bytes=p.stat().st_size))
packet=dict(owner='delivery',revision='r01',status='submitted',approval='awaiting_primary_review',files=packet_files,images=[dict(id=p['id'],path=relative((PACK/p['path']).resolve(),ROOT),sha256=p['sha256'],imagePixels=p['imagePixels'],stage=p['stage'],authorityReview=relative((PACK/p['review']).resolve(),ROOT)) for p in read(PACK/'gallery-manifest.json')['images']],coveredRequirements=[r['id'] for r in read(PACK/'requirements-index.json')['requirements']],openIssues=['Delivery r01 total gallery and synthesized coverage await primary review.'],dependencies=[dict(owner=o,revision=r,review=relative(SCENE/'reviews'/f'{o}-{r}.md',ROOT),status='accepted_by_primary_review') for o,r in [('master','r02'),('background','r01'),('ui','r01'),('master','r03')]],summary='完整8图总册；35项需求、49项UI逐格、整体→精细板格→最终复合与层归属、75上游文件/185来源指纹及本地引用审计。母稿单独标阶段源稿，生效覆盖明确。仅submitted，等待主审。',limitations=read(SCENE/'master/submissions/r03/packet.json')['limitations'],immutableAfterReady=True)
write('packet.json',packet)
for f in packet['files']: assert sha(ROOT/f['path'])==f['sha256']
assert len(packet['images'])==8 and len(packet['coveredRequirements'])==35
ready=dict(revision='r01',packetPath='submissions/r01/packet.json',packetSha256=sha(PACK/'packet.json'))
temp=ROOT/'.READY-r01.tmp'
temp.write_text(json.dumps(ready,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
os.replace(temp,ROOT/'READY.json')
print(json.dumps(dict(status='submitted_awaiting_primary_review',revision='r01',images=8,packetFiles=len(packet_files),upstreamPacketFiles=75,sourceFingerprints=185,packagedLocalReferences=len(checks),missingLinks=0,READY='published_atomically'),ensure_ascii=False))
