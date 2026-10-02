"""Read approved source packets; write only delivery draft indexes and static gallery.
No generation, review approval, packet sealing or READY publication.
"""
from pathlib import Path
import hashlib, html, json, re, struct, sys
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent
SCENE = ROOT.parent
REPO = SCENE.parents[3]
FINAL = '--final' in sys.argv
def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def write(name, data):
    p = ROOT / name
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def rel(p):
    import os
    try: return os.path.relpath(p, ROOT).replace('\\', '/')
    except ValueError: return str(p).replace('\\', '/')
def esc(s): return html.escape(str(s), quote=True)
def link(p, title=None): return f'<a href="{esc(p)}">{esc(title or p)}</a>'
def resolve(source, value):
    value = unquote(value).split('#')[0].split('?')[0]
    if re.match(r'^[A-Za-z]:[/\\]', value): return Path(value)
    if value.startswith('docs/') or value.startswith('src/'): return REPO / value
    return source.parent / value

assert REPO.name == 'GeoGuard', REPO
audit = read(ROOT / 'audit-state.json')
alignment = read(ROOT / 'source-alignment.json')
requirements = read(ROOT / 'requirements-index.json')
queue, files, sources, plates, links = [], [], [], [], []
source_errors = []
for owner, rev in [('master','r02'),('background','r01'),('ui','r01')] + ([('master','r03')] if FINAL else []):
    group = SCENE / owner
    packet_file = group / 'submissions' / rev / 'packet.json'
    packet = read(packet_file)
    ready_file = group / 'READY.json'
    ready = read(ready_file)
    assert packet['owner'] == owner and packet['revision'] == rev
    # The current master's READY may later advance; it never erases r02 evidence.
    ready_matches = ready['revision'] == rev
    if ready_matches:
        assert (group / ready['packetPath']).resolve() == packet_file.resolve()
        if ready.get('packetSha256'): assert ready['packetSha256'] == sha(packet_file)
    review_file = SCENE / 'reviews' / f'{owner}-{rev}.md'
    review = review_file.read_text(encoding='utf-8-sig')
    assert 'accepted' in review, f'No primary acceptance evidence: {review_file}'
    final_images = {i['path']: i for i in packet['images']}
    for item in packet['files']:
        p = (group / item['path']).resolve()
        assert p.is_relative_to(group.resolve()), p
        actual = sha(p)
        assert actual == item['sha256'], f'Packet SHA mismatch: {p}'
        files.append(dict(owner=owner,revision=rev,path=rel(p),expectedSha256=item['sha256'],actualSha256=actual,result='match',galleryEligible=item['path'] in final_images))
    queue.append(dict(owner=owner,revision=rev,packet=rel(packet_file),packetSha256=sha(packet_file),ready=rel(ready_file),readySha256=sha(ready_file),readyMatchesThisRevision=ready_matches,submittedStatus=packet['status'],authorityReview=rel(review_file),reviewSha256=sha(review_file),primaryReviewStatus='accepted',approvalScope='original-art design stage only',verifiedFiles=len(packet['files'])))
    for image_path, image in final_images.items():
        p = group / image_path
        data = p.read_bytes()
        assert data[:8] == b'\x89PNG\r\n\x1a\n'
        width,height = struct.unpack('>II',data[16:24])
        plate_id = image.get('id',('MASTER-DESKTOP-FINAL' if 'desktop' in image_path else 'MASTER-PHONE-FINAL') if rev=='r03' else 'MASTER-MOTHER')
        plates.append(dict(id=plate_id,owner=owner,revision=rev,path=rel(p),sha256=sha(p),imagePixels=dict(width=width,height=height,unit='image_pixel'),review=rel(review_file),stage=('approved_final_composite' if rev=='r03' else 'approved_stage_mother') if owner=='master' else 'approved_detail_board',finalComposite=rev=='r03',galleryEligible=True))
    fingerprint_file = packet_file.parent / 'source-fingerprints.json'
    fp = read(fingerprint_file)
    entries = fp if isinstance(fp,list) else fp.get('entries',fp.get('files',[]))
    for entry in entries:
        p = Path(entry.get('absolutePath',entry['path']))
        if not p.is_absolute(): p = REPO / p
        expected=entry['sha256']
        actual=sha(p) if p.exists() else None
        row=dict(owner=owner,revision=rev,path=rel(p),expectedSha256=expected,actualSha256=actual,result='match' if actual==expected else ('missing' if actual is None else 'mismatch'),role=entry.get('role',entry.get('kind','source')))
        sources.append(row)
        if row['result']!='match': source_errors.append(row)
    # Audit literal Markdown/HTML local links in the sealed packet. JSON paths
    # use explicit schemas above and UI maps below, not guesses based on strings.
    for item in packet['files']:
        p=group/item['path']
        if p.suffix not in ('.md','.html'): continue
        text=p.read_text(encoding='utf-8-sig')
        refs=re.findall(r'(?:href|src)=["\']([^"\']+)["\']',text) if p.suffix=='.html' else re.findall(r'\]\(([^)]+)\)',text)
        for ref in refs:
            if ref.startswith(('https:','http:','data:','mailto:','#')): continue
            target=resolve(p,ref)
            links.append(dict(source=rel(p),reference=ref,target=rel(target),exists=target.exists(),kind='upstream_literal_link'))

