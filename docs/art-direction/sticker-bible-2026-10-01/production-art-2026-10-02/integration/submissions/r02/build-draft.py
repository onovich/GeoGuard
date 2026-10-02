"""Prepare an unsealed r02 draft. Never publish packet.json or READY.json."""
from pathlib import Path
from html import escape as E
import json, hashlib, re, os, collections

OUT = Path(__file__).resolve().parent
BASE = OUT.parents[2]
assert BASE.name == 'production-art-2026-10-02'
assert not (OUT / 'packet.json').exists(), 'sealed revision must not change'
versions = {'friendly': 'r03', 'enemies': 'r02', 'bosses-mechanics': 'r03'}
snapshot = {}
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):
    snapshot[p.relative_to(BASE.parent).as_posix()] = sha(p)
    return p.read_text(encoding='utf-8-sig')
def load(p): return json.loads(read(p))
def rel(p): return Path(os.path.relpath(p, OUT)).as_posix()
def dump(n, d): (OUT / n).write_text(json.dumps(d, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
def write(n, s): (OUT / n).write_text(s, encoding='utf-8')
def norm(k): return k if '/' in k else '/'.join(k.rsplit(':', 1))
def a(p, text): return f'<a href="{E(p, quote=True)}">{E(str(text))}</a>'
lock = load(BASE.parent / 'action-consistency/anatomy-lock.json')
expected = {x['key']+'/'+y['action'] for x in lock['items'] for y in x['actions']}
read(BASE / 'coordination.md')
read(BASE.parent / 'art-replacement-plan.md')
registry = load(BASE / 'session-registry.json')
reviews, packets, file_hashes = {}, {}, {}
for owner, revisions in [('friendly',['r01','r02','r03']),('enemies',['r01','r02']),('bosses-mechanics',['r01','r02','r03']),('effects-ui',['r01'])]:
    for rev in revisions:
        review_path = BASE / 'reviews' / f'{owner}-{rev}.md'
        text = read(review_path)
        # Later formal review titles use "# owner revision — accepted".
        result = 'changes_requested' if 'changes_requested' in text else ('accepted' if 'accepted' in text else 'unparsed')
        reviews[(owner,rev)] = {'path': rel(review_path), 'result': result}
        packet = load(BASE / owner / 'submissions' / rev / 'packet.json')
        packets[(owner,rev)] = packet
        for f in packet['files']:
            p = BASE / owner / f['path']
            assert p.is_file() and sha(p) == f['sha256'], (owner, rev, f['path'])
            file_hashes[(owner, f['path'])] = f['sha256']
for owner, rev in versions.items(): assert reviews[(owner,rev)]['result'] == 'accepted'
data = {o: load(BASE/o/'submissions'/r/'production-split.json') for o,r in versions.items()}
enemy_sources = load(BASE/'enemies/submissions/r02/action-sources.json')
enemy_by_key = {norm(x['key']): x for x in enemy_sources['actions']}
enemy_index = load(BASE/'enemies/submissions/r02/final-index.json')
friendly_reuse = read(BASE/'friendly/submissions/r03/reuse-design.md')
rows, gallery = [], {}
def resolve(owner, ref):
    path = ref.get('path') or ref.get('file')
    assert path and path.startswith('submissions/'), (owner, ref)
    p = BASE/owner/path
    assert p.is_file() and (owner,path) in file_hashes, (owner,path)
    if 'fileSha256' in ref: assert ref['fileSha256'] == sha(p), path
    row, col = ref.get('row'), ref.get('column')
    label = ref.get('cell') or ref.get('label') or ref.get('state')
    assert row is not None and isinstance(col,int) and col >= 1 and label, ref
    revision = Path(path).parts[1]
    image_review = reviews[(owner,revision)]
    if image_review['result'] == 'changes_requested':
        assert owner == 'friendly' and revision == 'r02'
        approval_scope = 'four body boards accepted; direction changes resolved in r03'
    else: approval_scope = 'accepted original art reference'
    gkey = owner+'/'+path
    gallery.setdefault(gkey, {'owner':owner,'sourcePath':path,'path':rel(p),'sha256':sha(p),
                              'role':'body_specification','imageReview':image_review['path'],
                              'mappingReview':reviews[(owner,versions[owner])]['path'],
                              'approvalScope':approval_scope,'identities':[]})
    return {'path':rel(p),'ownerRelativePath':path,'row':row,'column':col,'label':label,
            'sha256':sha(p),'reviewEvidence':image_review['path'],
            'accuracy':'concept cell locator; not a pixel extraction rectangle or exported animation frame'}
for owner, rev in versions.items():
    entries = data[owner]['items'] if owner == 'friendly' else data[owner]['actions']
    for idx, x in enumerate(entries):
        key = x['key']+'/'+x['action'] if owner == 'friendly' else norm(x['key'])
        identity, action = key.rsplit('/',1)
        transforms, overlay, construction = None, None, None
        if owner == 'friendly':
            br = x['bodyReference']; sources = [resolve(owner, br)]
            transforms, overlay = br.get('transform'), br.get('levelOverlay')
            mode = 'direction_construction' if action.startswith('DIR_') else ('body_plus_external_level_badge' if overlay else ('direct_concept_cell' if action == br['cell'] else 'explicit_body_pose_reuse'))
            if transforms:
                guide = transforms.get('approvedUpConstruction') or transforms.get('approvedDirectionGuide')
                if guide:
                    construction = {'sourcePath':guide['path'],'role':'construction_and_occlusion_reference_only; never final body gallery'}
        elif owner == 'enemies':
            mapping = enemy_by_key[key]
            assert x['bodySources'] == mapping['bodySources']
            sources = [resolve(owner,ref) for ref in mapping['bodySources']]
            mode = mapping['finalMappingMode']
        else:
            ref = x['productionBodySource']
            assert x['body']['poseReference'] == ref
            sources = [resolve(owner,ref)]
            mode = 'direct_concept_cell' if action == ref['state'] else 'explicit_body_pose_reuse'
        for s in sources:
            g = gallery[owner+'/'+s['ownerRelativePath']]
            if identity not in g['identities']: g['identities'].append(identity)
        rows.append({'key':key,'identity':identity,'action':action,'owner':owner,'revision':rev,
                     'specPage':rel(BASE/owner/'submissions'/rev/'index.html'),
                     'sourceJSON':rel(BASE/owner/'submissions'/rev/'production-split.json'),
                     'sourcePointer':f"/{'items' if owner == 'friendly' else 'actions'}/{idx}",
                     'bodySources':sources,'mappingMode':mode,'transform':transforms,'levelOverlay':overlay,
                     'constructionReference':construction,'review':'accepted_original_art_stage',
                     'reviewEvidence':reviews[(owner,rev)]['path'],'anchorStatus':'proposed_not_measured',
                     'continuousResources':'not_produced_or_validated','contract':x})
assert len(rows)==375 and {x['key'] for x in rows}==expected
assert len({x['identity'] for x in rows})==48
# Supplemental split diagram is distinct from SHARD/SPLINTER body sources.
owner='enemies'; path='submissions/r01/images/shard-splinter-separate.png'; p=BASE/owner/path
assert (owner,path) in file_hashes and sha(p)==file_hashes[(owner,path)]
gallery[owner+'/'+path]={'owner':owner,'sourcePath':path,'path':rel(p),'sha256':sha(p),
                       'role':'independent_entity_relationship_supplement',
                       'imageReview':reviews[(owner,'r01')]['path'],'mappingReview':reviews[(owner,'r02')]['path'],
                       'approvalScope':'accepted relationship design; not body animation source',
                       'identities':['enemy:SHARD','enemy:SPLINTER']}
assert len(gallery)==29, len(gallery)
assert collections.Counter(g['owner'] for g in gallery.values()) == {'friendly':7,'enemies':9,'bosses-mechanics':13}
audit=[]
for owner in ['friendly','enemies','bosses-mechanics','effects-ui','integration']:
    ready=load(BASE/owner/'READY.json'); r=ready['revision']; rp=BASE/'reviews'/f'{owner}-{r}.md'
    packet_path=BASE/owner/ready['packetPath']; result='awaiting_primary_review'
    if rp.exists():
        txt=read(rp);result='changes_requested' if 'changes_requested' in txt else ('accepted' if 'accepted' in txt else 'unparsed')
    for packet_file in sorted((BASE/owner/'submissions').glob('r*/packet.json')):
        rr=packet_file.parent.name; rrpath=BASE/'reviews'/f'{owner}-{rr}.md'
        pp=load(packet_file); failures=[]
        for ff in pp['files']:
            fp=BASE/owner/ff['path']
            if not fp.is_file() or sha(fp)!=ff['sha256']:failures.append(ff['path'])
        assert not failures,(owner,rr,failures)
        audit.append({'owner':owner,'revision':rr,'isCurrentREADY':rr==r,
                      'packet':rel(packet_file),'packetIntegrity':'verified',
                      'review':rel(rrpath) if rrpath.exists() else None,
                      'result':('changes_requested' if 'changes_requested' in read(rrpath) else 'accepted') if rrpath.exists() else 'awaiting_primary_review'})
    assert packet_path.is_file(), owner
mapping_counts=dict(collections.Counter(x['mappingMode'] for x in rows))
coverage={'revision':'r02','status':'draft_awaiting_effects_ui','actions':375,'identities':48,
          'identityGroups':dict(collections.Counter(x['group'] for x in lock['items'])),
          'bodyMappingReview':'accepted_original_art_stage','missing':[],'unexpected':[],'duplicates':[],
          'bodyAndRelationshipSheets':29,'bodySheets':28,'relationshipSupplements':1,
          'mappingModes':mapping_counts,'versions':versions,
          'effectsUI':{'revision':'r02','status':'awaiting_dependency','primaryReviewRequired':True},
          'runtimeSkills':95,'supportedSourceHandlers':100,'newEliteIdentities':0,
          'continuousAnimation':'not_produced_or_validated','anchors':'proposed_not_measured',
          'packetPublished':False,'READYPublished':False}
dump('coverage.json',coverage)
draft={'revision':'r02','status':'draft_awaiting_effects_ui','actions':rows,'gallery':list(gallery.values()),
       'identities':lock['items'],'effectsUI':coverage['effectsUI'],
       'approvalAuthority':'Primary reviews override stale producer pending/submitted metadata. Art-stage approval only.'}
dump('production-map.json',draft)
dump('queue-audit.json',{'revision':'r02','status':'draft_snapshot','sealedPackets':audit,
                        'unreviewed':[x for x in audit if x['result']=='awaiting_primary_review'],
                        'integration':'r01 accepted; r02 unsealed and unpublished'})
dump('source-snapshot.json',{'sha256':snapshot,'note':'Draft snapshot; refresh at final effects approval before sealing'})
write('coverage.md','# r02覆盖核查草稿\n\n三组最终身体映射accepted：friendly r03=106；enemies r02=77；bosses-mechanics r03=192。375逐key匹配解剖锁，48身份，无新增精英。\n\n'
      '逐项解析bodyReference/bodySources/productionBodySource，核文件SHA、非空行号或行说明、列号与格标签，保留来源JSON pointer。28张身体板＋1张独立实体关系补充板=29张；7＋9＋13分组。\n\n'
      '概念关键格：命名格仅是静态原画参考，不是像素裁切矩形。明确复用：同身体姿态、MOVE序列、外置等级徽、阶段/技能共享均保存具体源格。方向构造：LEFT全局部rig绕root镜像；RIGHT默认；UP按旧获批构造处理投影遮挡，旧图不作为新身体来源或默认展示。\n\n'
      '375参考条目不等于375独立动画。连续透明sprite、可编辑源稿/图集、逐帧固定root、实测挂点、动画/设备/实机性能尚未生产验证。主审批准仅本轮原画与拆分设计。\n\n'
      'effects-ui r02：awaiting_dependency。95实际技能与100支持handler仍采用r01范围依据，待最终封包补齐具体效果板/格与UI。本草稿无packet、未更新READY，不能称本轮全交付。\n')
write('production-map.md','# r02身体最终来源草稿\n\n[图册](index.html) · [完整375项契约](production-map.json)。effects-ui仍pending。\n\n'
      '|动作|组/版本|具体源格|类型|\n|---|---|---|---|\n'+''.join(
          f"|{x['key']}|{x['owner']} {x['revision']}|"+'；'.join(f"[{s['label']}]({s['path']}) 行{s['row']}列{s['column']}" for s in x['bodySources'])+f"|{x['mappingMode']}|\n" for x in rows))
write('queue-audit.md','# r02通信队列草稿快照\n\n每个已封packet核SHA，逐revision查询主审记录。r02 integration本身未封、无READY，等待effects-ui主审。\n\n'
      '|组|版本|当前READY|主审结果|证据|\n|---|---|---|---|---|\n'+''.join(
          f"|{x['owner']}|{x['revision']}|{x['isCurrentREADY']}|{x['result']}|"+(f"[review]({x['review']})" if x['review'] else 'pending')+'|\n' for x in audit))
write('stage-summary.md','# r02阶段草稿\n\n身体/机关48身份375参考条目已由主审最终验收，本汇总逐文件与行格核验；29张身体/关系板仅展示已批规范。effects-ui r02仍待最终B07与封包、主审验收。\n\n'
      '不发布packet/READY。收到最终效果批准后补资源/95技能映射、最终规范入口、刷新通信队列审计再封存。\n\n'
      '仅美术原画和生产拆分；proposed挂点不代表已测透明sprite、连续动画或实机验证；不改游戏代码、不提交部署。\n')
style='body{margin:0;background:#fff9eb;color:#43382e;font:16px/1.7 system-ui,sans-serif}main{max-width:1220px;margin:auto;padding:28px}a{color:#326655}.notice{border:2px solid #a77850;padding:16px;border-radius:12px}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px}figure{margin:0;background:white;padding:12px;border:1px solid #ded1bc;border-radius:12px}img{width:100%;height:auto}table{border-collapse:collapse;width:100%;background:white}td,th{padding:9px;border:1px solid #ded1bc;text-align:left;vertical-align:top}.scroll{overflow:auto}input,select{font:inherit;padding:8px;margin:12px}details{font-size:14px}pre{white-space:pre-wrap;overflow-wrap:anywhere}'
cards=''.join('<figure>'+a(g['path'],Path(g['path']).name)+f'<img loading="lazy" src="{E(g["path"],quote=True)}" alt="{E(" / ".join(g["identities"]))}"><figcaption>'+E(' / '.join(g['identities']))+'<br>'+E(g['role'])+' · '+a(g['imageReview'],'图审')+' · '+a(g['mappingReview'],'最终映射审查')+'</figcaption></figure>' for g in gallery.values())
table=''
for x in rows:
    sr='<br>'.join(a(s['path'],f"行{s['row']} 列{s['column']} · {s['label']}") for s in x['bodySources'])
    detail={'mode':x['mappingMode'],'transform':x['transform'],'levelOverlay':x['levelOverlay'],'construction':x['constructionReference'],'pointer':x['sourcePointer']}
    table+=f'<tr data-owner="{x["owner"]}"><td>{E(x["key"])}</td><td>'+a(x['specPage'],f"{x['owner']} {x['revision']}")+'</td><td>'+sr+'</td><td>'+E(x['mappingMode'])+'<details><summary>复用／构造合同</summary><pre>'+E(json.dumps(detail,ensure_ascii=False,indent=2))+'</pre>'+a(x['sourceJSON'],'完整来源JSON')+'</details></td><td>'+a(x['reviewEvidence'],'accepted 原画阶段')+'</td></tr>'
write('index.html','<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GeoGuard 总图册 r02草稿</title><style>'+style+'</style><main><h1>GeoGuard 美术总图册 · r02草稿</h1>'
      '<div class="notice">375身体参考条目／48身份已批，29张身体与独立关系板。effects-ui r02 pending；本包未封存、无packet/READY。'
      '<br>每行链接最终组规范页与具体源格；静态原画、明确复用和方向构造不等于已生产连续动画。挂点proposed，透明sprite与实机验证未完成。</div><p>'+
      ' · '.join(a(f,t) for f,t in [('coverage.md','覆盖'),('production-map.json','完整契约'),('queue-audit.md','通信队列'),('stage-summary.md','阶段总结')])+'</p>'+
      '<h2>最终身体规范入口</h2><p>'+' · '.join(a(rel(BASE/o/'submissions'/r/'index.html'),f'{o} {r}') for o,r in versions.items())+'</p>'+
      '<h2>已批身体／关系板</h2><div class="gallery">'+cards+'</div><h2>375条具体来源</h2><label for="q">检索动作</label><input id="q" type="search"><label for="o">组</label><select id="o"><option value="">全部</option>'+''.join(f'<option>{o}</option>' for o in versions)+'</select><p id="count">375 / 375</p><div class="scroll"><table id="actions"><thead><tr><th>动作key</th><th>最终规范入口</th><th>具体概念格</th><th>映射方式</th><th>主审依据</th></tr></thead><tbody>'+table+'</tbody></table></div>'+
      '<h2>效果／玩家UI</h2><p>awaiting_dependency · effects-ui r02未获最终验收。本草稿不展示未审B07或其他待审效果图。</p>'+
      '<script>const q=document.getElementById("q"),o=document.getElementById("o"),rs=[...document.querySelectorAll("#actions tbody tr")];function f(){let n=0;for(const r of rs){const yes=r.cells[0].textContent.toLowerCase().includes(q.value.toLowerCase())&&(!o.value||r.dataset.owner===o.value);r.hidden=!yes;if(yes)n++}document.getElementById("count").textContent=n+" / 375"}q.oninput=f;o.onchange=f;</script></main></html>')
print(json.dumps({'actions':len(rows),'identities':48,'sheets':len(gallery),'mappingModes':mapping_counts,'effects':'awaiting_dependency','sealed':False}))
