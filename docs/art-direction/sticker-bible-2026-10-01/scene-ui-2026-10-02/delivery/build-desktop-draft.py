"""Build desktop-only review draft. Never writes submissions or READY."""
from pathlib import Path
import hashlib, html, json, os, re, struct, sys

DELIVERY=Path(__file__).resolve().parent
ROOT=DELIVERY/'desktop-preparation'
SCENE=DELIVERY.parent
REPO=SCENE.parents[3]
FINAL='--final' in sys.argv
def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def rel(p):
    try: return os.path.relpath(p,ROOT).replace('\\','/')
    except ValueError: return str(p).replace('\\','/')
def write(name,obj): (ROOT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def esc(s): return html.escape(str(s),quote=True)
def link(p,label=None): return f'<a href="{esc(p)}">{esc(label or p)}</a>'

baseline=read(ROOT/'immutable-baseline.json')
assert sha(DELIVERY/'READY.json')==baseline['deliveryREADYSha256']
for item in baseline['files']: assert sha(ROOT/item['path'])==item['sha256']
assert not (DELIVERY/'submissions/r02').exists()
queue=read(ROOT/'queue.json')
mapping=read(ROOT/'source-alignment.json')
requirements=read(ROOT/'requirements.json')
plates,files,sources,upstream_links=[],[],[],[]
for owner in ('background','ui') + (('master',) if FINAL else ()):
    group=SCENE/owner
    revision='r04' if owner=='master' else 'r02'
    folder=group/'submissions'/revision
    packet=read(folder/'packet.json')
    ready=read(group/'READY.json')
    review_file=SCENE/'reviews'/f'{owner}-{revision}.md'
    assert 'accepted' in review_file.read_text(encoding='utf-8-sig')
    assert packet['owner']==owner and packet['revision']==revision
    assert ready['revision']==revision and ready['packetPath']==f'submissions/{revision}/packet.json'
    if ready.get('packetSha256'): assert ready['packetSha256']==sha(folder/'packet.json')
    images={i['path']:i for i in packet['images']}
    for f in packet['files']:
        p=(group/f['path']).resolve()
        assert p.is_relative_to(group.resolve())
        assert sha(p)==f['sha256'],p
        files.append(dict(owner=owner,revision=revision,path=rel(p),sha256=f['sha256'],result='match',formalImage=f['path'] in images))
        if p.suffix=='.html':
            for ref in re.findall(r'(?:href|src)=["\']([^"\']+)["\']',p.read_text(encoding='utf-8-sig')):
                if ref.startswith(('http:','https:','data:','#')): continue
                target=p.parent/ref
                upstream_links.append(dict(source=rel(p),reference=ref,target=rel(target),exists=target.exists()))
    for f,i in images.items():
        p=group/f
        data=p.read_bytes()
        assert data[:8]==b'\x89PNG\r\n\x1a\n'
        w,h=struct.unpack('>II',data[16:24])
        image_id=i.get('id','DESKTOP-DENSITY' if 'density' in f else 'DESKTOP-TWINS')
        plates.append(dict(id=image_id,owner=owner,revision=revision,file=rel(p),sha256=sha(p),imagePixels=dict(width=w,height=h,unit='image_pixel'),review=rel(review_file),scope='approved_final_desktop_joint_concept' if owner=='master' else 'approved_desktop_detail_concept_not_joint_composite'))
    fp=read(folder/'source-fingerprints.json')
    entries=fp if isinstance(fp,list) else fp.get('files',fp.get('entries',[]))
    for f in entries:
        path=f.get('absolutePath',f['path'])
        p=Path(path) if re.match(r'^[A-Za-z]:[/\\]',path) else REPO/path
        actual=sha(p)
        mutable_ready=owner=='master' and p.resolve()==(SCENE/'master/READY.json').resolve()
        if mutable_ready:
            assert '54' in review_file.read_text(encoding='utf-8-sig') and 'READY.json' in review_file.read_text(encoding='utf-8-sig')
            sources.append(dict(owner=owner,revision=revision,path=rel(p),sha256=f['sha256'],actualSha256=actual,result='historical_mutable_READY_snapshot',role='publication queue snapshot, not immutable art source',primaryExplanation=rel(review_file),note='Old expected READY hash retained; current r04 publication pointer naturally differs.'))
        else:
            assert actual==f['sha256'],p
            sources.append(dict(owner=owner,revision=revision,path=rel(p),sha256=f['sha256'],actualSha256=actual,result='match',role=f.get('kind',f.get('role','source'))))
    dep=next(d for d in queue['dependencies'] if d['owner']==owner)
    dep.update(status='accepted_by_primary_final_joint_art' if owner=='master' else 'accepted_by_primary_detail_art_only',currentObservedRevision=revision,currentReadySha256=sha(group/'READY.json'),packetSha256=sha(folder/'packet.json'),reviewSha256=sha(review_file),targetReviewExists=True,approvedFiles=[f for f in files if f['owner']==owner])
    if owner=='ui':
        dep.update(coveredRequirements=packet['coveredRequirements'],openIssues=['joint dense composite approval pending; title anchor and persistent drag tags are design targets, not current implementation'],closedIssues=['DUI02 selected output path mismatch corrected to edit4 per primary review','nine-tower order/FROST55/native horizontal scroll/mouse snapshots/compact Boss/reward 1-2-3 accepted'])
queue['missing']=['master r04 primary approval','primary final assembly authorization','delivery r02 primary review']
queue['status']='desktop_draft_detail_sources_approved_joint_pending'
master_dep=next(d for d in queue['dependencies'] if d['owner']=='master')
master_dep['generationAuthorizedByPrimary']=True
master_dep['authorizationScope']='Primary reviewer authorized two r04 desktop compositions after accepted BG/UI; not delivery final assembly authorization.'
if FINAL:
    queue['status']='assembled_for_primary_delivery_review'
    queue['missing']=['delivery r02 primary review']
    queue['delivery'].update(status='assembled_for_primary_review_not_self_approved',finalAssemblyAuthorized=True,authorizationScope='Primary reviewer explicitly authorized final delivery r02 after master r04 acceptance',READYPublished=False)
    master_dep['closedIssues']=['accepted actual A19 enemies/10 towers and B8 towers + independent ghost','BEACON historical summon survival and BASIC HP recalculation proved by source contract','preflight anatomy/bar width/scroll direction/group name/thumbnail/extra belly spot issues closed by primary']
    master_dep['openIssues']=[]
write('queue.json',queue)
ui=SCENE/'ui/submissions/r02'
fine=read(ui/'requirements-map.json')['requirements']
assert len(fine)==48 and len({r['id'] for r in fine})==48
ui_map=read(ui/'element-map.json')
towers=read(ui/'tower-icon-sources.json')['items']
assert len(towers)==9
by_id={p['id']:p for p in plates}
mapping['formalDesktopImages']=plates
mapping['status']='desktop_draft_BG_UI_accepted_final_master_pending'
mapping['UIFineRequirements']=fine
mapping['towerIconSources']=towers
mapping['UIOtherBodySources']=ui_map['otherBodies']
mapping['layoutTargets']=[dict(id='DESKTOP-STANDARD',width=1440,height=900,unit='logical_px',evidenceType='design_proposal',measuredValues=None,runtimeValidated=False),dict(id='DESKTOP-SMALL',width=960,height=720,unit='logical_px',evidenceType='design_proposal',measuredValues=None,runtimeValidated=False)]
mapping['componentDesignValues']=dict(values=ui_map['measurements'],evidence=rel(ui/'production-notes.md'),note='Design targets only; neither measured PNG bounds nor implemented component positions')
mapping['functionalDifferences']=[
 dict(id='TITLE-ANCHOR',existing='BuildBar native browser title with existing summary/damage/interval/range content; browser chooses position/delay',design='DUI02 A controlled visual placement above buildbar, width/padding/flip targets',implemented=False,evidence=rel(ui/'production-notes.md')),
 dict(id='DRAG-STATE-TAG',existing='Release failure creates floating text; low funds can start drag; success only spends cost; whole-bar cancellation first',design='Persistent check/X/! and drag status labels express readability target',implemented=False,evidence=rel(ui/'production-notes.md')),
 dict(id='MOUSE-SCROLL',existing='Native overflow-x scrollbar thumb can be mouse-dragged; no onWheel vertical-to-horizontal conversion',design='Discoverability via clipping/fade/native thumb; no new arrow/lock/shop controls',implemented='native browser behavior, not promised wheel gesture',evidence=rel(ui/'production-notes.md'))]
mapping['mouseStates']=[dict(id=i,board='DUI02',cell=cell,meaning=meaning,coordinateSpace='screen pointer + world ghost/range',mutuallyExclusive=True,finalCompositeSources=[],evidence=rel(ui/'production-notes.md'),review='../../reviews/ui-r02.md') for i,cell,meaning in [
 ('MOUSE-HOVER','A','Mouse on BASIC card; existing title content; no ghost/range; HIVE recovery, no hazard'),
 ('MOUSE-VALID','B','Ghost inside owner NEST filled hazard but apart from entities; attack; hazard does not forbid construction'),
 ('MOUSE-INVALID','C','Ghost overlaps existing tower; attack; invalid entity distance'),
 ('MOUSE-FUNDS','D','Money8 vs cost20; still starts drag; funds-first rejection; attack'),
 ('MOUSE-CANCEL','E','Mouse released inside whole bar expanded18; cancellation before qualification; no cost; recovery/no hazard'),
 ('MOUSE-INTERRUPT','F specification','Pause/reward interrupt clears drag; F is external legend, not another active snapshot')]]
mapping['buildBarStates']=[dict(board='DUI01',cell=c,description=s,finalCompositeSources=[],review='../../reviews/ui-r02.md') for c,s in [('A','standard left: six full cards + next edge, thumb left'),('B','right end reaches SENTINEL, prior edge, thumb right'),('C','external expanded nine-card review ledger, not extra in-game bar'),('D','960 small desktop left: five full + next edge')]]
mapping['bossStates']=[dict(board='DUI03',cell=c,description=s,finalCompositeSources=[],review='../../reviews/ui-r02.md') for c,s in [('A','compact single HIVE complete member fields'),('B','two independent twin members with shared full counterplay'),('C','960 small desktop twins with full wrapped counterplay')]]
mapping['rewardStates']=[dict(board='DUI03',cell=c,choices=n,description=s,finalCompositeSources=[],sourceDerivedEvidence=rel(ui/'rule-evidence.json'),runtimeSampled=False,review='../../reviews/ui-r02.md') for c,n,s in [('D',1,'actual support-money302, no placeholder'),('E',2,'actual player repair50 + support-money302'),('F',3,'FROST unlock55 + money360 + BASIC future blueprint subsidy5, long detail reflow')]]
mapping['inheritedDesktopFlow']=[]
previous=SCENE/'ui/submissions/r01'
previous_packet=read(previous/'packet.json')
inherited_checks=[]
for p in ('ui02-player-flow.png','production-notes.md','requirements-map.json'):
    expected=next(x['sha256'] for x in previous_packet['files'] if x['path']=='submissions/r01/'+p)
    assert sha(previous/p)==expected
    inherited_checks.append(dict(path=rel(previous/p),sha256=expected,result='match',scope='previous desktop START/GAMEOVER/PAUSE source only, not new formal image'))
for id_,cell,binding in [('START','A','START/UI_COPY/initGame'),('GAMEOVER','B','GAMEOVER/currentWave/time/initGame'),('PAUSE','C','PLAYING && paused && !rewardState.active/togglePause/Esc')]:
    mapping['inheritedDesktopFlow'].append(dict(id=id_,source=rel(previous/'ui02-player-flow.png'),sha256=sha(previous/'ui02-player-flow.png'),cell='UI02 '+cell,scope='desktop cell inherited from previous approved flow; not new optimization image',binding=binding,review='../../reviews/ui-r01.md',formalNewImage=False))
mapping['historyLinks']=[dict(path='../submissions/r01/index.html',role='previous full art gallery, includes old phone; history only',countsAsCurrentEvidence=False,inlineImagesAllowed=False),dict(path='../../master/submissions/r02/index.html',role='mother style history only',countsAsCurrentEvidence=False),dict(path='../../master/submissions/r03/index.html',role='previous RAIL desktop/phone history only, not dense proof',countsAsCurrentEvidence=False)]
mapping['elements']=[e for e in mapping['elements'] if not e['elementId'].startswith('DESKTOP-UI-')]
for eid,label,board,cells,space,layer,ids in [
 ('DESKTOP-UI-BUILD','full-unlocked scroll buildbar','DUI01','A/B/C/D','screen','buildbar', ['BUILD-01','BUILD-02','BUILD-03','BUILD-04']),
 ('DESKTOP-UI-HOVER','existing title content with design anchor','DUI02','A','screen','hover presentation',['MOUSE-01']),
 ('DESKTOP-UI-DRAG','ghost / range / hazard distinction','DUI02','B/C/D/E/F','world','independent drag presentation',['MOUSE-02','MOUSE-03','MOUSE-04']),
 ('DESKTOP-UI-BOSS','compact complete single/twin member HUD','DUI03','A/B/C','screen','Boss HUD',['BOSS-01','BOSS-02','BOSS-03']),
 ('DESKTOP-UI-REWARD','actual 1/2/3 reward choices','DUI03','D/E/F','screen','modal',['REWARD-01','REWARD-02'])]:
    mapping['elements'].append(dict(elementId=eid,label=label,requirementIds=ids,coordinateSpace=space,layer=layer,overallSource=dict(revision='master r02 historical style only',file='../../master/submissions/r02/master-desktop-r02.png',sha256='8e1bf323cefb204a876c4865a0e3daa9236617088ac6522a68fffb83bad58937',locator='style or inherited real-player function; not current final evidence',review='../../reviews/master-r02.md'),detailSources=[dict(revision='ui r02',file=by_id[board]['file'],sha256=by_id[board]['sha256'],locator=board+' '+cells,review='../../reviews/ui-r02.md')],finalCompositeSources=[],dataBindings=[r['binding'] for r in fine if board in r['board']],designValues=[],measuredValues=None,status='detail_accepted_joint_composite_pending'))
mapping['layers']=ui_map['layers']
mapping['geometry']=ui_map['geometry']
mapping['effectiveOverrides']=[o for o in mapping['effectiveOverrides'] if o['id']!='DESKTOP-UI-R02']+[dict(id='DESKTOP-UI-R02',value='New desktop scrolling/density/Boss/reward/interaction art contract supersedes earlier board examples; pale surfaces #4B281C text, mint #A8D8BC resource, sage #B6D4AE. Targets not sampled PNG HEX.',evidence=rel(ui/'production-notes.md'),affectedElements=['DESKTOP-UI-BUILD','DESKTOP-UI-BOSS','DESKTOP-UI-REWARD'])]
if FINAL:
    master=SCENE/'master/submissions/r04'
    state=read(master/'source-derived-states.json')
    final_plates=[p for p in plates if p['owner']=='master']
    mapping['status']='assembled_desktop_sources_approved_delivery_review_pending'
    mapping['finalSnapshots']=state
    mapping['actualCounts']=[dict(id='A',image='DESKTOP-DENSITY',wave=31,enemies=19,enemyBreakdown={'BASIC':12,'TANK':7},placedTowers=10,towerBreakdown={'BASIC':6,'BURST':4},player=1,observedProjectiles=26,projectileBreakdown=state['A']['projectiles'],drops=4,bosses=0,hazards=0),dict(id='B',image='DESKTOP-TWINS',wave=27,ordinaryEnemies=0,placedTowers=8,towerBreakdown={'BASIC':5,'BURST':2,'SENTINEL':1},ghosts=1,ghostIsPlacedTower=False,player=1,observedProjectiles=15,projectileBreakdown=state['B']['projectiles'],drops=0,bossMembers=2,hazards=1)]
    mapping['snapshotUnits']=dict(renderAnchor='image_pixel PNG-position inventory only; not world coordinates or measured logical anchors',hazardCoordinates='source-derived world-coordinate design state; not runtime capture',layout='logical_px design target',runtimeSampled=False)
    mapping['finalStateEvidence']=rel(master/'source-derived-states.json')
    mapping['finalReviewEvidence']='../../reviews/master-r04.md'
    mapping['finalCountInterpretation']='Accepted complementary lawful A/B snapshots, not one impossible battle combining ordinary enemy crowd and Boss skills. No independent elite identity invented; TANK is existing heavy enemy.'
    mapping['layoutTargets'].append(dict(id='DESKTOP-FINAL-B',width=1280,height=720,unit='logical_px',evidenceType='design_proposal',measuredValues=None,runtimeValidated=False))
    canonical=read(SCENE/'master/preparation/desktop-r04-canonical-sources.json')['items']
    for c in canonical:
        assert sha(Path(c['path']))==c['sha256']
        c['path']=rel(Path(c['path']))
        c['actualRole']=('nine-card catalog; body field only BASIC/BURST/SENTINEL' if c['id'].startswith('tower:') else ('shown A/B' if c['id'] in ('hero:PLAYER','enemy:BASIC','enemy:TANK','boss:TWIN_SOL','boss:TWIN_LUNA') else ('historical summon cause only, not visible' if c['id']=='enemy:BEACON' else 'initial planning source only, not visible in final A/B')))
    mapping['finalCanonicalSourceLedger']=canonical
    mapping['sourceProofs']=[dict(id='BEACON-SURVIVAL',evidence=rel(master/'source-derived-states.json'),proof=state['A']['summonHistory'],note='10 wave BASIC + 2 surviving former BEACON summons; BEACON absent; not an invented elite'),dict(id='HP-RECALC',evidence=rel(master/'source-derived-states.json'),proof='BASIC Lv0/1/2 maxHP50/58/67; A27/67,38/58,38/58; B37/67,32/58; SENTINEL69/125; old CANNON51/93 invalid for replaced BASIC'),dict(id='PROJECTILE-AGE',evidence=rel(master/'review-notes.md'),proof='26 A / 15 B observed; mixed-age allowed; left B BURST5 includes possible prior survivor, not five-shot emission or synchronized first volley')]
    for e in mapping['elements']:
        if e['elementId']=='DESKTOP-UI-REWARD': applicable=[];reason='No reward modal active in chosen A/B; actual1/2/3 states covered by DUI03 D/E/F.'
        elif e['elementId']=='DESKTOP-UI-HOVER': applicable=['DESKTOP-DENSITY'];reason='A SNIPER hover content; title anchor remains design target.'
        elif e['elementId']=='DESKTOP-UI-DRAG': applicable=['DESKTOP-TWINS'];reason='B insufficient SENTINEL independent ghost; not a placed tower; right range edge viewport-clipped.'
        elif e['elementId']=='DESKTOP-UI-BOSS': applicable=['DESKTOP-TWINS'];reason='B full twin group + separate members; A ordinary clear has no Boss.'
        else: applicable=[p['id'] for p in final_plates];reason='Both approved desktop compositions retain accepted fine-source semantics.'
        e['finalCompositeSources']=[dict(file=p['file'],sha256=p['sha256'],review=p['review'],locator='A '+reason if p['id']=='DESKTOP-DENSITY' else 'B '+reason,appearance='shown' if p['id'] in applicable else 'not_active_in_selected_snapshot',evidence=rel(master/'review-notes.md'),measuredLogicalBounds=None) for p in final_plates]
        e['status']='approved_source_chain_recorded_delivery_review_pending'
    for category in ('mouseStates','buildBarStates','bossStates','rewardStates'):
        for s in mapping[category]:
            s['finalCompositeSources']=[dict(file=p['file'],sha256=p['sha256'],review=p['review'],relation='A hover/start segment; B insufficient drag/end segment/twins; other mutually exclusive states remain DUI02/DUI03 specification evidence') for p in final_plates]
    mapping['worldLayers']=[dict(elementId=i,coordinateSpace='world',layer=layer,source=rel(master/'source-derived-states.json'),review='../../reviews/master-r04.md',semantic=semantic) for i,layer,semantic in [('WORLD-BODIES','independent bodies','actual A/B rosters; canonical sources control bodies'),('WORLD-SHADOWS','root shadows','entity-owned, separate from BG notched wash'),('WORLD-HP-LEVEL','world-linked UI','actual identity/level HP recomputation, external badges'),('WORLD-PROJECTILES','independent projectiles','observed26/15 mixed-age, not volley count'),('WORLD-DROPS','independent state.drops','A4 / B0, diamonds; mint target overrides cyan raster'),('WORLD-HAZARD','owner-bound area','B single lunarSnare ownerMoon; enemy disk wholly visible; no A hazard'),('WORLD-GHOST-RANGE','independent placement','B SENTINEL ghost is not placed; funds18<69; range right clipped')]]
    mapping['effectiveOverrides'] += [dict(id='DESKTOP-FINAL-DATA',value='r04 actual roster/catalog/HP/source contract supersedes initial22enemies/13towers/23bullet planning and replaced-CANNON HP; UI fine-board values are separate examples, not fixed live values',evidence=rel(master/'source-derived-states.json'),affectedElements=['DESKTOP-UI-BUILD','WORLD-HP-LEVEL','WORLD-BODIES']),dict(id='DESKTOP-MINT-TARGET',value='Final resource raster skews cyan; formal production remains mint #A8D8BC/dark green edge. Do not claim exact PNG HEX.',evidence='../../reviews/master-r04.md',affectedElements=['WORLD-DROPS','DESKTOP-UI-BUILD'])]
write('source-alignment.json',mapping)

associations={
 'BUILD-01':['CARD-ORDER','SCROLL-START','SCROLL-END'], 'BUILD-02':['CARD-PRIMARY','CARD-LEVELS','CARD-LOW-FUNDS','CARD-NAME-WRAP'],
 'BUILD-03':['SCROLL-MOUSE','SCROLL-SMALL'], 'BUILD-04':['SCROLL-START','SCROLL-SMALL','COMPOSITE-DEPENDENCY'],
 'MOUSE-01':['HOVER-CONTENT','HOVER-LAYER'], 'MOUSE-02':['DRAG-START','DRAG-VALID','WORLD-SEMANTICS'],
 'MOUSE-03':['DRAG-INVALID','DRAG-FUNDS','DRAG-COMMIT'], 'MOUSE-04':['DRAG-CANCEL','DRAG-INTERRUPT'],
 'BOSS-01':['BOSS-SINGLE','BOSS-SMALL-DESKTOP'], 'BOSS-02':['BOSS-TWIN-SOL','BOSS-TWIN-LUNA','BOSS-LONG-COUNTERPLAY'], 'BOSS-03':['BOSS-SINGLE','BOSS-SMALL-DESKTOP'],
 'REWARD-01':['REWARD-FUTURE','REWARD-LONG-TEXT','REWARD-CLICK'], 'REWARD-02':['REWARD-ONE','REWARD-TWO','REWARD-THREE','REWARD-OVERFLOW'],
 'LAY-01':['SCROLL-SMALL','BOSS-SMALL-DESKTOP','DESKTOP-SCOPE'], 'LAY-02':['TYPE-COLOR','HOVER-LAYER','REWARD-OVERFLOW'],
 'MAP-02':['BACKGROUND-AUTHORITY','TYPE-COLOR','CANONICAL-PLAYER-BOSS'], 'SCOPE-01':['DESKTOP-SCOPE']}
for r in requirements['requirements']:
    if r['id'] in associations:
        r['fineRequirementIds']=associations[r['id']]
        r['evidence']=[rel(ui/'requirements-map.json'),rel(ui/'production-notes.md')]+list(dict.fromkeys(by_id[f['board']]['file'] for f in fine if f['id'] in associations[r['id']] and f['board'] in by_id))
        r['reviewEvidence']=['../../reviews/ui-r02.md']
        r['status']='UI_detail_accepted_joint_evidence_pending' if r['id'] in ('BUILD-01','BUILD-04','MOUSE-01','MOUSE-02','MOUSE-03','BOSS-01','MAP-02') else 'UI_art_scope_closed_by_primary'
        r['closedByPrimary']=r['status']=='UI_art_scope_closed_by_primary'
        r['closureRevision']='ui r02' if r['closedByPrimary'] else None
    if r['id'] in ('MAP-01','ART-01','AUD-01','AUD-02','AUD-03','AUD-04'):
        r['status']='draft_audit_recorded_final_joint_and_delivery_review_pending'
        r['evidence']=['source-alignment.json','queue.json','source-audit.json','link-audit.json']
requirements['status']='desktop_draft_30_requirements_joint_and_delivery_review_pending'
if FINAL:
    for r in requirements['requirements']:
        if r['id'] in ('DENS-01','DENS-02','DENS-03','BUILD-01','BUILD-04','MOUSE-01','MOUSE-02','MOUSE-03','BOSS-01','BOSS-03','SEP-01','SEP-02','BG-02','MAP-01','MAP-02'):
            r['evidence']=list(dict.fromkeys(r['evidence']+[rel(master/'master-desktop-density-r04.png'),rel(master/'master-desktop-twins-r04.png'),rel(master/'source-derived-states.json'),rel(master/'review-notes.md'),'source-alignment.json']))
            r['reviewEvidence']=list(dict.fromkeys(r['reviewEvidence']+['../../reviews/master-r04.md']))
            r['status']='closed_in_primary_desktop_joint_art_scope_delivery_synthesis_pending'
            r['closedByPrimary']=True;r['closureRevision']='master r04'
        if r['id']=='DENS-02': r['acceptanceScope']='A enemy crowd/HP/projectiles and B lawful twins/hazard/ghost are complementary approved snapshots; TANK is existing heavy identity, no invented elite or impossible crowd/Boss combination.'
        if r['id'] in ('ART-01','AUD-01','AUD-02','AUD-03','AUD-04'):
            r['status']='assembled_audit_evidence_awaiting_primary_delivery_review'
            r['closedByPrimary']=False
    requirements['status']='assembled_30_desktop_requirements_awaiting_primary_delivery_review'
write('requirements.json',requirements)
open_lines=['# 电脑端待关闭项','','UI r02及BG r02细化均主审通过；最终高密度联合复合与delivery总册仍待主审。手机暂缓不阻塞。','','|ID|优先级|状态|要求|','|---|---|---|---|']
open_lines += [f'|{r["id"]}|{r["priority"]}|{r["status"]}|{r["requirement"]}|' for r in requirements['requirements']]
(ROOT/'open-items.md').write_text('\n'.join(open_lines)+'\n',encoding='utf-8')
write('source-audit.json',dict(status='assembled_integrity_only_not_art_approval' if FINAL else 'draft_integrity_only',packetFiles=files,sourceFingerprints=sources,fixedSourceMatches=sum(s['result']=='match' for s in sources),historicalMutableReadySnapshots=[s for s in sources if s['result']=='historical_mutable_READY_snapshot'],inheritedDesktopFlowChecks=inherited_checks,sourceErrors=[]))
manifest=dict(status='assembled_for_primary_review' if FINAL else 'draft_not_submitted',scope='desktop_only',expectedNewFormalImages=7,currentApprovedImages=len(plates),images=plates,awaitingMasterImages=[] if FINAL else [dict(owner='master',revision='r04',role='two final desktop joint compositions',status='awaiting_primary_review')],historicalDesktopFlow=mapping['inheritedDesktopFlow'],phone='history_links_only_not_current_evidence',excluded='all candidates/rejected branches/old mother and RAIL images; no inherited phone image in formal list')
write('gallery-manifest.json',manifest)

parts=['<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GeoGuard 电脑端原画 r02 · 草案</title><style>body{margin:0;background:#fff9ef;color:#4b281c;font:16px/1.6 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:32px 24px}a{color:#315b42}nav{display:flex;gap:18px;flex-wrap:wrap}article,section{margin:32px 0}img{display:block;width:100%;height:auto;border:1px solid #cbb6a0;border-radius:12px}table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:10px;border-bottom:1px solid #d8c7b4;text-align:left;vertical-align:top}.notice{padding:18px;border:1px solid #b89f86;border-radius:12px}.scroll{overflow:auto}code{font-size:12px;overflow-wrap:anywhere}</style><main><h1>GeoGuard 电脑端背景与玩家 UI</h1><p>2026-10-02 · delivery r02图册草案 · 纯桌面原画</p><div class="notice">本轮目标7张新正式图：BG2＋UI3＋master最终2。目前5张细化板已主审批准，master r04两图等待；未封包、未发布新READY。手机暂缓，仅历史链接，不作本轮通过证据。</div><nav><a href="#gallery">正式细化板</a><a href="#diff">原画与现行功能</a><a href="#mapping">来源与状态</a><a href="#requirements">30项验收</a><a href="#fine">48项UI图格</a><a href="#audit">审计</a></nav><section id="gallery"><h2>本轮正式桌面细化板</h2>']
titles={'BG01-r02':'BG01 r02 · 稀疏缺口斑干净背景','BG02-r02':'BG02 r02 · 世界延展、地面与阴影归属','DUI01':'DUI01 · 九塔与标准／小窗横滚底栏','DUI02':'DUI02 · 鼠标五快照与拖放语义','DUI03':'DUI03 · 紧凑Boss与实际1／2／3奖励','DESKTOP-DENSITY':'最终联合A · 波31高密度普通清场','DESKTOP-TWINS':'最终联合B · 波27双成员与低资金拖建'}
for p in plates:
    title=titles[p['id']]
    note=('地面是非交互world装饰，说明框/箭头不进游戏；UI背景只是上下文。' if p['owner']=='background' else ('主审已批准最终联合构成；实际计数、真实状态与颜色/裁剪/弹龄边界见下文。' if p['owner']=='master' else '最终图路径与SHA已核验；hover锚点和持续拖放章属于表现设计；不声称代码已实现。'))
    parts.append(f'<article><h3>{esc(title)}</h3><a href="{esc(p["file"])}"><img src="{esc(p["file"])}" loading="lazy" alt="{esc(title)}"></a><p>{note}</p><p>PNG {p["imagePixels"]["width"]}×{p["imagePixels"]["height"]} image_pixel · {link(p["review"],"主审批准")}</p><code>SHA256 {p["sha256"]}</code></article>')
parts.append('<p>master r04最终两幅桌面联合复合尚未批准，此处不引用制作候选。UI完整鼠标快照通过不代替高密度联合验收；DUI02 B底栏附近危险边界仍待最终复合检查。</p></section><section id="diff"><h2>原画设计与现行功能差异</h2><table><tr><th>项</th><th>现行功能</th><th>原画目标及边界</th></tr>')
for d in mapping['functionalDifferences']: parts.append(f'<tr><td>{esc(d["id"])}</td><td>{esc(d["existing"])}</td><td>{esc(d["design"])}<br>{link(d["evidence"],"规格依据")}</td></tr>')
parts.append('</table><p>1440×900标准与960×720小窗为logical_px设计目标，非设备截图。卡宽140/gap8/bar min(92vw,920px)/bottom24、Boss目标底边≤180均为设计值；长文允许增高不能删字段。现有纯规则例值不是实际整局历程或随机/设备验证。</p></section><section id="mapping"><h2>整体 → UI／BG精细板 → 最终复合</h2><table><tr><th>元素</th><th>空间／层</th><th>精细板格</th><th>最终来源</th></tr>')
for e in mapping['elements']:
    final_refs='<br>'.join(link(c['file'],c['appearance']+' · '+c['locator']) for c in e['finalCompositeSources']) if FINAL else '等待master r04获批，旧母稿仅风格追溯'
    parts.append(f'<tr><td>{esc(e["elementId"])}</td><td>{esc(e["coordinateSpace"])} / {esc(e["layer"])}</td><td>'+ '<br>'.join(link(d['file'],d['locator']) for d in e['detailSources'])+f'</td><td>{final_refs}</td></tr>')
parts.append('</table><p>'+link('source-alignment.json','完整来源、层、状态与单位索引')+'</p><h3>鼠标互斥时序快照</h3><table><tr><th>状态／格</th><th>真实语义与表现边界</th></tr>')
for s in mapping['mouseStates']: parts.append(f'<tr><td>{esc(s["id"])} / {esc(s["cell"])}</td><td>{esc(s["meaning"])}</td></tr>')
parts.append('</table><h3>继承的桌面开始／结束／暂停</h3><p>沿UI r01已批桌面格继承，属于既有流程语义，无新绘制；不列本轮7张新图，不引用手机格。</p><ul>')
for s in mapping['inheritedDesktopFlow']: parts.append(f'<li>{esc(s["id"])} · {link(s["source"],s["cell"])} · {link(s["review"],"既有主审")}</li>')
parts.append('</ul></section><section id="requirements"><h2>30项桌面可用性关闭索引</h2><table><tr><th>ID／要求</th><th>证据状态</th><th>链接</th></tr>')
for r in requirements['requirements']: parts.append(f'<tr><td>{esc(r["id"])}<br>{esc(r["requirement"])}</td><td>{esc(r["status"])}</td><td>'+' · '.join(link(p) for p in r['evidence']+r['reviewEvidence'])+'</td></tr>')
parts.append('</table></section><section id="fine"><h2>48项桌面UI逐格与动态字段</h2><table><tr><th>要求</th><th>板格</th><th>绑定与证据类别</th></tr>')
for r in fine: parts.append(f'<tr><td>{esc(r["id"])}<br>{esc(r["requirement"])}</td><td>{esc(r["board"])} {esc(r["cells"])}</td><td>{esc(r["binding"])}<br>{esc(r["evidenceKind"])}</td></tr>')
parts.append('</table><p>9塔精确NEUTRAL来源仍由既有身体源格控制，图板缩略图不能代替canonical身体或透明资源。'+link(rel(ui/'tower-icon-sources.json'),'九塔来源账本')+'</p></section><section id="audit"><h2>审批、指纹及退回闭环</h2><p>BG r02两图、UI r02三图均主审accepted。DUI02根目录曾留edit2候选，已按主审复看edit4选稿关闭；本册只引用正式dui02-mouse-states.png和其封包SHA。历史pending字段不改写。</p><p>'+link('queue.json','持久验收队列')+' · '+link('source-audit.json','封包／来源SHA')+' · '+link('link-audit.json','本地引用审计')+' · '+link('gallery-manifest.json','正式桌面图列表')+' · '+link('requirements.json','30项机器索引')+'</p><p>历史参考：'+link('../submissions/r01/index.html','上一轮全图册含手机，仅历史')+' · '+link('../../master/submissions/r02/index.html','旧母稿仅追溯')+' · '+link('../../master/submissions/r03/index.html','旧RAIL与手机，仅追溯')+'</p><div class="notice">原画与规格仍不代表透明生产素材、分层源稿、动画／图集、代码接入或部署。逻辑字号、对比、鼠标事件、运行遮挡、DPR／窗口安全区与设备性能未实测。delivery草案不自审通过；最终master通过及主审授权后再封新包。</div></section></main></html>')
markup=''.join(parts)
if FINAL:
    markup=markup.replace('GeoGuard 电脑端原画 r02 · 草案','GeoGuard 电脑端原画 r02 · 送审')
    markup=markup.replace('本轮正式桌面细化板','本轮7张正式桌面原画')
    markup=markup.replace('30项桌面可用性关闭索引','30项桌面可用性验收索引')
    markup=markup.replace('<a href="#diff">','<a href="#actual">实际计数</a><a href="#diff">')
    markup=markup.replace('delivery r02图册草案 · 纯桌面原画','delivery r02总图册 · 纯桌面原画 · 等待主审')
    markup=markup.replace('本轮目标7张新正式图：BG2＋UI3＋master最终2。目前5张细化板已主审批准，master r04两图等待；未封包、未发布新READY。','本轮完整7张新正式图：BG2＋UI3＋master最终2。上游三组均已主审通过；本delivery总包仍待主审，不自行批准。')
    markup=markup.replace('master r04最终两幅桌面联合复合尚未批准，此处不引用制作候选。UI完整鼠标快照通过不代替高密度联合验收；DUI02 B底栏附近危险边界仍待最终复合检查。','master r04两幅最终联合原画已经主审通过。A/B采用不同且合法的互补状态，不在同一战斗中拼入普通怪群与不可能共存的Boss技能。B月危边界完整；SENTINEL幽灵射程右侧被视口裁切，未宣称全部射程完整。')
    markup=markup.replace('delivery草案不自审通过；最终master通过及主审授权后再封新包。','delivery r02只标submitted，等待主审独立验收；所有上游批准及完整性检查不代替总包批准。')
    counts='<section id="actual"><h2>实际计数、源合同与限制</h2><table><tr><th>最终图</th><th>实际可辨成员</th><th>状态与交互</th></tr><tr><td>A · 波31<br>1440×900 logical_px目标</td><td>19敌：12 BASIC／7 TANK；10塔：6 BASIC／4 BURST；PLAYER1；26独立飞行弹：基本球9／BURST椭圆16／蜂蜜1；菱形资源4；无Boss／敌危区。</td><td>首段六完整卡＋RAIL露边，水平滑块；穿透塔已有title内容悬停；受伤塔HP／等级独立。BASIC额外2只来自已死亡BEACON历史召唤幸存，不虚构精英。</td></tr><tr><td>B · 波27<br>1280×720 logical_px目标</td><td>8实塔：5 BASIC／2 BURST／1 SENTINEL；另1 SENTINEL ghost不计实塔；双子2成员；PLAYER1；15可辨飞行弹；无普通怪／资源；1 lunarSnare月盘。</td><td>曜子准备／蚀子攻击、独立HP／阶段／动作及共同对策；money18&lt;cost69可起拖；末段六全卡＋前卡露边。敌月边界完整，ghost射程右侧被视口裁切。</td></tr></table><p>原22敌／13塔／23弹计划已经获准收敛；计数按最终图登记。飞行弹混合寿命，B左BURST5枚含可能上一轮幸存，不表示一轮发5弹或同步第一轮快照；没有完整飞行轨迹、经济可达性或实机运行验证。</p><p>BASIC maxHP按实际等级重算为50／58／67：A受伤27/67、38/58、38/58；B37/67、32/58，SENTINEL69/125。替换前CANNON51/93不能套用。PNG位置锚只作image_pixel图上定位，不是world坐标／逻辑布局量测。</p><p>最终资源像素偏cyan，正式生产仍按mint #A8D8BC深绿边、浅底深字#4B281C及canonical身体。DUI01例值与r04动态目录分别记录，不把FROST55等例值固定为所有等级费用。</p><p>'+link('../../master/submissions/r04/source-derived-states.json','实际状态与BEACON／HP来源证明')+' · '+link('../../master/submissions/r04/review-notes.md','采用关系及限制')+' · '+link('../../reviews/master-r04.md','主审最终联合验收')+'</p><h3>世界层归属</h3><table><tr><th>元素／层</th><th>真实来源语义</th></tr>'
    counts+=''.join(f'<tr><td>{esc(e["elementId"])} / {esc(e["layer"])}</td><td>{esc(e["semantic"])}</td></tr>' for e in mapping['worldLayers'])
    counts+='</table></section>'
    markup=markup.replace('<section id="diff">',counts+'<section id="diff">')
    source_note='<p>来源审计明确区分：BG10＋UI43＋master54＝107条固定来源指纹匹配。master另1条READY为发布前历史队列快照，现值随r04原子发布变化；旧hash与当前hash均保留，按主审说明列为historical mutable READY，不当作不可变美术来源或素材缺失。</p>'
    markup=markup.replace('<section id="audit"><h2>审批、指纹及退回闭环</h2>','<section id="audit"><h2>审批、指纹及退回闭环</h2>'+source_note)
(ROOT/'index.html').write_text(markup,encoding='utf-8')
write('link-audit.json',dict(status='draft',missing=[],entries=[]))
checks=upstream_links[:]
markup=(ROOT/'index.html').read_text(encoding='utf-8')
for ref in re.findall(r'(?:href|src)="([^"]+)"',markup):
    value=html.unescape(ref)
    if value.startswith('#'): exists=f'id="{value[1:]}"' in markup;target=ROOT/'index.html'
    else: target=ROOT/value;exists=target.exists()
    checks.append(dict(source='index.html',reference=value,target=rel(target),exists=exists))
for r in requirements['requirements']:
    for ref in r['evidence']+r['reviewEvidence']: checks.append(dict(source='requirements.json',reference=ref,target=ref,exists=(ROOT/ref).exists()))
missing=[r for r in checks if not r['exists']]
write('link-audit.json',dict(status='draft',checked=len(checks),missing=missing,entries=checks))
assert not missing,missing
assert len(plates)==(7 if FINAL else 5) and len({p['file'] for p in plates})==len(plates)
assert len(requirements['requirements'])==30
assert sha(DELIVERY/'READY.json')==baseline['deliveryREADYSha256']
print(json.dumps(dict(status='desktop_assembled_for_primary_review' if FINAL else 'desktop_draft_not_submitted',formalNewImages=len(plates),expectedNewImages=7,requirements=30,UIFineRequirements=48,packetFiles=len(files),sourceFingerprintEntries=len(sources),fixedSourceMatches=sum(s['result']=='match' for s in sources),historicalMutableREADY=sum(s['result']=='historical_mutable_READY_snapshot' for s in sources),localReferences=len(checks),missingLinks=0,deliveryREADY='unchanged_r01'),ensure_ascii=False))