ui_dir=SCENE/'ui/submissions/r01'
ui_map=read(ui_dir/'element-map.json')
ui_reqs=read(ui_dir/'requirements-map.json')['requirements']
towers=read(ui_dir/'tower-icon-sources.json')['items']
assert len(ui_reqs)==49 and len({r['id'] for r in ui_reqs})==49
assert len(towers)==9 and len({t['identity'] for t in towers})==9
by_id={p['id']:p for p in plates}
alignment['status']='assembled_upstream_approved_delivery_review_pending' if FINAL else 'draft_approved_mother_background_ui_awaiting_final_composites'
alignment['approvedUI']=dict(plates=[p for p in plates if p['owner']=='ui'],mappingEvidence=rel(ui_dir/'element-map.json'),requirementsEvidence=rel(ui_dir/'requirements-map.json'),scope='49 mapped design requirements and 9 tower sources; not exported icons')
alignment['elements']=[e for e in alignment['elements'] if not e['elementId'].startswith('UI-')]
for index,surface in enumerate(ui_map['uiSurfaces']):
    eid=['UI-HUD','UI-BUILD-HINTS','UI-MODALS','UI-TWIN-MEMBERS'][index]
    # Final images share the source's named-cell locator, not measured bounds.
    detail_ids=[i for i in ('UI01','UI02','UI03') if i in surface['cells']]
    alignment['elements'].append(dict(elementId=eid,label=surface['element'],requirementIds=['LAYER-02','LAYER-03'],coordinateSpace='screen',layer='screen modal' if index==2 else 'screen UI',master=dict(owner='master',revision='r02',file=alignment['approvedMother']['file'],sha256=alignment['approvedMother']['sha256'],locator=dict(type='named_region_or_future_surface',value=surface['element'] if index<2 else 'not pictured in mother; supplementary real player surface'),review='../reviews/master-r02.md'),detail=dict(owner='ui',revision='r01',plates=[by_id[i] for i in detail_ids],locator=dict(type='named_cells',value=surface['cells']),fields=surface['fields'],rule=surface['rule'],review='../reviews/ui-r01.md'),composites=[],characterSources=[],effectiveOverrideIds=['OVR-TEXT','OVR-MINT','OVR-SAGE'],layoutIds=['DESKTOP-DESIGN','PHONE-DESIGN'],status='detail_accepted_by_primary_awaiting_final_composite'))
alignment['uiSymbols']=ui_map['symbols']
alignment['uiBodySources']=ui_map['bodies']
alignment['uiBodySourcesCoordinateBase']='../../production-art-2026-10-02/'
alignment['towerIconSources']=towers
alignment['uiFineRequirements']=ui_reqs
alignment['worldAndScreenInterfaces']=[
 dict(elementId='ENTITY-SHADOW',coordinateSpace='world',layer='03 ENTITY SHADOWS',detailLocator='UI01 A/B context; UI03 D',source='existing external shadow contract; background does not produce shadows',composites=[]),
 dict(elementId='ENTITY-HP-LEVEL',coordinateSpace='world',layer='world-linked UI',detailLocator='UI03 D',source='tower.hp/maxHp/level; root/center conversion fixed; labels do not mirror',composites=[]),
 dict(elementId='PLACEMENT-GHOST-RANGE',coordinateSpace='world',layer='placement presentation',detailLocator='UI03 B/D',source='dragPlacement.worldX/worldY/canPlace/invalidReason/tower.range; hazard not a forbidden-build rule',composites=[]),
 dict(elementId='DANGER-GEOMETRY',coordinateSpace='world',layer='independent hazards',detailLocator='UI03 D; previous B03 geometry',source='runtime center/radius disc or segment and full width 2*width; HIVE mother only has true-source circles',composites=[]),
 dict(elementId='RESOURCE-DROP',coordinateSpace='world',layer='existing independent drops',detailLocator='mother mint diamonds; UI01 currency shape consistency',source='state.drops; not COURIER immediate refund; background excludes diamonds',composites=[]),
 dict(elementId='RESOURCE-UI',coordinateSpace='screen',layer='HUD/cost/reward',detailLocator='UI01 A/B; UI02 D/E; UI03 A',source='money/tower.cost/choice.amount; #A8D8BC mint diamond',composites=[]),
 dict(elementId='TOUCH-START',coordinateSpace='screen',layer='conditional touch feedback',detailLocator='UI01 B/E',source='joystick.active/start/current; release removes; no permanent control',composites=[])]
