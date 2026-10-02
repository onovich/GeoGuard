"""Read approved sealed r01 packets; write integration r01 once, never overwrite."""
from pathlib import Path
import collections
import hashlib
import html
import json
import os
import re

HERE = Path(__file__).resolve().parent
BASE = HERE.parent
OUT = HERE / 'submissions/r01'
if OUT.exists():
    raise SystemExit('r01 already exists; use a new revision for corrections')
OUT.mkdir(parents=True)
OWNERS = ['friendly', 'enemies', 'bosses-mechanics', 'effects-ui']
inputs = {}
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):
    inputs[str(p.relative_to(BASE.parent)).replace('\\', '/')] = sha(p)
    return p.read_text(encoding='utf-8-sig')
def js(p):
    return json.loads(read(p))
def dump(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
def write(name, value):
    (OUT / name).write_text(value, encoding='utf-8')
def link(p):
    return Path(os.path.relpath(p, OUT)).as_posix()
def norm(k):
    if '/' in k:
        return k
    return '/'.join(k.rsplit(':', 1))
lock = js(BASE.parent / 'action-consistency/anatomy-lock.json')
read(BASE.parent / 'art-replacement-plan.md')
read(BASE / 'coordination.md')
registry = js(BASE / 'session-registry.json')
expected = {x['key'] + '/' + a['action']: x for x in lock['items'] for a in x['actions']}
assert len(expected) == 375 and len(lock['items']) == 48
packets, contracts, audit, gallery = {}, {}, [], []
for owner in OWNERS:
    packet_path = BASE / owner / 'submissions/r01/packet.json'
    packet = js(packet_path)
    packets[owner] = packet
    failures = []
    for f in packet['files']:
        p = BASE / owner / f['path']
        if not p.is_file() or sha(p).lower() != f['sha256'].lower():
            failures.append(f['path'])
    assert not failures, (owner, failures)
    review_path = BASE / 'reviews' / f'{owner}-r01.md'
    review = read(review_path)
    assert re.search(r'结果[：:]\s*accepted', review), owner
    ready = js(BASE / owner / 'READY.json')
    current_review = BASE / 'reviews' / f"{owner}-{ready['revision']}.md"
    current_result = 'awaiting_primary_review'
    if current_review.exists():
        current_text = read(current_review)
        m = re.search(r'结果[：:]\s*(accepted|changes_requested|awaiting_dependency)', current_text)
        current_result = m.group(1) if m else 'review_result_unparsed'
    current_packet = BASE / owner / ready['packetPath']
    current_packet_exists = current_packet.is_file()
    if current_packet_exists and current_packet != packet_path:
        js(current_packet)
    session = next((x for x in registry['sessions'] if x['owner'] == owner), {})
    audit.append({'owner': owner, 'ready': ready, 'packetExists': current_packet_exists,
                  'primaryReview': link(current_review) if current_review.exists() else None,
                  'result': current_result, 'r01PacketSHA256Verified': True,
                  'r01FileCount': len(packet['files']), 'r01Review': link(review_path),
                  'registryLastReviewedRevision': session.get('lastReviewedRevision'),
                  'registryLag': session.get('lastReviewedRevision') != 'r01',
                  'finalDependencyStatus': 'awaiting_dependency'})
    for img in packet['images']:
        path = img if isinstance(img, str) else img['path']
        gallery.append({'owner': owner, 'revision': 'r01', 'path': link(BASE / owner / path),
                        'sha256': sha(BASE / owner / path), 'review': link(review_path),
                        'status': 'accepted_sample_design_only',
                        'notCertified': ['transparent_sprite', 'animation', 'runtime_validation']})
    if owner != 'effects-ui':
        contracts[owner] = js(BASE / owner / 'submissions/r01/production-split.json')
rows = []
checks = []
for owner in OWNERS[:3]:
    d = contracts[owner]
    entries = d['items'] if owner == 'friendly' else d['actions']
    keys = []
    for i, item in enumerate(entries):
        key = item['key'] + '/' + item['action'] if owner == 'friendly' else norm(item['key'])
        keys.append(key)
        identity, action = key.rsplit('/', 1)
        rows.append({'key': key, 'identity': identity, 'action': action, 'owner': owner,
                     'sourceRevision': 'r01', 'sourceJSON': link(BASE / owner / 'submissions/r01/production-split.json'),
                     'sourcePointer': f"/{'items' if owner == 'friendly' else 'actions'}/{i}",
                     'decompositionReview': 'accepted', 'reviewEvidence': link(BASE / 'reviews' / f'{owner}-r01.md'),
                     'finalSpecPage': None, 'finalImage': None, 'finalFrame': None,
                     'finalReview': 'awaiting_dependency', 'anchorStatus': 'proposed_not_measured',
                     'sourceContract': item})
    expected_keys = {k for k, x in expected.items() if
                     (owner == 'friendly' and x['group'] in ['tower', 'hero']) or
                     (owner == 'enemies' and x['group'] == 'enemy') or
                     (owner == 'bosses-mechanics' and x['group'] in ['boss', 'mechanic'])}
    counts = collections.Counter(keys)
    checks.append({'owner': owner, 'expected': len(expected_keys), 'actual': len(keys),
                   'missing': sorted(expected_keys - set(keys)), 'unexpected': sorted(set(keys) - expected_keys),
                   'duplicates': [k for k, n in counts.items() if n > 1],
                   'packetMatchesJSON': {norm(k) for k in packets[owner]['coveredActions']} == set(keys)})
assert all(not c['missing'] and not c['unexpected'] and not c['duplicates'] and c['packetMatchesJSON'] for c in checks)
assert len(rows) == 375 and {r['key'] for r in rows} == set(expected)
fx = BASE / 'effects-ui/submissions/r01'
source_map = js(fx / 'boss-source-map.json')
catalog = js(fx / 'runtime-catalog.json')
verification = js(fx / 'verification.json')
read(fx / 'inventory.md')
effect_md = read(fx / 'boss-effects.md')
design_contract = js(fx / 'design-contract.json')
runtime_skills = sorted(k.removeprefix('skill:') for k in packets['effects-ui']['coveredActions'] if k.startswith('skill:'))
assert len(runtime_skills) == 95 and len(set(runtime_skills)) == 95
supported = {a['ability']: a for a in source_map['abilities']}
assert set(runtime_skills) <= set(supported)
skill_rows = []
for skill in runtime_skills:
    mappings = []
    for line in effect_md.splitlines():
        cols = [c.strip() for c in line.strip().strip('|').split('|')]
        if line.startswith('|') and len(cols) >= 5 and cols[2] == skill:
            mappings.append({'identity': cols[0], 'phase': cols[1], 'resources': cols[3], 'evidence': cols[4]})
    assert mappings, skill
    skill_rows.append({'key': 'skill:' + skill, 'owner': 'effects-ui', 'sourceRevision': 'r01',
                       'source': supported[skill], 'runtimeMappings': mappings,
                       'mappingReview': 'accepted', 'reviewEvidence': link(BASE / 'reviews/effects-ui-r01.md'),
                       'finalSpecPage': None, 'finalFrame': None, 'finalReview': 'awaiting_dependency'})
identity_counts = dict(collections.Counter(x['group'] for x in lock['items']))
coverage = {'revision': 'r01', 'status': 'draft_awaiting_dependency', 'date': '2026-10-02',
            'scope': 'art_direction_and_production_split_only', 'expectedActions': 375, 'mappedActions': len(rows),
            'identities': len(lock['items']), 'identityCounts': identity_counts, 'newEliteIdentities': 0,
            'checks': checks, 'missing': sorted(set(expected) - {r['key'] for r in rows}),
            'runtimeUniqueSkills': len(runtime_skills), 'supportedSourceHandlers': len(supported),
            'nonDefaultSupportedSkills': sorted(set(supported) - set(runtime_skills)),
            'acceptedSampleSheets': len(gallery), 'finalActionMappingsAccepted': 0,
            'pendingFinalActionMappings': 375, 'pendingFinalSkillMappings': 95,
            'notes': ['375 reference poses/states/directions/levels are not 375 independent animations.',
                      '48 locked identities; no new elite ID.',
                      'r01 accepted decomposition and selected samples only; final r02 revisions await primary review.',
                      'All numeric attachment/root proposals remain unmeasured design specifications.'],
            'dependencyGate': [{'owner': o, 'status': 'awaiting_dependency',
                                'needs': 'Primary reviewer supplied final accepted revision and concrete page/image/frame mappings'} for o in OWNERS]}
dump('coverage.json', coverage)
dump('production-map.json', {'revision': 'r01', 'status': 'draft_awaiting_dependency',
                            'approvalAuthority': 'reviews/*.md only; work-session declarations are not approvals',
                            'actions': rows, 'identities': lock['items'], 'skills': skill_rows,
                            'effectResourceInventory': {'ids': packets['effects-ui']['coveredIds'],
                                                       'specification': link(fx / 'inventory.md'),
                                                       'sampleDesignContract': design_contract,
                                                       'finalReview': 'awaiting_dependency'},
                            'sampleGallery': gallery})
dump('queue-audit.json', {'revision': 'r01', 'scope': 'four owner READY snapshots before integration publication',
                         'items': audit, 'unreviewedREADY': [x['owner'] for x in audit if x['result'] == 'awaiting_primary_review'],
                         'note': 'integration/r01 itself is newly submitted; review by primary is pending, not silently acknowledged'})
dump('source-snapshot.json', {'files': inputs, 'note': 'sha256 at draft generation; later READY updates require a new integration revision'})
write('coverage.md', '# 跨组覆盖核查 · r01 草稿\n\n2026-10-02；状态：awaiting_dependency。\n\n'
      '|组|解剖锁条目|拆分条目|缺失／额外／重复|清单主审|最终规范|\n|---|---:|---:|---|---|---|\n' +
      ''.join(f"|{c['owner']}|{c['expected']}|{c['actual']}|0／0／0|r01 accepted|awaiting_dependency|\n" for c in checks) +
      '\n合计375条逐key完全对应；48身份（九塔、PLAYER、十四敌人、十七Boss身体、七机关），无新增精英。'
      '375原画参考动作、状态、方向、等级不等于375独立动画。\n\n'
      f"effects-ui：95个实际技能均有来源及资源归属；{len(supported)}个源码支持handler另计，额外支持项：" +
      '、'.join(coverage['nonDefaultSupportedSkills']) + '。清单依据为封存r01，未重新执行源码分析。\n\n'
      f"当前主审实际接受{len(gallery)}张样板设计板；并不代表375条最终body-only／效果图格全部获批。"
      '本包最终具体图页／格保持null，375动作和95技能均等待最终已批revision。\n\n'
      '仅美术原画和生产拆分设计。挂点、root、collisionCenter为proposed，不是已测透明sprite、连续帧动画或实机／性能验证。'
      'r02未封存或未主审内容不作为最终依据，不展示未审图。\n')
write('production-map.md', '# 总生产归属 · r01草稿\n\n'
      '入口：[总图册草稿](index.html)；机器索引：[375条完整契约与95技能](production-map.json)。\n\n'
      '本轮先建立归属，不批准图片。每项保留原JSON pointer与拆分契约；accepted仅用于主审r01拆分／样板。'
      'finalSpecPage／finalImage／finalFrame待主审提供最终已批revision后补齐。旧anatomy-lock中的approved属于上一轮造型与姿态范围。\n\n'
      'HIVE：optimized spawnHive→NEST；summonSwarm fallback→SHARD；NEST触发→BASIC。'
      '召唤体复用enemies身份；独立机关由bosses-mechanics提供，身体部件不增加独立血条。'
      '双子保留两个实体；COURIER退款即时结算，装饰钻不是新增拾取。\n\n'
      '|规范动作key|生产组|拆分来源pointer|最终规范图|\n|---|---|---|---|\n' +
      ''.join(f"|{r['key']}|{r['owner']}|[{r['sourcePointer']}]({r['sourceJSON']})|awaiting_dependency|\n" for r in rows))
write('queue-audit.md', '# 通信队列审计 · r01快照\n\n审计四组READY；不发送会话消息。审批依据为主审reviews，session-registry仅用于识别登记滞后。\n\n'
      '|组|READY|packet存在|主审结果|登记滞后|\n|---|---|---|---|---|\n' +
      ''.join(f"|{a['owner']}|{a['ready']['revision']}|{a['packetExists']}|{a['result']}|{a['registryLag']}|\n" for a in audit) +
      '\n四组r01文件表SHA256均已核对。READY快照与登记、审查证据详见queue-audit.json及source-snapshot.json。'
      '本次新提交integration r01等待主审；队列审计不宣称本次自审通过，后续新READY需重新审计。\n')
write('stage-summary.md', '# 本轮阶段总结 · r01草稿\n\n已完成375参考条目逐key归属核查、48身份核查、95技能来源索引、已批样板入口和READY审计。'
      '四组第一包均主审accepted；剩余全套新规范正在制作，未到最终交付出口。\n\n'
      '等待主审指定四组最终accepted revision及每动作／技能的具体规范页与图格，再以新revision冻结最终总图册。'
      '本包提交后停止等待明确指令，不改旧revision，不主动消息其他会话。\n\n'
      '阶段范围仅原画与生产拆分设计：不承诺透明资源、可编辑生产源稿、连续动画、精确导出挂点或实机验证；未改代码、未接入、未提交或部署。\n')
esc = html.escape
def anchor(path, text):
    return f'<a href="{esc(path, quote=True)}">{esc(text)}</a>'
cards = ''.join('<figure>' + anchor(g['path'], f"{g['owner']} · {Path(g['path']).name}") +
                f'<img loading="lazy" src="{esc(g["path"], quote=True)}" alt="{esc(g["owner"])} r01已批样板">' +
                '<figcaption>r01 accepted 样板设计；' + anchor(g['review'], '主审证据') + '</figcaption></figure>' for g in gallery)
table = ''.join(f'<tr data-owner="{r["owner"]}"><td>{esc(r["key"])}</td><td>{r["owner"]}</td><td>' +
                anchor(r['sourceJSON'], r['sourcePointer']) + '</td><td>awaiting_dependency</td></tr>' for r in rows)
skill_table = ''.join('<tr><td>' + esc(s['key']) + '</td><td>' + esc('; '.join(m['resources'] for m in s['runtimeMappings'])) +
                      '</td><td>awaiting_dependency</td></tr>' for s in skill_rows)
write('index.html', '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
      '<title>GeoGuard 美术总图册 · r01草稿</title><style>body{margin:0;background:#fff9eb;color:#43382e;font:16px/1.7 system-ui,sans-serif}'
      'main{max-width:1180px;margin:auto;padding:32px}a{color:#326655}h1,h2{line-height:1.3}.notice{padding:20px;border:2px solid #ac7751;border-radius:12px}'
      '.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:20px}figure{margin:0;padding:12px;background:white;border:1px solid #ddcfbb;border-radius:12px}'
      'img{display:block;width:100%;height:auto;margin-top:12px}table{border-collapse:collapse;width:100%;background:white}th,td{padding:10px;border:1px solid #ded3c1;text-align:left;vertical-align:top}'
      '.scroll{overflow:auto}input,select{font:inherit;padding:8px;margin:8px 8px 16px 0}small{color:#675c4f}</style><main>'
      '<h1>GeoGuard 美术总图册</h1><p>2026-10-02 · integration/r01 · 草稿 awaiting_dependency</p>'
      '<div class="notice">375条归属清单已核对，48身份无新增精英。375参考动作不等于375独立动画。'
      '<br>当前展示仅主审接受的r01样板设计板；全套最终规范页入口等待主审指定已批revision。'
      '<br>本轮为原画与生产拆分设计。挂点proposed；透明sprite、动画与实机验证尚未完成。</div>'
      '<p>' + ' · '.join(anchor(f, t) for f,t in [('coverage.md','覆盖核查'),('production-map.json','完整生产索引JSON'),('production-map.md','生产映射'),('queue-audit.md','READY审计'),('stage-summary.md','阶段总结')]) + '</p>'
      '<h2>已批样板 · 非全套最终交付</h2><div class="gallery">' + cards + '</div>'
      '<h2>375条参考动作索引</h2><label for="q">检索身份／动作</label> <input id="q" type="search" placeholder="BASIC / WINDUP">'
      '<label for="owner">生产组</label> <select id="owner"><option value="">全部</option>' +
      ''.join(f'<option>{o}</option>' for o in OWNERS[:3]) + '</select><p id="count">375 / 375</p>'
      '<div class="scroll"><table id="actions"><thead><tr><th>动作key</th><th>归属</th><th>封存JSON pointer</th><th>最终规范页／图格</th></tr></thead><tbody>' + table + '</tbody></table></div>'
      '<h2>95个实际技能 · 独立资源映射草稿</h2><p>100个源码支持handler另计。各项最终效果板／格均等待依赖。</p>'
      '<div class="scroll"><table><thead><tr><th>技能</th><th>r01资源归属</th><th>最终图格</th></tr></thead><tbody>' + skill_table + '</tbody></table></div>'
      '<script>const q=document.getElementById("q"),o=document.getElementById("owner"),rs=[...document.querySelectorAll("#actions tbody tr")];'
      'function filter(){let n=0;for(const r of rs){const show=r.cells[0].textContent.toLowerCase().includes(q.value.toLowerCase())&&(!o.value||r.dataset.owner===o.value);r.hidden=!show;if(show)n++}document.getElementById("count").textContent=n+" / 375"}q.addEventListener("input",filter);o.addEventListener("change",filter);</script></main></html>')
files = [{'path': str(p.relative_to(HERE)).replace('\\', '/'), 'sha256': sha(p), 'bytes': p.stat().st_size}
         for p in sorted(OUT.iterdir()) if p.is_file()]
dump('packet.json', {'owner': 'integration', 'revision': 'r01', 'status': 'submitted',
                     'scope': 'Draft atlas, exact 375-action decomposition coverage, 95 runtime skill mappings, READY audit; art only',
                     'files': files, 'images': [], 'coveredIds': [x['key'] for x in lock['items']],
                     'coveredActions': [r['key'] for r in rows],
                     'openIssues': ['Final normative page/image/frame mappings await primary-approved revisions.',
                                    'r01 sample acceptance does not certify all action drawings or runtime assets.',
                                    'Registry lag recorded; review files remain sole approval authority.'],
                     'dependencies': coverage['dependencyGate'],
                     'summary': '375/375 decomposition keys; 48 identities; 95 actual skills; selected accepted r01 samples only. Final delivery awaiting_dependency.'})
ready_temp = HERE / 'READY.tmp.json'
ready_temp.write_text(json.dumps({'revision': 'r01', 'packetPath': 'submissions/r01/packet.json'}, indent=2) + '\n', encoding='utf-8')
ready_temp.replace(HERE / 'READY.json')
print(json.dumps({'output': str(OUT), 'actions': len(rows), 'identities': len(lock['items']), 'skills': len(skill_rows), 'sampleSheets': len(gallery), 'checks': checks}, ensure_ascii=True))