alignment['excludedAnnotationLayer']=dict(locators=['BG02 frames/arrows/title/stack','UI01 D/E instructional hands/arrows','UI02 G external blueprint explanation','UI03 schemas/HEX/source ledger/geometry measurements'],space='external specification annotation, not a player screen/world layer',rule='Never promote annotation to gameplay objects or controls')
baseline=SCENE.parent/'production-art-2026-10-02'
alignment['motherIdentitySources']=[]
for identity,path,cell,role in [
 ('tower:BASIC','friendly/submissions/r01/basic-fixed-root.png','NEUTRAL','field and card'),
 ('tower:CANNON','friendly/submissions/r02/cannon-sniper-fixed-root.png','upper CANNON NEUTRAL','field and card'),
 ('tower:BURST','friendly/submissions/r01/burst-fixed-root.png','NEUTRAL','field and unlocked example card'),
 ('tower:SNIPER','friendly/submissions/r02/cannon-sniper-fixed-root.png','lower SNIPER NEUTRAL','card only'),
 ('hero:PLAYER','friendly/submissions/r01/player-fixed-root.png','NEUTRAL','field'),
 ('enemy:BASIC','enemies/submissions/r01/images/basic-root-lock.png','NEUTRAL','field x3 from independent NEST; replaced rejected FAST'),
 ('boss:HIVE','bosses-mechanics/submissions/r01/hive-production.png','upper HIVE NEUTRAL','field'),
 ('mechanic:NEST','bosses-mechanics/submissions/r03/pair-09-nest-web.png','upper NEST INTACT','independent field mechanism, not background')]:
    p=baseline/path
    alignment['motherIdentitySources'].append(dict(identity=identity,file=rel(p),sha256=sha(p),locator=cell,role=role,evidence='../master/submissions/r02/reference-map.md',approval='../../production-art-2026-10-02/final-acceptance.md'))
alignment['layouts']=[dict(layoutId=i,viewport=dict(width=w,height=h,unit='logical_px',evidenceType='design_proposal'),targetTypography=ui_map['logicalDesignTargets'],measuredValues=None,measurementEvidence=None,runtimeValidated=False,evidence='../ui/submissions/r01/production-notes.md') for i,w,h in [('DESKTOP-DESIGN',1440,900),('PHONE-DESIGN',390,844)]]
alignment['effectiveOverrides']=[o for o in alignment['effectiveOverrides'] if o['id'] not in ('OVR-BG','OVR-MINT','OVR-SAGE')]
alignment['effectiveOverrides'].extend([
 dict(id='OVR-BG',value='Final ground uses accepted BG01/BG02; mother ground and UI01 ground are stage/context only',evidence='../reviews/ui-r01.md',mappedElements=['BG-BASE','BG-PATCHES','BG-GRASS']),
 dict(id='OVR-MINT',value='Currency/cost resource diamond #A8D8BC with dark green edge; pale blue for existing reward accent only',evidence='../ui/submissions/r01/production-notes.md',mappedElements=['UI-HUD','UI-BUILD-HINTS','UI-MODALS']),
 dict(id='OVR-SAGE',value='UI03 generated sage HEX print is superseded by #B6D4AE',evidence='../reviews/ui-r01.md',mappedElements=['UI-BUILD-HINTS'])])
for o in alignment['effectiveOverrides']:
    if o['id']=='OVR-TEXT': o['mappedElements']=['UI-HUD','UI-BUILD-HINTS','UI-MODALS','UI-TWIN-MEMBERS']
    if o['id']=='OVR-AIM': o['mappedElements']=['tower:SENTINEL source ledger; final icon production only']
if FINAL:
    alignment['approvedFinalComposites']=[p for p in plates if p['finalComposite']]
    alignment['finalStateContract']=read(SCENE/'master/submissions/r03/source-derived-states.json')
    alignment['effectivePreparationNote']='Historical state-contract remark about missing final UI is superseded by accepted ui r01; source-derived values remain illustrative, not sampled device measurements.'
    alignment['finalStateContractEvidence']='../master/submissions/r03/source-derived-states.json'
    alignment['finalCompositionContract']='../master/submissions/r03/style-contract.md'
    alignment['finalReview']='../reviews/master-r03.md'
    for e in alignment['elements']:
        shown=e['elementId'] not in ('UI-MODALS','UI-TWIN-MEMBERS')
        e['composites']=[dict(file=p['path'],sha256=p['sha256'],review=p['review'],locator=dict(type='semantic_region_from_contract',value=(e['label']+'; '+('desktop W25 RAIL pressure' if 'DESKTOP' in p['id'] else 'phone W23 HIVE')) if shown else 'not active in this combat snapshot; covered by UI02/UI03 detail boards'),appearance='shown' if shown else 'not_applicable_to_selected_snapshot',evidence='../master/submissions/r03/reference-map.md',measuredBounds=None) for p in alignment['approvedFinalComposites']]
        e['status']='approved_source_chain_recorded_delivery_review_pending'
    for e in alignment['worldAndScreenInterfaces']:
        e['composites']=[dict(file=p['path'],sha256=p['sha256'],review=p['review'],appearance=('conditional_absent_no_active_press' if e['elementId']=='TOUCH-START' else ('no_drag_ghost_in_selected_snapshot' if e['elementId']=='PLACEMENT-GHOST-RANGE' else 'source_semantics_retained')),evidence='../master/submissions/r03/style-contract.md',measuredBounds=None) for p in alignment['approvedFinalComposites']]
    rail_body=baseline/'bosses-mechanics/submissions/r02/pair-03-frost-rail.png'
    alignment['finalIdentitySources']=alignment['motherIdentitySources']+[dict(identity='boss:RAIL_WARLORD',file=rel(rail_body),sha256=sha(rail_body),locator='lower RAIL body row; source poses control production',role='desktop only; FROST excluded',evidence='../master/submissions/r03/reference-map.md',approval='../../production-art-2026-10-02/final-acceptance.md')]
    alignment['finalSnapshots']=[dict(image='MASTER-PHONE-FINAL',identities=['tower:BASIC','tower:CANNON','tower:BURST','hero:PLAYER','enemy:BASIC','boss:HIVE','mechanic:NEST'],ordinaryEnemies='one NEST-summoned BASIC',hazards='one living NEST hivePulse area disc; no ownerless line',logicalTarget='390x844 logical_px design'),dict(image='MASTER-DESKTOP-FINAL',identities=['tower:BASIC x2','tower:CANNON x2','tower:BURST x2','hero:PLAYER','boss:RAIL_WARLORD'],ordinaryEnemies=[],hazards='single suppressiveGrid; four finite equal-concept-length capsules; eight endcaps; no additional cast',logicalTarget='1440x900 logical_px design')]
write('source-alignment.json',alignment)

# Evidence mapping does not promote each draft item to accepted. Primary review
# status belongs to upstream scope; delivery's synthesis remains review-pending.
evidence_by_id={
 'PIPE-02':(['../background/submissions/r01/packet.json','../ui/submissions/r01/packet.json'],['background','ui']),
 'STYLE-01':(['../master/submissions/r02/style-contract.md','../background/submissions/r01/production-notes.md','../ui/submissions/r01/production-notes.md'],['master','background','ui']),
 'STYLE-02':(['../master/submissions/r02/style-contract.md','../background/submissions/r01/production-notes.md'],['master','background']),
 'STYLE-03':(['../background/submissions/r01/production-notes.md'],['background']),
 'STYLE-04':(['../background/submissions/r01/production-notes.md','../master/submissions/r02/constraints.md'],['master','background']),
 'LAYOUT-01':(['../ui/submissions/r01/element-map.json','../master/submissions/r02/style-contract.md'],['master','ui']),
 'LAYOUT-02':(['../ui/submissions/r01/element-map.json'],['ui']),
 'LAYER-02':(['source-alignment.json','../background/submissions/r01/production-notes.md','../ui/submissions/r01/element-map.json'],['background','ui']),
 'LAYER-04':(['../master/submissions/r02/reference-map.md','../ui/submissions/r01/element-map.json'],['master','ui']),
 'CHAR-01':(['../../production-art-2026-10-02/final-acceptance.md','../master/submissions/r02/reference-map.md','../ui/submissions/r01/tower-icon-sources.json'],['master','ui']),
 'CHAR-02':(['../master/submissions/r02/style-contract.md','../ui/submissions/r01/production-notes.md'],['master','ui']),
 'CHAR-03':(['../../production-art-2026-10-02/friendly/submissions/r03/reuse-design.md','../ui/submissions/r01/tower-icon-sources.json'],['ui']),
 'UI-01':(['../ui/submissions/r01/requirements-map.json','../ui/submissions/r01/ui01-hud-build-hints.png','../ui/submissions/r01/ui03-components-states.png'],['ui']),
 'UI-02':(['../ui/submissions/r01/requirements-map.json','../ui/submissions/r01/production-notes.md'],['ui']),
 'UI-03':(['../ui/submissions/r01/ui02-player-flow.png','../ui/submissions/r01/requirements-map.json'],['ui']),
 'UI-04':(['../ui/submissions/r01/production-notes.md'],['ui']),
 'UI-05':(['../ui/submissions/r01/production-notes.md','../../production-art-2026-10-02/integration/submissions/r02/effective-specifications.md'],['ui']),
 'UI-06':(['../ui/submissions/r01/requirements-map.json'],['ui']),
 'UI-07':(['../ui/submissions/r01/production-notes.md','../ui/submissions/r01/ui02-player-flow.png'],['ui']),
 'UI-08':(['source-alignment.json','../ui/submissions/r01/production-notes.md'],['ui']),
 'READ-01':(['../master/submissions/r02/style-contract.md','../ui/submissions/r01/ui03-components-states.png'],['master','ui']),
 'ART-01':([f'../{o}/submissions/{r}/generation-record.json' for o,r in [('master','r02'),('background','r01'),('ui','r01')]],['master','background','ui']),
 'ART-02':(['index.html','gallery-manifest.json'],[]),'ART-03':(['index.html','preparation.md'],[]),
 'AUDIT-01':(['audit-state.json'],[]),'AUDIT-02':(['audit-state.json','../reviews/master-r01.md','../reviews/master-r02.md'],['master']),
 'AUDIT-03':(['link-audit.json','source-audit.json'],[]),'AUDIT-04':(['audit-state.json','file-protocol.md'],[])}
review_path={'master':'../reviews/master-r02.md','background':'../reviews/background-r01.md','ui':'../reviews/ui-r01.md'}
ui_association={
 'UI-01':['hud-hp','hud-wave-time','hud-money','hud-pause','hud-boss-group','hud-boss-member','world-level-hp'],
 'UI-02':[r['id'] for r in ui_reqs if r['id'].startswith(('build-','card-','placement-'))],
 'UI-03':['hint-pc','hint-mobile','start','end','pause-resume','rewards-open'],
 'UI-05':['type-color-size'],'UI-06':[r['id'] for r in ui_reqs],
 'UI-07':[r['id'] for r in ui_reqs if r['id'].startswith(('reward-','blueprint-'))],
 'UI-08':['type-color-size','design-runtime-boundary'],
 'LAYOUT-02':['mobile-two-row','build-scroll','reward-phone-stack'],
 'LAYOUT-03':['touch-conditional','build-touch-vs-scroll'],
 'READ-01':['world-level-hp','placement-hazard-coexist','hazard-geometry']}
for r in requirements['requirements']:
    if r['id'] in evidence_by_id:
        ev,owners=evidence_by_id[r['id']]
        r['evidence']=ev
        r['reviewEvidence']=[review_path[o] for o in owners]
        r['status']='upstream_concept_evidence_recorded_delivery_review_pending' if owners else 'draft_audit_evidence_delivery_review_pending'
    if r['id'] in ui_association: r['fineRequirementIds']=ui_association[r['id']]
    if r['id'] in ('PIPE-03','LAYOUT-03','LAYOUT-04','LAYER-03'):
        r['status']='awaiting_final_composite_primary_approval'
        r['openIssues']=['master r03 final desktop-pressure and phone composites not yet submitted/approved']
    if r['id']=='PIPE-04':
        r['status']='awaiting_delivery_submission_and_primary_review'
    if r['id']=='UI-02':
        r['requirement']='建造栏及现有拖塔/低资金状态完整；不能仅降低全部文字透明度；低资金仍可起拖，不误称HTML disabled'
    if r['id']=='UI-07':
        r['requirement']='按实际choices至多三项；常规三项，修复替换卡，不虚构补齐；蓝图只影响后续建造'
if FINAL:
    for r in requirements['requirements']:
        if r['id'] in ('PIPE-03','LAYOUT-03','LAYOUT-04','LAYER-03'):
            r['status']='upstream_final_composite_evidence_recorded_delivery_review_pending'
            r['evidence']=['../master/submissions/r03/master-desktop-rail-r03.png','../master/submissions/r03/master-mobile-hive-r03.png','../master/submissions/r03/style-contract.md','source-alignment.json']
            r['reviewEvidence']=['../reviews/master-r03.md']
            r['openIssues']=[]
        if r['id'] in ('STYLE-01','STYLE-02','STYLE-04','LAYOUT-01','LAYOUT-02','LAYER-04','CHAR-01','CHAR-02','CHAR-03','READ-01','ART-01'):
            r['evidence']+=['../master/submissions/r03/style-contract.md','../master/submissions/r03/reference-map.md']
            r['reviewEvidence']+=['../reviews/master-r03.md']
        if r['id']=='PIPE-04':
            r['status']='assembled_for_primary_review_not_self_approved'
            r['evidence']=['index.html','requirements-index.json','source-alignment.json']
requirements['status']='assembled_35_requirements_delivery_review_pending' if FINAL else 'draft_35_requirements_delivery_review_pending'
write('requirements-index.json',requirements)
write('source-audit.json',dict(status='draft',entries=sources,errors=source_errors))
manifest=dict(status='assembled_for_primary_review' if FINAL else 'draft_not_submitted',expectedFinalImageCount=8,currentApprovedImageCount=len(plates),images=plates,awaitingFinalImages=[] if FINAL else [dict(owner='master',revision='r03',role='desktop pressure composite',status='awaiting_primary_approval'),dict(owner='master',revision='r03',role='phone composite',status='awaiting_primary_approval')],excludedHistory='All candidates, iterations, master r01 rejected image and prior isolated boards excluded from final image list')
write('gallery-manifest.json',manifest)
audit.update(status='draft_only_awaiting_final_composites',queue=queue,files=files,sourceAudit='source-audit.json',links='link-audit.json',missing=['approved master r03 final two composites','delivery primary review'],mismatches=source_errors,finalAssemblyAllowed=False,finalREADYPublished=False)
if FINAL:
    audit.update(status='assembled_for_primary_review',missing=['delivery primary review'],finalAssemblyAllowed=True)
    audit['reviewClosure']=[dict(owner='master',issue='FAST incompatible with WAVE23 HIVE',rejectedRevision='r01',rejectionReview='../reviews/master-r01.md',fixedRevision='r02',acceptanceReview='../reviews/master-r02.md',status='closed_by_primary_review'),dict(owner='master',revision='r03',issue='preflight eye/rig direction/pellets/line lengths/BURST spots and smile',acceptanceReview='../reviews/master-r03.md',status='closed_by_primary_review',excludedBranches='abandoned source branches remain generation history, never final gallery')]
write('audit-state.json',audit)

parts=['<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GeoGuard 场景与 UI 原画图册 · 草案</title><style>body{margin:0;background:#fff9ef;color:#4b281c;font:16px/1.6 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:36px 24px}a{color:#3c6049}nav{display:flex;gap:18px;flex-wrap:wrap;margin:20px 0}article,section{margin:32px 0}img{display:block;width:100%;height:auto;border:1px solid #cbb6a0;border-radius:12px}table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:10px;text-align:left;border-bottom:1px solid #ddcfbd;vertical-align:top}code{overflow-wrap:anywhere;font-size:12px}.notice{padding:18px;border:1px solid #b89f86;border-radius:12px}h1{line-height:1.2}h2{margin-top:36px}small{display:block}.scroll{overflow:auto}</style><main><h1>GeoGuard 整体场景与玩家 UI</h1><p>2026-10-02 · 原画设定图册草案 · 未封包，待最终复合及主审验收</p><div class="notice">当前正式来源6张，目标最终8张：阶段母稿1＋最终复合2＋背景2＋UI3。master r03两张最终复合待提交及主审通过。本页只展示真实生成PNG，不绘制或拼造替代原画。</div><nav><a href="#gallery">正式来源</a><a href="#overrides">生效覆盖</a><a href="#mapping">整体与拆解对齐</a><a href="#requirements">35项验收索引</a><a href="#fine">49项UI图格</a><a href="#audit">审计与边界</a></nav>']
parts.append('<section id="gallery"><h2>正式原画来源</h2><p>阶段母稿用于追溯总体构图；最终战斗以获批背景/UI新规范及后续复合为准。候选和退稿不在图列表。</p>')
for p in plates:
    title={'MASTER-MOTHER':'整体母稿 r02 · 阶段源稿','MASTER-DESKTOP-FINAL':'最终桌面压力复合 r03 · RAIL 波25 歼灭P3/3','MASTER-PHONE-FINAL':'最终手机复合 r03 · HIVE 波23 孵潮P2/3','BG01':'BG01 · 独立干净背景','BG02':'BG02 · 地面与世界延展分层','UI01':'UI01 · 桌面/手机 HUD、建造、提示','UI02':'UI02 · 开始/结束/暂停/奖励','UI03':'UI03 · 组件与状态'}[p['id']]
    note=('最终复合已经主审逐图通过；动态文字、色码和准确几何仍以合同生产，位图不用于反推碰撞或挂点。' if p['finalComposite'] else '阶段图中文字、资源色及背景若与新规范冲突，以UI/BG获批规格覆盖。') if p['owner']=='master' else ('框、箭头、说明文字为规格标注，不是游戏素材。' if p['owner']=='background' else '文字为动态字段示意；UI01地面仅上下文，sage生成色码以文字规格为准。')
    parts.append(f'<article id="plate-{esc(p["id"])}"><h3>{esc(title)}</h3><a href="{esc(p["path"])}"><img loading="lazy" src="{esc(p["path"])}" alt="{esc(title)}"></a><p>{note}</p><small>PNG {p["imagePixels"]["width"]}×{p["imagePixels"]["height"]} image_pixel · {link(p["review"],"主审通过记录")} · {link(p["path"],"原图")}</small><code>SHA256 {p["sha256"]}</code></article>')
parts.append('<article><h3>最终复合 · 待主审</h3><p>桌面复杂战斗与手机最终两图尚未批准。此处不引用制作中的候选文件。</p></article></section><section id="overrides"><h2>生效覆盖与逻辑尺寸</h2><ul>')
for o in alignment['effectiveOverrides']: parts.append(f'<li>{esc(o["id"])}：{esc(o["value"])} · {link(o["evidence"],"规格依据")}</li>')
parts.append('</ul><p>1440×900桌面、390×844手机均为logical_px设计目标。图板PNG像素另列，不反推字号、挂点、碰撞或屏幕安全区。正文≥14、CTA≥16、费用≥16、辅助≥12、触控≥44×44、对比≥4.5均为设计目标；实测值为空。world危险几何以runtime center/radius或segment/width为准。</p></section><section id="mapping"><h2>整体 → 精细板格 → 最终复合</h2><div class="scroll"><table><tr><th>元素</th><th>空间/层</th><th>母稿关系</th><th>精细板格</th><th>最终复合</th></tr>')
for e in alignment['elements']:
    detail=e['detail']; loc=detail['locator']['value']
    composite_refs=' · '.join(link(c['file'],c['appearance']) for c in e['composites']) if FINAL else '待r03通过并逐元素对齐'
    parts.append(f'<tr><td>{esc(e["elementId"])}<br>{esc(e["label"])}</td><td>{esc(e["coordinateSpace"])}<br>{esc(e["layer"])}</td><td>{esc(e["master"]["locator"]["value"])}</td><td>{esc(loc)}<br>{link(detail["review"],"主审")}</td><td>{composite_refs}</td></tr>')
parts.append('</table></div><p>格号与命名区域来自提交规格，非像素测量。'+link('source-alignment.json','完整来源索引')+'保留具体来源与最终复合待填字段。48身份/375来源为历史获批基线；本轮仅展示明确子集，未重新生产375项资源。</p><h3>世界／屏幕接口</h3><table><tr><th>元素</th><th>空间与层</th><th>精细板格及依据</th></tr>')
for e in alignment['worldAndScreenInterfaces']:
    parts.append(f'<tr><td>{esc(e["elementId"])}</td><td>{esc(e["coordinateSpace"])} / {esc(e["layer"])}</td><td>{esc(e["detailLocator"])}<br>{esc(e["source"])}</td></tr>')
parts.append('</table><p>world-linked UI记录为world锚定的独立呈现层。框、教学手指、箭头、色码、来源账本均属于外部规格注释，不纳入产品screen/world对象。</p><h3>母稿角色来源子集</h3><table><tr><th>身份</th><th>身体源格</th><th>母稿用途</th></tr>')
for c in alignment['motherIdentitySources']:
    parts.append(f'<tr><td>{esc(c["identity"])}</td><td>{link(c["file"])}<br>{esc(c["locator"])}</td><td>{esc(c["role"])}</td></tr>')
parts.append('</table><h3>九塔图标生产来源</h3><table><tr><th>身份／玩家名</th><th>精确源格</th><th>本轮展示情况</th></tr>')
for c in towers:
    parts.append(f'<tr><td>{esc(c["identity"])} / {esc(c["playerName"])}</td><td>{link(rel(Path(c["absoluteSourcePath"])))}<br>{esc(c["row"])} · {esc(c["cell"])} · 第{c["column"]}格</td><td>{esc(c["artworkAppearance"])}</td></tr>')
parts.append('</table><p>没有导出透明图标；生产复用既有NEUTRAL源格，不裁生成UI缩略图。SENTINEL及我方方向由r03整个局部rig镜像合同覆盖旧LEFT180印字。</p></section><section id="requirements"><h2>35项完整验收索引</h2><div class="scroll"><table><tr><th>ID / 要求</th><th>当前状态</th><th>证据与主审</th></tr>')
for r in requirements['requirements']:
    refs=' · '.join(link(p) for p in r['evidence']+r['reviewEvidence'])
    parts.append(f'<tr><td>{esc(r["id"])}<br>{esc(r["requirement"])}</td><td>{esc(r["status"])}</td><td>{refs or "等待证据"}</td></tr>')
parts.append('</table></div></section><section id="fine"><h2>UI 49项逐格与动态字段</h2><div class="scroll"><table><tr><th>要求</th><th>板格</th><th>动态字段/约束</th></tr>')
for r in ui_reqs: parts.append(f'<tr><td>{esc(r["id"])}<br>{esc(r["requirement"])}</td><td>{esc(r["board"])} {esc(r["cells"])}</td><td>{esc(r["binding"])}</td></tr>')
parts.append('</table></div><p>'+link('../ui/submissions/r01/tower-icon-sources.json','9塔精确身体源格')+' · '+link('../ui/submissions/r01/production-notes.md','UI生产规格')+'</p></section><section id="audit"><h2>审批、通信队列与文件审计</h2><ul>')
for q in queue: parts.append(f'<li>{esc(q["owner"])} {esc(q["revision"])}：{link(q["packet"],"packet")} · {link(q["ready"],"READY")} · {link(q["authorityReview"],"主审accepted")} · {q["verifiedFiles"]}项文件SHA一致。</li>')
parts.append('</ul><p>master r01的FAST来源退回由r02 BASIC替换关闭；历史submitted/pending保持原样，以主审记录判定批准。所有沟通依持久packet/READY，delivery未跨会话发消息。</p><p>'+link('audit-state.json','队列及SHA')+' · '+link('source-audit.json','所有来源指纹')+' · '+link('link-audit.json','本地链接检查')+' · '+link('gallery-manifest.json','正式图列表')+' · '+link('requirements-index.json','35项机器索引')+'</p><div class="notice">本轮仅原画与规格。未交付透明图标/纹理、可编辑分层源稿、连续帧/图集、精确实测挂点、代码接入或部署。真实设备字号、触控、对比、DPR/安全区、遮挡与性能尚未验证。草案不构成delivery自审通过；最终包必须另由主审逐包验收。</div></section></main></html>')
markup=''.join(parts)
if FINAL:
    markup=markup.replace('GeoGuard 场景与 UI 原画图册 · 草案','GeoGuard 场景与 UI 原画图册 · r01送审')
    markup=markup.replace('原画设定图册草案 · 未封包，待最终复合及主审验收','原画设定图册 r01 · 上游已批准，本总包待主审验收')
    markup=markup.replace('当前正式来源6张，目标最终8张：阶段母稿1＋最终复合2＋背景2＋UI3。master r03两张最终复合待提交及主审通过。','完整8张：阶段母稿1＋最终复合2＋背景2＋UI3。母稿、背景、UI、最终两图均有主审批准记录；总图册本身仍待主审。')
    markup=markup.replace('<article><h3>最终复合 · 待主审</h3><p>桌面复杂战斗与手机最终两图尚未批准。此处不引用制作中的候选文件。</p></article>','<p>最终两图分别为真实来源的RAIL复杂战斗与HIVE手机快照；各状态有明确字段与技能来源，不将孤立板或不同状态堆叠成战斗。</p>')
    markup=markup.replace('草案不构成delivery自审通过；最终包必须另由主审逐包验收。','delivery r01仅送审，不自审通过；总图册仍由主审逐包验收。')
(ROOT/'index.html').write_text(markup,encoding='utf-8')

# Audit every generated href/src, including local fragments, and explicit paths
# in delivery requirement/source indexes. Paths in UI schemas use stated bases.
write('link-audit.json',dict(status='draft',entries=[]))
for ref in re.findall(r'(?:href|src)=["\']([^"\']+)["\']',(ROOT/'index.html').read_text(encoding='utf-8')):
    target=resolve(ROOT/'index.html',ref)
    exists=target.exists()
    if ref.startswith('#'): exists=f'id="{ref[1:]}"' in (ROOT/'index.html').read_text(encoding='utf-8')
    links.append(dict(source='index.html',reference=ref,target=rel(target),exists=exists,kind='delivery_html'))
for r in requirements['requirements']:
    for ref in r['evidence']+r['reviewEvidence']:
        target=ROOT/ref
        links.append(dict(source='requirements-index.json',reference=ref,target=rel(target),exists=target.exists(),kind='delivery_requirement_evidence'))
for t in towers:
    p=Path(t['absoluteSourcePath'])
    links.append(dict(source='ui/tower-icon-sources.json',reference=t['sourcePath'],target=rel(p),exists=p.exists(),kind='tower_source'))
    assert sha(p)==t['sha256'], f'Tower source SHA mismatch: {p}'
for b in ui_map['bodies']:
    p=SCENE.parent/'production-art-2026-10-02'/b['source']
    links.append(dict(source='ui/element-map.json',reference=b['source'],target=rel(p),exists=p.exists(),kind='body_source'))
errors=[row for row in links if not row['exists']]
write('link-audit.json',dict(status='draft',checked=len(links),missing=errors,entries=links))
assert len(plates)==(8 if FINAL else 6) and len({p['path'] for p in plates})==len(plates)
assert len(requirements['requirements'])==35
assert not (ROOT/'READY.json').exists(), 'Draft must not publish READY'
print(json.dumps(dict(status='assembled_for_primary_review' if FINAL else 'draft_only',approvedImages=len(plates),expectedFinalImages=8,packetFiles=len(files),sourceFingerprints=len(sources),sourceErrors=len(source_errors),localLinksChecked=len(links),missingLinks=len(errors),requirements=35,uiFineRequirements=49,READY='absent'),ensure_ascii=False))
